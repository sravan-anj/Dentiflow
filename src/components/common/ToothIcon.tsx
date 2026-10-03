import React from 'react';

interface ToothIconProps {
  className?: string;
  size?: number;
}

export const ToothIcon: React.FC<ToothIconProps> = ({ className = '', size = 18 }) => {
  return (
    <img
      src="/mlogo2_trimmed.jpeg"
      alt="Oralix Logo"
      className={`object-contain inline-block shrink-0 select-none ${className}`}
      style={{
        height: size ? `${size}px` : undefined,
        width: size ? `${size}px` : undefined,
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    />
  );
};

