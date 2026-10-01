import { 
  Menu, 
  PanelLeftClose, 
  PanelLeft, 
  Plus, 
  Download, 
  Settings, 
  Sun, 
  Moon
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { AppSettings, COLOR_THEMES } from '../types/settings';
import { BanknoteLogo } from './BanknoteLogo';

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

  const getTabLabel = (tab: NavTab) => {
    switch (tab) {
      case 'overview':
        return 'ภาพรวมทะเบียนสัญญายืมเงิน';
      case 'contracts':
        return 'ทะเบียนคุมสัญญาเงิน (เงินนอกงบประมาณ)';
      case 'overdue':
        return 'ทะเบียนติดตามหนี้เงินยืมเกินกำหนดส่งใช้';
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
    <header 
      className="sticky top-0 z-30 backdrop-blur-md border-b print:hidden transition-colors"
      style={{
        backgroundColor: 'var(--glass)',
        borderColor: 'var(--line)',
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left Zone: Sidebar Toggles & Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={onOpenMobileSidebar}
              className="p-2 -ml-2 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-3)] rounded-xl md:hidden transition-colors cursor-pointer"
              title="เปิดเมนูสไลด์บาร์"
              aria-label="เปิดเมนู"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex items-center justify-center p-2 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-3)] rounded-xl transition-colors cursor-pointer"
              title={isCollapsed ? 'ขยายสไลด์บาร์ (Expand)' : 'ย่อสไลด์บาร์ (Collapse)'}
              aria-label={isCollapsed ? 'ขยายสไลด์บาร์' : 'ย่อสไลด์บาร์'}
            >
              {isCollapsed ? (
                <PanelLeft className="w-5 h-5" style={{ color: currentTheme.accentHex }} />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            {/* Website Logo - Banknote Emblem identical to sidebar */}
            <div className="flex items-center shrink-0">
              <BanknoteLogo 
                className="w-9 h-9 rounded-xl shadow-xs" 
                iconClassName="w-4.5 h-4.5 text-white" 
                bgColor={currentTheme.accentHex} 
                title="ระบบทะเบียนคุมสัญญายืมเงินราชการ"
              />
            </div>

            {/* Page Title & Breadcrumb */}
            <div className="min-w-0">
              <div className="text-2xs font-medium truncate text-[var(--muted)]">
                ระบบทะเบียนคุมเงินยืมราชการ
              </div>
              <h2 className="text-sm sm:text-base font-extrabold truncate leading-tight text-[var(--ink)]">
                {getTabLabel(activeTab)}
              </h2>
            </div>
          </div>

          {/* Right Zone: Theme Switcher, Quick Actions & Overdue Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Overdue Badge */}
            {overdueCount > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <span>ค้างเกินกำหนด: {overdueCount} สัญญา</span>
              </div>
            )}

            {/* Light / Dark Mode Quick Toggle */}
            <button
              onClick={onToggleThemeMode}
              className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer hover:scale-105"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--line)',
                color: 'var(--ink-2)',
              }}
              title={settings.themeMode === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง (Light Mode)' : 'เปลี่ยนเป็นโหมดมืด (Dark Mode)'}
              aria-label="เปลี่ยนโหมดมืด/สว่าง"
            >
              {settings.themeMode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Settings Quick Button */}
            <button
              onClick={onOpenSettings}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer hover:scale-105 ${
                activeTab === 'settings'
                  ? 'border-transparent text-white font-bold'
                  : 'hover:bg-[var(--surface-3)]'
              }`}
              style={
                activeTab === 'settings'
                  ? { background: currentTheme.gradient || currentTheme.accentHex, color: '#fff' }
                  : { backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink-2)' }
              }
              title="การตั้งค่าระบบ (สีธีม / โหมดมืด / จำนวนแถว)"
              aria-label="การตั้งค่า"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Export CSV */}
            <button
              onClick={onExportCSV}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full border transition-all whitespace-nowrap shadow-xs cursor-pointer hover:bg-[var(--surface-3)]"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--line)',
                color: 'var(--ink-2)',
              }}
              title="ส่งออกรายงาน Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" style={{ color: currentTheme.accentHex }} />
              <span>ส่งออก CSV</span>
            </button>

            {/* Add Contract Button */}
            <button
              onClick={onOpenAddModal}
              style={{ 
                background: currentTheme.gradient || currentTheme.accentHex,
                boxShadow: `0 8px 20px ${currentTheme.accentHex}35`
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white hover:brightness-105 rounded-full transition-all whitespace-nowrap shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกสัญญาใหม่</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
