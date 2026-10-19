const LAST_NUDGE_KEY = 'dulingo_last_nudge_date';

/**
 * Check if the browser supports the Web Notifications API and Service Workers
 */
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Return current notification permission status: 'granted' | 'denied' | 'default' | 'unsupported'
 */
export function getNotificationStatus() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request permission from the learner to send daily streak & engagement nudges
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    throw new Error('Web Notifications are not supported in this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // Send immediate confirmation
    await sendStreakNudge({
      streak: 1,
      pendingTasks: 0,
      customTitle: '🔔 Streak Reminders Enabled!',
      customBody: 'We will notify you if your learning streak is at risk so you never miss a day.',
      isTest: true,
    });
  }
  return permission;
}

/**
 * Send an immediate streak at risk nudge notification
 */
export async function sendStreakNudge({
  streak = 0,
  pendingTasks = 1,
  customTitle,
  customBody,
  isTest = false,
} = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const title =
    customTitle ||
    (streak > 0
      ? `🔥 Your ${streak}-Day Streak is at Risk!`
      : '⚡ Daily Lesson Waiting on Dulingo!');

  const body =
    customBody ||
    (pendingTasks > 0
      ? `You have ${pendingTasks} task${pendingTasks > 1 ? 's' : ''} left today. A quick 2-minute lesson will protect your XP and streak!`
      : 'Keep up the momentum! New citizen service lessons are waiting for you.');

  const options = {
    body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    tag: isTest ? `dulingo-test-${Date.now()}` : 'dulingo-streak-nudge',
    renotify: true,
    requireInteraction: false,
    data: { url: '/quest' },
  };

  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg && reg.showNotification) {
      await reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }

    if (!isTest) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(LAST_NUDGE_KEY, today);
    }
    return true;
  } catch (err) {
    console.warn('Failed to display notification via Service Worker, falling back:', err);
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Schedules a daily streak check or registers background periodic sync
 */
export async function scheduleStreakNudge({ streak = 0, pendingTasks = 0 } = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  // If user completed all tasks today, no nudge needed
  if (pendingTasks === 0) return;

  const today = new Date().toISOString().split('T')[0];
  const lastNudge = localStorage.getItem(LAST_NUDGE_KEY);

  // If already nudged today, don't spam
  if (lastNudge === today) return;

  try {
    const reg = await navigator.serviceWorker.ready;

    // Register Periodic Background Sync if supported (e.g. Chrome on Android)
    if ('periodicSync' in reg) {
      try {
        await reg.periodicSync.register('streak-check', {
          minInterval: 12 * 60 * 60 * 1000, // 12 hours
        });
      } catch (e) {
        // Periodic sync may require installed PWA or browser permission
      }
    }

    // Schedule a reminder after 4 hours of inactivity if tasks remain incomplete
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_STREAK_CHECK',
        delayMs: 4 * 60 * 60 * 1000,
        title: streak > 0 ? `🔥 Streak Alert: Keep your ${streak}-day streak!` : '⚡ Daily Tasks Waiting!',
        body: `You still have ${pendingTasks} task${pendingTasks > 1 ? 's' : ''} left today. Learn public services in 2 minutes!`,
      });
    }
  } catch (err) {
    console.warn('Could not schedule streak nudge:', err);
  }
}
