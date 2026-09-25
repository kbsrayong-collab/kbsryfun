import React, { useState, useEffect } from 'react';
import { AppSheetConfig, AppsScriptConfig, LoanContract, LoanStatus } from './types/loan';
import { LoanStorageService, DEFAULT_APPSHEET_CONFIG, DEFAULT_APPS_SCRIPT_CONFIG } from './services/loanStorage';
import { AppsScriptService } from './services/appsScriptService';
import { calculateLoanSummary } from './utils/loanCalculations';
import { AppSettings, COLOR_THEMES, ColorThemeId, ThemeMode } from './types/settings';

// Components
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardStats } from './components/DashboardStats';
import { LoanTable } from './components/LoanTable';
import { OverdueView } from './components/OverdueView';
import { DemandLetterHub } from './components/DemandLetterHub';
import { SettingsView } from './components/SettingsView';
import { AppsScriptView } from './components/AppsScriptView';
import { ContractDetailModal } from './components/ContractDetailModal';
import { AddEditContractModal } from './components/AddEditContractModal';
import { AddRepaymentModal } from './components/AddRepaymentModal';
import { OfficialDemandLetterModal } from './components/OfficialDemandLetterModal';
import { Form8500PrintView } from './components/Form8500PrintView';
import { AppSheetSyncModal } from './components/AppSheetSyncModal';
import { AppsScriptSyncModal } from './components/AppsScriptSyncModal';

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'light',
  colorTheme: 'emerald',
  itemsPerPage: 10,
};

export default function App() {
  const [contracts, setContracts] = useState<LoanContract[]>([]);
  const [appSheetConfig, setAppSheetConfig] = useState<AppSheetConfig>(DEFAULT_APPSHEET_CONFIG);
  const [appsScriptConfig, setAppsScriptConfig] = useState<AppsScriptConfig>(DEFAULT_APPS_SCRIPT_CONFIG);
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  // App Settings State (with LocalStorage Persistence)
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedMode = localStorage.getItem('gov_loan_theme_mode') as ThemeMode | null;
        const savedColor = localStorage.getItem('gov_loan_color_theme') as ColorThemeId | null;
        const savedItems = localStorage.getItem('gov_loan_items_per_page');
        const parsedItems = savedItems ? parseInt(savedItems, 10) : 10;
        const validItems = parsedItems === 20 ? 20 : parsedItems === 30 ? 30 : 10;

        return {
          themeMode: savedMode === 'dark' ? 'dark' : 'light',
          colorTheme: (['emerald', 'navy', 'indigo', 'ruby', 'amber'].includes(savedColor || '')
            ? savedColor
            : 'emerald') as ColorThemeId,
          itemsPerPage: validItems,
        };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Synchronize Theme & Dark Mode with DOM Document
  useEffect(() => {
    const root = document.documentElement;
    if (settings.themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-color-theme', settings.colorTheme);
  }, [settings.themeMode, settings.colorTheme]);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        if (newSettings.themeMode) {
          localStorage.setItem('gov_loan_theme_mode', newSettings.themeMode);
        }
        if (newSettings.colorTheme) {
          localStorage.setItem('gov_loan_color_theme', newSettings.colorTheme);
        }
        if (newSettings.itemsPerPage) {
          localStorage.setItem('gov_loan_items_per_page', String(newSettings.itemsPerPage));
        }
      }
      return updated;
    });
  };

  const handleToggleThemeMode = () => {
    handleUpdateSettings({
      themeMode: settings.themeMode === 'dark' ? 'light' : 'dark',
    });
  };

  const handleResetSettings = () => {
    handleUpdateSettings(DEFAULT_SETTINGS);
  };

  // Sidebar state (with localStorage persistence)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gov_loan_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('gov_loan_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const handleSetCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsSidebarCollapsed(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') {
        localStorage.setItem('gov_loan_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  // Table Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LoanStatus>('all');
  const [fiscalYearFilter, setFiscalYearFilter] = useState<'all' | number>('all');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | string>('all');

  // Modals State
  const [selectedContract, setSelectedContract] = useState<LoanContract | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<LoanContract | null>(null);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [isDemandLetterModalOpen, setIsDemandLetterModalOpen] = useState(false);
  const [isForm8500ModalOpen, setIsForm8500ModalOpen] = useState(false);
  const [isAppSheetModalOpen, setIsAppSheetModalOpen] = useState(false);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);

  // Load contracts from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loaded = LoanStorageService.getContracts();
    setContracts(loaded);
    const cfg = LoanStorageService.getAppSheetConfig();
    setAppSheetConfig(cfg);
    const gasCfg = LoanStorageService.getAppsScriptConfig();
    setAppsScriptConfig(gasCfg);
  };

  // Background Auto-sync to Google Sheets via Apps Script
  const triggerAutoSync = (updatedContracts: LoanContract[]) => {
    const currentCfg = LoanStorageService.getAppsScriptConfig();
    if (currentCfg.autoSync && currentCfg.webAppUrl) {
      AppsScriptService.syncAllContracts(currentCfg.webAppUrl, updatedContracts)
        .then(res => {
          if (res.success) {
            const newCfg: AppsScriptConfig = {
              ...currentCfg,
              lastSyncedAt: new Date().toISOString(),
              syncStatus: 'connected',
              errorMessage: undefined,
            };
            setAppsScriptConfig(newCfg);
            LoanStorageService.saveAppsScriptConfig(newCfg);
          }
        })
        .catch(err => {
          console.error('Apps Script auto-sync error:', err);
        });
    }
  };

  // Compute overdue count for badge
  const overdueCount = contracts.filter(c => {
    const summary = calculateLoanSummary(c);
    return summary.status === 'overdue' && summary.remainingDebt > 0;
  }).length;

  // Handlers for Contracts
  const handleOpenAddModal = () => {
    setContractToEdit(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (contract: LoanContract) => {
    setContractToEdit(contract);
    setIsAddEditModalOpen(true);
  };

  const handleSaveContract = (contractData: any) => {
    if (contractToEdit) {
      LoanStorageService.updateContract(contractToEdit.id, contractData);
    } else {
      LoanStorageService.addContract(contractData);
    }
    loadData();
    triggerAutoSync(LoanStorageService.getContracts());
  };

  const handleDeleteContract = (contractId: string) => {
    LoanStorageService.deleteContract(contractId);
    loadData();
    triggerAutoSync(LoanStorageService.getContracts());
    if (selectedContract?.id === contractId) {
      setSelectedContract(null);
      setIsDetailModalOpen(false);
    }
  };

  const handleViewContract = (contract: LoanContract) => {
    setSelectedContract(contract);
    setIsDetailModalOpen(true);
  };

  // Handlers for Repayments
  const handleOpenRepaymentModal = (contract: LoanContract) => {
    setSelectedContract(contract);
    setIsRepaymentModalOpen(true);
  };

  const handleSaveRepayment = (contractId: string, repaymentData: any) => {
    LoanStorageService.addRepayment(contractId, repaymentData);
    loadData();
    triggerAutoSync(LoanStorageService.getContracts());

    // Update selected contract view if open
    const updated = LoanStorageService.getContracts().find(c => c.id === contractId);
    if (updated) setSelectedContract(updated);
  };

  const handleVerifyRepayment = (contractId: string, repaymentId: string, verifierName: string) => {
    LoanStorageService.verifyRepayment(contractId, repaymentId, verifierName);
    loadData();
    triggerAutoSync(LoanStorageService.getContracts());

    const updated = LoanStorageService.getContracts().find(c => c.id === contractId);
    if (updated) setSelectedContract(updated);
  };

  const handleDeleteRepayment = (contractId: string, repaymentId: string) => {
    LoanStorageService.deleteRepayment(contractId, repaymentId);
    loadData();
    triggerAutoSync(LoanStorageService.getContracts());

    const updated = LoanStorageService.getContracts().find(c => c.id === contractId);
    if (updated) setSelectedContract(updated);
  };

  // Handlers for Demand Letters & Form 8500
  const handleOpenDemandLetter = (contract: LoanContract) => {
    setSelectedContract(contract);
    setIsDemandLetterModalOpen(true);
  };

  const handleOpenForm8500 = (contract: LoanContract) => {
    setSelectedContract(contract);
    setIsForm8500ModalOpen(true);
  };

  // Handlers for CSV Export
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-['Sarabun',sans-serif] transition-colors duration-200">
      {/* Collapsible Sidebar (Left) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'appsheet' || tab === 'appscript') {
            setActiveTab('appscript');
          } else {
            setActiveTab(tab);
          }
        }}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={handleSetCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        overdueCount={overdueCount}
        totalContractsCount={contracts.length}
        onOpenAddModal={handleOpenAddModal}
        onExportCSV={handleExportCSV}
        appSheetConfig={appSheetConfig}
        appsScriptConfig={appsScriptConfig}
        settings={settings}
      />

      {/* Main Content Area (Responsive margin offset for sidebar) */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* Top Header with breadcrumb, collapse toggle, quick theme switcher and actions */}
        <Header
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onOpenAddModal={handleOpenAddModal}
          onExportCSV={handleExportCSV}
          onOpenSettings={() => setActiveTab('settings')}
          overdueCount={overdueCount}
          settings={settings}
          onToggleThemeMode={handleToggleThemeMode}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Apps Script & Google Sheets Quick Link Status Badge */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-2.5 h-2.5 rounded-full ${appsScriptConfig.syncStatus === 'connected' && appsScriptConfig.webAppUrl ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-semibold text-slate-800 dark:text-slate-200">ฐานข้อมูล Google Sheets (Apps Script):</span>
              <span className="font-mono text-2xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                {appsScriptConfig.webAppUrl ? (appsScriptConfig.sheetName || 'ชีต: ทะเบียนคุมเงินยืม') : 'ยังไม่ได้ระบุ Web App URL'}
              </span>
              {appsScriptConfig.syncStatus === 'connected' && appsScriptConfig.webAppUrl && (
                <span className="text-3xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                  เชื่อมต่อแล้ว
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveTab('appscript')}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold underline cursor-pointer shrink-0"
            >
              ตั้งค่าการเชื่อมต่อ / ซิงค์ข้อมูล
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Dashboard Statistics */}
              <DashboardStats
                contracts={contracts}
                onSelectStatusFilter={(status) => {
                  setStatusFilter(status);
                  setActiveTab('contracts');
                }}
                onOpenDemandLetterTab={() => setActiveTab('demand-letters')}
              />

              {/* Registry Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    ทะเบียนคุมสัญญายืมเงินราชการ (แบบ 8500)
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ระบบติดตามสถานะและตรวจสอบยอดส่งใช้เงินยืมอัตโนมัติ
                  </span>
                </div>

                <LoanTable
                  contracts={contracts}
                  onViewContract={handleViewContract}
                  onEditContract={handleOpenEditModal}
                  onDeleteContract={handleDeleteContract}
                  onAddRepayment={handleOpenRepaymentModal}
                  onGenerateDemandLetter={handleOpenDemandLetter}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  fiscalYearFilter={fiscalYearFilter}
                  setFiscalYearFilter={setFiscalYearFilter}
                  departmentFilter={departmentFilter}
                  setDepartmentFilter={setDepartmentFilter}
                  itemsPerPage={settings.itemsPerPage}
                  onItemsPerPageChange={(val) => handleUpdateSettings({ itemsPerPage: val })}
                />
              </div>
            </div>
          )}

          {/* Tab 2: All Contracts */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    ทะเบียนคุมสัญญาเงินยืมทั้งหมด
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ตรวจสอบสถานะสัญญารายการต่อรายการ บันทึกส่งใช้เงินสดและใบสำคัญ
                  </p>
                </div>

                <button
                  onClick={handleOpenAddModal}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  + บันทึกสัญญายืมเงินใหม่
                </button>
              </div>

              <LoanTable
                contracts={contracts}
                onViewContract={handleViewContract}
                onEditContract={handleOpenEditModal}
                onDeleteContract={handleDeleteContract}
                onAddRepayment={handleOpenRepaymentModal}
                onGenerateDemandLetter={handleOpenDemandLetter}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                fiscalYearFilter={fiscalYearFilter}
                setFiscalYearFilter={setFiscalYearFilter}
                departmentFilter={departmentFilter}
                setDepartmentFilter={setDepartmentFilter}
                itemsPerPage={settings.itemsPerPage}
                onItemsPerPageChange={(val) => handleUpdateSettings({ itemsPerPage: val })}
              />
            </div>
          )}

          {/* Tab 3: Overdue Loans */}
          {activeTab === 'overdue' && (
            <OverdueView
              contracts={contracts}
              onGenerateDemandLetter={handleOpenDemandLetter}
              onViewContract={handleViewContract}
              onAddRepayment={handleOpenRepaymentModal}
            />
          )}

          {/* Tab 4: Demand Letter Hub */}
          {activeTab === 'demand-letters' && (
            <DemandLetterHub
              contracts={contracts}
              onOpenDemandLetterModal={handleOpenDemandLetter}
            />
          )}

          {/* Tab 5: Google Apps Script & Google Sheets Database */}
          {(activeTab === 'appscript' || activeTab === 'appsheet') && (
            <AppsScriptView
              appsScriptConfig={appsScriptConfig}
              onUpdateConfig={setAppsScriptConfig}
              contracts={contracts}
              onReloadContracts={loadData}
              onNavigateToContracts={() => setActiveTab('contracts')}
            />
          )}

          {/* Tab 6: Settings Menu (Theme 5 Options, Dark/Light Mode, Items Per Page 10, 20, 30) */}
          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetDefaults={handleResetSettings}
              onNavigateToContracts={() => setActiveTab('contracts')}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 print:hidden transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div>
              ระบบทะเบียนคุมสัญญายืมเงินราชการ (GovLoan Tracker) · แบบ 8500
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('appscript')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                title="คลิกเพื่อจัดการการเชื่อมต่อ Google Apps Script"
              >
                <span className={`w-2 h-2 rounded-full ${appsScriptConfig.syncStatus === 'connected' && appsScriptConfig.webAppUrl ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                <span>Google Apps Script: {appsScriptConfig.webAppUrl ? (appsScriptConfig.sheetName || 'เชื่อมต่อแล้ว') : 'ยังไม่ได้เชื่อมต่อ URL'}</span>
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      {/* 1. Contract Detail View */}
      {isDetailModalOpen && (
        <ContractDetailModal
          contract={selectedContract}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedContract(null);
          }}
          onAddRepayment={handleOpenRepaymentModal}
          onGenerateDemandLetter={handleOpenDemandLetter}
          onPrintForm8500={handleOpenForm8500}
          onVerifyRepayment={handleVerifyRepayment}
          onDeleteRepayment={handleDeleteRepayment}
        />
      )}

      {/* 2. Add / Edit Contract */}
      {isAddEditModalOpen && (
        <AddEditContractModal
          isOpen={isAddEditModalOpen}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setContractToEdit(null);
          }}
          onSave={handleSaveContract}
          contractToEdit={contractToEdit}
          existingContractsCount={contracts.length}
        />
      )}

      {/* 3. Add Repayment / Settlement */}
      {isRepaymentModalOpen && (
        <AddRepaymentModal
          contract={selectedContract}
          isOpen={isRepaymentModalOpen}
          onClose={() => {
            setIsRepaymentModalOpen(false);
          }}
          onSaveRepayment={handleSaveRepayment}
        />
      )}

      {/* 4. Official Demand Letter (บันทึกข้อความ ตราครุฑ) */}
      {isDemandLetterModalOpen && (
        <OfficialDemandLetterModal
          contract={selectedContract}
          isOpen={isDemandLetterModalOpen}
          onClose={() => {
            setIsDemandLetterModalOpen(false);
          }}
        />
      )}

      {/* 5. Official Form 8500 Print View */}
      {isForm8500ModalOpen && (
        <Form8500PrintView
          contract={selectedContract}
          isOpen={isForm8500ModalOpen}
          onClose={() => {
            setIsForm8500ModalOpen(false);
          }}
        />
      )}

      {/* 6. Google Apps Script Database Sync Modal */}
      {isAppsScriptModalOpen && (
        <AppsScriptSyncModal
          isOpen={isAppsScriptModalOpen}
          onClose={() => setIsAppsScriptModalOpen(false)}
          appsScriptConfig={appsScriptConfig}
          onUpdateConfig={setAppsScriptConfig}
          contracts={contracts}
          onReloadContracts={loadData}
        />
      )}

      {/* 7. AppSheet Database Sync & Data Manager */}
      {isAppSheetModalOpen && (
        <AppSheetSyncModal
          isOpen={isAppSheetModalOpen}
          onClose={() => setIsAppSheetModalOpen(false)}
          appSheetConfig={appSheetConfig}
          onUpdateConfig={setAppSheetConfig}
          contracts={contracts}
          onReloadContracts={loadData}
        />
      )}
    </div>
  );
}
