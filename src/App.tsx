import React, { useState, useEffect, useRef } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  signOut,
  collection,
  onSnapshot,
  query,
  where,
  User
} from './lib/firebase';
import { UserProfile, AdmissionApplication, Quiz, QuizQuestion, CampusFacility } from './types';
import { OFFICIAL_SCHOOL_INFO } from './lib/knowledgeBase';
import { AuthModal } from './components/auth/AuthModal';
import { AdmissionWizard } from './components/admission/AdmissionWizard';
import { AdmissionPrintView } from './components/admission/AdmissionPrintView';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { TeacherDashboard } from './components/dashboard/TeacherDashboard';
import { compressImageFile } from './components/dashboard/TeacherPhotoManager';
import { LearnQuizHub } from './components/quiz/LearnQuizHub';
import {
  Sparkles,
  Sun,
  Moon,
  Home,
  Users,
  User as UserIcon,
  ShieldCheck,
  Award,
  BookOpen,
  Calendar,
  Send,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Globe,
  Search,
  RefreshCw,
  Zap,
  Camera,
  FlaskConical,
  Monitor,
  Image as ImageIcon
} from 'lucide-react';

// Indian Special Days dictionary for "Aaj Ka Vishesh Din"
const SPECIAL_DAYS: Record<string, [string, string]> = {
  '01-12': ['National Youth Day', 'Celebrated on the birth anniversary of Swami Vivekananda (born 1863).'],
  '01-24': ['National Girl Child Day', 'Observed to raise awareness about rights, education and health of girls.'],
  '01-26': ['Republic Day', 'The Constitution of India came into effect on 26 January 1950.'],
  '01-30': ["Martyrs' Day", 'Remembers Mahatma Gandhi, who passed away on 30 January 1948.'],
  '02-28': ['National Science Day', 'Marks the discovery of the Raman Effect by Sir C. V. Raman in 1928.'],
  '03-08': ["International Women's Day", 'Celebrates the social, economic and cultural achievements of women.'],
  '03-14': ['Pi Day', 'Pi (π) is approximately 3.14 — ratio of circle circumference to diameter.'],
  '03-22': ['World Water Day', 'A reminder to save and protect fresh water resources.'],
  '04-07': ['World Health Day', 'Marks the founding of the World Health Organization (WHO) in 1948.'],
  '04-22': ['Earth Day', 'A day to protect the environment and our planet.'],
  '05-01': ['International Labour Day', 'Honours workers and their contribution to society.'],
  '05-11': ['National Technology Day', "Celebrates India's achievements in science and technology."],
  '06-05': ['World Environment Day', 'The main UN day for encouraging action to protect nature.'],
  '06-21': ['International Yoga Day', 'Yoga, born in India, promotes holistic health of body and mind.'],
  '07-01': ["National Doctors' Day", 'Honours doctors on the birth anniversary of Dr. B. C. Roy.'],
  '08-15': ['Independence Day', 'India became an independent nation on 15 August 1947.'],
  '08-29': ['National Sports Day', 'Birth anniversary of hockey legend Major Dhyan Chand.'],
  '09-05': ["Teachers' Day", 'Birth anniversary of Dr. Sarvepalli Radhakrishnan, honouring all teachers.'],
  '09-08': ['International Literacy Day', 'Highlights the importance of reading and literacy for all.'],
  '09-14': ['Hindi Diwas', 'Hindi was adopted as the official language of the Union on 14 September 1949.'],
  '09-15': ["Engineers' Day", 'Birth anniversary of Bharat Ratna Sir M. Visvesvaraya.'],
  '09-29': ['World Heart Day', 'Promotes awareness about cardiovascular health and healthy living.'],
  '10-02': ['Gandhi Jayanti', 'Birth anniversary of Mahatma Gandhi, Father of the Nation.'],
  '10-15': ["World Students' Day", 'Birth anniversary of Dr. A. P. J. Abdul Kalam.'],
  '10-31': ['National Unity Day', 'Birth anniversary of Sardar Vallabhbhai Patel.'],
  '11-14': ["Children's Day", 'Birth anniversary of Pandit Jawaharlal Nehru.'],
  '11-26': ['Constitution Day', 'The Constitution of India was adopted on 26 November 1949.'],
  '12-10': ['Human Rights Day', 'Universal Declaration of Human Rights adopted in 1948.'],
};

// Fallback Quiz Bank for standard practice
const FALLBACK_QUIZZES: Record<string, QuizQuestion[]> = {
  Mathematics: [
    { questionText: 'What is (a + b)² equal to?', options: ['a² + b²', 'a² + 2ab + b²', 'a² − 2ab + b²', '2a + 2b'], correctIndex: 1 },
    { questionText: 'The sum of angles of a triangle is:', options: ['90°', '180°', '270°', '360°'], correctIndex: 1 },
    { questionText: '√144 = ?', options: ['10', '11', '12', '14'], correctIndex: 2 },
    { questionText: 'Area of a circle of radius r is:', options: ['2πr', 'πr²', 'πr', '2πr²'], correctIndex: 1 },
  ],
  Science: [
    { questionText: 'SI unit of force is:', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correctIndex: 1 },
    { questionText: 'Chemical symbol of sodium is:', options: ['So', 'Na', 'S', 'N'], correctIndex: 1 },
    { questionText: 'The powerhouse of the cell is:', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], correctIndex: 2 },
    { questionText: 'Speed of light is approximately:', options: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '3 × 10⁵ m/s'], correctIndex: 1 },
  ],
  English: [
    { questionText: 'Plural of "child" is:', options: ['childs', 'children', 'childrens', 'childes'], correctIndex: 1 },
    { questionText: 'Synonym of "happy":', options: ['sad', 'joyful', 'angry', 'tired'], correctIndex: 1 },
    { questionText: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], correctIndex: 1 },
  ],
  'General Knowledge': [
    { questionText: 'Capital of India is:', options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'], correctIndex: 1 },
    { questionText: 'National animal of India is:', options: ['Lion', 'Tiger', 'Elephant', 'Peacock'], correctIndex: 1 },
    { questionText: 'Capital of Madhya Pradesh is:', options: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior'], correctIndex: 1 },
  ],
};

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('ghss_theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Current view: 'home' | 'learn' | 'community' | 'faculty' | 'profile'
  const [currentView, setCurrentView] = useState<'home' | 'learn' | 'community' | 'faculty' | 'profile'>('home');

  // Local school asset status (for /logo.jpg and /school.jpg in /public)
  const [assetStatus, setAssetStatus] = useState<{ hasLogo: boolean; hasSchool: boolean }>({
    hasLogo: true,
    hasSchool: true,
  });
  const [assetVersion, setAssetVersion] = useState<number>(0);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const schoolInputRef = useRef<HTMLInputElement>(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<'student' | 'teacher'>('student');

  // Admission Modal State
  const [admissionWizardOpen, setAdmissionWizardOpen] = useState(false);
  const [admissionClass, setAdmissionClass] = useState<'9' | '10' | '11' | '12'>('9');
  const [activeDraft, setActiveDraft] = useState<AdmissionApplication | null>(null);

  // Printable View
  const [printApp, setPrintApp] = useState<AdmissionApplication | null>(null);

  // Campus Facility Modal & Live Labs/Library Photos State
  const [campusModal, setCampusModal] = useState<CampusFacility | null>(null);
  const [facilities, setFacilities] = useState<CampusFacility[]>(() => {
    try {
      const cached = localStorage.getItem('ghss_facilities_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return OFFICIAL_SCHOOL_INFO.facilities;
  });
  const [teacherInitialTab, setTeacherInitialTab] = useState<'admissions' | 'quizzes' | 'photos'>('admissions');
  const [uploadingFacilityId, setUploadingFacilityId] = useState<string | null>(null);
  const homeFacilityInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // AI Chatbot & Google Search Grounding State
  const [aiOpen, setAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      sender: 'user' | 'bot';
      text: string;
      sources?: Array<{ title: string; uri: string }>;
      modelUsed?: string;
    }>
  >([
    {
      sender: 'bot',
      text: 'नमस्ते! मैं शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव का अधिकृत Gemini AI सहायक हूँ। आप मुझसे प्रवेश, कक्षा, शिक्षक, समय अथवा MP Board एवं छात्रवृत्ति संबंधी ताज़ा प्रश्न पूछ सकते हैं।',
      modelUsed: 'Gemini School Assistant',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'standard' | 'fast'>('standard');
  const [chatSearchEnabled, setChatSearchEnabled] = useState<boolean>(true);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inlineChatBottomRef = useRef<HTMLDivElement>(null);

  // Real-Time Google Search Updates State
  const [liveCategory, setLiveCategory] = useState<'mpbse' | 'scholarships' | 'khandwa'>('mpbse');
  const [liveSearchQuery, setLiveSearchQuery] = useState('');
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<{
    summary: string;
    sources: Array<{ title: string; uri: string }>;
    updatedAt: string;
  }>({
    summary:
      '• MPBSE (माध्यमिक शिक्षा मण्डल, म.प्र.) सत्र 2026-27 हेतु कक्षा 9वीं से 12वीं के शैक्षणिक कैलेंडर, पाठ्यक्रम एवं परीक्षा दिशा-निर्देश आधिकारिक पोर्टल पर उपलब्ध हैं।\n• शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव (UDISE: 23290300210, संस्था कोड: 561033) में नवीन प्रवेश आवेदन चालू हैं।\n• पात्र विद्यार्थियों के लिए शिक्षा पोर्टल छात्रवृत्ति, लाड़ली लक्ष्मी योजना एवं संबल योजना के लाभ उपलब्ध हैं।',
    sources: [
      { title: 'MPBSE Official Portal (mpbse.nic.in)', uri: 'https://mpbse.nic.in' },
      { title: 'MP Shiksha Portal', uri: 'https://shikshaportal.mp.gov.in' },
      { title: 'Vimarsh MP School Education Portal', uri: 'https://www.vimarsh.mp.gov.in' },
    ],
    updatedAt: new Date().toISOString(),
  });

  // Learn / Quiz Engine State
  const [quizClass, setQuizClass] = useState<'9' | '10' | '11' | '12'>('9');
  const [quizSubject, setQuizSubject] = useState('Mathematics');
  const [activeQuiz, setActiveQuiz] = useState<{ questions: QuizQuestion[]; index: number; score: number } | null>(null);
  const [timer, setTimer] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  // Apply Theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('ghss_theme', theme);
    } catch {}
  }, [theme]);

  // Check if /public/logo.jpg and /public/school.jpg exist on disk, and load Lab & Library photos
  useEffect(() => {
    fetch('/api/assets/status')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.hasLogo === 'boolean' && typeof data?.hasSchool === 'boolean') {
          setAssetStatus({ hasLogo: data.hasLogo, hasSchool: data.hasSchool });
        }
      })
      .catch(() => {});

    fetch('/api/facilities')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.facilities) && data.facilities.length > 0) {
          setFacilities(data.facilities);
          try {
            localStorage.setItem('ghss_facilities_cache', JSON.stringify(data.facilities));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const handleQuickFacilityPhotoUpload = async (facility: CampusFacility, file?: File | null) => {
    if (!file) return;
    setUploadingFacilityId(facility.id);
    try {
      const dataUrl = await compressImageFile(file);
      const res = await fetch('/api/facilities/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: facility.id,
          title: facility.title,
          category: facility.category,
          desc: facility.desc,
          dataUrl,
          updatedBy: currentUser?.name || 'Teacher',
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.facilities)) {
        setFacilities(data.facilities);
        if (data.facility && campusModal?.id === facility.id) {
          setCampusModal(data.facility);
        }
        try {
          localStorage.setItem('ghss_facilities_cache', JSON.stringify(data.facilities));
        } catch {}
      }
    } catch (e) {
      console.error('Failed to upload facility photo:', e);
    } finally {
      setUploadingFacilityId(null);
    }
  };

  const handleUploadOriginalAsset = (targetName: 'logo.jpg' | 'school.jpg', file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await fetch('/api/assets/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: targetName, dataUrl }),
        });
        if (res.ok) {
          setAssetVersion(Date.now());
          setAssetStatus((prev) => ({
            ...prev,
            hasLogo: targetName === 'logo.jpg' ? true : prev.hasLogo,
            hasSchool: targetName === 'school.jpg' ? true : prev.hasSchool,
          }));
        }
      } catch (e) {
        console.error('Failed to save asset:', e);
      }
    };
    reader.readAsDataURL(file);
  };

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as UserProfile);
          } else {
            const fallback: UserProfile = {
              uid: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Student',
              email: user.email || '',
              role: 'student',
              createdAt: new Date().toISOString(),
            };
            setCurrentUser(fallback);
          }
        } catch (e) {
          console.error('Error fetching profile:', e);
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, []);

  // Scroll to bottom in chat
  useEffect(() => {
    if (aiOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    inlineChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, aiOpen]);

  // Fetch Real-Time Updates via Google Search Grounding (triggered on user interaction)
  const fetchLiveUpdates = async (categoryOverride?: 'mpbse' | 'scholarships' | 'khandwa', customQuery?: string) => {
    const targetCategory = categoryOverride || liveCategory;
    setLiveLoading(true);
    try {
      const res = await fetch('/api/updates/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: targetCategory,
          query: customQuery !== undefined ? customQuery : liveSearchQuery,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setLiveUpdates({
            summary: data.summary,
            sources: Array.isArray(data.sources) ? data.sources : [],
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Keep existing verified updates displayed
    } finally {
      setLiveLoading(false);
    }
  };

  // Quiz Timer
  useEffect(() => {
    let interval: any;
    if (activeQuiz && !quizFinished && selectedAnswer === null) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            handleAnswer(-1); // Time out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuiz, quizFinished, selectedAnswer]);

  const handleStartQuiz = () => {
    // Check if there are published quizzes for this class & subject in Firestore, else use fallback
    const qList = FALLBACK_QUIZZES[quizSubject] || FALLBACK_QUIZZES['Mathematics'];
    setActiveQuiz({
      questions: qList,
      index: 0,
      score: 0,
    });
    setTimer(20);
    setSelectedAnswer(null);
    setQuizFinished(false);
  };

  const handleAnswer = (optionIdx: number) => {
    if (!activeQuiz || selectedAnswer !== null) return;
    setSelectedAnswer(optionIdx);

    const currentQ = activeQuiz.questions[activeQuiz.index];
    const isCorrect = optionIdx === currentQ.correctIndex;
    const newScore = isCorrect ? activeQuiz.score + 1 : activeQuiz.score;

    setTimeout(() => {
      if (activeQuiz.index + 1 < activeQuiz.questions.length) {
        setActiveQuiz({
          ...activeQuiz,
          index: activeQuiz.index + 1,
          score: newScore,
        });
        setSelectedAnswer(null);
        setTimer(20);
      } else {
        // Finish
        const xpGained = newScore * 20;
        setEarnedXP(xpGained);
        setActiveQuiz({ ...activeQuiz, score: newScore });
        setQuizFinished(true);
      }
    }, 1200);
  };

  // AI Chat message sender
  const handleSendChat = async (overrideText?: string) => {
    const textToSend = overrideText || chatInput.trim();
    if (!textToSend || chatLoading) return;

    const newHistory = [...chatMessages, { sender: 'user' as const, text: textToSend }];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: newHistory,
          useSearchGrounding: chatSearchEnabled,
          mode: chatMode,
        }),
      });

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.reply || 'मुझे इस जानकारी की पुष्टि उपलब्ध विद्यालय रिकॉर्ड से नहीं मिली है। कृपया विद्यालय कार्यालय से संपर्क करें।',
          sources: Array.isArray(data.sources) ? data.sources : [],
          modelUsed: data.modelUsed,
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'मुझे इस जानकारी की पुष्टि उपलब्ध विद्यालय रिकॉर्ड से नहीं मिली है। कृपया विद्यालय कार्यालय से संपर्क करें।',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Aaj Ka Vishesh Din calculation
  const today = new Date();
  const dayKey = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const specialDay = SPECIAL_DAYS[dayKey] || ['आज का विशेष दिन', 'आज नया ज्ञान अर्जित करने एवं स्वाध्याय के लिए एक उत्तम दिवस है!'];

  return (
    <div className="min-h-screen text-slate-100 selection:bg-pink-500 selection:text-white">
      {/* Background Ambience Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="blob blob1 w-[400px] h-[400px] rounded-full bg-purple-600/15 blur-[120px] absolute -top-24 -right-24" />
        <div className="blob blob2 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[120px] absolute -bottom-24 -left-24" />
      </div>

      {/* Hidden file inputs to save exact original logo.jpg and school.jpg into /public if needed */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUploadOriginalAsset('logo.jpg', e.target.files?.[0])}
      />
      <input
        ref={schoolInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUploadOriginalAsset('school.jpg', e.target.files?.[0])}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="wrap flex items-center justify-between h-[68px]">
          <div
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-3 cursor-pointer min-w-0"
          >
            <img
              src={assetVersion ? `/logo.jpg?v=${assetVersion}` : '/logo.jpg'}
              alt="शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव"
              className="w-11 h-11 sm:w-12 sm:h-12 object-contain rounded-lg bg-white p-0.5 shadow-md shrink-0"
            />
            <div className="brand font-bold text-sm sm:text-base truncate grad-text">
              GHSS Ahamdpur, Khaigaon
            </div>
          </div>

          {/* Actions: Theme Toggle & Portal Login */}
          <div className="flex items-center gap-3 shrink-0">
            {!assetStatus.hasLogo && (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="py-1.5 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-semibold transition"
                title="Load original logo.jpg into /public/logo.jpg"
              >
                Load logo.jpg
              </button>
            )}

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            </button>

            {currentUser ? (
              <button
                onClick={() => setCurrentView('profile')}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-semibold shadow-md transition ${
                  currentUser.role === 'teacher'
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-white'
                }`}
              >
                {currentUser.role === 'teacher' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Faculty Portal</span>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>My Dashboard</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthInitialRole('student');
                  setAuthModalOpen(true);
                }}
                className="py-1.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold shadow-md shadow-cyan-900/30 transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* VIEW: HOME VIEW                                           */}
      {/* ========================================================= */}
      {currentView === 'home' && (
        <main className="space-y-16 sm:space-y-24">
          {/* HERO SECTION */}
          <section id="home" className="pt-28 pb-12 sm:pt-36 sm:pb-20">
            <div className="wrap space-y-8 sm:space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    स्थापना 1984 • उच्चतर माध्यमिक उन्नयन 2006
                  </div>
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                    शासकीय उच्चतर माध्यमिक विद्यालय
                    <span className="block text-xl sm:text-3xl text-cyan-400 font-bold mt-2">
                      अहमदपुर खैगांव, जिला-खण्डवा (म.प्र.)
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
                    A modern digital campus dedicated to educational excellence, character building, and community empowerment. सत्र 2026-2027 में कक्षा 9वीं से 12वीं तक के प्रवेश हेतु ऑनलाइन आवेदन आमंत्रित हैं।
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          setAuthModalOpen(true);
                        } else {
                          setAdmissionClass('9');
                          setAdmissionWizardOpen(true);
                        }
                      }}
                      className="flex items-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-900/40 transition"
                    >
                      <span>Apply for Admission (प्रवेश आवेदन)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <a
                      href="#about"
                      className="py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs sm:text-sm transition"
                    >
                      Learn More
                    </a>
                  </div>
                </div>

                {/* Hero Banner Card */}
                <div className="lg:col-span-5">
                  <div className="glass p-6 sm:p-8 rounded-3xl relative overflow-hidden space-y-4 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800">
                        UDISE: 23290300210
                      </span>
                      <span className="text-xs text-slate-400">Code: 561033</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                      <div className="text-xs font-bold text-cyan-400">प्राचार्य संदेश (Principal's Desk)</div>
                      <div className="text-xs text-white font-semibold">
                        {OFFICIAL_SCHOOL_INFO.principal.name}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed italic">
                        "हमारा संकल्प है कि प्रत्येक छात्र को संस्कारयुक्त व गुणवत्तापूर्ण शिक्षा प्रदान कर उनके सर्वांगीण विकास का मार्ग प्रशस्त किया जाए।"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                        <div className="text-base font-bold text-white">10:30 AM</div>
                        <div className="text-[10px] text-slate-500">शाला प्रारंभ</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                        <div className="text-base font-bold text-white">04:30 PM</div>
                        <div className="text-[10px] text-slate-500">शाला समापन</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official School Building Photo Container */}
              <div className="glass p-3 sm:p-4 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden space-y-3">
                <div className="overflow-hidden rounded-2xl bg-slate-950/60">
                  <img
                    src={assetVersion ? `/school.jpg?v=${assetVersion}` : '/school.jpg'}
                    alt="शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव - Government Higher Secondary School, Ahamdpur Khaigaon"
                    className="w-full h-auto max-h-[540px] object-contain rounded-2xl block mx-auto"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2 pt-1">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव
                    </div>
                    <div className="text-[11px] sm:text-xs text-cyan-400 font-medium">
                      Government Higher Secondary School, Ahamdpur Khaigaon
                    </div>
                  </div>
                  {!assetStatus.hasSchool && (
                    <button
                      type="button"
                      onClick={() => schoolInputRef.current?.click()}
                      className="py-1.5 px-3.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition shrink-0"
                    >
                      Select Original school.jpg
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* AAJ KA VISHESH DIN */}
          <section className="wrap">
            <div className="glass p-6 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-purple-950/20 via-slate-900 to-cyan-950/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 text-2xl shrink-0">
                📅
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Aaj Ka Vishesh Din (आज का विशेष दिन) • {today.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {specialDay[0]}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {specialDay[1]}
                </p>
              </div>
            </div>
          </section>

          {/* ABOUT SECTION */}
          <section id="about" className="wrap space-y-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">About Our School</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                संस्कार, शिक्षा एवं अनुशासन की समृद्ध परंपरा
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-3">
                <h3 className="text-base font-bold text-white">Who We Are (परिचय)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव (खण्डवा) क्षेत्र का एक प्रमुख शासकीय शिक्षण संस्थान है जहाँ कक्षा 9वीं से 12वीं तक आधुनिक एवं मूल्यपरक शिक्षा प्रदान की जाती है।
                </p>
              </div>
              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-3">
                <h3 className="text-base font-bold text-white">Our History (इतिहास)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  वर्ष 1984 में हाईस्कूल के रूप में स्थापित होकर वर्ष 2006 में उच्चतर माध्यमिक विद्यालय के रूप में उन्नत हुआ। विद्यालय ने हजारों विद्यार्थियों को उच्च शिक्षा एवं रोजगार के योग्य बनाया है।
                </p>
              </div>
              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-3">
                <h3 className="text-base font-bold text-white">Our Mission (ध्येय)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "A Commitment to Success" - प्रत्येक विद्यार्थी में वैज्ञानिक दृष्टिकोण, तार्किक क्षमता, और सामाजिक उत्तरदायित्व की भावना का विकास करना।
                </p>
              </div>
            </div>

            {/* Official Stat Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { count: '4', label: 'Classes (9th to 12th)' },
                { count: '18+', label: 'Qualified Teachers' },
                { count: '450+', label: 'Enrolled Students' },
                { count: '6', label: 'Labs & Facilities' },
              ].map((st, i) => (
                <div key={i} className="glass p-5 rounded-2xl text-center border border-slate-800">
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">{st.count}</div>
                  <div className="text-xs text-slate-400 mt-1">{st.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* CAMPUS FACILITIES, LABS & LIBRARY */}
          <section id="campus" className="wrap space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Campus, Science Labs & Library</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Explore Our Labs, Library & Campus (प्रयोगशालाएं एवं पुस्तकालय)
                </h2>
              </div>

              {(currentUser?.role === 'teacher' || currentUser?.role === 'admin') && (
                <button
                  type="button"
                  onClick={() => {
                    setTeacherInitialTab('photos');
                    setCurrentView('profile');
                  }}
                  className="inline-flex items-center gap-2 py-2.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition shrink-0"
                >
                  <Camera className="w-4 h-4" />
                  <span>Manage Lab & Library Photos (फोटो बदलें)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {facilities.map((fac, i) => {
                const isTeacherUser = currentUser?.role === 'teacher' || currentUser?.role === 'admin';
                const isUploadingThis = uploadingFacilityId === fac.id;

                return (
                  <div
                    key={fac.id || i}
                    onClick={() => setCampusModal(fac)}
                    className="glass rounded-3xl border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Hidden file input for instant teacher photo upload */}
                      {isTeacherUser && (
                        <input
                          ref={(el) => {
                            homeFacilityInputRefs.current[fac.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleQuickFacilityPhotoUpload(fac, file);
                            }
                            e.target.value = '';
                          }}
                        />
                      )}

                      {/* Photo or Default Visual Header */}
                      <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                        {fac.imageUrl ? (
                          <img
                            src={fac.imageUrl}
                            alt={fac.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950/40 flex flex-col items-center justify-center p-4 text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-cyan-400 flex items-center justify-center">
                              {fac.category === 'Library' ? (
                                <BookOpen className="w-6 h-6 text-amber-400" />
                              ) : fac.category === 'Lab' ? (
                                <FlaskConical className="w-6 h-6 text-cyan-400" />
                              ) : fac.category === 'Classroom' ? (
                                <Monitor className="w-6 h-6 text-purple-400" />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-emerald-400" />
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400">
                              {fac.category === 'Library' ? 'School Library' : fac.category === 'Lab' ? 'Practical Lab' : 'Campus Facility'}
                            </span>
                          </div>
                        )}

                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/85 text-cyan-300 border border-slate-700">
                            {fac.category}
                          </span>
                        </div>

                        {/* Profile-picture-style Camera Button for Teachers */}
                        {isTeacherUser && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              homeFacilityInputRefs.current[fac.id]?.click();
                            }}
                            disabled={isUploadingThis}
                            className="absolute bottom-2.5 right-2.5 z-10 w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg border-2 border-slate-950 flex items-center justify-center transition transform hover:scale-105"
                            title="Upload / Change Photo"
                          >
                            {isUploadingThis ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="p-5 space-y-2">
                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-400 transition">
                          {fac.title}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{fac.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* COURSES & ACADEMICS */}
          <section id="academics" className="wrap space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Academics & Streams</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                पाठ्यक्रम एवं उपलब्ध संकाय
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Classes 9th & 10th
                </span>
                <h3 className="text-lg font-bold text-white">माध्यमिक पाठ्यक्रम (Secondary Education)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  हिन्दी, अंग्रेजी, संस्कृत, गणित, विज्ञान एवं सामाजिक विज्ञान। कक्षा 9वीं में छात्रों एवं छात्राओं के लिए अलग-अलग सेक्शन्स (Boys & Girls Sections) की व्यवस्था है।
                </p>
                <div className="text-xs text-slate-300 font-semibold">
                  व्यवसायिक पाठ्यक्रम (Vocational): Beauty & Wellness, Healthcare
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800">
                  Classes 11th & 12th
                </span>
                <h3 className="text-lg font-bold text-white">उच्चतर माध्यमिक संकाय (Higher Secondary Streams)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  विज्ञान संकाय (गणित व जीव विज्ञान - Physics, Chemistry, Maths/Biology) तथा कला संकाय (इतिहास, भूगोल, राजनीति विज्ञान, अर्थशास्त्र) व वाणिज्य संकाय।
                </p>
                <div className="text-xs text-slate-300 font-semibold">
                  बोर्ड: माध्यमिक शिक्षा मण्डल, मध्य प्रदेश (MP Board Bhopal)
                </div>
              </div>
            </div>
          </section>

          {/* DIGITAL ADMISSION SECTION */}
          <section id="admission" className="wrap space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Admission Open 2026-27</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                कक्षा 9वीं से 12वीं में प्रवेश हेतु आवेदन करें
              </h2>
              <p className="text-xs text-slate-400">
                विद्यालय के 4-पृष्ठीय मूल प्रवेश फॉर्म के अनुसार डिजिटल आवेदन पत्र भरें तथा अपना यूनिक आवेदन क्रमांक प्राप्त करें।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(['9', '10', '11', '12'] as const).map((cls) => (
                <div
                  key={cls}
                  className="glass p-6 rounded-3xl border border-slate-800 hover:border-cyan-500/50 transition space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs font-mono font-bold text-cyan-400">SESSION 2026-27</div>
                    <h3 className="text-xl font-bold text-white mt-1">कक्षा {cls}वीं</h3>
                    <p className="text-xs text-slate-400 mt-2">
                      {cls === '9' && 'Girls Section एवं Boys Section उपलब्ध। व्यवसायिक शिक्षा शामिल।'}
                      {cls === '10' && 'बोर्ड परीक्षा तैयारी, रेमेडियल क्लास एवं सतत मूल्यांकन।'}
                      {cls === '11' && 'Science (Maths/Bio), Arts एवं Commerce संकाय।'}
                      {cls === '12' && 'MP Board बोर्ड परीक्षा, प्रैक्टिकल लैब्स एवं करियर मार्गदर्शन।'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (!currentUser) {
                        setAuthModalOpen(true);
                      } else {
                        setAdmissionClass(cls);
                        setAdmissionWizardOpen(true);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-md shadow-cyan-900/30 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Apply Class {cls}th</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* FEES POLICY STATEMENT */}
          <section className="wrap">
            <div className="glass p-6 rounded-3xl border border-slate-800 text-xs space-y-2 text-slate-400">
              <span className="font-bold text-white uppercase text-[11px]">शासकीय शुल्क नीति (Fee Policy):</span>
              <p>
                मध्य प्रदेश शासन के नियमानुसार शासकीय उच्चतर माध्यमिक विद्यालय में शिक्षण निःशुल्क/न्यूनतम शासकीय दिशा-निर्देशानुसार प्रदान किया जाता है। प्रवेश शुल्क व योजनाओं की सटीक जानकारी हेतु विद्यालय कार्यालय से संपर्क करें।
              </p>
            </div>
          </section>

          {/* CONTACT SECTION */}
          <section id="contact" className="wrap space-y-8 pb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Contact Details</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                संपर्क एवं कार्यालय समय
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">कार्यालय पता (Address)</div>
                <p className="text-slate-400 leading-relaxed">
                  शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव,<br />
                  जिला-खण्डवा, मध्य प्रदेश - 450001
                </p>
              </div>

              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">प्राचार्य संपर्क (Principal)</div>
                <p className="text-slate-400">
                  <b>{OFFICIAL_SCHOOL_INFO.principal.name}</b><br />
                  मोबाइल: <a href="tel:9977359533" className="text-cyan-400 font-mono">9977359533</a><br />
                  ईमेल: <a href="mailto:hss.ahmedpur.khd.mp@gmail.com" className="text-cyan-400">hss.ahmedpur.khd.mp@gmail.com</a>
                </p>
              </div>

              <div className="glass p-6 rounded-3xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">विद्यालय समय (Timings)</div>
                <p className="text-slate-400 leading-relaxed">
                  सोमवार से शनिवार: <b>सुबह 10:30 बजे से शाम 4:30 बजे तक</b><br />
                  रविवार व शासकीय अवकाश: बंद
                </p>
              </div>
            </div>

            {/* GEMINI AI HELPDESK & REAL-TIME GOOGLE SEARCH UPDATES */}
            <div className="pt-4 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gemini AI Helpdesk & Live Google Search Data
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                    विद्यालय AI सहायता केंद्र एवं लाइव शैक्षणिक अपडेट
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ask any question about GHSS Ahamdpur Khaigaon or check real-time MP Board & scholarship updates grounded with Google Search.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Column: Multi-Turn Gemini School Chatbot */}
                <div className="lg:col-span-7 glass rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
                  <div className="px-4 sm:px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                          <span>School Gemini AI Chatbot</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Multi-Turn
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Official Verified Records + Live Google Search Grounding
                        </div>
                      </div>
                    </div>

                    {/* Mode & Google Search Toggle */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setChatMode(chatMode === 'standard' ? 'fast' : 'standard')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition ${
                          chatMode === 'fast'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title="Switch between Standard (Gemini Flash) and Fast (Gemini Flash Lite) response mode"
                      >
                        <Zap className="w-3 h-3" />
                        <span>{chatMode === 'fast' ? 'Fast (Flash Lite)' : 'Standard (Flash)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setChatSearchEnabled(!chatSearchEnabled)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition ${
                          chatSearchEnabled
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title="Toggle Google Search Grounding for live web answers"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Google Search: {chatSearchEnabled ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Prompt Chips */}
                  <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap gap-1.5">
                    {[
                      'विद्यालय का समय और प्राचार्य कौन हैं?',
                      'प्रवेश के लिए आवश्यक 14 दस्तावेज क्या हैं?',
                      'कक्षा 11वीं एवं 12वीं में कौन-कौन से विषय हैं?',
                      'MP Board 10th & 12th latest updates',
                      'MP Govt school scholarship schemes',
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendChat(chip)}
                        className="py-1 px-2.5 rounded-full text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Messages Scrollable Thread */}
                  <div className="p-4 overflow-y-auto space-y-3 h-72 sm:h-80 bg-slate-950/30">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl max-w-[88%] text-xs leading-relaxed space-y-2 ${
                          msg.sender === 'user'
                            ? 'ml-auto bg-purple-600/35 border border-purple-500/40 text-purple-100 rounded-br-sm'
                            : 'mr-auto bg-slate-950/90 border border-slate-800 text-slate-200 rounded-bl-sm'
                        }`}
                      >
                        <div className="whitespace-pre-line">{msg.text}</div>

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80 space-y-1">
                            <div className="text-[10px] font-semibold text-cyan-400 flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span>Google Search Grounding Sources:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((src, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-cyan-300 max-w-full truncate"
                                >
                                  <span className="truncate max-w-[180px]">{src.title}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="mr-auto p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs animate-pulse flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {chatSearchEnabled
                            ? 'Checking official school records & Google Search...'
                            : 'Checking official school records...'}
                        </span>
                      </div>
                    )}
                    <div ref={inlineChatBottomRef} />
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChat();
                    }}
                    className="p-3 bg-slate-950/80 border-t border-slate-800 flex gap-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about school admission, teachers, timings, or MP Board updates..."
                      className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !chatInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <span>Ask</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* Right Column: Real-Time Google Search Updates */}
                <div className="lg:col-span-5 glass rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
                  <div className="px-4 sm:px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white">
                          Real-Time Education Updates
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Grounded with Google Search (MPBSE & Schemes)
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fetchLiveUpdates(liveCategory, liveSearchQuery)}
                      disabled={liveLoading}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
                      title="Refresh live Google Search updates"
                    >
                      <RefreshCw className={`w-4 h-4 ${liveLoading ? 'animate-spin text-cyan-400' : ''}`} />
                    </button>
                  </div>

                  {/* Category Selector Pills */}
                  <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap gap-1.5">
                    {[
                      { id: 'mpbse' as const, label: 'MP Board (MPBSE)' },
                      { id: 'scholarships' as const, label: 'Scholarships & Schemes' },
                      { id: 'khandwa' as const, label: 'Khandwa & Campus' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setLiveCategory(tab.id);
                          setLiveSearchQuery('');
                          fetchLiveUpdates(tab.id, '');
                        }}
                        className={`px-3 py-1 rounded-xl text-[11px] font-semibold border transition ${
                          liveCategory === tab.id && !liveSearchQuery
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Google Search Bar for Education Updates */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      fetchLiveUpdates(liveCategory, liveSearchQuery);
                    }}
                    className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex gap-2"
                  >
                    <input
                      type="text"
                      value={liveSearchQuery}
                      onChange={(e) => setLiveSearchQuery(e.target.value)}
                      placeholder="Search live MP Board / education news..."
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      disabled={liveLoading}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search</span>
                    </button>
                  </form>

                  {/* Grounded Summary Content */}
                  <div className="p-4 overflow-y-auto space-y-3 flex-1 h-64 sm:h-72 bg-slate-950/30 text-xs">
                    {liveLoading ? (
                      <div className="space-y-2.5 animate-pulse py-4">
                        <div className="h-3 bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-800 rounded w-full" />
                        <div className="h-3 bg-slate-800 rounded w-5/6" />
                        <div className="text-[11px] text-cyan-400 pt-2">
                          Fetching live data via Google Search Grounding...
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-slate-200 leading-relaxed whitespace-pre-line">
                          {liveUpdates.summary}
                        </div>

                        {liveUpdates.sources.length > 0 && (
                          <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span>Verified Web Links & Portals</span>
                            </div>
                            <div className="space-y-1">
                              {liveUpdates.sources.map((src, idx) => (
                                <a
                                  key={idx}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[11px] text-cyan-300 transition"
                                >
                                  <span className="truncate">{src.title}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW: LEARN VIEW (CLASS, SUBJECT & CHAPTER-WISE QUIZ)      */}
      {/* ========================================================= */}
      {currentView === 'learn' && (
        <LearnQuizHub
          earnedXP={earnedXP}
          onEarnXP={(xp) => setEarnedXP((prev) => prev + xp)}
        />
      )}

      {/* ========================================================= */}
      {/* VIEW: FACULTY DIRECTORY VIEW                              */}
      {/* ========================================================= */}
      {currentView === 'faculty' && (
        <main className="wrap pt-28 pb-16 space-y-8 animate-fadeIn">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Faculty & Staff</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              अहमदपुर खैगांव शिक्षक संकाय (Faculty Directory)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Official list of subject and class teachers as per school records.
            </p>
          </div>

          {/* Principal Card */}
          <div className="glass p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-purple-950/30 via-slate-900 to-cyan-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-extrabold text-xl">
                AB
              </div>
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">प्राचार्य (Principal)</span>
                <h3 className="text-lg font-bold text-white">{OFFICIAL_SCHOOL_INFO.principal.name}</h3>
                <p className="text-xs text-slate-400">Contact: 9977359533</p>
              </div>
            </div>
            <a
              href="tel:9977359533"
              className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-xs shadow-md transition"
            >
              Call Office
            </a>
          </div>

          {/* Subject Teachers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OFFICIAL_SCHOOL_INFO.subjectTeachers.map((item, idx) => (
              <div key={idx} className="glass p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-cyan-400">{item.subject}</div>
                <div className="space-y-1">
                  {item.teachers.map((t, tIdx) => (
                    <div key={tIdx} className="text-sm font-semibold text-white">
                      • {t}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW: COMMUNITY VIEW (DOUBTS & HOMEWORK)                   */}
      {/* ========================================================= */}
      {currentView === 'community' && (
        <main className="wrap pt-28 pb-16 space-y-8 animate-fadeIn">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">School Community</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              विद्यार्थी विचार-मंच एवं गृहकार्य (Doubts & Homework)
            </h2>
          </div>

          <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4 max-w-xl mx-auto">
            <h3 className="text-base font-bold text-white">Ask a Doubt (अपना प्रश्न पूछें)</h3>
            <textarea
              rows={3}
              placeholder="Type your academic doubt here..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Photos can be attached for homework questions</span>
              <button
                onClick={() => alert('Doubt submitted to peer & teacher forum!')}
                className="py-2 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-xs transition"
              >
                Post Doubt
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================= */}
      {/* VIEW: PROFILE / DASHBOARD VIEW                            */}
      {/* ========================================================= */}
      {currentView === 'profile' && (
        <main className="wrap pt-28 pb-16 animate-fadeIn">
          {currentUser ? (
            currentUser.role === 'teacher' || currentUser.role === 'admin' ? (
              <TeacherDashboard
                user={currentUser}
                onLogout={async () => {
                  await signOut(auth);
                  setCurrentUser(null);
                  setCurrentView('home');
                }}
                onOpenPrint={(app) => setPrintApp(app)}
                facilities={facilities}
                onFacilitiesChange={setFacilities}
                assetVersion={assetVersion}
                onUploadSchoolAsset={handleUploadOriginalAsset}
                initialTab={teacherInitialTab}
              />
            ) : (
              <StudentDashboard
                user={currentUser}
                onLogout={async () => {
                  await signOut(auth);
                  setCurrentUser(null);
                  setCurrentView('home');
                }}
                onStartAdmission={(cls, draft) => {
                  setAdmissionClass(cls || '9');
                  setActiveDraft(draft || null);
                  setAdmissionWizardOpen(true);
                }}
                onOpenPrint={(app) => setPrintApp(app)}
                onGoToLearn={() => setCurrentView('learn')}
              />
            )
          ) : (
            <div className="max-w-md mx-auto p-8 rounded-3xl glass text-center space-y-4 border border-slate-800">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto text-3xl font-bold">
                👤
              </div>
              <h3 className="text-xl font-bold text-white">Student & Teacher Portal</h3>
              <p className="text-xs text-slate-400">
                Please login to access your admission application, daily learning stats, or teacher review hub.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => {
                    setAuthInitialRole('student');
                    setAuthModalOpen(true);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-xs shadow-md transition"
                >
                  Student Login
                </button>
                <button
                  onClick={() => {
                    setAuthInitialRole('teacher');
                    setAuthModalOpen(true);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition"
                >
                  Teacher Login
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ========================================================= */}
      {/* FLOATING SCHOOL AI ASSISTANT (CHATBOT)                     */}
      {/* ========================================================= */}
      <button
        onClick={() => setAiOpen(!aiOpen)}
        className="ai-fab fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-cyan-500 text-white shadow-2xl flex items-center justify-center text-2xl hover:scale-105 transition"
        aria-label="Open School AI Assistant"
      >
        💬
      </button>

      {/* AI Chat Drawer */}
      {aiOpen && (
        <div className="ai-panel fixed bottom-40 right-4 z-50 w-80 sm:w-96 max-w-[calc(100vw-32px)] max-h-[68vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-xs text-slate-100 animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <b className="text-white text-xs block">School AI Assistant</b>
                <span className="text-[10px] text-cyan-300">शासकीय उच्चतर माध्यमिक विद्यालय</span>
              </div>
            </div>
            <button
              onClick={() => setAiOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              ✕
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap gap-1.5 shrink-0">
            {[
              'School timing?',
              'What classes are available?',
              'Who is the principal?',
              'Required documents?',
              'Subject teachers?',
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChat(chip)}
                className="py-1 px-2.5 rounded-full text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed space-y-1.5 ${
                  msg.sender === 'user'
                    ? 'ml-auto bg-purple-600/40 border border-purple-500/40 text-purple-100 rounded-br-sm'
                    : 'mr-auto bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-sm'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-800 space-y-1">
                    <div className="text-[10px] font-semibold text-cyan-400">Sources:</div>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-cyan-300 max-w-full truncate"
                        >
                          <span className="truncate max-w-[150px]">{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="mr-auto p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-[11px] animate-pulse">
                Thinking with official school records & Google Search...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="p-2.5 bg-slate-950 border-t border-slate-800 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about school, admission, teachers..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* FIXED BOTTOM NAVIGATION BAR (MOBILE & DESKTOP)            */}
      {/* ========================================================= */}
      <nav className="bnav" aria-label="Main Navigation">
        <div className="bnav-inner">
          <button
            type="button"
            onClick={() => setCurrentView('home')}
            className={`bnav-item ${currentView === 'home' ? 'on' : ''}`}
            aria-current={currentView === 'home' ? 'page' : undefined}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('learn')}
            className={`bnav-item ${currentView === 'learn' ? 'on' : ''}`}
            aria-current={currentView === 'learn' ? 'page' : undefined}
          >
            <BookOpen className="w-5 h-5" />
            <span>Learn</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('community')}
            className={`bnav-item ${currentView === 'community' ? 'on' : ''}`}
            aria-current={currentView === 'community' ? 'page' : undefined}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Community</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('faculty')}
            className={`bnav-item ${currentView === 'faculty' ? 'on' : ''}`}
            aria-current={currentView === 'faculty' ? 'page' : undefined}
          >
            <Users className="w-5 h-5" />
            <span>Faculty</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('profile')}
            className={`bnav-item ${currentView === 'profile' ? 'on' : ''}`}
            aria-current={currentView === 'profile' ? 'page' : undefined}
          >
            <UserIcon className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500 space-y-1">
        <div>Government Higher Secondary School, Ahamdpur, Khaigaon (Khandwa, M.P.)</div>
        <div>© {new Date().getFullYear()} GHSS Khaigaon. All rights reserved.</div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialRole={authInitialRole}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(profile) => {
          setCurrentUser(profile);
          setCurrentView('profile');
        }}
      />

      {admissionWizardOpen && currentUser && (
        <AdmissionWizard
          user={currentUser}
          initialClass={admissionClass}
          existingDraft={activeDraft}
          onSuccess={() => {
            setAdmissionWizardOpen(false);
            setCurrentView('profile');
          }}
          onClose={() => setAdmissionWizardOpen(false)}
          onOpenPrint={(app) => {
            setAdmissionWizardOpen(false);
            setPrintApp(app);
          }}
        />
      )}

      {printApp && (
        <AdmissionPrintView application={printApp} onClose={() => setPrintApp(null)} />
      )}

      {campusModal && (
        <div
          onClick={() => setCampusModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-3xl bg-slate-900 border border-slate-700 max-w-lg w-full overflow-hidden shadow-2xl text-xs"
          >
            {campusModal.imageUrl && (
              <div className="w-full max-h-80 bg-slate-950 overflow-hidden">
                <img
                  src={campusModal.imageUrl}
                  alt={campusModal.title}
                  className="w-full h-full max-h-80 object-contain mx-auto"
                />
              </div>
            )}
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {campusModal.category}
                </span>
                {campusModal.updatedAt && (
                  <span className="text-[10px] text-slate-400">
                    Updated {new Date(campusModal.updatedAt).toLocaleDateString('en-IN')}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white">{campusModal.title}</h3>
              <p className="text-slate-300 leading-relaxed">{campusModal.desc}</p>

              <div className="flex items-center gap-2 pt-2">
                {(currentUser?.role === 'teacher' || currentUser?.role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => homeFacilityInputRefs.current[campusModal.id]?.click()}
                    className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 rounded-xl text-white font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{campusModal.imageUrl ? 'Change Photo (फोटो बदलें)' : 'Upload Photo (फोटो अपलोड करें)'}</span>
                  </button>
                )}
                <button
                  onClick={() => setCampusModal(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
