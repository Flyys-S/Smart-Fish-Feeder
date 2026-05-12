import { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Switch } from './ui/Switch';
import { Plus, Trash2, Clock, Calendar } from 'lucide-react';
import type { Schedule } from '../hooks/useFeeder';
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduleManagerProps {
  schedules: Schedule[];
  onAdd: (time: string, duration: number) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
}

export const ScheduleManager = ({ schedules, onAdd, onDelete, onToggle }: ScheduleManagerProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newTime, setNewTime] = useState('08:00');
  const [newDuration, setNewDuration] = useState(5);

  const handleAdd = async () => {
    await onAdd(newTime, newDuration);
    setShowAdd(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/5 rounded-lg">
            <Calendar size={18} className="text-white/40" />
          </div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight letter-spacing-tight leading-none">Active Schedules</h2>
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mt-1">Automatic feeding routines</p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
          className={`rounded-full px-5 h-9 transition-all duration-300 ${showAdd ? 'bg-white/10 text-white' : 'bg-white text-black hover:scale-105'}`}
        >
          {showAdd ? 'Cancel' : (
            <>
              <Plus size={16} className="mr-1.5" /> Add New
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <Card className="glass-card bg-white/[0.05] border-white/10">
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Feed Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Duration (sec)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                <Button 
                  className="w-full h-[46px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-xs" 
                  onClick={handleAdd}
                >
                  Confirm Schedule
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {schedules.map((schedule) => (
            <motion.div
              key={schedule.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <Card className={`glass-card glass-card-hover group ${schedule.is_active ? 'opacity-100 border-white/10' : 'opacity-40 border-transparent grayscale'}`}>
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      schedule.is_active ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20' : 'bg-white/5 text-white/20'
                    }`}>
                      <Clock size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-3xl font-black tabular-nums tracking-tighter leading-none">{schedule.time}</h3>
                        {schedule.is_active && (
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">
                        Dispensing for {schedule.duration}s
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="h-10 w-[1px] bg-white/5 hidden sm:block" />
                    <Switch
                      checked={schedule.is_active}
                      onCheckedChange={(val) => onToggle(schedule.id, val)}
                    />
                    <button
                      onClick={() => onDelete(schedule.id)}
                      className="p-2.5 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-300"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {schedules.length === 0 && !showAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl"
          >
            <div className="p-4 bg-white/5 rounded-full mb-4 opacity-20">
              <Clock size={40} />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/20">No active routines</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
