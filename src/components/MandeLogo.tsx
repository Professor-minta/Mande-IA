import React from 'react';

interface MandeLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showGlow?: boolean;
}

export const MandeLogo: React.FC<MandeLogoProps> = ({
  size = 'md',
  className = '',
  showGlow = false,
}) => {
  const sizeMap = {
    xs: 'w-5 h-5',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const dimensionClass = typeof size === 'number' ? '' : sizeMap[size];
  const customStyle = typeof size === 'number' ? { width: size, height: size } : undefined;

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${dimensionClass} ${className}`}
      style={customStyle}
    >
      {showGlow && (
        <div className="absolute inset-0 bg-emerald-500/15 rounded-full blur-md -z-10" />
      )}
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
        aria-label="Logo Mande-IA"
      >
        {/* Bar 1: Green Short */}
        <rect x="10" y="52" width="14" height="36" rx="7" fill="#10B981" />

        {/* Bar 2: Green Medium */}
        <rect x="30" y="38" width="14" height="64" rx="7" fill="#10B981" />

        {/* Bar 3: Gold/Yellow Tall */}
        <rect x="50" y="24" width="14" height="92" rx="7" fill="#F59E0B" />

        {/* Bar 4: Core White Center Tallest */}
        <rect
          x="70"
          y="10"
          width="14"
          height="120"
          rx="7"
          fill="#FFFFFF"
          filter="drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))"
        />

        {/* Bar 5: Gold/Yellow Tall */}
        <rect x="90" y="24" width="14" height="92" rx="7" fill="#F59E0B" />

        {/* Bar 6: Red Medium */}
        <rect x="110" y="38" width="14" height="64" rx="7" fill="#EF4444" />

        {/* Bar 7: Red Short */}
        <rect x="130" y="52" width="14" height="36" rx="7" fill="#EF4444" />
      </svg>
    </div>
  );
};
