import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function PremiumTimePicker({ label, value, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const dropdownRef = useRef(null);

  // Parsear hora en formato HH:MM a objeto {hour, minute, period}
  const parseTime = (timeString) => {
    if (!timeString) return { hour: 12, minute: 0, period: 'AM' };
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return {
      hour: hour12,
      minute: parseInt(minutes) || 0,
      period
    };
  };

  // Convertir objeto {hour, minute, period} a formato HH:MM
  const formatTime = (timeObj) => {
    let hour24 = timeObj.hour;
    if (timeObj.period === 'PM' && timeObj.hour !== 12) {
      hour24 = timeObj.hour + 12;
    } else if (timeObj.period === 'AM' && timeObj.hour === 12) {
      hour24 = 0;
    }
    return `${hour24.toString().padStart(2, '0')}:${timeObj.minute.toString().padStart(2, '0')}`;
  };

  const [selectedTime, setSelectedTime] = useState(parseTime(value));

  useEffect(() => {
    if (value) {
      setSelectedTime(parseTime(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedTime(parseTime(value));
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, value]);

  const handleApply = () => {
    const formatted = formatTime(selectedTime);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedTime(parseTime(value));
    setIsOpen(false);
  };

  const displayValue = value 
    ? (() => {
        const parsed = parseTime(value);
        return `${parsed.hour.toString().padStart(2, '0')}:${parsed.minute.toString().padStart(2, '0')} ${parsed.period}`;
      })()
    : '--:-- --';

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'];

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-xs font-medium text-neutral-400 mb-1">{label}</span>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-2.5 bg-neutral-800/50 border border-white/10 rounded-lg text-white text-sm font-mono flex items-center justify-between gap-2 transition-all duration-200 hover:border-white/20 hover:bg-neutral-800",
            isOpen && "border-white/30 bg-neutral-800",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-neutral-400" />
            <span>{displayValue}</span>
          </div>
          <ChevronDown 
            size={16} 
            className={cn(
              "text-neutral-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 w-full bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-neutral-800/50">
                <div className="text-sm font-semibold text-white text-center">
                  Seleccionar Hora
                </div>
              </div>

              {/* Time Selector */}
              <div className="flex h-[280px]">
                {/* Hours Column */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  <div className="py-2">
                    {hours.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => setSelectedTime({ ...selectedTime, hour })}
                        className={cn(
                          "w-full py-3 text-center text-sm font-mono transition-all duration-150",
                          selectedTime.hour === hour
                            ? "bg-white text-neutral-900 font-bold"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                        )}
                      >
                        {hour.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minutes Column */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent border-x border-white/10">
                  <div className="py-2">
                    {minutes.map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => setSelectedTime({ ...selectedTime, minute })}
                        className={cn(
                          "w-full py-3 text-center text-sm font-mono transition-all duration-150",
                          selectedTime.minute === minute
                            ? "bg-white text-neutral-900 font-bold"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                        )}
                      >
                        {minute.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Period Column */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  <div className="py-2">
                    {periods.map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setSelectedTime({ ...selectedTime, period })}
                        className={cn(
                          "w-full py-3 text-center text-sm font-mono transition-all duration-150",
                          selectedTime.period === period
                            ? "bg-white text-neutral-900 font-bold"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                        )}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-neutral-800/50 flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default PremiumTimePicker;

