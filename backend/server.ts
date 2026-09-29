/**
 * server.ts — DentiFlow Production Authentication & API Server
 *
 * Provides complete, secure, role-based authentication and authorization:
 * - Patient, Doctor, and Admin login with server-side credential verification.
 * - HTTP-only session cookies and authorization token support.
 * - PBKDF2-SHA256 password hashing (210,000 iterations + 16-byte random salt).
 * - Stable environment secrets (FLASK_SECRET_KEY, SESSION_SECRET, PASSWORD_RESET_SECRET).
 * - Secure forgot-password with 30-minute UTC expiration and Resend/SMTP email delivery.
 * - Single-use token invalidation and zero token exposure in API responses.
 * - Backend role-based access control (RBAC) middleware for protected endpoints.
 */

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Resend } from 'resend';
import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

import patientsRouter from './src/server/routes/patientsRouter.ts';
import appointmentsRouter from './src/server/routes/appointmentsRouter.ts';
import billingRouter from './src/server/routes/billingRouter.ts';
import growthRouter from './src/server/routes/growthRouter.ts';
import feedbackRouter from './src/server/routes/feedbackRouter.ts';
import filesRouter from './src/server/routes/filesRouter.ts';
import aiRouter from './src/server/routes/aiRouter.ts';
import notificationsRouter from './src/server/routes/notificationsRouter.ts';
import settingsRouter from './src/server/routes/settingsRouter.ts';

dotenv.config();

export const app = express();
app.use(express.json());

// ─── Environment-Aware CORS Middleware ─────────────────────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://oralix.online',
    'https://www.oralix.online',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://localhost:5173',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : []),
    ...(process.env.APP_URL ? [process.env.APP_URL.replace(/\/$/, '')] : []),
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-token, Accept');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

// ─── Rate Limiter Helper (Protects Sensitive Endpoints) ────────────────────────
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();

function rateLimit(windowMs: number, maxRequests: number, message: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Determine client identifier: IP + route path
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const bucket = rateLimitMap.get(key);

    if (!bucket || now > bucket.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count++;
    if (bucket.count > maxRequests) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec.toString());
      res.status(429).json({
        error: message,
        retryAfterSeconds: retryAfterSec,
      });
      return;
    }

    next();
  };
}

// ─── Email Masking Helper for Safe Logging ────────────────────────────────────
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
}

// ─── Base URL Resolution Helper ───────────────────────────────────────────────
export function getAppBaseUrl(req?: Request): string {
  // If request originated from an active browser session, respect the caller's origin/host
  if (req) {
    const origin = (req.headers.origin || '') as string;
    const referer = (req.headers.referer || '') as string;
    const host = (req.headers.host || '') as string;
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const requestHost = origin || referer || (host ? `${isHttps ? 'https' : 'http'}://${host}` : '');
    if (requestHost) {
      const match = requestHost.match(/https?:\/\/[a-zA-Z0-9.-]+(:[0-9]+)?/);
      if (match && match[0]) {
        return match[0].replace(/\/$/, '');
      }
    }
  }

  const custom = process.env.FRONTEND_URL || process.env.APP_URL;
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://oralix.online';
  }
  return 'http://localhost:3000';
}

// ─── Stable Secrets ───────────────────────────────────────────────────────────
const STABLE_SECRET_KEY =
  process.env.FLASK_SECRET_KEY ||
  process.env.SESSION_SECRET ||
  process.env.AUTH_SECRET ||
  'oralix_stable_production_secret_key_v1';

const RESET_SECRET_KEY =
  process.env.PASSWORD_RESET_SECRET ||
  STABLE_SECRET_KEY;

// ─── Cookie Parser Helper ─────────────────────────────────────────────────────
function parseCookies(req: Request): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      try {
        list[key] = decodeURIComponent(val);
      } catch {
        list[key] = val;
      }
    }
  });
  return list;
}

// ─── Password-Hash Store (PBKDF2-SHA256) ───────────────────────────────────────
const PW_STORE_PATH = path.resolve('.dentiflow_pw_store.json');

export interface PwRecord {
  userId: string;
  salt: string;   // 16-byte hex
  hash: string;   // 32-byte hex
  iterations: number;
}

export function loadPwStore(): PwRecord[] {
  try {
    if (!existsSync(PW_STORE_PATH)) return [];
    return JSON.parse(readFileSync(PW_STORE_PATH, 'utf8')) as PwRecord[];
  } catch {
    return [];
  }
}

export function savePwStore(records: PwRecord[]): void {
  try {
    writeFileSync(PW_STORE_PATH, JSON.stringify(records, null, 2), 'utf8');
  } catch (err) {
    console.error('[Dentiflow] Failed saving password store:', err);
  }
}

export async function pbkdf2Hash(
  password: string,
  saltHex?: string,
  iterations = 210_000
): Promise<{ salt: string; hash: string; iterations: number }> {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, 32, 'sha256', (err, derivedKey) => {
      if (err) return reject(err);
      resolve({
        salt: salt.toString('hex'),
        hash: derivedKey.toString('hex'),
        iterations,
      });
    });
  });
}

export async function verifyPasswordHash(password: string, record: PwRecord): Promise<boolean> {
  try {
    const { hash } = await pbkdf2Hash(password, record.salt, record.iterations);
    const bufA = Buffer.from(hash, 'hex');
    const bufB = Buffer.from(record.hash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// ─── User Store & Registry ────────────────────────────────────────────────────
export type UserRole = 'doctor' | 'patient' | 'admin' | 'receptionist';

export interface ServerUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarText: string;
  phone?: string;
  doctorId?: string;
  patientId?: string;
  specialization?: string;
  status: 'active' | 'inactive' | 'on_leave';
  joinedDate?: string;
}

const USER_STORE_PATH = path.resolve('.dentiflow_user_store.json');

const DEFAULT_USERS: ServerUser[] = [
  {
    id: 'u-doctor',
    name: 'Dr. Ananya Sharma',
    email: 'doctor@gmail.com',
    role: 'doctor',
    avatarText: 'AS',
    phone: '+91 98450 11223',
    doctorId: 'DOC-4482',
    specialization: 'Endodontics & Restorative',
    status: 'active',
    joinedDate: '2024-01-15',
  },
  {
    id: 'u-receptionist',
    name: 'Front Desk Receptionist',
    email: 'receptionist@gmail.com',
    role: 'receptionist',
    avatarText: 'FD',
    phone: '+91 98450 33445',
    status: 'active',
    joinedDate: '2024-02-01',
  },
  {
    id: 'u-patient',
    name: 'Aravind Kumar',
    email: 'patient@gmail.com',
    role: 'patient',
    avatarText: 'AK',
    phone: '+91 98765 43210',
    patientId: 'p-1',
    status: 'active',
    joinedDate: '2024-03-10',
  },
  {
    id: 'u-admin',
    name: 'Clinic Administrator',
    email: 'admin@gmail.com',
    role: 'admin',
    avatarText: 'AD',
    phone: '+91 99000 88776',
    status: 'active',
    joinedDate: '2023-11-01',
  },
  {
    id: 'u-srakshitha',
    name: 'Rakshitha Semala',
    email: 'srakshitha912@gmail.com',
    role: 'patient',
    avatarText: 'RS',
    phone: '+91 98450 99887',
    patientId: 'p-2',
    status: 'active',
    joinedDate: '2024-04-01',
  },
  {
    id: 'u-rakshitha-semala',
    name: 'Rakshitha Semala',
    email: 'rakshithasemala@gmail.com',
    role: 'patient',
    avatarText: 'RS',
    phone: '+91 86399 75744',
    patientId: 'p-3',
    status: 'active',
    joinedDate: '2024-04-01',
  },
];

const DEFAULT_PASSWORDS: Record<string, string> = {
  'u-doctor': 'doctor123',
  'u-receptionist': 'receptionist123',
  'u-patient': 'patient123',
  'u-admin': 'admin123',
  'u-srakshitha': 'patient123',
  'u-rakshitha-semala': 'patient123',
};

export function loadUserStore(): ServerUser[] {
  try {
    if (!existsSync(USER_STORE_PATH)) {
      writeFileSync(USER_STORE_PATH, JSON.stringify(DEFAULT_USERS, null, 2), 'utf8');
      return DEFAULT_USERS;
    }
    const users = JSON.parse(readFileSync(USER_STORE_PATH, 'utf8')) as ServerUser[];
    if (!users.some(u => u.id === 'u-receptionist')) {
      const recUser = DEFAULT_USERS.find(u => u.id === 'u-receptionist');
      if (recUser) {
        users.push(recUser);
        saveUserStore(users);
      }
    }
    return users;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUserStore(users: ServerUser[]): void {
  try {
    writeFileSync(USER_STORE_PATH, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('[Dentiflow] Failed saving user store:', err);
  }
}

export async function bootstrapDefaultPasswords(): Promise<void> {
  const pwStore = loadPwStore();
  let updated = false;

  for (const [userId, plainPass] of Object.entries(DEFAULT_PASSWORDS)) {
    if (!pwStore.some(r => r.userId === userId)) {
      const record = await pbkdf2Hash(plainPass);
      pwStore.push({
        userId,
        salt: record.salt,
        hash: record.hash,
        iterations: record.iterations,
      });
      updated = true;
    }
  }

  if (updated) {
    savePwStore(pwStore);
  }
}

// ─── Session Store ────────────────────────────────────────────────────────────
export interface SessionRecord {
  token: string;
  userId: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}

const SESSION_STORE_PATH = path.resolve('.dentiflow_session_store.json');

const SESSION_DURATIONS: Record<UserRole, number> = {
  doctor: 8 * 60 * 60 * 1000,
  admin: 8 * 60 * 60 * 1000,
  receptionist: 12 * 60 * 60 * 1000,
  patient: 24 * 60 * 60 * 1000,
};

export function loadSessionStore(): Map<string, SessionRecord> {
  try {
    if (!existsSync(SESSION_STORE_PATH)) return new Map();
    const raw = readFileSync(SESSION_STORE_PATH, 'utf8');
    const entries = JSON.parse(raw) as [string, SessionRecord][];
    const map = new Map<string, SessionRecord>(entries);
    const now = Date.now();
    for (const [token, session] of map) {
      if (now > session.expiresAt) map.delete(token);
    }
    return map;
  } catch {
    return new Map();
  }
}

export function saveSessionStore(map: Map<string, SessionRecord>): void {
  try {
    const entries = Array.from(map.entries());
    writeFileSync(SESSION_STORE_PATH, JSON.stringify(entries, null, 2), 'utf8');
  } catch (err) {
    console.error('[Dentiflow] Failed saving session store:', err);
  }
}

export function createServerSession(user: ServerUser): SessionRecord {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const session: SessionRecord = {
    token,
    userId: user.id,
    role: user.role,
    createdAt: now,
    expiresAt: now + (SESSION_DURATIONS[user.role] || 8 * 60 * 60 * 1000),
  };

  const sessions = loadSessionStore();
  sessions.set(token, session);
  saveSessionStore(sessions);
  return session;
}

export function invalidateServerSession(token: string): void {
  const sessions = loadSessionStore();
  sessions.delete(token);
  saveSessionStore(sessions);
}

export function invalidateUserSessions(userId: string): void {
  const sessions = loadSessionStore();
  for (const [token, session] of sessions) {
    if (session.userId === userId) sessions.delete(token);
  }
  saveSessionStore(sessions);
}

// ─── Reset Token Store ────────────────────────────────────────────────────────
const RESET_STORE_PATH = path.resolve('.dentiflow_reset_store.json');

export interface ResetEntry {
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: number;
  used: boolean;
  createdAt: number;
}

export function sha256Token(token: string): string {
  return crypto.createHmac('sha256', RESET_SECRET_KEY).update(token.trim()).digest('hex');
}

export function loadResetStore(): Map<string, ResetEntry> {
  try {
    if (!existsSync(RESET_STORE_PATH)) return new Map();
    const raw = readFileSync(RESET_STORE_PATH, 'utf8');
    const entries = JSON.parse(raw) as [string, ResetEntry][];
    const map = new Map<string, ResetEntry>(entries);
    const now = Date.now();
    for (const [hash, entry] of map) {
      if (now > entry.expiresAt || entry.used) map.delete(hash);
    }
    return map;
  } catch {
    return new Map();
  }
}

export function saveResetStore(map: Map<string, ResetEntry>): void {
  try {
    const entries = Array.from(map.entries());
    writeFileSync(RESET_STORE_PATH, JSON.stringify(entries, null, 2), 'utf8');
  } catch (err) {
    console.error('[Dentiflow] Failed saving reset store:', err);
  }
}

// ─── Email Dispatch (Resend SDK + SMTP Fallback) ──────────────────────────────
function buildSmtpTransporter(): Transporter | null {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

async function sendResetEmail(toEmail: string, plainToken: string, req?: Request): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.MAIL_FROM || process.env.EMAIL_FROM || 'Oralix <noreply@oralix.online>';
  const appUrl = getAppBaseUrl(req);
  const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(plainToken)}`;

  const subject = 'Reset your Oralix password';
  const text = `Hello,

We received a request to reset your Oralix account password.

Click the link below to create a new password:
${resetLink}

This link will expire in 30 minutes and can only be used once.

If you did not request this password reset, you can safely ignore this email.

Regards,
Oralix Clinical Team
https://oralix.online`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your Oralix password</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EF;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EF;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #E5DDD0;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04);">
          <tr>
            <td style="background:#252525;padding:26px 32px;text-align:center;">
              <p style="margin:0;color:#C8B58D;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Oralix</p>
              <p style="margin:6px 0 0;color:#FFFFFF;font-size:18px;font-weight:800;letter-spacing:-0.2px;">Password Reset Request</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;color:#252525;">
              <p style="margin:0 0 16px;font-size:14px;color:#4A4845;line-height:1.5;">Hello,</p>
              <p style="margin:0 0 16px;font-size:14px;color:#4A4845;line-height:1.5;">We received a request to reset your Oralix account password.</p>
              <p style="margin:0 0 24px;font-size:14px;color:#4A4845;line-height:1.5;">Click the button below to set a new password:</p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetLink}" style="display:inline-block;background:#252525;color:#C8B58D;font-size:13px;font-weight:700;text-decoration:none;padding:14px 34px;border-radius:10px;letter-spacing:0.5px;box-shadow:0 2px 6px rgba(0,0,0,0.12);">Reset Password</a>
              </div>
              <p style="margin:24px 0 8px;font-size:12px;color:#78716C;line-height:1.5;">If the button above does not work, copy and paste this link into your browser:</p>
              <p style="margin:0 0 24px;font-size:12px;word-break:break-all;"><a href="${resetLink}" style="color:#594723;text-decoration:underline;">${resetLink}</a></p>
              <p style="margin:0 0 16px;font-size:13px;color:#6F6D69;line-height:1.5;">This link will expire in <strong>30 minutes</strong> and can only be used once.</p>
              <p style="margin:0 0 24px;font-size:13px;color:#6F6D69;line-height:1.5;">If you did not request a password reset, you can safely ignore this email.</p>
              <p style="margin:0;font-size:14px;color:#4A4845;line-height:1.5;">Regards,<br /><strong>Oralix Clinical Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background:#F7F5F1;padding:18px 32px;text-align:center;border-top:1px solid #EDE8DE;">
              <p style="margin:0;font-size:11px;color:#999690;line-height:1.5;">
                Oralix · Advanced Dental Medicine &amp; Technology<br />
                Official Communications · <a href="https://oralix.online" style="color:#C8B58D;text-decoration:none;">oralix.online</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Safe server-side audit logging without exposing tokens or secrets
  console.info(`[Oralix] Password reset email queued for recipient: ${maskEmail(toEmail)}`);

  let delivered = false;

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: emailFrom,
        to: [toEmail],
        subject,
        text,
        html,
      });

      if (error) {
        console.warn(`[Oralix] Resend delivery notice for ${maskEmail(toEmail)}: ${error.message || JSON.stringify(error)}`);
      } else {
        console.info(`[Oralix] Password reset email delivered to ${maskEmail(toEmail)} via Resend (ID: ${data?.id})`);
        delivered = true;
      }
    } catch (err: any) {
      console.warn(`[Oralix] Resend SDK error for ${maskEmail(toEmail)}:`, err?.message || err);
    }
  }

  if (!delivered) {
    const smtp = buildSmtpTransporter();
    if (smtp) {
      try {
        await smtp.sendMail({
          from: emailFrom,
          to: toEmail,
          subject,
          text,
          html,
        });
        console.info(`[Oralix] Password reset email delivered to ${maskEmail(toEmail)} via SMTP`);
        delivered = true;
      } catch (err: any) {
        console.warn(`[Oralix] SMTP delivery notice for ${maskEmail(toEmail)}:`, err?.message || err);
      }
    }
  }

  return delivered;
}

export interface ReceiptEmailData {
  invoiceNumber: string;
  patientName: string;
  patientEmail: string;
  date: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  consultationFee?: number;
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  paymentMethod: string;
  paymentStatus: string;
}

export async function sendReceiptEmail(data: ReceiptEmailData): Promise<{ delivered: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.MAIL_FROM || process.env.EMAIL_FROM || 'Oralix <noreply@oralix.online>';
  const toEmail = data.patientEmail ? data.patientEmail.trim() : '';

  if (!toEmail) {
    return { delivered: false, error: 'Patient email address is missing or invalid.' };
  }

  const subject = `Your Oralix Payment Receipt - ${data.invoiceNumber}`;

  // Build items rows for HTML table
  const itemsHtml = data.items.map((item) => `
    <tr style="border-bottom: 1px solid #EDE8DE;">
      <td style="padding: 10px 8px; font-size: 13px; color: #252525;">${item.description}</td>
      <td style="padding: 10px 8px; font-size: 13px; color: #6F6D69; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 10px 8px; font-size: 13px; color: #6F6D69; text-align: right;">INR ${(item.unitPrice || item.total).toLocaleString('en-IN')}</td>
      <td style="padding: 10px 8px; font-size: 13px; color: #252525; font-weight: 700; text-align: right;">INR ${(item.total).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const consultationHtml = (data.consultationFee && data.consultationFee > 0) ? `
    <tr style="border-bottom: 1px solid #EDE8DE;">
      <td style="padding: 10px 8px; font-size: 13px; color: #252525;">Clinical Consultation Charge</td>
      <td style="padding: 10px 8px; font-size: 13px; color: #6F6D69; text-align: center;">1</td>
      <td style="padding: 10px 8px; font-size: 13px; color: #6F6D69; text-align: right;">INR ${data.consultationFee.toLocaleString('en-IN')}</td>
      <td style="padding: 10px 8px; font-size: 13px; color: #252525; font-weight: 700; text-align: right;">INR ${data.consultationFee.toLocaleString('en-IN')}</td>
    </tr>
  ` : '';

  const itemsText = data.items.map((item) => 
    `- ${item.description} (Qty: ${item.quantity || 1}, Rate: INR ${(item.unitPrice || item.total).toLocaleString('en-IN')}) = INR ${item.total.toLocaleString('en-IN')}`
  ).join('\n');

  const text = `ORALIX - Dental Clinic Management
OFFICIAL PAYMENT RECEIPT

Invoice Number: ${data.invoiceNumber}
Date: ${data.date}
Patient Name: ${data.patientName}

---------------------------------------
TREATMENT / SERVICE CHARGES
---------------------------------------
${itemsText}
${data.consultationFee && data.consultationFee > 0 ? `- Consultation Charge: INR ${data.consultationFee.toLocaleString('en-IN')}\n` : ''}
Subtotal: INR ${data.subtotal.toLocaleString('en-IN')}
Discount: INR ${data.discount.toLocaleString('en-IN')}
Total Amount Paid: INR ${data.amountPaid.toLocaleString('en-IN')}

Payment Method: ${data.paymentMethod}
Payment Status: ${data.paymentStatus.toUpperCase()}

Thank you for choosing Oralix Dental Clinic.
If you have any questions regarding your receipt, contact us at care@oralix.online.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Oralix Payment Receipt</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EF;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EF;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;background:#ffffff;border-radius:16px;border:1px solid #E5DDD0;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04);">
          <tr>
            <td style="background:#252525;padding:28px 32px;text-align:left;">
              <table width="100%">
                <tr>
                  <td>
                    <p style="margin:0;color:#C8B58D;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">ORALIX</p>
                    <p style="margin:4px 0 0;color:#FFFFFF;font-size:20px;font-weight:800;letter-spacing:-0.3px;">Dental Clinic Management</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:6px 12px;background:#3B4D3A;color:#8FA88D;border-radius:8px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;border:1px solid #8FA88D;">
                      ✓ Payment ${data.paymentStatus}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px;color:#252525;">
              <table width="100%" style="margin-bottom:20px;border-bottom:1px solid #EDE8DE;padding-bottom:16px;">
                <tr>
                  <td style="vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6F6D69;text-transform:uppercase;font-weight:700;">Billed To Patient</p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:800;color:#252525;">${data.patientName}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#6F6D69;">${toEmail}</p>
                  </td>
                  <td style="vertical-align:top;text-align:right;">
                    <p style="margin:0;font-size:11px;color:#6F6D69;text-transform:uppercase;font-weight:700;">Receipt &amp; Invoice</p>
                    <p style="margin:4px 0 0;font-size:14px;font-weight:800;color:#252525;font-family:monospace;">${data.invoiceNumber}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#6F6D69;">Date: ${data.date}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-collapse:collapse;">
                <thead>
                  <tr style="background:#F7F5F1;border-bottom:2px solid #C8B58D;">
                    <th style="padding:10px 8px;text-align:left;font-size:11px;color:#252525;font-weight:800;text-transform:uppercase;">Treatment / Service</th>
                    <th style="padding:10px 8px;text-align:center;font-size:11px;color:#252525;font-weight:800;text-transform:uppercase;">Qty</th>
                    <th style="padding:10px 8px;text-align:right;font-size:11px;color:#252525;font-weight:800;text-transform:uppercase;">Rate</th>
                    <th style="padding:10px 8px;text-align:right;font-size:11px;color:#252525;font-weight:800;text-transform:uppercase;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  ${consultationHtml}
                </tbody>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="55%"></td>
                  <td width="45%">
                    <table width="100%" style="font-size:13px;">
                      <tr>
                        <td style="padding:4px 0;color:#6F6D69;">Subtotal:</td>
                        <td style="padding:4px 0;text-align:right;font-weight:700;color:#252525;">INR ${data.subtotal.toLocaleString('en-IN')}</td>
                      </tr>
                      ${data.discount > 0 ? `
                      <tr>
                        <td style="padding:4px 0;color:#3B4D3A;">Discount Applied:</td>
                        <td style="padding:4px 0;text-align:right;font-weight:700;color:#3B4D3A;">- INR ${data.discount.toLocaleString('en-IN')}</td>
                      </tr>` : ''}
                      <tr style="border-top:2px solid #252525;">
                        <td style="padding:8px 0;font-size:15px;font-weight:800;color:#252525;">Total Amount Paid:</td>
                        <td style="padding:8px 0;text-align:right;font-size:16px;font-weight:900;color:#252525;">INR ${data.amountPaid.toLocaleString('en-IN')}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="background:#F7F5F1;border:1px solid #EDE8DE;border-radius:12px;padding:14px 18px;margin-bottom:20px;">
                <table width="100%" style="font-size:12px;">
                  <tr>
                    <td><strong style="color:#6F6D69;">Payment Method:</strong> <span style="color:#252525;font-weight:700;">${data.paymentMethod}</span></td>
                    <td align="right"><strong style="color:#6F6D69;">Payment Status:</strong> <span style="color:#3B4D3A;font-weight:800;text-transform:uppercase;">${data.paymentStatus}</span></td>
                  </tr>
                </table>
              </div>

              <p style="margin:0;font-size:12px;color:#6F6D69;line-height:1.5;">
                This is a digitally generated tax receipt valid for insurance reimbursement and Section 80D medical deductions.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#F7F5F1;padding:18px 32px;text-align:center;border-top:1px solid #EDE8DE;">
              <p style="margin:0;font-size:11px;color:#999690;line-height:1.5;">
                ORALIX · Dental Clinic Management<br />
                Official Communications · <a href="https://oralix.online" style="color:#C8B58D;text-decoration:none;">oralix.online</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  console.info(`[Oralix] Billing receipt email queued for: ${maskEmail(toEmail)} (${data.invoiceNumber})`);

  let delivered = false;
  let lastError = '';

  if (resendApiKey && !resendApiKey.includes('YOUR_')) {
    try {
      const resend = new Resend(resendApiKey);
      const { data: resData, error: resError } = await resend.emails.send({
        from: emailFrom,
        to: [toEmail],
        subject,
        text,
        html,
      });

      if (resError) {
        lastError = resError.message || JSON.stringify(resError);
        console.warn(`[Oralix] Resend receipt delivery notice for ${maskEmail(toEmail)}: ${lastError}`);
      } else {
        console.info(`[Oralix] Payment receipt email delivered to ${maskEmail(toEmail)} via Resend (ID: ${resData?.id})`);
        delivered = true;
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`[Oralix] Resend SDK error for receipt ${maskEmail(toEmail)}:`, lastError);
    }
  }

  if (!delivered) {
    const smtp = buildSmtpTransporter();
    if (smtp) {
      try {
        await smtp.sendMail({
          from: emailFrom,
          to: toEmail,
          subject,
          text,
          html,
        });
        console.info(`[Oralix] Payment receipt email delivered to ${maskEmail(toEmail)} via SMTP`);
        delivered = true;
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`[Oralix] SMTP delivery notice for receipt ${maskEmail(toEmail)}:`, lastError);
      }
    }
  }

  return { delivered, error: delivered ? undefined : (lastError || 'No email transport succeeded.') };
}

// ─── Authentication Middleware ────────────────────────────────────────────────
export interface AuthenticatedRequest extends Request {
  user?: ServerUser;
  session?: SessionRecord;
}

function extractToken(req: Request): string | null {
  const cookies = parseCookies(req);
  if (cookies.oralix_session) return cookies.oralix_session;
  if (cookies.dentiflow_session) return cookies.dentiflow_session;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  const customHeader = req.headers['x-session-token'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }

  return null;
}

export function authenticateSession(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const sessions = loadSessionStore();
  const session = sessions.get(token);

  if (!session || Date.now() > session.expiresAt) {
    if (session) invalidateServerSession(token);
    res.status(401).json({ error: 'Session has expired. Please sign in again.' });
    return;
  }

  const users = loadUserStore();
  const user = users.find(u => u.id === session.userId);

  if (!user || user.status === 'inactive') {
    invalidateServerSession(token);
    res.status(401).json({ error: 'User account is inactive or not found.' });
    return;
  }

  if (user.role !== session.role) {
    invalidateServerSession(token);
    res.status(403).json({ error: 'Security violation: role mismatch detected.' });
    return;
  }

  req.user = user;
  req.session = session;
  next();
}

export function optionalAuthenticateSession(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    return next();
  }
  const sessions = loadSessionStore();
  const session = sessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    return next();
  }
  const users = loadUserStore();
  const user = users.find(u => u.id === session.userId);
  if (user && user.status !== 'inactive' && user.role === session.role) {
    req.user = user;
    req.session = session;
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'You are not authorized to access this area.',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
}

// ─── Set-Cookie Helper ────────────────────────────────────────────────────────
function setSessionCookie(res: Response, token: string, maxAgeMs: number): void {
  const isProd = process.env.NODE_ENV === 'production' || getAppBaseUrl().startsWith('https');
  const maxAgeSec = Math.floor(maxAgeMs / 1000);
  const securePart = isProd ? '; Secure' : '';
  const oralixCookie = `oralix_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${securePart}`;
  const dentiflowCookie = `dentiflow_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${securePart}`;

  res.setHeader('Set-Cookie', [oralixCookie, dentiflowCookie]);
}

function clearSessionCookie(res: Response): void {
  res.setHeader('Set-Cookie', [
    'oralix_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    'dentiflow_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  ]);
}

// ─── Auth API Routes ──────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { identifier: string, password: string, role?: string }
 */
/**
 * POST /api/auth/login
 * Body: { identifier: string, password: string, role?: string }
 */
app.post(
  '/api/auth/login',
  rateLimit(60 * 1000, 15, 'Too many login attempts. Please wait 1 minute before trying again.'),
  async (req: Request, res: Response) => {
    const { identifier, password } = req.body as { identifier?: string; password?: string; role?: string };

    if (!identifier || !password || typeof identifier !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Invalid credentials.' });
      return;
    }

    // Ensure default password hashes are primed
    await bootstrapDefaultPasswords();

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanId = cleanIdentifier.replace(/[\s\-\+\(\)]/g, '');

    const users = loadUserStore();

    const user = users.find(u => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uId = (u.id || '').toLowerCase().trim();
      const uName = (u.name || '').toLowerCase().trim();
      const uPhone = (u.phone || '').replace(/[\s\-\+\(\)]/g, '');
      const uDoctorId = (u.doctorId || '').toLowerCase().trim();
      const uPatientId = (u.patientId || '').toLowerCase().trim();

      return (
        uEmail === cleanIdentifier ||
        uId === cleanIdentifier ||
        uName === cleanIdentifier ||
        (cleanId && uPhone && (uPhone === cleanId || uPhone.endsWith(cleanId) || cleanId.endsWith(uPhone))) ||
        (uDoctorId && (uDoctorId === cleanIdentifier || cleanIdentifier === 'doc-4482' || cleanIdentifier === '4482')) ||
        (uPatientId && (uPatientId === cleanIdentifier || cleanIdentifier === 'df-2026-001' || cleanIdentifier === 'p-1' || cleanIdentifier === 'p-2' || cleanIdentifier === 'p-3')) ||
        (u.role === 'admin' && (cleanIdentifier === 'admin-9042' || cleanIdentifier === '9042' || cleanIdentifier === 'u-admin'))
      );
    });

    if (!user) {
      console.warn(`[Oralix] Login rejected: No user matching identifier "${cleanIdentifier}"`);
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    if (user.status === 'inactive') {
      res.status(403).json({ error: 'Your account is inactive. Please contact the clinic administrator.' });
      return;
    }

    const pwStore = loadPwStore();
    let pwRecord = pwStore.find(r => r.userId === user.id);

    // Fallback: check if another record shares the same email
    if (!pwRecord && user.email) {
      const sameEmailUser = users.find(u => u.email.toLowerCase() === user.email.toLowerCase() && u.id !== user.id);
      if (sameEmailUser) {
        pwRecord = pwStore.find(r => r.userId === sameEmailUser.id);
      }
    }

    if (!pwRecord) {
      console.warn(`[Oralix] Login rejected: No password record found for userId="${user.id}" (${user.email})`);
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const isValid = await verifyPasswordHash(password, pwRecord);
    if (!isValid) {
      console.warn(`[Oralix] Login rejected: Password verification failed for userId="${user.id}" (${user.email})`);
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    console.info(`[Oralix] Login SUCCESS for userId="${user.id}" (${user.email}, role=${user.role})`);

    const session = createServerSession(user);
    setSessionCookie(res, session.token, session.expiresAt - Date.now());

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarText: user.avatarText,
        phone: user.phone,
        doctorId: user.doctorId,
        patientId: user.patientId,
        specialization: user.specialization,
        status: user.status,
      },
      token: session.token,
      expiresAt: session.expiresAt,
    });
  }
);

/**
 * POST /api/auth/register
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post(
  '/api/auth/register',
  rateLimit(60 * 60 * 1000, 20, 'Too many registration requests from this network. Please try again later.'),
  async (req: Request, res: Response) => {
    const { name, email, phone, password, role } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      role?: UserRole;
    };

    if (!name || !email || !password || typeof email !== 'string' || typeof name !== 'string') {
      res.status(400).json({ error: 'Please provide all required registration fields.' });
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      res.status(400).json({ error: 'Please enter a valid full name.' });
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const targetRole: UserRole = role === 'doctor' ? 'doctor' : 'patient';

    if ((role as string) === 'admin') {
      res.status(403).json({ error: 'Administrator accounts must be provisioned by the system.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const users = loadUserStore();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
      return;
    }

    const userId = `u-${Date.now()}`;
    const initials = cleanName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'OX';

    const newUser: ServerUser = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      role: targetRole,
      avatarText: initials,
      phone: phone?.trim() || '',
      patientId: targetRole === 'patient' ? `p-${Date.now()}` : undefined,
      doctorId: targetRole === 'doctor' ? `doc-${Date.now().toString().slice(-4)}` : undefined,
      specialization: targetRole === 'doctor' ? 'Clinical Associate' : undefined,
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
    };

    users.push(newUser);
    saveUserStore(users);

    const pwRecord = await pbkdf2Hash(password);
    const pwStore = loadPwStore();
    pwStore.push({
      userId,
      salt: pwRecord.salt,
      hash: pwRecord.hash,
      iterations: pwRecord.iterations,
    });
    savePwStore(pwStore);

    const session = createServerSession(newUser);
    setSessionCookie(res, session.token, session.expiresAt - Date.now());

    res.json({
      success: true,
      user: newUser,
      token: session.token,
    });
  }
);

/**
 * POST /api/auth/logout
 */
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = extractToken(req);
  if (token) {
    invalidateServerSession(token);
  }
  clearSessionCookie(res);
  res.json({ success: true, message: 'Signed out successfully.' });
});

/**
 * GET /api/auth/me and GET /api/auth/session
 */
const handleGetCurrentUser = (req: AuthenticatedRequest, res: Response): void => {
  res.json({
    authenticated: true,
    user: req.user,
    sessionExpiresAt: req.session?.expiresAt,
  });
};

app.get('/api/auth/me', authenticateSession, handleGetCurrentUser);
app.get('/api/auth/session', authenticateSession, handleGetCurrentUser);

/**
 * POST /api/auth/forgot-password
 */
app.post(
  '/api/auth/forgot-password',
  rateLimit(15 * 60 * 1000, 10, 'Too many password reset requests. Please wait 15 minutes before requesting again.'),
  async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };

    const genericResponse = {
      message: 'If an account exists for this email, password reset instructions have been sent.',
    };

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      res.json(genericResponse);
      return;
    }

    const users = loadUserStore();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    // If account does not exist or is inactive, return generic response without creating account or sending email (prevents enumeration)
    if (!user || user.status === 'inactive') {
      res.json(genericResponse);
      return;
    }

    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256Token(plainToken);

    const resetStore = loadResetStore();

    for (const [hash, entry] of resetStore) {
      if (entry.userId === user.id || entry.email.toLowerCase() === cleanEmail) {
        resetStore.delete(hash);
      }
    }

    const now = Date.now();
    const expiresAt = now + 30 * 60 * 1000;

    resetStore.set(tokenHash, {
      userId: user.id,
      email: cleanEmail,
      tokenHash,
      createdAt: now,
      expiresAt,
      used: false,
    });

    saveResetStore(resetStore);

    try {
      await sendResetEmail(cleanEmail, plainToken, req);
    } catch (err: any) {
      console.error('[Oralix] Error during email dispatch:', err?.message || err);
    }

    res.json(genericResponse);
  }
);

export function normalizeTokenVariants(raw: string): string[] {
  if (!raw || typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {}

  const variants = new Set<string>();
  for (const str of [trimmed, decoded]) {
    variants.add(str);
    if (str.includes('token=')) {
      const match = str.match(/[?&#]token=([^&#\s]+)/i);
      if (match && match[1]) {
        variants.add(match[1]);
        try {
          variants.add(decodeURIComponent(match[1]));
        } catch {}
      }
    }
  }

  for (const s of Array.from(variants)) {
    const cleaned = s.replace(/[.,\s\/>\)"']+$/, '').replace(/^[<"'\s]+/, '').trim();
    if (cleaned) variants.add(cleaned);
  }

  return Array.from(variants).filter(s => Boolean(s && s.length > 0));
}

export function findResetEntry(token: string): { hash: string; entry: ResetEntry } | null {
  if (!token || typeof token !== 'string' || !token.trim()) return null;
  const variants = normalizeTokenVariants(token);
  const resetStore = loadResetStore();

  for (const variant of variants) {
    // 1. HMAC-SHA256 with RESET_SECRET_KEY
    const hmacVal = sha256Token(variant);
    if (resetStore.has(hmacVal)) {
      const entry = resetStore.get(hmacVal)!;
      if (!entry.used && Date.now() <= entry.expiresAt) return { hash: hmacVal, entry };
    }

    // 2. Plain SHA-256
    const shaVal = crypto.createHash('sha256').update(variant).digest('hex');
    if (resetStore.has(shaVal)) {
      const entry = resetStore.get(shaVal)!;
      if (!entry.used && Date.now() <= entry.expiresAt) return { hash: shaVal, entry };
    }

    // 3. Direct match by hash or entry tokenHash
    for (const [hash, entry] of resetStore) {
      if (
        (hash === variant || entry.tokenHash === variant || entry.tokenHash === hmacVal || entry.tokenHash === shaVal) &&
        !entry.used &&
        Date.now() <= entry.expiresAt
      ) {
        return { hash, entry };
      }
    }
  }

  return null;
}


/**
 * POST /api/auth/validate-reset-token
 */
app.post('/api/auth/validate-reset-token', (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  const found = findResetEntry(token || '');

  if (!found || found.entry.used || Date.now() > found.entry.expiresAt) {
    res.json({ valid: false, error: 'This password reset link is invalid or has expired.' });
    return;
  }

  res.json({ valid: true });
});

/**
 * POST /api/auth/reset-password
 */
app.post(
  '/api/auth/reset-password',
  rateLimit(15 * 60 * 1000, 15, 'Too many password reset attempts. Please wait 15 minutes before trying again.'),
  async (req: Request, res: Response) => {
    const { token, new_password, newPassword, password } = req.body as {
      token?: string;
      new_password?: string;
      newPassword?: string;
      password?: string;
    };

    const targetPassword = new_password || newPassword || password;

    if (!targetPassword || typeof targetPassword !== 'string') {
      res.status(400).json({ error: 'Please enter a valid new password.' });
      return;
    }

    if (targetPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const found = findResetEntry(token || '');

    if (!found) {
      res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
      return;
    }

    const { hash: tokenKey, entry } = found;

    if (entry.used) {
      res.status(400).json({ error: 'This password reset link has already been used. Please request a new one.' });
      return;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      const resetStore = loadResetStore();
      resetStore.delete(tokenKey);
      saveResetStore(resetStore);
      res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
      return;
    }

    // Invalidate all tokens for this user upon successful reset
    const resetStore = loadResetStore();
    entry.used = true;
    resetStore.delete(tokenKey);
    for (const [k, e] of resetStore) {
      if (e.userId === entry.userId || e.email.toLowerCase() === entry.email.toLowerCase()) {
        resetStore.delete(k);
      }
    }
    saveResetStore(resetStore);

    const { salt, hash, iterations } = await pbkdf2Hash(targetPassword);

    const users = loadUserStore();
    const targetUserIds = new Set<string>();
    if (entry.userId) targetUserIds.add(entry.userId);
    if (entry.email) {
      for (const u of users) {
        if (u.email && u.email.toLowerCase() === entry.email.toLowerCase()) {
          targetUserIds.add(u.id);
        }
      }
    }

    const pwStore = loadPwStore();
    for (const uId of targetUserIds) {
      const idx = pwStore.findIndex(r => r.userId === uId);
      const newRecord: PwRecord = { userId: uId, salt, hash, iterations };
      if (idx >= 0) {
        pwStore[idx] = newRecord;
      } else {
        pwStore.push(newRecord);
      }
      invalidateUserSessions(uId);
    }
    savePwStore(pwStore);

    console.info(`[Oralix] Password successfully reset for userId=${entry.userId} (targets=[${Array.from(targetUserIds).join(', ')}], email=${maskEmail(entry.email)})`);

    res.json({
      ok: true,
      message: 'Your password has been reset successfully.',
    });
  }
);

// ─── Role-Protected API Endpoints (RBAC Verification) ─────────────────────────
app.get('/api/patient/dashboard', authenticateSession, requireRole('patient', 'doctor', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json({ ok: true, message: `Welcome to patient area, ${req.user?.name}`, role: req.user?.role });
});

app.get('/api/doctor/dashboard', authenticateSession, requireRole('doctor', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json({ ok: true, message: `Welcome to clinician terminal, ${req.user?.name}`, role: req.user?.role });
});

app.get('/api/doctor/patients', authenticateSession, requireRole('doctor', 'admin'), (_req: Request, res: Response) => {
  res.json({ ok: true, count: 24, status: 'authorized' });
});

app.get('/api/admin/dashboard', authenticateSession, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  res.json({ ok: true, message: `Admin access granted for ${req.user?.name}`, role: req.user?.role });
});

app.get('/api/admin/audit-logs', authenticateSession, requireRole('admin'), (_req: Request, res: Response) => {
  res.json({ ok: true, logs: [], status: 'authorized_admin' });
});

app.get('/api/admin/users', authenticateSession, requireRole('admin'), (_req: Request, res: Response) => {
  const users = loadUserStore();
  res.json({ ok: true, users });
});

// ─── Billing & Digital Receipt API ───────────────────────────────────────────
app.post('/api/billing/send-receipt', optionalAuthenticateSession, async (req: Request, res: Response) => {
  const {
    invoiceNumber,
    patientName,
    patientEmail,
    date,
    items,
    consultationFee,
    subtotal,
    discount,
    total,
    amountPaid,
    paymentMethod,
    paymentStatus,
  } = req.body;

  if (!patientEmail || !invoiceNumber || !patientName) {
    res.status(400).json({
      success: false,
      error: 'Missing required receipt parameters (invoiceNumber, patientName, patientEmail).',
    });
    return;
  }

  try {
    const result = await sendReceiptEmail({
      invoiceNumber: String(invoiceNumber),
      patientName: String(patientName),
      patientEmail: String(patientEmail),
      date: date || new Date().toISOString().split('T')[0],
      items: Array.isArray(items) ? items : [],
      consultationFee: Number(consultationFee || 0),
      subtotal: Number(subtotal || 0),
      discount: Number(discount || 0),
      total: Number(total || 0),
      amountPaid: Number(amountPaid || 0),
      paymentMethod: String(paymentMethod || 'UPI'),
      paymentStatus: String(paymentStatus || 'Paid'),
    });

    if (result.delivered) {
      res.json({
        success: true,
        message: `Receipt email dispatched to ${patientEmail} for invoice ${invoiceNumber}`,
      });
    } else {
      res.status(502).json({
        success: false,
        error: result.error || 'Receipt email could not be sent.',
      });
    }
  } catch (err: any) {
    console.error('[Oralix] Error dispatching receipt email:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Server error while sending receipt email.',
    });
  }
});

// ─── Domain-Driven API Routers ───────────────────────────────────────────────
app.use('/api/patients', authenticateSession, patientsRouter);
app.use('/api/appointments', authenticateSession, appointmentsRouter);
app.use('/api/billing', authenticateSession, billingRouter);
app.use('/api/growth', authenticateSession, growthRouter);
app.use('/api/feedback', optionalAuthenticateSession, feedbackRouter);
app.use('/api/files', authenticateSession, filesRouter);
app.use('/api/ai', authenticateSession, aiRouter);
app.use('/api/notifications', authenticateSession, notificationsRouter);
app.use('/api/settings', authenticateSession, settingsRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'oralix-auth',
    domain: 'oralix.online',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// ─── Production Static Asset & SPA Serving ────────────────────────────────────
const distDir = path.resolve('dist');
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));

if ((isDirectRun || process.env.NODE_ENV === 'production') && existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Oralix] Server error:', err.message);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

// ─── Server Startup ───────────────────────────────────────────────────────────
bootstrapDefaultPasswords().catch(err => {
  console.error('[Oralix] Error bootstrapping default passwords:', err);
});

if (isDirectRun || process.env.STANDALONE_SERVER === 'true') {
  const PORT = Number(process.env.API_PORT ?? 3001);
  const server = app.listen(PORT, () => {
    const resendConfigured = Boolean(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('YOUR_'));
    console.log(`[Oralix] Auth & RBAC Server running on port ${PORT}`);
    console.log(`[Oralix] Resend Email: ${resendConfigured ? '✓ Configured' : '✗ Unset (configure RESEND_API_KEY in .env)'}`);
    console.log(`[Oralix] Production URL: ${getAppBaseUrl()}`);
    console.log(`[Oralix] Sender Address: ${process.env.MAIL_FROM || process.env.EMAIL_FROM || 'Oralix <noreply@oralix.online>'}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Oralix] Port ${PORT} in use.`);
    } else {
      console.error('[Oralix] Server error:', err);
    }
  });
}

export default app;
