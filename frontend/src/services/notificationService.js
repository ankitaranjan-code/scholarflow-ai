/**
 * notificationService — Logic for browser-based task reminders.
 */
class NotificationService {
  constructor() {
    this.permission = 'default';
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    this.permission = result;
    return result === 'granted';
  }

  sendNotification(title, body, icon = '/favicon.ico') {
    if (this.permission !== 'granted') return;
    new Notification(title, { body, icon });
  }

  /**
   * Schedules reminders based on the active routine tasks.
   * Compares current time with task time_slot.
   */
  checkAndNotify(tasks, showToast) {
    if (!tasks || tasks.length === 0) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    tasks.forEach(task => {
      // time_slot is usually "HH:MM"
      if (task.time_slot === currentTime && !task.is_completed_today) {
        this.sendNotification(
          `Time for ${task.title}!`,
          `Category: ${task.category}. Don't forget to mark it as finished in ScholarFlow!`
        );
        if (showToast) {
          showToast(`⏰ Time for: ${task.title}`, 'info');
        }
      }
    });
  }
}

export const notificationService = new NotificationService();
