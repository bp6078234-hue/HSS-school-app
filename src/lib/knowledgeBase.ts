/**
 * Official School Information & Grounding Data
 * Strictly parsed from School_Information.txt and AI_Chatbot_Instructions.txt
 */

export const OFFICIAL_SCHOOL_INFO = {
  hindiName: "शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव",
  englishName: "Government Higher Secondary School, Ahamdpur, Khaigaon",
  district: "खंडवा (Khandwa), मध्य प्रदेश (Madhya Pradesh)",
  establishedHighSchool: "1984",
  upgradedHigherSecondary: "2006",
  institutionCode: "561033",
  udiseCode: "23290300210",
  officialEmail: "hss.ahmedpur.khd.mp@gmail.com",
  schoolTimings: "सुबह 10:30 बजे से शाम 4:30 बजे तक (10:30 AM to 4:30 PM)",
  principal: {
    name: "श्री अनिल कुमार बारोले (Anil Kumar Barole)",
    contact: "9977359533"
  },
  classes: [
    { class: "9th", note: "दो sections हैं - एक Girls section और एक Boys section।", classTeacherGirls: "Bhusare Mam", classTeacherBoys: "जानकारी अभी उपलब्ध नहीं है।" },
    { class: "10th", note: "कक्षा 10वीं", classTeacher: "Rashmi Gupta" },
    { class: "11th", note: "Science & Arts Streams", scienceTeacher: "Shital Bhausar", artsTeacher: "Gitanjali Sakawar" },
    { class: "12th", note: "Science & Arts Streams", scienceTeacher: "Vinita Choudhary", artsTeacher: "Puja Parashar" }
  ],
  streams11and12: ["Science (Mathematics & Biology)", "Arts", "Commerce"],
  subjectTeachers: [
    { subject: "Chemistry (रसायन विज्ञान)", teachers: ["Nisha Tirole"] },
    { subject: "Physics (भौतिक विज्ञान)", teachers: ["Shital Bhausar"] },
    { subject: "Mathematics (गणित)", teachers: ["Nabila Kureshi", "Anil Barole"] },
    { subject: "Biology (जीव विज्ञान)", teachers: ["Vinita Choudhary", "Purva Vishwakarma"] },
    { subject: "Hindi (हिन्दी)", teachers: ["Rashmi Gupta", "Mradula Mam", "Masani Sir"] },
    { subject: "English (अंग्रेजी)", teachers: ["Neela Soni", "Puja Parashar"] },
    { subject: "Sanskrit (संस्कृत)", teachers: ["Bhusare Mam"] },
    { subject: "Geography (भूगोल)", teachers: ["Manoj Patel Sir"] },
    { subject: "History (इतिहास)", teachers: ["Monika Kirar"] },
    { subject: "Political Science (राजनीति विज्ञान)", teachers: ["Priti Pathak"] },
    { subject: "Economics (अर्थशास्त्र)", teachers: ["Gitanjali Sakawar"] }
  ],
  admissionDocuments: [
    "1. विगत वर्ष परीक्षा अंकसूची (Previous Year Marksheet)",
    "2. स्थानांतरण प्रमाण पत्र - टी.सी. मूल प्रति (Transfer Certificate - TC)",
    "3. जाति प्रमाण पत्र (Caste Certificate)",
    "4. आय प्रमाण पत्र - 3 वर्ष से अधिक पुराना नहीं (Income Certificate)",
    "5. बैंक पासबुक छायाप्रति (Bank Passbook)",
    "6. आधार कार्ड (Aadhaar Card)",
    "7. समग्र आईडी (Samagra ID)",
    "8. ए.पी.एल./बी.पी.एल. कार्ड (APL/BPL Card, if applicable)",
    "9. दिव्यांग प्रमाण पत्र (Disability Certificate, if applicable)",
    "10. म.प्र. भवन एवं अन्य संनिर्माण कर्मकार कार्ड (Karmakar Card, if applicable)",
    "11. पासपोर्ट साइज फोटो – 2 (Passport Photos with name & date)",
    "12. अपार आईडी प्रमाण पत्र (APAAR ID Certificate)",
    "13. लाड़ली लक्ष्मी प्रमाण पत्र (Ladli Laxmi Certificate, if applicable)",
    "14. संबल प्रमाण पत्र (Sambal Certificate, if applicable)"
  ],
  schoolRules: [
    "1. स्कूल के सभी नियमों का पालन करना अनिवार्य है।",
    "2. विद्यार्थियों को नियमित रूप से समय पर विद्यालय आकर अध्यापन कार्य करना होगा।",
    "3. कक्षा में 75% से अधिक नियमित उपस्थिति अनिवार्य है, अन्यथा वार्षिक परीक्षा से वंचित रखा जा सकता है।",
    "4. अनुशासनहीनता करने पर नोटिस के बाद टी.सी. प्रदान कर विद्यालय से निष्कासित किया जा सकता है।",
    "5. शाला की किसी भी संपत्ति को नुकसान नहीं पहुँचाएंगे।",
    "6. विद्यार्थियों को त्रैमासिक, अर्द्धवार्षिक, प्री-बोर्ड व वार्षिक परीक्षाओं में सम्मिलित होना अनिवार्य होगा।",
    "7. विद्यार्थी को शाला में प्रत्येक कालखण्ड में उपस्थित होना व शाला समय पश्चात ही विद्यालय छोड़ना होगा।",
    "8. शाला समय में शालीनता से व्यवहार करना व अनुशासन में रहना होगा।",
    "9. संस्था द्वारा आयोजित शिक्षक-पालक संघ की बैठक में मेरे परिवार का कोई भी सदस्य अनिवार्यतः उपस्थित रहेगा।",
    "10. संस्था द्वारा विद्यार्थियों व संस्था हित में लिए गए सभी निर्णयों का पालन करना होगा।",
    "11. मैं विद्यालय द्वारा आयोजित शैक्षणिक, सह-शैक्षणिक व अन्य गतिविधियों में भाग लूंगा/लूंगी।",
    "12. विद्यालय में विद्यार्थियों को मोबाइल लाना पूर्णतः प्रतिबंधित है।"
  ],
  facilities: [
    {
      id: "library",
      title: "School Library (पुस्तकालय)",
      category: "Library" as const,
      desc: "Well-stocked school library with NCERT books, reference materials, newspapers, and quiet reading space for students."
    },
    {
      id: "physics-lab",
      title: "Physics Lab (भौतिकी प्रयोगशाला)",
      category: "Lab" as const,
      desc: "Equipped with optical benches, electrical circuits, and apparatus for Class 9th to 12th practical physics experiments."
    },
    {
      id: "chemistry-lab",
      title: "Chemistry Lab (रसायन प्रयोगशाला)",
      category: "Lab" as const,
      desc: "Equipped with titration stations, reagents, and safety apparatus for practical chemistry experiments."
    },
    {
      id: "biology-lab",
      title: "Biology Lab (जीव विज्ञान प्रयोगशाला)",
      category: "Lab" as const,
      desc: "Equipped with compound microscopes, anatomical models, botanical specimens, and lab charts."
    },
    {
      id: "ict-lab",
      title: "ICT Computer Lab (कंप्यूटर लैब)",
      category: "Lab" as const,
      desc: "Modern computer laboratory used for ICT digital education, online assessments, and vocational classes."
    },
    {
      id: "maths-lab",
      title: "Mathematics Lab (गणित प्रयोगशाला)",
      category: "Lab" as const,
      desc: "Hands-on 3D geometric models, measurement kits, and visual tools for interactive mathematics learning."
    },
    {
      id: "smart-classroom",
      title: "Smart Classroom (स्मार्ट क्लासरूम)",
      category: "Classroom" as const,
      desc: "Audio-visual classroom fitted with an interactive digital smart board for engaging multimedia lessons."
    },
    {
      id: "playground",
      title: "Playground (खेल मैदान)",
      category: "Campus" as const,
      desc: "Spacious open ground for sports tournaments, physical education, yoga, and daily morning assembly."
    }
  ],
  vocationalCourses: ["Beauty & Wellness", "Healthcare"],
  feePolicyNotice: "मेरे पास विद्यालय की fees की verified जानकारी उपलब्ध नहीं है। कृपया fees की सही जानकारी के लिए विद्यालय कार्यालय से संपर्क करें।"
};
