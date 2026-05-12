import { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Fish, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ControlCenterProps {
  onFeed: () => Promise<void>;
  isOnline: boolean;
}

export const ControlCenter = ({ onFeed, isOnline }: ControlCenterProps) => {
  const [isFeeding, setIsFeeding] = useState(false);

  const handleFeed = async () => {
    setIsFeeding(true);
    try {
      await onFeed();
    } finally {
      // Keep feeding state for a bit for animation
      setTimeout(() => setIsFeeding(false), 3000);
    }
  };

  return (
    <Card className="glass-card overflow-hidden group border-0 relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-all duration-500 scale-150 -rotate-12 translate-x-4 -translate-y-4">
        <Fish size={150} />
      </div>
      
      <CardContent className="flex flex-col items-center justify-center py-14 relative z-10">
        <div className="relative mb-10">
          {/* Animated Glow Rings */}
          <AnimatePresence>
            {isFeeding && (
              <>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.5, scale: 1.5 }}
                  exit={{ opacity: 0, scale: 2 }}
                  className="absolute inset-0 bg-emerald-500/30 rounded-full blur-2xl"
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.3, scale: 2 }}
                  exit={{ opacity: 0, scale: 2.5 }}
                  className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl"
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
              </>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={isOnline && !isFeeding ? { scale: 1.05 } : {}}
            whileTap={isOnline && !isFeeding ? { scale: 0.95 } : {}}
          >
            <Button
              variant="primary"
              disabled={!isOnline || isFeeding}
              onClick={handleFeed}
              className={`h-36 w-36 rounded-full flex flex-col items-center justify-center space-y-2 border-0 shadow-2xl transition-all duration-500 ${
                isFeeding 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' 
                : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600'
              } ${!isOnline ? 'opacity-20 grayscale' : 'opacity-100'}`}
            >
              {isFeeding ? (
                <Loader2 size={36} className="animate-spin" />
              ) : (
                <Zap size={36} className={isOnline ? 'animate-pulse' : ''} />
              )}
              <span className="text-[10px] font-black tracking-[0.2em] uppercase leading-none">
                {isFeeding ? 'FEEDING...' : 'FEED NOW'}
              </span>
            </Button>
          </motion.div>
        </div>

        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black tracking-tight uppercase italic text-gradient letter-spacing-tight">Instant Command</h2>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[11px] text-white/30 uppercase tracking-[0.15em] font-bold">
              {isOnline 
                ? (isFeeding ? 'Dispensing Pakan' : 'One-tap remote control') 
                : 'Connection Lost'}
            </p>
            {!isOnline && (
              <p className="text-[10px] text-red-500/60 uppercase tracking-widest font-bold animate-pulse">
                Check Device Connection
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
