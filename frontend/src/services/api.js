const TOKEN_KEY = 'dulingo_token';
const CACHE_TASKS_KEY = 'dulingo_cached_tasks_today';
const CACHE_STORIES_KEY = 'dulingo_cached_stories';
const CACHE_USER_KEY = 'dulingo_cached_user';
const OFFLINE_QUEUE_KEY = 'dulingo_offline_queue';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

// Set VITE_API_URL when the API is hosted separately
const BASE = import.meta.env.VITE_API_URL || '';

/** Helper to read offline queue */
export const getOfflineQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

/** Helper to add item to offline queue */
export const enqueueOfflineAction = (item) => {
  const queue = getOfflineQueue();
  queue.push({ ...item, queuedAt: Date.now() });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

/** Helper to clear offline queue */
export const clearOfflineQueue = () => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

/**
 * Grade a task locally when the student is offline
 */
function gradeTaskOffline(taskId, body) {
  let cachedTasksData = null;
  try {
    cachedTasksData = JSON.parse(localStorage.getItem(CACHE_TASKS_KEY) || 'null');
  } catch {}

  const taskList = cachedTasksData?.tasks || [];
  const task = taskList.find((t) => String(t.id) === String(taskId));

  let cachedUser = null;
  try {
    cachedUser = JSON.parse(localStorage.getItem(CACHE_USER_KEY) || 'null');
  } catch {}

  let correct = false;
  let correctAnswer = task?.answer || '';
  let fieldResults = undefined;

  const rawAnswer = String(body?.answer || '').trim();

  if (task?.type === 'audio_mcq' || task?.type === 'fill_blank') {
    const accepted = (task.answer || '')
      .split('|')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    correct = accepted.includes(rawAnswer.toLowerCase());
  } else if (task?.type === 'mock_form') {
    try {
      const vals = JSON.parse(rawAnswer);
      const fields = task.fields || [];
      fieldResults = fields.map((f, idx) => {
        const given = String(vals[idx] || '').trim().toLowerCase();
        const ok = (f.answer || '')
          .split('|')
          .map((s) => s.trim().toLowerCase())
          .includes(given);
        return { ok, expected: f.answer };
      });
      correct = fieldResults.every((r) => r.ok);
    } catch {
      correct = false;
    }
  } else if (task?.type === 'essay') {
    correct = true; // essays submitted for review
  }

  const xpEarned = correct ? Number(task?.xp || 10) : 2;

  // Update cached user locally so UI reflects earned XP immediately
  let updatedUser = cachedUser;
  if (cachedUser) {
    updatedUser = {
      ...cachedUser,
      xp: (cachedUser.xp || 0) + xpEarned,
      streak: Math.max(cachedUser.streak || 1, 1),
    };
    localStorage.setItem(CACHE_USER_KEY, JSON.stringify(updatedUser));
  }

  // Update cached tasks list so task is marked done
  if (cachedTasksData && cachedTasksData.tasks) {
    cachedTasksData.tasks = cachedTasksData.tasks.map((t) =>
      String(t.id) === String(taskId) ? { ...t, done: true } : t
    );
    if (cachedTasksData.summary) {
      cachedTasksData.summary.done = (cachedTasksData.summary.done || 0) + 1;
      cachedTasksData.summary.pending = Math.max(0, (cachedTasksData.summary.pending || 1) - 1);
    }
    localStorage.setItem(CACHE_TASKS_KEY, JSON.stringify(cachedTasksData));
  }

  // Save to offline submission queue to replay when reconnected
  enqueueOfflineAction({
    url: `/tasks/${taskId}/submit`,
    body,
  });

  return {
    correct,
    xpEarned,
    correctAnswer,
    explanation: task?.explanation || '',
    fieldResults,
    needsReview: task?.type === 'essay',
    user: updatedUser,
    isOffline: true,
  };
}

export async function api(path, { method = 'GET', body } = {}) {
  // If we know browser is explicitly offline
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (isOffline) {
    // Return cached tasks
    if (method === 'GET' && path === '/tasks/today') {
      const cached = localStorage.getItem(CACHE_TASKS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...parsed, isOffline: true };
      }
    }
    // Return cached stories
    if (method === 'GET' && path === '/stories') {
      const cached = localStorage.getItem(CACHE_STORIES_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...parsed, isOffline: true };
      }
    }
    // Return cached user
    if (method === 'GET' && path === '/me') {
      const cached = localStorage.getItem(CACHE_USER_KEY);
      if (cached) {
        return { user: JSON.parse(cached), isOffline: true };
      }
    }
    // Handle offline task submission
    if (method === 'POST') {
      const match = path.match(/^\/tasks\/([^/]+)\/submit$/);
      if (match) {
        return gradeTaskOffline(match[1], body);
      }
    }
  }

  try {
    const res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');

    // Cache successful responses for offline access
    if (method === 'GET' && path === '/tasks/today') {
      localStorage.setItem(CACHE_TASKS_KEY, JSON.stringify(data));
      if (data.user) {
        localStorage.setItem(CACHE_USER_KEY, JSON.stringify(data.user));
      }
    } else if (method === 'GET' && path === '/stories') {
      localStorage.setItem(CACHE_STORIES_KEY, JSON.stringify(data));
    } else if (method === 'GET' && path === '/me' && data.user) {
      localStorage.setItem(CACHE_USER_KEY, JSON.stringify(data.user));
    } else if (data.user) {
      localStorage.setItem(CACHE_USER_KEY, JSON.stringify(data.user));
    }

    return data;
  } catch (err) {
    // If network failure / connection drop occurred during fetch
    if (method === 'GET') {
      if (path === '/tasks/today') {
        const cached = localStorage.getItem(CACHE_TASKS_KEY);
        if (cached) return { ...JSON.parse(cached), isOffline: true };
      }
      if (path === '/stories') {
        const cached = localStorage.getItem(CACHE_STORIES_KEY);
        if (cached) return { ...JSON.parse(cached), isOffline: true };
      }
      if (path === '/me') {
        const cached = localStorage.getItem(CACHE_USER_KEY);
        if (cached) return { user: JSON.parse(cached), isOffline: true };
      }
    } else if (method === 'POST') {
      const match = path.match(/^\/tasks\/([^/]+)\/submit$/);
      if (match) {
        return gradeTaskOffline(match[1], body);
      }
    }

    throw err;
  }
}

/**
 * Replays any actions queued while offline once the network is restored
 */
export async function syncOfflineQueue() {
  const queue = getOfflineQueue();
  if (!queue || queue.length === 0) return { synced: 0 };

  let synced = 0;
  for (const item of queue) {
    try {
      await fetch(`${BASE}/api${item.url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      synced++;
    } catch {
      // Stop and retry later if network still spotty
      break;
    }
  }

  // Clear completed actions
  clearOfflineQueue();

  // Refresh today's tasks cache after sync
  try {
    const updated = await api('/tasks/today');
    localStorage.setItem(CACHE_TASKS_KEY, JSON.stringify(updated));
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dulingo_synced', { detail: { synced } }));
  }

  return { synced };
}

// Auto-sync when internet connectivity is re-established
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineQueue();
  });
}

export function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function uploadAudio(file) {
  const form = new FormData();
  form.append('audio', file);
  const res = await fetch(`${BASE}/api/teacher/upload-audio`, {
    method: 'POST',
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Audio upload failed');
  return data;
}
