import { 
  Menu, 
  PanelLeftClose, 
  PanelLeft, 
  Plus, 
  Download, 
  Settings, 
  Sun, 
  Moon,
  Cloud,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { AppSettings, COLOR_THEMES } from '../types/settings';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: NavTab;
  onOpenMobileSidebar: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAddModal: () => void;
  onExportCSV: () => void;
  onOpenSettings: () => void;
  overdueCount: number;
  settings: AppSettings;
  onToggleThemeMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  isCollapsed,
  onToggleCollapse,
  onOpenAddModal,
  onExportCSV,
  onOpenSettings,
  overdueCount,
  settings,
  onToggleThemeMode,
}) => {
  const currentTheme = COLOR_THEMES.find(t => t.id === settings.colorTheme) || COLOR_THEMES[0];
  const { currentUser, login, logout, loading } = useAuth();

  const getTabLabel = (tab: NavTab) => {
    switch (tab) {
      case 'overview':
        return 'ภาพรวมทะเบียนสัญญายืมเงิน';
      case 'contracts':
        return 'ทะเบียนคุมสัญญาเงิน (เงินนอกงบประมาณ)';
      case 'overdue':
        return 'ทะเบียนติดตามหนี้เงินยืมเกินกำหนดส่งใช้';
      case 'demand-letters':
        return 'ศูนย์ออกหนังสือทวงถามหนี้ (บันทึกข้อความตราครุฑ)';
      case 'appscript':
        return 'การเชื่อมต่อ Google Apps Script (Google Sheets)';
      case 'appsheet':
        return 'การเชื่อมต่อฐานข้อมูล Google Apps Script';
      case 'settings':
        return 'การตั้งค่าระบบและธีมการแสดงผล';
      default:
        return 'ระบบทะเบียนคุมสัญญายืมเงินราชการ';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 print:hidden transition-colors">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left Zone: Sidebar Toggles & Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={onOpenMobileSidebar}
              className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden transition-colors cursor-pointer"
              title="เปิดเมนูสไลด์บาร์"
              aria-label="เปิดเมนู"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title={isCollapsed ? 'ขยายสไลด์บาร์ (Expand)' : 'ย่อสไลด์บาร์ (Collapse)'}
              aria-label={isCollapsed ? 'ขยายสไลด์บาร์' : 'ย่อสไลด์บาร์'}
            >
              {isCollapsed ? (
                <PanelLeft className="w-5 h-5" style={{ color: currentTheme.accentHex }} />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              )}
            </button>

            {/* Page Title & Breadcrumb */}
            <div className="min-w-0">
              <div className="text-2xs text-slate-400 dark:text-slate-500 font-medium truncate">
                ระบบทะเบียนคุมเงินยืมราชการ
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
                {getTabLabel(activeTab)}
              </h2>
            </div>
          </div>

          {/* Right Zone: Theme Switcher, Quick Actions & Overdue Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Overdue Badge */}
            {overdueCount > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <span>ค้างเกินกำหนด: {overdueCount} สัญญา</span>
              </div>
            )}

            {/* Light / Dark Mode Quick Toggle */}
            <button
              onClick={onToggleThemeMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={settings.themeMode === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง (Light Mode)' : 'เปลี่ยนเป็นโหมดมืด (Dark Mode)'}
              aria-label="เปลี่ยนโหมดมืด/สว่าง"
            >
              {settings.themeMode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Settings Quick Button */}
            <button
              onClick={onOpenSettings}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="การตั้งค่าระบบ (สีธีม / โหมดมืด / จำนวนแถว / Firebase)"
              aria-label="การตั้งค่า"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Export CSV */}
            <button
              onClick={onExportCSV}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              title="ส่งออกรายงาน Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" style={{ color: currentTheme.accentHex }} />
              <span>ส่งออก CSV</span>
            </button>

            {/* Add Contract Button */}
            <button
              onClick={onOpenAddModal}
              style={{ backgroundColor: currentTheme.accentHex }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 rounded-lg transition-opacity whitespace-nowrap shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกสัญญาใหม่</span>
            </button>

            {/* Firebase Auth & Cloud Status */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 border-l border-slate-200 dark:border-slate-800">
                {/* Cloud indicator badge */}
                <div 
                  className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-medium"
                  title="เชื่อมต่อฐานข้อมูล Google Cloud Firestore เรียบร้อยแล้ว (Realtime Sync)"
                >
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden xl:inline">Firebase Cloud</span>
                </div>

                {/* User Profile display */}
                <div className="flex items-center gap-2">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'ผู้ใช้งาน'} 
                      className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                    />
                  ) : (
                    <div 
                      className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: currentTheme.accentHex }}
                    >
                      {currentUser.displayName ? currentUser.displayName.charAt(0) : <UserIcon className="w-3.5 h-3.5" />}
                    </div>
                  )}
                  <span className="hidden lg:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate" title={currentUser.email || currentUser.displayName || ''}>
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  title="ออกจากระบบ Firebase (Logout)"
                  aria-label="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                title="เข้าสู่ระบบด้วยบัญชี Google เพื่อเชื่อมต่อ Firebase Firestore"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-500" />
                <span>เข้าสู่ระบบ Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
