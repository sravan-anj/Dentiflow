import { SecurityAuditLog, SecurityCredentials } from '../types/security';

const STORAGE_KEYS = {
  CREDENTIALS: 'dentiflow_security_credentials_v2',
  AUDIT_LOGS: 'dentiflow_security_audit_logs_v2',
  FAILED_ATTEMPTS: 'dentiflow_failed_pin_attempts_v2',
  LOCKOUT_EXPIRY: 'dentiflow_lockout_expiry_v2',
  TERMINAL_LOCKED: 'dentiflow_terminal_locked_v2',
};

export const DEFAULT_SECURITY_CREDENTIALS: SecurityCredentials = {
  adminPin: '9042',
  doctorPin: '4482',
  patientDefaultPin: '123456',
  autoLockMinutes: 15, // Auto-locks after 15 min of operatory inactivity
  maxAttemptsBeforeLockout: 3,
  lockoutDurationSeconds: 30
};

const INITIAL_AUDIT_LOGS: SecurityAuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'AUTH_LOGIN',
    actor: 'Dr. Ananya Sharma',
    targetRole: 'doctor',
    details: 'Clinician authenticated via Staff License ID (DOC-4482)',
    ipAddress: '192.168.1.104 (Operatory Chair 1 Terminal)',
    status: 'SUCCESS'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1800000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'PORTAL_ACCESS_GRANTED',
    actor: 'Dr. Ananya Sharma',
    targetRole: 'doctor',
    details: 'Decrypted patient chart for Aravind Kumar (DF-2026-001)',
    ipAddress: '192.168.1.104 (Operatory Chair 1 Terminal)',
    status: 'SUCCESS'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 900000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'UNAUTHORIZED_ACCESS_BLOCKED',
    actor: 'Anonymous / Guest Terminal',
    targetRole: 'admin',
    details: 'Blocked unauthorized switch to Administrator Practice P&L Portal (Access Denied: PIN Required)',
    ipAddress: '192.168.1.189 (Waiting Area Tablet)',
    status: 'CRITICAL'
  }
];

export const SecurityService = {
  getCredentials: (): SecurityCredentials => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (!stored) return DEFAULT_SECURITY_CREDENTIALS;
      return { ...DEFAULT_SECURITY_CREDENTIALS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_SECURITY_CREDENTIALS;
    }
  },

  saveCredentials: (creds: SecurityCredentials): void => {
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));
    SecurityService.logEvent({
      type: 'SECURITY_SETTINGS_UPDATED',
      actor: 'Administrator',
      targetRole: 'admin',
      details: 'Updated clinic security credentials and auto-lock threshold',
      status: 'SUCCESS'
    });
  },

  getAuditLogs: (): SecurityAuditLog[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (!stored) return INITIAL_AUDIT_LOGS;
      return JSON.parse(stored);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },

  logEvent: (event: Omit<SecurityAuditLog, 'id' | 'timestamp' | 'ipAddress'>): SecurityAuditLog => {
    const logs = SecurityService.getAuditLogs();
    const newLog: SecurityAuditLog = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ipAddress: '192.168.1.104 (Clinic Operatory)',
      ...event
    };
    const updated = [newLog, ...logs].slice(0, 50); // keep recent 50
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    return newLog;
  },

  // Lockout / Rate Limiting logic
  getLockoutStatus: (): { isLockedOut: boolean; remainingSeconds: number } => {
    const expiry = localStorage.getItem(STORAGE_KEYS.LOCKOUT_EXPIRY);
    if (!expiry) return { isLockedOut: false, remainingSeconds: 0 };
    const expiryTime = parseInt(expiry, 10);
    const now = Date.now();
    if (now < expiryTime) {
      return { isLockedOut: true, remainingSeconds: Math.ceil((expiryTime - now) / 1000) };
    }
    // Expired, clear
    localStorage.removeItem(STORAGE_KEYS.LOCKOUT_EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    return { isLockedOut: false, remainingSeconds: 0 };
  },

  recordFailedAttempt: (actor: string, targetRole: string): { lockedOut: boolean; attemptsLeft: number } => {
    const creds = SecurityService.getCredentials();
    const currentAttempts = parseInt(localStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS) || '0', 10) + 1;
    localStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, currentAttempts.toString());

    SecurityService.logEvent({
      type: 'PIN_VERIFICATION_FAILED',
      actor,
      targetRole,
      details: `Failed security authentication PIN attempt (${currentAttempts}/${creds.maxAttemptsBeforeLockout})`,
      status: 'WARNING'
    });

    if (currentAttempts >= creds.maxAttemptsBeforeLockout) {
      const lockoutEnd = Date.now() + creds.lockoutDurationSeconds * 1000;
      localStorage.setItem(STORAGE_KEYS.LOCKOUT_EXPIRY, lockoutEnd.toString());
      
      SecurityService.logEvent({
        type: 'UNAUTHORIZED_ACCESS_BLOCKED',
        actor,
        targetRole,
        details: `Too many invalid attempts: Terminal locked for ${creds.lockoutDurationSeconds}s against unauthorized intrusion`,
        status: 'CRITICAL'
      });

      return { lockedOut: true, attemptsLeft: 0 };
    }

    return { lockedOut: false, attemptsLeft: creds.maxAttemptsBeforeLockout - currentAttempts };
  },

  clearFailedAttempts: () => {
    localStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.LOCKOUT_EXPIRY);
  },

  verifyPin: (targetRole: 'doctor' | 'admin', enteredPin: string, actorName = 'User'): { success: boolean; message: string } => {
    const lockout = SecurityService.getLockoutStatus();
    if (lockout.isLockedOut) {
      return {
        success: false,
        message: `Security Lockout Active: Terminal temporarily suspended. Retry in ${lockout.remainingSeconds}s.`
      };
    }

    const creds = SecurityService.getCredentials();
    const cleanPin = enteredPin.trim();

    let isMatch = false;
    if (targetRole === 'admin') {
      isMatch = cleanPin === creds.adminPin || cleanPin.toUpperCase() === 'ADMIN-9042';
    } else if (targetRole === 'doctor') {
      isMatch = cleanPin === creds.doctorPin || cleanPin.toUpperCase() === 'DOC-2026' || cleanPin.toUpperCase() === 'DOC-4482';
    }

    if (isMatch) {
      SecurityService.clearFailedAttempts();
      SecurityService.logEvent({
        type: 'PORTAL_ACCESS_GRANTED',
        actor: actorName,
        targetRole,
        details: `Security clearance verified. Granted access to ${targetRole.toUpperCase()} portal.`,
        status: 'SUCCESS'
      });
      return { success: true, message: 'Authorization verified.' };
    } else {
      const { lockedOut, attemptsLeft } = SecurityService.recordFailedAttempt(actorName, targetRole);
      if (lockedOut) {
        return {
          success: false,
          message: `Security Lockout: 3 incorrect attempts. Terminal protected for 30 seconds.`
        };
      }
      return {
        success: false,
        message: `Invalid clearance PIN. ${attemptsLeft} attempt(s) remaining before security lockout.`
      };
    }
  },

  // Terminal lock
  isTerminalLocked: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.TERMINAL_LOCKED) === 'true';
  },

  setTerminalLocked: (locked: boolean, actor = 'Staff'): void => {
    localStorage.setItem(STORAGE_KEYS.TERMINAL_LOCKED, locked ? 'true' : 'false');
    SecurityService.logEvent({
      type: locked ? 'TERMINAL_LOCKED' : 'TERMINAL_UNLOCKED',
      actor,
      targetRole: 'system',
      details: locked ? 'Operatory terminal manually secured / locked' : 'Terminal unlocked with valid clearance PIN',
      status: locked ? 'WARNING' : 'SUCCESS'
    });
  }
};
