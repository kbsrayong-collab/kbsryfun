import React, { useState } from 'react';
import { AppsScriptConfig, LoanContract } from '../types/loan';
import { LoanStorageService } from '../services/loanStorage';
import { AppsScriptService } from '../services/appsScriptService';
import { 
  RefreshCw, 
  CheckCircle, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Code2, 
  FileSpreadsheet, 
  Radio, 
  AlertCircle,
  HelpCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface AppsScriptViewProps {
  appsScriptConfig: AppsScriptConfig;
  onUpdateConfig: (newCfg: AppsScriptConfig) => void;
  contracts: LoanContract[];
  onReloadContracts: () => void;
  onNavigateToContracts: () => void;
}

export const AppsScriptView: React.FC<AppsScriptViewProps> = ({
  appsScriptConfig,
  onUpdateConfig,
  contracts,
  onReloadContracts,
  onNavigateToContracts,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sync' | 'code-gs' | 'code-index' | 'help'>('sync');
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
      setNotification({ type: 'error', text: 'กรุณากรอก Google Apps Script Web App URL ก่อนกดทดสอบ' });
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
      handleSaveConfig({ 
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
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600 dark:bg-emerald-500 rounded-2xl text-white shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                การเชื่อมต่อ Google Apps Script (Google Sheets)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-2xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                GAS Web App API
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เชื่อมต่อ Google Sheets เป็นฐานข้อมูลกลาง รองรับการดึงข้อมูล ส่งข้อมูล และทำงานร่วมกันหลายคน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToContracts}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-xl transition-colors cursor-pointer"
          >
            <span>ไปที่ทะเบียนสัญญา ({contracts.length})</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveSubTab('sync')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'sync'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>ตั้งค่าและซิงค์ข้อมูล</span>
        </button>

        <button
          onClick={() => setActiveSubTab('code-gs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'code-gs'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>สคริปต์หลัก (Code.gs)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('code-index')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeSubTab === 'code-index'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>หน้าเว็บเชื่อมต่อ (Index.html)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-400 text-amber-950">
            แนะนำ
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('help')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'help'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>ขั้นตอนการเชื่อมต่อ (คู่มือ)</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-150 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100' 
            : notification.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
            : 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">{notification.text}</div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: SETTINGS & SYNC */}
      {activeSubTab === 'sync' && (
        <div className="space-y-6">
          {/* Status Box */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-xl ${
                isConnected 
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              }`}>
                <Radio className={`w-6 h-6 ${isConnected ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    สถานะการเชื่อมต่อ:
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isConnected
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {isConnected ? '✓ เชื่อมต่อกับ Google Sheets สำเร็จ' : 'ยังไม่ได้เชื่อมต่อ / ออฟไลน์'}
                  </span>
                </div>
                <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                  จำนวนสัญญาทั้งหมดในระบบ: <strong className="text-slate-800 dark:text-slate-200">{contracts.length}</strong> รายการ
                  {appsScriptConfig.lastSyncedAt && (
                    <span> · ซิงค์ล่าสุด: {new Date(appsScriptConfig.lastSyncedAt).toLocaleString('th-TH')}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
              </button>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">
              ข้อมูลการเชื่อมต่อ Web App
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Google Apps Script Web App URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1.5">
                URL ที่ได้จากการคลิกปุ่ม <strong>"Deploy (การทำให้ใช้งานได้)"</strong> &gt; <strong>"Web App (เว็บแอป)"</strong> ใน Apps Script (เลือกสิทธิ์เป็น Anyone / ทุกคน)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  ชื่อแท็บชีตใน Google Sheets
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="ทะเบียนคุมเงินยืม"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="viewAutoSync"
                  checked={autoSync}
                  onChange={(e) => {
                    setAutoSync(e.target.checked);
                    handleSaveConfig({ autoSync: e.target.checked });
                  }}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="viewAutoSync" className="text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                  เปิดใช้งานการซิงค์อัตโนมัติ (Auto-Sync)
                </label>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  handleSaveConfig();
                  setNotification({ type: 'success', text: 'บันทึกการตั้งค่า Web App URL เรียบร้อยแล้ว' });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>

          {/* Sync Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-xl">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    ดึงข้อมูลจาก Google Sheets (Pull)
                  </h4>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">
                    โหลดข้อมูลสัญญาแถวล่าสุดจาก Google Sheets เข้ามาอัปเดตในระบบ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePullFromSheet}
                disabled={isPulling || isPushing}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                <span>{isPulling ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลลงมาทันที'}</span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl">
                  <ArrowUpFromLine className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    ส่งข้อมูลขึ้น Google Sheets (Push)
                  </h4>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">
                    อัปโหลดสัญญาทั้งหมด ({contracts.length} สัญญา) ไปบันทึกใน Google Sheets
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePushToSheet}
                disabled={isPushing || isPulling}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPushing ? 'animate-spin' : ''}`} />
                <span>{isPushing ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลขึ้นชีตทันที'}</span>
              </button>
            </div>
          </div>

          {/* Export & Import Backup */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                สำรองและถ่ายโอนข้อมูล (Backup & Transfer)
              </h4>
              <p className="text-2xs text-slate-500 dark:text-slate-400">
                ดาวน์โหลดไฟล์ CSV ตามแบบ 8500 หรือนำเข้าข้อมูล JSON
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออก CSV (Excel)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportBox(!showImportBox)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>นำเข้า JSON</span>
              </button>
            </div>
          </div>

          {showImportBox && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                วางข้อมูล JSON:
              </label>
              <textarea
                rows={4}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='[ { "contractNo": "ย.01/2568", "borrowerName": "...", ... } ]'
                className="w-full p-2.5 text-2xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportBox(false)}
                  className="px-3 py-1 text-xs text-slate-500"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleImportJson}
                  className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  นำเข้าข้อมูล
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CODE.GS (BACKEND) */}
      {activeSubTab === 'code-gs' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  สคริปต์หลักฝั่งเซิร์ฟเวอร์ (Code.gs)
                </h3>
                <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Backend API & Database
                </span>
              </div>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                ทำหน้าที่อ่าน-เขียนข้อมูลใน Google Sheets, ให้บริการ REST API และเชื่อมต่อกับ Index.html ผ่าน google.script.run
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadCodeGs}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                title="ดาวน์โหลดไฟล์ Code.gs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด Code.gs</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>คัดลอกสำเร็จแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>คัดลอก Code.gs</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-2xs font-mono max-h-[500px] leading-relaxed border border-slate-800 select-all">
            <code>{AppsScriptService.getAppsScriptCode()}</code>
          </pre>
        </div>
      )}

      {/* TAB 3: INDEX.HTML (FRONTEND เชื่อมต่อ APP SCRIPT) */}
      {activeSubTab === 'code-index' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  หน้าเว็บเชื่อมต่อ Apps Script (Index.html)
                </h3>
                <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Web App Interface
                </span>
              </div>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                สร้างไฟล์ชื่อ <strong>Index.html</strong> ในโปรเจกต์ Apps Script แล้ววางโค้ดนี้ เพื่อให้ Web App มีหน้าจอทะเบียนคุมเงินยืม (แบบ 8500) ฉบับสมบูรณ์
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadIndexHtml}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                title="ดาวน์โหลดไฟล์ Index.html ลงเครื่อง"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด Index.html</span>
              </button>

              <button
                type="button"
                onClick={handleCopyIndexHtml}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                {isIndexCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>คัดลอกโค้ดสำเร็จแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>คัดลอก Index.html</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Setup Card */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              <span>วิธีเพิ่ม Index.html ลงในโปรเจกต์ Google Apps Script (ทำง่ายๆ 3 ขั้นตอน):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-2xs sm:text-xs text-slate-700 dark:text-slate-300 pl-1">
              <li>ในหน้า Apps Script ทางซ้ายมือ คลิกเครื่องหมาย <strong>+</strong> ข้างๆ เมนู <strong>"ไฟล์" (Files)</strong> แล้วเลือก <strong>"HTML"</strong></li>
              <li>ตั้งชื่อไฟล์ว่า <strong className="text-emerald-700 dark:text-emerald-400 font-mono">Index</strong> (ไม่ต้องพิมพ์ .html ระบบจะเติมให้อัตโนมัติ)</li>
              <li>ลบโค้ดเริ่มต้นออกทั้งหมด วางโค้ดด้านล่างนี้ลงไป แล้วกดปุ่ม <strong>บันทึก (แผ่นดิสก์)</strong></li>
            </ol>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-2xs font-mono max-h-[500px] leading-relaxed border border-slate-800 select-all">
            <code>{AppsScriptService.getAppsScriptIndexHtml()}</code>
          </pre>
        </div>
      )}

      {/* TAB 4: HELP GUIDE */}
      {activeSubTab === 'help' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              วิธีติดตั้งและเชื่อมต่อ Google Sheets ผ่าน Apps Script (Code.gs + Index.html)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ทำตามขั้นตอนด้านล่างนี้เพื่อเปิดใช้งาน Google Sheets เป็นฐานข้อมูลของระบบได้ฟรีตลอดชีพ
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                1
              </span>
              <div>
                <strong className="text-sm text-slate-900 dark:text-white">สร้าง Google Sheets</strong>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  เปิด Google Drive หรือไปที่ sheets.new สร้างชีตใหม่ ตั้งชื่อไฟล์ตามต้องการ เช่น <em>"ทะเบียนคุมสัญญายืมเงินราชการ"</em>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                2
              </span>
              <div>
                <strong className="text-sm text-slate-900 dark:text-white">เปิดตัวแก้ไข Apps Script</strong>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  ในหน้า Google Sheets คลิกที่เมนู <strong>"ส่วนขยาย" (Extensions)</strong> &gt; <strong>"Apps Script"</strong> หน้าต่างใหม่ของโปรแกรมจะเปิดขึ้นมา
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                3
              </span>
              <div>
                <strong className="text-sm text-slate-900 dark:text-white">วางโค้ด Code.gs และสร้าง Index.html</strong>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  - <strong>ไฟล์ Code.gs:</strong> ลบโค้ดเดิมทั้งหมด แล้วคัดลอกจากแท็บ <strong>"สคริปต์หลัก (Code.gs)"</strong> มาวาง<br />
                  - <strong>ไฟล์ Index.html:</strong> คลิกเครื่องหมาย <strong>+</strong> ข้างเมนู "ไฟล์" (Files) &gt; เลือก <strong>"HTML"</strong> &gt; ตั้งชื่อว่า <strong>"Index"</strong> แล้วนำโค้ดจากแท็บ <strong>"หน้าเว็บเชื่อมต่อ (Index.html)"</strong> มาวาง<br />
                  - กดปุ่มบันทึก (รูปแผ่นดิสก์)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                4
              </span>
              <div>
                <strong className="text-sm text-slate-900 dark:text-white">Deploy เป็น Web App (สำคัญที่สุด)</strong>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  ที่มุมบนขวา คลิกปุ่มสีน้ำเงิน <strong>"การทำให้ใช้งานได้" (Deploy)</strong> &gt; <strong>"การทำให้ใช้งานได้รายการใหม่" (New Deployment)</strong><br />
                  - เลือกประเภท (ฟันเฟือง): <strong>"เว็บแอป" (Web App)</strong><br />
                  - ดำเนินการในฐานะ (Execute as): <strong>"ฉัน" (Me)</strong><br />
                  - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): <strong>"ทุกคน" (Anyone)</strong> <em>(จำเป็นต้องเลือก Anyone เพื่อให้ระบบเชื่อมต่อได้โดยไม่ต้องใช้รหัสผ่าน)</em><br />
                  - กด <strong>"ทำให้ใช้งานได้" (Deploy)</strong> และให้สิทธิ์เข้าถึง (Authorize access)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                5
              </span>
              <div>
                <strong className="text-sm text-slate-900 dark:text-white">นำ Web App URL มาใส่ในระบบ</strong>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  คัดลอก <strong>URL ของเว็บแอป</strong> (ขึ้นต้นด้วย <code>https://script.google.com/macros/s/.../exec</code>) นำมาวางในช่อง Web App URL ในแท็บ <strong>"ตั้งค่าและซิงค์ข้อมูล"</strong> แล้วกด <strong>"ทดสอบการเชื่อมต่อ"</strong> และกด <strong>"ส่งข้อมูลขึ้นชีตทันที"</strong> เป็นอันเสร็จสมบูรณ์!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
