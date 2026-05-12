import { useMemo } from 'react';
import { Card, CardContent } from './ui/Card';
import { BarChart2, Calendar, TrendingUp } from 'lucide-react';
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white/5 border-white/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart2 size={80} />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-white/60 font-medium">Feeding Today</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{stats.todayCount}</span>
              <span className="text-white/40 text-sm">Times</span>
            </div>
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.todayCount / 5) * 100, 100)}%` }}
              />
            </div>
            <p className="text-white/30 text-xs mt-2">Target: 3-5 times/day</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/5 border-white/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar size={80} />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                <Calendar size={20} />
              </div>
              <h3 className="text-white/60 font-medium">Weekly Total</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{stats.weekCount}</span>
              <span className="text-white/40 text-sm">Times</span>
            </div>
            <p className="text-white/30 text-xs mt-6">Accumulated in last 7 days</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
