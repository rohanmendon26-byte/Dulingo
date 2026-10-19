import { XpLog } from '../models/index.js';

// Today's date in India (YYYY-MM-DD), independent of server timezone
export const todayIST = (offsetDays = 0) =>
  new Date(Date.now() + 5.5 * 3600 * 1000 + offsetDays * 86400 * 1000).toISOString().slice(0, 10);

export const levelFor = (xp) => Math.floor(xp / 100) + 1;

const BADGES = [
  { id: 'first_steps', label: 'First Steps', test: (u) => u.xp > 0 },
  { id: 'streak_shield', label: 'Streak Shield Equipped 🛡️', test: (u) => (u.streakFreeze ?? true) && (u.streak || 0) >= 1 },
  { id: 'freeze_survivor', label: 'Freeze Survivor 🧊', test: (u) => Boolean(u.freezeUsedDate) },
  { id: 'on_fire', label: 'On Fire (3-day streak)', test: (u) => (u.streak || 0) >= 3 },
  { id: 'week_warrior', label: 'Week Warrior (7-day streak)', test: (u) => (u.streak || 0) >= 7 },
  { id: 'century', label: 'Century (100 XP)', test: (u) => u.xp >= 100 },
  { id: 'scholar', label: 'Scholar (500 XP)', test: (u) => u.xp >= 500 },
];
export const BADGE_LABELS = Object.fromEntries(BADGES.map((b) => [b.id, b.label]));

/**
 * Adds XP, updates the daily streak with streak freeze protection, unlocks badges and logs the XP (used for weekly leaderboard).
 * Returns the newly unlocked badge ids.
 */
export async function award(user, amount, reason) {
  const today = todayIST();
  let freezeUsed = false;
  if (user.lastActiveDate !== today) {
    if (user.lastActiveDate === todayIST(-1)) {
      user.streak = (user.streak || 0) + 1;
    } else if (
      user.lastActiveDate === todayIST(-2) &&
      (user.streakFreeze ?? true) &&
      (user.streak || 0) > 0
    ) {
      // Grace period: Streak Freeze protects the 1 missed day
      user.streak = (user.streak || 0) + 1;
      user.streakFreeze = false;
      user.freezeUsedDate = todayIST(-1);
      freezeUsed = true;
    } else {
      user.streak = 1;
    }
    user.lastActiveDate = today;
    user.bestStreak = Math.max(user.bestStreak || 0, user.streak);
  }
  user.xp += amount;

  // Replenish streak freeze if learner reaches a 7-day milestone
  if (user.streak >= 7 && user.streakFreeze === false && user.freezeUsedDate !== todayIST()) {
    user.streakFreeze = true;
  }

  const fresh = BADGES.filter((b) => !user.badges.includes(b.id) && b.test(user)).map((b) => b.id);
  user.badges.push(...fresh);
  await user.save();
  if (amount > 0) {
    await XpLog.create({
      user: user._id,
      amount,
      reason: freezeUsed ? `${reason} (🛡️ Streak Freeze used)` : reason,
    });
  }
  return fresh;
}

export const publicUser = (u) => {
  const isGracePeriod =
    u.lastActiveDate === todayIST(-2) &&
    (u.streakFreeze ?? true) &&
    (u.streak || 0) > 0;
  const freezeUsedRecently = Boolean(
    u.freezeUsedDate && (u.freezeUsedDate === todayIST() || u.freezeUsedDate === todayIST(-1))
  );
  const hasActiveStreak =
    u.lastActiveDate === todayIST() ||
    u.lastActiveDate === todayIST(-1) ||
    isGracePeriod;

  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    xp: u.xp,
    level: levelFor(u.xp),
    xpIntoLevel: u.xp % 100,
    streak: hasActiveStreak ? (u.streak || 0) : 0,
    bestStreak: u.bestStreak || 0,
    streakFreeze: u.streakFreeze ?? true,
    freezeUsedDate: u.freezeUsedDate || '',
    isGracePeriod,
    freezeUsedRecently,
    badges: (u.badges || []).map((id) => ({ id, label: BADGE_LABELS[id] || id })),
  };
};
