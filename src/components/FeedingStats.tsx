import { useMemo } from 'react';
import { Card, CardContent } from './ui/Card';
import { BarChart2, Calendar, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { startOfDay, startOfWeek, isAfter, parseISO } from 'date-fns';

interface FeedingStatsProps {
  history: any[];
}

export const FeedingStats = ({ history }: FeedingStatsProps) => {
  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const week = startOfWeek(now);

    const todayCount = history.filter(item => 
      isAfter(parseISO(item.created_at), today) && item.success
    ).length;

    const weekCount = history.filter(item => 
      isAfter(parseISO(item.created_at), week) && item.success
    ).length;

    return { todayCount, weekCount };
  }, [history]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-card glass-card-blue overflow-hidden relative group border-0">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
          
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                  <Activity size={20} />
                </div>
                <h3 className="text-white/50 font-medium tracking-wide text-sm uppercase letter-spacing-tight">Daily Activity</h3>
              </div>
              <div className="text-blue-400/50">
                <BarChart2 size={24} />
              </div>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="text-6xl font-bold text-white tracking-tighter glow-text leading-none">{stats.todayCount}</span>
              <span className="text-white/30 font-medium uppercase text-xs tracking-widest">Times today</span>
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/20 mb-2 font-bold">
                <span>Daily Progress</span>
                <span>{Math.min(stats.todayCount, 5)} / 5</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stats.todayCount / 5) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="glass-card glass-card-green overflow-hidden relative group border-0">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />
          
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <Calendar size={20} />
                </div>
                <h3 className="text-white/50 font-medium tracking-wide text-sm uppercase letter-spacing-tight">Weekly Total</h3>
              </div>
              <div className="text-emerald-400/50">
                <TrendingUp size={24} />
              </div>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="text-6xl font-bold text-white tracking-tighter glow-text leading-none">{stats.weekCount}</span>
              <span className="text-white/30 font-medium uppercase text-xs tracking-widest">Times this week</span>
            </div>
            
            <div className="mt-8 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
              <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">System Status: Active</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
