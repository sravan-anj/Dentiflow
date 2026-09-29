import React from 'react';

interface ToothIconProps {
  className?: string;
  size?: number;
}

export const ToothIcon: React.FC<ToothIconProps> = ({ className = '', size = 18 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2C7.5 2 4 4.5 4 8c0 3.5 1.5 5.5 3 9.5 1 2.7 2.5 4.5 5 4.5s4-1.8 5-4.5c1.5-4 3-6 3-9.5 0-3.5-3.5-6-8-6z" />
    </svg>
  );
};
