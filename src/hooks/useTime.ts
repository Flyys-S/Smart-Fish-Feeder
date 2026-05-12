import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const useTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return {
    fullTime: format(time, 'HH:mm:ss'),
    hoursMinutes: format(time, 'HH:mm'),
    seconds: format(time, 'ss'),
    dayMonth: format(time, 'EEEE, d MMMM'),
    raw: time
  };
};
