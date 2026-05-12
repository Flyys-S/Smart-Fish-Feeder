import { useTime } from '../hooks/useTime';
import { Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
}

export const Header = ({ isOnline }: HeaderProps) => {
  const { hoursMinutes, seconds, ampm, dayMonth } = useTime();

  return (
    <header className="flex items-center justify-between py-6 px-4 sm:px-8 border-b border-white/5 glass sticky top-0 z-50">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-tight text-gradient">SMART FISH FEEDER</h1>
        <p className="text-xs text-white/40 font-medium uppercase tracking-widest">{dayMonth}</p>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex flex-col items-end">
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-bold tracking-tighter tabular-nums">{hoursMinutes}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-accent leading-none mb-1">{ampm}</span>
              <span className="text-lg font-medium text-white/30 tabular-nums leading-none">{seconds}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 pl-6 border-l border-white/10">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${isOnline ? 'bg-accent/10 text-accent' : 'bg-white/5 text-white/30'}`}>
            {isOnline ? <Wifi size={14} className="animate-pulse" /> : <WifiOff size={14} />}
            <span className="text-xs font-bold uppercase tracking-wider">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
