import React from 'react';
import { LoanContract } from '../types/loan';
import { calculateLoanSummary, convertNumberToThaiBahtText, formatCurrency, formatThaiDate, getStatusBadgeStyle } from '../utils/loanCalculations';
import { AppSettings, COLOR_THEMES } from '../types/settings';
import { X, CheckCircle, Clock, AlertTriangle, Plus, FileText, Printer, ShieldCheck, Trash2 } from 'lucide-react';

interface ContractDetailModalProps {
  contract: LoanContract | null;
  onClose: () => void;
  onAddRepayment: (contract: LoanContract) => void;
  onGenerateDemandLetter: (contract: LoanContract) => void;
  onPrintForm8500: (contract: LoanContract) => void;
  onVerifyRepayment: (contractId: string, repaymentId: string, verifierName: string) => void;
  onDeleteRepayment: (contractId: string, repaymentId: string) => void;
  settings?: AppSettings;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  contract,
  onClose,
  onAddRepayment,
  onGenerateDemandLetter,
  onPrintForm8500,
  onVerifyRepayment,
  onDeleteRepayment,
  settings,
}) => {
  if (!contract) return null;

  const currentTheme = COLOR_THEMES.find(t => t.id === settings?.colorTheme) || COLOR_THEMES[0];
  const isDarkMode = settings?.themeMode === 'dark';

  const summary = calculateLoanSummary(contract);
  const badge = getStatusBadgeStyle(summary.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs ring-2 ring-white/20 shrink-0"
              style={{ backgroundColor: currentTheme.accentHex }}
            >
              ย.
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  สัญญาเลขที่ {contract.contractNo}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {summary.statusLabel}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                ผู้ยืม: {contract.borrowerName} ({contract.position}) · {contract.department}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Metric Financial Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">วงเงินสัญญาการยืมเงิน</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                ฿{formatCurrency(contract.loanAmount)}
              </span>
              <span className="text-2xs text-slate-500 dark:text-slate-400 block mt-0.5">
                ({convertNumberToThaiBahtText(contract.loanAmount)})
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">ส่งใช้คืนแล้วทั้งหมด</span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                ฿{formatCurrency(summary.totalSettled)}
              </span>
              <span className="text-2xs text-emerald-800 dark:text-emerald-300 block mt-0.5">
                สด ฿{formatCurrency(summary.totalCashReturned)} + ใบสำคัญ ฿{formatCurrency(summary.totalVoucherSettled)}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">ยอดหนี้คงค้าง</span>
              <span className={`text-xl font-bold font-mono tabular-nums ${summary.remainingDebt > 0 ? (summary.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400') : 'text-slate-400'}`}>
                ฿{formatCurrency(summary.remainingDebt)}
              </span>
              <span className="text-2xs text-slate-500 dark:text-slate-400 block mt-0.5">
                {summary.remainingDebt === 0 ? 'ชำระคืนครบถ้วนสมบูรณ์แล้ว' : 'รอส่งใช้คืนตามกำหนด'}
              </span>
            </div>
          </div>

          {/* Automatic Reconciliation & Audit Verification Box */}
          <div className={`p-4 rounded-xl border ${
            summary.reconciliationStatus === 'balanced' 
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              : summary.reconciliationStatus === 'underpaid'
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
              : summary.reconciliationStatus === 'overpaid'
              ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-950 dark:text-sky-200'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
          }`}>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold">
                    การตรวจสอบและกระทบยอดเงินยืมอัตโนมัติ (Automated Reconciliation)
                  </h4>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-white/80 dark:bg-slate-800/80 rounded border border-current">
                    {summary.reconciliationStatus === 'balanced' && 'สมดุล 100%'}
                    {summary.reconciliationStatus === 'underpaid' && 'ค้างส่งใช้'}
                    {summary.reconciliationStatus === 'overpaid' && 'ส่งเกิน'}
                    {summary.reconciliationStatus === 'none' && 'รอส่งใช้'}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                  {summary.reconciliationMessage}
                </p>
                <div className="mt-2 text-2xs grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">ประเภทการยืม:</span> {contract.loanType === 'travel' ? 'เดินทางไปราชการ (ส่งใช้ใน 15 วัน)' : 'โครงการ/ราชการอื่น (ส่งใช้ใน 30 วัน)'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">วันจ่ายเงิน:</span> {formatThaiDate(contract.disbursementDate, 'short')}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">วันครบกำหนด:</span> {formatThaiDate(contract.dueDate, 'short')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 bg-slate-50/70 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">ข้อมูลสัญญาและผู้ยืม</h5>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-medium">เลขที่สัญญา:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{contract.contractNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-medium">วันที่ทำสัญญา:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{formatThaiDate(contract.contractDate, 'full')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-medium">ปีงบประมาณ:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">พ.ศ. {contract.fiscalYear}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-medium">ชื่อผู้ยืม:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{contract.borrowerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-medium">ตำแหน่ง / สังกัด:</span>
                <span className="text-slate-800 dark:text-slate-200">{contract.position} · {contract.department}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">แหล่งเงินงบประมาณ:</span>
                <span className="text-slate-800 dark:text-slate-200">{contract.budgetType}</span>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50/70 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">วัตถุประสงค์และหมายเหตุ</h5>
              <div className="py-1">
                <span className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">วัตถุประสงค์การยืม:</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  {contract.purpose}
                </p>
              </div>
              <div className="py-1">
                <span className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">หมายเหตุการติดตาม:</span>
                <p className="text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  {contract.remarks || 'ไม่มีหมายเหตุเพิ่มเติม'}
                </p>
              </div>
            </div>
          </div>

          {/* Repayments History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>ประวัติการส่งใช้คืนเงินยืมและใบสำคัญคู่จ่าย</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  ({(contract.repayments || []).length} รายการ)
                </span>
              </h4>
              <button
                type="button"
                onClick={() => onAddRepayment(contract)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all shadow-xs hover:brightness-110 active:brightness-95"
                style={{ backgroundColor: currentTheme.accentHex }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>บันทึกส่งใช้คืน</span>
              </button>
            </div>

            {(contract.repayments || []).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs">
                ยังไม่มีการส่งใช้คืนเงินสดหรือใบสำคัญสำหรับสัญญานี้
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => onAddRepayment(contract)}
                    className="font-semibold hover:underline"
                    style={{ color: currentTheme.accentHex }}
                  >
                    + บันทึกการส่งใช้เงินยืมครั้งแรก
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">ลำดับ</th>
                      <th className="py-2.5 px-3">วันที่ส่งใช้</th>
                      <th className="py-2.5 px-3 text-right">เงินสดคืนคลัง (บาท)</th>
                      <th className="py-2.5 px-3">เลขที่ใบเสร็จ</th>
                      <th className="py-2.5 px-3 text-right">ใบสำคัญคู่จ่าย (บาท)</th>
                      <th className="py-2.5 px-3">เลขที่ใบสำคัญ</th>
                      <th className="py-2.5 px-3 text-right font-bold">รวมส่งใช้ (บาท)</th>
                      <th className="py-2.5 px-3 text-center">สถานะตรวจรับรอง</th>
                      <th className="py-2.5 px-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {contract.repayments.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{formatThaiDate(r.repaymentDate, 'short')}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                          {r.cashAmount > 0 ? `฿${formatCurrency(r.cashAmount)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono">{r.receiptNo || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                          {r.voucherAmount > 0 ? `฿${formatCurrency(r.voucherAmount)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono">{r.voucherNo || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                          ฿{formatCurrency(r.totalSettled)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {r.verified ? (
                            <span className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded font-medium border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>ตรวจรับรองแล้ว</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onVerifyRepayment(contract.id, r.id, 'นางกานดา สุขสมบัติ (หน.งานการเงิน)')}
                              className="text-2xs px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded font-medium border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                            >
                              กดรับรองใบสำคัญ
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('คุณต้องการลบรายการส่งใช้คืนเงินยืมนี้หรือไม่?')) {
                                onDeleteRepayment(contract.id, r.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded"
                            title="ลบรายการส่งใช้นี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrintForm8500(contract)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>พิมพ์ทะเบียนคุม (แบบ 8500)</span>
            </button>

            {summary.isOverdue && summary.remainingDebt > 0 && (
              <button
                type="button"
                onClick={() => onGenerateDemandLetter(contract)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>ออกหนังสือทวงถามหนี้</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
