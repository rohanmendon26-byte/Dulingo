import {
  HeartHandshake,
  Receipt,
  FileBadge,
  CreditCard,
  Megaphone,
  Train,
  Landmark,
  Sparkles,
  Star,
} from 'lucide-react';

/* ---------- Topic Icons & Visual Badges ---------- */
export function TopicIcon({ topic, size = 20, className = '' }) {
  const map = {
    Pensions: HeartHandshake,
    Taxes: Receipt,
    Certificates: FileBadge,
    Payments: CreditCard,
    Grievances: Megaphone,
    'Travel and Transport': Train,
    Transport: Train,
    'Govt Applications': Landmark,
    General: Sparkles,
  };
  const IconComponent = map[topic] || Star;
  return <IconComponent size={size} className={className} />;
}

export function TopicBadge({ topic, size = 'md' }) {
  const colorMap = {
    Pensions: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60',
    Taxes: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60',
    Certificates: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700/60',
    Payments: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700/60',
    Grievances: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/60',
    'Travel and Transport': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700/60',
    Transport: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700/60',
    'Govt Applications': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700/60',
    General: 'bg-brand-100 text-brand-700 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-700/60',
  };
  const colors = colorMap[topic] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  const sizeClasses = size === 'sm' ? 'h-8 w-8 rounded-lg' : size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-11 w-11 rounded-xl';
  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 26 : 20;

  return (
    <div className={`grid place-items-center border shadow-xs ${sizeClasses} ${colors}`} aria-hidden="true">
      <TopicIcon topic={topic} size={iconSize} />
    </div>
  );
}
