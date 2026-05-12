import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Schedule {
  id: string;
  time: string;
  duration: number;
  is_active: boolean;
  created_at: string;
}

export interface DeviceStatus {
  id: string;
  last_heartbeat: string;
  manual_feed_trigger: boolean;
}

export interface FeedHistory {
  id: string;
  timestamp: string;
  type: 'AUTO' | 'MANUAL';
  success: boolean;
}

export const useFeeder = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [history, setHistory] = useState<FeedHistory[]>([]);
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('*')
        .order('time', { ascending: true });
        
      const { data: statusData } = await supabase
        .from('device_status')
        .select('*')
        .single();

      const { data: historyData } = await supabase
        .from('feed_history')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (scheduleData) setSchedules(scheduleData);
      if (statusData) setStatus(statusData);
      if (historyData) setHistory(historyData);
      setIsLoading(false);
    };

    fetchData();

    // Set up Realtime subscriptions
    const scheduleChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSchedules((prev) => [...prev, payload.new as Schedule].sort((a, b) => a.time.localeCompare(b.time)));
          } else if (payload.eventType === 'DELETE') {
            setSchedules((prev) => prev.filter((s) => s.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setSchedules((prev) => prev.map((s) => (s.id === payload.new.id ? (payload.new as Schedule) : s)));
          }
        }
      )
      .subscribe();

    const statusChannel = supabase
      .channel('device-status-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'device_status' },
        (payload) => {
          setStatus(payload.new as DeviceStatus);
        }
      )
      .subscribe();

    const historyChannel = supabase
      .channel('history-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_history' },
        (payload) => {
          setHistory((prev) => [payload.new as FeedHistory, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scheduleChannel);
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(historyChannel);
    };
  }, []);

  // Heartbeat check
  useEffect(() => {
    const checkOnline = () => {
      if (!status?.last_heartbeat) return;
      const lastHeartbeat = new Date(status.last_heartbeat).getTime();
      const now = new Date().getTime();
      const diff = (now - lastHeartbeat) / 1000;
      setIsOnline(diff < 30); // 30 seconds threshold
    };

    const interval = setInterval(checkOnline, 5000);
    checkOnline();

    return () => clearInterval(interval);
  }, [status]);

  const addSchedule = async (time: string, duration: number) => {
    const newSchedule = { time, duration, is_active: true };
    const { data, error } = await supabase.from('schedules').insert([newSchedule]).select();
    return { data, error };
  };

  const deleteSchedule = async (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) {
      // Revert if error
    }
  };

  const toggleSchedule = async (id: string, is_active: boolean) => {
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, is_active } : s));
    await supabase.from('schedules').update({ is_active }).eq('id', id);
  };

  const triggerManualFeed = async () => {
    if (!status) return;
    await supabase.from('device_status').update({ manual_feed_trigger: true }).eq('id', status.id);
  };

  return {
    schedules,
    history,
    status,
    isOnline,
    isLoading,
    addSchedule,
    deleteSchedule,
    toggleSchedule,
    triggerManualFeed
  };
};
