import bcrypt from 'bcryptjs';
import { User, Task, Submission, Story, XpLog, Announcement, Classroom } from '../models/index.js';
import { todayIST } from './gameService.js';
import { TASK_TR, STORY_TR } from '../translations.js';

let isSeeding = false;

/**
 * Ensures demo teacher, demo learners, classrooms, tasks, stories, and announcements
 * are always available and healthy. Safe to call repeatedly (idempotent).
 */
export async function ensureDemoData() {
  if (isSeeding) return;
  isSeeding = true;

  try {
    const today = todayIST();
    const demoPasswordHash = await bcrypt.hash('demo1234', 10);

    // 1. Ensure Demo Teacher
    let teacher = await User.findOne({ email: 'teacher@dulingo.in' });
    if (!teacher) {
      teacher = await User.create({
        name: 'Priya Teacher',
        email: 'teacher@dulingo.in',
        passwordHash: demoPasswordHash,
        role: 'teacher',
        xp: 0,
        streak: 0,
      });
      console.log('✅ Demo Teacher created: teacher@dulingo.in');
    } else {
      const pwMatch = await bcrypt.compare('demo1234', teacher.passwordHash).catch(() => false);
      if (!pwMatch) {
        teacher.passwordHash = demoPasswordHash;
        await teacher.save();
        console.log('🔄 Demo Teacher password synced to demo1234');
      }
    }

    // 2. Ensure Demo Classroom
    let classroom = await Classroom.findOne({ code: 'DUL101' });
    if (!classroom) {
      classroom = await Classroom.create({
        name: 'Civic Learning 101',
        subject: 'Civic Services & Governance',
        description: 'Interactive classroom covering Pensions, Online Forms, Grievance Portals, and Digital Safety.',
        code: 'DUL101',
        teacher: teacher._id,
        teacherName: teacher.name || 'Priya Teacher',
        students: [],
        active: true,
      });
      console.log('✅ Demo Classroom created: DUL101');
    }

    // 3. Ensure Demo Learners
    const demoLearners = [
      { name: 'Ramesh Kumar', email: 'ramesh@dulingo.in', xp: 340, streak: 5 },
      { name: 'Sunita Devi', email: 'sunita@dulingo.in', xp: 280, streak: 3 },
      { name: 'Anil Shetty', email: 'anil@dulingo.in', xp: 210, streak: 2 },
      { name: 'Meena Naik', email: 'meena@dulingo.in', xp: 150, streak: 4 },
      { name: 'Kiran Rao', email: 'kiran@dulingo.in', xp: 60, streak: 1 },
    ];

    const studentIds = [];

    for (const l of demoLearners) {
      let student = await User.findOne({ email: l.email });
      if (!student) {
        student = await User.create({
          name: l.name,
          email: l.email,
          passwordHash: demoPasswordHash,
          role: 'student',
          xp: l.xp,
          streak: l.streak,
          bestStreak: l.streak,
          lastActiveDate: today,
          badges: ['first_steps', ...(l.xp >= 100 ? ['century'] : []), ...(l.streak >= 3 ? ['on_fire'] : [])],
          classrooms: [classroom._id],
        });
        await XpLog.create({ user: student._id, amount: Math.round(l.xp * 0.6), reason: 'seed' }).catch(() => {});
      } else {
        const pwMatch = await bcrypt.compare('demo1234', student.passwordHash).catch(() => false);
        if (!pwMatch) {
          student.passwordHash = demoPasswordHash;
        }
        if (!student.classrooms || !student.classrooms.some((c) => String(c) === String(classroom._id))) {
          student.classrooms = [...(student.classrooms || []), classroom._id];
        }
        await student.save();
      }
      studentIds.push(student._id);
    }

    // Update classroom student roster
    const enrolledSet = new Set(classroom.students.map(String));
    let rosterChanged = false;
    for (const sId of studentIds) {
      if (!enrolledSet.has(String(sId))) {
        classroom.students.push(sId);
        rosterChanged = true;
      }
    }
    if (rosterChanged) {
      await classroom.save();
    }

    // 4. Ensure Core Tasks
    const existingTaskCount = await Task.countDocuments();
    if (existingTaskCount === 0) {
      const t = (o) => ({
        assignedDate: today,
        createdBy: teacher._id,
        classroom: classroom._id,
        xp: 10,
        ...o,
      });

      const tasksToInsert = [
        t({
          title: 'Life certificate for pension',
          topic: 'Pensions',
          type: 'audio_mcq',
          prompt:
            'Listen carefully. Mr. Sharma is a retired government employee who gets a monthly pension. His bank says he must prove he is alive every year. What should he submit?',
          audioText:
            'Listen carefully. Mister Sharma is a retired government employee who gets a monthly pension. His bank says he must prove he is alive every year. What should he submit?',
          options: [
            'A new PAN card',
            'A Life Certificate (Jeevan Pramaan)',
            'An electricity bill',
            'A passport photo only',
          ],
          answer: 'A Life Certificate (Jeevan Pramaan)',
          explanation:
            'Pensioners submit a Life Certificate every year, at the bank, post office, or digitally through Jeevan Pramaan, so the pension continues without a break.',
        }),
        t({
          title: 'Never share your OTP',
          topic: 'Payments',
          type: 'audio_mcq',
          prompt:
            'A caller says he is from your bank and asks for the OTP that just came on your phone, to "stop your account from closing". What should you do?',
          options: [
            'Tell him the OTP quickly',
            'Hang up and never share the OTP',
            'Send the OTP by message',
            'Ask a neighbour to read it out',
          ],
          answer: 'Hang up and never share the OTP',
          explanation:
            'Banks never ask for your OTP, PIN or password. Sharing an OTP lets a stranger take money from your account.',
        }),
        t({
          title: 'Grievance portal',
          topic: 'Grievances',
          type: 'fill_blank',
          prompt:
            'You can register a complaint against a central government department online on the ____ portal.',
          audioText:
            'You can register a complaint against a central government department online on the blank portal. Say or type the name of the portal.',
          answer: 'CPGRAMS|cpgrams',
          explanation:
            'CPGRAMS is the Centralised Public Grievance Redress and Monitoring System for complaints to central government departments.',
        }),
        t({
          title: 'Which document for a driving licence?',
          topic: 'Travel and Transport',
          type: 'audio_mcq',
          prompt:
            "Asha wants to apply for a learner's licence. Which official website should she use for driving licence services?",
          options: [
            'Parivahan Sewa',
            'A random agent website',
            'A social media page',
            'A shopping app',
          ],
          answer: 'Parivahan Sewa',
          explanation:
            'Parivahan Sewa is the official government portal for licence and vehicle services. Avoid agent websites that charge extra.',
        }),
        t({
          title: 'Income tax return needs',
          topic: 'Taxes',
          type: 'fill_blank',
          prompt:
            'To file an income tax return you need a ____ number, which is a 10-character account number given by the Income Tax Department.',
          answer: 'PAN|permanent account number',
          explanation:
            'PAN (Permanent Account Number) identifies you for tax. Keep it safe and share it only where required.',
        }),
        t({
          title: 'Fill the pension life certificate form',
          topic: 'Pensions',
          type: 'mock_form',
          xp: 20,
          prompt:
            'Practice form. Use these details: Name Ramesh Kumar. Born 12-03-1964. PPO number 123456. Bank: State Bank of India. Mobile: 9876543210. Fill each box carefully, then check.',
          audioText:
            'Practice form. Use these details. Name, Ramesh Kumar. Date of birth, twelve, three, nineteen sixty four. P P O number, one two three four five six. Bank, State Bank of India. Mobile number, nine eight seven six five four three two one zero. Fill each box carefully, then check.',
          fields: [
            {
              label: 'Full name of pensioner',
              answer: 'Ramesh Kumar',
              hint: 'Write the name exactly as in your bank passbook.',
              placeholder: 'e.g. Name Surname',
            },
            {
              label: 'Date of birth (DD-MM-YYYY)',
              answer: '12-03-1964|12/03/1964',
              hint: 'Day first, then month, then year.',
              placeholder: 'DD-MM-YYYY',
            },
            {
              label: 'PPO number',
              answer: '123456',
              hint: 'The Pension Payment Order number is printed on your pension papers.',
              placeholder: 'numbers only',
            },
            {
              label: 'Bank name',
              answer: 'State Bank of India|SBI',
              hint: 'The bank where your pension arrives.',
              placeholder: 'Bank name',
            },
            {
              label: 'Mobile number',
              answer: '9876543210',
              hint: '10 digits, no spaces. Never share OTPs that arrive on it.',
              placeholder: '10 digits',
            },
          ],
          explanation:
            'Check every box twice before submitting a real form. One wrong digit in a PPO or account number can delay your pension.',
        }),
        t({
          title: 'Fill the grievance form',
          topic: 'Grievances',
          type: 'mock_form',
          xp: 20,
          prompt:
            'Practice form. Meena Naik is complaining to the Department of Pensions about a delay in pension. Her application number is 4521. Fill the boxes.',
          audioText:
            'Practice form. Meena Naik is complaining to the Department of Pensions about a delay in pension. Her application number is four five two one. Fill the boxes.',
          fields: [
            {
              label: 'Your name',
              answer: 'Meena Naik',
              hint: 'The person making the complaint.',
              placeholder: 'Full name',
            },
            {
              label: 'Department you are complaining about',
              answer: 'Department of Pensions',
              hint: 'Name the office that caused the problem.',
              placeholder: 'Department',
            },
            {
              label: 'Subject of complaint',
              answer: 'Delay in pension|pension delay',
              hint: 'Say the problem in a few words.',
              placeholder: 'A few words',
            },
            {
              label: 'Application number',
              answer: '4521',
              hint: 'Always quote your application or reference number.',
              placeholder: 'Number',
            },
          ],
          explanation:
            'A clear complaint names who you are, which office, what went wrong, and your reference number. That makes it easy to act on.',
        }),
        t({
          title: 'Link Aadhaar with Bank & PAN',
          topic: 'Certificates',
          type: 'mock_form',
          xp: 20,
          prompt:
            'Practice form. You are linking your Aadhaar with your bank and PAN. Use these official given details: Full Name: Ramesh Kumar, 12-digit Aadhaar Number: 4920 1839 2049, PAN Number: ABCDE1234F, Linked Mobile Number: 9876543210. Only these given values must be entered in the respective form boxes.',
          audioText:
            'Practice form. You are linking your Aadhaar with your bank and PAN. Use the following official given details. Full Name, Ramesh Kumar. Twelve digit Aadhaar Number, four nine two zero, one eight three nine, two zero four nine. PAN Number, A B C D E one two three four F. Linked Mobile Number, nine eight seven six five four three two one zero. Enter each given value in the boxes below.',
          fields: [
            {
              label: 'Full name as per Aadhaar',
              answer: 'Ramesh Kumar',
              hint: 'Enter the exact name printed on your Aadhaar card.',
              placeholder: 'Ramesh Kumar',
            },
            {
              label: '12-digit Aadhaar Number',
              answer: '4920 1839 2049|492018392049',
              hint: 'Enter the 12-digit UIDAI Aadhaar number.',
              placeholder: '4920 1839 2049',
            },
            {
              label: 'Permanent Account Number (PAN)',
              answer: 'ABCDE1234F',
              hint: 'Enter your 10-character alphanumeric PAN.',
              placeholder: 'ABCDE1234F',
            },
            {
              label: 'Linked Mobile Number',
              answer: '9876543210',
              hint: 'Enter the 10-digit mobile number linked for OTP.',
              placeholder: '9876543210',
            },
          ],
          explanation:
            'Linking your Aadhaar with your bank account and PAN verifies your identity across government welfare schemes, direct benefit transfers (DBT), and income tax filings. Only verified official inputs must be entered.',
        }),
        t({
          title: 'Why certificates matter',
          topic: 'Certificates',
          type: 'essay',
          xp: 20,
          prompt:
            "In your own words, explain how you would apply for an income or caste certificate through your state's e-District service. Write at least 15 words.",
          explanation: 'Your teacher will read your answer and give feedback.',
        }),
      ];

      await Task.insertMany(tasksToInsert);
      console.log('✅ Core demo tasks inserted');

      // Apply translations
      for (const [title, translations] of Object.entries(TASK_TR)) {
        await Task.updateOne({ title }, { translations }).catch(() => {});
      }
    } else {
      // Ensure Aadhaar link task exists even on pre-seeded databases
      const hasAadhaar = await Task.findOne({ title: 'Link Aadhaar with Bank & PAN' });
      if (!hasAadhaar && teacher && classroom) {
        const aadhaarTask = await Task.create({
          assignedDate: today,
          createdBy: teacher._id,
          classroom: classroom._id,
          xp: 20,
          title: 'Link Aadhaar with Bank & PAN',
          topic: 'Certificates',
          type: 'mock_form',
          prompt:
            'Practice form. You are linking your Aadhaar with your bank and PAN. Use these official given details: Full Name: Ramesh Kumar, 12-digit Aadhaar Number: 4920 1839 2049, PAN Number: ABCDE1234F, Linked Mobile Number: 9876543210. Only these given values must be entered in the respective form boxes.',
          audioText:
            'Practice form. You are linking your Aadhaar with your bank and PAN. Use the following official given details. Full Name, Ramesh Kumar. Twelve digit Aadhaar Number, four nine two zero, one eight three nine, two zero four nine. PAN Number, A B C D E one two three four F. Linked Mobile Number, nine eight seven six five four three two one zero. Enter each given value in the boxes below.',
          fields: [
            {
              label: 'Full name as per Aadhaar',
              answer: 'Ramesh Kumar',
              hint: 'Enter the exact name printed on your Aadhaar card.',
              placeholder: 'Ramesh Kumar',
            },
            {
              label: '12-digit Aadhaar Number',
              answer: '4920 1839 2049|492018392049',
              hint: 'Enter the 12-digit UIDAI Aadhaar number.',
              placeholder: '4920 1839 2049',
            },
            {
              label: 'Permanent Account Number (PAN)',
              answer: 'ABCDE1234F',
              hint: 'Enter your 10-character alphanumeric PAN.',
              placeholder: 'ABCDE1234F',
            },
            {
              label: 'Linked Mobile Number',
              answer: '9876543210',
              hint: 'Enter the 10-digit mobile number linked for OTP.',
              placeholder: '9876543210',
            },
          ],
          explanation:
            'Linking your Aadhaar with your bank account and PAN verifies your identity across government welfare schemes, direct benefit transfers (DBT), and income tax filings. Only verified official inputs must be entered.',
        });
        if (TASK_TR['Link Aadhaar with Bank & PAN']) {
          await Task.updateOne({ _id: aadhaarTask._id }, { translations: TASK_TR['Link Aadhaar with Bank & PAN'] });
        }
        console.log('✅ Aadhaar link mock form task auto-provisioned');
      }
    }

    // 5. Ensure Audio Stories
    const existingStoryCount = await Story.countDocuments();
    if (existingStoryCount === 0) {
      const storiesToInsert = [
        {
          title: 'Ramesh learns the pension process',
          topic: 'Pensions',
          createdBy: teacher._id,
          text: `Ramesh is sixty-two years old and lives in a small town. Every month his pension reaches his bank account, but this year the bank told him to submit a life certificate.\n\nRamesh felt worried. He did not want to stand in a long queue, and he did not want to pay an agent.\n\nHis granddaughter showed him a safe way. He listened to a lesson on Dulingo, practised the steps, and learned that a life certificate can be given at the bank or digitally.\n\nOn the day, Ramesh did it himself. His pension continued without any delay. He smiled, because for the first time he did not need a middleman.`,
        },
        {
          title: 'Sunita and the fake call',
          topic: 'Payments',
          createdBy: teacher._id,
          text: `Sunita runs a small tailoring shop. One afternoon her phone rang. The caller said he was from her bank and that her account would be blocked.\n\nHe asked for the code that had just come in a message. Sunita remembered the lesson she heard on Dulingo: a bank never asks for an OTP.\n\nShe ended the call at once. Then she told her neighbours, so that they would also stay safe.\n\nSunita kept her money, and she kept her calm. Listening and practising had made her ready.`,
        },
        {
          title: 'Meena files a complaint',
          topic: 'Grievances',
          createdBy: teacher._id,
          text: `Meena applied for a certificate, but weeks passed and nothing happened. She did not know where to complain.\n\nIn class she learned about CPGRAMS, an official online portal for complaints about central government services.\n\nWith her teacher beside her, Meena practised on a sample form first. Then she wrote her complaint in simple words and submitted it.\n\nA few days later she got a reply. Meena learned that asking in the right place, in the right way, gets results.`,
        },
      ];

      await Story.insertMany(storiesToInsert);
      console.log('✅ Core demo stories inserted');

      for (const [title, translations] of Object.entries(STORY_TR)) {
        await Story.updateOne({ title }, { translations }).catch(() => {});
      }
    }

    // 6. Ensure Announcements
    const existingAnnCount = await Announcement.countDocuments();
    if (existingAnnCount === 0) {
      await Announcement.insertMany([
        {
          title: 'Welcome to Dulingo Civic Learning!',
          content:
            'All students are encouraged to complete daily tasks to maintain your streak. Use Practice Mode anytime to review past questions.',
          category: 'general',
          pinned: true,
          author: teacher._id,
          authorName: teacher.name || 'Priya Teacher',
        },
        {
          title: 'Aadhaar & Pension Submission Reminder',
          content:
            'Annual Life Certificates (Jeevan Pramaan) can be generated digitally at home using the face authentication app or nearest post office.',
          category: 'civic_alert',
          pinned: false,
          author: teacher._id,
          authorName: teacher.name || 'Priya Teacher',
        },
      ]);
      console.log('✅ Core demo announcements inserted');
    }

    // 7. Ensure a sample essay review is available for Teacher Portal demo
    const reviewCount = await Submission.countDocuments({ needsReview: true });
    if (reviewCount === 0) {
      const essayTask = await Task.findOne({ type: 'essay' });
      const meena = await User.findOne({ email: 'meena@dulingo.in' });
      if (essayTask && meena) {
        await Submission.create({
          user: meena._id,
          task: essayTask._id,
          answer:
            'I visited the state e-District online portal, registered with my Aadhaar number, uploaded my income proof document and electricity bill, and received the certificate tracking number within 10 minutes.',
          correct: true,
          needsReview: true,
          xpEarned: 20,
        }).catch(() => {});
        console.log('✅ Sample essay review created for Teacher panel evaluation');
      }
    }
  } catch (err) {
    console.error('⚠️ ensureDemoData error:', err);
  } finally {
    isSeeding = false;
  }
}

/**
 * On-demand helper to guarantee a specific demo account is ready for instant login
 */
export async function ensureDemoAccount(email, role = 'student') {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const isTeacher = normalizedEmail === 'teacher@dulingo.in' || role === 'teacher' || normalizedEmail.includes('teacher');
  const targetEmail = isTeacher ? 'teacher@dulingo.in' : 'ramesh@dulingo.in';
  const targetName = isTeacher ? 'Priya Teacher' : 'Ramesh Kumar';
  const targetRole = isTeacher ? 'teacher' : 'student';

  const demoHash = await bcrypt.hash('demo1234', 10);

  let user = await User.findOne({ email: targetEmail });
  if (!user) {
    user = await User.create({
      name: targetName,
      email: targetEmail,
      passwordHash: demoHash,
      role: targetRole,
      xp: isTeacher ? 0 : 340,
      streak: isTeacher ? 0 : 5,
      bestStreak: isTeacher ? 0 : 5,
      lastActiveDate: todayIST(),
      badges: isTeacher ? [] : ['first_steps', 'century', 'on_fire'],
    });
    console.log(`✅ Provisioned demo account on-the-fly: ${targetEmail}`);
  } else {
    // Reset password to demo1234 in case it was altered
    const valid = await bcrypt.compare('demo1234', user.passwordHash).catch(() => false);
    if (!valid) {
      user.passwordHash = demoHash;
      await user.save();
      console.log(`🔄 Reset password for demo account on-the-fly: ${targetEmail}`);
    }
  }

  // Ensure full demo ecosystem (classrooms, tasks, stories) in background
  ensureDemoData().catch(() => {});

  return user;
}
