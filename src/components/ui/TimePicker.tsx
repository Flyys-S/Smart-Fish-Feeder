import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Moon, Sun } from 'lucide-react';

interface TimePickerProps {
  value: string; // HH:mm format (24h)
  onChange: (value: string) => void;
}

export const TimePicker = ({ value, onChange }: TimePickerProps) => {
  const [hours, setHours] = useState(8);
  const [minutes, setMinutes] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [picking, setPicking] = useState<'hours' | 'minutes'>('hours');

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      const isPM = h >= 12;
      setHours(h % 12 || 12);
      setMinutes(m);
      setAmpm(isPM ? 'PM' : 'AM');
    }
  }, [value]);

  const updateValue = (h: number, m: number, p: 'AM' | 'PM') => {
    let finalH = h % 12;
    if (p === 'PM') finalH += 12;
    const formatted = `${finalH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    onChange(formatted);
  };

  const handleHourSelect = (h: number) => {
    setHours(h);
    updateValue(h, minutes, ampm);
    setTimeout(() => setPicking('minutes'), 300);
  };

  const handleMinuteSelect = (m: number) => {
    setMinutes(m);
    updateValue(hours, m, ampm);
  };

  const toggleAmpm = () => {
    const next = ampm === 'AM' ? 'PM' : 'AM';
    setAmpm(next);
    updateValue(hours, minutes, next);
  };

  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="flex flex-col items-center space-y-6 select-none">
      {/* Display */}
      <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div 
          className={`cursor-pointer transition-all ${picking === 'hours' ? 'text-blue-400 scale-110' : 'text-white/40'}`}
          onClick={() => setPicking('hours')}
        >
          <span className="text-4xl font-black tabular-nums">{hours.toString().padStart(2, '0')}</span>
        </div>
        <span className="text-4xl font-black text-white/20">:</span>
        <div 
          className={`cursor-pointer transition-all ${picking === 'minutes' ? 'text-blue-400 scale-110' : 'text-white/40'}`}
          onClick={() => setPicking('minutes')}
        >
          <span className="text-4xl font-black tabular-nums">{minutes.toString().padStart(2, '0')}</span>
        </div>
        <div 
          onClick={toggleAmpm}
          className="cursor-pointer ml-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center group"
        >
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{ampm}</span>
          {ampm === 'AM' ? (
            <Sun size={12} className="text-orange-400 mt-0.5 group-hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={12} className="text-blue-300 mt-0.5 group-hover:-rotate-12 transition-transform" />
          )}
        </div>
      </div>

      {/* Clock Face */}
      <div className="relative w-64 h-64 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
        {/* Center Dot */}
        <div className="absolute w-2 h-2 rounded-full bg-blue-500 z-20 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        
        {/* Hand */}
        <motion.div 
          className="absolute bottom-1/2 left-1/2 w-1 bg-gradient-to-t from-blue-600 to-blue-400 origin-bottom z-10 rounded-full"
          animate={{ 
            rotate: picking === 'hours' ? (hours * 30) : (minutes * 6),
            height: picking === 'hours' ? '35%' : '42%'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />

        {/* Numbers */}
        <AnimatePresence mode="wait">
          <motion.div
            key={picking}
            initial={{ opacity: 0, scale: 0.9, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.1, rotate: 10 }}
            className="absolute inset-0"
          >
            {(picking === 'hours' ? hourNumbers : minuteNumbers).map((num, i) => {
              const angle = (i * 30) * (Math.PI / 180);
              const r = 95; // Radius
              const x = Math.sin(angle) * r;
              const y = -Math.cos(angle) * r;
              
              const isSelected = picking === 'hours' ? hours === num : minutes === num;

              return (
                <button
                  key={num}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isSelected 
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                      : 'text-white/40 hover:text-white hover:bg-white/10'
                  }`}
                  style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                  onClick={() => picking === 'hours' ? handleHourSelect(num) : handleMinuteSelect(num)}
                >
                  {picking === 'minutes' ? num.toString().padStart(2, '0') : num}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex space-x-2">
        <button 
          onClick={() => setPicking('hours')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            picking === 'hours' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/30'
          }`}
        >
          Hours
        </button>
        <button 
          onClick={() => setPicking('minutes')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            picking === 'minutes' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/30'
          }`}
        >
          Minutes
        </button>
      </div>
    </div>
  );
};
