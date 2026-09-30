import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot } from '../../lib/firebase';
import { Quiz, QuizQuestion } from '../../types';
import { CLASS_SUBJECTS, ChapterItem, SubjectCurriculum } from '../../lib/quizCurriculum';
import { buildChapterQuizSession } from '../../lib/quizQuestionBank';
import {
  BookOpen,
  Sparkles,
  Award,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  ChevronRight,
  Layers,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface LearnQuizHubProps {
  earnedXP: number;
  onEarnXP: (xpToAdd: number) => void;
}

export const LearnQuizHub: React.FC<LearnQuizHubProps> = ({ earnedXP, onEarnXP }) => {
  const [selectedClass, setSelectedClass] = useState<'9' | '10' | '11' | '12'>('10');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('Mathematics');
  const [selectedChapter, setSelectedChapter] = useState<ChapterItem>(
    CLASS_SUBJECTS['10'][0].chapters[0]
  );
  const [questionCount, setQuestionCount] = useState<10 | 12 | 15>(12);
  const [sessionCount, setSessionCount] = useState<number>(1);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  // Firestore teacher-published quizzes
  const [teacherQuizzes, setTeacherQuizzes] = useState<Quiz[]>([]);

  // Active Quiz Session state
  const [activeQuiz, setActiveQuiz] = useState<{
    title: string;
    chapterLabel: string;
    questions: QuizQuestion[];
    index: number;
    score: number;
    answers: Array<{ chosen: number; correct: number }>;
  } | null>(null);
  const [timer, setTimer] = useState<number>(30);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [lastSessionXP, setLastSessionXP] = useState<number>(0);

  // Sync available subjects & chapters when class changes
  const subjectsForClass: SubjectCurriculum[] = CLASS_SUBJECTS[selectedClass] || CLASS_SUBJECTS['10'];
  const currentSubject: SubjectCurriculum =
    subjectsForClass.find((s) => s.id === selectedSubjectId) || subjectsForClass[0];

  useEffect(() => {
    const validSub = subjectsForClass.find((s) => s.id === selectedSubjectId) || subjectsForClass[0];
    if (validSub.id !== selectedSubjectId) {
      setSelectedSubjectId(validSub.id);
    }
    if (validSub.chapters.length > 0) {
      setSelectedChapter(validSub.chapters[0]);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (currentSubject && currentSubject.chapters.length > 0) {
      const exists = currentSubject.chapters.find((c) => c.id === selectedChapter?.id);
      if (!exists) {
        setSelectedChapter(currentSubject.chapters[0]);
      }
    }
  }, [selectedSubjectId, currentSubject]);

  // Listen to Teacher-Published Quizzes in Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'quizzes'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Quiz))
          .filter((q) => q.status === 'published');
        setTeacherQuizzes(list);
      },
      () => {}
    );
    return () => unsub();
  }, []);

  // Countdown timer per question
  useEffect(() => {
    let interval: any;
    if (activeQuiz && !quizFinished && selectedOption === null) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            handleSelectOption(-1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuiz, quizFinished, selectedOption]);

  // Start a chapter-wise quiz session with 10 to 15 varying questions
  const startChapterQuiz = async (chapterOverride?: ChapterItem, useFreshAI: boolean = false) => {
    const chapterToUse = chapterOverride || selectedChapter || currentSubject.chapters[0];
    setSelectedChapter(chapterToUse);

    const chapterLabel = `अध्याय ${chapterToUse.number}: ${chapterToUse.titleHindi} (${chapterToUse.titleEnglish})`;
    let finalQuestions: QuizQuestion[] = [];

    if (useFreshAI) {
      setLoadingAI(true);
      try {
        const res = await fetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classLevel: selectedClass,
            subject: `${currentSubject.nameEnglish} (${currentSubject.nameHindi})`,
            topic: `${chapterToUse.titleHindi} - ${chapterToUse.titleEnglish} (Session #${sessionCount})`,
            questionCount,
            difficulty: 'medium',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.questions) && data.questions.length >= 5) {
            finalQuestions = data.questions;
          }
        }
      } catch {
        // Fallback to local varied generator below
      } finally {
        setLoadingAI(false);
      }
    }

    // Fill or build up to exact questionCount (10 to 15) using the varying chapter bank
    const bankQuestions = buildChapterQuizSession(
      selectedClass,
      currentSubject.id,
      chapterToUse.titleHindi,
      questionCount
    );

    if (finalQuestions.length < questionCount) {
      const needed = questionCount - finalQuestions.length;
      finalQuestions = [...finalQuestions, ...bankQuestions.slice(0, needed)];
    } else {
      finalQuestions = finalQuestions.slice(0, questionCount);
    }

    setSessionCount((prev) => prev + 1);
    setActiveQuiz({
      title: `Class ${selectedClass}th • ${currentSubject.nameHindi} (${currentSubject.nameEnglish})`,
      chapterLabel,
      questions: finalQuestions,
      index: 0,
      score: 0,
      answers: [],
    });
    setTimer(30);
    setSelectedOption(null);
    setQuizFinished(false);
  };

  // Start a teacher-published quiz from Firestore (padded to 10-15 questions if shorter)
  const startTeacherPublishedQuiz = (quiz: Quiz) => {
    const baseQs = Array.isArray(quiz.questions) ? [...quiz.questions] : [];
    const targetLen = Math.max(10, Math.min(15, Math.max(baseQs.length, questionCount)));
    let combined = [...baseQs];
    if (combined.length < targetLen) {
      const extra = buildChapterQuizSession(quiz.class, quiz.subject, quiz.title, targetLen);
      combined = [...combined, ...extra.slice(0, targetLen - combined.length)];
    }
    setActiveQuiz({
      title: `Class ${quiz.class}th • ${quiz.subject}`,
      chapterLabel: `${quiz.title} (By ${quiz.authorName || 'Teacher'})`,
      questions: combined.slice(0, targetLen),
      index: 0,
      score: 0,
      answers: [],
    });
    setTimer(30);
    setSelectedOption(null);
    setQuizFinished(false);
  };

  const handleSelectOption = (optIdx: number) => {
    if (!activeQuiz || selectedOption !== null) return;
    setSelectedOption(optIdx);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz || selectedOption === null) return;
    const currentQ = activeQuiz.questions[activeQuiz.index];
    const isCorrect = selectedOption === currentQ.correctIndex;
    const newScore = isCorrect ? activeQuiz.score + 1 : activeQuiz.score;
    const updatedAnswers = [
      ...activeQuiz.answers,
      { chosen: selectedOption, correct: currentQ.correctIndex },
    ];

    if (activeQuiz.index + 1 < activeQuiz.questions.length) {
      setActiveQuiz({
        ...activeQuiz,
        index: activeQuiz.index + 1,
        score: newScore,
        answers: updatedAnswers,
      });
      setSelectedOption(null);
      setTimer(30);
    } else {
      const xpGained = newScore * 15 + 25;
      setLastSessionXP(xpGained);
      onEarnXP(xpGained);
      setActiveQuiz({
        ...activeQuiz,
        score: newScore,
        answers: updatedAnswers,
      });
      setQuizFinished(true);
    }
  };

  const matchingTeacherQuizzes = teacherQuizzes.filter(
    (q) => q.class === selectedClass && q.subject.toLowerCase() === currentSubject.id.toLowerCase()
  );

  const userLevel = Math.floor(earnedXP / 150) + 1;

  return (
    <main className="wrap pt-28 pb-20 space-y-8 animate-fadeIn">
      {/* Top XP & Daily Practice Header Card */}
      <div className="glass p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 text-white font-extrabold flex items-center justify-center text-base shadow-lg">
              Lv {userLevel}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                GHSS Ahamdpur Khaigaon • Exam Practice Portal
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                कक्षावार, विषयवार एवं अध्यायवार दैनिक क्विज अभ्यास
              </h2>
              <p className="text-xs text-slate-400">
                Total Earned: <strong className="text-cyan-300">{earnedXP} XP</strong> • Practice 10 to 15 varying questions per chapter daily
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              10–15 Questions / Chapter
            </span>
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${Math.min(100, (earnedXP % 150) * (100 / 150) + 18)}%` }}
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* SELECTION VIEW: CLASS -> SUBJECT -> CHAPTER               */}
      {/* ========================================================= */}
      {!activeQuiz ? (
        <div className="space-y-6">
          {/* STEP 1: EASY CLASS SELECTOR */}
          <div className="glass p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  Step 1 • Select Class
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  अपनी कक्षा चुनें (Choose Your Class)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                Selected: Class {selectedClass}th
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  { id: '9', title: 'Class 9th', hindi: 'कक्षा 9वीं', tag: 'High School' },
                  { id: '10', title: 'Class 10th', hindi: 'कक्षा 10वीं (बोर्ड)', tag: 'MPBSE Board' },
                  { id: '11', title: 'Class 11th', hindi: 'कक्षा 11वीं', tag: 'Science & Arts' },
                  { id: '12', title: 'Class 12th', hindi: 'कक्षा 12वीं (बोर्ड)', tag: 'Higher Secondary' },
                ] as const
              ).map((cls) => {
                const isSelected = selectedClass === cls.id;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedClass(cls.id)}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-1 ${
                      isSelected
                        ? 'bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border-cyan-400 text-white shadow-lg shadow-cyan-950/40'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base sm:text-lg font-extrabold">{cls.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isSelected
                            ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {cls.tag}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium">{cls.hindi}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: EASY SUBJECT SELECTOR */}
          <div className="glass p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                  Step 2 • Select Subject (Class {selectedClass}th)
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  विषय चुनें (Select Subject for Practice)
                </h3>
              </div>
              <span className="text-xs text-cyan-300 font-semibold">
                {currentSubject.icon} {currentSubject.nameHindi} ({currentSubject.nameEnglish})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {subjectsForClass.map((sub) => {
                const isSelected = currentSubject.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-400 text-white shadow-md'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="text-2xl shrink-0">{sub.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold truncate">{sub.nameHindi}</div>
                      <div className="text-[11px] text-slate-400 truncate">{sub.nameEnglish}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 border border-slate-800">
                          {sub.chapters.length} Chapters
                        </span>
                        {sub.stream && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-950/80 text-purple-300">
                            {sub.stream}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: CHAPTER-WISE SELECTION & QUESTION COUNT (10 TO 15) */}
          <div className="glass p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Step 3 • Select Chapter & Question Count
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {currentSubject.nameHindi} ({currentSubject.nameEnglish}) — अध्यायवार अभ्यास
                </h3>
                <p className="text-xs text-slate-400">
                  प्रत्येक सत्र में नए एवं भिन्न प्रश्न (Varying questions every session for daily exam prep)
                </p>
              </div>

              {/* Question Count Selector (10, 12, or 15 Questions) */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
                <span className="text-[11px] text-slate-400 px-2 font-medium">Questions:</span>
                {([10, 12, 15] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      questionCount === cnt
                        ? 'bg-cyan-500 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Chapters List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {currentSubject.chapters.map((ch) => {
                const isSelected = selectedChapter?.id === ch.id;
                return (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChapter(ch)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-cyan-500 text-white'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          Ch {ch.number}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                            {ch.titleHindi}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">{ch.titleEnglish}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 text-cyan-300 border border-slate-800 shrink-0">
                        {questionCount} Questions
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startChapterQuiz(ch, false);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
                      >
                        <span>Start Practice ({questionCount} Qs)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={loadingAI}
                        onClick={(e) => {
                          e.stopPropagation();
                          startChapterQuiz(ch, true);
                        }}
                        className="py-2 px-3 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                        title="Generate fresh AI questions for this chapter"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                        <span>{loadingAI && isSelected ? 'Generating...' : 'AI Fresh Set'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Teacher-Published Quizzes for this Class & Subject (if any) */}
            {matchingTeacherQuizzes.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>Teacher Published Quizzes for Class {selectedClass}th {currentSubject.nameEnglish}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchingTeacherQuizzes.map((tq) => (
                    <div
                      key={tq.id}
                      className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{tq.title}</div>
                        <div className="text-[11px] text-amber-200/80">
                          By {tq.authorName} • {Math.max(10, tq.questions?.length || 10)} Questions
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => startTeacherPublishedQuiz(tq)}
                        className="py-1.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shrink-0"
                      >
                        Start
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : quizFinished ? (
        /* ========================================================= */
        /* QUIZ RESULTS & DAILY PRACTICE SUMMARY                     */
        /* ========================================================= */
        <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <div className="text-4xl">🏆</div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {activeQuiz.title}
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white pt-1">
              {activeQuiz.chapterLabel}
            </h3>
            <p className="text-sm text-slate-300">
              You scored{' '}
              <strong className="text-cyan-400 text-base">
                {activeQuiz.score} / {activeQuiz.questions.length}
              </strong>{' '}
              ({Math.round((activeQuiz.score / activeQuiz.questions.length) * 100)}%)
            </p>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>+{lastSessionXP} XP Earned!</span>
            </div>
          </div>

          {/* Action Buttons: Practice Again with Varying Questions OR Change Chapter */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => startChapterQuiz(selectedChapter, false)}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Practice Again with New Questions (नए प्रश्न)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveQuiz(null)}
              className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition"
            >
              Change Class / Subject / Chapter
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* ACTIVE QUIZ PLAYER (10 TO 15 QUESTIONS PER CHAPTER)       */
        /* ========================================================= */
        <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 max-w-2xl mx-auto">
          {/* Top Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                {activeQuiz.title}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white">{activeQuiz.chapterLabel}</div>
            </div>
            <button
              type="button"
              onClick={() => setActiveQuiz(null)}
              className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Exit Quiz
            </button>
          </div>

          {/* Question Counter, Score & Timer */}
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold">
              Question {activeQuiz.index + 1} of {activeQuiz.questions.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 font-semibold">
                Score: {activeQuiz.score}
              </span>
              <span className="font-mono font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-700/40">
                ⏱ {timer}s
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
              style={{
                width: `${((activeQuiz.index + 1) / activeQuiz.questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Text */}
          <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
            {activeQuiz.questions[activeQuiz.index].questionText}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {activeQuiz.questions[activeQuiz.index].options.map((opt, i) => {
              const isChosen = selectedOption === i;
              const isCorrect = i === activeQuiz.questions[activeQuiz.index].correctIndex;

              let optClass =
                'bg-slate-950 border-slate-800 text-slate-200 hover:border-cyan-500/50';
              if (selectedOption !== null) {
                if (isCorrect) {
                  optClass = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold';
                } else if (isChosen) {
                  optClass = 'bg-rose-950/70 border-rose-500 text-rose-200';
                }
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={selectedOption !== null}
                  onClick={() => handleSelectOption(i)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition text-xs sm:text-sm flex items-center gap-3 ${optClass}`}
                >
                  <span className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center font-mono text-xs font-bold text-cyan-300 shrink-0 border border-slate-800">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation & Next Button */}
          {selectedOption !== null && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 animate-fadeIn">
              <div className="text-xs font-bold flex items-center gap-1.5">
                {selectedOption === activeQuiz.questions[activeQuiz.index].correctIndex ? (
                  <span className="text-emerald-400">✓ सही उत्तर! (Correct Answer)</span>
                ) : selectedOption === -1 ? (
                  <span className="text-amber-400">⏰ समय समाप्त! (Time Up)</span>
                ) : (
                  <span className="text-rose-400">✗ गलत उत्तर (Incorrect Answer)</span>
                )}
              </div>

              {activeQuiz.questions[activeQuiz.index].explanation && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-cyan-400">व्याख्या (Explanation): </strong>
                  {activeQuiz.questions[activeQuiz.index].explanation}
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition"
                >
                  <span>
                    {activeQuiz.index + 1 < activeQuiz.questions.length
                      ? 'Next Question (अगला प्रश्न)'
                      : 'View Results (परिणाम देखें)'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
};
