import React from 'react';

const DEFAULT_LOGO_URL = '/logo.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showSubtitle?: boolean;
  atelierName?: string;
  className?: string;
  customLogoUrl?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  atelierName,
  className = '',
  customLogoUrl
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-full',
    md: 'w-10 h-10 rounded-full',
    lg: 'w-16 h-16 rounded-full',
    hero: 'w-24 h-24 rounded-full',
  }[size];

  const displayedSubtitle = atelierName || 'Luccy Ribeiro';
  const logoSrc = customLogoUrl || DEFAULT_LOGO_URL;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative flex-shrink-0">
        <img
          src={logoSrc}
          alt="Logo Organize Ateliê"
          className={`${sizeClasses} object-cover ring-2 ring-pink-200/90 shadow-sm bg-pink-50`}
          referrerPolicy="no-referrer"
        />
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#ac2471] rounded-full border-2 border-white flex items-center justify-center shadow-xs">
          <span className="text-[8px] text-white font-bold">✨</span>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="font-heading font-extrabold text-slate-800 tracking-tight text-base leading-none">
            Organize
          </span>
          <span className="font-heading font-extrabold text-[#ac2471] tracking-tight text-base leading-none">
            Ateliê
          </span>
        </div>
        {showSubtitle && (
          <span className="font-medium text-pink-600 text-xs leading-tight mt-0.5 tracking-tight truncate max-w-[170px]">
            {displayedSubtitle}
          </span>
        )}
      </div>
    </div>
  );
};


