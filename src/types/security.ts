export type SecurityEventType = 
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'PORTAL_ACCESS_GRANTED'
  | 'UNAUTHORIZED_ACCESS_BLOCKED'
  | 'TERMINAL_LOCKED'
  | 'TERMINAL_UNLOCKED'
  | 'PIN_VERIFICATION_FAILED'
  | 'PATIENT_RECORD_VIEWED'
  | 'SECURITY_SETTINGS_UPDATED';

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  type: SecurityEventType;
  actor: string;
  targetRole: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL';
}

export interface SecurityCredentials {
  adminPin: string; // default: 9042
  doctorPin: string; // default: 4482
  patientDefaultPin: string; // default: 123456
  autoLockMinutes: number; // 0 for off, 5, 15, 30
  maxAttemptsBeforeLockout: number; // 3
  lockoutDurationSeconds: number; // 30
}
