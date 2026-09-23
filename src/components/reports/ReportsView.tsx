import React from 'react';
import { Invoice, Appointment, Patient } from '../../types';
import { useToast } from '../common/Toast';
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
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

  const totalRevenue = invoices.reduce((a, b) => a + b.amountPaid, 0);
  const totalBilled = invoices.reduce((a, b) => a + (b.totalAmount || b.total || 0), 0);
  const totalOutstanding = invoices.reduce((a, b) => a + b.balanceDue, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0;

  // Real CSV Production Report Exporter
  const handleExportData = () => {
    try {
      let csvContent = 'DENTIFLOW PRACTICE PRODUCTION & ANALYTICS REPORT\n';
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
        csvContent += `"${inv.invoiceNumber}","${inv.patientName}","${inv.date}","${desc}",${inv.totalAmount || inv.total},${inv.amountPaid},${inv.balanceDue},"${inv.status}"\n`;
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
      link.setAttribute('download', `DentiFlow_Production_Report_${new Date().toISOString().split('T')[0]}.csv`);
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
  const paidSum = invoices.filter(i => i.status === 'paid').reduce((a, b) => a + b.amountPaid, 0);
  const partiallyPaidSum = invoices.filter(i => i.status === 'partially_paid').reduce((a, b) => a + b.amountPaid, 0);
  const outstandingSum = invoices.reduce((a, b) => a + b.balanceDue, 0);
  const totalFinancial = paidSum + partiallyPaidSum + outstandingSum || 1;

  const paidPct = Math.round((paidSum / totalFinancial) * 100);
  const partialPct = Math.round((partiallyPaidSum / totalFinancial) * 100);
  const outstandingPct = Math.max(0, 100 - paidPct - partialPct);

  // Donut SVG Math (Radius R = 40, Circumference C = 251.327)
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
            Comprehensive financial, clinical productivity, and chair utilization telemetry.
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
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
          <p className="text-[11px] text-[#3B4D3A] font-semibold mt-1">
            +18.4% vs last month
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

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500">Operatory Chair Occupancy</div>
          <p className="text-2xl font-bold text-purple-600 mt-1">84.2%</p>
          <p className="text-[11px] text-gray-400 mt-1">Across 3 surgical chairs</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500">Avg. Consultation Time</div>
          <p className="text-2xl font-bold text-amber-600 mt-1">38 mins</p>
          <p className="text-[11px] text-gray-400 mt-1">Optimal turnover rate</p>
        </div>
      </div>

      {/* Visual Charts: Monthly Bar Graph + Financial Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Monthly Production Bar Graph */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Monthly Revenue &amp; Collections</h2>
              <p className="text-[11px] text-gray-500">Comparison of billed production vs settled payments</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Q3 Trending High
            </span>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="pt-4 pb-2">
            <div className="h-48 flex items-end justify-between gap-3 sm:gap-6 px-2 border-b border-gray-200">
              {[
                { month: 'Apr', billed: 65, paid: 55, rev: '₹1.8L' },
                { month: 'May', billed: 78, paid: 70, rev: '₹2.2L' },
                { month: 'Jun', billed: 72, paid: 64, rev: '₹2.0L' },
                { month: 'Jul', billed: 85, paid: 79, rev: '₹2.5L' },
                { month: 'Aug', billed: 92, paid: 88, rev: '₹2.8L' },
                { month: 'Sep (Current)', billed: 96, paid: 84, rev: `₹${(totalRevenue / 100000).toFixed(1)}L` }
              ].map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-bold text-gray-700">{bar.rev}</span>
                  <div className="w-full max-w-[32px] flex items-end gap-1 h-36">
                    <div
                      style={{ height: `${bar.billed}%` }}
                      className="w-1/2 bg-blue-200 rounded-t transition-all hover:bg-blue-300"
                      title={`Billed: ${bar.billed}%`}
                    />
                    <div
                      style={{ height: `${bar.paid}%` }}
                      className="w-1/2 bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                      title={`Paid: ${bar.paid}%`}
                    />
                  </div>
                  <span className="text-[11px] text-gray-500 font-semibold mt-1">
                    {bar.month}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-gray-600">
                <span className="w-3 h-3 rounded bg-blue-200" />
                Gross Production
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-gray-600">
                <span className="w-3 h-3 rounded bg-blue-600" />
                Collected Revenue
              </span>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Dynamic Monthly Revenue Pie / Donut Chart */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                <span>Financial Settlement Donut Chart</span>
              </h2>
              <p className="text-[11px] text-gray-500">Real-time revenue distribution by invoice settlement status</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Live DB
            </span>
          </div>

          {/* SVG Donut Chart */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background track */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e2e8f0"
                  strokeWidth="16"
                  fill="transparent"
                />

                {/* Paid Segment (Emerald) */}
                {paidArc > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray={`${paidArc} ${C - paidArc}`}
                    strokeDashoffset="0"
                    className="transition-all duration-500"
                  />
                )}

                {/* Partially Paid Segment (Amber) */}
                {partialArc > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f59e0b"
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray={`${partialArc} ${C - partialArc}`}
                    strokeDashoffset={`${-paidArc}`}
                    className="transition-all duration-500"
                  />
                )}

                {/* Outstanding Segment (Rose) */}
                {outstandingArc > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f43f5e"
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray={`${outstandingArc} ${C - outstandingArc}`}
                    strokeDashoffset={`${-(paidArc + partialArc)}`}
                    className="transition-all duration-500"
                  />
                )}
              </svg>

              {/* Center Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Efficiency</span>
                <span className="text-base font-black text-gray-900">{collectionRate}%</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-2.5 text-xs w-full max-w-[200px]">
              <div className="flex items-center justify-between p-2 rounded bg-emerald-50 border border-emerald-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-emerald-950">Paid</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-950 block">₹{paidSum.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">{paidPct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-semibold text-amber-950">Partially Paid</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-950 block">₹{partiallyPaidSum.toLocaleString()}</span>
                  <span className="text-[10px] text-amber-700 font-semibold">{partialPct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-rose-50 border border-rose-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-semibold text-rose-950">Outstanding</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-950 block">₹{outstandingSum.toLocaleString()}</span>
                  <span className="text-[10px] text-rose-700 font-semibold">{outstandingPct}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600 flex items-center justify-between">
            <span className="font-semibold">Total Tracked Invoices: {invoices.length}</span>
            <span className="font-bold text-blue-600">INR ₹{totalBilled.toLocaleString()}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
