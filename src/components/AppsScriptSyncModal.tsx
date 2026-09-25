import React, { useState } from 'react';
import { AppsScriptConfig, LoanContract } from '../types/loan';
import { LoanStorageService } from '../services/loanStorage';
import { AppsScriptService } from '../services/appsScriptService';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  ExternalLink, 
  Download, 
  Upload, 
  RotateCcw, 
  X, 
  ShieldAlert, 
  Copy, 
  Check, 
  Code2, 
  Layers, 
  FileSpreadsheet, 
  Radio, 
  AlertCircle,
  HelpCircle,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';

interface AppsScriptSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  appsScriptConfig: AppsScriptConfig;
  onUpdateConfig: (newCfg: AppsScriptConfig) => void;
  contracts: LoanContract[];
  onReloadContracts: () => void;
}

export const AppsScriptSyncModal: React.FC<AppsScriptSyncModalProps> = ({
  isOpen,
  onClose,
  appsScriptConfig,
  onUpdateConfig,
  contracts,
  onReloadContracts,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'code-gs' | 'code-index' | 'help'>('sync');
  const [webAppUrl, setWebAppUrl] = useState(appsScriptConfig.webAppUrl || '');
  const [sheetName, setSheetName] = useState(appsScriptConfig.sheetName || 'ทะเบียนคุมเงินยืม');
  const [autoSync, setAutoSync] = useState(appsScriptConfig.autoSync ?? true);
  const [isTesting, setIsTesting] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isIndexCopied, setIsIndexCopied] = useState(false);
  const [showImportBox, setShowImportBox] = useState(false);
  const [importJson, setImportJson] = useState('');

  if (!isOpen) return null;

  const handleSaveConfig = (override?: Partial<AppsScriptConfig>) => {
    const updated: AppsScriptConfig = {
      ...appsScriptConfig,
      webAppUrl: webAppUrl.trim(),
      sheetName: sheetName.trim() || 'ทะเบียนคุมเงินยืม',
      autoSync,
      ...override,
    };
    onUpdateConfig(updated);
    LoanStorageService.saveAppsScriptConfig(updated);
    return updated;
  };

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      setNotification({ type: 'error', text: 'กรุณากรอก Web App URL ก่อนทดสอบ' });
      return;
    }
    setIsTesting(true);
    setNotification(null);

    const res = await AppsScriptService.testConnection(webAppUrl);
    setIsTesting(false);

    if (res.success) {
      handleSaveConfig({ syncStatus: 'connected', errorMessage: undefined });
      setNotification({ type: 'success', text: res.message });
    } else {
      handleSaveConfig({ syncStatus: 'error', errorMessage: res.message });
      setNotification({ type: 'error', text: res.message });
    }
  };

  const handlePullFromSheet = async () => {
    if (!webAppUrl.trim()) {
      setNotification({ type: 'error', text: 'กรุณากรอก Web App URL ก่อนดึงข้อมูล' });
      return;
    }
    setIsPulling(true);
    setNotification(null);

    const res = await AppsScriptService.fetchContracts(webAppUrl);
    setIsPulling(false);

    if (res.success && res.data) {
      LoanStorageService.saveContracts(res.data);
      onReloadContracts();
      const updated = handleSaveConfig({ 
        syncStatus: 'connected', 
        lastSyncedAt: new Date().toISOString(),
        errorMessage: undefined 
      });
      setNotification({ 
        type: 'success', 
        text: `ดึงข้อมูลจาก Google Sheets สำเร็จ! อัปเดตข้อมูลสัญญาแล้ว ${res.data.length} รายการ` 
      });
    } else {
      setNotification({ type: 'error', text: res.message });
    }
  };

  const handlePushToSheet = async () => {
    if (!webAppUrl.trim()) {
      setNotification({ type: 'error', text: 'กรุณากรอก Web App URL ก่อนส่งข้อมูล' });
      return;
    }
    setIsPushing(true);
    setNotification(null);

    const res = await AppsScriptService.syncAllContracts(webAppUrl, contracts);
    setIsPushing(false);

    if (res.success) {
      handleSaveConfig({ 
        syncStatus: 'connected', 
        lastSyncedAt: new Date().toISOString(),
        errorMessage: undefined 
      });
      setNotification({ 
        type: 'success', 
        text: `บันทึกข้อมูลสัญญาทั้งหมด ${contracts.length} รายการขึ้น Google Sheets สำเร็จเรียบร้อย!` 
      });
    } else {
      setNotification({ type: 'error', text: res.message });
    }
  };

  const handleCopyCode = () => {
    const code = AppsScriptService.getAppsScriptCode();
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCopyIndexHtml = () => {
    const html = AppsScriptService.getAppsScriptIndexHtml();
    navigator.clipboard.writeText(html);
    setIsIndexCopied(true);
    setTimeout(() => setIsIndexCopied(false), 2500);
  };

  const handleDownloadCodeGs = () => {
    const code = AppsScriptService.getAppsScriptCode();
    const blob = new Blob([code], { type: 'text/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Code.gs');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadIndexHtml = () => {
    const html = AppsScriptService.getAppsScriptIndexHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Index.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const csvContent = LoanStorageService.exportContractsToCSV(contracts);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gov_loan_register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (Array.isArray(parsed)) {
        LoanStorageService.saveContracts(parsed);
        onReloadContracts();
        setNotification({ type: 'success', text: `นำเข้าข้อมูลสำเร็จจำนวน ${parsed.length} สัญญา` });
        setShowImportBox(false);
        setImportJson('');
      } else {
        alert('รูปแบบ JSON ต้องเป็นรายการอาเรย์ของสัญญา');
      }
    } catch (e) {
      alert('รูปแบบ JSON ไม่ถูกต้อง กรุณาตรวจสอบข้อมูล');
    }
  };

  const isConnected = appsScriptConfig.syncStatus === 'connected' && Boolean(webAppUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700/80 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">เชื่อมต่อ Google Apps Script & Google Sheets</h2>
                <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-emerald-950/80 text-emerald-200 border border-emerald-500/30">
                  GAS API
                </span>
              </div>
              <p className="text-2xs text-emerald-100/90 mt-0.5">
                ใช้งาน Google Sheets เป็นฐานข้อมูลแบบ Realtime ผ่าน Apps Script Web App
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/60 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-6 pt-2">
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ตั้งค่าและซิงค์</span>
            {isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('code-gs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'code-gs'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>สคริปต์ (Code.gs)</span>
          </button>

          <button
            onClick={() => setActiveTab('code-index')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer relative ${
              activeTab === 'code-index'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>หน้าเว็บเชื่อมต่อ (Index.html)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-400 text-amber-950">
              ใหม่
            </span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'help'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>วิธีติดตั้ง (คู่มือ)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5 text-xs">
          {/* Status Alert Notification */}
          {notification && (
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              notification.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                : notification.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                : 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">{notification.text}</div>
              <button 
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: SYNC & SETTINGS */}
          {activeTab === 'sync' && (
            <div className="space-y-5">
              {/* Connection Status Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    isConnected 
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                  }`}>
                    <Radio className={`w-5 h-5 ${isConnected ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">สถานะการเชื่อมต่อ:</span>
                      <span className={`font-semibold px-2 py-0.5 rounded-md text-2xs ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                      }`}>
                        {isConnected ? 'พร้อมใช้งาน (Connected)' : 'ยังไม่ได้เชื่อมต่อ / ออฟไลน์'}
                      </span>
                    </div>
                    <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                      จำนวนสัญญาในเครื่อง: <strong className="text-slate-700 dark:text-slate-300">{contracts.length}</strong> รายการ
                      {appsScriptConfig.lastSyncedAt && (
                        <span> · ซิงค์ล่าสุด: {new Date(appsScriptConfig.lastSyncedAt).toLocaleString('th-TH')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
                </button>
              </div>

              {/* Form inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Google Apps Script Web App URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={webAppUrl}
                      onChange={(e) => setWebAppUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                      className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-3xs text-slate-500 dark:text-slate-400 mt-1">
                    URL ที่ได้จากการคลิก "Deploy" &gt; "Web App" ใน Google Apps Script (ต้องตั้งค่าสิทธิ์ Anyone/ทุกคน)
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      ชื่อชีตใน Google Sheets (Sheet Name)
                    </label>
                    <input
                      type="text"
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      placeholder="ทะเบียนคุมเงินยืม"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="autoSyncToggle"
                      checked={autoSync}
                      onChange={(e) => {
                        setAutoSync(e.target.checked);
                        handleSaveConfig({ autoSync: e.target.checked });
                      }}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="autoSyncToggle" className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      ซิงค์ข้อมูลอัตโนมัติ (Auto-Sync)
                    </label>
                  </div>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="p-4 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>การสั่งซิงค์ข้อมูล (Data Synchronization)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handlePullFromSheet}
                    disabled={isPulling || isPushing}
                    className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-left transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">
                      <ArrowDownToLine className={`w-4 h-4 text-emerald-600 ${isPulling ? 'animate-bounce' : ''}`} />
                      <span>{isPulling ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลจาก Google Sheets (Pull)'}</span>
                    </div>
                    <p className="text-3xs text-slate-500 dark:text-slate-400 mt-1">
                      อัปเดตสัญญาล่าสุดจาก Google Sheets ลงสู่ระบบทะเบียนบนเว็บ
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={handlePushToSheet}
                    disabled={isPushing || isPulling}
                    className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-left transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">
                      <ArrowUpFromLine className={`w-4 h-4 text-emerald-600 ${isPushing ? 'animate-bounce' : ''}`} />
                      <span>{isPushing ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลทั้งหมดขึ้น Google Sheets (Push)'}</span>
                    </div>
                    <p className="text-3xs text-slate-500 dark:text-slate-400 mt-1">
                      บันทึกสัญญาทั้งหมด ({contracts.length} สัญญา) ไปบันทึกเก็บใน Google Sheets
                    </p>
                  </button>
                </div>
              </div>

              {/* Additional Data Tools: CSV & JSON */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer text-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ส่งออกเป็น Excel / CSV (แบบ 8500)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowImportBox(!showImportBox)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer text-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>นำเข้าข้อมูล JSON</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นชุดข้อมูลสาธิตเริ่มต้นหรือไม่?')) {
                      LoanStorageService.resetToDefault();
                      onReloadContracts();
                      setNotification({ type: 'info', text: 'รีเซ็ตข้อมูลเป็นชุดเริ่มต้นเรียบร้อยแล้ว' });
                    }
                  }}
                  className="text-2xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                >
                  รีเซ็ตข้อมูลเป็นค่าเริ่มต้น
                </button>
              </div>

              {showImportBox && (
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block font-medium text-slate-700 dark:text-slate-300">
                    วางข้อมูล JSON ของสัญญา:
                  </label>
                  <textarea
                    rows={4}
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                    placeholder='[ { "contractNo": "ย.01/2568", "borrowerName": "...", ... } ]'
                    className="w-full p-2 text-2xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImportBox(false)}
                      className="px-2.5 py-1 text-2xs text-slate-500"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleImportJson}
                      className="px-3 py-1 text-2xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium"
                    >
                      ยืนยันนำเข้าข้อมูล
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CODE.GS (BACKEND) */}
          {activeTab === 'code-gs' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    โค้ดสคริปต์หลัก (Code.gs)
                  </h3>
                  <p className="text-3xs text-slate-500 dark:text-slate-400">
                    วางในไฟล์ Code.gs เพื่อเป็น Backend จัดการ Google Sheets และ REST API
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCodeGs}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลด Code.gs</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>คัดลอกแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอก Code.gs</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-2xs font-mono max-h-96 leading-relaxed border border-slate-800 select-all">
                  <code>{AppsScriptService.getAppsScriptCode()}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: INDEX.HTML (FRONTEND) */}
          {activeTab === 'code-index' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    หน้าเว็บเชื่อมต่อ Apps Script (Index.html)
                  </h3>
                  <p className="text-3xs text-slate-500 dark:text-slate-400">
                    สร้างไฟล์ HTML ชื่อ <strong>Index</strong> ใน Apps Script แล้ววางโค้ดนี้ เพื่อให้ Web App มีหน้าเว็บเต็มรูปแบบ
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadIndexHtml}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลด Index.html</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyIndexHtml}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {isIndexCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>คัดลอกแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอก Index.html</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-2xs text-emerald-900 dark:text-emerald-200">
                <strong>วิธีสร้างใน Apps Script:</strong> คลิกเครื่องหมาย <strong>+</strong> ข้าง "ไฟล์" &gt; เลือก <strong>HTML</strong> &gt; ตั้งชื่อว่า <strong className="font-mono">Index</strong> &gt; วางโค้ดด้านล่างแล้วกดบันทึก
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-2xs font-mono max-h-96 leading-relaxed border border-slate-800 select-all">
                  <code>{AppsScriptService.getAppsScriptIndexHtml()}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: HELP / INSTALL GUIDE */}
          {activeTab === 'help' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                วิธีเชื่อมต่อ Google Sheets ผ่าน Apps Script (5 ขั้นตอนง่ายๆ)
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">สร้าง Google Sheets</strong>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                      เปิด Google Drive หรือ Google Sheets สร้างชีตใหม่ (เช่น ตั้งชื่อว่า <em>"ทะเบียนคุมสัญญายืมเงินราชการ"</em>)
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">เปิดตัวแก้ไข Apps Script</strong>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                      ที่แถบเมนูด้านบนของ Google Sheets คลิกที่ <strong>"ส่วนขยาย" (Extensions)</strong> &gt; <strong>"Apps Script"</strong>
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">วางโค้ด Code.gs และสร้างไฟล์ Index.html</strong>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                      - <strong>ไฟล์ Code.gs:</strong> ลบโค้ดเดิมทั้งหมด แล้วนำโค้ดจากแท็บ <strong>"สคริปต์ (Code.gs)"</strong> มาวาง<br />
                      - <strong>ไฟล์ Index.html:</strong> คลิกเครื่องหมาย <strong>+</strong> ข้าง "ไฟล์" &gt; เลือก <strong>"HTML"</strong> &gt; ตั้งชื่อว่า <strong>"Index"</strong> แล้วนำโค้ดจากแท็บ <strong>"หน้าเว็บเชื่อมต่อ (Index.html)"</strong> มาวาง<br />
                      - กดปุ่มบันทึก (Save)
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">Deploy เป็น Web App (สำคัญมาก)</strong>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                      คลิกปุ่มสีน้ำเงิน <strong>"การทำให้ใช้งานได้" (Deploy)</strong> มุมบนขวา &gt; <strong>"การทำให้ใช้งานได้รายการใหม่" (New Deployment)</strong><br />
                      - เลือกประเภท (ฟันเฟือง): <strong>"เว็บแอป" (Web App)</strong><br />
                      - ดำเนินการในฐานะ (Execute as): <strong>"ฉัน" (Me)</strong><br />
                      - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): <strong>"ทุกคน" (Anyone)</strong> *(จำเป็นเพื่อให้ระบบเว็บส่งข้อมูลได้)*
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    5
                  </span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">นำ URL มาวางและทดสอบเชื่อมต่อ</strong>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                      คัดลอก <strong>URL ของเว็บแอป</strong> (ขึ้นต้นด้วย <code>https://script.google.com/macros/s/.../exec</code>) นำมาวางในช่อง <strong>Web App URL</strong> ในแท็บตั้งค่า แล้วกดปุ่ม <strong>"ทดสอบการเชื่อมต่อ"</strong> และกด <strong>"ส่งข้อมูลทั้งหมดขึ้น Google Sheets (Push)"</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="text-2xs text-slate-500 dark:text-slate-400">
            ระบบจัดเก็บแคชในเบราว์เซอร์อัตโนมัติ ใช้งานได้แม้ขณะออฟไลน์
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleSaveConfig();
                onClose();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs"
            >
              บันทึกและปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
