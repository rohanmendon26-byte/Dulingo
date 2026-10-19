/**
 * AI Task Drafting Service for Dulingo Teachers
 * Supports Gemini API, OpenAI API, and an offline civic knowledge generator fallback.
 */

import fs from 'node:fs';
import path from 'node:path';

const VALID_TOPICS = ['Pensions', 'Taxes', 'Certificates', 'Payments', 'Grievances', 'Transport', 'General'];
const VALID_TYPES = ['audio_mcq', 'fill_blank', 'essay', 'mock_form'];

const SYSTEM_INSTRUCTION = `You are an expert educational lesson designer creating interactive listening tasks for learners.
Create an accurate, engaging task specifically about the user's requested topic (programming, technology, languages, science, or public services).

CRITICAL RULES:
1. You MUST focus entirely on the user's specific requested topic. Never substitute or redirect to government or Aadhaar topics unless the user explicitly requested government services.
2. For "fill_blank" tasks: The prompt MUST contain "____" (four underscores) where the missing term goes. The answer must be the exact word/term.
3. For "audio_mcq" tasks: Provide 4 distinct options. The answer must match one of the 4 options verbatim.
4. For "mock_form" tasks: Provide 2 to 4 form boxes with label, answer, and hint.
5. For "essay" tasks: Provide a clear, thoughtful question for the learner to write about.
6. Provide natural translations for Hindi ("hi") and Kannada ("kn") for the title, prompt, audioText, explanation, and options (if MCQ).
7. Respond ONLY with a single valid JSON object matching this exact structure:
{
  "title": "Short descriptive title (max 50 chars)",
  "topic": "One of: Pensions, Taxes, Certificates, Payments, Grievances, Transport, General",
  "type": "One of: audio_mcq, fill_blank, essay, mock_form",
  "prompt": "The question or scenario for the citizen to solve. Keep sentences clear and spoken-friendly.",
  "audioText": "What should be read aloud to the citizen (can be identical to prompt)",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"], // Exactly 4 strings if audio_mcq, otherwise empty array []
  "answer": "The exact correct option if audio_mcq, or correct word/phrase if fill_blank, or empty string for essay/mock_form",
  "explanation": "Clear explanation of why this is correct and what the citizen should remember.",
  "xp": 10,
  "fields": [ // Only if type is mock_form: 2 to 4 boxes. Otherwise empty array []
    { "label": "Field label (e.g. Aadhaar Number)", "answer": "Expected value or sample pattern", "hint": "Spoken hint for learner", "placeholder": "Sample input" }
  ],
  "translations": {
    "hi": {
      "title": "Hindi translation of title",
      "prompt": "Hindi translation of prompt",
      "audioText": "Hindi translation of audioText",
      "explanation": "Hindi translation of explanation",
      "options": ["Option 1 in Hindi", "Option 2 in Hindi", "Option 3 in Hindi", "Option 4 in Hindi"] // only if audio_mcq
    },
    "kn": {
      "title": "Kannada translation of title",
      "prompt": "Kannada translation of prompt",
      "audioText": "Kannada translation of audioText",
      "explanation": "Kannada translation of explanation",
      "options": ["Option 1 in Kannada", "Option 2 in Kannada", "Option 3 in Kannada", "Option 4 in Kannada"] // only if audio_mcq
    }
  }
}`;

// Curated civic knowledge templates for realistic fallback
const CIVIC_TEMPLATES = [
  {
    keywords: ['aadhaar', 'uidai', 'mobile', 'otp', 'update'],
    task: {
      title: 'Aadhaar Mobile Number Link',
      topic: 'Certificates',
      type: 'audio_mcq',
      prompt: 'Sunita wants to download her e-Aadhaar online from the UIDAI portal. What must be linked to her Aadhaar to receive the OTP verification?',
      audioText: 'Sunita wants to download her e-Aadhaar online from the UIDAI portal. What must be linked to her Aadhaar to receive the OTP verification?',
      options: ['Registered Mobile Number', 'Electricity Bill', 'Ration Card', 'Bank Passbook'],
      answer: 'Registered Mobile Number',
      explanation: 'UIDAI sends a one-time password (OTP) only to the active mobile number registered in your Aadhaar record. You can update your mobile number at any Aadhaar Seva Kendra without documentation.',
      xp: 10,
      fields: [],
      translations: {
        hi: {
          title: 'आधार मोबाइल नंबर लिंक',
          prompt: 'सुनीता यूआईडीएआई (UIDAI) पोर्टल से अपना ई-आधार ऑनलाइन डाउनलोड करना चाहती है। ओटीपी (OTP) प्राप्त करने के लिए उसके आधार से क्या जुड़ा होना चाहिए?',
          audioText: 'सुनीता यूआईडीएआई पोर्टल से अपना ई-आधार ऑनलाइन डाउनलोड करना चाहती है। ओटीपी प्राप्त करने के लिए उसके आधार से क्या जुड़ा होना चाहिए?',
          options: ['पंजीकृत मोबाइल नंबर', 'बिजली बिल', 'राशन कार्ड', 'बैंक पासबुक'],
          explanation: 'यूआईडीएआई केवल आपके आधार में पंजीकृत सक्रिय मोबाइल नंबर पर ही ओटीपी भेजता है। मोबाइल नंबर आधार सेवा केंद्र पर बिना किसी दस्तावेज के अपडेट कराया जा सकता है।',
        },
        kn: {
          title: 'ಆಧಾರ್ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಲಿಂಕ್',
          prompt: 'ಸುನೀತಾ ಯುಐಡಿಎಐ ಪೋರ್ಟಲ್‌ನಿಂದ ತನ್ನ ಇ-ಆಧಾರ್ ಅನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು ಬಯಸುತ್ತಾಳೆ. ಒಟಿಪಿ ಪರಿಶೀಲನೆ ಪಡೆಯಲು ಆಕೆಯ ಆಧಾರಿಗೆ ಏನು ಲಿಂಕ್ ಆಗಿರಬೇಕು?',
          audioText: 'ಸುನೀತಾ ಯುಐಡಿಎಐ ಪೋರ್ಟಲ್‌ನಿಂದ ತನ್ನ ಇ-ಆಧಾರ್ ಅನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು ಬಯಸುತ್ತಾಳೆ. ಒಟಿಪಿ ಪರಿಶೀಲನೆ ಪಡೆಯಲು ಆಕೆಯ ಆಧಾರಿಗೆ ಏನು ಲಿಂಕ್ ಆಗಿರಬೇಕು?',
          options: ['ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', 'ವಿದ್ಯುತ್ ಬಿಲ್', 'ರೇಷನ್ ಕಾರ್ಡ್', 'ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್'],
          explanation: 'ಯುಐಡಿಎಐ ನಿಮ್ಮ ಆಧಾರ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಲಾದ ಸಕ್ರಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗೆ ಮಾತ್ರ ಒಟಿಪಿ ಕಳುಹಿಸುತ್ತದೆ. ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲದೆ ಆಧಾರ್ ಸೇವಾ ಕೇಂದ್ರದಲ್ಲಿ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನವೀಕರಿಸಬಹುದು.',
        },
      },
    },
  },
  {
    keywords: ['pension', 'life certificate', 'jeevan pramaan', 'retired'],
    task: {
      title: 'Digital Life Certificate Submission',
      topic: 'Pensions',
      type: 'audio_mcq',
      prompt: 'Every November, pensioners must submit proof that they are alive so their monthly pension continues without interruption. What is the digital life certificate called in India?',
      audioText: 'Every November, pensioners must submit proof that they are alive so their monthly pension continues without interruption. What is the digital life certificate called in India?',
      options: ['Jeevan Pramaan', 'Voter Card', 'Ayushman Card', 'Ration Patra'],
      answer: 'Jeevan Pramaan',
      explanation: 'Jeevan Pramaan is the biometric-enabled Digital Life Certificate (DLC) for pensioners. It can be submitted via the Jeevan Pramaan app using face recognition or fingerprint scanners without visiting the bank branch.',
      xp: 10,
      fields: [],
      translations: {
        hi: {
          title: 'डिजिटल जीवन प्रमाण पत्र जमा करना',
          prompt: 'प्रत्येक वर्ष नवंबर में पेंशनभोगियों को जीवित होने का प्रमाण देना होता है ताकि उनकी मासिक पेंशन बिना रुकावट जारी रहे। भारत में डिजिटल जीवन प्रमाण पत्र को क्या कहा जाता है?',
          audioText: 'प्रत्येक वर्ष नवंबर में पेंशनभोगियों को जीवित होने का प्रमाण देना होता है ताकि उनकी मासिक पेंशन बिना रुकावट जारी रहे। भारत में डिजिटल जीवन प्रमाण पत्र को क्या कहा जाता है?',
          options: ['जीवन प्रमाण', 'मतदाता पहचान पत्र', 'आयुष्मान कार्ड', 'राशन पत्र'],
          explanation: 'जीवन प्रमाण पेंशनभोगियों के लिए बायोमेट्रिक-सक्षम डिजिटल लाइफ सर्टिफिकेट है। इसे बैंक शाखा जाए बिना फेस रिकग्निशन या फिंगरप्रिंट स्कैनर से सबमिट किया जा सकता है।',
        },
        kn: {
          title: 'ಡಿಜಿಟಲ್ ಜೀವನ್ ಪ್ರಮಾಣ ಪತ್ರ ಸಲ್ಲಿಕೆ',
          prompt: 'ಪ್ರತಿ ನವೆಂಬರ್‌ನಲ್ಲಿ ಪಿಂಚಣಿದಾರರು ತಮ್ಮ ಮಾಸಿಕ ಪಿಂಚಣಿ ನಿರಂತರವಾಗಿ ಬರಲು ಜೀವಂತ ಪ್ರಮಾಣ ನೀಡಬೇಕು. ಭಾರತದಲ್ಲಿ ಈ ಡಿಜಿಟಲ್ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಏನೆಂದು ಕರೆಯುತ್ತಾರೆ?',
          audioText: 'ಪ್ರತಿ ನವೆಂಬರ್‌ನಲ್ಲಿ ಪಿಂಚಣಿದಾರರು ತಮ್ಮ ಮಾಸಿಕ ಪಿಂಚಣಿ ನಿರಂತರವಾಗಿ ಬರಲು ಜೀವಂತ ಪ್ರಮಾಣ ನೀಡಬೇಕು. ಭಾರತದಲ್ಲಿ ಈ ಡಿಜಿಟಲ್ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಏನೆಂದು ಕರೆಯುತ್ತಾರೆ?',
          options: ['ಜೀವನ್ ಪ್ರಮಾಣ್', 'ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ', 'ಆಯುಷ್ಮಾನ್ ಕಾರ್ಡ್', 'ರೇಷನ್ ಪತ್ರ'],
          explanation: 'ಜೀವನ್ ಪ್ರಮಾಣ್ ಪಿಂಚಣಿದಾರರಿಗೆ ಬಯೋಮೆಟ್ರಿಕ್ ಆಧಾರಿತ ಡಿಜಿಟಲ್ ಜೀವ ಪ್ರಮಾಣಪತ್ರವಾಗಿದೆ. ಇದನ್ನು ಬ್ಯಾಂಕ್‌ಗೆ ಹೋಗದೆ ಮೊಬೈಲ್ ಫೇಸ್ ಆಥೆಂಟಿಕೇಶನ್ ಮೂಲಕ ಸಲ್ಲಿಸಬಹುದು.',
        },
      },
    },
  },
  {
    keywords: ['driving', 'license', 'transport', 'rto', 'parivahan', 'vehicle'],
    task: {
      title: 'Learner License Application Portal',
      topic: 'Transport',
      type: 'fill_blank',
      prompt: 'To apply for a driving license or vehicle transfer online in India, citizens use the official Ministry of Road Transport portal named ____ Parivahan.',
      audioText: 'To apply for a driving license or vehicle transfer online in India, citizens use the official Ministry of Road Transport portal named what Parivahan?',
      options: [],
      answer: 'Sarathi|sarathi|Sarthi',
      explanation: 'Sarathi Parivahan (sarathi.parivahan.gov.in) handles all driving license services, learner permits, and slot booking across India.',
      xp: 10,
      fields: [],
      translations: {
        hi: {
          title: 'लर्नर लाइसेंस आवेदन पोर्टल',
          prompt: 'भारत में ड्राइविंग लाइसेंस या वाहन संबंधी ऑनलाइन सेवाओं के लिए सड़क परिवहन मंत्रालय के आधिकारिक पोर्टल का नाम ____ परिवहन है।',
          audioText: 'भारत में ड्राइविंग लाइसेंस या वाहन संबंधी ऑनलाइन सेवाओं के लिए सड़क परिवहन मंत्रालय के आधिकारिक पोर्टल का क्या नाम है?',
          explanation: 'सारथी परिवहन (sarathi.parivahan.gov.in) पोर्टल के माध्यम से ड्राइविंग लाइसेंस, लर्नर परमिट और टेस्ट स्लॉट बुकिंग की जाती है।',
        },
        kn: {
          title: 'ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಅರ್ಜಿ ಪೋರ್ಟಲ್',
          prompt: 'ಭಾರತದಲ್ಲಿ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಅಥವಾ ವಾಹನ ಸೇವೆಗಳಿಗಾಗಿ ರಸ್ತೆ ಸಾರಿಗೆ ಸಚಿವಾಲಯದ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಹೆಸರು ____ ಸಾರಿಗೆ (ಪರಿವಾಹನ್).',
          audioText: 'ಭಾರತದಲ್ಲಿ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಅಥವಾ ವಾಹನ ಸೇವೆಗಳಿಗಾಗಿ ರಸ್ತೆ ಸಾರಿಗೆ ಸಚಿವಾಲಯದ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಹೆಸರು ಏನು?',
          explanation: 'ಸಾರಥಿ ಪರಿವಾಹನ್ (sarathi.parivahan.gov.in) ಪೋರ್ಟಲ್ ಭಾರತದಾದ್ಯಂತ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಮತ್ತು ಲರ್ನರ್ ಪರ್ಮಿಟ್ ಸೇವೆಗಳನ್ನು ನಿರ್ವಹಿಸುತ್ತದೆ.',
        },
      },
    },
  },
  {
    keywords: ['ration', 'food', 'fair price', 'pds', 'ration card'],
    task: {
      title: 'One Nation One Ration Card (ONORC)',
      topic: 'Certificates',
      type: 'audio_mcq',
      prompt: 'Under the One Nation One Ration Card scheme, can a migrant worker access subsidized foodgrains from any Fair Price Shop in another state using their Aadhaar-linked ration card?',
      audioText: 'Under the One Nation One Ration Card scheme, can a migrant worker access subsidized foodgrains from any Fair Price Shop in another state using their Aadhaar-linked ration card?',
      options: ['Yes, anywhere in India', 'No, only in native village', 'Only in district headquarters', 'Only after paying a penalty fee'],
      answer: 'Yes, anywhere in India',
      explanation: 'The ONORC scheme enables migrant beneficiaries to collect their entitled subsidized food grains from any electronic point of sale (ePoS) Fair Price Shop in the country through biometric Aadhaar authentication.',
      xp: 10,
      fields: [],
      translations: {
        hi: {
          title: 'एक राष्ट्र एक राशन कार्ड (ONORC)',
          prompt: 'एक राष्ट्र एक राशन कार्ड योजना के अंतर्गत क्या कोई प्रवासी मजदूर अपने आधार-लिंक्ड राशन कार्ड से किसी अन्य राज्य में भी राशन ले सकता है?',
          audioText: 'एक राष्ट्र एक राशन कार्ड योजना के अंतर्गत क्या कोई प्रवासी मजदूर अपने आधार-लिंक्ड राशन कार्ड से किसी अन्य राज्य में भी राशन ले सकता है?',
          options: ['हाँ, पूरे भारत में कहीं भी', 'नहीं, केवल अपने मूल गाँव में', 'केवल जिला मुख्यालय में', 'केवल अतिरिक्त शुल्क देकर'],
          explanation: 'ओएनओआरसी (ONORC) योजना के तहत बायोमेट्रिक आधार सत्यापन द्वारा कोई भी पात्र लाभार्थी देश के किसी भी सरकारी राशन दुकान से अपना कोटा ले सकता है।',
        },
        kn: {
          title: 'ಒಂದು ರಾಷ್ಟ್ರ ಒಂದು ರೇಷನ್ ಕಾರ್ಡ್ (ONORC)',
          prompt: 'ಒಂದು ರಾಷ್ಟ್ರ ಒಂದು ರೇಷನ್ ಕಾರ್ಡ್ ಯೋಜನೆಯಡಿ ವಲಸೆ ಕಾರ್ಮಿಕರು ತಮ್ಮ ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಪಡಿತರ ಚೀಟಿ ಬಳಸಿ ಬೇರೆ ರಾಜ್ಯದಲ್ಲಿ ರೇಷನ್ ಪಡೆಯಬಹುದೇ?',
          audioText: 'ಒಂದು ರಾಷ್ಟ್ರ ಒಂದು ರೇಷನ್ ಕಾರ್ಡ್ ಯೋಜನೆಯಡಿ ವಲಸೆ ಕಾರ್ಮಿಕರು ತಮ್ಮ ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಪಡಿತರ ಚೀಟಿ ಬಳಸಿ ಬೇರೆ ರಾಜ್ಯದಲ್ಲಿ ರೇಷನ್ ಪಡೆಯಬಹುದೇ?',
          options: ['ಹೌದು, ಭಾರತದಲ್ಲಿ ಎಲ್ಲಿಯಾದರೂ', 'ಇಲ್ಲ, ಸ್ವಂತ ಊರಿನಲ್ಲಿ ಮಾತ್ರ', 'ಜಿಲ್ಲಾ ಕೇಂದ್ರದಲ್ಲಿ ಮಾತ್ರ', 'ಹೆಚ್ಚುವರಿ ಶುಲ್ಕ ಪಾವತಿಸಿದರೆ ಮಾತ್ರ'],
          explanation: 'ಒಎನ್‌ಒಆರ್‌ಸಿ ಯೋಜನೆಯು ಬಯೋಮೆಟ್ರಿಕ್ ಆಧಾರ್ ದೃಢೀಕರಣದೊಂದಿಗೆ ದೇಶದ ಯಾವುದೇ ನ್ಯಾಯಬೆಲೆ ಅಂಗಡಿಯಿಂದ ಪಡಿತರ ಪಡೆಯಲು ಅನುಮತಿಸುತ್ತದೆ.',
        },
      },
    },
  },
  {
    keywords: ['grievance', 'complaint', 'pgportal', 'cpgrams', 'consumer'],
    task: {
      title: 'Central Government Public Grievance Portal',
      topic: 'Grievances',
      type: 'audio_mcq',
      prompt: 'If a citizen has an unresolved grievance regarding postal service, banking, railways, or central schemes, which central government portal allows them to file a formal grievance?',
      audioText: 'If a citizen has an unresolved grievance regarding postal service, banking, railways, or central schemes, which central government portal allows them to file a formal grievance?',
      options: ['CPGRAMS Portal', 'Instagram Handle', 'Private Forum', 'Local News Bulletin'],
      answer: 'CPGRAMS Portal',
      explanation: 'CPGRAMS (Centralised Public Grievance Redress and Monitoring System - pgportal.gov.in) is the official online portal to lodge grievances with central ministries and departments.',
      xp: 10,
      fields: [],
      translations: {
        hi: {
          title: 'केंद्रीय लोक शिकायत निवारण पोर्टल',
          prompt: 'यदि किसी नागरिक को डाक सेवा, बैंकिंग, रेलवे या केंद्रीय योजनाओं से जुड़ी कोई अनसुलझी शिकायत है, तो वे किस आधिकारिक पोर्टल पर शिकायत दर्ज कर सकते हैं?',
          audioText: 'यदि किसी नागरिक को डाक सेवा, बैंकिंग, रेलवे या केंद्रीय योजनाओं से जुड़ी कोई अनसुलझी शिकायत है, तो वे किस आधिकारिक पोर्टल पर शिकायत दर्ज कर सकते हैं?',
          options: ['सीपीजीआरएएमएस (CPGRAMS) पोर्टल', 'इंस्टाग्राम हैंडल', 'निजी फोरम', 'स्थानीय समाचार बुलेटिन'],
          explanation: 'सीपीजीआरएएमएस (pgportal.gov.in) भारत सरकार का आधिकारिक लोक शिकायत निवारण पोर्टल है जहाँ प्रत्येक शिकायत को ट्रैक किया जाता है।',
        },
        kn: {
          title: 'ಕೇಂದ್ರ ಸಾರ್ವಜನಿಕ ಕುಂದುಕೊರತೆ ನಿವಾರಣಾ ಪೋರ್ಟಲ್',
          prompt: 'ಅಂಚೆ ಸೇವೆ, ಬ್ಯಾಂಕಿಂಗ್, ರೈಲ್ವೆ ಅಥವಾ ಕೇಂದ್ರ ಯೋಜನೆಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ದೂರುಗಳಿಗಾಗಿ ನಾಗರಿಕರು ಯಾವ ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ದೂರು ದಾಖಲಿಸಬಹುದು?',
          audioText: 'ಅಂಚೆ ಸೇವೆ, ಬ್ಯಾಂಕಿಂಗ್, ರೈಲ್ವೆ ಅಥವಾ ಕೇಂದ್ರ ಯೋಜನೆಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ದೂರುಗಳಿಗಾಗಿ ನಾಗರಿಕರು ಯಾವ ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ದೂರು ದಾಖಲಿಸಬಹುದು?',
          options: ['ಸಿಪಿಜಿಆರ್‌ಎಎಂಎಸ್ (CPGRAMS) ಪೋರ್ಟಲ್', 'ಇನ್‌ಸ್ಟಾಗ್ರಾಮ್ ಖಾತೆ', 'ಖಾಸಗಿ ವೇದಿಕೆ', 'ಸ್ಥಳೀಯ ಸುದ್ದಿಪತ್ರಿಕೆ'],
          explanation: 'ಸಿಪಿಜಿಆರ್‌ಎಎಂಎಸ್ (pgportal.gov.in) ಕೇಂದ್ರ ಸಚಿವಾಲಯಗಳಿಗೆ ಸಾರ್ವಜನಿಕ ಕುಂದುಕೊರತೆಗಳನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಸಲ್ಲಿಸುವ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಆಗಿದೆ.',
        },
      },
    },
  },
];

function generateOfflineDraft(topic, preferredType) {
  const norm = (topic || '').toLowerCase();

  // Try matching against curated civic knowledge templates
  const matched = CIVIC_TEMPLATES.find((t) => t.keywords.some((k) => norm.includes(k)));
  if (matched) {
    const draft = JSON.parse(JSON.stringify(matched.task));
    if (preferredType && preferredType !== 'auto' && draft.type !== preferredType) {
      draft.type = preferredType;
      if (preferredType === 'fill_blank') {
        draft.options = [];
        draft.prompt = draft.prompt.replace(/\?$/, '') + ' — the answer is ____.';
      }
    }
    return draft;
  }

  // Dynamic contextual generator
  const cleanTitle = (topic || 'Lesson Topic').trim();
  const selectedType = preferredType && preferredType !== 'auto' ? preferredType : 'audio_mcq';

  const isCoding = /python|tuple|list|function|variable|loop|array|javascript|coding|code|programming|sql|database|html|css|java|c\+\+|react|dict|class/i.test(norm);
  const isCivic = /pension|epfo|provident|retire|tax|gst|pan|itr|cess|certificate|aadhaar|caste|income|birth|domicile|payment|upi|bank|dbt|subsidy|pmkisan|grievance|complaint|police|consumer|helpline|transport|driving|license|rto|traffic|metro|bus/i.test(norm);

  let detectedTopic = 'General';
  if (/pension|epfo|provident|retire/i.test(norm)) detectedTopic = 'Pensions';
  else if (/tax|gst|pan|itr|cess/i.test(norm)) detectedTopic = 'Taxes';
  else if (/certificate|aadhaar|caste|income|birth|domicile/i.test(norm)) detectedTopic = 'Certificates';
  else if (/payment|upi|bank|dbt|subsidy|pmkisan/i.test(norm)) detectedTopic = 'Payments';
  else if (/grievance|complaint|police|consumer|helpline/i.test(norm)) detectedTopic = 'Grievances';
  else if (/transport|driving|license|rto|traffic|metro|bus/i.test(norm)) detectedTopic = 'Transport';

  if (isCoding && /tuple/i.test(norm)) {
    if (selectedType === 'fill_blank') {
      return {
        title: 'Python Tuple Immutability',
        topic: 'General',
        type: 'fill_blank',
        prompt: 'In Python, once a tuple is created, its elements cannot be changed or modified, meaning tuples are ____.',
        audioText: 'In Python, once a tuple is created, its elements cannot be changed or modified, meaning tuples are what?',
        options: [],
        answer: 'immutable|Immutable',
        explanation: 'Tuples in Python are immutable sequence types. Unlike lists, you cannot alter, add, or remove their elements once declared.',
        xp: 10,
        fields: [],
        translations: {
          hi: {
            title: 'पायथन में ट्यूपल अपरिवर्तनीयता',
            prompt: 'पायथन में एक बार ट्यूपल बनने के बाद उसके तत्वों को बदला नहीं जा सकता, अर्थात ट्यूपल ____ होते हैं।',
            audioText: 'पायथन में एक बार ट्यूपल बनने के बाद उसके तत्वों को बदला नहीं जा सकता, अर्थात वे क्या होते हैं?',
            explanation: 'पायथन में ट्यूपल अपरिवर्तनीय (immutable) होते हैं।',
          },
          kn: {
            title: 'ಪೈಥಾನ್‌ನಲ್ಲಿ ಟುಪಲ್ ಗುಣಲಕ್ಷಣ',
            prompt: 'ಪೈಥಾನ್‌ನಲ್ಲಿ ಒಮ್ಮೆ ಟುಪಲ್ ರಚಿಸಿದ ನಂತರ, ಅದರ ಅಂಶಗಳನ್ನು ಬದಲಾಯಿಸಲಾಗುವುದಿಲ್ಲ, ಅಂದರೆ ಟುಪಲ್‌ಗಳು ____.',
            audioText: 'ಪೈಥಾನ್‌ನಲ್ಲಿ ಒಮ್ಮೆ ಟುಪಲ್ ರಚಿಸಿದ ನಂತರ ಅದರ ಅಂಶಗಳನ್ನು ಬದಲಾಯಿಸಲಾಗುವುದೇ?',
            explanation: 'ಪೈಥಾನ್‌ನಲ್ಲಿ ಟುಪಲ್‌ಗಳು ಬದಲಾಯಿಸಲಾಗದವು (immutable).',
          },
        },
      };
    }
  }

  if (selectedType === 'audio_mcq') {
    if (isCivic) {
      return {
        title: `${cleanTitle}: Key Document`,
        topic: detectedTopic,
        type: 'audio_mcq',
        prompt: `When applying for ${cleanTitle} through official service centers, which government-issued document is most universally required for identity and address verification?`,
        audioText: `When applying for ${cleanTitle} through official service centers, which government-issued document is most universally required for identity and address verification?`,
        options: ['Aadhaar Card with linked Mobile Number', 'Gym Membership Card', 'Unverified Handwritten Letter', 'Expired Movie Ticket'],
        answer: 'Aadhaar Card with linked Mobile Number',
        explanation: `For ${cleanTitle}, Aadhaar with an active linked mobile number allows instant paperless e-KYC and OTP authentication.`,
        xp: 10,
        fields: [],
        translations: {
          hi: {
            title: `${cleanTitle}: आवश्यक दस्तावेज`,
            prompt: `${cleanTitle} के लिए आधिकारिक सेवा केंद्रों पर आवेदन करते समय पहचान और पते के सत्यापन के लिए कौन सा दस्तावेज सबसे अनिवार्य है?`,
            audioText: `${cleanTitle} के लिए आधिकारिक सेवा केंद्रों पर आवेदन करते समय पहचान और पते के सत्यापन के लिए कौन सा दस्तावेज सबसे अनिवार्य है?`,
            options: ['मोबाइल लिंक्ड आधार कार्ड', 'जिम सदस्यता कार्ड', 'हस्तलिखित सादा पत्र', 'पुराना टिकट'],
            explanation: `${cleanTitle} के लिए सक्रिय मोबाइल नंबर से जुड़ा आधार कार्ड निर्बाध ई-केवाईसी और ओटीपी सत्यापन सुनिश्चित करता है।`,
          },
          kn: {
            title: `${cleanTitle}: ಅಗತ್ಯ ದಾಖಲೆ`,
            prompt: `${cleanTitle} ಗಾಗಿ ಅಧಿಕೃತ ಸೇವಾ ಕೇಂದ್ರಗಳಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸುವಾಗ ಗುರುತು ಮತ್ತು ವಿಳಾಸ ಪರಿಶೀಲನೆಗೆ ಯಾವ ದಾಖಲೆ ಅತ್ಯಂತ ಅಗತ್ಯವಾಗಿದೆ?`,
            audioText: `${cleanTitle} ಗಾಗಿ ಅಧಿಕೃತ ಸೇವಾ ಕೇಂದ್ರಗಳಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸುವಾಗ ಗುರುತು ಮತ್ತು ವಿಳಾಸ ಪರಿಶೀಲನೆಗೆ ಯಾವ ದಾಖಲೆ ಅತ್ಯಂತ ಅಗತ್ಯವಾಗಿದೆ?`,
            options: ['ಮೊಬೈಲ್ ಲಿಂಕ್ ಆದ ಆಧಾರ್ ಕಾರ್ಡ್', 'ಜಿಮ್ ಕಾರ್ಡ್', 'ಕೈಬರಹದ ಕಾಗದ', 'ಹಳೆಯ ಟಿಕೆಟ್'],
            explanation: `${cleanTitle} ಪ್ರಕ್ರಿಯೆಗೆ ಸಕ್ರಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗೆ ಲಿಂಕ್ ಆಗಿರುವ ಆಧಾರ್ ಕಾರ್ಡ್ ತ್ವರಿತ ಇ-ಕೆವೈಸಿ ಪರಿಶೀಲನೆಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ.`,
          },
        },
      };
    }

    return {
      title: `${cleanTitle}: Fundamental Concept`,
      topic: 'General',
      type: 'audio_mcq',
      prompt: `Which of the following best describes the key purpose or definition of ${cleanTitle}?`,
      audioText: `Which of the following best describes the key purpose or definition of ${cleanTitle}?`,
      options: [
        `Core mechanism for ${cleanTitle}`,
        'Unrelated external hardware component',
        'Random unformatted sequence',
        'Outdated temporary cache file'
      ],
      answer: `Core mechanism for ${cleanTitle}`,
      explanation: `Understanding ${cleanTitle} allows learners to build solid practical proficiency in the subject.`,
      xp: 10,
      fields: [],
      translations: {
        hi: {
          title: `${cleanTitle}: मूल अवधारणा`,
          prompt: `${cleanTitle} के मुख्य उद्देश्य या परिभाषा का सबसे सही वर्णन कौन सा है?`,
          audioText: `${cleanTitle} के मुख्य उद्देश्य या परिभाषा का सबसे सही वर्णन कौन सा है?`,
          options: [`${cleanTitle} की मुख्य प्रणाली`, 'असंबद्ध बाहरी उपकरण', 'अव्यवस्थित क्रम', 'पुरानी अस्थायी फ़ाइल'],
          explanation: `${cleanTitle} की सही समझ विषय में व्यावहारिक दक्षता बढ़ाती है।`,
        },
        kn: {
          title: `${cleanTitle}: ಮೂಲ ಪರಿಕಲ್ಪನೆ`,
          prompt: `${cleanTitle} ನ ಮುಖ್ಯ ಉದ್ದೇಶ ಅಥವಾ ವ್ಯಾಖ್ಯಾನವನ್ನು ಯಾವುದು ಉತ್ತಮವಾಗಿ ವಿವರಿಸುತ್ತದೆ?`,
          audioText: `${cleanTitle} ನ ಮುಖ್ಯ ಉದ್ದೇಶ ಅಥವಾ ವ್ಯಾಖ್ಯಾನವನ್ನು ಯಾವುದು ಉತ್ತಮವಾಗಿ ವಿವರಿಸುತ್ತದೆ?`,
          options: [`${cleanTitle} ನ ಮುಖ್ಯ ತತ್ವ`, 'ಅಸಂಬದ್ಧ ಬಾಹ್ಯ ಸಾಧನ', 'ಅವ್ಯವಸ್ಥಿತ ಅನುಕ್ರಮ', 'ಹಳೆಯ ತಾತ್ಕಾಲಿಕ ಕಡತ'],
          explanation: `${cleanTitle} ನ ಸರಿಯಾದ ತಿಳುವಳಿಕೆಯು ವಿಷಯದಲ್ಲಿ ಪ್ರಾಯೋಗಿಕ ಕೌಶಲ್ಯವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ.`,
        },
      },
    };
  }

  if (selectedType === 'fill_blank') {
    if (isCivic) {
      return {
        title: `${cleanTitle}: Portal Access`,
        topic: detectedTopic,
        type: 'fill_blank',
        prompt: `To securely access online services for ${cleanTitle}, citizens receive a 6-digit one-time password on their phone known as ____.`,
        audioText: `To securely access online services for ${cleanTitle}, citizens receive a 6-digit one-time password on their phone known as what?`,
        options: [],
        answer: 'OTP|otp|One Time Password',
        explanation: `An OTP (One-Time Password) confirms your personal identity before any record or service for ${cleanTitle} is processed.`,
        xp: 10,
        fields: [],
        translations: {
          hi: {
            title: `${cleanTitle}: पोर्टल सुरक्षा`,
            prompt: `${cleanTitle} से संबंधित सेवाओं को सुरक्षित रूप से ऑनलाइन उपयोग करने के लिए मोबाइल पर आने वाले 6 अंकों के कोड को ____ कहते हैं।`,
            audioText: `${cleanTitle} से संबंधित सेवाओं के लिए मोबाइल पर आने वाले कोड को क्या कहते हैं?`,
            explanation: `ओटीपी (One-Time Password) आपकी पहचान को सुरक्षित प्रमाणित करता है।`,
          },
          kn: {
            title: `${cleanTitle}: ಪೋರ್ಟಲ್ ಭದ್ರತೆ`,
            prompt: `${cleanTitle} ಗೆ ಸಂಬಂಧಿಸಿದ ಆನ್‌ಲೈನ್ ಸೇವೆಗಳ ಸುರಕ್ಷಿತ ಪ್ರವೇಶಕ್ಕಾಗಿ ಫೋನ್‌ಗೆ ಬರುವ 6 ಅಂಕಿಯ ಕೋಡ್ ಅನ್ನು ____ ಎನ್ನಲಾಗುತ್ತದೆ.`,
            audioText: `${cleanTitle} ಗಾಗಿ ಫೋನ್‌ಗೆ ಬರುವ ಕೋಡ್ ಅನ್ನು ಏನೆಂದು ಕರೆಯುತ್ತಾರೆ?`,
            explanation: `ಒಟಿಪಿ (OTP - One Time Password) ನಿಮ್ಮ ಅಧಿಕೃತ ಗುರುತನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ದೃಢೀಕರಿಸುತ್ತದೆ.`,
          },
        },
      };
    }

    return {
      title: `${cleanTitle}: Key Term`,
      topic: 'General',
      type: 'fill_blank',
      prompt: `When working with ${cleanTitle}, the foundational element that defines its core behavior is called a ____.`,
      audioText: `When working with ${cleanTitle}, what is the foundational element that defines its core behavior?`,
      options: [],
      answer: 'concept|element|type',
      explanation: `Mastering the definition and usage of ${cleanTitle} helps solve practical challenges effectively.`,
      xp: 10,
      fields: [],
      translations: {
        hi: {
          title: `${cleanTitle}: मुख्य शब्द`,
          prompt: `${cleanTitle} के साथ काम करते समय, इसके मूल व्यवहार को परिभाषित करने वाले तत्व को ____ कहा जाता है।`,
          audioText: `${cleanTitle} के साथ काम करते समय इसके मूल व्यवहार को क्या कहते हैं?`,
          explanation: `${cleanTitle} के बुनियादी नियमों को समझने से विषय पर पकड़ मजबूत होती है।`,
        },
        kn: {
          title: `${cleanTitle}: ಪ್ರಮುಖ ಪದ`,
          prompt: `${cleanTitle} ನೊಂದಿಗೆ ಕೆಲಸ ಮಾಡುವಾಗ, ಅದರ ಮೂಲ ನಡವಳಿಕೆಯನ್ನು ವ್ಯಾಖ್ಯಾನಿಸುವ ಅಂಶವನ್ನು ____ ಎಂದು ಕರೆಯಲಾಗುತ್ತದೆ.`,
          audioText: `${cleanTitle} ನ ಮೂಲ ನಡವಳಿಕೆಯನ್ನು ಏನೆಂದು ಕರೆಯುತ್ತಾರೆ?`,
          explanation: `${cleanTitle} ನ ಮೂಲ ನಿಯಮಗಳನ್ನು ಕಲಿಯುವುದು ಪ್ರಾಯೋಗಿಕ ಕೌಶಲ್ಯವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ.`,
        },
      },
    };
  }

  if (selectedType === 'mock_form') {
    return {
      title: `${cleanTitle}: Application Details`,
      topic: detectedTopic,
      type: 'mock_form',
      prompt: `Fill out the mock government form below for ${cleanTitle}. Check each label and enter the details.`,
      audioText: `Fill out the mock government form below for ${cleanTitle}. Check each label and enter the details.`,
      options: [],
      answer: '',
      explanation: `Carefully reviewing your personal details prevents application rejection during ${cleanTitle} processing.`,
      xp: 15,
      fields: [
        { label: 'Applicant Full Name', answer: 'Ramesh Kumar|Ramesh', hint: 'Type your full name as per Aadhaar', placeholder: 'e.g. Ramesh Kumar' },
        { label: '12-Digit Aadhaar Number', answer: '123456789012|1234 5678 9012', hint: 'Enter the 12 digit Aadhaar number', placeholder: 'XXXX-XXXX-XXXX' },
        { label: 'Registered Mobile Number', answer: '9876543210', hint: 'Enter your 10 digit active phone number', placeholder: '98XXXXXXXX' },
      ],
      translations: {
        hi: {
          title: `${cleanTitle}: आवेदन प्रपत्र`,
          prompt: `${cleanTitle} के लिए नीचे दिए गए फॉर्म के विवरण भरें।`,
          audioText: `${cleanTitle} के लिए नीचे दिए गए फॉर्म के विवरण भरें।`,
          explanation: `फॉर्म में सही विवरण भरने से आवेदन अस्वीकार होने से बचता है।`,
        },
        kn: {
          title: `${cleanTitle}: ಅರ್ಜಿ ನಮೂನೆ`,
          prompt: `${cleanTitle} ಗಾಗಿ ಕೆಳಗಿನ ಮಾದರಿ ಫಾರ್ಮ್ ಅನ್ನು ಭರ್ತಿ ಮಾಡಿ.`,
          audioText: `${cleanTitle} ಗಾಗಿ ಕೆಳಗಿನ ಮಾದರಿ ಫಾರ್ಮ್ ಅನ್ನು ಭರ್ತಿ ಮಾಡಿ.`,
          explanation: `ಸರಿಯಾದ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡುವುದರಿಂದ ಅರ್ಜಿ ತಿರಸ್ಕೃತವಾಗುವುದನ್ನು ತಪ್ಪಿಸಬಹುದು.`,
        },
      },
    };
  }

  // Fallback for essay
  return {
    title: `${cleanTitle}: Procedure Overview`,
    topic: detectedTopic,
    type: 'essay',
    prompt: `Explain in 2-3 sentences the main steps or documents required for a citizen applying for ${cleanTitle}. What precautions should they take?`,
    audioText: `Explain in 2-3 sentences the main steps or documents required for a citizen applying for ${cleanTitle}. What precautions should they take?`,
    options: [],
    answer: '',
    explanation: 'Teacher will review your response and provide personalized feedback on civic awareness.',
    xp: 20,
    fields: [],
    translations: {
      hi: {
        title: `${cleanTitle}: प्रक्रिया विवरण`,
        prompt: `${cleanTitle} के लिए आवेदन करते समय मुख्य चरणों या आवश्यक दस्तावेजों को 2-3 वाक्यों में समझाएं।`,
        audioText: `${cleanTitle} के लिए आवेदन करते समय मुख्य चरणों या आवश्यक दस्तावेजों को 2-3 वाक्यों में समझाएं।`,
        explanation: 'शिक्षक आपकी प्रतिक्रिया की समीक्षा करेंगे और मार्गदर्शन देंगे।',
      },
      kn: {
        title: `${cleanTitle}: ಪ್ರಕ್ರಿಯೆ ವಿವರ`,
        prompt: `${cleanTitle} ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವಾಗ ಮುಖ್ಯ ಹಂತಗಳು ಅಥವಾ ಅಗತ್ಯ ದಾಖಲೆಗಳನ್ನು 2-3 ವಾಕ್ಯಗಳಲ್ಲಿ ವಿವರಿಸಿ.`,
        audioText: `${cleanTitle} ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವಾಗ ಮುಖ್ಯ ಹಂತಗಳು ಅಥವಾ ಅಗತ್ಯ ದಾಖಲೆಗಳನ್ನು 2-3 ವಾಕ್ಯಗಳಲ್ಲಿ ವಿವರಿಸಿ.`,
        explanation: 'ಶಿಕ್ಷಕರು ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಪರಿಶೀಲಿಸಿ ಸಲಹೆ ನೀಡುತ್ತಾರೆ.',
      },
    },
  };
}

function sanitizeDraft(raw, fallbackTopic, preferredType) {
  if (!raw || typeof raw !== 'object') {
    return generateOfflineDraft(fallbackTopic, preferredType);
  }

  const title = String(raw.title || fallbackTopic || 'Civic Lesson').trim().slice(0, 80);
  const topic = VALID_TOPICS.includes(raw.topic) ? raw.topic : 'General';
  let type = VALID_TYPES.includes(raw.type) ? raw.type : (preferredType && VALID_TYPES.includes(preferredType) ? preferredType : 'audio_mcq');
  const prompt = String(raw.prompt || '').trim();
  const audioText = String(raw.audioText || prompt).trim();
  const explanation = String(raw.explanation || '').trim();
  const xp = Math.min(Math.max(Number(raw.xp) || 10, 5), 50);

  if (!prompt) {
    return generateOfflineDraft(fallbackTopic, preferredType);
  }

  let options = [];
  let answer = String(raw.answer || '').trim();

  if (type === 'audio_mcq') {
    options = Array.isArray(raw.options) ? raw.options.map((o) => String(o).trim()).filter(Boolean) : [];
    if (options.length < 2) {
      options = ['Option A', 'Option B', 'Option C', 'Option D'];
      answer = 'Option A';
    }
    if (!options.includes(answer)) {
      answer = options[0];
    }
  } else if (type === 'fill_blank') {
    options = [];
    if (!answer) answer = 'correct answer';
  } else {
    options = [];
  }

  let fields = [];
  if (type === 'mock_form' && Array.isArray(raw.fields) && raw.fields.length >= 2) {
    fields = raw.fields.map((f) => ({
      label: String(f.label || 'Field').trim(),
      answer: String(f.answer || 'Answer').trim(),
      hint: String(f.hint || '').trim(),
      placeholder: String(f.placeholder || '').trim(),
    }));
  } else if (type === 'mock_form') {
    // If mock_form fields were insufficient, fall back to offline draft
    return generateOfflineDraft(fallbackTopic, 'mock_form');
  }

  const translations = {};
  if (raw.translations && typeof raw.translations === 'object') {
    for (const code of ['hi', 'kn']) {
      const tr = raw.translations[code];
      if (tr && typeof tr === 'object') {
        translations[code] = {
          title: String(tr.title || '').trim(),
          prompt: String(tr.prompt || '').trim(),
          audioText: String(tr.audioText || tr.prompt || '').trim(),
          explanation: String(tr.explanation || '').trim(),
          options: Array.isArray(tr.options) ? tr.options.map((o) => String(o).trim()) : [],
        };
      }
    }
  }

  return {
    title,
    topic,
    type,
    prompt,
    audioText,
    audioUrl: '',
    options,
    answer,
    explanation,
    xp,
    fields,
    translations,
  };
}

function resolveApiKey(keyName) {
  if (process.env[keyName]) return process.env[keyName];
  try {
    const candidates = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), 'server', '.env'),
      'c:/Users/ROHAN/Downloads/dulingo/dulingo/server/.env',
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const txt = fs.readFileSync(p, 'utf8');
        const m = txt.match(new RegExp(`^${keyName}=(.*)$`, 'm'));
        if (m && m[1].trim()) {
          process.env[keyName] = m[1].trim();
          return process.env[keyName];
        }
      }
    }
  } catch {}
  return '';
}

/**
 * Main export: generates a draft task via Gemini, OpenAI, or smart offline knowledge base.
 */
export async function draftTaskWithAI({ topic, taskType = 'auto' }) {
  if (!topic || !topic.trim()) {
    throw new Error('Please enter a topic to draft a task.');
  }

  const geminiKey = resolveApiKey('GEMINI_API_KEY') || resolveApiKey('GOOGLE_API_KEY');
  const openAiKey = resolveApiKey('OPENAI_API_KEY');

  // 1. Try Gemini API if key is present
  if (geminiKey) {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-1.5-flash'];
    const userPrompt = `Create an educational task specifically on the topic: "${topic.trim()}". ${
      taskType && taskType !== 'auto' ? `Task type must be: ${taskType}.` : 'Choose the best task type.'
    }`;

    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            return sanitizeDraft(parsed, topic, taskType);
          }
        } else if (res.status !== 404) {
          console.warn(`Gemini (${model}) failed with status:`, res.status);
          break; // Don't retry other models if auth or rate limit error
        }
      } catch (err) {
        console.warn(`Gemini (${model}) error:`, err.message);
      }
    }
  }

  // 2. Try OpenAI API if key is present
  if (openAiKey) {
    try {
      const userPrompt = `Create an educational task specifically on the topic: "${topic.trim()}". ${
        taskType && taskType !== 'auto' ? `Task type must be: ${taskType}.` : 'Choose the best task type.'
      }`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return sanitizeDraft(parsed, topic, taskType);
        }
      } else {
        console.warn('OpenAI API call failed with status:', res.status);
      }
    } catch (err) {
      console.warn('OpenAI drafting error (falling back):', err.message);
    }
  }

  // 3. Smart offline knowledge fallback
  return generateOfflineDraft(topic, taskType);
}
