import React from 'react';

export const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* King Silhouette Base */}
      <path 
        d="M30 85H70V75C70 75 65 70 50 70C35 70 30 75 30 75V85Z" 
        fill="currentColor" 
      />
      
      {/* King Body / Line Graph Hybrid */}
      <path 
        d="M50 70V35M50 35L35 50M50 35L65 50" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* The Upward Trending Line Graph / King's Mantle */}
      <path 
        d="M25 65L40 50L55 60L80 25" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* The Arrow Head / King's Crown Cross */}
      <path 
        d="M70 25H80V35" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Crown Elements */}
      <circle cx="50" cy="20" r="5" fill="currentColor" />
      <path d="M40 28H60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
};
