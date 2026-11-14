import React, { useState } from 'react';
import { Menu, Plus, X } from 'lucide-react';
import { AppScreen } from '../types/agronomy';

interface HeaderBarProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onOpenNewLot: () => void;
}

const NAV_ITEMS: Array<{ id: AppScreen; label: string }> = [
  { id: AppScreen.LOTES, label: 'Lotes' },
  { id: AppScreen.SATELITE, label: 'Satélite' },
  { id: AppScreen.CUADERNO, label: 'Cuaderno' },
  { id: AppScreen.HISTORIA, label: 'Historia' },
];

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeScreen,
  onNavigate,
  onOpenNewLot,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#FEFAE0]/95 backdrop-blur-sm border-b border-[#DECFA7]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => {
            onNavigate(AppScreen.LOTES);
            setMobileMenuOpen(false);
          }}
          className="text-xl tracking-[0.06em] text-[#283618] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#606C38] rounded"
        >
          <span className="font-extralight uppercase">TERRA</span>
          <span className="font-bold">VIVA</span>
        </button>

        {/* Zone 2: 4 single-line text navigation links */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-sm font-bold tracking-[0.06em] whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#606C38] rounded ${
                  isActive
                    ? 'text-[#283618]'
                    : 'text-[#3B2F20]/75 hover:text-[#9A5518]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#606C38]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + mobile menu trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenNewLot}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#BC6C25] hover:bg-[#9A5518] active:scale-[0.98] active:bg-[#814612] text-white text-xs sm:text-sm font-bold tracking-[0.05em] px-4 py-2 whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#283618]"
          >
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>Nuevo lote</span>
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#DECFA7] bg-[#EFE3C2]/60 text-[#283618] hover:bg-[#EFE3C2]"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Navegación móvil"
          className="md:hidden border-t border-[#DECFA7] bg-[#FEFAE0] px-4 py-3 flex flex-wrap gap-2"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-3.5 py-2 rounded-lg text-sm font-bold tracking-[0.05em] whitespace-nowrap ${
                  isActive
                    ? 'bg-[#283618] text-[#FEFAE0]'
                    : 'bg-[#EFE3C2]/70 text-[#3B2F20] hover:bg-[#EFE3C2]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
