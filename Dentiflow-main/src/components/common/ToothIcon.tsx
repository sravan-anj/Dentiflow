import React from 'react';

interface ToothIconProps {
  className?: string;
  size?: number;
}

export const ToothIcon: React.FC<ToothIconProps> = ({ className = '', size = 20 }) => {
  return (
    <img
      src="/oralix-symbol.png"
      alt="ORALIX"
      width={size}
      height={size}
      className={`object-contain inline-block shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      loading="eager"
    />
  );
};
