import { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Fish, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface ControlCenterProps {
  onFeed: () => Promise<void>;
  isOnline: boolean;
}

export const ControlCenter = ({ onFeed, isOnline }: ControlCenterProps) => {
  const [isFeeding, setIsFeeding] = useState(false);

  const handleFeed = async () => {
    setIsFeeding(true);
    await onFeed();
    // Simulate feeding animation duration
    setTimeout(() => setIsFeeding(false), 3000);
  };

  return (
    <Card className="relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Fish size={120} />
      </div>
      
      <CardContent className="flex flex-col items-center justify-center py-10">
        <div className="relative mb-8">
          <div className={`absolute -inset-4 rounded-full blur-2xl transition-all duration-500 ${isFeeding ? 'bg-accent/40 opacity-100 scale-125' : 'bg-accent/0 opacity-0'}`} />
          <motion.div
            animate={isFeeding ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            <Button
              variant="primary"
              size="lg"
              disabled={!isOnline || isFeeding}
              onClick={handleFeed}
              className="h-32 w-32 rounded-full border-4 border-black text-black z-10 relative flex-col space-y-1"
            >
              <Zap size={32} className={isFeeding ? 'animate-bounce' : ''} />
              <span className="text-xs font-black tracking-tighter">FEED NOW</span>
            </Button>
          </motion.div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight uppercase italic text-gradient">Instant Command</h2>
          <p className="text-sm text-white/40 max-w-[200px] mx-auto font-medium">
            {isOnline 
              ? (isFeeding ? 'Dispensing pakan...' : 'Klik untuk memberi pakan secara manual') 
              : 'Alat offline. Perintah tidak dapat dikirim.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
