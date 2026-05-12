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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar size={18} className="text-accent" />
          <h2 className="text-lg font-bold uppercase tracking-tight">Active Schedules</h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-full px-4"
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Feed Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Duration (sec)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
                <Button variant="primary" className="w-full" onClick={handleAdd}>
                  SAVE JADWAL
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {schedules.map((schedule) => (
            <motion.div
              key={schedule.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className={`p-4 ${schedule.is_active ? 'opacity-100' : 'opacity-40'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${schedule.is_active ? 'bg-accent/10 text-accent' : 'bg-white/5 text-white/40'}`}>
                      <Clock size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tabular-nums">{schedule.time}</h3>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">
                        Duration: {schedule.duration} sec
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Switch
                      checked={schedule.is_active}
                      onCheckedChange={(val) => onToggle(schedule.id, val)}
                    />
                    <button
                      onClick={() => onDelete(schedule.id)}
                      className="p-2 text-white/20 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {schedules.length === 0 && !showAdd && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl opacity-20">
            <Clock size={48} className="mb-4" />
            <p className="text-sm font-medium uppercase tracking-widest">No schedules set</p>
          </div>
        )}
      </div>
    </div>
  );
};
