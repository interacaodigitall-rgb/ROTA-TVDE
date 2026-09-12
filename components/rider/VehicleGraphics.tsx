import React from 'react';

// Crisp, high-end automotive SVG silhouettes matching Uber's vehicle visual language
export const StandardCarSvg: React.FC<{ className?: string }> = ({ className = 'w-16 h-10' }) => (
  <svg viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <ellipse cx="80" cy="72" rx="66" ry="6" fill="#000" fillOpacity="0.4" />
    {/* Body Base */}
    <path 
      d="M18 56 C22 42 34 38 48 38 L110 38 C124 38 136 42 142 56 C144 60 142 64 138 65 L22 65 C18 64 16 60 18 56 Z" 
      fill="#E2E8F0" 
    />
    {/* Cabin Roof */}
    <path 
      d="M44 38 L58 18 C62 14 68 12 76 12 L102 12 C110 12 116 15 120 20 L130 38 Z" 
      fill="#CBD5E1" 
    />
    {/* Windows */}
    <path 
      d="M60 20 L76 20 L76 36 L48 36 Z" 
      fill="#1E293B" 
    />
    <path 
      d="M80 20 L102 20 C108 20 112 22 116 26 L124 36 L80 36 Z" 
      fill="#1E293B" 
    />
    {/* Headlight & Taillight */}
    <path d="M136 50 L144 54 L138 58 Z" fill="#38BDF8" opacity="0.9" />
    <path d="M16 52 L22 54 L18 58 Z" fill="#EF4444" />
    {/* Wheels */}
    <circle cx="44" cy="62" r="13" fill="#0F172A" stroke="#475569" strokeWidth="2.5" />
    <circle cx="44" cy="62" r="6" fill="#94A3B8" />
    <circle cx="116" cy="62" r="13" fill="#0F172A" stroke="#475569" strokeWidth="2.5" />
    <circle cx="116" cy="62" r="6" fill="#94A3B8" />
  </svg>
);

export const ElectricCarSvg: React.FC<{ className?: string }> = ({ className = 'w-16 h-10' }) => (
  <svg viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <ellipse cx="80" cy="72" rx="66" ry="6" fill="#000" fillOpacity="0.4" />
    {/* Body Base */}
    <path 
      d="M16 54 C20 40 32 36 46 36 L114 36 C128 36 140 40 144 54 C146 58 144 64 140 65 L20 65 C16 64 14 58 16 54 Z" 
      fill="#F1F5F9" 
    />
    {/* Aerodynamic Fastback Cabin */}
    <path 
      d="M42 36 L58 15 C62 11 69 10 77 10 L100 10 C110 10 118 14 126 22 L136 36 Z" 
      fill="#E2E8F0" 
    />
    {/* Glass Panoramic Roof Windows */}
    <path 
      d="M59 16 L76 16 L76 34 L46 34 Z" 
      fill="#0F172A" 
    />
    <path 
      d="M80 16 L100 16 C107 16 114 19 120 25 L130 34 L80 34 Z" 
      fill="#0F172A" 
    />
    {/* Electric Accent Stripe */}
    <path d="M46 48 L126 48" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
    {/* Headlight & Taillight */}
    <path d="M138 48 L146 52 L140 56 Z" fill="#34D399" />
    <path d="M14 50 L20 52 L16 56 Z" fill="#EF4444" />
    {/* Aero Wheels */}
    <circle cx="44" cy="62" r="13" fill="#0F172A" stroke="#10B981" strokeWidth="2" />
    <circle cx="44" cy="62" r="5" fill="#E2E8F0" />
    <circle cx="116" cy="62" r="13" fill="#0F172A" stroke="#10B981" strokeWidth="2" />
    <circle cx="116" cy="62" r="5" fill="#E2E8F0" />
  </svg>
);

export const VanXlSvg: React.FC<{ className?: string }> = ({ className = 'w-16 h-10' }) => (
  <svg viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <ellipse cx="80" cy="74" rx="72" ry="6" fill="#000" fillOpacity="0.4" />
    {/* High Roof Van Body */}
    <path 
      d="M14 54 C16 36 28 32 40 30 L124 30 C138 30 148 38 150 54 C152 60 150 66 144 67 L18 67 C14 66 12 60 14 54 Z" 
      fill="#E2E8F0" 
    />
    {/* Extended Cabin */}
    <path 
      d="M32 30 L44 12 C47 9 52 8 58 8 L134 8 C140 8 144 12 145 18 L147 30 Z" 
      fill="#CBD5E1" 
    />
    {/* 3 Windows Rows */}
    <path d="M46 14 L68 14 L68 28 L36 28 Z" fill="#1E293B" />
    <path d="M72 14 L102 14 L102 28 L72 28 Z" fill="#1E293B" />
    <path d="M106 14 L138 14 L140 28 L106 28 Z" fill="#1E293B" />
    {/* Roof rack detail */}
    <rect x="54" y="5" width="76" height="3" rx="1.5" fill="#64748B" />
    {/* Wheels */}
    <circle cx="42" cy="64" r="13.5" fill="#0F172A" stroke="#64748B" strokeWidth="2.5" />
    <circle cx="42" cy="64" r="6" fill="#94A3B8" />
    <circle cx="122" cy="64" r="13.5" fill="#0F172A" stroke="#64748B" strokeWidth="2.5" />
    <circle cx="122" cy="64" r="6" fill="#94A3B8" />
  </svg>
);

export const PrioridadeCarSvg: React.FC<{ className?: string }> = ({ className = 'w-16 h-10' }) => (
  <svg viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <ellipse cx="80" cy="72" rx="68" ry="6" fill="#000" fillOpacity="0.5" />
    {/* Deep Obsidian Black Tesla Body */}
    <path 
      d="M16 54 C20 40 32 36 46 36 L116 36 C130 36 142 40 146 54 C148 58 146 64 142 65 L20 65 C16 64 14 58 16 54 Z" 
      fill="#0F172A" 
    />
    {/* Sleek Low Roofline */}
    <path 
      d="M42 36 L58 15 C62 11 69 10 77 10 L102 10 C112 10 120 14 128 22 L138 36 Z" 
      fill="#1E293B" 
    />
    {/* Privacy Dark Tinted Glass */}
    <path 
      d="M59 16 L76 16 L76 34 L46 34 Z" 
      fill="#05080E" 
    />
    <path 
      d="M80 16 L102 16 C109 16 116 19 122 25 L132 34 L80 34 Z" 
      fill="#05080E" 
    />
    {/* Chrome trim accent */}
    <path d="M46 35 L134 35" stroke="#94A3B8" strokeWidth="1.2" />
    {/* Headlight & Taillight */}
    <path d="M140 48 L148 52 L142 56 Z" fill="#F8FAFC" />
    <path d="M14 50 L20 52 L16 56 Z" fill="#DC2626" />
    {/* Premium Sport Wheels with red calipers */}
    <circle cx="44" cy="62" r="13" fill="#020617" stroke="#334155" strokeWidth="2.5" />
    <circle cx="44" cy="62" r="5" fill="#E2E8F0" />
    <circle cx="118" cy="62" r="13" fill="#020617" stroke="#334155" strokeWidth="2.5" />
    <circle cx="118" cy="62" r="5" fill="#E2E8F0" />
  </svg>
);
