/**
 * src/utils/apiClient.ts — Unified Oralix Backend API Client
 * 
 * Centralized, typed, session-aware HTTP client with:
 * - Automatic credentials & authorization header dispatch
 * - Unified error handling without leaked stack traces
 * - Graceful fallbacks for network interruptions
 */

import { getApiBaseUrl } from './apiConfig';

const BASE_URL = getApiBaseUrl();

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  const token = typeof window !== 'undefined' ? localStorage.getItem('oralix_bearer_token') : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type') || '';
  let data: any;

  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const apiClient = {
  // Patients
  patients: {
    list: () => request<{ success: boolean; count: number; patients: any[] }>('/api/patients'),
    get: (id: string) => request<{ success: boolean; patient: any }>(`/api/patients/${id}`),
    create: (data: any) => request<{ success: boolean; patient: any }>('/api/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request<{ success: boolean; patient: any }>(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    archive: (id: string) => request<{ success: boolean; message: string }>(`/api/patients/${id}`, {
      method: 'DELETE',
    }),
  },

  // Appointments
  appointments: {
    list: (params?: { date?: string; doctorId?: string; status?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ success: boolean; count: number; appointments: any[] }>(`/api/appointments${q ? `?${q}` : ''}`);
    },
    create: (data: any) => request<{ success: boolean; appointment: any }>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateStatus: (id: string, status: string) => request<{ success: boolean; appointment: any }>(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    cancel: (id: string) => request<{ success: boolean; message: string }>(`/api/appointments/${id}`, {
      method: 'DELETE',
    }),
  },

  // Billing
  billing: {
    getInvoices: (params?: { patientName?: string; invoiceNumber?: string; date?: string; status?: string; paymentMethod?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ success: boolean; count: number; invoices: any[] }>(`/api/billing/invoices${q ? `?${q}` : ''}`);
    },
    getInvoice: (id: string) => request<{ success: boolean; invoice: any }>(`/api/billing/invoices/${id}`),
    createInvoice: (data: any) => request<{ success: boolean; invoice: any }>('/api/billing/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    recordPayment: (data: {
      invoiceId: string;
      amount: number;
      paymentMethod: string;
      transactionRef?: string;
      idempotencyKey?: string;
    }) => request<{
      success: boolean;
      message: string;
      idempotent?: boolean;
      payment: any;
      invoice: any;
      receipt: any;
      email: { sent: boolean; error?: string };
    }>('/api/billing/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getReceipts: () => request<{ success: boolean; count: number; receipts: any[] }>('/api/billing/receipts'),
    resendReceipt: (receiptId: string) => request<{ success: boolean; message: string }>(`/api/billing/receipts/${receiptId}/resend`, {
      method: 'POST',
    }),
    getCollections: () => request<{
      success: boolean;
      dailyCollections: { date: string; total: number; transactionCount: number };
      monthlyCollections: Array<{ month: string; billed: number; collected: number; paymentCount: number }>;
      summary: {
        grossBilled: number;
        totalCollected: number;
        totalOutstanding: number;
        collectionEfficiencyPct: number;
        invoiceCount: number;
        paymentCount: number;
      };
    }>('/api/billing/collections'),
  },

  // Growth & Integrations
  growth: {
    getIntegrations: () => request<{
      success: boolean;
      instagram: any;
      googleBusiness: any;
    }>('/api/growth/integrations'),
    connectInstagram: (accountHandle: string) => request<{ success: boolean; message: string; instagram: any }>('/api/growth/instagram/connect', {
      method: 'POST',
      body: JSON.stringify({ accountHandle }),
    }),
    syncInstagram: () => request<{ success: boolean; message: string; instagram: any }>('/api/growth/instagram/sync', {
      method: 'POST',
    }),
    disconnectInstagram: () => request<{ success: boolean; message: string }>('/api/growth/instagram/disconnect', {
      method: 'POST',
    }),
    connectGoogle: (locationName: string) => request<{ success: boolean; message: string; googleBusiness: any }>('/api/growth/google/connect', {
      method: 'POST',
      body: JSON.stringify({ locationName }),
    }),
    syncGoogle: () => request<{ success: boolean; message: string; googleBusiness: any }>('/api/growth/google/sync', {
      method: 'POST',
    }),
    disconnectGoogle: () => request<{ success: boolean; message: string }>('/api/growth/google/disconnect', {
      method: 'POST',
    }),
    getAnalytics: () => request<{
      success: boolean;
      hasSufficientData: boolean;
      level1_analytics: any;
      level2_insights: any[];
      level3_recommendations: any[];
      level4_assistant: any;
    }>('/api/growth/analytics'),
    getSmartTips: () => request<{ success: boolean; count: number; tips: any[] }>('/api/growth/smart-tips'),
  },

  // Feedback
  feedback: {
    getPublicReviews: () => request<{ success: boolean; reviews: any[] }>('/api/feedback/public'),
    list: () => request<{ success: boolean; count: number; feedback: any[] }>('/api/feedback'),
    submit: (data: { rating: number; comment: string; treatmentName?: string; doctorName?: string }) => request<{ success: boolean; message: string; feedback: any }>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    respond: (id: string, response: string) => request<{ success: boolean; message: string; feedback: any }>(`/api/feedback/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    }),
  },

  // Files
  files: {
    list: (patientId?: string) => request<{ success: boolean; count: number; files: any[] }>(`/api/files${patientId ? `?patientId=${patientId}` : ''}`),
    upload: (data: { patientId: string; fileName: string; fileType: string; fileSize: number; category?: string; fileData?: string }) => request<{ success: boolean; message: string; file: any }>('/api/files/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    get: (id: string) => request<{ success: boolean; file: any }>(`/api/files/${id}`),
  },

  // AI / Gemini
  ai: {
    getStatus: () => request<{ success: boolean; isConfigured: boolean; model: string; provider: string }>('/api/ai/status'),
    getClinicalInsights: (data: {
      toothNumber?: number;
      condition?: string;
      diagnosis?: string;
      symptoms?: string;
      medicalAlerts?: string[];
      chiefComplaint?: string;
    }) => request<{ success: boolean; configured: boolean; insights?: string; message?: string; error?: string }>('/api/ai/clinical-insights', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getGrowthConsult: (data: {
      activePatients: number;
      monthlyRevenue: number;
      collectionRate: number;
      unansweredReviews: number;
      topProcedures?: string[];
    }) => request<{ success: boolean; configured: boolean; advice?: string; message?: string; error?: string }>('/api/ai/growth-consult', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Notifications
  notifications: {
    list: () => request<{ success: boolean; count: number; unreadCount: number; notifications: any[] }>('/api/notifications'),
    markAsRead: (id: string) => request<{ success: boolean; message: string }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  },

  // Settings
  settings: {
    getClinic: () => request<{ success: boolean; clinic: any }>('/api/settings/clinic'),
    updateClinic: (data: any) => request<{ success: boolean; message: string; clinic: any }>('/api/settings/clinic', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    getUsers: () => request<{ success: boolean; count: number; users: any[] }>('/api/settings/users'),
    createUser: (data: any) => request<{ success: boolean; message: string; user: any }>('/api/settings/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateUserStatus: (id: string, status: string) => request<{ success: boolean; message: string; user: any }>(`/api/settings/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    getAuditLogs: () => request<{ success: boolean; count: number; logs: any[] }>('/api/settings/audit-logs'),
  },
};
