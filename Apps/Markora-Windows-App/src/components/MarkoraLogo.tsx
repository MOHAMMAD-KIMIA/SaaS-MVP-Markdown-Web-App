import React from 'react';

export interface MarkoraLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'default' | 'monochrome' | 'white';
}

export function MarkoraLogo({
  className = "w-6 h-6",
  size,
  variant = 'default'
}: MarkoraLogoProps) {
  const isMonochrome = variant === 'monochrome';
  const isWhite = variant === 'white';

  const primaryColor = isWhite 
    ? "#ffffff" 
    : isMonochrome 
      ? "currentColor" 
      : "#4f46e5"; // Indigo 600
  
  const cyanTopColor = isWhite 
    ? "#ffffff" 
    : isMonochrome 
      ? "currentColor" 
      : "#06b6d4"; // Cyan 500

  const cyanBottomColor = isWhite 
    ? "#ffffff" 
    : isMonochrome 
      ? "currentColor" 
      : "#0284c7"; // Sky 600

  const styleProps = size ? { width: size, height: size } : {};

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={styleProps}
      aria-label="Markora Logo"
    >
      {/* Leftmost Vertical Bar */}
      <path
        d="M 12 10 H 22 V 90 H 12 Z"
        fill={primaryColor}
      />

      {/* Main Document Frame */}
      <path
        d="M 32 36 L 32 10 L 68 10 L 88 30 L 88 70 L 68 90 L 32 90 L 32 64 L 42 64 L 42 80 L 68 80 L 78 70 L 78 30 L 68 20 L 42 20 L 42 36 Z"
        fill={primaryColor}
      />

      {/* Top-Right Fold Triangle (Cyan) */}
      <path
        d="M 68 10 L 88 30 L 68 30 Z"
        fill={cyanTopColor}
      />

      {/* Bottom-Right Fold Triangle (Teal/Sky) */}
      <path
        d="M 68 90 L 88 70 L 68 70 Z"
        fill={cyanBottomColor}
      />

      {/* Left Bracket < */}
      <path
        d="M 48 36 L 34 50 L 48 64 L 53 64 L 42 50 L 53 36 Z"
        fill={primaryColor}
      />

      {/* Right Bracket > */}
      <path
        d="M 64 36 L 78 50 L 64 64 L 59 64 L 70 50 L 59 36 Z"
        fill={primaryColor}
      />

      {/* Center I / T Cursor Bar */}
      <path
        d="M 50 34 H 62 V 39 H 58 V 61 H 62 V 66 H 50 V 61 H 54 V 39 H 50 Z"
        fill={primaryColor}
      />
    </svg>
  );
}

export default MarkoraLogo;
