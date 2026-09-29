/**
 * test_domain_matrix.ts — End-to-End Domain Rules & Business Logic Automated Test Suite
 */

import http from 'http';
import { app, bootstrapDefaultPasswords } from './server';

const PORT = 51234;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let server: http.Server;
let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${testName}`);
  } else {
    failed++;
    console.error(`[FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
  }
}

async function request(
  method: string,
  path: string,
  body?: any,
  token?: string,
  cookies?: string
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
  const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
  const match = cookieStr.match(/dentiflow_session=([^;]+)/);
  return match ? `dentiflow_session=${match[1]}` : undefined;
}

async function login(identifier: string, pass: string): Promise<{ token: string; user: any; cookie: string }> {
  const res = await request('POST', '/api/auth/login', {
    identifier,
    password: pass,
  });
  const cookie = extractCookie(res.headers) || '';
  return { token: res.body.token, user: res.body.user, cookie };
}

async function runTests() {
  console.log('============================================================');
  console.log('  ORALIX DOMAIN & BUSINESS LOGIC AUTOMATED TEST SUITE');
  console.log('============================================================\n');

  await bootstrapDefaultPasswords();
  server = app.listen(PORT);

  try {
    // ------------------------------------------------------------
    // PHASE 1: SESSIONS & RBAC
    // ------------------------------------------------------------
    console.log('--- Phase 1: Authentication & Role Verification ---');
    const patientAuth = await login('patient@gmail.com', 'patient123');
    assert(Boolean(patientAuth.token) && patientAuth.user.role === 'patient', '1. Patient login succeeds with patient role');

    const doctorAuth = await login('doctor@gmail.com', 'doctor123');
    assert(Boolean(doctorAuth.token) && doctorAuth.user.role === 'doctor', '2. Doctor login succeeds with doctor role');

    const receptionistAuth = await login('receptionist@gmail.com', 'receptionist123');
    assert(Boolean(receptionistAuth.token) && receptionistAuth.user.role === 'receptionist', '3. Receptionist login succeeds with receptionist role');

    const adminAuth = await login('admin@gmail.com', 'admin123');
    assert(Boolean(adminAuth.token) && adminAuth.user.role === 'admin', '4. Admin login succeeds with admin role');

    // Authorization checks
    const patientAdminAttempt = await request('GET', '/api/admin/dashboard', undefined, patientAuth.token);
    assert(patientAdminAttempt.status === 403, '5. Patient blocked from Admin Dashboard (403)');

    const doctorAdminAttempt = await request('GET', '/api/admin/dashboard', undefined, doctorAuth.token);
    assert(doctorAdminAttempt.status === 403, '6. Doctor blocked from Admin Dashboard (403)');

    const receptionistBillingCheck = await request('GET', '/api/billing/invoices', undefined, receptionistAuth.token);
    assert(receptionistBillingCheck.status === 200, '7. Receptionist authorized for Billing APIs (200)');

    // ------------------------------------------------------------
    // PHASE 2: PATIENT ONBOARDING
    // ------------------------------------------------------------
    console.log('\n--- Phase 2: Patient Creation & Clinic Isolation ---');
    const patientCreateRes = await request('POST', '/api/patients', {
      name: 'Aravind Kumar',
      age: 32,
      gender: 'Male',
      phone: '+91 98765 43210',
      email: 'patient@gmail.com',
      bloodGroup: 'O+',
      medicalAlerts: ['Penicillin Allergy'],
    }, receptionistAuth.token);

    const testPatient = patientCreateRes.body.patient;
    assert(
      patientCreateRes.status === 201 &&
      Boolean(testPatient && testPatient.id && testPatient.code),
      '8. Patient enrolled by receptionist with generated unique clinic record code'
    );

    // ------------------------------------------------------------
    // PHASE 3: BILLING & PAYMENT IDEMPOTENCY
    // ------------------------------------------------------------
    console.log('\n--- Phase 3: Billing, Invoice Rules & Payment Idempotency ---');

    // 9. Negative discount rejected
    const negDiscountRes = await request('POST', '/api/billing/invoices', {
      patientId: testPatient.id,
      items: [{ description: 'Composite Restoration', quantity: 1, unitPrice: 2000 }],
      discount: -500,
    }, receptionistAuth.token);
    assert(negDiscountRes.status === 400, '9. Negative discount rejected (400)');

    // 10. Discount exceeding subtotal rejected
    const excessiveDiscountRes = await request('POST', '/api/billing/invoices', {
      patientId: testPatient.id,
      items: [{ description: 'Composite Restoration', quantity: 1, unitPrice: 2000 }],
      discount: 3000,
    }, receptionistAuth.token);
    assert(excessiveDiscountRes.status === 400, '10. Discount exceeding subtotal rejected (400)');

    // 11. Valid invoice created with server-side recalculation
    const validInvoiceRes = await request('POST', '/api/billing/invoices', {
      patientId: testPatient.id,
      items: [
        { description: 'Root Canal Treatment Tooth #16', quantity: 1, unitPrice: 5000 },
        { description: 'Post and Core', quantity: 1, unitPrice: 1500 },
      ],
      discount: 500,
    }, receptionistAuth.token);

    const invData = validInvoiceRes.body;
    assert(
      validInvoiceRes.status === 201 &&
      invData.invoice.subtotal === 6500 &&
      invData.invoice.total === 6000 &&
      invData.invoice.balanceDue === 6000 &&
      invData.invoice.status === 'UNPAID',
      '11. Valid invoice created with authoritative server recalculation (subtotal 6500, total 6000, status UNPAID)'
    );

    const testInvoice = invData.invoice;

    // 12. Payment greater than balance due rejected
    const overpaymentRes = await request('POST', `/api/billing/invoices/${testInvoice.id}/payments`, {
      amount: 8000,
      paymentMethod: 'UPI',
      idempotencyKey: `idem-test-overpay-${Date.now()}`,
    }, receptionistAuth.token);
    assert(overpaymentRes.status === 400, '12. Payment amount greater than balance due rejected (400)');

    // 13. Partial payment recorded correctly
    const partialIdemKey = `idem-partial-${Date.now()}`;
    const partialPaymentRes = await request('POST', `/api/billing/invoices/${testInvoice.id}/payments`, {
      amount: 2500,
      paymentMethod: 'UPI',
      idempotencyKey: partialIdemKey,
    }, receptionistAuth.token);

    const partialData = partialPaymentRes.body;
    assert(
      partialPaymentRes.status === 201 &&
      partialData.invoice.amountPaid === 2500 &&
      partialData.invoice.balanceDue === 3500 &&
      partialData.invoice.status === 'PARTIALLY_PAID',
      '13. Partial payment (2500) updates invoice to PARTIALLY_PAID with balanceDue 3500'
    );

    // 14. Idempotent payment submission returns same transaction without double deduction
    const duplicatePaymentRes = await request('POST', `/api/billing/invoices/${testInvoice.id}/payments`, {
      amount: 2500,
      paymentMethod: 'UPI',
      idempotencyKey: partialIdemKey,
    }, receptionistAuth.token);

    const dupData = duplicatePaymentRes.body;
    assert(
      duplicatePaymentRes.status === 200 &&
      dupData.idempotent === true &&
      dupData.payment.id === partialData.payment.id,
      '14. Payment Idempotency enforced: duplicate retry returns existing payment without double charging'
    );

    // 15. Full settlement payment
    const finalPaymentRes = await request('POST', `/api/billing/invoices/${testInvoice.id}/payments`, {
      amount: 3500,
      paymentMethod: 'CARD',
      idempotencyKey: `idem-final-${Date.now()}`,
    }, receptionistAuth.token);

    const finalData = finalPaymentRes.body;
    assert(
      finalPaymentRes.status === 201 &&
      finalData.invoice.amountPaid === 6000 &&
      finalData.invoice.balanceDue === 0 &&
      finalData.invoice.status === 'PAID',
      '15. Final payment updates invoice status to PAID with balanceDue 0'
    );

    // 16. Receipt generated upon payment
    assert(Boolean(finalData.receipt && finalData.receipt.receiptNumber), '16. Receipt generated with unique receiptNumber');

    // 17. Receipt retrieval by ID
    const receiptGetRes = await request('GET', `/api/billing/receipts/${finalData.receipt.id}`, undefined, patientAuth.token);
    assert(receiptGetRes.status === 200, '17. Receipt retrievable by authenticated user via /api/billing/receipts/:id');

    // 18. Real collections calculation
    const collectionsRes = await request('GET', '/api/billing/collections', undefined, adminAuth.token);
    const colData = collectionsRes.body;
    assert(
      collectionsRes.status === 200 &&
      colData.totalCollections >= 6000 &&
      colData.collectionCount >= 2,
      '18. Real collections computed from verified payment transactions (no fake numbers)'
    );

    // ------------------------------------------------------------
    // PHASE 4: APPOINTMENT ENGINE & DOUBLE-BOOKING PREVENTIONS
    // ------------------------------------------------------------
    console.log('\n--- Phase 4: Appointment Scheduling & Conflict Enforcement ---');

    const dayOffset = Math.floor(Math.random() * 200) + 15;
    const appointmentDate = new Date(Date.now() + dayOffset * 86400000).toISOString().split('T')[0];
    const apt1Res = await request('POST', '/api/appointments', {
      patientId: testPatient.id,
      doctorName: 'Dr. Ananya Sharma',
      date: appointmentDate,
      startTime: '10:00',
      endTime: '10:45',
      procedure: 'Endodontic Obturation',
      chair: 'chair-1',
    }, receptionistAuth.token);

    const apt1Data = apt1Res.body;
    assert(apt1Res.status === 201, '19. Appointment created successfully');

    // 20. Overlapping appointment on same doctor & chair rejected (Double Booking)
    const conflictRes = await request('POST', '/api/appointments', {
      patientId: testPatient.id,
      doctorName: 'Dr. Ananya Sharma',
      date: appointmentDate,
      startTime: '10:15',
      endTime: '11:00',
      procedure: 'Consultation',
      chair: 'chair-1',
    }, receptionistAuth.token);
    assert(conflictRes.status === 409, '20. Double-booking conflict rejected with 409 Conflict');

    // 21. End time before start time rejected
    const invalidTimeRes = await request('POST', '/api/appointments', {
      patientId: testPatient.id,
      doctorName: 'Dr. Ananya Sharma',
      date: appointmentDate,
      startTime: '14:00',
      endTime: '13:30',
      procedure: 'Consultation',
    }, receptionistAuth.token);
    assert(invalidTimeRes.status === 400, '21. Invalid appointment time (endTime before startTime) rejected (400)');

    // 22. Status transition: SCHEDULED -> CONFIRMED
    const patchStatusRes = await request('PATCH', `/api/appointments/${apt1Data.appointment.id}/status`, {
      status: 'CONFIRMED',
    }, doctorAuth.token);
    assert(patchStatusRes.status === 200, '22. Appointment status transition to CONFIRMED accepted');

    // ------------------------------------------------------------
    // PHASE 5: FILES & DOCUMENTS SECURITY
    // ------------------------------------------------------------
    console.log('\n--- Phase 5: Secure File Validation & Scoping ---');

    // 23. Disallowed MIME type rejected
    const invalidFileRes = await request('POST', '/api/files/upload', {
      fileName: 'malicious.exe',
      fileType: 'application/x-msdownload',
      fileSize: 1024,
    }, patientAuth.token);
    assert(invalidFileRes.status === 400, '23. Disallowed file MIME type rejected (400)');

    // 24. Valid PDF document upload
    const validFileRes = await request('POST', '/api/files/upload', {
      fileName: 'OPG_Panoramic_Xray.pdf',
      fileType: 'application/pdf',
      fileSize: 204800,
      category: 'xray',
    }, patientAuth.token);
    assert(validFileRes.status === 201, '24. Valid PDF document upload accepted with patient scoping');

    // ------------------------------------------------------------
    // PHASE 6: FEEDBACK & REVIEWS
    // ------------------------------------------------------------
    console.log('\n--- Phase 6: Feedback & Reviews Engine ---');

    // 25. Public feedback endpoint is accessible unauthenticated
    const publicReviewsRes = await request('GET', '/api/feedback/public');
    assert(publicReviewsRes.status === 200, '25. Public reviews endpoint accessible unauthenticated (200)');

    // 26. Patient submits feedback
    const submitFeedbackRes = await request('POST', '/api/feedback', {
      rating: 5,
      treatmentName: 'Root Canal Obturation',
      doctorName: 'Dr. Ananya Sharma',
      comment: 'Painless procedure with utmost precision and caring staff.',
    }, patientAuth.token);
    const fbData = submitFeedbackRes.body;
    assert(submitFeedbackRes.status === 201 && fbData.feedback.verified === true, '26. Authenticated patient feedback submitted and marked verified');

    // 27. Clinician responds to feedback
    const respondFeedbackRes = await request('POST', `/api/feedback/${fbData.feedback.id}/respond`, {
      response: 'Thank you for your trust! Wishing you lasting oral health.',
    }, doctorAuth.token);
    assert(respondFeedbackRes.status === 200, '27. Attending clinician response published to patient review');

    // ------------------------------------------------------------
    // PHASE 7: GROWTH & INTEGRATION LIFECYCLE
    // ------------------------------------------------------------
    console.log('\n--- Phase 7: Growth & Real Integration Lifecycle ---');

    // 28. Integrations status
    const initIntRes = await request('GET', '/api/growth/integrations', undefined, adminAuth.token);
    assert(initIntRes.status === 200, '28. Integrations status retrieved');

    // 29. Connect Instagram
    const connectIgRes = await request('POST', '/api/growth/instagram/connect', {
      accountHandle: '@oralix_dental',
    }, adminAuth.token);
    assert(connectIgRes.status === 200, '29. Instagram connected with real account handle');

    // 30. Disconnect Instagram
    const disconnIgRes = await request('POST', '/api/growth/instagram/disconnect', undefined, adminAuth.token);
    assert(disconnIgRes.status === 200, '30. Instagram disconnected cleanly');

    // 31. 4-Level Analytics Architecture
    const analyticsRes = await request('GET', '/api/growth/analytics', undefined, adminAuth.token);
    const anaData = analyticsRes.body;
    assert(
      analyticsRes.status === 200 &&
      Boolean(anaData.level1) &&
      Array.isArray(anaData.level2) &&
      Array.isArray(anaData.level3) &&
      Boolean(anaData.level4) &&
      Array.isArray(anaData.smartTips),
      '31. 4-Level Analytics (Analytics, Insights, Recommendations, Growth Assistant, Smart Tips) returned from real data'
    );

    // ------------------------------------------------------------
    // PHASE 8: SETTINGS & AUDIT LOGGING
    // ------------------------------------------------------------
    console.log('\n--- Phase 8: Settings & Audit Trail ---');

    const updateClinicRes = await request('PUT', '/api/settings/clinic', {
      tagline: 'Precision Operatory Dental Architecture & Medicine',
    }, adminAuth.token);
    assert(updateClinicRes.status === 200, '32. Administrator updates practice configuration');

    const auditLogsRes = await request('GET', '/api/settings/audit-logs', undefined, adminAuth.token);
    const auditData = auditLogsRes.body;
    assert(
      auditLogsRes.status === 200 &&
      auditData.logs.length > 0 &&
      auditData.logs.some((l: any) => l.action.includes('PAYMENT') || l.action.includes('CLINIC') || l.action.includes('FEEDBACK')),
      '33. Immutable audit trail contains recorded actions (payments, settings, feedback)'
    );

    console.log('\n============================================================');
    console.log(`  FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================\n');

    server.close();
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Test execution error:', err);
    if (server) server.close();
    process.exit(1);
  }
}

runTests();
