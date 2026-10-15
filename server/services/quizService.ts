import { db } from '../config/database';
import { logAuditEvent } from '../middleware/logger';

export interface QuizQuestion {
  id: number;
  question: string;
  questionHindi: string;
  options: string[];
  optionsHindi: string[];
  correctIndex: number;
  explanation: string;
}

const STATIC_QUIZ_BANK: Record<string, QuizQuestion[]> = {
  electrician: [
    {
      id: 1,
      question: 'In domestic AC electrical wiring in India, what color is standard for protective earthing?',
      questionHindi: 'भारतीय घरेलू वायरिंग में अर्थिंग (ग्राउंड) तार का मानक रंग क्या होता है?',
      options: ['Green or Green-Yellow', 'Red', 'Black', 'Blue'],
      optionsHindi: ['हरा या हरा-पीला', 'लाल', 'काला', 'नीला'],
      correctIndex: 0,
      explanation: 'As per IS 732, green or green-yellow is strictly reserved for earthing.'
    },
    {
      id: 2,
      question: 'What is the standard rating of an MCB used for residential power plugs (AC/Geyser)?',
      questionHindi: 'पावर सॉकेट (AC/गीजर) के लिए मानक MCB रेटिंग क्या होती है?',
      options: ['16A / 20A', '6A', '32A', '63A'],
      optionsHindi: ['16A / 20A', '6A', '32A', '63A'],
      correctIndex: 0,
      explanation: 'Heavy inductive residential loads require 16A or 20A type C/B MCBs.'
    },
    {
      id: 3,
      question: 'Which instrument verifies line voltage presence safely without touching copper?',
      questionHindi: 'तांबे को छुए बिना वोल्टेज की सुरक्षित जांच किस यंत्र से की जाती है?',
      options: ['Neon Phase Tester / Multimeter', 'Combination Pliers', 'Hammer', 'Wire Stripper'],
      optionsHindi: ['नियॉन फेज टेस्टर / मल्टीमीटर', 'प्लास', 'हथौड़ी', 'वायर स्ट्रिपर'],
      correctIndex: 0,
      explanation: 'Neon phase tester or non-contact voltage detector ensures the circuit is safe.'
    },
    {
      id: 4,
      question: 'What happens if a blown fuse is replaced with a thick bare copper wire?',
      questionHindi: 'उड़े हुए फ्यूज में मोटा तांबे का तार लगाने से क्या खतरा होता है?',
      options: ['Severe fire hazard because it will not melt on short circuit', 'Voltage drops to zero', 'Electricity is saved', 'Bulbs shine brighter'],
      optionsHindi: ['गंभीर आग का खतरा क्योंकि यह शॉर्ट सर्किट पर पिघलेगा नहीं', 'वोल्टेज शून्य हो जाएगा', 'बिजली बचेगी', 'बल्ब तेज जलेगा'],
      correctIndex: 0,
      explanation: 'Thick wire bypasses short circuit protection, leading to overheated cables and fires.'
    },
    {
      id: 5,
      question: 'What critical protection does a 30mA RCCB provide to humans?',
      questionHindi: '30mA RCCB इंसान को किस खतरे से बचाता है?',
      options: ['Lethal electric shock and earth leakage current', 'Low voltage fluctuations', 'Lightening strike', 'High electricity bills'],
      optionsHindi: ['जानलेवा करंट के झटके और अर्थ लीकेज से', 'कम वोल्टेज से', 'आकाशीय बिजली से', 'ज्यादा बिल से'],
      correctIndex: 0,
      explanation: 'A 30mA RCCB detects current escaping through a human body and trips in <40ms.'
    }
  ],
  plumber: [
    {
      id: 1,
      question: 'Which tape is used on threaded pipe joints to prevent water leaks?',
      questionHindi: 'पानी का रिसाव रोकने के लिए थ्रेडेड पाइप जोड़ों पर कौन सा टेप लगाया जाता है?',
      options: ['Teflon (PTFE) Tape', 'Duct Tape', 'Insulation Tape', 'Masking Tape'],
      optionsHindi: ['टेफ्लॉन (PTFE) टेप', 'डक्ट टेप', 'इंसुलेशन टेप', 'मास्किंग टेप'],
      correctIndex: 0,
      explanation: 'PTFE Teflon tape seals threads against pressurized water leakage.'
    },
    {
      id: 2,
      question: 'What is the purpose of a P-trap underneath a sink or toilet?',
      questionHindi: 'सिंक या टॉयलेट के नीचे P-ट्रैप का मुख्य उद्देश्य क्या होता है?',
      options: ['To trap sewer gases from entering the room', 'To increase water flow', 'To filter dirt', 'To support pipe weight'],
      optionsHindi: ['सीवर की जहरीली गैसों को कमरे में आने से रोकना', 'पानी का बहाव तेज करना', 'कचरा छानना', 'पाइप का वजन संभालना'],
      correctIndex: 0,
      explanation: 'A water barrier inside the curve stops noxious sewer odors from backing up.'
    },
    {
      id: 3,
      question: 'Which pipe material is standard for hot water supply in modern Indian homes?',
      questionHindi: 'गर्म पानी के लिए आधुनिक घरों में किस पाइप का उपयोग किया जाता है?',
      options: ['CPVC or PPR', 'PVC', 'Lead', 'Iron'],
      optionsHindi: ['CPVC या PPR', 'साधारण PVC', 'सीसा', 'कच्चा लोहा'],
      correctIndex: 0,
      explanation: 'Chlorinated PVC (CPVC) withstands temperatures up to 93°C.'
    },
    {
      id: 4,
      question: 'What is the standard slope for residential soil/drainage pipes?',
      questionHindi: 'ड्रेनेज पाइप के लिए मानक ढलान (स्लोप) क्या होता है?',
      options: ['1:40 to 1:50 (approx 2%)', '1:1 (45 degrees)', 'Completely flat (0%)', '1:200'],
      optionsHindi: ['1:40 से 1:50 (लगभग 2%)', '1:1 (45 डिग्री)', 'बिल्कुल सीधा (0%)', '1:200'],
      correctIndex: 0,
      explanation: 'A 1:50 slope allows solids and liquids to flow together without clogging.'
    },
    {
      id: 5,
      question: 'Which valve prevents backflow of water into the municipal supply line?',
      questionHindi: 'पानी को वापस उल्टी दिशा में बहने से कौन सा वाल्व रोकता है?',
      options: ['Non-Return Valve (NRV / Check Valve)', 'Gate Valve', 'Ball Valve', 'Float Valve'],
      optionsHindi: ['नॉन-रिटर्न वाल्व (NRV / चेक वाल्व)', 'गेट वाल्व', 'बॉल वाल्व', 'फ्लोट वाल्व'],
      correctIndex: 0,
      explanation: 'An NRV allows unidirectional flow and stops reverse suction.'
    }
  ]
};

export function getQuizForSkill(skill: string): QuizQuestion[] {
  const norm = skill.toLowerCase();
  if (norm.includes('plumb')) return STATIC_QUIZ_BANK.plumber;
  return STATIC_QUIZ_BANK.electrician;
}

export function submitQuizAnswers(params: {
  workerId: string;
  skill: string;
  answers: { questionId: number; selectedIndex: number }[];
}): { score: number; passed: boolean; badgeAwarded?: string; message: string } {
  const questions = getQuizForSkill(params.skill);
  let correctCount = 0;

  for (const q of questions) {
    const userAns = params.answers.find(a => a.questionId === q.id);
    if (userAns && userAns.selectedIndex === q.correctIndex) {
      correctCount++;
    }
  }

  const scorePercent = Math.round((correctCount / questions.length) * 100);
  const passed = scorePercent >= 60; // 3/5 or more
  const badgeName = `${params.skill} Pro Verified`;

  db.transaction(() => {
    // Record attempt
    db.run(`
      INSERT INTO quiz_attempts (id, worker_id, skill, score, passed, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'));
    `, [`quiz-${Date.now()}`, params.workerId, params.skill, scorePercent, passed ? 1 : 0]);

    if (passed) {
      const worker = db.queryOne<{ verified_skill_badges: string }>(
        'SELECT verified_skill_badges FROM workers WHERE id = ?;',
        [params.workerId]
      );

      if (worker) {
        const badges: string[] = JSON.parse(worker.verified_skill_badges || '[]');
        if (!badges.includes(badgeName)) {
          badges.push(badgeName);
          db.run(`
            UPDATE workers
            SET verified_skill_badges = ?, reputation_score = MIN(5.0, reputation_score + 0.25), updated_at = datetime('now')
            WHERE id = ?;
          `, [JSON.stringify(badges), params.workerId]);
        }
      }
    }
  });

  logAuditEvent(params.workerId, 'worker', 'QUIZ_SUBMITTED', 'quiz', params.skill, undefined, {
    scorePercent,
    passed
  });

  return {
    score: scorePercent,
    passed,
    badgeAwarded: passed ? badgeName : undefined,
    message: passed
      ? `Congratulations! You passed with ${scorePercent}% and unlocked the '${badgeName}' badge.`
      : `You scored ${scorePercent}%. A minimum of 60% is required to pass. You may retry after reviewing trade standards.`
  };
}
