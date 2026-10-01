import React from 'react';

interface BanknoteLogoProps {
  className?: string;
  iconClassName?: string;
  bgColor?: string;
  title?: string;
}

export const BanknoteIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-white" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* Modern Official Thai Banknote with Baht Center Medallion */}
    <rect x="2" y="5" width="20" height="14" rx="2.5" />
    <circle cx="12" cy="12" r="3.6" strokeWidth="1.5" />
    <path d="M12 9.5v5M10.8 11h2.2a1 1 0 0 1 0 2h-2.2" strokeWidth="1.5" />
    <line x1="5.5" y1="9" x2="5.5" y2="9.01" strokeWidth="2.5" />
    <line x1="5.5" y1="15" x2="5.5" y2="15.01" strokeWidth="2.5" />
    <line x1="18.5" y1="9" x2="18.5" y2="9.01" strokeWidth="2.5" />
    <line x1="18.5" y1="15" x2="18.5" y2="15.01" strokeWidth="2.5" />
  </svg>
);

export const BanknoteLogo: React.FC<BanknoteLogoProps> = ({ 
  className = "w-10 h-10 rounded-xl", 
  iconClassName = "w-5 h-5 text-white",
  bgColor = "#0284c7",
  title = "ระบบทะเบียนคุมสัญญายืมเงินราชการ"
}) => {
  return (
    <div 
      className={`${className} text-white flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white/20 transition-all hover:brightness-105`}
      style={{ backgroundColor: bgColor }}
      title={title}
    >
      <BanknoteIcon className={iconClassName} />
    </div>
  );
};
