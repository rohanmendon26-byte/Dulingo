import { useEffect, useState } from 'react';
import {
  Mic,
  FileUp,
  X,
  Globe,
  Sparkles,
  CheckCircle2,
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Send,
  GraduationCap,
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  Flame,
  Trash2,
  BarChart2,
  PieChart as PieChartIcon,
  Users,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { api, uploadAudio, resolveMediaUrl } from '../api.js';
import { Loading, TopicBadge, TOPIC_ICONS, TYPE_LABEL } from '../components.jsx';

const TOPICS = Object.keys(TOPIC_ICONS);
const blankTask = {
  title: '',
  topic: 'Pensions',
  type: 'audio_mcq',
  prompt: '',
  audioText: '',
  audioUrl: '',
  options: ['', '', '', ''],
  answer: '',
  explanation: '',
  xp: 10,
  fields: [
    { label: '', answer: '', hint: '' },
    { label: '', answer: '', hint: '' },
    { label: '', answer: '', hint: '' },
  ],
};

function AudioPicker({ audioUrl, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [upErr, setUpErr] = useState('');

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpErr('');
    setUploading(true);
    try {
      const res = await uploadAudio(file);
      onChange(res.url);
    } catch (err) {
      setUpErr(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-2xl border-2 border-brand-200 bg-brand-50/60 p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <label className="flex items-center gap-2 font-black text-brand-900 text-sm sm:text-base">
          <Mic size={18} className="text-brand-600" />
          <span>Pre-recorded Audio (MP3 / WAV / WebM)</span>
        </label>
        <span className="rounded-full bg-brand-100 border border-brand-200 px-2 py-0.5 text-[11px] font-extrabold text-brand-700">
          100% device compatibility
        </span>
      </div>
      <p className="text-xs font-bold text-slate-500">
        Upload an audio recording or paste an audio URL. Learners hear this file directly, bypassing device TTS limitations.
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <label className="btn btn-ghost !py-1.5 !px-3 !text-xs cursor-pointer inline-flex items-center gap-1.5">
          <FileUp size={15} />
          <span>{uploading ? 'Uploading…' : 'Choose audio file'}</span>
          <input type="file" accept="audio/*" className="hidden" disabled={uploading} onChange={onFileChange} />
        </label>
        <span className="text-xs font-bold text-slate-400">or URL:</span>
        <input
          className="input !py-1.5 !text-xs flex-1 min-w-44"
          placeholder="https://... or /uploads/audio/..."
          value={audioUrl}
          onChange={(e) => onChange(e.target.value)}
        />
        {audioUrl && (
          <button
            type="button"
            className="btn btn-ghost !py-1 !px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 inline-flex items-center gap-1"
            onClick={() => onChange('')}
          >
            <X size={13} /> Remove
          </button>
        )}
      </div>

      {upErr && <p className="text-xs font-bold text-rose-600">{upErr}</p>}

      {audioUrl && (
        <div className="mt-2 flex items-center gap-3 rounded-xl bg-white p-2 border border-brand-100">
          <audio controls src={resolveMediaUrl(audioUrl)} className="h-9 w-full max-w-md" />
        </div>
      )}
    </div>
  );
}

function TaskTranslationSection({ lang, code, tr, onChange, taskType, optionCount }) {
  const setTr = (field, val) => onChange({ ...tr, [field]: val });
  const setTrOpt = (idx, val) => {
    const opts = [...(tr.options || Array(optionCount).fill(''))];
    opts[idx] = val;
    onChange({ ...tr, options: opts });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-4">
      <h4 className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-brand-700">
        <Globe size={15} /> {lang} ({code}) Translation
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-extrabold text-slate-600">
          Translated Title ({code})
          <input
            className="input mt-1 !text-xs sm:!text-sm"
            placeholder={`Title in ${lang}`}
            value={tr.title || ''}
            onChange={(e) => setTr('title', e.target.value)}
          />
        </label>
        <label className="text-xs font-extrabold text-slate-600">
          Translated Audio Readout ({code}, optional)
          <input
            className="input mt-1 !text-xs sm:!text-sm"
            placeholder={`Read aloud text in ${lang}`}
            value={tr.audioText || ''}
            onChange={(e) => setTr('audioText', e.target.value)}
          />
        </label>
      </div>

      <label className="block text-xs font-extrabold text-slate-600">
        Translated Question / Instruction ({code})
        <textarea
          className="input mt-1 min-h-16 !text-xs sm:!text-sm"
          placeholder={`Question prompt in ${lang}`}
          value={tr.prompt || ''}
          onChange={(e) => setTr('prompt', e.target.value)}
        />
      </label>

      {taskType === 'audio_mcq' && (
        <div className="space-y-2">
          <p className="text-xs font-extrabold text-slate-600">Translated Options ({code})</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: optionCount }).map((_, idx) => (
              <input
                key={idx}
                className="input !text-xs sm:!text-sm"
                placeholder={`Option ${idx + 1} in ${lang}`}
                value={tr.options?.[idx] || ''}
                onChange={(e) => setTrOpt(idx, e.target.value)}
              />
            ))}
          </div>
        </div>
      )}

      <label className="block text-xs font-extrabold text-slate-600">
        Translated Explanation ({code})
        <textarea
          className="input mt-1 min-h-16 !text-xs sm:!text-sm"
          placeholder={`Explanation in ${lang}`}
          value={tr.explanation || ''}
          onChange={(e) => setTr('explanation', e.target.value)}
        />
      </label>
    </div>
  );
}

const QUICK_PROMPTS = [
  'Aadhaar Mobile Link',
  'Digital Life Certificate',
  'Sarathi Driving License',
  'Ration Card eKYC',
  'CPGRAMS Grievance',
];

function TaskForm({ onSaved }) {
  const [f, setF] = useState(blankTask);
  const [translations, setTranslations] = useState({ hi: {}, kn: {} });
  const [showTr, setShowTr] = useState(false);
  const [msg, setMsg] = useState(null);

  // AI Task Drafting state
  const [aiTopic, setAiTopic] = useState('');
  const [aiType, setAiType] = useState('auto');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState(null);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setFld = (i, k) => (e) => setF({ ...f, fields: f.fields.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)) });
  const setOpt = (i) => (e) => setF({ ...f, options: f.options.map((o, k) => (k === i ? e.target.value : o)) });

  const updateTr = (code, val) => setTranslations((prev) => ({ ...prev, [code]: val }));

  const cleanTranslations = (raw) => {
    const out = {};
    for (const [code, val] of Object.entries(raw)) {
      const hasContent =
        val.title?.trim() ||
        val.prompt?.trim() ||
        val.explanation?.trim() ||
        val.audioText?.trim() ||
        val.options?.some((o) => o?.trim());
      if (hasContent) {
        const trObj = {};
        if (val.title?.trim()) trObj.title = val.title.trim();
        if (val.prompt?.trim()) trObj.prompt = val.prompt.trim();
        if (val.audioText?.trim()) trObj.audioText = val.audioText.trim();
        if (val.explanation?.trim()) trObj.explanation = val.explanation.trim();
        if (val.options?.length) trObj.options = val.options.map((o) => String(o || '').trim());
        out[code] = trObj;
      }
    }
    return out;
  };

  const handleAiDraft = async (topicToUse) => {
    const topic = (topicToUse || aiTopic).trim();
    if (!topic) return;
    setAiLoading(true);
    setAiMsg(null);
    try {
      const res = await api('/teacher/ai-draft', {
        method: 'POST',
        body: { topic, taskType: aiType },
      });
      const d = res.draft;
      if (d) {
        setF({
          title: d.title || '',
          topic: d.topic || 'General',
          type: d.type || 'audio_mcq',
          prompt: d.prompt || '',
          audioText: d.audioText || d.prompt || '',
          audioUrl: d.audioUrl || '',
          options: d.options?.length >= 2 ? d.options : ['', '', '', ''],
          answer: d.answer || '',
          explanation: d.explanation || '',
          xp: d.xp || 10,
          fields: d.fields?.length ? d.fields : [{ label: '', answer: '', hint: '' }, { label: '', answer: '', hint: '' }],
        });

        if (d.translations && (Object.keys(d.translations.hi || {}).length > 0 || Object.keys(d.translations.kn || {}).length > 0)) {
          setTranslations({
            hi: d.translations.hi || {},
            kn: d.translations.kn || {},
          });
          setShowTr(true);
        }

        setAiMsg({ ok: true, text: `Draft generated for "${topic}"! Review, edit any field below, and click Publish.` });
      }
    } catch (err) {
      setAiMsg({ ok: false, text: err.message || 'Failed to draft task with AI' });
    } finally {
      setAiLoading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault(); setMsg(null);
    try {
      const payload = {
        ...f,
        translations: cleanTranslations(translations),
      };
      await api('/teacher/tasks', { method: 'POST', body: payload });
      setMsg({ ok: true, text: 'Task published for learners!' });
      setF(blankTask);
      setTranslations({ hi: {}, kn: {} });
      setShowTr(false);
      onSaved();
    } catch (x) { setMsg({ ok: false, text: x.message }); }
  };

  return (
    <form onSubmit={save} className="card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-100 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Create a task</h2>
          <p className="text-xs font-bold text-slate-500">Draft manually or generate instantly with AI assistance</p>
        </div>
      </div>

      {/* AI Task Drafting Assistant Box */}
      <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-brand-50/90 dark:border-indigo-800/60 dark:from-indigo-950/70 dark:via-purple-950/50 dark:to-brand-950/70 dark:bg-slate-900 p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-indigo-950 dark:text-indigo-100">AI Task Drafting</h3>
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                Type any topic to instantly generate an interactive task with options & translations.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-indigo-100 border border-indigo-200 dark:bg-indigo-950/80 dark:border-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-extrabold text-indigo-800">
            Gemini & OpenAI Ready
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            className="input !py-2 !text-xs sm:!text-sm flex-1 min-w-48 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            placeholder="e.g. Aadhaar address update, Jeevan Pramaan, Python tuples..."
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAiDraft();
              }
            }}
            disabled={aiLoading}
          />
          <select
            className="input !py-2 !text-xs sm:!text-sm w-auto bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 font-bold"
            value={aiType}
            onChange={(e) => setAiType(e.target.value)}
            disabled={aiLoading}
            title="Preferred task type"
          >
            <option value="auto">Auto Type (Smart)</option>
            <option value="audio_mcq">Audio MCQ</option>
            <option value="fill_blank">Fill in the Blank</option>
            <option value="mock_form">Mock Form</option>
            <option value="essay">Essay Prompt</option>
          </select>
          <button
            type="button"
            onClick={() => handleAiDraft()}
            disabled={aiLoading || !aiTopic.trim()}
            className="btn btn-primary !py-2 !px-4 text-xs sm:text-sm font-black whitespace-nowrap shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Sparkles size={15} />
            <span>{aiLoading ? 'Drafting…' : 'Generate Draft'}</span>
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300">Try:</span>
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp}
              type="button"
              disabled={aiLoading}
              onClick={() => {
                setAiTopic(qp);
                handleAiDraft(qp);
              }}
              className="rounded-full border border-indigo-200 bg-white/90 px-2.5 py-0.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer dark:bg-indigo-950/60 dark:border-indigo-800/80 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
            >
              {qp}
            </button>
          ))}
        </div>

        {aiMsg && (
          <div
            role="alert"
            className={`flex items-center gap-2 text-xs font-extrabold p-2.5 rounded-xl border ${
              aiMsg.ok
                ? 'text-indigo-950 bg-indigo-100/90 border-indigo-200'
                : 'text-rose-700 bg-rose-50 border-rose-200'
            }`}
          >
            {aiMsg.ok ? <Sparkles size={16} className="text-indigo-600 shrink-0" /> : <X size={16} className="text-rose-600 shrink-0" />}
            <span>{aiMsg.text}</span>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="font-extrabold text-xs sm:text-sm">Title<input className="input mt-1" value={f.title} onChange={set('title')} required /></label>
        <label className="font-extrabold text-xs sm:text-sm">Topic
          <select className="input mt-1" value={f.topic} onChange={set('topic')}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="font-extrabold text-xs sm:text-sm">Type
          <select className="input mt-1" value={f.type} onChange={set('type')}>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="font-extrabold text-xs sm:text-sm">XP reward<input className="input mt-1" type="number" min="1" max="100" value={f.xp} onChange={set('xp')} /></label>
      </div>

      <label className="block font-extrabold text-xs sm:text-sm">Question / instruction
        <textarea className="input mt-1 min-h-24" value={f.prompt} onChange={set('prompt')} required
          placeholder={f.type === 'fill_blank' ? 'Use ____ where the blank goes' : ''} />
      </label>

      {f.type !== 'essay' && (
        <div className="space-y-3">
          <label className="block font-extrabold text-xs sm:text-sm">Text to read aloud (optional, defaults to the question)
            <textarea className="input mt-1" value={f.audioText} onChange={set('audioText')} />
          </label>
          <AudioPicker audioUrl={f.audioUrl} onChange={(url) => setF({ ...f, audioUrl: url })} />
        </div>
      )}

      {f.type === 'audio_mcq' && (
        <div className="space-y-2">
          <p className="font-extrabold text-xs sm:text-sm">Options (type the correct one again below)</p>
          {f.options.map((o, i) => <input key={i} className="input" placeholder={`Option ${i + 1}`} value={o} onChange={setOpt(i)} />)}
        </div>
      )}

      {f.type === 'mock_form' && (
        <div className="space-y-3">
          <p className="font-extrabold text-xs sm:text-sm">Form boxes (put the details learners must copy into the question above)</p>
          {f.fields.map((x, i) => (
            <div key={i} className="grid gap-2 rounded-2xl bg-brand-50 dark:bg-slate-900/90 dark:border dark:border-slate-800 p-3 sm:grid-cols-3">
              <input className="input" placeholder="Box label" value={x.label} onChange={setFld(i, 'label')} />
              <input className="input" placeholder="Correct value (a|b for alternatives)" value={x.answer} onChange={setFld(i, 'answer')} />
              <input className="input" placeholder="Hint (read aloud)" value={x.hint} onChange={setFld(i, 'hint')} />
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1"
            onClick={() => setF({ ...f, fields: [...f.fields, { label: '', answer: '', hint: '' }] })}
          >
            <Plus size={14} /> Add a box
          </button>
        </div>
      )}

      {f.type !== 'essay' && f.type !== 'mock_form' && (
        <label className="block font-extrabold text-xs sm:text-sm">Correct answer{f.type === 'fill_blank' && ' (separate accepted spellings with |)'}
          <input className="input mt-1" value={f.answer} onChange={set('answer')} required />
        </label>
      )}

      <label className="block font-extrabold text-xs sm:text-sm">Explanation shown after answering
        <textarea className="input mt-1" value={f.explanation} onChange={set('explanation')} />
      </label>

      {/* Expandable Regional Language Translations Section */}
      <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/50 dark:border-brand-800/60 dark:bg-brand-950/40 p-3.5 sm:p-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowTr(!showTr)}
          className="flex w-full items-center justify-between font-black text-brand-800 text-left cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Globe size={18} className="text-brand-600" />
            <span className="text-xs sm:text-sm">Translations (Hindi & Kannada)</span>
            <span className="rounded-full bg-brand-200 px-2.5 py-0.5 text-[11px] text-brand-900 font-extrabold">
              Optional
            </span>
          </span>
          {showTr ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <p className="text-xs font-bold text-slate-500">
          Provide Hindi (हिन्दी) and Kannada (ಕನ್ನಡ) text so learners switching languages see and hear the lesson in their mother tongue.
        </p>

        {showTr && (
          <div className="space-y-4 pt-2">
            <TaskTranslationSection
              lang="Hindi"
              code="hi"
              tr={translations.hi || {}}
              onChange={(val) => updateTr('hi', val)}
              taskType={f.type}
              optionCount={f.options.length}
            />
            <TaskTranslationSection
              lang="Kannada"
              code="kn"
              tr={translations.kn || {}}
              onChange={(val) => updateTr('kn', val)}
              taskType={f.type}
              optionCount={f.options.length}
            />
          </div>
        )}
      </div>

      {msg && (
        <p
          role="alert"
          className={`flex items-center gap-2 rounded-xl p-3 text-xs sm:text-sm font-bold ${
            msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
          }`}
        >
          {msg.ok ? <CheckCircle2 size={16} /> : <X size={16} />}
          <span>{msg.text}</span>
        </p>
      )}

      <button className="btn btn-primary w-full inline-flex items-center justify-center gap-2">
        <PlusCircle size={18} /> Publish task
      </button>
    </form>
  );
}

function StoryForm() {
  const [f, setF] = useState({ title: '', topic: 'Pensions', text: '', audioUrl: '' });
  const [translations, setTranslations] = useState({ hi: { title: '', text: '' }, kn: { title: '', text: '' } });
  const [showTr, setShowTr] = useState(false);
  const [msg, setMsg] = useState(null);

  const updateTr = (code, field, val) => {
    setTranslations((prev) => ({
      ...prev,
      [code]: { ...(prev[code] || {}), [field]: val },
    }));
  };

  const cleanTranslations = (raw) => {
    const out = {};
    for (const [code, val] of Object.entries(raw)) {
      if (val.title?.trim() || val.text?.trim()) {
        const trObj = {};
        if (val.title?.trim()) trObj.title = val.title.trim();
        if (val.text?.trim()) trObj.text = val.text.trim();
        out[code] = trObj;
      }
    }
    return out;
  };

  const save = async (e) => {
    e.preventDefault(); setMsg(null);
    try {
      const payload = {
        ...f,
        translations: cleanTranslations(translations),
      };
      await api('/teacher/stories', { method: 'POST', body: payload });
      setMsg({ ok: true, text: 'Story published! Learners can now listen to it.' });
      setF({ ...f, title: '', text: '', audioUrl: '' });
      setTranslations({ hi: { title: '', text: '' }, kn: { title: '', text: '' } });
      setShowTr(false);
    } catch (x) { setMsg({ ok: false, text: x.message }); }
  };

  return (
    <form onSubmit={save} className="card space-y-4 p-4 sm:p-5">
      <h2 className="text-xl sm:text-2xl font-black text-slate-900">Add an audio story</h2>
      <label className="block font-extrabold text-xs sm:text-sm">Title<input className="input mt-1" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></label>
      <label className="block font-extrabold text-xs sm:text-sm">Topic
        <select className="input mt-1" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      <label className="block font-extrabold text-xs sm:text-sm">Story (leave a blank line between paragraphs)
        <textarea className="input mt-1 min-h-48" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} required />
      </label>
      <AudioPicker audioUrl={f.audioUrl} onChange={(url) => setF({ ...f, audioUrl: url })} />

      {/* Expandable Story Translations Section */}
      <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/50 dark:border-brand-800/60 dark:bg-brand-950/40 p-3.5 sm:p-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowTr(!showTr)}
          className="flex w-full items-center justify-between font-black text-brand-800 text-left cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Globe size={18} className="text-brand-600" />
            <span className="text-xs sm:text-sm">Translations (Hindi & Kannada)</span>
            <span className="rounded-full bg-brand-200 px-2.5 py-0.5 text-[11px] text-brand-900 font-extrabold">
              Optional
            </span>
          </span>
          {showTr ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <p className="text-xs font-bold text-slate-500">
          Provide Hindi and Kannada translations for the story title and paragraphs so learners can read and listen in their preferred regional language.
        </p>

        {showTr && (
          <div className="space-y-4 pt-2">
            {[['Hindi', 'hi'], ['Kannada', 'kn']].map(([langName, code]) => (
              <div key={code} className="space-y-3 rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-4">
                <h4 className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-brand-700">
                  <Globe size={15} /> {langName} ({code}) Translation
                </h4>
                <label className="block text-xs font-extrabold text-slate-600">
                  Translated Title ({code})
                  <input
                    className="input mt-1 !text-xs sm:!text-sm"
                    placeholder={`Title in ${langName}`}
                    value={translations[code]?.title || ''}
                    onChange={(e) => updateTr(code, 'title', e.target.value)}
                  />
                </label>
                <label className="block text-xs font-extrabold text-slate-600">
                  Translated Story ({code})
                  <textarea
                    className="input mt-1 min-h-32 !text-xs sm:!text-sm"
                    placeholder={`Story text in ${langName} (leave blank line between paragraphs)`}
                    value={translations[code]?.text || ''}
                    onChange={(e) => updateTr(code, 'text', e.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg && (
        <p
          role="alert"
          className={`flex items-center gap-2 rounded-xl p-3 text-xs sm:text-sm font-bold ${
            msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
          }`}
        >
          {msg.ok ? <CheckCircle2 size={16} /> : <X size={16} />}
          <span>{msg.text}</span>
        </p>
      )}
      <button className="btn btn-primary w-full inline-flex items-center justify-center gap-2">
        <BookOpen size={18} /> Publish story
      </button>
    </form>
  );
}

function EssayReviewCard({ essay, onReviewed }) {
  const [feedback, setFeedback] = useState('');
  const [bonusXp, setBonusXp] = useState(5);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setBusy(true);
    setErr('');
    try {
      await api(`/teacher/essays/${essay.id}/feedback`, {
        method: 'POST',
        body: { feedbackText: feedback.trim(), bonusXp: Number(bonusXp) || 0 },
      });
      setSent(true);
      setTimeout(() => {
        onReviewed();
      }, 1200);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-50 pb-2">
        <p className="font-black text-base sm:text-lg text-slate-900">
          {essay.student} <span className="text-xs sm:text-sm font-bold text-slate-500">on “{essay.task}”</span>
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs font-black text-amber-800">
          <Clock size={12} /> Needs Teacher Review
        </span>
      </div>

      <div className="rounded-xl bg-slate-50 p-3 font-semibold text-slate-800 border border-slate-200 text-xs sm:text-sm">
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Learner's Essay Response:</p>
        <p className="whitespace-pre-wrap">{essay.answer}</p>
      </div>

      {sent ? (
        <p className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-center text-xs sm:text-sm font-black text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={16} /> Feedback & Bonus XP sent to {essay.student}!
        </p>
      ) : (
        <form onSubmit={submitFeedback} className="space-y-3 pt-1">
          <label className="block text-xs font-extrabold text-slate-600">
            Teacher Feedback & Suggestions:
            <textarea
              className="input mt-1 min-h-20 !text-xs sm:!text-sm"
              placeholder="e.g. Well written! You clearly explained the e-District application process and documents needed."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600">
              Bonus XP Award:
              <input
                type="number"
                min="0"
                max="50"
                value={bonusXp}
                onChange={(e) => setBonusXp(e.target.value)}
                className="input !py-1 !px-2 w-16 sm:w-20 text-center !text-xs sm:!text-sm font-bold"
              />
              <span className="inline-flex items-center gap-0.5 text-amber-600 font-black">
                <Zap size={14} className="fill-amber-500" /> XP
              </span>
            </label>

            <button
              type="submit"
              disabled={busy || !feedback.trim()}
              className="btn btn-good !py-1.5 !px-3.5 text-xs sm:text-sm inline-flex items-center gap-1.5"
            >
              <Send size={14} />
              <span>{busy ? 'Sending…' : 'Send Feedback & Review'}</span>
            </button>
          </div>

          {err && <p className="text-xs font-bold text-rose-600">{err}</p>}
        </form>
      )}
    </div>
  );
}

export default function Teacher() {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const load = () => api('/teacher/overview').then(setData);
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Delete this task? Learners\' answers for it will also be removed.')) return;
    await api(`/teacher/tasks/${id}`, { method: 'DELETE' }); load();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'task', label: 'New task', icon: PlusCircle },
    { id: 'story', label: 'New story', icon: BookOpen },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-100 text-brand-700 border border-brand-200 shadow-xs">
          <GraduationCap size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Teacher Hub</h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            Publish interactive lessons, draft with AI, and review student essays
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2" role="tablist">
        {tabs.map((t) => {
          const IconComp = t.icon;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`option text-center !py-2.5 !px-2 !text-xs sm:!text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === t.id ? 'selected' : ''
              }`}
            >
              <IconComp size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'task' && <TaskForm onSaved={load} />}
      {tab === 'story' && <StoryForm />}

      {tab === 'overview' && (!data ? <Loading /> : (
        <div className="space-y-6">
          {/* ── Analytics Section ── */}
          {data.students.length > 0 && (() => {
            const totalXP = data.students.reduce((s, st) => s + (st.xp || 0), 0);
            const avgDone = data.students.length
              ? Math.round(data.students.reduce((s, st) => s + (st.done || 0), 0) / data.students.length)
              : 0;

            // Topic breakdown from published tasks
            const topicCounts = {};
            data.tasks.forEach((t) => {
              topicCounts[t.topic] = (topicCounts[t.topic] || 0) + 1;
            });
            const topicData = Object.entries(topicCounts).map(([name, value]) => ({ name, value }));
            const PIE_COLORS = ['#7c3aed','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#06b6d4','#f97316'];

            return (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="card flex flex-col items-center gap-1 p-3 text-center">
                    <Users size={18} className="text-brand-600" />
                    <p className="text-xl sm:text-2xl font-black text-slate-900">{data.students.length}</p>
                    <p className="text-xs font-bold text-slate-500">Learners</p>
                  </div>
                  <div className="card flex flex-col items-center gap-1 p-3 text-center">
                    <TrendingUp size={18} className="text-emerald-600" />
                    <p className="text-xl sm:text-2xl font-black text-slate-900">{totalXP}</p>
                    <p className="text-xs font-bold text-slate-500">Total XP</p>
                  </div>
                  <div className="card flex flex-col items-center gap-1 p-3 text-center">
                    <Zap size={18} className="text-amber-500 fill-amber-400" />
                    <p className="text-xl sm:text-2xl font-black text-slate-900">{avgDone}</p>
                    <p className="text-xs font-bold text-slate-500">Avg Tasks</p>
                  </div>
                </div>

                {/* XP Bar chart */}
                <section className="card p-4 sm:p-5 space-y-3">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <BarChart2 size={17} className="text-brand-600" /> Learner XP Overview
                  </h2>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={data.students} margin={{ top: 4, right: 8, left: -22, bottom: 4 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v) => [`${v} XP`, 'XP']}
                        contentStyle={{ fontSize: 12, fontWeight: 700, borderRadius: 10, border: '1.5px solid #ede9fe' }}
                      />
                      <Bar dataKey="xp" radius={[6, 6, 0, 0]}>
                        {data.students.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </section>

                {/* Topic breakdown pie chart */}
                {topicData.length > 0 && (
                  <section className="card p-4 sm:p-5 space-y-3">
                    <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <PieChartIcon size={17} className="text-brand-600" /> Task Topic Breakdown
                    </h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={topicData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                          style={{ fontSize: 10, fontWeight: 700 }}
                        >
                          {topicData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v, n) => [`${v} task${v !== 1 ? 's' : ''}`, n]}
                          contentStyle={{ fontSize: 12, fontWeight: 700, borderRadius: 10, border: '1.5px solid #ede9fe' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </section>
                )}
              </>
            );
          })()}

          <section>
            <h2 className="mb-2 text-xl sm:text-2xl font-black text-slate-900">Learners ({data.students.length})</h2>
            <div className="card divide-y-2 divide-brand-50 overflow-hidden">
              {data.students.length === 0 && <p className="p-4 font-bold text-slate-500">No learners have joined yet.</p>}
              {data.students.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 p-3">
                  <span className="min-w-0 flex-1 truncate font-black text-slate-800 text-sm sm:text-base">{s.name}</span>
                  <span className="font-bold text-slate-500 text-xs sm:text-sm">{s.done} tasks</span>
                  <span className="inline-flex items-center gap-1 font-extrabold text-amber-600 text-xs sm:text-sm">
                    <Flame size={14} className="fill-amber-500 stroke-amber-600" /> {s.streak}d
                  </span>
                  <span className="inline-flex items-center gap-1 font-black text-brand-700 text-xs sm:text-sm">
                    <Zap size={14} className="fill-brand-400 stroke-brand-700" /> {s.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xl sm:text-2xl font-black text-slate-900">Essays to review ({data.essays.length})</h2>
            <div className="space-y-3">
              {data.essays.length === 0 && (
                <p className="card p-4 font-bold text-slate-500 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" /> Nothing to review. All essays are up to date!
                </p>
              )}
              {data.essays.map((e) => (
                <EssayReviewCard key={e.id} essay={e} onReviewed={load} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xl sm:text-2xl font-black text-slate-900">Published tasks ({data.tasks.length})</h2>
            <div className="space-y-2">
              {data.tasks.map((t) => (
                <div key={t.id} className="card flex items-center gap-3 p-3 transition hover:shadow-xs">
                  <TopicBadge topic={t.topic} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-slate-900 text-sm sm:text-base">{t.title}</p>
                    <p className="text-xs font-bold text-slate-500">{TYPE_LABEL[t.type]} · {t.assignedDate} · {t.xp} XP</p>
                  </div>
                  <button
                    className="btn btn-ghost !px-2.5 !py-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 inline-flex items-center gap-1"
                    onClick={() => remove(t.id)}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ))}
    </div>
  );
}
