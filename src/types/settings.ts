export type ThemeMode = 'light' | 'dark';

export type ColorThemeId = 'emerald' | 'indigo' | 'pink' | 'violet' | 'sky' | 'navy' | 'ruby' | 'amber';

export interface ColorThemeOption {
  id: ColorThemeId;
  name: string;
  subname: string;
  primaryColor: string;
  primaryHover: string;
  bgLight: string;
  ringColor: string;
  accentHex: string;
  gradient: string;
}

export interface AppSettings {
  themeMode: ThemeMode;
  colorTheme: ColorThemeId;
  itemsPerPage: 10 | 20 | 30;
}

export const COLOR_THEMES: ColorThemeOption[] = [
  {
    id: 'emerald',
    name: 'เขียวมรกตราชการ (Emerald / Teal)',
    subname: 'สีเขียวมาตรฐานการเงินการคลัง คงไว้ตามระเบียบราชการ (Keep Green)',
    primaryColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    primaryHover: 'hover:bg-emerald-700',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    ringColor: 'ring-emerald-500',
    accentHex: '#059669',
    gradient: 'linear-gradient(94deg, #059669, #14B8A6)',
  },
  {
    id: 'indigo',
    name: 'น้ำเงินคราม (Indigo Blue)',
    subname: 'สีครามล้ำสมัย โทนหลักทางการของระบบ ProTrack',
    primaryColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    primaryHover: 'hover:bg-indigo-700',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    ringColor: 'ring-indigo-500',
    accentHex: '#6366F1',
    gradient: 'linear-gradient(94deg, #4F46E5, #6366F1)',
  },
  {
    id: 'pink',
    name: 'ชมพูเบอร์รี่ (Berry Pink Accent)',
    subname: 'สีเน้นหลักของระบบ ProTrack สดใส โดดเด่น ชัดเจน',
    primaryColor: 'bg-pink-600 hover:bg-pink-700 text-white',
    primaryHover: 'hover:bg-pink-700',
    bgLight: 'bg-pink-50 dark:bg-pink-950/40 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    ringColor: 'ring-pink-500',
    accentHex: '#EC4899',
    gradient: 'linear-gradient(94deg, #DB2777, #EC4899)',
  },
  {
    id: 'violet',
    name: 'ม่วงสากล (Royal Violet)',
    subname: 'สีม่วงล้ำลึก สุขุม ทันสมัย ระดับผู้บริหารสากล',
    primaryColor: 'bg-purple-600 hover:bg-purple-700 text-white',
    primaryHover: 'hover:bg-purple-700',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    ringColor: 'ring-purple-500',
    accentHex: '#A855F7',
    gradient: 'linear-gradient(94deg, #7E22CE, #A855F7)',
  },
  {
    id: 'sky',
    name: 'ฟ้าครามสดใส (Sky Blue)',
    subname: 'สีฟ้าโปร่ง สะอาดตา สบายตา เหมาะสำหรับทำงานต่อเนื่อง',
    primaryColor: 'bg-sky-500 hover:bg-sky-600 text-white',
    primaryHover: 'hover:bg-sky-600',
    bgLight: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    ringColor: 'ring-sky-400',
    accentHex: '#38BDF8',
    gradient: 'linear-gradient(94deg, #0284C7, #38BDF8)',
  },
];
