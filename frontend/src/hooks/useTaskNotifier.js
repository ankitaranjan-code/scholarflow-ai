import { useEffect, useRef } from 'react';

export function useTaskNotifier(tasks, onNotify) {
  const notifiedTasks = useRef(new Set());

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const checkTasks = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      tasks.forEach(task => {
        if (task.completed) return;

        // Parse task time (supports "HH:MM" format)
        const timeParts = (task.timeSlot || task.time_slot || '').split(':');
        if (timeParts.length !== 2) return;
        const taskHour = parseInt(timeParts[0], 10);
        const taskMin = parseInt(timeParts[1], 10);
        if (isNaN(taskHour) || isNaN(taskMin)) return;
        const taskMinutes = taskHour * 60 + taskMin;

        // Notify if current time is within a 5-minute window after task time
        // This ensures we don't miss notifications if the page loaded slightly late
        const diff = nowMinutes - taskMinutes;
        if (diff >= 0 && diff <= 5) {
          if (!notifiedTasks.current.has(task.id)) {
            notifiedTasks.current.add(task.id);
            
            // 1. Trigger In-app UI
            onNotify(task);

            // 2. Trigger Browser Notification (if permission granted)
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(`ScholarFlow: Time for ${task.title}!`, {
                  body: `It's ${task.timeSlot || task.time_slot}. Let's get to work and earn some points!`,
                  icon: '/mascot.png',
                  tag: `task-${task.id}`, // prevent duplicates
                });
              } catch (e) {
                console.warn('Browser notification failed:', e);
              }
            }
          }
        }
      });
    };

    const interval = setInterval(checkTasks, 10000); // Check every 10 seconds
    checkTasks(); // Check immediately

    return () => clearInterval(interval);
  }, [tasks, onNotify]);
}
