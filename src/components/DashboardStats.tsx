import React from 'react';
import { LoanContract } from '../types/loan';
import { calculateLoanSummary, formatCurrency } from '../utils/loanCalculations';
import { AlertTriangle, Clock, CheckCircle2, DollarSign } from 'lucide-react';

interface DashboardStatsProps {
  contracts: LoanContract[];
  onSelectStatusFilter: (status: any) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  contracts,
  onSelectStatusFilter,
}) => {
  // Aggregate calculations
  let totalLoanAmount = 0;
  let totalSettledAmount = 0;
  let totalRemainingDebt = 0;
  let overdueCount = 0;
  let overdueDebt = 0;
  let dueSoonCount = 0;
  let settledCount = 0;

  contracts.forEach(contract => {
    const summary = calculateLoanSummary(contract);
    totalLoanAmount += contract.loanAmount;
    totalSettledAmount += summary.totalSettled;
    totalRemainingDebt += summary.remainingDebt;

    if (summary.status === 'overdue') {
      overdueCount++;
      overdueDebt += summary.remainingDebt;
    } else if (summary.status === 'due_soon') {
      dueSoonCount++;
    } else if (summary.status === 'settled') {
      settledCount++;
    }
  });

  const recoveryRate = totalLoanAmount > 0 ? (totalSettledAmount / totalLoanAmount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Overdue Alert Banner if overdue loans exist */}
      {overdueCount > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-950 dark:text-rose-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/60 rounded-lg text-rose-700 dark:text-rose-300 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                ตรวจพบสัญญายืมเงินเกินกำหนดส่งใช้ {overdueCount} รายการ (ยอดหนี้ค้างชำระ ฿{formatCurrency(overdueDebt)})
              </p>
              <p className="text-xs text-rose-800 dark:text-rose-300/80 mt-0.5">
                ตามระเบียบเงินยืมราชการ ต้องส่งใช้ภายใน 15-30 วัน กรุณาตรวจสอบและติดตามการส่งใช้เงินยืม
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelectStatusFilter('overdue')}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-900 dark:text-rose-200 bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer border border-rose-200 dark:border-rose-800"
            >
              ดูรายการเกินกำหนด
            </button>
          </div>
        </div>
      )}

      {/* Due Soon Advisory Banner */}
      {dueSoonCount > 0 && overdueCount === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3.5 flex items-center justify-between text-amber-950 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-sm">
              มีสัญญายืมเงินใกล้ครบกำหนดส่งใช้ (ภายใน 7 วัน) จำนวน <span className="font-semibold">{dueSoonCount} รายการ</span>
            </span>
          </div>
          <button
            onClick={() => onSelectStatusFilter('due_soon')}
            className="text-xs font-semibold text-amber-900 dark:text-amber-300 underline hover:text-amber-800 cursor-pointer"
          >
            แสดงรายการ
          </button>
        </div>
      )}

      {/* Grid of Key Financial Statistics with 3D/HTML Theme styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Stat 1: Total Loan Budget (Hero Card) */}
        <div 
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-xl transition-all duration-300 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(140deg, #4F46E5 0%, #7C3AED 48%, #DB2777 100%)',
            boxShadow: '0 16px 38px rgba(109,40,217,.32)',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-2.5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/25">
              {contracts.length} สัญญา
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-xs text-white/80 font-medium">วงเงินยืมรวมทั้งสิ้น</div>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums">
              ฿{formatCurrency(totalLoanAmount)}
            </div>
            <div className="mt-2 text-2xs text-white/75">
              ทะเบียนคุมเงินนอกงบประมาณ
            </div>
          </div>
        </div>

        {/* Stat 2: Total Settled / Repaid (Keep Green!) */}
        <div 
          className="relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 shadow-sm"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--line)',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
              style={{
                background: 'linear-gradient(140deg, #059669, #14B8A6)',
                boxShadow: '0 8px 18px rgba(20,184,166,0.35)',
              }}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {recoveryRate.toFixed(1)}%
            </span>
          </div>
          <div>
            <div className="text-xs text-[var(--muted)] font-medium">ส่งใช้คืนแล้ว (เงินสด/ใบสำคัญ)</div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              ฿{formatCurrency(totalSettledAmount)}
            </div>
            <div className="w-full bg-[var(--surface-3)] h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700"
                style={{ 
                  width: `${Math.min(recoveryRate, 100)}%`,
                  background: 'linear-gradient(90deg, #059669, #14B8A6)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Stat 3: Total Remaining Debt */}
        <div 
          className="relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 shadow-sm"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--line)',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
              style={{
                background: 'linear-gradient(140deg, #38BDF8, #4F46E5)',
                boxShadow: '0 8px 18px rgba(79,70,229,0.25)',
              }}
            >
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-2xs font-medium text-[var(--muted)]">ค้างชำระ</span>
          </div>
          <div>
            <div className="text-xs text-[var(--muted)] font-medium">ยอดหนี้คงค้างในระบบ</div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[var(--ink)]">
              ฿{formatCurrency(totalRemainingDebt)}
            </div>
            <div className="mt-2 text-2xs text-[var(--muted)]">
              คิดเป็น {(100 - recoveryRate).toFixed(1)}% ของยอดเงินยืม
            </div>
          </div>
        </div>

        {/* Stat 4: Overdue Loans */}
        <div
          onClick={() => onSelectStatusFilter('overdue')}
          className="relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 shadow-sm cursor-pointer hover:border-rose-300 dark:hover:border-rose-700"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: overdueCount > 0 ? 'rgba(244,63,94,0.3)' : 'var(--line)',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
              style={{
                background: 'linear-gradient(140deg, #FB7185, #F43F5E)',
                boxShadow: '0 8px 18px rgba(244,63,94,0.3)',
              }}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            {overdueCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </div>
          <div>
            <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold">เกินกำหนดส่งใช้</div>
            <div className="mt-1 text-2xl font-extrabold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {overdueCount} <span className="text-xs font-normal">สัญญา</span>
            </div>
            <div className="mt-2 text-2xs text-rose-600/80 dark:text-rose-400/80 font-mono tabular-nums truncate">
              ยอดค้าง ฿{formatCurrency(overdueDebt)}
            </div>
          </div>
        </div>

        {/* Stat 5: Settled Contracts (Keep Green!) */}
        <div
          onClick={() => onSelectStatusFilter('closed')}
          className="relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 shadow-sm cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--line)',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
              style={{
                background: 'linear-gradient(140deg, #10B981, #059669)',
                boxShadow: '0 8px 18px rgba(16,185,129,0.3)',
              }}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ครบถ้วน
            </span>
          </div>
          <div>
            <div className="text-xs text-[var(--muted)] font-medium">ปิดสัญญาแล้ว (ส่งใช้ครบ)</div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[var(--ink)]">
              {settledCount} <span className="text-xs font-normal text-[var(--muted)]">สัญญา</span>
            </div>
            <div className="mt-2 text-2xs text-[var(--muted)]">
              ชำระคืนครบถ้วน 100%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
