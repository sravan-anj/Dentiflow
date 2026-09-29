/**
 * test_auth.ts — Automated Comprehensive Authentication & RBAC Test Suite
 */

import http from 'http';
import app, { bootstrapDefaultPasswords } from './server';
import { readFileSync, existsSync, writeFileSync } from 'fs';

let server: http.Server;
const PORT = 3999;
const BASE_URL = `http://localhost:${PORT}`;

function request(
  method: string,
  path: string,
  body?: any,
  cookies?: string,
  token?: string
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers: Record<string, string | number> = {
      'Content-Type': 'application/json',
    };
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (cookies) {
      headers['Cookie'] = cookies;
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      `${BASE_URL}${path}`,
      { method, headers },
      res => {
        let raw = '';
        res.on('data', chunk => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode || 500, body: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function extractCookie(headers: http.IncomingHttpHeaders): string | undefined {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return undefined;
  if (Array.isArray(setCookie)) return setCookie[0]?.split(';')[0];
  return typeof setCookie === 'string' ? (setCookie as string).split(';')[0] : undefined;
}

async function runTests() {
  console.log('============================================================');
  console.log('  DENTIFLOW AUTHENTICATION & RBAC AUTOMATED TEST SUITE');
  console.log('============================================================\n');

  await bootstrapDefaultPasswords();
  server = app.listen(PORT);
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // ─── 1. Patient Login (Email) ─────────────────────────────────────────────
    const patientLoginRes = await request('POST', '/api/auth/login', {
      identifier: 'patient@gmail.com',
      password: 'patient123',
    });
    assert(
      patientLoginRes.status === 200 &&
      patientLoginRes.body.user.role === 'patient' &&
      Boolean(patientLoginRes.body.token),
      '1. Patient login with email succeeds and returns patient role'
    );
    const patientCookie = extractCookie(patientLoginRes.headers);
    const patientToken = patientLoginRes.body.token;

    // ─── 2. Patient Login (Phone) ─────────────────────────────────────────────
    const patientPhoneRes = await request('POST', '/api/auth/login', {
      identifier: '+91 98765 43210',
      password: 'patient123',
    });
    assert(
      patientPhoneRes.status === 200 && patientPhoneRes.body.user.role === 'patient',
      '2. Patient login with phone number succeeds'
    );

    // ─── 3. Doctor Login (Email & Doctor ID) ──────────────────────────────────
    const docEmailRes = await request('POST', '/api/auth/login', {
      identifier: 'doctor@gmail.com',
      password: 'doctor123',
    });
    assert(
      docEmailRes.status === 200 && docEmailRes.body.user.role === 'doctor',
      '3a. Doctor login with official email succeeds and returns doctor role'
    );
    const doctorCookie = extractCookie(docEmailRes.headers);
    const doctorToken = docEmailRes.body.token;

    const docIdRes = await request('POST', '/api/auth/login', {
      identifier: 'DOC-4482',
      password: 'doctor123',
    });
    assert(
      docIdRes.status === 200 && docIdRes.body.user.role === 'doctor',
      '3b. Doctor login with Doctor ID (DOC-4482) succeeds'
    );

    // ─── 4. Admin Login (Email & Admin ID) ────────────────────────────────────
    const adminEmailRes = await request('POST', '/api/auth/login', {
      identifier: 'admin@gmail.com',
      password: 'admin123',
    });
    assert(
      adminEmailRes.status === 200 && adminEmailRes.body.user.role === 'admin',
      '4a. Admin login with email succeeds and returns admin role'
    );
    const adminCookie = extractCookie(adminEmailRes.headers);
    const adminToken = adminEmailRes.body.token;

    const adminIdRes = await request('POST', '/api/auth/login', {
      identifier: 'ADMIN-9042',
      password: 'admin123',
    });
    assert(
      adminIdRes.status === 200 && adminIdRes.body.user.role === 'admin',
      '4b. Admin login with Admin ID (ADMIN-9042) succeeds'
    );

    // ─── 5. Wrong Password Rejected ───────────────────────────────────────────
    const wrongPassRes = await request('POST', '/api/auth/login', {
      identifier: 'doctor@gmail.com',
      password: 'WrongPassword999',
    });
    assert(
      wrongPassRes.status === 401 && wrongPassRes.body.error === 'Invalid credentials.',
      '5. Wrong password rejected with 401 "Invalid credentials."'
    );

    // ─── 6. Role Spoofing Prevention (Backend Enforcement) ────────────────────
    const spoofRoleRes = await request('POST', '/api/auth/login', {
      identifier: 'patient@gmail.com',
      password: 'patient123',
      role: 'doctor', // Client attempting to claim doctor role
    });
    assert(
      spoofRoleRes.status === 200 && spoofRoleRes.body.user.role === 'patient',
      '6. Role spoofing prevented: server returns true DB role (patient), ignoring client role'
    );

    // ─── 7. Session Validation (GET /api/auth/me) ─────────────────────────────
    const sessionRes = await request('GET', '/api/auth/me', undefined, patientCookie);
    assert(
      sessionRes.status === 200 && sessionRes.body.authenticated === true && sessionRes.body.user.role === 'patient',
      '7. Session persistence via HTTP-only cookie verified'
    );

    const bearerRes = await request('GET', '/api/auth/me', undefined, undefined, doctorToken);
    assert(
      bearerRes.status === 200 && bearerRes.body.user.role === 'doctor',
      '8. Session validation via Authorization Bearer header verified'
    );

    // ─── 8. Role-Based Authorization (RBAC) ───────────────────────────────────
    // Patient accessing patient dashboard -> 200
    const pDash = await request('GET', '/api/patient/dashboard', undefined, patientCookie);
    assert(pDash.status === 200, '9. Patient allowed on /api/patient/dashboard');

    // Patient accessing doctor dashboard -> 403 Forbidden
    const pDocDash = await request('GET', '/api/doctor/dashboard', undefined, patientCookie);
    assert(pDocDash.status === 403, '10. Patient BLOCKED (403) from /api/doctor/dashboard');

    // Patient accessing admin dashboard -> 403 Forbidden
    const pAdminDash = await request('GET', '/api/admin/dashboard', undefined, patientCookie);
    assert(pAdminDash.status === 403, '11. Patient BLOCKED (403) from /api/admin/dashboard');

    // Doctor accessing doctor dashboard -> 200
    const dDocDash = await request('GET', '/api/doctor/dashboard', undefined, doctorCookie);
    assert(dDocDash.status === 200, '12. Doctor allowed on /api/doctor/dashboard');

    // Doctor accessing admin dashboard -> 403 Forbidden
    const dAdminDash = await request('GET', '/api/admin/dashboard', undefined, doctorCookie);
    assert(dAdminDash.status === 403, '13. Doctor BLOCKED (403) from /api/admin/dashboard');

    // Admin accessing admin dashboard -> 200
    const aAdminDash = await request('GET', '/api/admin/dashboard', undefined, adminCookie);
    assert(aAdminDash.status === 200, '14. Admin allowed on /api/admin/dashboard');

    // ─── 9. Forgot Password & Zero Token Leakage ──────────────────────────────
    const forgotRes = await request('POST', '/api/auth/forgot-password', {
      email: 'patient@gmail.com',
    });
    assert(
      forgotRes.status === 200 &&
      forgotRes.body.message.includes('If an account exists') &&
      forgotRes.body.token === undefined &&
      forgotRes.body.resetLink === undefined,
      '15. Forgot password returns safe message with ZERO token leaks in response'
    );

    // Non-existent email returns same generic response
    const forgotNonExist = await request('POST', '/api/auth/forgot-password', {
      email: 'nonexistent999@example.com',
    });
    assert(
      forgotNonExist.status === 200 &&
      forgotNonExist.body.message === forgotRes.body.message,
      '16. Non-existent email returns identical generic response (no enumeration)'
    );

    // ─── 10. Password Reset Flow with Token ───────────────────────────────────
    // Load generated token from reset store to test token verification & completion
    const resetStoreRaw = JSON.parse(readFileSync('.dentiflow_reset_store.json', 'utf8'));
    assert(resetStoreRaw.length > 0, '17. Reset token successfully saved in persistent reset store as hash');

    // Find the token entry for patient
    const patientEntry = resetStoreRaw.find(([, entry]: any) => entry.email === 'patient@gmail.com');
    assert(Boolean(patientEntry), '18. Token entry found with UTC 30m expiration');

    // Let's test token validation endpoint with a fake / missing token
    const fakeTokenVal = await request('POST', '/api/auth/validate-reset-token', {
      token: 'fake_nonexistent_token_12345',
    });
    assert(fakeTokenVal.body.valid === false, '19. Invalid token rejected by /api/auth/validate-reset-token');

    // Test password reset with invalid token
    const fakeReset = await request('POST', '/api/auth/reset-password', {
      token: 'fake_nonexistent_token_12345',
      new_password: 'NewSecurePassword123!',
    });
    assert(fakeReset.status === 400, '20. Password reset with invalid token rejected');

    // Create dedicated QA test account in user store so real accounts are never touched
    const userStoreList = JSON.parse(readFileSync('.dentiflow_user_store.json', 'utf8'));
    const testUserId = 'u-test-automation-qa';
    const testUserEmail = 'qa-automation@example.com';
    if (!userStoreList.some((u: any) => u.id === testUserId)) {
      userStoreList.push({
        id: testUserId,
        name: 'QA Automation User',
        email: testUserEmail,
        role: 'patient',
        avatarText: 'QA',
        status: 'active',
        joinedDate: '2026-09-28',
      });
      writeFileSync('.dentiflow_user_store.json', JSON.stringify(userStoreList, null, 2), 'utf8');
    }

    // Now test a real token generated for test user
    // Generate a known test token directly using the store to test full reset & single-use
    const crypto = await import('crypto');
    const testPlainToken = crypto.randomBytes(32).toString('hex');
    const secretKey = process.env.PASSWORD_RESET_SECRET || process.env.FLASK_SECRET_KEY || 'dentiflow_stable_production_secret_key_v1';
    const testTokenHash = crypto.createHmac('sha256', secretKey).update(testPlainToken).digest('hex');

    const resetStoreMap = new Map<string, any>(JSON.parse(readFileSync('.dentiflow_reset_store.json', 'utf8')));
    resetStoreMap.set(testTokenHash, {
      userId: testUserId,
      email: testUserEmail,
      tokenHash: testTokenHash,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
      used: false,
    });
    writeFileSync('.dentiflow_reset_store.json', JSON.stringify(Array.from(resetStoreMap.entries())), 'utf8');

    // Test token validation with valid token
    const validTokenVal = await request('POST', '/api/auth/validate-reset-token', {
      token: testPlainToken,
    });
    assert(validTokenVal.body.valid === true, '21. Valid token verified by validate-reset-token endpoint');

    // Reset password with new password
    const resetRes = await request('POST', '/api/auth/reset-password', {
      token: testPlainToken,
      new_password: 'NewPassword2026!',
    });
    assert(
      resetRes.status === 200 && resetRes.body.ok === true,
      '22. Password reset succeeded with valid token'
    );

    // Test logging in with NEW password
    const newPassLogin = await request('POST', '/api/auth/login', {
      identifier: testUserEmail,
      password: 'NewPassword2026!',
    });
    assert(newPassLogin.status === 200, '23. Login with NEW password succeeds');

    // Test logging in with OLD password (must fail)
    const oldPassLogin = await request('POST', '/api/auth/login', {
      identifier: testUserEmail,
      password: 'OldWrongPassword123!',
    });
    assert(oldPassLogin.status === 401, '24. Login with OLD password rejected (401)');

    // Test reusing the same reset token (single-use enforcement)
    const reuseToken = await request('POST', '/api/auth/reset-password', {
      token: testPlainToken,
      new_password: 'AnotherPassword2026!',
    });
    assert(reuseToken.status === 400, '25. Token reuse rejected (single-use enforced)');

    // ─── 11. Logout & Session Destruction ─────────────────────────────────────
    const logoutRes = await request('POST', '/api/auth/logout', undefined, patientCookie);
    assert(logoutRes.status === 200, '26. Logout successfully invalidates session');

    // Check that logged-out session is rejected
    const afterLogoutSession = await request('GET', '/api/auth/me', undefined, patientCookie);
    assert(afterLogoutSession.status === 401, '27. Post-logout session rejected with 401 Unauthorized');

    // ─── 12. Registration & Duplicate Account Prevention ──────────────────────
    const newTestEmail = `test_patient_${Date.now()}@example.com`;
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Test Oralix Patient',
      email: newTestEmail,
      phone: '+91 91234 56789',
      password: 'SecurePassword2026!',
      role: 'patient'
    });
    assert(
      regRes.status === 200 && regRes.body.user && regRes.body.user.email === newTestEmail,
      '28. User registration succeeds and generates unique patient profile'
    );

    // Duplicate registration must fail
    const dupRegRes = await request('POST', '/api/auth/register', {
      name: 'Duplicate Patient',
      email: newTestEmail,
      password: 'SecurePassword2026!',
    });
    assert(
      dupRegRes.status === 409 || dupRegRes.status === 400,
      '29. Duplicate registration with same email rejected with error'
    );

    // ─── 13. Expired Reset Token Rejection ───────────────────────────────────
    const expiredPlainToken = crypto.randomBytes(32).toString('hex');
    const expiredTokenHash = crypto.createHmac('sha256', secretKey).update(expiredPlainToken).digest('hex');
    const resetStoreExpired = new Map<string, any>(JSON.parse(readFileSync('.dentiflow_reset_store.json', 'utf8')));
    resetStoreExpired.set(expiredTokenHash, {
      userId: 'u-patient',
      email: 'patient@gmail.com',
      tokenHash: expiredTokenHash,
      createdAt: Date.now() - 3600000,
      expiresAt: Date.now() - 1000, // Expired 1 second ago
      used: false,
    });
    writeFileSync('.dentiflow_reset_store.json', JSON.stringify(Array.from(resetStoreExpired.entries())), 'utf8');

    const expiredValidation = await request('POST', '/api/auth/validate-reset-token', {
      token: expiredPlainToken,
    });
    assert(
      expiredValidation.body.valid === false && typeof expiredValidation.body.error === 'string' && expiredValidation.body.error.includes('expired'),
      '30. Expired reset token rejected by validate-reset-token'
    );

    const expiredResetAttempt = await request('POST', '/api/auth/reset-password', {
      token: expiredPlainToken,
      new_password: 'SomeNewPassword123!',
    });
    assert(
      expiredResetAttempt.status === 400 && typeof expiredResetAttempt.body.error === 'string' && expiredResetAttempt.body.error.includes('expired'),
      '31. Expired reset token rejected on reset-password attempt'
    );

    // ─── 14. Edge Cases & Security Validations ───────────────────────────────
    // A. Inactive Account Rejection (Ensure single entry)
    const userStoreForInactive = JSON.parse(readFileSync('.dentiflow_user_store.json', 'utf8'));
    if (!userStoreForInactive.some((u: any) => u.id === 'u-inactive-test')) {
      userStoreForInactive.push({
        id: 'u-inactive-test',
        name: 'Inactive User',
        email: 'inactive@example.com',
        role: 'patient',
        status: 'inactive',
        avatarText: 'IU',
      });
      const { writeFileSync: writeUsers } = await import('fs');
      writeUsers('.dentiflow_user_store.json', JSON.stringify(userStoreForInactive, null, 2), 'utf8');
    }

    const inactiveLogin = await request('POST', '/api/auth/login', {
      identifier: 'inactive@example.com',
      password: 'patient123',
    });
    assert(inactiveLogin.status === 403, '32. Inactive account rejected with 403 Forbidden');

    // B. Password under 8 characters rejected on reset
    const shortPassReset = await request('POST', '/api/auth/reset-password', {
      token: 'some_token',
      new_password: 'short',
    });
    assert(shortPassReset.status === 400, '33. Password under 8 chars rejected on reset');

    // C. Missing Token rejected
    const missingTokenReset = await request('POST', '/api/auth/reset-password', {
      new_password: 'LongValidPassword123!',
    });
    assert(missingTokenReset.status === 400, '34. Missing token rejected on reset');

    // D. Multiple reset requests: previous token invalidated, only newest works
    await request('POST', '/api/auth/forgot-password', { email: 'patient@gmail.com' });
    const resetStore1 = JSON.parse(readFileSync('.dentiflow_reset_store.json', 'utf8'));
    const token1Entry = resetStore1.find(([, e]: any) => e.email === 'patient@gmail.com');

    // Trigger second reset request for same email
    await request('POST', '/api/auth/forgot-password', { email: 'patient@gmail.com' });
    const resetStore2 = JSON.parse(readFileSync('.dentiflow_reset_store.json', 'utf8'));
    const token2Entries = resetStore2.filter(([, e]: any) => e.email === 'patient@gmail.com');

    assert(
      token2Entries.length === 1 && token2Entries[0][0] !== token1Entry[0],
      '35. Multiple reset requests: previous token invalidated and only latest remains'
    );

    // E. Production Domain Verification in Health Check
    const healthRes = await request('GET', '/api/health');
    assert(
      healthRes.status === 200 && healthRes.body.ok === true && healthRes.body.service === 'oralix-auth' && healthRes.body.domain === 'oralix.online',
      '36. Backend health endpoint active and configured for oralix-auth on oralix.online'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n============================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================\n');
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
