import React from 'react';

interface MandeLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  layout?: 'inline' | 'stacked';
}

export const MandeLoader: React.FC<MandeLoaderProps> = ({
  size = 'md',
  label,
  className = '',
  layout = 'inline',
}) => {
  const sizeConfig = {
    xs: {
      box: 'w-6 h-5',
      barW: 10,
      gap: 3,
      fontSize: 'text-[10px]',
    },
    sm: {
      box: 'w-8 h-6',
      barW: 12,
      gap: 4,
      fontSize: 'text-xs',
    },
    md: {
      box: 'w-12 h-9',
      barW: 14,
      gap: 6,
      fontSize: 'text-xs sm:text-sm',
    },
    lg: {
      box: 'w-20 h-14',
      barW: 14,
      gap: 6,
      fontSize: 'text-sm sm:text-base',
    },
  }[size];

  const loaderVisual = (
    <div className={`relative inline-flex items-center justify-center ${sizeConfig.box} flex-shrink-0`}>
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain overflow-visible"
        aria-label="Chargement Mande-IA"
      >
        {/* Bar 1: Short Green */}
        <rect
          x="10"
          y="52"
          width="14"
          height="36"
          rx="7"
          fill="#10B981"
          className="animate-mande-wave-1"
        />

        {/* Bar 2: Medium Green */}
        <rect
          x="30"
          y="38"
          width="14"
          height="64"
          rx="7"
          fill="#10B981"
          className="animate-mande-wave-2"
        />

        {/* Bar 3: Tall Gold/Yellow */}
        <rect
          x="50"
          y="24"
          width="14"
          height="92"
          rx="7"
          fill="#F59E0B"
          className="animate-mande-wave-3"
        />

        {/* Bar 4: Center Core White */}
        <rect
          x="70"
          y="10"
          width="14"
          height="120"
          rx="7"
          fill="#FFFFFF"
          filter="drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))"
          className="animate-mande-wave-4"
        />

        {/* Bar 5: Tall Gold/Yellow */}
        <rect
          x="90"
          y="24"
          width="14"
          height="92"
          rx="7"
          fill="#F59E0B"
          className="animate-mande-wave-5"
        />

        {/* Bar 6: Medium Red */}
        <rect
          x="110"
          y="38"
          width="14"
          height="64"
          rx="7"
          fill="#EF4444"
          className="animate-mande-wave-6"
        />

        {/* Bar 7: Short Red */}
        <rect
          x="130"
          y="52"
          width="14"
          height="36"
          rx="7"
          fill="#EF4444"
          className="animate-mande-wave-7"
        />
      </svg>
    </div>
  );

  if (!label) {
    return <div className={`inline-flex items-center justify-center ${className}`}>{loaderVisual}</div>;
  }

  if (layout === 'stacked') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 text-center ${className}`}>
        {loaderVisual}
        <p className={`${sizeConfig.fontSize} text-zinc-300 font-medium tracking-tight animate-pulse`}>
          {label}
        </p>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {loaderVisual}
      <span className={`${sizeConfig.fontSize} text-zinc-300 font-medium tracking-tight`}>
        {label}
      </span>
    </div>
  );
};
