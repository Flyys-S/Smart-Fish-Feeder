import { Header } from './components/Header';
import { ControlCenter } from './components/ControlCenter';
import { ScheduleManager } from './components/ScheduleManager';
import { HistoryLog } from './components/HistoryLog';
import { useFeeder } from './hooks/useFeeder';
import { motion } from 'framer-motion';

function App() {
  const { 
    schedules, 
    history,
    isOnline, 
    isLoading, 
    addSchedule, 
    deleteSchedule, 
    toggleSchedule, 
    triggerManualFeed 
  } = useFeeder();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="h-12 w-12 border-4 border-accent rounded-full border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-accent selection:text-black">
      <Header isOnline={isOnline} />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Control & History */}
          <div className="lg:col-span-4 space-y-8">
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ControlCenter onFeed={triggerManualFeed} isOnline={isOnline} />
            </motion.section>

            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:block h-[400px]"
            >
              <HistoryLog history={history} />
            </motion.section>
          </div>

          {/* Right Column: Schedules */}
          <div className="lg:col-span-8">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ScheduleManager 
                schedules={schedules} 
                onAdd={addSchedule} 
                onDelete={deleteSchedule} 
                onToggle={toggleSchedule}
              />
            </motion.section>

            {/* History for mobile */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="lg:hidden mt-8"
            >
              <HistoryLog history={history} />
            </motion.section>
          </div>

        </div>
      </main>

      {/* Decorative footer */}
      <footer className="py-12 border-t border-white/5 opacity-10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">System.Agnostos.V.1.0</p>
      </footer>
    </div>
  );
}

export default App;
