import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Award, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store';
import { workersRepo } from '../../services/db';

interface Question {
  id: number;
  question: string;
  questionHindi: string;
  options: string[];
  optionsHindi?: string[];
  correctIndex: number;
  explanation: string;
}

export const SkillQuizModal: React.FC = () => {
  const { currentWorker, closeModal, refreshUserData } = useAppStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const targetSkill = currentWorker?.primarySkill || 'Electrician';

  useEffect(() => {
    async function loadQuiz() {
      setLoading(true);
      try {
        const res = await fetch('/api/gemini/skill-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillName: targetSkill })
        });
        const data = await res.json();
        if (data && data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        }
      } catch (err) {
        console.warn('Fallback quiz loaded:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [targetSkill]);

  if (!currentWorker) return null;

  const currentQ = questions[currentIndex];
  const isSelected = selectedAnswers[currentIndex] !== undefined;

  const handleSelectOption = (idx: number) => {
    if (isSelected) return; // already answered
    const nextAnswers = [...selectedAnswers];
    nextAnswers[currentIndex] = idx;
    setSelectedAnswers(nextAnswers);

    if (idx === currentQ.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsCompleted(true);
    const passed = score >= 3; // 60%+ passes

    if (passed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // tolerate
      }

      // Add badge to worker
      const updated = {
        ...currentWorker,
        verifiedSkillBadges: Array.from(
          new Set([...currentWorker.verifiedSkillBadges, 'SkillBridge Verified Pro', `${targetSkill} Certified`])
        )
      };
      workersRepo.save(updated);
      refreshUserData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-fadeIn">
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {targetSkill} Trade Verification Quiz
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pass 5 multiple-choice questions to earn the Verified Skill Pro Badge
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm font-semibold text-slate-500">
            Generating trade verification questions...
          </div>
        ) : isCompleted ? (
          /* Results Screen */
          <div className="text-center space-y-4 py-2">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl ${
                score >= 3 ? 'bg-emerald-500 animate-bounce' : 'bg-amber-500'
              }`}
            >
              {score >= 3 ? <Sparkles className="h-10 w-10" /> : <HelpCircle className="h-10 w-10" />}
            </div>

            <div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                {score >= 3 ? 'Congratulations! Quiz Passed!' : 'Good Effort!'}
              </h4>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                You scored {score} out of {questions.length} ({Math.round((score / questions.length) * 100)}%)
              </p>
            </div>

            {score >= 3 ? (
              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-left">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>"Verified Skill Pro" Badge Awarded</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  Your profile match score algorithm will now feature top verified placement for employers in your city.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 text-left">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-sm">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span>Passing score is 3/5</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  You can retake this IVR trade assessment at any time to upgrade your rank.
                </p>
              </div>
            )}

            <button
              onClick={closeModal}
              className="w-full rounded-2xl bg-orange-600 py-3.5 text-sm font-black text-white shadow-lg hover:bg-orange-500 transition"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          /* Active Question */
          currentQ && (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>Score: {score}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div
                  className="h-full bg-orange-600 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <div className="rounded-2xl bg-amber-50/60 p-3.5 border border-orange-200/50 dark:bg-slate-800/60 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.question}
                </p>
                {currentQ.questionHindi && (
                  <p className="text-xs font-medium text-orange-900 dark:text-orange-300 mt-1">
                    {currentQ.questionHindi}
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQ.options.map((opt, oIdx) => {
                  const isAnswered = selectedAnswers[currentIndex] !== undefined;
                  const isUserPick = selectedAnswers[currentIndex] === oIdx;
                  const isCorrect = currentQ.correctIndex === oIdx;

                  let btnStyle = 'border-slate-200 bg-white hover:border-orange-400 dark:border-slate-700 dark:bg-slate-800';
                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold dark:bg-emerald-950/60 dark:text-emerald-200';
                    } else if (isUserPick) {
                      btnStyle = 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-200';
                    } else {
                      btnStyle = 'opacity-40 border-slate-200';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left text-xs font-semibold transition ${btnStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isAnswered && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation note when answered */}
              {isSelected && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white">Explanation: </span>
                  {currentQ.explanation}
                </div>
              )}

              {/* Next Button */}
              {isSelected && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-black text-white shadow-lg hover:bg-orange-500 transition"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Quiz Result'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};
