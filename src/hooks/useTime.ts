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
    fullTime: format(time, 'hh:mm:ss a'),
    hoursMinutes: format(time, 'hh:mm'),
    seconds: format(time, 'ss'),
    ampm: format(time, 'a'),
    dayMonth: format(time, 'EEEE, d MMMM'),
    raw: time
  };
};
