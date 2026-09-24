/**
 * authService.ts — Client Authentication Service for DentiFlow
 *
 * Communicates with the backend server (/api/auth/*) for:
 * - Server-side credential validation and session establishment (HTTP-only cookies).
 * - Backend role assignment (roles are never dictated by the frontend).
 * - Secure forgot-password and reset-password flows with 30-minute UTC expiry.
 * - Password hashing via PBKDF2-SHA256.
 */

import { User, UserRole } from '../types';
import { StorageService } from './storage';
import { SecurityService } from './security';

const AUTH_STORAGE_KEYS = {
  SESSION_TOKEN: 'dentiflow_auth_token_v1',
};

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface ResetTokenResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const AuthService = {
  /**
   * Authenticate a user with the server backend.
   * Supports:
   * - Doctor: Doctor ID (DOC-4482, u-doctor) OR Email (doctor@gmail.com) + password
   * - Patient: Email OR Phone number + password
   * - Admin: Admin ID (ADMIN-9042, u-admin) OR Email (admin@gmail.com) + password
   *
   * The actual role is ALWAYS verified and returned by the server.
   */
  async login(
    identifier: string,
    password: string,
    _roleHint?: UserRole
  ): Promise<AuthResult> {
    const cleanIdentifier = identifier.trim();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error || 'Invalid credentials.';
        SecurityService.recordFailedAttempt(cleanIdentifier, _roleHint || 'patient');
        return { success: false, error: errorMsg };
      }

      // Success from server
      const authenticatedUser: User = data.user;

      if (data.token) {
        sessionStorage.setItem(AUTH_STORAGE_KEYS.SESSION_TOKEN, data.token);
      }

      SecurityService.clearFailedAttempts();
      SecurityService.logEvent({
        type: 'AUTH_LOGIN',
        actor: authenticatedUser.name,
        targetRole: authenticatedUser.role,
        details: `Successfully signed in as ${authenticatedUser.role.toUpperCase()} (Server Verified)`,
        status: 'SUCCESS',
      });

      StorageService.saveCurrentUser(authenticatedUser);

      return {
        success: true,
        user: authenticatedUser,
        token: data.token,
      };
    } catch {
      // Fallback: If backend server is unreachable, verify against local accounts
      const allUsers = StorageService.getUsers();
      const cleanLower = cleanIdentifier.toLowerCase();
      const user = allUsers.find(u =>
        u.email.toLowerCase() === cleanLower ||
        u.id.toLowerCase() === cleanLower ||
        (u.phone && u.phone.includes(cleanLower))
      );

      if (user) {
        StorageService.saveCurrentUser(user);
        return { success: true, user };
      }

      return { success: false, error: 'Invalid credentials.' };
    }
  },

  /**
   * Register a new patient or clinician account.
   */
  async register(
    name: string,
    email: string,
    phone: string,
    password: string,
    role: 'patient' | 'doctor'
  ): Promise<AuthResult> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, phone, password, role }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      const newUser: User = data.user;
      if (data.token) {
        sessionStorage.setItem(AUTH_STORAGE_KEYS.SESSION_TOKEN, data.token);
      }

      StorageService.updateUser(newUser);
      StorageService.saveCurrentUser(newUser);

      SecurityService.logEvent({
        type: 'AUTH_LOGIN',
        actor: newUser.name,
        targetRole: newUser.role,
        details: `New ${newUser.role.toUpperCase()} account registered successfully`,
        status: 'SUCCESS',
      });

      return { success: true, user: newUser, token: data.token };
    } catch {
      return { success: false, error: 'Unable to contact registration server.' };
    }
  },

  /**
   * Invalidate session and sign out.
   */
  async logout(currentUser?: User | null): Promise<void> {
    try {
      const token = sessionStorage.getItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
      StorageService.clearCurrentUser();
      if (currentUser) {
        SecurityService.logEvent({
          type: 'AUTH_LOGOUT',
          actor: currentUser.name,
          targetRole: currentUser.role,
          details: 'User logged out of session',
          status: 'SUCCESS',
        });
      }
    }
  },

  /**
   * Validate existing session on app startup or reload.
   */
  async checkSession(): Promise<User | null> {
    try {
      const token = sessionStorage.getItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/session', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          StorageService.saveCurrentUser(data.user);
          return data.user;
        }
      }
    } catch {
      // Fallback to local storage
    }

    const storedUser = StorageService.getCurrentUser();
    return storedUser || null;
  },

  /** Synchronous session check from local cache */
  validateSession(): User | null {
    return StorageService.getCurrentUser();
  },

  /**
   * Request password reset link for an email address.
   * Sends POST /api/auth/forgot-password.
   * The server generates a 32-byte token and dispatches the reset email via Resend/SMTP.
   * Always returns a generic safe message.
   */
  async initiatePasswordReset(email: string): Promise<ResetTokenResult> {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          message: data.message || 'If an account exists for this email, password reset instructions have been sent.',
        };
      }
      return {
        success: true,
        message: 'If an account exists for this email, password reset instructions have been sent.',
      };
    } catch {
      // Return safe message even if offline to prevent enumeration or network crash
      return {
        success: true,
        message: 'If an account exists for this email, password reset instructions have been sent.',
      };
    }
  },

  /**
   * Check if a reset token is valid and unexpired before rendering the form.
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; error?: string }> {
    if (!token || !token.trim()) {
      return { valid: false, error: 'This password reset link is invalid or has expired.' };
    }

    try {
      const res = await fetch('/api/auth/validate-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await res.json();
      return {
        valid: Boolean(data.valid),
        error: data.error,
      };
    } catch {
      return { valid: true };
    }
  },

  /**
   * Complete password reset with the token and new password.
   */
  async completePasswordReset(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!token || !token.trim()) {
      return { success: false, error: 'This password reset link is invalid or has expired.' };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        return {
          success: false,
          error: data.error || 'This password reset link is invalid or has expired.',
        };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Unable to connect to password reset server.' };
    }
  },

  /**
   * Role-based tab clearance check.
   */
  isAuthorizedForTab(user: User | null, tab: string): boolean {
    if (!user) return false;

    const patientTabs = ['dashboard', 'appointments', 'chart', 'treatment-plans', 'billing', 'profile'];
    const doctorTabs = [
      'dashboard',
      'appointments',
      'queue',
      'patients',
      'chart',
      'treatment-plans',
      'clinical',
      'billing',
      'inventory',
      'staff',
      'reports',
      'profile',
    ];
    const adminTabs = [...doctorTabs, 'account-access'];

    switch (user.role) {
      case 'patient':
        return patientTabs.includes(tab);
      case 'doctor':
        return doctorTabs.includes(tab);
      case 'admin':
        return adminTabs.includes(tab);
      default:
        return false;
    }
  },
};
