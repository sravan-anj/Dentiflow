import { Invoice, TreatmentPlan, Patient } from '../types';

/**
 * Clean helper to escape special characters for PDF text literal syntax
 */
function escapePdfText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Formats currency values cleanly for PDF documents
 */
function formatCurrency(amount: number): string {
  return `INR ${amount.toLocaleString('en-IN')}`;
}

/**
 * Minimal, zero-dependency PDF 1.4 binary generator.
 * Builds raw PDF document structures directly into binary Blobs for immediate client-side download.
 */
class SimplePdfBuilder {
  private contentStream: string[] = [];

  constructor() {}

  // PDF Page is A4 size: 595.28 pt width x 841.89 pt height
  // Coordinates start at bottom-left (0,0). Top margin starts around y = 800.

  public addText(
    text: string,
    x: number,
    y: number,
    size: number = 10,
    font: 'Helvetica' | 'Helvetica-Bold' = 'Helvetica',
    color: [number, number, number] = [0.06, 0.09, 0.16] // Default dark slate
  ): void {
    const fontRef = font === 'Helvetica-Bold' ? '/F2' : '/F1';
    const escaped = escapePdfText(text);
    const [r, g, b] = color;
    this.contentStream.push(
      `BT ${fontRef} ${size} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escaped}) Tj ET`
    );
  }

  public addLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: [number, number, number] = [0.8, 0.83, 0.88],
    lineWidth: number = 1
  ): void {
    const [r, g, b] = color;
    this.contentStream.push(
      `${lineWidth} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`
    );
  }

  public addRect(
    x: number,
    y: number,
    w: number,
    h: number,
    fillColor?: [number, number, number],
    strokeColor?: [number, number, number],
    strokeWidth: number = 1
  ): void {
    let cmd = '';
    if (fillColor) {
      const [r, g, b] = fillColor;
      cmd += `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg `;
    }
    if (strokeColor) {
      const [r, g, b] = strokeColor;
      cmd += `${strokeWidth} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG `;
    }
    cmd += `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re `;
    if (fillColor && strokeColor) {
      cmd += 'B';
    } else if (fillColor) {
      cmd += 'f';
    } else if (strokeColor) {
      cmd += 'S';
    }
    this.contentStream.push(cmd);
  }

  public buildBlob(filename: string): Blob {
    const streamText = this.contentStream.join('\n');
    const streamLength = streamText.length;

    // Build PDF objects manually following PDF 1.4 spec
    const objects: string[] = [];

    // Obj 1: Catalog
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

    // Obj 2: Pages
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');

    // Obj 3: Page (A4: 595.28 x 841.89)
    objects.push(
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj'
    );

    // Obj 4: Font Helvetica
    objects.push(
      '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj'
    );

    // Obj 5: Font Helvetica-Bold
    objects.push(
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj'
    );

    // Obj 6: Contents Stream
    objects.push(
      `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamText}\nendstream\nendobj`
    );

    let pdfBody = '%PDF-1.4\n';
    const offsets: number[] = [0]; // 0-indexed

    objects.forEach(obj => {
      offsets.push(pdfBody.length);
      pdfBody += obj + '\n';
    });

    const xrefStart = pdfBody.length;
    pdfBody += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

    for (let i = 1; i <= objects.length; i++) {
      const off = offsets[i].toString().padStart(10, '0');
      pdfBody += `${off} 00000 n \n`;
    }

    pdfBody += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return new Blob([pdfBody], { type: 'application/pdf' });
  }

  public download(filename: string): void {
    const blob = this.buildBlob(filename);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Direct Download Generator for Tax Invoices
 */
export function downloadTaxInvoicePdfBlob(invoice: Invoice, patient?: Patient | null): void {
  const pdf = new SimplePdfBuilder();

  // Top Accent Banner (Navy Blue Header)
  pdf.addRect(0, 791.89, 595.28, 50, [0.01, 0.52, 0.78]); // Sky/Blue bar

  // Clinic Header Branding
  pdf.addText('ORALIX ADVANCED DENTAL MEDICINE', 40, 800, 16, 'Helvetica-Bold', [1, 1, 1]);
  pdf.addText('TAX INVOICE & OFFICIAL GST RECEIPT', 40, 765, 11, 'Helvetica-Bold', [0.01, 0.52, 0.78]);
  pdf.addText('DCI Reg: DCI-KA-2019-8842  |  GSTIN: 29AABCD1234E1Z5', 40, 750, 9, 'Helvetica', [0.4, 0.45, 0.5]);
  pdf.addText('Suite 402, 100 Feet Road, Medical Enclave, Bengaluru - 560038 | Tel: +91 80 2990 8820', 40, 738, 8, 'Helvetica', [0.5, 0.55, 0.6]);

  pdf.addLine(40, 725, 555.28, 725, [0.85, 0.88, 0.92], 1);

  // Invoice & Patient Metadata Card
  pdf.addRect(40, 630, 515.28, 85, [0.97, 0.98, 1.0], [0.85, 0.88, 0.92], 1);

  // Left Column - Patient Meta
  const patientName = patient?.name || invoice.patientName;
  const patientCode = patient?.code || invoice.patientCode || 'DF-2026-PAT';
  const phone = patient?.phone || '+91 98765 43210';

  pdf.addText('BILL TO PATIENT:', 55, 698, 9, 'Helvetica-Bold', [0.3, 0.35, 0.45]);
  pdf.addText(patientName, 55, 683, 12, 'Helvetica-Bold', [0.06, 0.09, 0.16]);
  pdf.addText(`Patient ID: ${patientCode}`, 55, 668, 9, 'Helvetica', [0.3, 0.35, 0.45]);
  pdf.addText(`Contact Phone: ${phone}`, 55, 654, 9, 'Helvetica', [0.3, 0.35, 0.45]);
  pdf.addText(`Address: ${patient?.address || 'Bengaluru, Karnataka, India'}`, 55, 640, 8, 'Helvetica', [0.4, 0.45, 0.5]);

  // Right Column - Invoice Meta
  const statusColor: [number, number, number] = invoice.status === 'paid' 
    ? [0.08, 0.5, 0.24] 
    : invoice.status === 'partial' 
    ? [0.8, 0.45, 0.05] 
    : [0.85, 0.15, 0.15];

  pdf.addText(`INVOICE NO:`, 360, 698, 9, 'Helvetica-Bold', [0.3, 0.35, 0.45]);
  pdf.addText(invoice.invoiceNumber, 440, 698, 10, 'Helvetica-Bold', [0.01, 0.52, 0.78]);

  pdf.addText(`Invoice Date:`, 360, 683, 9, 'Helvetica', [0.3, 0.35, 0.45]);
  pdf.addText(invoice.date || new Date().toISOString().split('T')[0], 440, 683, 9, 'Helvetica-Bold', [0.1, 0.15, 0.2]);

  pdf.addText(`Due Date:`, 360, 668, 9, 'Helvetica', [0.3, 0.35, 0.45]);
  pdf.addText(invoice.dueDate || 'Upon Receipt', 440, 668, 9, 'Helvetica', [0.1, 0.15, 0.2]);

  pdf.addText(`Payment Status:`, 360, 653, 9, 'Helvetica-Bold', [0.3, 0.35, 0.45]);
  pdf.addText(invoice.status.toUpperCase(), 440, 653, 10, 'Helvetica-Bold', statusColor);

  // Table Header
  const tableTop = 590;
  pdf.addRect(40, tableTop, 515.28, 24, [0.06, 0.09, 0.16]); // Dark table header
  pdf.addText('SL', 50, tableTop + 7, 9, 'Helvetica-Bold', [1, 1, 1]);
  pdf.addText('DESCRIPTION / DENTAL PROCEDURE', 80, tableTop + 7, 9, 'Helvetica-Bold', [1, 1, 1]);
  pdf.addText('QTY', 340, tableTop + 7, 9, 'Helvetica-Bold', [1, 1, 1]);
  pdf.addText('RATE', 400, tableTop + 7, 9, 'Helvetica-Bold', [1, 1, 1]);
  pdf.addText('TOTAL (INR)', 480, tableTop + 7, 9, 'Helvetica-Bold', [1, 1, 1]);

  // Table Rows
  let currentY = tableTop - 25;
  const items = invoice.items && invoice.items.length > 0 
    ? invoice.items 
    : [
        {
          description: invoice.description || 'Comprehensive Dental Procedure & Operatory Care',
          quantity: 1,
          unitPrice: invoice.totalAmount || invoice.total || 0,
          total: invoice.totalAmount || invoice.total || 0
        }
      ];

  items.forEach((item, idx) => {
    pdf.addRect(40, currentY - 5, 515.28, 24, idx % 2 === 0 ? [0.98, 0.99, 1.0] : [1, 1, 1]);
    pdf.addText(`${idx + 1}`, 50, currentY + 3, 9, 'Helvetica', [0.3, 0.35, 0.4]);
    pdf.addText(item.description, 80, currentY + 3, 9, 'Helvetica-Bold', [0.1, 0.12, 0.18]);
    pdf.addText(`${item.quantity || 1}`, 345, currentY + 3, 9, 'Helvetica', [0.3, 0.35, 0.4]);
    pdf.addText(`${(item.unitPrice || item.total).toLocaleString('en-IN')}`, 400, currentY + 3, 9, 'Helvetica', [0.3, 0.35, 0.4]);
    pdf.addText(`${item.total.toLocaleString('en-IN')}`, 480, currentY + 3, 9, 'Helvetica-Bold', [0.1, 0.12, 0.18]);
    currentY -= 26;
  });

  pdf.addLine(40, currentY, 555.28, currentY, [0.8, 0.83, 0.88], 1);

  // Summary Financial Box
  const totalBilled = invoice.totalAmount || invoice.total || 0;
  const paid = invoice.amountPaid || 0;
  const due = invoice.balanceDue;

  currentY -= 25;
  const summaryBoxX = 320;
  const summaryWidth = 235.28;

  pdf.addRect(summaryBoxX, currentY - 80, summaryWidth, 95, [0.96, 0.98, 1.0], [0.85, 0.88, 0.92], 1);

  pdf.addText('Gross Treatment Total:', summaryBoxX + 15, currentY, 9, 'Helvetica', [0.3, 0.35, 0.45]);
  pdf.addText(formatCurrency(totalBilled), summaryBoxX + 140, currentY, 9, 'Helvetica-Bold', [0.1, 0.12, 0.18]);

  pdf.addText('GST / Tax (Exempt 0%):', summaryBoxX + 15, currentY - 18, 9, 'Helvetica', [0.3, 0.35, 0.45]);
  pdf.addText('INR 0.00', summaryBoxX + 140, currentY - 18, 9, 'Helvetica', [0.3, 0.35, 0.45]);

  pdf.addText('Total Amount Paid:', summaryBoxX + 15, currentY - 36, 9, 'Helvetica-Bold', [0.08, 0.5, 0.24]);
  pdf.addText(formatCurrency(paid), summaryBoxX + 140, currentY - 36, 9, 'Helvetica-Bold', [0.08, 0.5, 0.24]);

  pdf.addLine(summaryBoxX + 10, currentY - 48, summaryBoxX + summaryWidth - 10, currentY - 48, [0.8, 0.83, 0.88], 1);

  pdf.addText('Balance Due / Outstanding:', summaryBoxX + 15, currentY - 65, 10, 'Helvetica-Bold', due > 0 ? [0.8, 0.45, 0.05] : [0.1, 0.12, 0.18]);
  pdf.addText(formatCurrency(due), summaryBoxX + 140, currentY - 65, 11, 'Helvetica-Bold', due > 0 ? [0.8, 0.45, 0.05] : [0.08, 0.5, 0.24]);

  // Payment Record / Security Note
  pdf.addText('PAYMENT & REIMBURSEMENT NOTES:', 40, currentY, 9, 'Helvetica-Bold', [0.3, 0.35, 0.45]);
  pdf.addText(`Method: ${invoice.paymentMethod || 'Online UPI / Card Settlement'}`, 40, currentY - 16, 8, 'Helvetica', [0.4, 0.45, 0.5]);
  pdf.addText('• Eligible for Section 80D Income Tax Medical Deduction.', 40, currentY - 30, 8, 'Helvetica', [0.4, 0.45, 0.5]);
  pdf.addText('• Accepted for direct cashless dental insurance reimbursement.', 40, currentY - 44, 8, 'Helvetica', [0.4, 0.45, 0.5]);
  pdf.addText('• Computer generated tax receipt. Authenticated via Oralix API.', 40, currentY - 58, 8, 'Helvetica', [0.4, 0.45, 0.5]);

  // Bottom Footer
  pdf.addLine(40, 60, 555.28, 60, [0.85, 0.88, 0.92], 1);
  pdf.addText('Oralix Dental Intelligence Platform • HIPAA & Digital Personal Data Protection Compliant', 40, 45, 8, 'Helvetica', [0.5, 0.55, 0.6]);
  pdf.addText(`Generated for ${patientName} on ${new Date().toLocaleDateString('en-IN')}`, 40, 32, 8, 'Helvetica', [0.6, 0.65, 0.7]);

  pdf.download(`Tax_Invoice_${invoice.invoiceNumber}.pdf`);
}

/**
 * Direct Download Generator for Treatment Plans
 */
export function downloadTreatmentPlanPdfBlob(plan: TreatmentPlan, patient?: Patient | null): void {
  const pdf = new SimplePdfBuilder();

  // Top Header Accent
  pdf.addRect(0, 791.89, 595.28, 50, [0.01, 0.52, 0.78]);

  // Header Title
  pdf.addText('ORALIX CLINICAL CARE ROADMAP', 40, 800, 16, 'Helvetica-Bold', [1, 1, 1]);
  pdf.addText('PATIENT TREATMENT PLAN & FINANCIAL ESTIMATE', 40, 765, 11, 'Helvetica-Bold', [0.01, 0.52, 0.78]);
  pdf.addText('Clinical Operatory Protocol  |  Practice License: DCI-KA-2019-8842', 40, 750, 9, 'Helvetica', [0.4, 0.45, 0.5]);

  pdf.addLine(40, 735, 555.28, 735, [0.85, 0.88, 0.92], 1);

  // Meta Box
  pdf.addRect(40, 640, 515.28, 80, [0.97, 0.98, 1.0], [0.85, 0.88, 0.92], 1);

  const patientName = patient?.name || plan.patientName;
  const patientCode = patient?.code || 'DF-2026-PAT';

  pdf.addText(`Patient Name: ${patientName}`, 55, 705, 11, 'Helvetica-Bold', [0.06, 0.09, 0.16]);
  pdf.addText(`Patient Record Code: ${patientCode}`, 55, 690, 9, 'Helvetica', [0.3, 0.35, 0.45]);
  pdf.addText(`Attending Dentist: ${plan.doctorName || 'Dr. Ananya Sharma'}`, 55, 675, 9, 'Helvetica', [0.3, 0.35, 0.45]);
  pdf.addText(`Date Prescribed: ${plan.dateCreated || new Date().toISOString().split('T')[0]}`, 55, 660, 9, 'Helvetica', [0.3, 0.35, 0.45]);

  pdf.addText(`Plan Title:`, 350, 705, 9, 'Helvetica-Bold', [0.3, 0.35, 0.45]);
  pdf.addText(plan.title, 410, 705, 9, 'Helvetica-Bold', [0.01, 0.52, 0.78]);

  pdf.addText(`Phase:`, 350, 690, 9, 'Helvetica-Bold', [0.3, 0.35, 0.45]);
  pdf.addText(plan.phase, 410, 690, 9, 'Helvetica', [0.2, 0.25, 0.3]);

  pdf.addText(`Plan Status:`, 350, 675, 9, 'Helvetica-Bold', [0.3, 0.35, 0.45]);
  pdf.addText(plan.status.toUpperCase(), 410, 675, 9, 'Helvetica-Bold', [0.08, 0.5, 0.24]);

  // Procedures Table
  const tableTop = 600;
  pdf.addRect(40, tableTop, 515.28, 24, [0.06, 0.09, 0.16]);
  pdf.addText('TOOTH #', 50, tableTop + 7, 9, 'Helvetica-Bold', [1, 1, 1]);
  pdf.addText('PRESCRIBED PROCEDURE', 130, tableTop + 7, 9, 'Helvetica-Bold', [1, 1, 1]);
  pdf.addText('CDT CODE', 370, tableTop + 7, 9, 'Helvetica-Bold', [1, 1, 1]);
  pdf.addText('FEE (INR)', 480, tableTop + 7, 9, 'Helvetica-Bold', [1, 1, 1]);

  let currentY = tableTop - 25;
  plan.procedures.forEach((proc, idx) => {
    pdf.addRect(40, currentY - 5, 515.28, 24, idx % 2 === 0 ? [0.98, 0.99, 1.0] : [1, 1, 1]);
    pdf.addText(proc.toothNumber ? `#${proc.toothNumber}` : 'General', 50, currentY + 3, 9, 'Helvetica-Bold', [0.01, 0.52, 0.78]);
    pdf.addText(proc.name, 130, currentY + 3, 9, 'Helvetica-Bold', [0.1, 0.12, 0.18]);
    pdf.addText(proc.code || 'D2750', 370, currentY + 3, 9, 'Helvetica', [0.3, 0.35, 0.45]);
    pdf.addText(`${proc.fee.toLocaleString('en-IN')}`, 480, currentY + 3, 9, 'Helvetica-Bold', [0.1, 0.12, 0.18]);
    currentY -= 26;
  });

  pdf.addLine(40, currentY, 555.28, currentY, [0.8, 0.83, 0.88], 1);

  // Financial Breakdown Box
  currentY -= 25;
  pdf.addRect(40, currentY - 80, 515.28, 95, [0.96, 0.98, 1.0], [0.85, 0.88, 0.92], 1);

  pdf.addText('FINANCIAL ESTIMATE & COVERAGE BREAKDOWN:', 55, currentY, 10, 'Helvetica-Bold', [0.06, 0.09, 0.16]);

  pdf.addText('Gross Treatment Procedure Fee:', 55, currentY - 20, 9, 'Helvetica', [0.3, 0.35, 0.45]);
  pdf.addText(formatCurrency(plan.totalCost), 260, currentY - 20, 9, 'Helvetica-Bold', [0.1, 0.12, 0.18]);

  pdf.addText('Clinic Courtesy Discount:', 55, currentY - 35, 9, 'Helvetica', [0.08, 0.5, 0.24]);
  pdf.addText(`- ${formatCurrency(plan.discount || 0)}`, 260, currentY - 35, 9, 'Helvetica-Bold', [0.08, 0.5, 0.24]);

  pdf.addText('Estimated Insurance Coverage:', 55, currentY - 50, 9, 'Helvetica', [0.01, 0.52, 0.78]);
  pdf.addText(`- ${formatCurrency(plan.insuranceCovered || 0)}`, 260, currentY - 50, 9, 'Helvetica-Bold', [0.01, 0.52, 0.78]);

  pdf.addLine(55, currentY - 58, 540, currentY - 58, [0.8, 0.83, 0.88], 1);

  pdf.addText('ESTIMATED PATIENT OUT-OF-POCKET:', 55, currentY - 72, 10, 'Helvetica-Bold', [0.01, 0.52, 0.78]);
  pdf.addText(formatCurrency(plan.patientPortion), 260, currentY - 72, 12, 'Helvetica-Bold', [0.01, 0.52, 0.78]);

  // Financing terms box
  pdf.addText('0% Interest EMI Financing Options Available: 3 Months @ INR ' + Math.round(plan.patientPortion / 3).toLocaleString('en-IN') + '/mo  |  6 Months @ INR ' + Math.round(plan.patientPortion / 6).toLocaleString('en-IN') + '/mo', 55, currentY - 95, 8, 'Helvetica', [0.4, 0.45, 0.5]);

  // Footer
  pdf.addLine(40, 60, 555.28, 60, [0.85, 0.88, 0.92], 1);
  pdf.addText('Oralix Dental Intelligence Platform • Official Clinical Treatment Plan Document', 40, 45, 8, 'Helvetica', [0.5, 0.55, 0.6]);
  pdf.addText(`Plan Verification Hash ID: ${plan.id}`, 40, 32, 8, 'Helvetica', [0.6, 0.65, 0.7]);

  pdf.download(`Treatment_Plan_${plan.id}.pdf`);
}
