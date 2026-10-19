# Dulingo – Learn public services by listening
Team Octopus · Web Dev Challenge · Techfest-26

Teachers publish daily audio quizzes, fill-in-the-blank/essay tasks and audio stories about public services (pensions, taxes, certificates, payments, grievances, transport). Learners log in daily, listen, answer, earn XP, keep streaks, unlock badges and climb a leaderboard.

## Stack
- Client: React 18 + Vite + Tailwind CSS v4 + Framer Motion (audio via the browser Web Speech API)
- Server: Node.js + Express + JWT auth
- Database: MongoDB (Mongoose)

## Run locally
You need Node 18+ and a MongoDB (local, or a free MongoDB Atlas cluster).

```bash
# 1) API
cd server
cp .env.example .env        # set MONGO_URI and JWT_SECRET
npm install
npm run seed                # demo teacher, learners, tasks and stories
npm run dev                 # http://localhost:4000

# 2) Website (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173  (proxies /api to :4000)
```

Demo logins (password `demo1234`): `teacher@dulingo.in`, `ramesh@dulingo.in`, `sunita@dulingo.in`.

## Deploy
- API on Render/Railway: root `server`, start `npm start`, env `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN=<your frontend URL>`. Optional: set `CLOUDINARY_URL` (or `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) so teacher-uploaded audio persists across ephemeral container restarts.
- Client on Vercel/Netlify: root `client`, build `npm run build`, output `dist`, env `VITE_API_URL=<your API URL>`. Add a rewrite of all paths to `/index.html` for React Router.
- Run `npm run seed` once against the production database (it wipes existing data, so do it before real use).

## Features
- Roles: learner and teacher, JWT login with rate limiting (express-rate-limit) against brute-force attacks
- Task types: audio multiple choice, fill in the blank, essay (teacher reviews), and mock government forms (several boxes, per-box hints read aloud, per-box feedback, partial XP)
- Audio: browser Web Speech API text-to-speech with slow mode, plus optional teacher-uploaded pre-recorded audio (MP3/WAV/WebM) for 100% device compatibility across regional languages
- Voice Input (Speech-to-Text): Web Speech Recognition integration allowing learners to speak their answers aloud across all task types (MCQ, fill-in-the-blank, essay dictation, mock forms) in English, Hindi, and Kannada
- Gamification: XP, levels, daily streak with Streak Freeze / Grace Period protection (1-day shield that prevents resets, recharge at 7-day milestones), badges (including Streak Shield 🛡️ & Freeze Survivor 🧊), daily-goal ring, confetti, weekly and all-time leaderboard
- Audio stories read aloud paragraph by paragraph with highlighting, XP when finished
- Teacher Hub: create tasks and stories with audio uploads/URLs, AI Task Drafting assistant (Gemini & OpenAI integration with automatic Hindi/Kannada translations), see learner progress, review essays with feedback, delete tasks
- Languages: English, Hindi, and Kannada. A language picker in the header switches lesson text, speech recognition language, and the read-aloud voice. All default tasks and stories feature high-quality, authentic translations (`server/translations.js`) verified for natural civic terminology and clear speech rhythm; anything untranslated falls back to English.
- Accessibility: large-text toggle, keyboard focus styles, ARIA labels, reduced-motion support, mobile bottom nav

## Ideas for the remaining days
Offline PWA caching, push notifications, voice clone narration.

## Notes
- Hindi/Kannada voices depend on the device: Chrome on Android usually has both; desktop browsers often lack Kannada. The app shows a warning when the voice is missing.
- The buttons and menus are still English; only lesson content and audio are translated.
- Tested: API smoke test (login, daily tasks, scoring, repeat-submit block, essay rules, role checks, both leaderboards, stories XP, teacher create) against a MongoDB-compatible server, client production build, and browser media engine safeguards for Chrome (Android/Desktop) and Safari (iOS/macOS).
