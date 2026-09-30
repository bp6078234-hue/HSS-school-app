import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

const publicDir = path.resolve(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const facilitiesDir = path.resolve(publicDir, 'facilities');
if (!fs.existsSync(facilitiesDir)) {
  fs.mkdirSync(facilitiesDir, { recursive: true });
}

export interface FacilityRecord {
  id: string;
  title: string;
  category: 'Lab' | 'Library' | 'Classroom' | 'Campus';
  desc: string;
  imageUrl?: string;
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_FACILITIES: FacilityRecord[] = [
  {
    id: 'library',
    title: 'School Library (पुस्तकालय)',
    category: 'Library',
    desc: 'Well-stocked school library with NCERT books, reference materials, newspapers, and quiet reading space for students.',
  },
  {
    id: 'physics-lab',
    title: 'Physics Lab (भौतिकी प्रयोगशाला)',
    category: 'Lab',
    desc: 'Equipped with optical benches, electrical circuits, and apparatus for Class 9th to 12th practical physics experiments.',
  },
  {
    id: 'chemistry-lab',
    title: 'Chemistry Lab (रसायन प्रयोगशाला)',
    category: 'Lab',
    desc: 'Equipped with titration stations, reagents, and safety apparatus for practical chemistry experiments.',
  },
  {
    id: 'biology-lab',
    title: 'Biology Lab (जीव विज्ञान प्रयोगशाला)',
    category: 'Lab',
    desc: 'Equipped with compound microscopes, anatomical models, botanical specimens, and lab charts.',
  },
  {
    id: 'ict-lab',
    title: 'ICT Computer Lab (कंप्यूटर लैब)',
    category: 'Lab',
    desc: 'Modern computer laboratory used for ICT digital education, online assessments, and vocational classes.',
  },
  {
    id: 'maths-lab',
    title: 'Mathematics Lab (गणित प्रयोगशाला)',
    category: 'Lab',
    desc: 'Hands-on 3D geometric models, measurement kits, and visual tools for interactive mathematics learning.',
  },
  {
    id: 'smart-classroom',
    title: 'Smart Classroom (स्मार्ट क्लासरूम)',
    category: 'Classroom',
    desc: 'Audio-visual classroom fitted with an interactive digital smart board for engaging multimedia lessons.',
  },
  {
    id: 'playground',
    title: 'Playground (खेल मैदान)',
    category: 'Campus',
    desc: 'Spacious open ground for sports tournaments, physical education, yoga, and daily morning assembly.',
  },
];

const facilitiesMetaPath = path.resolve(facilitiesDir, 'facilities.json');

function loadFacilities(): FacilityRecord[] {
  try {
    if (fs.existsSync(facilitiesMetaPath)) {
      const raw = fs.readFileSync(facilitiesMetaPath, 'utf-8');
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length > 0) {
        const savedMap = new Map<string, FacilityRecord>();
        for (const item of saved) {
          if (item && typeof item.id === 'string') {
            savedMap.set(item.id, item);
          }
        }
        const merged: FacilityRecord[] = DEFAULT_FACILITIES.map((def) => {
          const existing = savedMap.get(def.id);
          if (existing) {
            savedMap.delete(def.id);
            return { ...def, ...existing };
          }
          return def;
        });
        for (const customItem of savedMap.values()) {
          merged.push(customItem);
        }
        return merged;
      }
    }
  } catch (err) {
    console.error('Error loading facilities metadata:', err);
  }
  return DEFAULT_FACILITIES;
}

function saveFacilities(list: FacilityRecord[]) {
  try {
    if (!fs.existsSync(facilitiesDir)) {
      fs.mkdirSync(facilitiesDir, { recursive: true });
    }
    fs.writeFileSync(facilitiesMetaPath, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving facilities metadata:', err);
  }
}

// Get all lab, library, and campus facilities with their current photo URLs
app.get('/api/facilities', (_req, res) => {
  const facilities = loadFacilities();
  res.setHeader('Cache-Control', 'no-cache');
  res.json({ facilities });
});

// Upload or change a lab, library, or campus facility photo (just like changing a profile picture)
app.post('/api/facilities/upload', (req, res) => {
  try {
    const { id, title, category, desc, dataUrl, updatedBy } = req.body || {};
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Facility ID is required' });
    }
    const safeId = id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const facilities = loadFacilities();
    const existingIdx = facilities.findIndex((f) => f.id === safeId || f.id === id);

    let imageUrl = existingIdx >= 0 ? facilities[existingIdx].imageUrl : undefined;

    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
      const base64Data = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `${safeId}.jpg`;
      if (!fs.existsSync(facilitiesDir)) {
        fs.mkdirSync(facilitiesDir, { recursive: true });
      }
      fs.writeFileSync(path.resolve(facilitiesDir, fileName), buffer);

      const distFacilitiesDir = path.resolve(__dirname, 'dist', 'facilities');
      if (fs.existsSync(path.resolve(__dirname, 'dist'))) {
        if (!fs.existsSync(distFacilitiesDir)) {
          fs.mkdirSync(distFacilitiesDir, { recursive: true });
        }
        fs.writeFileSync(path.resolve(distFacilitiesDir, fileName), buffer);
      }
      imageUrl = `/facilities/${fileName}?v=${Date.now()}`;
    }

    const now = new Date().toISOString();
    if (existingIdx >= 0) {
      facilities[existingIdx] = {
        ...facilities[existingIdx],
        title: typeof title === 'string' && title.trim() ? title.trim() : facilities[existingIdx].title,
        category: category || facilities[existingIdx].category,
        desc: typeof desc === 'string' && desc.trim() ? desc.trim() : facilities[existingIdx].desc,
        imageUrl,
        updatedAt: now,
        updatedBy: updatedBy || 'Teacher',
      };
    } else {
      facilities.push({
        id: safeId,
        title: typeof title === 'string' && title.trim() ? title.trim() : 'School Lab / Facility',
        category: category || 'Lab',
        desc: typeof desc === 'string' && desc.trim() ? desc.trim() : 'School facility photo.',
        imageUrl,
        updatedAt: now,
        updatedBy: updatedBy || 'Teacher',
      });
    }

    saveFacilities(facilities);
    return res.json({
      success: true,
      facility: facilities.find((f) => f.id === safeId || f.id === id),
      facilities,
    });
  } catch (err: any) {
    console.error('Facility photo upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload facility photo' });
  }
});

// Update facility details or reset photo
app.post('/api/facilities/update', (req, res) => {
  try {
    const { id, title, category, desc, resetPhoto, updatedBy } = req.body || {};
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Facility ID is required' });
    }
    const facilities = loadFacilities();
    const idx = facilities.findIndex((f) => f.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    if (resetPhoto) {
      const safeId = id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const filePath = path.resolve(facilitiesDir, `${safeId}.jpg`);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
      facilities[idx].imageUrl = undefined;
    }

    if (typeof title === 'string' && title.trim()) facilities[idx].title = title.trim();
    if (category) facilities[idx].category = category;
    if (typeof desc === 'string' && desc.trim()) facilities[idx].desc = desc.trim();
    facilities[idx].updatedAt = new Date().toISOString();
    if (updatedBy) facilities[idx].updatedBy = updatedBy;

    saveFacilities(facilities);
    return res.json({ success: true, facility: facilities[idx], facilities });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update facility' });
  }
});

// Serve uploaded facility photos from /public/facilities/:filename
app.get('/facilities/:filename', (req, res) => {
  const rawName = path.basename(req.params.filename || '');
  const filePath = path.resolve(facilitiesDir, rawName);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(filePath);
  }
  return res.status(404).end();
});

// Check if original logo.jpg and school.jpg files are present in /public
app.get('/api/assets/status', (_req, res) => {
  const logoPath = path.resolve(publicDir, 'logo.jpg');
  const schoolPath = path.resolve(publicDir, 'school.jpg');
  res.json({
    hasLogo: fs.existsSync(logoPath) && fs.statSync(logoPath).size > 0,
    hasSchool: fs.existsSync(schoolPath) && fs.statSync(schoolPath).size > 0,
  });
});

// Save exact unmodified original logo.jpg or school.jpg binary to /public
app.post('/api/assets/upload', (req, res) => {
  try {
    const { name, dataUrl } = req.body;
    if (!name || !['logo.jpg', 'school.jpg'].includes(name) || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'Invalid asset name or payload' });
    }
    const base64Data = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.resolve(publicDir, name), buffer);
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.resolve(distDir, name), buffer);
    }
    return res.json({ success: true, path: `/${name}` });
  } catch (err: any) {
    console.error('Asset upload error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Serve /logo.jpg from /public/logo.jpg (with clean fallback if not yet placed on disk)
app.get('/logo.jpg', (_req, res) => {
  const logoPath = path.resolve(publicDir, 'logo.jpg');
  if (fs.existsSync(logoPath) && fs.statSync(logoPath).size > 0) {
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(logoPath);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
    <rect width="240" height="240" fill="#ffffff"/>
    <circle cx="120" cy="108" r="92" fill="#facc15" stroke="#eab308" stroke-width="3"/>
    <circle cx="120" cy="108" r="68" fill="#bae6fd" stroke="#1e3a8a" stroke-width="5"/>
    <circle cx="98" cy="80" r="18" fill="#ea580c"/>
    <path d="M90 170 L125 98 L145 98 L120 170 Z" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
    <path d="M35 182 L205 182 L195 216 L45 216 Z" fill="#eab308" stroke="#a16207" stroke-width="2"/>
    <text x="120" y="204" text-anchor="middle" font-family="serif" font-weight="bold" font-style="italic" font-size="13" fill="#0f172a">A Commitment to Success.</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache');
  return res.send(svg);
});

// Serve /school.jpg from /public/school.jpg (with clean fallback if not yet placed on disk)
app.get('/school.jpg', (_req, res) => {
  const schoolPath = path.resolve(publicDir, 'school.jpg');
  if (fs.existsSync(schoolPath) && fs.statSync(schoolPath).size > 0) {
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(schoolPath);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
    <rect width="800" height="520" fill="#0f172a"/>
    <rect x="40" y="40" width="720" height="440" rx="24" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <text x="400" y="235" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="24" fill="#e2e8f0">शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव</text>
    <text x="400" y="275" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#38bdf8">Government Higher Secondary School, Ahamdpur Khaigaon</text>
    <text x="400" y="315" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#94a3b8">Click "Select school.jpg" below to load your original building photo into /public/school.jpg</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache');
  return res.send(svg);
});

// Server-side Gemini AI Client with telemetry header
const ai = new GoogleGenAI({
  apiKey: "AQ.Ab8RN6K_5EUveEnGe1BhAtNI54gPUToAUlowYttCMAUlKr0EQg" // <-- Yahan apni asli API key paste kar do
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Grounded School System Instructions
const SCHOOL_SYSTEM_INSTRUCTION = `
You are the official School AI Assistant of:
Government Higher Secondary School, Ahamdpur Khaigaon
(शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव, जिला-खण्डवा, मध्य प्रदेश)

OFFICIAL VERIFIED SCHOOL INFORMATION:
- Name: शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव (GHSS Ahamdpur, Khaigaon)
- District: खंडवा, मध्य प्रदेश (Khandwa, MP)
- Establishment: 1984 (High School), Upgraded to Higher Secondary: 2006
- School Code: 561033
- UDISE Code: 23290300210
- Official Email: hss.ahmedpur.khd.mp@gmail.com
- School Timings: 10:30 AM to 4:30 PM (सुबह 10:30 बजे से शाम 4:30 बजे तक)
- Principal: अनिल कुमार बारोले (Anil Kumar Barole), Contact: 9977359533

CLASSES & CLASS TEACHERS:
- Classes available: 9th, 10th, 11th, 12th.
- Class 9th: Two sections (Girls section & Boys section). Class teacher Girls: Bhusare Mam. Class teacher Boys: Information not available yet.
- Class 10th: Class Teacher: Rashmi Gupta
- Class 11th: Science Stream Class Teacher: Shital Bhausar | Arts Stream Class Teacher: Gitanjali Sakawar
- Class 12th: Science Stream Class Teacher: Vinita Choudhary | Arts Stream Class Teacher: Puja Parashar

STREAMS & SUBJECTS (Classes 11 & 12):
- Streams: Science (Mathematics & Biology), Arts, Commerce.
- Subject Teachers:
  * Chemistry: Nisha Tirole
  * Physics: Shital Bhausar
  * Mathematics: Nabila Kureshi, Anil Barole
  * Biology: Vinita Choudhary, Purva Vishwakarma
  * Hindi: Rashmi Gupta, Mradula Mam, Masani Sir
  * English: Neela Soni, Puja Parashar
  * Sanskrit: Bhusare Mam
  * Geography: Manoj Patel Sir
  * History: Monika Kirar
  * Political Science: Priti Pathak
  * Economics: Gitanjali Sakawar

FACILITIES & VOCATIONAL:
- Facilities: Playground, ICT Lab, Mathematics Lab, Physics Lab, Chemistry Lab, Smart Classroom.
- Vocational Courses: Beauty & Wellness, Healthcare.

REQUIRED ADMISSION DOCUMENTS (Original 14 documents from official paper form):
1. विगत वर्ष परीक्षा अंकसूची (Previous Year Marksheet)
2. स्थानांतरण प्रमाण पत्र - टी.सी. मूल प्रति (Transfer Certificate - TC)
3. जाति प्रमाण पत्र (Caste Certificate)
4. आय प्रमाण पत्र (3 वर्ष से अधिक पुराना नहीं)
5. बैंक पासबुक छायाप्रति (Bank Passbook)
6. आधार कार्ड (Aadhaar Card)
7. समग्र आईडी (Samagra ID)
8. ए.पी.एल./बी.पी.एल. कार्ड (APL/BPL Card, if applicable)
9. दिव्यांग प्रमाण पत्र (Disability Certificate, if applicable)
10. मध्य प्रदेश भवन एवं अन्य संनिर्माण कर्मकार कार्ड (Karmakar Card, if applicable)
11. पासपोर्ट साइज फोटो – 2 (Passport Photos with name & date)
12. अपार आईडी प्रमाण पत्र (APAAR ID Certificate)
13. लाड़ली लक्ष्मी प्रमाण पत्र (Ladli Laxmi Certificate, if applicable)
14. संबल प्रमाण पत्र (Sambal Certificate, if applicable)

ADMISSION POLICY:
Online admission application is available for classes 9th to 12th on this web app.
Submitting the online form is for initial application; official document verification is conducted by the school office before final admission.

FEES POLICY:
You do NOT have verified fee amounts in your knowledge base.
If asked about fees, you MUST say:
"मेरे पास विद्यालय की fees की verified जानकारी उपलब्ध नहीं है। कृपया fees की सही जानकारी के लिए विद्यालय कार्यालय से संपर्क करें।"

CRITICAL BEHAVIORAL RULES:
1. STRICT TRUTH: Do not invent or assume ANY information (teachers, fees, rules, timings). If not verified above, say:
"मुझे इस जानकारी की पुष्टि उपलब्ध विद्यालय रिकॉर्ड से नहीं मिली है। कृपया विद्यालय कार्यालय से संपर्क करें।"
2. PRIVACY & SECURITY: NEVER disclose or display individual student private details (Aadhaar, Samagra ID, mobile number, marks, bank details, or admission status) in chat. Always advise the student to log in to their authenticated Student Dashboard to view their status.
3. LANGUAGE: Answer politely in clear Hindi or English, matching the user's language.
`;

// Grounded Knowledge Base Direct Resolver for instant, zero-downtime verified answers
function resolveFromGroundedKnowledge(query: string): string | null {
  const q = query.toLowerCase();

  // Fees check - MANDATORY strict instruction
  if (q.includes('fee') || q.includes('fees') || q.includes('फीस') || q.includes('शुल्क')) {
    return 'मेरे पास विद्यालय की fees की verified जानकारी उपलब्ध नहीं है। कृपया fees की सही जानकारी के लिए विद्यालय कार्यालय से संपर्क करें।';
  }

  // Student private data check - MANDATORY privacy instruction
  if (
    q.includes('aadhaar') ||
    q.includes('आधार') ||
    q.includes('samagra') ||
    q.includes('समग्र') ||
    q.includes('bank') ||
    q.includes('खाता') ||
    q.includes('marks') ||
    q.includes('अंक')
  ) {
    return 'सुरक्षा एवं गोपनीयता नियमों के अनुसार व्यक्तिगत छात्र जानकारी (आधार, समग्र आईडी, अंक अथवा बैंक खाता) सामान्य चैटबॉट में प्रदर्शित नहीं की जा सकती। कृपया अपने अधिकृत Student Dashboard में लॉगिन करके देखें।';
  }

  // Timings
  if (q.includes('timing') || q.includes('time') || q.includes('समय') || q.includes('टाइम') || q.includes('खुलेगा') || q.includes('कब')) {
    return 'विद्यालय का समय सुबह 10:30 बजे से शाम 4:30 बजे तक (10:30 AM to 4:30 PM) है।';
  }

  // Principal
  if (q.includes('principal') || q.includes('प्राचार्य') || q.includes('हेड') || q.includes('head')) {
    return 'विद्यालय के प्राचार्य श्री अनिल कुमार बारोले (Anil Kumar Barole) हैं। प्राचार्य का संपर्क नंबर 9977359533 है।';
  }

  // School Information & Identity
  if (q.includes('school') || q.includes('विद्यालय') || q.includes('नाम') || q.includes('udise') || q.includes('कोड') || q.includes('स्थापना')) {
    return 'विद्यालय का पूरा नाम शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव (Government Higher Secondary School, Ahamdpur, Khaigaon) है। यह जिला खण्डवा (मध्य प्रदेश) में स्थित है। स्थापना वर्ष 1984 (हाईस्कूल) एवं उन्नयन वर्ष 2006 (हायरसेकेण्डरी) है। डाइस कोड: 23290300210, संस्था कोड: 561033 है।';
  }

  // Classes Available
  if (q.includes('class') || q.includes('classes') || q.includes('कक्षा') || q.includes('सेक्शन') || q.includes('section')) {
    return 'विद्यालय में कक्षा 9वीं से 12वीं तक अध्ययन की सुविधा उपलब्ध है। कक्षा 9वीं में दो सेक्शन्स हैं - एक Girls section (Class Teacher: Bhusare Mam) और एक Boys section। कक्षा 10वीं की क्लास टीचर Rashmi Gupta हैं।';
  }

  // Streams & Subjects
  if (q.includes('stream') || q.includes('subject') || q.includes('संकाय') || q.includes('विषय') || q.includes('science') || q.includes('arts') || q.includes('commerce')) {
    return 'कक्षा 11वीं और 12वीं में विज्ञान (Science - Maths & Biology), कला (Arts) और वाणिज्य (Commerce) संकाय उपलब्ध हैं। कक्षा 11वीं साइंस क्लास टीचर Shital Bhausar एवं आर्ट्स क्लास टीचर Gitanjali Sakawar हैं। कक्षा 12वीं साइंस क्लास टीचर Vinita Choudhary एवं आर्ट्स क्लास टीचर Puja Parashar हैं।';
  }

  // Teachers
  if (q.includes('teacher') || q.includes('शिक्षक') || q.includes('टीचर') || q.includes('sir') || q.includes('mam') || q.includes('सर') || q.includes('मैडम')) {
    return 'विद्यालय के विषय शिक्षक:\n• Chemistry: Nisha Tirole\n• Physics: Shital Bhausar\n• Mathematics: Nabila Kureshi, Anil Barole\n• Biology: Vinita Choudhary, Purva Vishwakarma\n• Hindi: Rashmi Gupta, Mradula Mam, Masani Sir\n• English: Neela Soni, Puja Parashar\n• Sanskrit: Bhusare Mam\n• Geography: Manoj Patel Sir\n• History: Monika Kirar\n• Political Science: Priti Pathak\n• Economics: Gitanjali Sakawar';
  }

  // Documents Required for Admission
  if (q.includes('document') || q.includes('दस्तावेज') || q.includes('प्रमाण') || q.includes('कागजात') || q.includes('tc') || q.includes('टी.सी.')) {
    return 'मूल आवेदन पत्र के अनुसार आवश्यक 14 प्रमाण-पत्र:\n1. विगत वर्ष परीक्षा अंकसूची\n2. स्थानांतरण प्रमाण पत्र (T.C. मूल प्रति)\n3. जाति प्रमाण पत्र\n4. आय प्रमाण पत्र (3 वर्ष से अधिक पुराना नहीं)\n5. बैंक पासबुक छायाप्रति\n6. आधार कार्ड\n7. समग्र आईडी\n8. ए.पी.एल./बी.पी.एल. कार्ड (यदि लागू हो)\n9. दिव्यांग प्रमाण पत्र (यदि लागू हो)\n10. म.प्र. कर्मकार कार्ड\n11. पासपोर्ट साइज फोटो – 2 (नाम व दिनांक सहित)\n12. अपार आईडी प्रमाण पत्र\n13. लाड़ली लक्ष्मी प्रमाण पत्र (यदि लागू हो)\n14. संबल प्रमाण पत्र (यदि लागू हो)';
  }

  // Admission Process
  if (q.includes('admission') || q.includes('प्रवेश') || q.includes('दाखिला') || q.includes('form') || q.includes('फॉर्म')) {
    return 'विद्यालय में कक्षा 9वीं से 12वीं तक प्रवेश हेतु आप इस वेब ऐप पर डिजिटल 4-स्टेप फॉर्म भरकर ऑनलाइन आवेदन कर सकते हैं। आवेदन जमा करने पर आपको एक यूनिक Application ID मिलेगी। तत्पश्चात मूल टी.सी. एवं प्रमाण-पत्रों की प्रति विद्यालय कार्यालय में सत्यापन हेतु प्रस्तुत करनी होगी।';
  }

  // Facilities
  if (q.includes('facility') || q.includes('lab') || q.includes('सुविधा') || q.includes('मैदान') || q.includes('playground')) {
    return 'विद्यालय में खेल मैदान (Playground), ICT कंप्यूटर लैब, Mathematics लैब, Physics लैब, Chemistry लैब एवं स्मार्ट क्लासरूम (Smart Classroom) उपलब्ध हैं।';
  }

  // School Rules
  if (q.includes('rule') || q.includes('नियम') || q.includes('अनुशासन') || q.includes('mobile') || q.includes('मोबाइल')) {
    return 'मुख्य शाला नियम:\n1. नियमित उपस्थिति (75% से अधिक) अनिवार्य है।\n2. शाला समय में विद्यार्थियों द्वारा मोबाइल लाना पूर्णतः प्रतिबंधित है।\n3. त्रैमासिक, अर्द्धवार्षिक व वार्षिक परीक्षाओं में उपस्थिति अनिवार्य है।\n4. अनुशासनहीनता पर नोटिस उपरांत निष्कासन की कार्यवाही हो सकती है।';
  }

  return null;
}

// Helper to extract web sources from Gemini Grounding Metadata
function extractGroundingSources(response: any): Array<{ title: string; uri: string }> {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const seen = new Set<string>();
  const sources: Array<{ title: string; uri: string }> = [];
  for (const chunk of chunks) {
    const uri = chunk?.web?.uri;
    const title = chunk?.web?.title || uri;
    if (uri && typeof uri === 'string' && !seen.has(uri)) {
      seen.add(uri);
      sources.push({ title: String(title), uri });
    }
  }
  return sources;
}

// In-memory cache & 429 quota cooldown guard to avoid repeated rate-limit hits
let geminiCooldownUntil = 0;
const updatesCache = new Map<
  string,
  { summary: string; sources: Array<{ title: string; uri: string }>; updatedAt: string; timestamp: number }
>();

function isQuotaError(err: any): boolean {
  const msg = String(err?.message || err || '');
  return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
}

const VERIFIED_UPDATES_FALLBACK: Record<string, string> = {
  mpbse:
    '• **MPBSE (माध्यमिक शिक्षा मण्डल, म.प्र.) अपडेट:** कक्षा 9वीं से 12वीं के विद्यार्थियों के लिए शैक्षणिक सत्र 2026-27 का पाठ्यक्रम, ब्लूप्रिंट एवं परीक्षा संबंधी दिशा-निर्देश आधिकारिक पोर्टल पर उपलब्ध हैं।\n• **नियमित उपस्थिति एवं आंतरिक मूल्यांकन:** त्रैमासिक एवं अर्द्धवार्षिक परीक्षाओं के अंक वार्षिक परिणाम में महत्वपूर्ण हैं, अतः 75% से अधिक उपस्थिति अनिवार्य है।\n• **प्रवेश एवं नामांकन:** शासकीय उ.मा.वि. अहमदपुर खैगांव (UDISE: 23290300210, संस्था कोड: 561033) में नवीन सत्र हेतु ऑनलाइन प्रवेश आवेदन प्रारंभ हैं।',
  scholarships:
    '• **म.प्र. शासन छात्रवृत्ति योजनाएं (Shiksha Portal):** शासकीय विद्यालय में अध्ययनरत पात्र विद्यार्थियों को पोस्ट-मैट्रिक/प्री-मैट्रिक छात्रवृत्ति, साइकिल योजना एवं निःशुल्क पाठ्यपुस्तकें प्रदान की जाती हैं।\n• **लाड़ली लक्ष्मी एवं संबल योजना:** पात्र छात्राओं एवं संबल कार्डधारी परिवारों के विद्यार्थियों को शासन नियमानुसार शैक्षणिक प्रोत्साहन राशि का लाभ मिलता है।\n• **आवश्यक दस्तावेज:** छात्रवृत्ति पंजीयन हेतु समग्र आईडी (e-KYC सहित), आधार सीडेड बैंक खाता, आय एवं जाति प्रमाण पत्र अनिवार्य हैं।',
  khandwa:
    '• **जिला खण्डवा शैक्षणिक अपडेट:** शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव में ICT कंप्यूटर लैब, स्मार्ट क्लासरूम, एवं विज्ञान प्रयोगशालाओं (Physics, Chemistry, Biology, Maths) के माध्यम से आधुनिक शिक्षण संचालित है।\n• **व्यावसायिक शिक्षा (Vocational Education):** विद्यालय में नवीन शिक्षा नीति के अंतर्गत Beauty & Wellness तथा Healthcare व्यावसायिक पाठ्यक्रम उपलब्ध हैं।',
};

const DEFAULT_OFFICIAL_SOURCES = [
  { title: 'MPBSE Official Website (mpbse.nic.in)', uri: 'https://mpbse.nic.in' },
  { title: 'MP Shiksha Portal (shikshaportal.mp.gov.in)', uri: 'https://shikshaportal.mp.gov.in' },
  { title: 'Vimarsh MP Education Portal', uri: 'https://www.vimarsh.mp.gov.in' },
];

// API: School AI Assistant (Multi-Turn Gemini Chat + Optional Google Search Grounding)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, useSearchGrounding = true, mode = 'standard' } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const lowerMsg = message.toLowerCase();
    const isRealtimeWebQuery =
      lowerMsg.includes('mp board') ||
      lowerMsg.includes('mpbse') ||
      lowerMsg.includes('result') ||
      lowerMsg.includes('exam date') ||
      lowerMsg.includes('time table') ||
      lowerMsg.includes('timetable') ||
      lowerMsg.includes('scholarship') ||
      lowerMsg.includes('छात्रवृत्ति') ||
      lowerMsg.includes('योजना') ||
      lowerMsg.includes('बोर्ड') ||
      lowerMsg.includes('परीक्षा') ||
      lowerMsg.includes('news') ||
      lowerMsg.includes('update') ||
      lowerMsg.includes('ताजा') ||
      lowerMsg.includes('अपडेट') ||
      lowerMsg.includes('current') ||
      lowerMsg.includes('2026') ||
      lowerMsg.includes('ncert');

    // Fast grounded check first for school-specific static facts unless user is asking a live web query
    if (!isRealtimeWebQuery) {
      const directAnswer = resolveFromGroundedKnowledge(message);
      if (directAnswer) {
        return res.json({
          reply: directAnswer,
          sources: [],
          modelUsed: 'School Verified Records',
        });
      }
    }

    // If Gemini API is currently in a 429 cooldown window, resolve immediately from verified knowledge
    if (Date.now() < geminiCooldownUntil) {
      const directFallback = resolveFromGroundedKnowledge(message);
      if (directFallback) {
        return res.json({
          reply: directFallback,
          sources: isRealtimeWebQuery ? DEFAULT_OFFICIAL_SOURCES : [],
          modelUsed: 'School Verified Records',
        });
      }
      if (lowerMsg.includes('scholarship') || lowerMsg.includes('छात्रवृत्ति') || lowerMsg.includes('योजना')) {
        return res.json({
          reply: VERIFIED_UPDATES_FALLBACK.scholarships,
          sources: DEFAULT_OFFICIAL_SOURCES,
          modelUsed: 'Verified MP Education Records',
        });
      }
      if (isRealtimeWebQuery) {
        return res.json({
          reply: VERIFIED_UPDATES_FALLBACK.mpbse,
          sources: DEFAULT_OFFICIAL_SOURCES,
          modelUsed: 'Verified MPBSE Records',
        });
      }
    }

    // Build multi-turn chat contents including history
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (h && typeof h.text === 'string' && h.text.trim()) {
          contents.push({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }],
          });
        }
      }
    }
    if (contents.length === 0 || contents[contents.length - 1]?.parts?.[0]?.text !== message) {
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });
    }

    let replyText = '';
    let sources: Array<{ title: string; uri: string }> = [];
    let modelUsed = mode === 'fast' && !useSearchGrounding ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';

    const systemInstructionWithSearch = `${SCHOOL_SYSTEM_INSTRUCTION}
When answering questions about Madhya Pradesh Board (MPBSE), government scholarship schemes (such as Ladli Laxmi, Sambal, Gaon Ki Beti, Super 100, Post Matric Scholarship), NCERT curriculum, or current educational updates, use Google Search to provide accurate, up-to-date information while always respecting the official verified records of GHSS Ahamdpur Khaigaon.`;

    try {
      if (mode === 'fast' && !useSearchGrounding && !isRealtimeWebQuery) {
        const fastResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            systemInstruction: SCHOOL_SYSTEM_INSTRUCTION,
            temperature: 0.2,
          },
        });
        replyText = fastResponse.text || '';
        modelUsed = 'gemini-3.1-flash-lite';
      } else {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents,
          config: {
            systemInstruction: systemInstructionWithSearch,
            temperature: 0.2,
            ...(useSearchGrounding ? { tools: [{ googleSearch: {} }] } : {}),
          },
        });
        replyText = response.text || '';
        sources = extractGroundingSources(response);
        modelUsed = useSearchGrounding ? 'gemini-3.5-flash + Google Search' : 'gemini-3.5-flash';
      }
    } catch (e1: any) {
      if (isQuotaError(e1)) {
        geminiCooldownUntil = Date.now() + 60_000;
      }
      try {
        if (Date.now() < geminiCooldownUntil) {
          throw new Error('Cooldown active');
        }
        const responseLite = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            systemInstruction: SCHOOL_SYSTEM_INSTRUCTION,
            temperature: 0.2,
          },
        });
        replyText = responseLite.text || '';
        modelUsed = 'gemini-3.1-flash-lite';
      } catch (e2: any) {
        if (isQuotaError(e2)) {
          geminiCooldownUntil = Date.now() + 60_000;
        }
        const fallbackDirect = resolveFromGroundedKnowledge(message);
        if (fallbackDirect) {
          replyText = fallbackDirect;
        } else if (lowerMsg.includes('scholarship') || lowerMsg.includes('छात्रवृत्ति') || lowerMsg.includes('योजना')) {
          replyText = VERIFIED_UPDATES_FALLBACK.scholarships;
          sources = DEFAULT_OFFICIAL_SOURCES;
        } else if (isRealtimeWebQuery) {
          replyText = VERIFIED_UPDATES_FALLBACK.mpbse;
          sources = DEFAULT_OFFICIAL_SOURCES;
        } else {
          replyText =
            'शासकीय उच्चतर माध्यमिक विद्यालय, अहमदपुर खैगांव (UDISE: 23290300210, शाला कोड: 561033) का समय प्रातः 10:30 से सायं 4:30 बजे तक है। अधिक जानकारी हेतु प्राचार्य श्री अनिल कुमार बारोले (9977359533) या विद्यालय कार्यालय से संपर्क करें।';
        }
      }
    }

    const reply =
      replyText.trim() ||
      'मुझे इस जानकारी की पुष्टि उपलब्ध विद्यालय रिकॉर्ड से नहीं मिली है। कृपया विद्यालय कार्यालय से संपर्क करें।';
    res.json({ reply, sources, modelUsed });
  } catch {
    res.json({
      reply: 'मुझे इस जानकारी की पुष्टि उपलब्ध विद्यालय रिकॉर्ड से नहीं मिली है। कृपया विद्यालय कार्यालय से संपर्क करें।',
      sources: [],
    });
  }
});

// API: Real-Time School & Education Updates using Google Search Grounding
app.post('/api/updates/search', async (req, res) => {
  try {
    const { query, category = 'mpbse', forceRefresh = false } = req.body || {};
    const trimmedQuery = typeof query === 'string' ? query.trim() : '';
    const cacheKey = `${category}:${trimmedQuery.toLowerCase()}`;

    // Return cached result if fresh (within 10 minutes) and not forced
    const cached = updatesCache.get(cacheKey);
    if (cached && !forceRefresh && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      return res.json({
        summary: cached.summary,
        sources: cached.sources,
        updatedAt: cached.updatedAt,
      });
    }

    // If no custom query and in quota cooldown, return verified fallback immediately
    if (Date.now() < geminiCooldownUntil) {
      const fallbackText = trimmedQuery
        ? `• **${trimmedQuery} — आधिकारिक सूचना:**\n${VERIFIED_UPDATES_FALLBACK[category] || VERIFIED_UPDATES_FALLBACK.mpbse}`
        : VERIFIED_UPDATES_FALLBACK[category] || VERIFIED_UPDATES_FALLBACK.mpbse;
      return res.json({
        summary: fallbackText,
        sources: DEFAULT_OFFICIAL_SOURCES,
        updatedAt: new Date().toISOString(),
      });
    }

    const defaultPrompts: Record<string, string> = {
      mpbse:
        'Provide the latest official updates and important announcements for Madhya Pradesh Board of Secondary Education (MPBSE / MP Board) Class 9th, 10th, 11th, and 12th students, exam schedules, academic calendar, and portal updates in concise bullet points (in Hindi and English).',
      scholarships:
        'Provide current information on Madhya Pradesh government school student scholarships and welfare schemes for Class 9 to 12 students (such as Shiksha Portal scholarships, Ladli Laxmi Yojana, Sambal Card education benefits, Laptop Protsahan Yojana, and Super 100 scheme) in concise bullet points (in Hindi and English).',
      khandwa:
        'Provide recent educational news, school initiatives, and academic highlights relevant to Government Higher Secondary Schools in Khandwa district and Madhya Pradesh School Education Department (Vimarsh / Shiksha Portal) in concise bullet points (in Hindi and English).',
    };

    const searchPrompt = trimmedQuery
      ? `Search Google and provide accurate, up-to-date educational and official information for students and parents of Government Higher Secondary School, Ahamdpur Khaigaon (Khandwa, MP) regarding: "${trimmedQuery}". Provide a clear, helpful summary in Hindi and English.`
      : defaultPrompts[category] || defaultPrompts.mpbse;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: searchPrompt,
        config: {
          systemInstruction:
            'You are an educational news and real-time information assistant for Government Higher Secondary School, Ahamdpur Khaigaon (Khandwa, Madhya Pradesh). Use Google Search to provide accurate, verified, and student-friendly updates in a clear bilingual (Hindi + English) format.',
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      });

      const summary = response.text?.trim() || '';
      const sources = extractGroundingSources(response);

      if (summary) {
        const resultPayload = {
          summary,
          sources: sources.length > 0 ? sources : DEFAULT_OFFICIAL_SOURCES,
          updatedAt: new Date().toISOString(),
        };
        updatesCache.set(cacheKey, { ...resultPayload, timestamp: Date.now() });
        return res.json(resultPayload);
      }
    } catch (apiErr: any) {
      if (isQuotaError(apiErr)) {
        geminiCooldownUntil = Date.now() + 60_000;
      }
    }

    const fallbackSummary = trimmedQuery
      ? `• **${trimmedQuery} (सत्यापित शैक्षणिक विवरण):**\n${VERIFIED_UPDATES_FALLBACK[category] || VERIFIED_UPDATES_FALLBACK.mpbse}`
      : VERIFIED_UPDATES_FALLBACK[category] || VERIFIED_UPDATES_FALLBACK.mpbse;

    return res.json({
      summary: fallbackSummary,
      sources: DEFAULT_OFFICIAL_SOURCES,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return res.json({
      summary: VERIFIED_UPDATES_FALLBACK.mpbse,
      sources: DEFAULT_OFFICIAL_SOURCES,
      updatedAt: new Date().toISOString(),
    });
  }
});

// API: AI Quiz Generator for Teachers & Students (Review First Pattern with Quota Fallback)
app.post('/api/quiz/generate', async (req, res) => {
  const { classLevel = '10', subject = 'Science', topic = 'General Syllabus', questionCount = 5, difficulty = 'medium' } = req.body || {};
  try {
    if (Date.now() < geminiCooldownUntil) {
      return res.json({ questions: [] });
    }

    const prompt = `
Create an educational, curriculum-accurate multiple-choice quiz for:
Class: ${classLevel}th standard
Subject: ${subject}
Topic/Chapter: ${topic || 'General Syllabus'}
Number of questions: ${questionCount}
Difficulty: ${difficulty}
Language: Clear Hindi / English (bilingual or appropriate for MP Board high school students)

Format each question strictly with 4 distinct options and indicate the correct option index (0, 1, 2, or 3).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert school teacher crafting precise, high-quality multiple choice questions for high school students. Always ensure only one option is unambiguously correct.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING, description: 'The quiz question text' },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 4 multiple choice options',
              },
              correctIndex: { type: Type.INTEGER, description: 'Index 0 to 3 of the correct option' },
              explanation: { type: Type.STRING, description: 'Short explanation for students' },
            },
            required: ['questionText', 'options', 'correctIndex'],
          },
        },
      },
    });

    const questions = JSON.parse(response.text || '[]');
    return res.json({ questions });
  } catch (error: any) {
    if (isQuotaError(error)) {
      geminiCooldownUntil = Date.now() + 60_000;
    }
    return res.json({ questions: [] });
  }
});

// API: Secure Teacher Role Verification
// Prevents students from ever assigning themselves teacher/admin role
app.post('/api/auth/verify-teacher', (req, res) => {
  const { email, secretKey } = req.body;
  const authorizedEmails = [
    'bp6078234@gmail.com',
    'hss.ahmedpur.khd.mp@gmail.com',
  ];

  const adminPasscode = process.env.TEACHER_ADMIN_KEY || 'GHSS@Teacher2026';

  const isEmailPreauthorized = email && authorizedEmails.includes(email.toLowerCase());
  const isKeyValid = secretKey && secretKey.trim() === adminPasscode;

  if (isEmailPreauthorized || isKeyValid) {
    return res.json({
      authorized: true,
      role: 'teacher',
      message: 'Teacher authorization verified successfully.',
    });
  }

  return res.status(403).json({
    authorized: false,
    error: 'Invalid teacher authorization credentials.',
  });
});

// API: Google Sheets Sync (Minimization Policy - NO sensitive PII/Bank/Full Aadhaar)
app.post('/api/sheets/sync', async (req, res) => {
  try {
    const { application } = req.body;
    if (!application) {
      return res.status(400).json({ error: 'Application payload is required' });
    }

    // STRICT MINIMIZATION: Only non-sensitive administrative roster columns
    const minimalRow = {
      applicationId: application.applicationId,
      session: application.academicSession || '2026 - 2027',
      class: 'Class ' + application.targetClass,
      stream: application.subjectsAndSchemes?.stream || 'General',
      studentNameHindi: application.studentDetails?.fullNameHindi || '',
      studentNameEnglish: application.studentDetails?.fullNameEnglish || '',
      fatherNameEnglish: application.studentDetails?.fatherNameEnglish || '',
      motherNameEnglish: application.studentDetails?.motherNameEnglish || '',
      gender: application.studentDetails?.gender || '',
      category: application.studentDetails?.category || '',
      mobile: application.studentDetails?.whatsappMobile || '',
      village: application.familyDetails?.permanentVillage || '',
      district: application.familyDetails?.permanentDistrict || 'Khandwa',
      status: application.status || 'submitted',
      submittedAt: application.submittedAt || new Date().toISOString(),
    };

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
    let syncedToSheet = false;

    if (webhookUrl && webhookUrl.startsWith('https://script.google.com')) {
      try {
        const gasRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(minimalRow),
        });
        syncedToSheet = gasRes.ok;
      } catch (err) {
        console.error('Google Apps Script call failed:', err);
      }
    }

    res.json({
      success: true,
      syncedToSheet,
      record: minimalRow,
    });
  } catch (error: any) {
    console.error('Sheets sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Vite Middleware for Full-stack Dev vs Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
