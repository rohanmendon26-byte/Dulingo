import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Headphones, PenLine, Trophy, CheckCircle2, ArrowRight } from 'lucide-react';
import { Octo, Shell, TopicIcon, TOPIC_ICONS } from '../components.jsx';

const steps = [
  {
    icon: Headphones,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    title: 'Listen',
    text: 'Short audio lessons and stories explain each service in simple words with natural speech.',
  },
  {
    icon: PenLine,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    title: 'Practise',
    text: 'Daily audio quizzes, fill-in-the-blanks, and mock forms build confidence without risk.',
  },
  {
    icon: Trophy,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    title: 'Earn',
    text: 'Collect XP, protect your streak with freeze badges, and climb the weekly leaderboard.',
  },
  {
    icon: CheckCircle2,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    title: 'Do it yourself',
    text: 'Apply for real government services independently, without queues or middlemen.',
  },
];

export default function Landing() {
  return (
    <Shell>
      <section className="grid items-center gap-8 py-6 md:grid-cols-2 md:py-12">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-100 border border-brand-200 px-3.5 py-1 text-xs sm:text-sm font-extrabold text-brand-800">
            <span>Team Octopus</span>
            <span>·</span>
            <span>Web Dev Challenge</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight text-slate-900">
            Learn public services <span className="text-brand-600">by listening</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg font-semibold text-slate-600 leading-relaxed">
            Pensions, taxes, certificates, and payments taught through bite-sized audio tasks, stories, and streak rewards. Built for seniors, first-time digital users, and anyone learning government portals.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/register" className="btn btn-primary text-base sm:text-lg inline-flex items-center gap-2 shadow-sm">
              <span>Start learning free</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-ghost text-base sm:text-lg">
              I have an account
            </Link>
          </div>
        </div>
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}>
            <Octo size={260} />
          </motion.div>
        </motion.div>
      </section>

      <section className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-4">
        {steps.map((st, i) => {
          const IconComp = st.icon;
          return (
            <motion.div
              key={st.title}
              className="card p-4 sm:p-5 flex flex-col justify-between"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div>
                <div className={`grid h-12 w-12 place-items-center rounded-2xl border shadow-xs ${st.color}`}>
                  <IconComp size={24} />
                </div>
                <h2 className="mt-3 text-lg sm:text-xl font-black text-slate-900">{st.title}</h2>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">{st.text}</p>
              </div>
            </motion.div>
          );
        })}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl sm:text-2xl font-black text-slate-900">Areas covered</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TOPIC_ICONS).filter(([k]) => k !== 'General').map(([topic]) => (
            <span
              key={topic}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-200 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-slate-800 shadow-xs hover:border-brand-300 transition"
            >
              <TopicIcon topic={topic} size={16} className="text-brand-600" />
              <span>{topic}</span>
            </span>
          ))}
        </div>
      </section>
    </Shell>
  );
}
