/**
 * authService.ts — Client Authentication Service for Oralix
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
import { getApiEndpoint } from './apiConfig';

const AUTH_STORAGE_KEYS = {
  SESSION_TOKEN: 'oralix_auth_token_v1',
  LEGACY_TOKEN: 'dentiflow_auth_token_v1',
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
      const response = await fetch(getApiEndpoint('/api/auth/login'), {
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
        localStorage.setItem(AUTH_STORAGE_KEYS.SESSION_TOKEN, data.token);
        localStorage.setItem('oralix_bearer_token', data.token);
      }

      SecurityService.clearFailedAttempts();
      SecurityService.logEvent({
        type: 'AUTH_LOGIN',
        actor: authenticatedUser.name,
        targetRole: authenticatedUser.role,
        details: `Successfully signed in as ${authenticatedUser.role.toUpperCase()} (Server Verified)`,
        status: 'SUCCESS',
      });

      // Save user and ensure isolated patient profile exists if role is patient
      StorageService.saveCurrentUser(authenticatedUser);

      return {
        success: true,
        user: authenticatedUser,
        token: data.token,
      };
    } catch {
      // Secure handling: NEVER bypass password verification when backend is unreachable
      return {
        success: false,
        error: 'Unable to connect to the authentication server. Please check your network connection and try again.',
      };
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
      const response = await fetch(getApiEndpoint('/api/auth/register'), {
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
        localStorage.setItem(AUTH_STORAGE_KEYS.SESSION_TOKEN, data.token);
        localStorage.setItem('oralix_bearer_token', data.token);
      }

      // Update users and ensure patient profile is provisioned
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
      return { success: false, error: 'Unable to contact registration server. Please check your network connection.' };
    }
  },

  /**
   * Invalidate session and sign out.
   */
  async logout(currentUser?: User | null): Promise<void> {
    try {
      const token = sessionStorage.getItem(AUTH_STORAGE_KEYS.SESSION_TOKEN) || sessionStorage.getItem(AUTH_STORAGE_KEYS.LEGACY_TOKEN);
      await fetch(getApiEndpoint('/api/auth/logout'), {
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
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.LEGACY_TOKEN);
      localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
      localStorage.removeItem(AUTH_STORAGE_KEYS.LEGACY_TOKEN);
      localStorage.removeItem('oralix_bearer_token');
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
      const token = sessionStorage.getItem(AUTH_STORAGE_KEYS.SESSION_TOKEN) || sessionStorage.getItem(AUTH_STORAGE_KEYS.LEGACY_TOKEN);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiEndpoint('/api/auth/session'), {
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
      const res = await fetch(getApiEndpoint('/api/auth/forgot-password'), {
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

      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        return {
          success: false,
          error: data.error || 'Too many reset requests. Please wait a few minutes before trying again.',
        };
      }

      return {
        success: true,
        message: 'If an account exists for this email, password reset instructions have been sent.',
      };
    } catch {
      return {
        success: false,
        error: 'Unable to reach the password reset server. Please check your internet connection.',
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
      const res = await fetch(getApiEndpoint('/api/auth/validate-reset-token'), {
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
      return { valid: false, error: 'Unable to verify reset token. Please check your connection and try again.' };
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
      const res = await fetch(getApiEndpoint('/api/auth/reset-password'), {
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
      return { success: false, error: 'Unable to connect to password reset server. Please check your network connection.' };
    }
  },

  /**
   * Role-based tab clearance check.
   */
  isAuthorizedForTab(user: User | null, tab: string): boolean {
    if (!user) return false;

    const patientTabs = ['dashboard', 'appointments', 'chart', 'treatment-plans', 'billing', 'feedback', 'profile'];
    const receptionistTabs = ['dashboard', 'billing', 'appointments', 'queue', 'patients', 'profile'];
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
      'feedback',
      'growth',
      'profile',
    ];
    const adminTabs = [
      ...doctorTabs,
      'settings',
      'account-access',
    ];

    switch (user.role) {
      case 'patient':
        return patientTabs.includes(tab);
      case 'receptionist':
        return receptionistTabs.includes(tab);
      case 'doctor':
        return doctorTabs.includes(tab);
      case 'admin':
        return adminTabs.includes(tab);
      default:
        return false;
    }
  },
};
