import { QuizQuestion } from '../types';

export interface ChapterItem {
  id: string;
  number: number;
  titleHindi: string;
  titleEnglish: string;
  questions: QuizQuestion[];
}

export interface SubjectCurriculum {
  id: string;
  nameEnglish: string;
  nameHindi: string;
  icon: string;
  stream?: string;
  chapters: ChapterItem[];
}

export const CLASS_SUBJECTS: Record<'9' | '10' | '11' | '12', SubjectCurriculum[]> = {
  '9': [
    {
      id: 'Mathematics',
      nameEnglish: 'Mathematics',
      nameHindi: 'गणित',
      icon: '📐',
      chapters: [
        { id: 'c9-math-1', number: 1, titleHindi: 'संख्या पद्धति', titleEnglish: 'Number Systems', questions: [] },
        { id: 'c9-math-2', number: 2, titleHindi: 'बहुपद', titleEnglish: 'Polynomials', questions: [] },
        { id: 'c9-math-3', number: 3, titleHindi: 'निर्देशांक ज्यामिति', titleEnglish: 'Coordinate Geometry', questions: [] },
        { id: 'c9-math-4', number: 4, titleHindi: 'दो चरों वाले रैखिक समीकरण', titleEnglish: 'Linear Equations in Two Variables', questions: [] },
        { id: 'c9-math-5', number: 5, titleHindi: 'त्रिभुज एवं ज्यामिति', titleEnglish: 'Triangles & Geometry', questions: [] },
        { id: 'c9-math-6', number: 6, titleHindi: 'पृष्ठीय क्षेत्रफल और आयतन', titleEnglish: 'Surface Areas and Volumes', questions: [] },
      ],
    },
    {
      id: 'Science',
      nameEnglish: 'Science',
      nameHindi: 'विज्ञान',
      icon: '🔬',
      chapters: [
        { id: 'c9-sci-1', number: 1, titleHindi: 'हमारे आस-पास के पदार्थ', titleEnglish: 'Matter in Our Surroundings', questions: [] },
        { id: 'c9-sci-2', number: 2, titleHindi: 'परमाणु एवं अणु', titleEnglish: 'Atoms and Molecules', questions: [] },
        { id: 'c9-sci-3', number: 3, titleHindi: 'जीवन की मौलिक इकाई (कोशिका)', titleEnglish: 'The Fundamental Unit of Life', questions: [] },
        { id: 'c9-sci-4', number: 4, titleHindi: 'गति तथा बल के नियम', titleEnglish: 'Motion and Laws of Force', questions: [] },
        { id: 'c9-sci-5', number: 5, titleHindi: 'गुरुत्वाकर्षण एवं कार्य-ऊर्जा', titleEnglish: 'Gravitation, Work and Energy', questions: [] },
      ],
    },
    {
      id: 'Social Science',
      nameEnglish: 'Social Science',
      nameHindi: 'सामाजिक विज्ञान',
      icon: '🌍',
      chapters: [
        { id: 'c9-sst-1', number: 1, titleHindi: 'भारत: आकार और स्थिति', titleEnglish: 'India: Size and Location', questions: [] },
        { id: 'c9-sst-2', number: 2, titleHindi: 'भारत का भौतिक स्वरूप एवं अपवाह', titleEnglish: 'Physical Features & Drainage of India', questions: [] },
        { id: 'c9-sst-3', number: 3, titleHindi: 'लोकतंत्र क्या और संविधान निर्माण', titleEnglish: 'Democracy & Constitutional Design', questions: [] },
        { id: 'c9-sst-4', number: 4, titleHindi: 'फ्रांसीसी क्रांति एवं आधुनिक विश्व', titleEnglish: 'The French Revolution & Modern World', questions: [] },
      ],
    },
    {
      id: 'English',
      nameEnglish: 'English',
      nameHindi: 'अंग्रेजी',
      icon: '📘',
      chapters: [
        { id: 'c9-eng-1', number: 1, titleHindi: 'Tenses & Verb Forms', titleEnglish: 'Grammar: Tenses & Verbs', questions: [] },
        { id: 'c9-eng-2', number: 2, titleHindi: 'Articles, Prepositions & Determiners', titleEnglish: 'Grammar: Articles & Prepositions', questions: [] },
        { id: 'c9-eng-3', number: 3, titleHindi: 'Beehive Prose & Poetry (The Fun They Had)', titleEnglish: 'Beehive Literature & Vocabulary', questions: [] },
      ],
    },
    {
      id: 'Hindi',
      nameEnglish: 'Hindi',
      nameHindi: 'हिन्दी',
      icon: '🪔',
      chapters: [
        { id: 'c9-hin-1', number: 1, titleHindi: 'क्षितिज गद्य एवं पद्य खंड (दो बैलों की कथा, कबीर)', titleEnglish: 'Kshitij Prose & Poetry', questions: [] },
        { id: 'c9-hin-2', number: 2, titleHindi: 'हिंदी व्याकरण: संधि, समास, अलंकार एवं रस', titleEnglish: 'Hindi Vyakaran (Sandhi, Samas, Alankar)', questions: [] },
      ],
    },
    {
      id: 'Sanskrit',
      nameEnglish: 'Sanskrit',
      nameHindi: 'संस्कृत',
      icon: '🕉️',
      chapters: [
        { id: 'c9-san-1', number: 1, titleHindi: 'शेमुषी प्रथमः भागः एवं शब्दरूप-धातुरूप', titleEnglish: 'Shemushi & Sanskrit Vyakaran', questions: [] },
        { id: 'c9-san-2', number: 2, titleHindi: 'प्रत्यय, उपसर्ग एवं संधि प्रकरण', titleEnglish: 'Pratyaya, Upsarg & Sandhi', questions: [] },
      ],
    },
  ],
  '10': [
    {
      id: 'Mathematics',
      nameEnglish: 'Mathematics',
      nameHindi: 'गणित',
      icon: '📐',
      chapters: [
        { id: 'c10-math-1', number: 1, titleHindi: 'वास्तविक संख्याएँ एवं बहुपद', titleEnglish: 'Real Numbers & Polynomials', questions: [] },
        { id: 'c10-math-2', number: 2, titleHindi: 'द्विघात समीकरण एवं समांतर श्रेढ़ियाँ', titleEnglish: 'Quadratic Equations & Arithmetic Progressions', questions: [] },
        { id: 'c10-math-3', number: 3, titleHindi: 'त्रिकोणमिति का परिचय एवं अनुप्रयोग', titleEnglish: 'Introduction & Applications of Trigonometry', questions: [] },
        { id: 'c10-math-4', number: 4, titleHindi: 'निर्देशांक ज्यामिति एवं त्रिभुज', titleEnglish: 'Coordinate Geometry & Triangles', questions: [] },
        { id: 'c10-math-5', number: 5, titleHindi: 'सांख्यिकी एवं प्रायिकता', titleEnglish: 'Statistics & Probability', questions: [] },
      ],
    },
    {
      id: 'Science',
      nameEnglish: 'Science',
      nameHindi: 'विज्ञान',
      icon: '🔬',
      chapters: [
        { id: 'c10-sci-1', number: 1, titleHindi: 'रासायनिक अभिक्रियाएँ, अम्ल, क्षारक एवं लवण', titleEnglish: 'Chemical Reactions, Acids, Bases and Salts', questions: [] },
        { id: 'c10-sci-2', number: 2, titleHindi: 'धातु एवं अधातु तथा कार्बन के यौगिक', titleEnglish: 'Metals, Non-Metals & Carbon Compounds', questions: [] },
        { id: 'c10-sci-3', number: 3, titleHindi: 'जैव प्रक्रम तथा नियंत्रण एवं समन्वय', titleEnglish: 'Life Processes, Control and Coordination', questions: [] },
        { id: 'c10-sci-4', number: 4, titleHindi: 'प्रकाश: परावर्तन तथा अपवर्तन', titleEnglish: 'Light: Reflection and Refraction', questions: [] },
        { id: 'c10-sci-5', number: 5, titleHindi: 'विद्युत एवं चुंबकीय प्रभाव', titleEnglish: 'Electricity & Magnetic Effects of Current', questions: [] },
      ],
    },
    {
      id: 'Social Science',
      nameEnglish: 'Social Science',
      nameHindi: 'सामाजिक विज्ञान',
      icon: '🌍',
      chapters: [
        { id: 'c10-sst-1', number: 1, titleHindi: 'भारत में राष्ट्रवाद', titleEnglish: 'Nationalism in India', questions: [] },
        { id: 'c10-sst-2', number: 2, titleHindi: 'संसाधन, वन, जल एवं कृषि', titleEnglish: 'Resources, Water & Agriculture', questions: [] },
        { id: 'c10-sst-3', number: 3, titleHindi: 'सत्ता की साझेदारी एवं संघवाद', titleEnglish: 'Power Sharing & Federalism', questions: [] },
        { id: 'c10-sst-4', number: 4, titleHindi: 'भारतीय अर्थव्यवस्था के क्षेत्रक एवं मुद्रा', titleEnglish: 'Sectors of Indian Economy & Money', questions: [] },
      ],
    },
    {
      id: 'English',
      nameEnglish: 'English',
      nameHindi: 'अंग्रेजी',
      icon: '📘',
      chapters: [
        { id: 'c10-eng-1', number: 1, titleHindi: 'First Flight: A Letter to God & Nelson Mandela', titleEnglish: 'First Flight Prose & Poetry', questions: [] },
        { id: 'c10-eng-2', number: 2, titleHindi: 'Active/Passive Voice, Modals & Clauses', titleEnglish: 'Board Exam English Grammar', questions: [] },
      ],
    },
    {
      id: 'Hindi',
      nameEnglish: 'Hindi',
      nameHindi: 'हिन्दी',
      icon: '🪔',
      chapters: [
        { id: 'c10-hin-1', number: 1, titleHindi: 'क्षितिज भाग-2 (सूरदास के पद, राम-लक्ष्मण-परशुराम संवाद, नेताजी का चश्मा)', titleEnglish: 'Kshitij Part-2 Board Literature', questions: [] },
        { id: 'c10-hin-2', number: 2, titleHindi: 'रस, छंद, अलंकार एवं वाक्य भेद', titleEnglish: 'Ras, Chhand, Alankar & Vakya Bhed', questions: [] },
      ],
    },
    {
      id: 'Sanskrit',
      nameEnglish: 'Sanskrit',
      nameHindi: 'संस्कृत',
      icon: '🕉️',
      chapters: [
        { id: 'c10-san-1', number: 1, titleHindi: 'शेमुषी द्वितीयः भागः एवं सूक्तयः', titleEnglish: 'Shemushi Part-2 & Suktiyah', questions: [] },
        { id: 'c10-san-2', number: 2, titleHindi: 'समास, संधि, प्रत्यय एवं अव्यय प्रकरण', titleEnglish: 'Samas, Sandhi, Pratyaya & Avyaya', questions: [] },
      ],
    },
  ],
  '11': [
    {
      id: 'Physics',
      nameEnglish: 'Physics',
      nameHindi: 'भौतिक शास्त्र',
      icon: '⚡',
      stream: 'Science',
      chapters: [
        { id: 'c11-phy-1', number: 1, titleHindi: 'मात्रक एवं मापन तथा सरल रेखा में गति', titleEnglish: 'Units, Measurements & Motion in a Straight Line', questions: [] },
        { id: 'c11-phy-2', number: 2, titleHindi: 'गति के नियम एवं कार्य, ऊर्जा और शक्ति', titleEnglish: 'Laws of Motion, Work, Energy and Power', questions: [] },
        { id: 'c11-phy-3', number: 3, titleHindi: 'ऊष्मागतिकी एवं दोलन', titleEnglish: 'Thermodynamics & Oscillations', questions: [] },
      ],
    },
    {
      id: 'Chemistry',
      nameEnglish: 'Chemistry',
      nameHindi: 'रसायन शास्त्र',
      icon: '🧪',
      stream: 'Science',
      chapters: [
        { id: 'c11-chem-1', number: 1, titleHindi: 'रसायन विज्ञान की मूल अवधारणाएँ एवं परमाणु संरचना', titleEnglish: 'Basic Concepts of Chemistry & Structure of Atom', questions: [] },
        { id: 'c11-chem-2', number: 2, titleHindi: 'तत्वों का वर्गीकरण एवं रासायनिक आबंधन', titleEnglish: 'Periodic Classification & Chemical Bonding', questions: [] },
        { id: 'c11-chem-3', number: 3, titleHindi: 'कार्बनिक रसायन: आधारभूत सिद्धांत एवं हाइड्रोकार्बन', titleEnglish: 'Organic Chemistry Principles & Hydrocarbons', questions: [] },
      ],
    },
    {
      id: 'Biology',
      nameEnglish: 'Biology',
      nameHindi: 'जीव विज्ञान',
      icon: '🧬',
      stream: 'Science',
      chapters: [
        { id: 'c11-bio-1', number: 1, titleHindi: 'जीव जगत का वर्गीकरण एवं वनस्पति/प्राणि जगत', titleEnglish: 'Biological Classification, Plant & Animal Kingdom', questions: [] },
        { id: 'c11-bio-2', number: 2, titleHindi: 'कोशिका संरचना एवं कोशिका चक्र', titleEnglish: 'Cell Structure, Biomolecules & Cell Division', questions: [] },
        { id: 'c11-bio-3', number: 3, titleHindi: 'पादप एवं मानव शरीर क्रिया विज्ञान', titleEnglish: 'Plant & Human Physiology', questions: [] },
      ],
    },
    {
      id: 'Mathematics',
      nameEnglish: 'Mathematics',
      nameHindi: 'उच्च गणित',
      icon: '📐',
      stream: 'Science',
      chapters: [
        { id: 'c11-math-1', number: 1, titleHindi: 'समुच्चय, संबंध एवं फलन', titleEnglish: 'Sets, Relations and Functions', questions: [] },
        { id: 'c11-math-2', number: 2, titleHindi: 'त्रिकोणमितीय फलन एवं सम्मिश्र संख्याएँ', titleEnglish: 'Trigonometric Functions & Complex Numbers', questions: [] },
        { id: 'c11-math-3', number: 3, titleHindi: 'सीमा और अवकलज (कलन)', titleEnglish: 'Limits and Derivatives', questions: [] },
      ],
    },
    {
      id: 'History',
      nameEnglish: 'History',
      nameHindi: 'इतिहास',
      icon: '🏛️',
      stream: 'Arts',
      chapters: [
        { id: 'c11-his-1', number: 1, titleHindi: 'लेखन कला और शहरी जीवन (मेसोपोटामिया)', titleEnglish: 'Writing and City Life (Mesopotamia)', questions: [] },
        { id: 'c11-his-2', number: 2, titleHindi: 'तीन महाद्वीपों में फैला साम्राज्य एवं बदलती सांस्कृतिक परंपराएँ', titleEnglish: 'An Empire Across Three Continents & Cultural Traditions', questions: [] },
      ],
    },
    {
      id: 'Political Science',
      nameEnglish: 'Political Science',
      nameHindi: 'राजनीति विज्ञान',
      icon: '⚖️',
      stream: 'Arts',
      chapters: [
        { id: 'c11-pol-1', number: 1, titleHindi: 'भारतीय संविधान: अधिकार, चुनाव एवं कार्यपालिका', titleEnglish: 'Indian Constitution at Work: Rights & Executive', questions: [] },
        { id: 'c11-pol-2', number: 2, titleHindi: 'विधायिका, न्यायपालिका एवं संघवाद', titleEnglish: 'Legislature, Judiciary & Federalism', questions: [] },
      ],
    },
    {
      id: 'Geography',
      nameEnglish: 'Geography',
      nameHindi: 'भूगोल',
      icon: '🗺️',
      stream: 'Arts',
      chapters: [
        { id: 'c11-geo-1', number: 1, titleHindi: 'भौतिक भूगोल के मूल सिद्धांत (पृथ्वी की आंतरिक संरचना एवं वायुमंडल)', titleEnglish: 'Fundamentals of Physical Geography', questions: [] },
        { id: 'c11-geo-2', number: 2, titleHindi: 'भारत: भौतिक पर्यावरण, अपवाह तंत्र एवं जलवायु', titleEnglish: 'India: Physical Environment & Climate', questions: [] },
      ],
    },
    {
      id: 'Economics',
      nameEnglish: 'Economics',
      nameHindi: 'अर्थशास्त्र',
      icon: '📊',
      stream: 'Arts',
      chapters: [
        { id: 'c11-eco-1', number: 1, titleHindi: 'अर्थशास्त्र में सांख्यिकी (आँकड़ों का संग्रह एवं केंद्रीय प्रवृत्ति)', titleEnglish: 'Statistics for Economics (Central Tendency)', questions: [] },
        { id: 'c11-eco-2', number: 2, titleHindi: 'भारतीय अर्थव्यवस्था का विकास (आर्थिक सुधार, निर्धनता एवं ग्रामीण विकास)', titleEnglish: 'Indian Economic Development', questions: [] },
      ],
    },
  ],
  '12': [
    {
      id: 'Physics',
      nameEnglish: 'Physics',
      nameHindi: 'भौतिक शास्त्र',
      icon: '⚡',
      stream: 'Science',
      chapters: [
        { id: 'c12-phy-1', number: 1, titleHindi: 'स्थिर वैद्युतिकी एवं विद्युत धारा', titleEnglish: 'Electrostatics & Current Electricity', questions: [] },
        { id: 'c12-phy-2', number: 2, titleHindi: 'गतिमान आवेश, चुंबकत्व एवं विद्युतचुंबकीय प्रेरण', titleEnglish: 'Magnetism & Electromagnetic Induction', questions: [] },
        { id: 'c12-phy-3', number: 3, titleHindi: 'किरण एवं तरंग प्रकाशिकी तथा अर्धचालक इलेक्ट्रॉनिकी', titleEnglish: 'Optics & Semiconductor Electronics', questions: [] },
      ],
    },
    {
      id: 'Chemistry',
      nameEnglish: 'Chemistry',
      nameHindi: 'रसायन शास्त्र',
      icon: '🧪',
      stream: 'Science',
      chapters: [
        { id: 'c12-chem-1', number: 1, titleHindi: 'विलयन, वैद्युत रसायन एवं रासायनिक बलगतिकी', titleEnglish: 'Solutions, Electrochemistry & Chemical Kinetics', questions: [] },
        { id: 'c12-chem-2', number: 2, titleHindi: 'd एवं f ब्लॉक के तत्व तथा उपसहसंयोजन यौगिक', titleEnglish: 'd & f Block Elements and Coordination Compounds', questions: [] },
        { id: 'c12-chem-3', number: 3, titleHindi: 'ऐल्कोहॉल, फीनॉल, ऐल्डिहाइड, कीटोन एवं जैव-अणु', titleEnglish: 'Organic Compounds & Biomolecules', questions: [] },
      ],
    },
    {
      id: 'Biology',
      nameEnglish: 'Biology',
      nameHindi: 'जीव विज्ञान',
      icon: '🧬',
      stream: 'Science',
      chapters: [
        { id: 'c12-bio-1', number: 1, titleHindi: 'पुष्पी पादपों एवं मानव में जनन', titleEnglish: 'Reproduction in Flowering Plants & Humans', questions: [] },
        { id: 'c12-bio-2', number: 2, titleHindi: 'वंशागति के सिद्धांत एवं आणविक आधार (DNA/RNA)', titleEnglish: 'Principles & Molecular Basis of Inheritance', questions: [] },
        { id: 'c12-bio-3', number: 3, titleHindi: 'जैव प्रौद्योगिकी एवं पारिस्थितिकी', titleEnglish: 'Biotechnology, Ecology & Human Welfare', questions: [] },
      ],
    },
    {
      id: 'Mathematics',
      nameEnglish: 'Mathematics',
      nameHindi: 'उच्च गणित',
      icon: '📐',
      stream: 'Science',
      chapters: [
        { id: 'c12-math-1', number: 1, titleHindi: 'संबंध एवं फलन, आव्यूह तथा सारणिक', titleEnglish: 'Relations, Matrices and Determinants', questions: [] },
        { id: 'c12-math-2', number: 2, titleHindi: 'सांतत्य, अवकलनीयता एवं समाकलन (Calculus)', titleEnglish: 'Continuity, Differentiability & Integrals', questions: [] },
        { id: 'c12-math-3', number: 3, titleHindi: 'सदिश बीजगणित, त्रि-विमीय ज्यामिति एवं प्रायिकता', titleEnglish: 'Vectors, 3D Geometry & Probability', questions: [] },
      ],
    },
    {
      id: 'History',
      nameEnglish: 'History',
      nameHindi: 'इतिहास',
      icon: '🏛️',
      stream: 'Arts',
      chapters: [
        { id: 'c12-his-1', number: 1, titleHindi: 'ईंटें, मनके तथा अस्थियाँ (हड़प्पा सभ्यता) एवं मौर्य/गुप्त काल', titleEnglish: 'Harappan Civilisation, Kings, Farmers and Towns', questions: [] },
        { id: 'c12-his-2', number: 2, titleHindi: 'भक्ति-सूफी परंपराएँ एवं 1857 का विद्रोह तथा महात्मा गांधी', titleEnglish: 'Bhakti-Sufi Traditions, 1857 Revolt & Nationalist Movement', questions: [] },
      ],
    },
    {
      id: 'Political Science',
      nameEnglish: 'Political Science',
      nameHindi: 'राजनीति विज्ञान',
      icon: '⚖️',
      stream: 'Arts',
      chapters: [
        { id: 'c12-pol-1', number: 1, titleHindi: 'समकालीन विश्व राजनीति (द्विध्रुवीयता का अंत एवं अंतर्राष्ट्रीय संगठन)', titleEnglish: 'Contemporary World Politics & International Organizations', questions: [] },
        { id: 'c12-pol-2', number: 2, titleHindi: 'स्वतंत्र भारत में राजनीति (राष्ट्र निर्माण की चुनौतियाँ एवं नियोजित विकास)', titleEnglish: 'Politics in India Since Independence', questions: [] },
      ],
    },
    {
      id: 'Geography',
      nameEnglish: 'Geography',
      nameHindi: 'भूगोल',
      icon: '🗺️',
      stream: 'Arts',
      chapters: [
        { id: 'c12-geo-1', number: 1, titleHindi: 'मानव भूगोल के मूल सिद्धांत (जनसंख्या, मानव विकास एवं क्रियाएँ)', titleEnglish: 'Fundamentals of Human Geography', questions: [] },
        { id: 'c12-geo-2', number: 2, titleHindi: 'भारत: लोग और अर्थव्यवस्था (जल संसाधन, खनिज, ऊर्जा एवं परिवहन)', titleEnglish: 'India: People and Economy', questions: [] },
      ],
    },
    {
      id: 'Economics',
      nameEnglish: 'Economics',
      nameHindi: 'अर्थशास्त्र',
      icon: '📊',
      stream: 'Arts',
      chapters: [
        { id: 'c12-eco-1', number: 1, titleHindi: 'व्यष्टि अर्थशास्त्र (उपभोक्ता व्यवहार, मांग एवं बाजार संतुलन)', titleEnglish: 'Introductory Microeconomics', questions: [] },
        { id: 'c12-eco-2', number: 2, titleHindi: 'समष्टि अर्थशास्त्र (राष्ट्रीय आय, मुद्रा, बैंकिंग एवं सरकारी बजट)', titleEnglish: 'Introductory Macroeconomics', questions: [] },
      ],
    },
  ],
};
