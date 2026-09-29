/**
 * src/server/routes/aiRouter.ts — Oralix Server-Side Gemini AI Engine
 * 
 * Provides safe, structured clinical and practice insights:
 * - Structured prompt ingestion (Chief complaint, vitals, findings)
 * - Clear tri-part output: DATA, INTERPRETATION, RECOMMENDATION
 * - Safe handling when GEMINI_API_KEY is not configured (no fake responses)
 * - Read-only guarantee: never alters authoritative database values
 */

import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { AuthenticatedRequest } from '../db.ts';

const router = Router();

function requireAuth(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

/**
 * GET /api/ai/status
 */
router.get('/status', requireAuth, (_req, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0 && !apiKey.includes('YOUR_'));
  res.json({
    success: true,
    isConfigured,
    model: 'gemini-2.5-flash',
    provider: 'Google Gemini',
  });
});

/**
 * POST /api/ai/clinical-insights
 * Ingests structured clinical case data and generates clinical considerations
 */
router.post('/clinical-insights', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'doctor' && user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: AI clinical analysis is restricted to licensed clinicians.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('YOUR_')) {
    res.status(200).json({
      success: false,
      configured: false,
      message: 'Gemini AI API key is not configured in clinic environment. Set GEMINI_API_KEY in .env to activate live clinical intelligence.',
    });
    return;
  }

  const { toothNumber, condition, diagnosis, symptoms, medicalAlerts, chiefComplaint } = req.body;

  const prompt = `You are a clinical decision support assistant for Oralix Dental Practice.
Analyze the following patient clinical presentation carefully.

CLINICAL CASE DATA:
- Tooth Number: ${toothNumber || 'Unspecified'}
- Observed Condition: ${condition || 'General'}
- Preliminary Diagnosis: ${diagnosis || 'Under evaluation'}
- Reported Symptoms: ${symptoms || 'None specified'}
- Relevant Medical Alerts / Allergies: ${Array.isArray(medicalAlerts) ? medicalAlerts.join(', ') : medicalAlerts || 'None reported'}
- Chief Complaint: ${chiefComplaint || 'Routine examination'}

Respond STRICTLY in three clearly demarcated sections:
1. [DATA]: A concise summary of the documented objective clinical findings and pertinent medical history.
2. [INTERPRETATION]: Differential clinical considerations and diagnostic factors for the dentist to consider.
3. [RECOMMENDATION]: Standard evidence-based dental procedural options and safety considerations (e.g. antibiotic contraindications or local anesthetic precautions).

Do NOT invent fictitious patient details or claim authoritative medical diagnosis. The dentist remains the sole clinical decision maker.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const outputText = response.text || '';

    res.json({
      success: true,
      configured: true,
      model: 'gemini-2.5-flash',
      insights: outputText,
      disclaimer: 'AI insights are clinical recommendations only. Authoritative diagnosis is established by the attending dentist.',
    });
  } catch (err: any) {
    console.error('[Oralix AI] Error calling Gemini API:', err);
    res.status(502).json({
      success: false,
      configured: true,
      error: err?.message || 'Failed to communicate with Gemini AI API.',
    });
  }
});

/**
 * POST /api/ai/growth-consult
 * Generates practice growth considerations based on structured clinic metrics
 */
router.post('/growth-consult', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Practice growth intelligence is restricted to clinic administrators.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('YOUR_')) {
    res.status(200).json({
      success: false,
      configured: false,
      message: 'Gemini AI API key is not configured. Set GEMINI_API_KEY in .env to activate practice growth assistant.',
    });
    return;
  }

  const { activePatients, monthlyRevenue, collectionRate, unansweredReviews, topProcedures } = req.body;

  const prompt = `You are the Practice Growth Advisor for Oralix Dental Medicine.
Analyze the following real clinic metrics:
- Active Patients: ${activePatients}
- Current Month Collections: INR ${monthlyRevenue}
- Collection Efficiency: ${collectionRate}%
- Unanswered Reviews: ${unansweredReviews}
- Top Procedures: ${Array.isArray(topProcedures) ? topProcedures.join(', ') : 'Restorative and Endodontics'}

Provide three structured sections:
1. [DATA]: Summary of the practice operational metrics.
2. [INTERPRETATION]: Analysis of operational bottlenecks, patient retention, and revenue leaks.
3. [RECOMMENDATION]: Three concrete, ethical dental practice actions for the upcoming week.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      configured: true,
      advice: response.text || '',
    });
  } catch (err: any) {
    console.error('[Oralix AI] Error calling Gemini API:', err);
    res.status(502).json({
      success: false,
      configured: true,
      error: err?.message || 'Failed to communicate with Gemini AI API.',
    });
  }
});

export default router;
