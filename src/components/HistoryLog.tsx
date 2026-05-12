import { Card, CardContent } from './ui/Card';
import { History, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { FeedHistory } from '../hooks/useFeeder';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryLogProps {
  history: FeedHistory[];
}

export const HistoryLog = ({ history }: HistoryLogProps) => {
  return (
    <Card className="glass-card h-full flex flex-col border-0">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/5 rounded-lg">
            <History size={16} className="text-white/40" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Feed History</h2>
        </div>
        <div className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-white/20 tracking-widest uppercase">
          Live
        </div>
      </div>
      
      <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-hide">
        <div className="divide-y divide-white/5">
          <AnimatePresence initial={false}>
            {history.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 flex items-center justify-between group hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    item.success 
                    ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20' 
                    : 'bg-red-500/10 text-red-500 group-hover:bg-red-500/20'
                  }`}>
                    {item.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30">
                        {item.type} Dispense
                      </span>
                      {index === 0 && (
                        <span className="text-[8px] font-black bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-widest">Recent</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-white/80 mt-0.5 letter-spacing-tight">
                      {formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">Status</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${item.success ? 'text-emerald-500/50' : 'text-red-500/50'}`}>
                      {item.success ? 'Success' : 'Failed'}
                    </p>
                  </div>
                  <div className={`h-1.5 w-1.5 rounded-full ${item.success ? 'bg-emerald-500/50' : 'bg-red-500/50'} shadow-[0_0_8px_rgba(16,185,129,0.3)]`} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <Clock size={32} className="mb-3" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">History Empty</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
