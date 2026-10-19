import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Task, Submission, Story, XpLog } from './models.js';
import { todayIST } from './game.js';
import { TASK_TR, STORY_TR } from './translations.js';

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dulingo');
await Promise.all([User, Task, Submission, Story, XpLog].map((m) => m.deleteMany({})));

const hash = await bcrypt.hash('demo1234', 10);
const teacher = await User.create({ name: 'Priya Teacher', email: 'teacher@dulingo.in', passwordHash: hash, role: 'teacher' });

const demo = [
  ['Ramesh Kumar', 'ramesh@dulingo.in', 340, 5],
  ['Sunita Devi', 'sunita@dulingo.in', 280, 3],
  ['Anil Shetty', 'anil@dulingo.in', 210, 2],
  ['Meena Naik', 'meena@dulingo.in', 150, 4],
  ['Kiran Rao', 'kiran@dulingo.in', 60, 1],
];
for (const [name, email, xp, streak] of demo) {
  const u = await User.create({
    name, email, passwordHash: hash, role: 'student', xp, streak, bestStreak: streak,
    lastActiveDate: todayIST(), badges: ['first_steps', ...(xp >= 100 ? ['century'] : []), ...(streak >= 3 ? ['on_fire'] : [])],
  });
  await XpLog.create({ user: u._id, amount: Math.round(xp * 0.6), reason: 'seed' });
}

const today = todayIST();
const t = (o) => ({ assignedDate: today, createdBy: teacher._id, xp: 10, ...o });

await Task.insertMany([
  t({ title: 'Life certificate for pension', topic: 'Pensions', type: 'audio_mcq',
    prompt: 'Listen carefully. Mr. Sharma is a retired government employee who gets a monthly pension. His bank says he must prove he is alive every year. What should he submit?',
    audioText: 'Listen carefully. Mister Sharma is a retired government employee who gets a monthly pension. His bank says he must prove he is alive every year. What should he submit?',
    options: ['A new PAN card', 'A Life Certificate (Jeevan Pramaan)', 'An electricity bill', 'A passport photo only'],
    answer: 'A Life Certificate (Jeevan Pramaan)',
    explanation: 'Pensioners submit a Life Certificate every year, at the bank, post office, or digitally through Jeevan Pramaan, so the pension continues without a break.' }),
  t({ title: 'Never share your OTP', topic: 'Payments', type: 'audio_mcq',
    prompt: 'A caller says he is from your bank and asks for the OTP that just came on your phone, to "stop your account from closing". What should you do?',
    options: ['Tell him the OTP quickly', 'Hang up and never share the OTP', 'Send the OTP by message', 'Ask a neighbour to read it out'],
    answer: 'Hang up and never share the OTP',
    explanation: 'Banks never ask for your OTP, PIN or password. Sharing an OTP lets a stranger take money from your account.' }),
  t({ title: 'Grievance portal', topic: 'Grievances', type: 'fill_blank',
    prompt: 'You can register a complaint against a central government department online on the ____ portal.',
    audioText: 'You can register a complaint against a central government department online on the blank portal. Say or type the name of the portal.',
    answer: 'CPGRAMS|cpgrams', explanation: 'CPGRAMS is the Centralised Public Grievance Redress and Monitoring System for complaints to central government departments.' }),
  t({ title: 'Which document for a driving licence?', topic: 'Travel and Transport', type: 'audio_mcq',
    prompt: 'Asha wants to apply for a learner\'s licence. Which official website should she use for driving licence services?',
    options: ['Parivahan Sewa', 'A random agent website', 'A social media page', 'A shopping app'],
    answer: 'Parivahan Sewa',
    explanation: 'Parivahan Sewa is the official government portal for licence and vehicle services. Avoid agent websites that charge extra.' }),
  t({ title: 'Income tax return needs', topic: 'Taxes', type: 'fill_blank',
    prompt: 'To file an income tax return you need a ____ number, which is a 10-character account number given by the Income Tax Department.',
    answer: 'PAN|permanent account number', explanation: 'PAN (Permanent Account Number) identifies you for tax. Keep it safe and share it only where required.' }),
  t({ title: 'Fill the pension life certificate form', topic: 'Pensions', type: 'mock_form', xp: 20,
    prompt: 'Practice form. Use these details: Name Ramesh Kumar. Born 12-03-1964. PPO number 123456. Bank: State Bank of India. Mobile: 9876543210. Fill each box carefully, then check.',
    audioText: 'Practice form. Use these details. Name, Ramesh Kumar. Date of birth, twelve, three, nineteen sixty four. P P O number, one two three four five six. Bank, State Bank of India. Mobile number, nine eight seven six five four three two one zero. Fill each box carefully, then check.',
    fields: [
      { label: 'Full name of pensioner', answer: 'Ramesh Kumar', hint: 'Write the name exactly as in your bank passbook.', placeholder: 'e.g. Name Surname' },
      { label: 'Date of birth (DD-MM-YYYY)', answer: '12-03-1964|12/03/1964', hint: 'Day first, then month, then year.', placeholder: 'DD-MM-YYYY' },
      { label: 'PPO number', answer: '123456', hint: 'The Pension Payment Order number is printed on your pension papers.', placeholder: 'numbers only' },
      { label: 'Bank name', answer: 'State Bank of India|SBI', hint: 'The bank where your pension arrives.', placeholder: 'Bank name' },
      { label: 'Mobile number', answer: '9876543210', hint: '10 digits, no spaces. Never share OTPs that arrive on it.', placeholder: '10 digits' },
    ],
    explanation: 'Check every box twice before submitting a real form. One wrong digit in a PPO or account number can delay your pension.' }),
  t({ title: 'Fill the grievance form', topic: 'Grievances', type: 'mock_form', xp: 20,
    prompt: 'Practice form. Meena Naik is complaining to the Department of Pensions about a delay in pension. Her application number is 4521. Fill the boxes.',
    audioText: 'Practice form. Meena Naik is complaining to the Department of Pensions about a delay in pension. Her application number is four five two one. Fill the boxes.',
    fields: [
      { label: 'Your name', answer: 'Meena Naik', hint: 'The person making the complaint.', placeholder: 'Full name' },
      { label: 'Department you are complaining about', answer: 'Department of Pensions', hint: 'Name the office that caused the problem.', placeholder: 'Department' },
      { label: 'Subject of complaint', answer: 'Delay in pension|pension delay', hint: 'Say the problem in a few words.', placeholder: 'A few words' },
      { label: 'Application number', answer: '4521', hint: 'Always quote your application or reference number.', placeholder: 'Number' },
    ],
    explanation: 'A clear complaint names who you are, which office, what went wrong, and your reference number. That makes it easy to act on.' }),
  t({ title: 'Why certificates matter', topic: 'Certificates', type: 'essay', xp: 20,
    prompt: 'In your own words, explain how you would apply for an income or caste certificate through your state\'s e-District service. Write at least 15 words.',
    explanation: 'Your teacher will read your answer and give feedback.' }),
]);

await Story.insertMany([
  { title: 'Ramesh learns the pension process', topic: 'Pensions', createdBy: teacher._id, text:
`Ramesh is sixty-two years old and lives in a small town. Every month his pension reaches his bank account, but this year the bank told him to submit a life certificate.

Ramesh felt worried. He did not want to stand in a long queue, and he did not want to pay an agent.

His granddaughter showed him a safe way. He listened to a lesson on Dulingo, practised the steps, and learned that a life certificate can be given at the bank or digitally.

On the day, Ramesh did it himself. His pension continued without any delay. He smiled, because for the first time he did not need a middleman.` },
  { title: 'Sunita and the fake call', topic: 'Payments', createdBy: teacher._id, text:
`Sunita runs a small tailoring shop. One afternoon her phone rang. The caller said he was from her bank and that her account would be blocked.

He asked for the code that had just come in a message. Sunita remembered the lesson she heard on Dulingo: a bank never asks for an OTP.

She ended the call at once. Then she told her neighbours, so that they would also stay safe.

Sunita kept her money, and she kept her calm. Listening and practising had made her ready.` },
  { title: 'Meena files a complaint', topic: 'Grievances', createdBy: teacher._id, text:
`Meena applied for a certificate, but weeks passed and nothing happened. She did not know where to complain.

In class she learned about CPGRAMS, an official online portal for complaints about central government services.

With her teacher beside her, Meena practised on a sample form first. Then she wrote her complaint in simple words and submitted it.

A few days later she got a reply. Meena learned that asking in the right place, in the right way, gets results.` },
]);

for (const [title, translations] of Object.entries(TASK_TR)) await Task.updateOne({ title }, { translations });
for (const [title, translations] of Object.entries(STORY_TR)) await Story.updateOne({ title }, { translations });

console.log('Seeded. Teacher: teacher@dulingo.in / demo1234 — Students: ramesh@dulingo.in etc. / demo1234');
await mongoose.disconnect();
