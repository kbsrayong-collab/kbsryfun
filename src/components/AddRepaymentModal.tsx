import React, { useState } from 'react';
import { LoanContract } from '../types/loan';
import { calculateLoanSummary, formatCurrency } from '../utils/loanCalculations';
import { AppSettings, COLOR_THEMES } from '../types/settings';
import { X, Check, Receipt, AlertCircle } from 'lucide-react';

interface AddRepaymentModalProps {
  contract: LoanContract | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveRepayment: (contractId: string, repaymentData: any) => void;
  settings?: AppSettings;
}

export const AddRepaymentModal: React.FC<AddRepaymentModalProps> = ({
  contract,
  isOpen,
  onClose,
  onSaveRepayment,
  settings,
}) => {
  if (!isOpen || !contract) return null;

  const currentTheme = COLOR_THEMES.find(t => t.id === settings?.colorTheme) || COLOR_THEMES[0];
  const isDarkMode = settings?.themeMode === 'dark';

  const summary = calculateLoanSummary(contract);
  const today = new Date().toISOString().split('T')[0];

  const [repaymentDate, setRepaymentDate] = useState(today);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [receiptNo, setReceiptNo] = useState('');
  const [voucherAmount, setVoucherAmount] = useState<string>('');
  const [voucherNo, setVoucherNo] = useState('');
  const [autoVerify, setAutoVerify] = useState(true);
  const [verifierName, setVerifierName] = useState('ธรรมวิทย์');
  const [notes, setNotes] = useState('');

  // Calculations for current inputs
  const parsedCash = parseFloat(cashAmount) || 0;
  const parsedVoucher = parseFloat(voucherAmount) || 0;
  const thisTotal = parsedCash + parsedVoucher;
  const newRemaining = summary.remainingDebt - thisTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (thisTotal <= 0) {
      alert('กรุณากรอกยอดเงินสดหรือยอดใบสำคัญคู่จ่ายอย่างน้อย 1 รายการ');
      return;
    }

    const payload = {
      contractId: contract.id,
      repaymentDate,
      cashAmount: parsedCash,
      receiptNo: receiptNo.trim() || undefined,
      voucherAmount: parsedVoucher,
      voucherNo: voucherNo.trim() || undefined,
      totalSettled: thisTotal,
      verified: autoVerify,
      verifiedBy: autoVerify ? verifierName.trim() : undefined,
      verifiedAt: autoVerify ? repaymentDate : undefined,
      notes: notes.trim() || undefined,
    };

    onSaveRepayment(contract.id, payload);
    onClose();
  };

  const inputStyle = { '--tw-ring-color': currentTheme.accentHex } as React.CSSProperties;
  const standardInputClass = "w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-colors";
  const monoInputClass = `${standardInputClass} font-mono font-medium`;
  const labelClass = "block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div 
          className="px-6 py-4 text-white flex items-center justify-between"
          style={{ backgroundColor: currentTheme.accentHex }}
        >
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-white/90" />
              <span>บันทึกส่งใช้คืนเงินยืมและใบสำคัญ</span>
            </h2>
            <p className="text-xs text-white/80 mt-0.5 font-mono">
              สัญญาเลขที่ {contract.contractNo} · {contract.borrowerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-black/15 transition-colors"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Contract Status Summary Card */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-slate-600 dark:text-slate-400 block text-xs">วงเงินยืม</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-sm">
                ฿{formatCurrency(contract.loanAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block text-xs">ส่งใช้แล้ว</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                ฿{formatCurrency(summary.totalSettled)}
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block text-xs">ยอดค้างปัจจุบัน</span>
              <span className="font-bold text-amber-700 dark:text-amber-400 font-mono text-sm">
                ฿{formatCurrency(summary.remainingDebt)}
              </span>
            </div>
          </div>

          {/* Date of Repayment */}
          <div>
            <label className={labelClass}>
              วันที่ส่งใช้คืนเงินยืม <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={repaymentDate}
              onChange={(e) => setRepaymentDate(e.target.value)}
              className={standardInputClass}
              style={inputStyle}
            />
          </div>

          {/* Section 1: Cash/Transfer Return */}
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2.5">
            <div className="font-semibold text-blue-950 dark:text-blue-200 flex items-center justify-between text-xs">
              <span>1. ส่งใช้เป็นเงินสด / เงินโอนคืนคลัง</span>
              <span className="text-2xs font-normal text-blue-700 dark:text-blue-300">กรณีเงินเหลือจ่าย</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">จำนวนเงินสด (บาท)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold">฿</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0.00"
                    className={`pl-8 ${monoInputClass}`}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">เลขที่ใบเสร็จรับเงินสด</label>
                <input
                  type="text"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  placeholder="เช่น ล.095/2569"
                  className={monoInputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vouchers / Expense Receipts */}
          <div 
            className="p-3.5 rounded-xl border space-y-2.5 transition-colors"
            style={{
              backgroundColor: isDarkMode ? '#1e293b' : `${currentTheme.accentHex}0c`,
              borderColor: isDarkMode ? '#334155' : `${currentTheme.accentHex}30`
            }}
          >
            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between text-xs">
              <span>2. ส่งใช้เป็นใบสำคัญคู่จ่าย / ใบเสร็จค่าใช้จ่าย</span>
              <span 
                className="text-2xs font-medium"
                style={{ color: isDarkMode ? '#94a3b8' : currentTheme.accentHex }}
              >
                หลักฐานการจ่ายตามสัญญา
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">จำนวนเงินตามใบสำคัญ (บาท)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold">฿</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={voucherAmount}
                    onChange={(e) => setVoucherAmount(e.target.value)}
                    placeholder="0.00"
                    className={`pl-8 ${monoInputClass}`}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">เลขที่ใบสำคัญ / ฎีกา / เล่มที่</label>
                <input
                  type="text"
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  placeholder="เช่น บส.150/69, ฎีกา 502"
                  className={monoInputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Real-time Settlement Audit Box */}
          <div className={`p-3.5 rounded-xl border ${
            thisTotal > 0 && Math.abs(newRemaining) < 0.01
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              : thisTotal > 0 && newRemaining < 0
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>รวมยอดส่งใช้ในรายการนี้:</span>
              <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                ฿{formatCurrency(thisTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1 text-slate-600 dark:text-slate-400">
              <span>ยอดหนี้คงค้างหลังส่งใช้:</span>
              <span className={`font-mono font-bold tabular-nums ${newRemaining <= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                ฿{formatCurrency(Math.max(0, newRemaining))}
              </span>
            </div>
            {thisTotal > 0 && (
              <div className="mt-2 text-2xs pt-1.5 border-t border-black/5 dark:border-white/10">
                {Math.abs(newRemaining) < 0.01 && (
                  <p className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    ยอดเงินสด + ใบสำคัญเท่ากับยอดหนี้พอดี พร้อมปิดสัญญาการยืมเงิน
                  </p>
                )}
                {newRemaining > 0 && (
                  <p className="text-amber-700 dark:text-amber-400 font-medium">
                    ส่งใช้บางส่วน ยังมียอดคงค้าง ฿{formatCurrency(newRemaining)} รอส่งใช้ในครั้งต่อไป
                  </p>
                )}
                {newRemaining < 0 && (
                  <p className="text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    ยอดส่งใช้เกินกว่ายอดหนี้คงค้าง ฿{formatCurrency(Math.abs(newRemaining))} กรุณาตรวจทานตัวเลข
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Verification Checkbox */}
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoVerify}
                onChange={(e) => setAutoVerify(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: currentTheme.accentHex }}
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                ตรวจรับรองความถูกต้องของใบสำคัญและเงินสดทันที (Audit Verified)
              </span>
            </label>

            {autoVerify && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-slate-600 dark:text-slate-400 mb-1 text-2xs">
                  ชื่อผู้ตรวจรับรอง
                </label>
                <select
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  className={standardInputClass}
                  style={inputStyle}
                >
                  <option value="ธรรมวิทย์">ธรรมวิทย์</option>
                  <option value="เปมิกา">เปมิกา</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>
              หมายเหตุการส่งใช้ (ถ้ามี)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ส่งใช้ใบเสร็จค่าที่พัก 2 คืน พร้อมค่าตั๋วเครื่องบิน"
              className={standardInputClass}
              style={inputStyle}
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={thisTotal <= 0}
              className={`px-5 py-2 text-white font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs ${
                thisTotal > 0
                  ? 'hover:brightness-110 active:brightness-95 cursor-pointer'
                  : 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed opacity-60'
              }`}
              style={thisTotal > 0 ? { backgroundColor: currentTheme.accentHex } : undefined}
            >
              <Check className="w-4 h-4" />
              <span>บันทึกการส่งใช้เงินยืม</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
