import React, { useState, useEffect } from 'react';
import { BudgetType, LoanContract, LoanType } from '../types/loan';
import { calculateDefaultDueDate, getFiscalYear } from '../utils/loanCalculations';
import { AppSettings, COLOR_THEMES } from '../types/settings';
import { X, Check } from 'lucide-react';

interface AddEditContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contractData: any) => void;
  contractToEdit: LoanContract | null;
  existingContractsCount: number;
  settings?: AppSettings;
}

export const AddEditContractModal: React.FC<AddEditContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contractToEdit,
  existingContractsCount,
  settings,
}) => {
  const currentTheme = COLOR_THEMES.find(t => t.id === settings?.colorTheme) || COLOR_THEMES[0];
  const isDarkMode = settings?.themeMode === 'dark';

  const [contractNo, setContractNo] = useState('001/2570');
  const [contractDate, setContractDate] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('กบส.');
  const [fiscalYear, setFiscalYear] = useState<number>(2570);
  const [purpose, setPurpose] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('travel');
  const [budgetType, setBudgetType] = useState<BudgetType>('เงินกองทุนพัฒนาสหกรณ์');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [disbursementDate, setDisbursementDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Pre-fill or generate defaults
  useEffect(() => {
    if (contractToEdit) {
      setContractNo(contractToEdit.contractNo);
      setContractDate(contractToEdit.contractDate);
      setBorrowerName(contractToEdit.borrowerName);
      setPosition(contractToEdit.position);
      setDepartment(contractToEdit.department);
      setFiscalYear(contractToEdit.fiscalYear);
      setPurpose(contractToEdit.purpose);
      setLoanType(contractToEdit.loanType);
      setBudgetType(contractToEdit.budgetType);
      setLoanAmount(contractToEdit.loanAmount.toString());
      setDisbursementDate(contractToEdit.disbursementDate || '');
      setDueDate(contractToEdit.dueDate || '');
      setRemarks(contractToEdit.remarks || '');
    } else {
      // Default new contract
      const today = new Date().toISOString().split('T')[0];
      const nextNo = `${String(existingContractsCount + 1).padStart(3, '0')}/2570`;
      setContractNo(nextNo);
      setContractDate(today);
      setBorrowerName('');
      setPosition('');
      setDepartment('กบส.');
      setFiscalYear(2570);
      setPurpose('');
      setLoanType('travel');
      setBudgetType('เงินกองทุนพัฒนาสหกรณ์');
      setLoanAmount('');
      setDisbursementDate(today);
      setDueDate(calculateDefaultDueDate(today, 'travel'));
      setRemarks('');
    }
  }, [contractToEdit, isOpen, existingContractsCount]);

  // When disbursement date or loan type changes, auto-calculate due date
  const handleDisbursementChange = (newDate: string) => {
    setDisbursementDate(newDate);
    if (newDate) {
      const autoDue = calculateDefaultDueDate(newDate, loanType);
      setDueDate(autoDue);
    }
  };

  const handleLoanTypeChange = (newType: LoanType) => {
    setLoanType(newType);
    if (disbursementDate) {
      const autoDue = calculateDefaultDueDate(disbursementDate, newType);
      setDueDate(autoDue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractNo.trim() || !borrowerName.trim() || !loanAmount || parseFloat(loanAmount) <= 0) {
      alert('กรุณากรอกข้อมูลเลขที่สัญญา ชื่อผู้ยืม และวงเงินให้ถูกต้องครบถ้วน');
      return;
    }

    const payload = {
      contractNo: contractNo.trim(),
      contractDate,
      borrowerName: borrowerName.trim(),
      position: position.trim() || 'เจ้าหน้าที่',
      department: department.trim() || 'กบส.',
      fiscalYear: Number(fiscalYear),
      purpose: purpose.trim() || 'เพื่อใช้จ่ายในการปฏิบัติราชการ',
      loanType,
      budgetType,
      loanAmount: parseFloat(loanAmount),
      disbursementDate,
      dueDate,
      remarks: remarks.trim(),
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  // Consistent reusable high-contrast input classes
  const inputStyle = { '--tw-ring-color': currentTheme.accentHex } as React.CSSProperties;
  const standardInputClass = "w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-colors";
  const monoInputClass = `${standardInputClass} font-mono`;
  const labelClass = "block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div 
          className="px-6 py-4 text-white flex items-center justify-between shadow-xs transition-colors"
          style={{ backgroundColor: currentTheme.accentHex }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-white/30 shrink-0">
              {contractToEdit ? 'แก้ไข' : 'ใหม่'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {contractToEdit ? 'แก้ไขข้อมูลสัญญายืมเงิน' : 'บันทึกสัญญายืมเงินราชการ'}
              </h2>
              <p className="text-xs text-white/90 font-normal">
                กรอกรายละเอียดสัญญาเงินยืมตามระเบียบกระทรวงการคลัง
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-black/15 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Contract No & Date & Fiscal Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>
                เลขที่สัญญา / สัญญายืมเงิน <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={contractNo}
                onChange={(e) => setContractNo(e.target.value)}
                placeholder="เช่น 001/2570"
                className={monoInputClass}
                style={inputStyle}
              />
            </div>

            <div>
              <label className={labelClass}>
                วันที่ทำสัญญา <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                className={standardInputClass}
                style={inputStyle}
              />
            </div>

            <div>
              <label className={labelClass}>
                ปีงบประมาณ (พ.ศ.) <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                className={monoInputClass}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Row 2: Borrower Name, Position, Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>
                ชื่อ-สกุล ผู้ยืมเงิน <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="เช่น นายกอ ระยอง"
                className={standardInputClass}
                style={inputStyle}
              />
            </div>

            <div>
              <label className={labelClass}>
                ตำแหน่ง
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="เช่น นักวิชาการสหกรณ์ปฏิบัติการ ชำนาญการ"
                className={standardInputClass}
                style={inputStyle}
              />
            </div>

            <div>
              <label className={labelClass}>
                กลุ่มงาน / ฝ่าย / สังกัด
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น กบส."
                className={standardInputClass}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Row 3: Loan Type & Budget Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                ประเภทการยืมเงิน (กำหนดระยะเวลาส่งใช้)
              </label>
              <select
                value={loanType}
                onChange={(e) => handleLoanTypeChange(e.target.value as LoanType)}
                className={standardInputClass}
                style={inputStyle}
              >
                <option value="travel">เดินทางไปราชการ (ส่งใช้ภายใน 15 วัน)</option>
                <option value="general">ปฏิบัติราชการอื่น / จัดโครงการ / อบรม (ส่งใช้ภายใน 30 วัน)</option>
                <option value="contingency">เงินทดรองราชการ (30 วัน)</option>
                <option value="custom">กำหนดระยะเวลาเอง</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                แหล่งเงินงบประมาณ
              </label>
              <select
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value as BudgetType)}
                className={standardInputClass}
                style={inputStyle}
              >
                <option value="เงินกองทุนพัฒนาสหกรณ์">เงินกองทุนพัฒนาสหกรณ์</option>
                <option value="เงินกองทุนสงเคราะห์เกษตร">เงินกองทุนสงเคราะห์เกษตร</option>
                <option value="เงินรายได้นิคมสหกรณ์">เงินรายได้นิคมสหกรณ์</option>
              </select>
            </div>
          </div>

          {/* Row 4: Purpose */}
          <div>
            <label className={labelClass}>
              วัตถุประสงค์การยืมเงิน / รายละเอียดโครงการ <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="ระบุวัตถุประสงค์ เช่น ค่าใช้จ่ายในการเดินทางไปปฏิบัติราชการร่วมประชุม... หรือ จัดอบรม..."
              className={`${standardInputClass} leading-relaxed`}
              style={inputStyle}
            />
          </div>

          {/* Row 5: Loan Amount & Disbursement & Due Date (Theme Accent Highlight Box) */}
          <div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-xl border transition-colors shadow-xs"
            style={{
              backgroundColor: isDarkMode ? '#1e293b' : `${currentTheme.accentHex}0d`,
              borderColor: isDarkMode ? '#334155' : `${currentTheme.accentHex}30`
            }}
          >
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                วงเงินยืม (บาท) <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold text-sm">฿</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                วันที่จ่ายเงินยืมให้ผู้ยืม
              </label>
              <input
                type="date"
                value={disbursementDate}
                onChange={(e) => handleDisbursementChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2"
                style={inputStyle}
              />
              <span 
                className="text-2xs font-medium mt-1.5 block"
                style={{ color: isDarkMode ? '#94a3b8' : currentTheme.accentHex }}
              >
                คำนวณวันส่งใช้ 15/30 วันอัตโนมัติ
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                กำหนดวันส่งใช้คืน (Due Date) <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Row 6: Remarks */}
          <div>
            <label className={labelClass}>
              หมายเหตุเพิ่มเติม
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="เช่น เลขที่ฎีกาเบิกจ่าย หรือบันทึกข้อความอนุมัติ"
              className={standardInputClass}
              style={inputStyle}
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs text-white font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5 shadow-sm hover:brightness-110 active:brightness-95"
              style={{ backgroundColor: currentTheme.accentHex }}
            >
              <Check className="w-4 h-4" />
              <span>{contractToEdit ? 'บันทึกการแก้ไข' : 'บันทึกสัญญาเงินยืม'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
