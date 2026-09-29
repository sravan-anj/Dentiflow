import React from 'react';
import { Invoice, Appointment, Patient } from '../../types';
import { useToast } from '../common/Toast';
import {
  BarChart3,
  Download,
  CheckCircle2,
  Calendar,
  Activity,
  PieChart,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface ReportsViewProps {
  invoices: Invoice[];
  appointments: Appointment[];
  patients: Patient[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  appointments,
  patients
}) => {
  const { showToast } = useToast();

  const totalRevenue = invoices.reduce((a, b) => a + (b.amountPaid || 0), 0);
  const totalBilled = invoices.reduce((a, b) => a + (b.totalAmount || b.total || 0), 0);
  const totalOutstanding = invoices.reduce((a, b) => a + (b.balanceDue || 0), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0;

  // Real Monthly Aggregations
  const monthlyGroups: Record<string, { billed: number; paid: number }> = {};
  invoices.forEach(inv => {
    const ym = (inv.date || '').substring(0, 7) || 'Current';
    if (!monthlyGroups[ym]) {
      monthlyGroups[ym] = { billed: 0, paid: 0 };
    }
    monthlyGroups[ym].billed += (inv.totalAmount || inv.total || 0);
    monthlyGroups[ym].paid += (inv.amountPaid || 0);
  });

  const monthlyBars = Object.entries(monthlyGroups).map(([month, data]) => {
    const maxVal = Math.max(data.billed, data.paid, 1);
    return {
      month,
      billedPct: Math.round((data.billed / maxVal) * 100),
      paidPct: Math.round((data.paid / maxVal) * 100),
      rev: `₹${(data.paid / 1000).toFixed(0)}k`,
      billed: data.billed,
      paid: data.paid,
    };
  }).sort((a, b) => a.month.localeCompare(b.month));

  // Real Chair Occupancy Metric
  const completedOrInChair = appointments.filter(a => a.status === 'in_chair' || a.status === 'completed');
  const chairOccupancyPct = appointments.length > 0 ? Math.min(100, Math.round((completedOrInChair.length / appointments.length) * 100)) : 0;

  // Real Average Consultation Duration
  const aptsWithDuration = appointments.filter(a => a.durationMinutes && a.durationMinutes > 0);
  const avgDuration = aptsWithDuration.length > 0
    ? Math.round(aptsWithDuration.reduce((acc, a) => acc + a.durationMinutes, 0) / aptsWithDuration.length)
    : 0;

  // Export CSV Production Report
  const handleExportData = () => {
    try {
      let csvContent = 'ORALIX PRACTICE PRODUCTION & ANALYTICS REPORT\n';
      csvContent += `Generated Date,${new Date().toLocaleString()}\n`;
      csvContent += `Total Active Patients,${patients.length}\n`;
      csvContent += `Total Scheduled Visits,${appointments.length}\n\n`;

      csvContent += 'FINANCIAL TELEMETRY SUMMARY\n';
      csvContent += `Gross Billed Production (INR),${totalBilled}\n`;
      csvContent += `Collections Realized (INR),${totalRevenue}\n`;
      csvContent += `Outstanding Balance (INR),${totalOutstanding}\n`;
      csvContent += `Collection Efficiency,${collectionRate}%\n\n`;

      csvContent += 'INVOICE FINANCIAL RECORDS\n';
      csvContent += 'Invoice #,Patient Name,Date,Description,Total Billed (INR),Amount Paid (INR),Balance Due (INR),Status\n';
      invoices.forEach(inv => {
        const desc = (inv.description || inv.items?.[0]?.description || '').replace(/"/g, '""');
        csvContent += `"${inv.invoiceNumber}","${inv.patientName}","${inv.date}","${desc}",${inv.totalAmount || inv.total || 0},${inv.amountPaid || 0},${inv.balanceDue || 0},"${inv.status}"\n`;
      });

      csvContent += '\nAPPOINTMENT CLINICAL RECORDS\n';
      csvContent += 'Appointment ID,Patient Name,Doctor,Chair,Date,Time,Procedure,Status\n';
      appointments.forEach(apt => {
        csvContent += `"${apt.id}","${apt.patientName}","${apt.doctorName}","${apt.chair}","${apt.date}","${apt.time}","${apt.procedure}","${apt.status}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Oralix_Production_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Exported Practice Production Report (CSV)', 'success');
    } catch (err) {
      console.error('Failed to generate report CSV:', err);
      showToast('Failed to export production report', 'error');
    }
  };

  // Financial Breakdown calculations for Donut Chart
  const paidSum = invoices.filter(i => i.status === 'paid').reduce((a, b) => a + (b.amountPaid || 0), 0);
  const partiallyPaidSum = invoices.filter(i => i.status === 'partially_paid' || i.status === 'partial').reduce((a, b) => a + (b.amountPaid || 0), 0);
  const outstandingSum = invoices.reduce((a, b) => a + (b.balanceDue || 0), 0);
  const totalFinancial = paidSum + partiallyPaidSum + outstandingSum || 1;

  const paidPct = Math.round((paidSum / totalFinancial) * 100);
  const partialPct = Math.round((partiallyPaidSum / totalFinancial) * 100);
  const outstandingPct = Math.max(0, 100 - paidPct - partialPct);

  const C = 251.327;
  const paidArc = (paidSum / totalFinancial) * C;
  const partialArc = (partiallyPaidSum / totalFinancial) * C;
  const outstandingArc = (outstandingSum / totalFinancial) * C;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8B58D]">
            ANALYTICS &bull; PRACTICE PERFORMANCE
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#252525]">
            Reports &amp; Metrics
          </h1>
          <p className="text-xs text-[#6F6D69]">
            Comprehensive financial, clinical productivity, and operatory chair utilization telemetry.
          </p>
        </div>

        <button
          onClick={handleExportData}
          disabled={invoices.length === 0 && appointments.length === 0}
          className="btn-primary text-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 text-[#252525]" />
          <span>Export Production Report</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Gross Clinic Production</div>
          <p className="text-2xl font-bold text-[#252525] mt-1">
            INR ₹{totalBilled.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#6F6D69] mt-1">
            {invoices.length} invoice(s) generated
          </p>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Collections Realized</div>
          <p className="text-2xl font-bold text-[#3B4D3A] mt-1">
            INR ₹{totalRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#6F6D69] mt-1">
            {collectionRate}% collection efficiency
          </p>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Chair Occupancy Rate</div>
          <p className="text-2xl font-bold text-[#252525] mt-1">{chairOccupancyPct}%</p>
          <p className="text-[11px] text-[#6F6D69] mt-1">
            {completedOrInChair.length} active of {appointments.length} scheduled visits
          </p>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Avg. Appointment Duration</div>
          <p className="text-2xl font-bold text-[#252525] mt-1">
            {avgDuration > 0 ? `${avgDuration} mins` : 'N/A'}
          </p>
          <p className="text-[11px] text-[#6F6D69] mt-1">
            {aptsWithDuration.length > 0 ? 'Across scheduled clinical procedures' : 'No visits recorded yet'}
          </p>
        </div>
      </div>

      {/* Visual Charts: Monthly Bar Graph + Financial Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Monthly Production Bar Graph */}
        <div className="lg:col-span-7 bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h2 className="text-sm font-bold text-[#252525]">Monthly Revenue &amp; Collections</h2>
              <p className="text-[11px] text-[#6F6D69]">Comparison of billed production vs settled payments</p>
            </div>
            <span className="text-xs font-bold text-[#3B4D3A] bg-[#8FA88D]/20 px-2 py-0.5 rounded-lg border border-[#8FA88D]/30">
              {monthlyBars.length > 0 ? 'Real Ledger Telemetry' : 'Empty State'}
            </span>
          </div>

          {/* Bar Chart Visualizer or Empty State */}
          <div className="pt-4 pb-2">
            {monthlyBars.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-[#6F6D69]">
                <CreditCard className="w-8 h-8 text-[#C8B58D] mb-2 opacity-70" />
                <p className="text-xs font-bold text-[#252525]">No monthly transaction records yet</p>
                <p className="text-[11px] text-[#6F6D69] mt-0.5">
                  Monthly gross production and revenue bars populate automatically as billing records are generated.
                </p>
              </div>
            ) : (
              <>
                <div className="h-48 flex items-end justify-between gap-3 sm:gap-6 px-2 border-b border-stone-200">
                  {monthlyBars.map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-bold text-[#252525]">{bar.rev}</span>
                      <div className="w-full max-w-[32px] flex items-end gap-1 h-36">
                        <div
                          style={{ height: `${Math.max(8, bar.billedPct)}%` }}
                          className="w-1/2 bg-[#C8B58D]/40 rounded-t transition-all hover:bg-[#C8B58D]/60"
                          title={`Billed: INR ₹${bar.billed.toLocaleString()}`}
                        />
                        <div
                          style={{ height: `${Math.max(8, bar.paidPct)}%` }}
                          className="w-1/2 bg-[#3B4D3A] rounded-t transition-all hover:bg-[#252525]"
                          title={`Paid: INR ₹${bar.paid.toLocaleString()}`}
                        />
                      </div>
                      <span className="text-[11px] text-[#6F6D69] font-semibold mt-1">
                        {bar.month}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-[#6F6D69]">
                    <span className="w-3 h-3 rounded bg-[#C8B58D]/40" />
                    Gross Billed
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-[#6F6D69]">
                    <span className="w-3 h-3 rounded bg-[#3B4D3A]" />
                    Collected Revenue
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Dynamic Monthly Revenue Pie / Donut Chart */}
        <div className="lg:col-span-5 bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="pb-3 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#252525] flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#C8B58D]" />
                <span>Financial Settlement Chart</span>
              </h2>
              <p className="text-[11px] text-[#6F6D69]">Real-time revenue distribution by invoice status</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#EDE8DE] text-[#252525] border border-[#C8B58D]/30">
              Live DB
            </span>
          </div>

          {/* SVG Donut Chart or Empty State */}
          {invoices.length === 0 ? (
            <div className="py-12 text-center text-[#6F6D69]">
              <PieChart className="w-8 h-8 text-[#C8B58D] mx-auto mb-2 opacity-70" />
              <p className="text-xs font-bold text-[#252525]">No invoice settlement data</p>
              <p className="text-[11px] text-[#6F6D69] mt-0.5">
                Settlement breakdown activates when patient invoices are generated.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#EDE8DE"
                    strokeWidth="16"
                    fill="transparent"
                  />

                  {paidArc > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#8FA88D"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={`${paidArc} ${C - paidArc}`}
                      strokeDashoffset={0}
                    />
                  )}

                  {partialArc > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#C5A66A"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={`${partialArc} ${C - partialArc}`}
                      strokeDashoffset={-paidArc}
                    />
                  )}

                  {outstandingArc > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#E5DDD0"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={`${outstandingArc} ${C - outstandingArc}`}
                      strokeDashoffset={-(paidArc + partialArc)}
                    />
                  )}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-lg font-black text-[#252525]">{paidPct}%</span>
                  <span className="text-[9px] uppercase font-bold text-[#6F6D69] tracking-wider">Settled</span>
                </div>
              </div>

              <div className="space-y-2 text-xs w-full sm:w-auto">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 font-bold text-[#252525]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8FA88D]" />
                    Paid in Full
                  </span>
                  <span className="font-extrabold text-[#252525]">₹{paidSum.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 font-bold text-[#252525]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C5A66A]" />
                    Partial Payments
                  </span>
                  <span className="font-extrabold text-[#252525]">₹{partiallyPaidSum.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 font-bold text-[#252525]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E5DDD0]" />
                    Outstanding
                  </span>
                  <span className="font-extrabold text-[#252525]">₹{outstandingSum.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-stone-200 text-[11px] text-[#6F6D69] flex items-center justify-between">
            <span>Overall Billed: <strong>INR ₹{totalBilled.toLocaleString()}</strong></span>
            <span>Realized: <strong>{collectionRate}%</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};
