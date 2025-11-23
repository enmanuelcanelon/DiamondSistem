import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

function PremiumToggle({ label, value, onChange, disabled = false }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-xs font-medium text-neutral-400 mb-1">{label}</span>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => !disabled && onChange(true)}
          disabled={disabled}
          className={cn(
            "relative px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 min-w-[80px] flex items-center justify-center gap-2",
            value === true
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
              : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 border border-white/5 hover:border-white/10 hover:scale-[1.02]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {value === true && <Check size={16} className="animate-in fade-in zoom-in duration-200" />}
          Sí
        </button>
        <button
          type="button"
          onClick={() => !disabled && onChange(false)}
          disabled={disabled}
          className={cn(
            "relative px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 min-w-[80px] flex items-center justify-center gap-2",
            value === false
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105"
              : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 border border-white/5 hover:border-white/10 hover:scale-[1.02]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {value === false && <X size={16} className="animate-in fade-in zoom-in duration-200" />}
          No
        </button>
      </div>
    </div>
  );
}

export default PremiumToggle;

