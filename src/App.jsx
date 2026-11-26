import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import {
  BookOpen,
  Search,
  ShoppingCart,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  Phone,
  FileText,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Trash2,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Tag,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  Upload,
  AlertCircle,
  BarChart3,
  Package,
  Sliders,
  Layers,
  LogOut,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Image as ImageIcon,
  Download,
  Folder,
  FolderOpen
} from 'lucide-react';

// ==========================================
// 1. Firebase Configuration & Initialization
// ==========================================
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_du5VY8nJGDJ169Fof9EAlI9x2W2d-14",
  authDomain: "el3bakera-edu.firebaseapp.com",
  projectId: "el3bakera-edu",
  storageBucket: "el3bakera-edu.firebasestorage.app",
  messagingSenderId: "74663879858",
  appId: "1:74663879858:web:4327c0ea1b825dd6c615ab"
};

let firebaseConfig = DEFAULT_FIREBASE_CONFIG;
try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig =
      typeof __firebase_config === 'string'
        ? JSON.parse(__firebase_config)
        : __firebase_config;
  } else if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_CONFIG) {
    firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
  }
} catch {
  firebaseConfig = DEFAULT_FIREBASE_CONFIG;
}

const appId =
  typeof __app_id !== 'undefined' && __app_id
    ? __app_id
    : 'muzakkirati-edu-app';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const publicCol = (colName) =>
  collection(db, 'artifacts', appId, 'public', 'data', colName);
const publicDoc = (colName, docId) =>
  doc(db, 'artifacts', appId, 'public', 'data', colName, docId);

// ==========================================
// 2. Security, Storage & Media Helpers
// ==========================================
const LS_KEYS = {
  NOTEBOOKS: 'mz_notebooks_v3',
  COUPONS: 'mz_coupons_v3',
  SETTINGS: 'mz_settings_v3',
  ORDERS: 'mz_orders_v3',
  SAMPLES: 'mz_samples_v3'
};

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota exceeded
  }
}

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (digits.startsWith('20') && digits.length === 12) return '0' + digits.slice(2);
  return digits;
}

function isValidEgyptPhone(raw) {
  const clean = normalizePhone(raw);
  return /^01[0125][0-9]{8}$/.test(clean);
}

function formatWhatsAppNumber(raw) {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (!digits) return '201068481536';
  if (digits.startsWith('01')) return '2' + digits;
  if (digits.startsWith('20')) return digits;
  return digits;
}

function sanitizeUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return 'https://' + trimmed;
}

function toTextItem(item) {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    return String(item.name || item.label || item.title || '').trim();
  }
  return '';
}

function normalizeTaxonomyList(list, fallback) {
  if (!Array.isArray(list) || list.length === 0) return fallback;
  const cleaned = list
    .filter((item) => !(item && typeof item === 'object' && item.visible === false))
    .map(toTextItem)
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeSettings(raw) {
  const merged = { ...DEFAULT_SETTINGS, ...(raw || {}) };
  // البحث التلقائي عن أي صورة شعار أو خلفية مخزنة في السحابة بأي اسم حقل سابق
  const detectedLogo =
    merged.logoUrl ||
    merged.logoData ||
    merged.brandLogo ||
    merged.logo ||
    merged.siteLogo ||
    '';
  const detectedHeroBg =
    merged.heroBgImage ||
    merged.heroBg ||
    merged.heroBgUrl ||
    merged.heroImage ||
    merged.heroBackground ||
    merged.bgImage ||
    '';

  return {
    ...merged,
    logoUrl: detectedLogo,
    heroBgImage: detectedHeroBg,
    categories: normalizeTaxonomyList(merged.categories, DEFAULT_SETTINGS.categories),
    stages: normalizeTaxonomyList(merged.stages, DEFAULT_SETTINGS.stages),
    grades: normalizeTaxonomyList(merged.grades, DEFAULT_SETTINGS.grades),
    subjects: normalizeTaxonomyList(merged.subjects, DEFAULT_SETTINGS.subjects),
    heroCards: Array.isArray(merged.heroCards)
      ? merged.heroCards.map((c, i) => ({
          id: c.id || `hc-${i}`,
          title: toTextItem(c.title) || 'قسم دراسي',
          description: toTextItem(c.description) || '',
          badge: toTextItem(c.badge) || '',
          category: toTextItem(c.category) || DEFAULT_SETTINGS.categories[0],
          buttonText: toTextItem(c.buttonText) || 'تصفح القسم',
          coverImage: c.coverImage || c.image || ''
        }))
      : DEFAULT_HERO_CARDS,
    orderFormFields: Array.isArray(merged.orderFormFields)
      ? merged.orderFormFields.map((f, i) => ({
          id: f.id || `fld-${i}`,
          label: toTextItem(f.label) || 'حقل',
          placeholder: toTextItem(f.placeholder) || '',
          type: f.type || 'text',
          required: Boolean(f.required),
          enabled: f.enabled !== false
        }))
      : DEFAULT_ORDER_FIELDS,
    socialLinks: Array.isArray(merged.socialLinks)
      ? merged.socialLinks.map((s, i) => ({
          id: s.id || `soc-${i}`,
          label: toTextItem(s.label) || 'رابط تواصل',
          url: String(s.url || ''),
          color: s.color || 'blue'
        }))
      : DEFAULT_SOCIAL_LINKS
  };
}

function normalizeNotebook(nb) {
  if (!nb || typeof nb !== 'object') return null;
  return {
    ...nb,
    title: toTextItem(nb.title) || 'مذكرة دراسية',
    category: toTextItem(nb.category) || DEFAULT_SETTINGS.categories[0],
    stage: toTextItem(nb.stage) || DEFAULT_SETTINGS.stages[0],
    grade: toTextItem(nb.grade) || DEFAULT_SETTINGS.grades[0],
    subject: toTextItem(nb.subject) || DEFAULT_SETTINGS.subjects[0],
    badge: toTextItem(nb.badge) || '',
    description: toTextItem(nb.description) || ''
  };
}

function compressImageFile(file, maxWidth = 1100, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(img.width, 1));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==========================================
// 3. Default Platform Settings & Seed Data
// ==========================================
const DEFAULT_HERO_CARDS = [
  {
    id: 'hc-1',
    title: 'مذكرات الترم الأول',
    description: 'مذكرات شرح وتدريبات شاملة لجميع المواد والمراحل الدراسية للفصل الدراسي الأول.',
    badge: 'متاح الآن',
    category: 'مذكرات الترم الأول',
    buttonText: 'تصفح الترم الأول',
    color: 'blue',
    coverImage: ''
  },
  {
    id: 'hc-2',
    title: 'مذكرات الترم الثاني',
    description: 'مذكرات محدثة ومنسقة للفصل الدراسي الثاني جاهزة للطباعة باسمك وشعارك الخاص.',
    badge: 'محدث',
    category: 'مذكرات الترم الثاني',
    buttonText: 'تصفح الترم الثاني',
    color: 'emerald',
    coverImage: ''
  },
  {
    id: 'hc-3',
    title: 'كورسات التأسيس',
    description: 'سلاسل تأسيس احترافية لبناء مهارات الطلاب في القراءة والكتابة والقواعد والرياضيات.',
    badge: 'تأسيس شامل',
    category: 'كورسات التأسيس',
    buttonText: 'استعرض الكورسات',
    color: 'amber',
    coverImage: ''
  }
];

const DEFAULT_ORDER_FIELDS = [
  {
    id: 'teacherName',
    label: 'اسم المعلم كما سيُكتب على المذكرة',
    placeholder: 'مثال: أ/ محمود شحاته',
    type: 'text',
    required: true,
    enabled: true
  },
  {
    id: 'centerName',
    label: 'اسم السنتر أو الأكاديمية (اختياري)',
    placeholder: 'مثال: سنتر العباقرة التعليمي',
    type: 'text',
    required: false,
    enabled: true
  },
  {
    id: 'phone',
    label: 'رقم الواتساب للتواصل وإرسال العينة',
    placeholder: '010XXXXXXXX',
    type: 'tel',
    required: true,
    enabled: true
  },
  {
    id: 'coverPhone',
    label: 'رقم الهاتف المطبوع داخل إطار المذكرة',
    placeholder: '010XXXXXXXX',
    type: 'tel',
    required: false,
    enabled: true
  },
  {
    id: 'notes',
    label: 'ملاحظات إضافية حول الألوان أو التعديلات',
    placeholder: 'اكتب أي تفاصيل أو طلبات خاصة...',
    type: 'textarea',
    required: false,
    enabled: true
  }
];

const DEFAULT_SOCIAL_LINKS = [
  {
    id: 'soc-fb',
    label: 'صفحة الفيسبوك',
    url: 'https://www.facebook.com',
    color: 'blue'
  },
  {
    id: 'soc-wa-group',
    label: 'جروب الواتساب',
    url: 'https://chat.whatsapp.com',
    color: 'emerald'
  }
];

const DEFAULT_SETTINGS = {
  brandName: 'منصة العباقرة للمذكرات التعليمية',
  brandTagline: 'مذكرات دراسية احترافية مُخصصة باسمك وبياناتك الخاصة.',
  logoUrl: '',
  logoSize: 64,
  heroBgImage: '',
  heroBgOpacity: 45,
  heroBgFit: 'cover',
  heroOverlayColor: '#020617',
  heroOverlayOpacity: 72,
  heroHeight: 540,
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة اسم المعلم، رقم الهاتف، والشعار الخاص به على الغلاف وجميع الصفحات.',
  whatsappNumber: '201068481536',
  paymentInstructions: 'فودافون كاش / إنستاباي: 01068481536',
  promoBanner: '🎉 عرض خاص للمعلمين: خصم 15% على جميع مذكرات الترم الأول + إضافة الشعار مجانًا لفترة محدودة!',
  showPromoBanner: true,
  showHeroSection: true,
  showHeroSideCard: true,
  showHeroCustomOrderBtn: true,
  showSectionsGrid: true,
  showAboutSection: true,
  showFeaturedSection: true,
  featuredCount: 6,
  homeSectionOrder: ['hero', 'sections', 'about', 'featured'],
  heroCards: DEFAULT_HERO_CARDS,
  emptyCatalogTitle: 'جاري تجهيز أحدث المذكرات لهذا القسم قريبًا!',
  emptyCatalogSubtitle:
    'نعمل حاليًا على تنسيق ومراجعة مذكرات هذا القسم بأعلى جودة. يمكنك حجز مذكرتك مسبقًا أو التواصل معنا.',
  emptyCatalogBtnText: 'اطلب تجهيز مذكرتك الآن',
  emptyCatalogImage: '',
  showLogoUploadField: true,
  logoFieldPosition: 'top',
  orderFormFields: DEFAULT_ORDER_FIELDS,
  socialLinks: DEFAULT_SOCIAL_LINKS,
  categories: ['مذكرات الترم الأول', 'مذكرات الترم الثاني', 'كورسات التأسيس', 'مراجعات نهائية'],
  stages: ['المرحلة الابتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية'],
  grades: [
    'الصف الرابع الابتدائي',
    'الصف الخامس الابتدائي',
    'الصف السادس الابتدائي',
    'الصف الأول الإعدادي',
    'الصف الثاني الإعدادي',
    'الصف الثالث الإعدادي',
    'الصف الأول الثانوي',
    'الصف الثاني الثانوي',
    'الصف الثالث الثانوي'
  ],
  subjects: ['اللغة العربية', 'الرياضيات', 'اللغة الإنجليزية', 'العلوم', 'الدراسات الاجتماعية', 'الفيزياء', 'الكيمياء']
};

const INITIAL_NOTEBOOKS = [
  {
    id: 'nb-demo-1',
    title: 'بوكليت الاختبارات الشاملة للصف الأول الإعدادي',
    category: 'مذكرات الترم الأول',
    stage: 'المرحلة الإعدادية',
    grade: 'الصف الأول الإعدادي',
    subject: 'اللغة العربية',
    price: 100,
    oldPrice: 150,
    pages: 46,
    badge: 'الأكثر طلبًا',
    description:
      'بوكليت شامل يضم 15 امتحانًا مطابقًا لأحدث مواصفات الوزارة، منسق باحترافية وجاهز لإضافة اسمك وشعارك.',
    coverImage: '',
    sampleImages: [],
    sampleCount: 0,
    driveUrl: '',
    isComingSoon: false,
    comingSoonText: '',
    isHidden: false
  }
];

const INITIAL_COUPONS = [
  {
    id: 'cp-welcome',
    code: 'WELCOME15',
    discountPercent: 15,
    description: 'خصم ترحيبي 15% للمعلمين الجدد على أي مذكرة',
    active: true
  }
];

// ==========================================
// 4. Error Boundary
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'حدث خطأ غير متوقع' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-900">حدث خطأ مؤقت في عرض الصفحة</h2>
            <p className="text-xs text-slate-500 break-words">{this.state.errorMsg}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer"
            >
              إعادة تحميل الواجهة بأمان
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 5. Social Media Icons & Hub Modal
// ==========================================
function SocialBrandIcon({ url = '', label = '', className = 'w-5 h-5' }) {
  const text = `${url} ${label}`.toLowerCase();
  if (text.includes('facebook') || text.includes('fb.com') || text.includes('فيسبوك') || text.includes('فيس')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    );
  }
  if (text.includes('whatsapp') || text.includes('wa.me') || text.includes('واتس')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.459 3.475 1.331 4.988L2 22l5.182-1.359a9.927 9.927 0 0 0 4.849 1.262h.004c5.515 0 9.969-4.454 9.969-9.969A9.93 9.93 0 0 0 19.08 4.92 9.904 9.904 0 0 0 12.031 2zm5.82 14.274c-.246.693-1.434 1.326-1.988 1.408-.514.076-1.164.108-1.879-.119-.434-.138-.991-.322-1.703-.63-2.996-1.293-4.953-4.311-5.103-4.51-.15-.199-1.219-1.621-1.219-3.092 0-1.471.771-2.194 1.045-2.493.274-.299.598-.374.797-.374.199 0 .399.002.573.01.184.009.43-.07.673.514.249.598.847 2.069.922 2.219.075.15.125.324.025.523-.1.199-.15.324-.299.498-.15.175-.314.39-.449.524-.15.149-.306.311-.131.61.174.299.776 1.28 1.666 2.073 1.145 1.021 2.11 1.337 2.409 1.487.299.15.474.125.648-.075.175-.199.748-.872.947-1.171.2-.299.399-.249.673-.15.274.1 1.744.822 2.043.972.299.15.498.224.573.349.075.125.075.723-.171 1.416z" />
      </svg>
    );
  }
  if (text.includes('t.me') || text.includes('telegram') || text.includes('تليجرام')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    );
  }
  if (text.includes('youtube') || text.includes('youtu.be') || text.includes('يوتيوب')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (text.includes('tiktok') || text.includes('تيك توك')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    );
  }
  if (text.includes('instagram') || text.includes('انستجرام') || text.includes('إنستجرام')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }
  return <ExternalLink className={className} />;
}

function getSocialColorClasses(color) {
  switch (color) {
    case 'emerald':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100';
    case 'sky':
      return 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100';
    case 'rose':
      return 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100';
    case 'amber':
      return 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100';
    case 'slate':
      return 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200';
    default:
      return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
  }
}

function SocialHubModal({ settings, onClose }) {
  const waNum = formatWhatsAppNumber(settings.whatsappNumber);
  const links = Array.isArray(settings.socialLinks) ? settings.socialLinks : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">تواصل معنا</h3>
            <p className="text-xs text-slate-500 mt-0.5">اختر وسيلة التواصل المناسبة للوصول إلينا مباشرة</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <a
            href={`https://wa.me/${waNum}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                <SocialBrandIcon url="whatsapp" className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-black">مراسلة مباشرة عبر واتساب</div>
                <div className="text-xs text-emerald-100" dir="ltr">+{waNum}</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>

          <a
            href={`tel:${normalizePhone(settings.whatsappNumber)}`}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black">اتصال هاتفي مباشر</div>
                <div className="text-xs text-slate-300" dir="ltr">{normalizePhone(settings.whatsappNumber)}</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>

          {links.map((item) => (
            <a
              key={item.id}
              href={sanitizeUrl(item.url)}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between p-4 rounded-2xl border transition ${getSocialColorClasses(
                item.color
              )}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0">
                  <SocialBrandIcon url={item.url} label={item.label} className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black truncate">{item.label}</div>
                  <div className="text-[11px] opacity-75 truncate" dir="ltr">
                    {item.url}
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 shrink-0 opacity-75" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. Protected Preview Modal (HD + Fullscreen + Pinch Zoom + Smooth Scroll)
// ==========================================
function ProtectedPreviewModal({ notebook, settings, onClose, onOrder }) {
  const [samples, setSamples] = useState([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const touchStartRef = useRef({ x: 0, y: 0, dist: 0, startZoom: 1, panX: 0, panY: 0, isPinching: false });

  useEffect(() => {
    let active = true;
    const baseImages = [];
    if (notebook.coverImage) baseImages.push(notebook.coverImage);
    if (Array.isArray(notebook.sampleImages) && notebook.sampleImages.length > 0) {
      baseImages.push(...notebook.sampleImages);
    }
    setSamples(baseImages);
    setCurrentIdx(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });

    if (notebook.sampleCount > 0 && (!notebook.sampleImages || notebook.sampleImages.length === 0)) {
      setLoadingSamples(true);
      const qSamples = query(publicCol('notebook_samples'), where('notebookId', '==', notebook.id));
      getDocs(qSamples)
        .then((snap) => {
          if (!active) return;
          const fetched = snap.docs
            .map((d) => d.data())
            .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0))
            .map((d) => d.imageData)
            .filter(Boolean);
          if (fetched.length > 0) {
            setSamples(notebook.coverImage ? [notebook.coverImage, ...fetched] : fetched);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoadingSamples(false);
        });
    }

    return () => {
      active = false;
    };
  }, [notebook]);

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const goNext = () => {
    if (samples.length <= 1) return;
    resetZoom();
    setCurrentIdx((prev) => (prev + 1) % samples.length);
  };

  const goPrev = () => {
    if (samples.length <= 1) return;
    resetZoom();
    setCurrentIdx((prev) => (prev - 1 + samples.length) % samples.length);
  };

  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchStartRef.current = {
        ...touchStartRef.current,
        dist: getTouchDistance(e.touches),
        startZoom: zoom,
        isPinching: true
      };
    } else if (e.touches.length === 1) {
      touchStartRef.current = {
        ...touchStartRef.current,
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        panX: pan.x,
        panY: pan.y,
        isPinching: false
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
      const newDist = getTouchDistance(e.touches);
      const ratio = newDist / touchStartRef.current.dist;
      const nextZoom = Math.min(3.5, Math.max(1, touchStartRef.current.startZoom * ratio));
      setZoom(nextZoom);
      if (nextZoom === 1) setPan({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && zoom > 1 && isFullscreen) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      setPan({
        x: touchStartRef.current.panX + dx,
        y: touchStartRef.current.panY + dy
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartRef.current.isPinching) {
      touchStartRef.current.isPinching = false;
      return;
    }
    if (zoom === 1 && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx > 0) goPrev();
        else goNext();
      }
    }
  };

  const activeImage = samples[currentIdx] || '';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isFullscreen && activeImage ? (
        <div
          className="fixed inset-0 z-60 bg-slate-950 flex flex-col justify-between select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 text-white border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-blue-400">
                صفحة {currentIdx + 1} من {samples.length}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">• كبّر بالأصابع أو بالأزرار</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, Number((z - 0.4).toFixed(2))))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                title="تصغير"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-2">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.4).toFixed(2))))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                title="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {zoom > 1 && (
                <button
                  type="button"
                  onClick={resetZoom}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 cursor-pointer"
                  title="إعادة الضبط"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  resetZoom();
                  setIsFullscreen(false);
                }}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer mr-1"
              >
                <Minimize2 className="w-4 h-4" />
                <span>خروج</span>
              </button>
            </div>
          </div>

          <div
            className="relative flex-1 overflow-hidden flex items-center justify-center"
            style={{ touchAction: 'none' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={() => {
              if (zoom > 1) resetZoom();
              else setZoom(2);
            }}
          >
            <img
              src={activeImage}
              alt={notebook.title}
              draggable={false}
              className="max-h-full max-w-full object-contain transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
              }}
            />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-20">
              <span className="text-white text-2xl sm:text-4xl font-black -rotate-25 whitespace-nowrap">
                {settings.brandName} • نسخة معاينة
              </span>
            </div>

            {samples.length > 1 && zoom === 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 text-white flex items-center justify-center border border-slate-700 cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 text-white flex items-center justify-center border border-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div
          className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              {activeImage && (
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>كامل الشاشة</span>
                </button>
              )}
            </div>
            <div className="text-left min-w-0">
              <h3 className="text-base font-black text-slate-900 truncate">{notebook.title}</h3>
              <p className="text-xs text-slate-500">
                {notebook.category} • {notebook.pages} صفحة
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5">
            {loadingSamples ? (
              <div className="h-64 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs font-bold">جاري تحميل صفحات العينة عالية الدقة (HD)...</span>
              </div>
            ) : activeImage ? (
              <div
                className="relative rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center select-none"
                style={{ touchAction: 'pan-y pinch-zoom' }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={activeImage}
                  alt={notebook.title}
                  draggable={false}
                  onClick={() => setIsFullscreen(true)}
                  className="max-h-[52vh] w-auto object-contain cursor-zoom-in"
                />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-20">
                  <span className="text-slate-900 text-xl sm:text-2xl font-black -rotate-25 whitespace-nowrap">
                    {settings.brandName} • نسخة معاينة
                  </span>
                </div>

                {samples.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center cursor-pointer shadow-md"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center cursor-pointer shadow-md"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-bold">
                      {currentIdx + 1} / {samples.length} • اضغط على الصورة للتكبير
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-48 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-2">
                <BookOpen className="w-10 h-10" />
                <span className="text-xs font-bold">لا توجد صور عينة مرفوعة لهذه المذكرة بعد</span>
              </div>
            )}

            {/* Description & Drive Link */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">{notebook.stage}</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 font-bold">{notebook.grade}</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">{notebook.subject}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{notebook.description}</p>
              {notebook.driveUrl && (
                <a
                  href={sanitizeUrl(notebook.driveUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-extrabold transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>مطالعة نسخة عينة كاملة على Google Drive</span>
                </a>
              )}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onOrder}
              className={`flex-1 py-3.5 px-5 rounded-2xl text-white font-black text-sm shadow-lg transition cursor-pointer ${
                notebook.isComingSoon
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {notebook.isComingSoon ? 'احجز نسختك مسبقًا الآن' : 'اطلب هذه المذكرة باسمك الآن'}
            </button>
            <div className="text-left shrink-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-blue-700">{notebook.price} ج.م</span>
                {Number(notebook.oldPrice) > Number(notebook.price) && (
                  <span className="text-xs text-slate-400 line-through">{notebook.oldPrice}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. Notebook Card Component
// ==========================================
function NotebookCard({ notebook, onPreview, onOrder }) {
  const hasDiscount = Number(notebook.oldPrice) > Number(notebook.price);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Cover */}
      <div
        onClick={onPreview}
        className="relative h-56 bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center overflow-hidden cursor-pointer"
      >
        {notebook.coverImage ? (
          <img
            src={notebook.coverImage}
            alt={notebook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <BookOpen className="w-12 h-12 text-blue-300" />
            <span className="text-xs font-bold">{notebook.subject}</span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
          {notebook.isComingSoon ? (
            <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-black shadow-sm">
              قريبًا • حجز مسبق
            </span>
          ) : (
            notebook.badge && (
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold shadow-sm">
                {notebook.badge}
              </span>
            )
          )}
        </div>

        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/75 text-white text-[11px] font-bold backdrop-blur-xs">
          {notebook.pages} صفحة
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <span>{notebook.category}</span>
            <span>•</span>
            <span>{notebook.grade}</span>
          </div>
          <h4
            onClick={onPreview}
            className="text-base font-black text-slate-900 group-hover:text-blue-700 transition cursor-pointer line-clamp-2"
          >
            {notebook.title}
          </h4>
          {notebook.isComingSoon && notebook.comingSoonText ? (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 font-bold leading-relaxed">
              {notebook.comingSoonText}
            </p>
          ) : (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notebook.description}</p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-blue-700">{notebook.price} ج.م</span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">{notebook.oldPrice} ج.م</span>
              )}
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {notebook.subject}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPreview}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>معاينة</span>
            </button>
            <button
              type="button"
              onClick={onOrder}
              className={`py-2.5 px-3 rounded-xl text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                notebook.isComingSoon
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{notebook.isComingSoon ? 'حجز مسبق' : 'اطلب الآن'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. Order Modal (Customizable Fields + Coupon + WhatsApp)
// ==========================================
function OrderModal({ notebook, settings, coupons, onClose, onSubmitOrder, showToast }) {
  const [formValues, setFormValues] = useState({});
  const [logoPreview, setLogoPreview] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const enabledFields = (settings.orderFormFields || DEFAULT_ORDER_FIELDS).filter((f) => f.enabled);
  const basePrice = notebook ? Number(notebook.price) || 0 : 0;
  const discountAmount = appliedCoupon
    ? Math.round((basePrice * Number(appliedCoupon.discountPercent || 0)) / 100)
    : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = coupons.find((c) => c.active && String(c.code).toUpperCase() === code);
    if (!found) {
      showToast('كود الخصم غير صحيح أو منتهي الصلاحية', 'error');
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(found);
    showToast(`تم تطبيق خصم ${found.discountPercent}% بنجاح!`);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 450, 0.8);
      setLogoPreview(compressed);
      showToast('تم إرفاق الشعار بنجاح');
    } catch {
      showToast('تعذر قراءة ملف الشعار', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const field of enabledFields) {
      const val = String(formValues[field.id] || '').trim();
      if (field.required && !val) {
        showToast(`يرجى ملء حقل: ${field.label}`, 'error');
        return;
      }
      if (field.type === 'tel' && val && !isValidEgyptPhone(val)) {
        showToast(`يرجى إدخال رقم هاتف مصري صحيح في: ${field.label}`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const orderCode = 'MZ-' + Math.floor(100000 + Math.random() * 900000);
      const orderRecord = {
        id: orderCode,
        orderCode,
        notebookId: notebook?.id || 'custom',
        notebookTitle: notebook?.title || 'طلب إعداد مذكرة خاصة',
        teacherName: formValues.teacherName || Object.values(formValues)[0] || 'معلم',
        phone: normalizePhone(formValues.phone || ''),
        fields: formValues,
        hasLogo: Boolean(logoPreview),
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        finalPrice,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await onSubmitOrder(orderRecord);

      const waNum = formatWhatsAppNumber(settings.whatsappNumber);
      const detailsLines = enabledFields
        .map((f) => `• ${f.label}: ${formValues[f.id] || '—'}`)
        .join('\n');
      const msg = [
        `السلام عليكم، أرغب في طلب تخصيص مذكرة من *${settings.brandName}*`,
        `رقم الطلب: *${orderCode}*`,
        `المذكرة: *${orderRecord.notebookTitle}*`,
        notebook ? `التكلفة النهائية: *${finalPrice} ج.م*` : '',
        detailsLines,
        logoPreview ? '• الشعار: مرفق (سأرسله هنا في المحادثة)' : ''
      ]
        .filter(Boolean)
        .join('\n');

      window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const renderLogoBlock = () => {
    if (settings.showLogoUploadField === false) return null;
    return (
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
        <label className="block text-xs font-black text-blue-950">
          شعار المعلم أو السنتر (اختياري — لوضعه على الغلاف والصفحات)
        </label>
        <div className="flex items-center gap-3">
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo"
              className="w-12 h-12 rounded-xl object-contain bg-white border border-blue-200 p-1"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="text-xs text-slate-600 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-bold cursor-pointer"
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {notebook ? 'طلب تخصيص المذكرة باسمك' : 'طلب إعداد مذكرة خاصة'}
            </h3>
            <p className="text-xs text-blue-700 font-bold mt-0.5">
              {notebook ? notebook.title : 'اذكر تفاصيل المذكرة المطلوبة وسنتواصل معك فورًا'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {settings.logoFieldPosition === 'top' && renderLogoBlock()}

          {enabledFields.map((field, index) => (
            <React.Fragment key={field.id}>
              {settings.logoFieldPosition === 'middle' &&
                index === Math.floor(enabledFields.length / 2) &&
                renderLogoBlock()}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  {field.label} {field.required && <span className="text-rose-600">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    placeholder={field.placeholder}
                    value={formValues[field.id] || ''}
                    onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-hidden"
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={formValues[field.id] || ''}
                    onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-hidden"
                  />
                )}
              </div>
            </React.Fragment>
          ))}

          {(settings.logoFieldPosition === 'bottom' || !settings.logoFieldPosition) && renderLogoBlock()}

          {notebook && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="لديك كود خصم؟ أدخله هنا..."
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer"
                >
                  تطبيق
                </button>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-600">الإجمالي المطلوب:</span>
                <span className="text-lg font-black text-blue-700">{finalPrice} ج.م</span>
              </div>
              {settings.paymentInstructions && (
                <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                  💳 <strong>بيانات الدفع:</strong> {settings.paymentInstructions}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{submitting ? 'جاري تسجيل الطلب...' : 'تأكيد الطلب والمتابعة عبر واتساب'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 9. Public Pages (Home, Catalog, Offers, Track, Contact)
// ==========================================
function HomePage({
  settings,
  notebooks,
  onBrowseCatalog,
  onSelectCategory,
  onOrderCustom,
  onPreviewNotebook,
  onOrderNotebook
}) {
  const sectionOrder = Array.isArray(settings.homeSectionOrder)
    ? settings.homeSectionOrder
    : ['hero', 'sections', 'about', 'featured'];
  const featuredLimit = Number(settings.featuredCount) || 6;

  return (
    <div>
      {sectionOrder.map((key) => {
        if (key === 'hero') {
          if (settings.showHeroSection === false) return null;
          return (
            <section
              key="hero"
              className="relative overflow-hidden text-white"
              style={{
                minHeight: `${settings.heroHeight || 540}px`,
                backgroundColor: settings.heroOverlayColor || '#020617'
              }}
            >
              {settings.heroBgImage && (
                <img
                  src={settings.heroBgImage}
                  alt="Hero Background"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{
                    objectFit: settings.heroBgFit || 'cover',
                    opacity: (Number(settings.heroBgOpacity) || 45) / 100
                  }}
                />
              )}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor: settings.heroOverlayColor || '#020617',
                  opacity: (Number(settings.heroOverlayOpacity) || 72) / 100
                }}
              />

              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div
                  className={`${
                    settings.showHeroSideCard !== false ? 'lg:col-span-7' : 'lg:col-span-10 mx-auto text-center'
                  } space-y-6`}
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-extrabold text-amber-300">
                    <Sparkles className="w-4 h-4" />
                    <span>تخصيص كامل باسم المعلم ورقم هاتفه وشعاره</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black leading-tight">{settings.heroTitle}</h2>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                    {settings.heroSubtitle}
                  </p>
                  <div
                    className={`flex flex-wrap gap-3 pt-2 ${
                      settings.showHeroSideCard === false ? 'justify-center' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={onBrowseCatalog}
                      className="px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl transition cursor-pointer"
                    >
                      تصفح مكتبة المذكرات
                    </button>
                    {settings.showHeroCustomOrderBtn !== false && (
                      <button
                        type="button"
                        onClick={onOrderCustom}
                        className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-sm transition cursor-pointer"
                      >
                        اطلب إعداد مذكرة خاصة
                      </button>
                    )}
                  </div>
                </div>

                {settings.showHeroSideCard !== false && (
                  <div className="lg:col-span-5">
                    <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-6 space-y-4 shadow-2xl">
                      <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        <span>لماذا يثق بنا المعلمون؟</span>
                      </h3>
                      <ul className="space-y-3 text-xs sm:text-sm text-slate-100">
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>محتوى علمي منقح ومطابق لأحدث مواصفات الوزارة</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>وضع اسم المعلم ورقم الهاتف والشعار على جميع الصفحات</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>معاينة حقيقية لصفحات المذكرة قبل تأكيد الطلب</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>تسليم سريع بصيغة PDF عالية الدقة جاهزة للطباعة</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (key === 'sections') {
          if (settings.showSectionsGrid === false) return null;
          const cards = Array.isArray(settings.heroCards) ? settings.heroCards : DEFAULT_HERO_CARDS;
          if (cards.length === 0) return null;
          return (
            <section key="sections" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  الأقسام الرئيسية للمذكرات والكورسات
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  اختر القسم المناسب لتصفح المذكرات المتاحة ومعاينة صفحاتها
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => onSelectCategory(card.category)}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all overflow-hidden cursor-pointer group flex flex-col"
                  >
                    {card.coverImage ? (
                      <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src={card.coverImage}
                          alt={card.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {card.badge && (
                          <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-extrabold">
                            {card.badge}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 pb-0 flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        {card.badge && (
                          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-extrabold">
                            {card.badge}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition">
                          {card.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{card.description}</p>
                      </div>
                      <div className="pt-2 flex items-center text-blue-700 text-xs font-black gap-1">
                        <span>{card.buttonText || 'استعرض القسم'}</span>
                        <ChevronLeft className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (key === 'about') {
          if (settings.showAboutSection === false) return null;
          return (
            <section key="about" className="bg-white border-y border-slate-200/80 py-14">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: FileText,
                    title: 'تنسيق احترافي للطباعة',
                    desc: 'هوامش مضبوطة وخطوط واضحة مريحة للعين في الطباعة والتصوير.'
                  },
                  {
                    icon: Sparkles,
                    title: 'هوية خاصة بكل معلم',
                    desc: 'تخصيص الغلاف والإطار الداخلي باسمك ورقمك وشعارك الخاص.'
                  },
                  {
                    icon: Eye,
                    title: 'معاينة قبل الطلب',
                    desc: 'تصفح عينات حقيقية عالية الدقة من صفحات المذكرة قبل الشراء.'
                  },
                  {
                    icon: Clock,
                    title: 'تسليم سريع ومباشر',
                    desc: 'استلم نسختك المخصصة بصيغة PDF عبر واتساب في أسرع وقت.'
                  }
                ].map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={idx}
                      className="p-6 rounded-3xl bg-slate-50 border border-slate-200/70 space-y-3"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-black text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }

        if (key === 'featured') {
          if (settings.showFeaturedSection === false) return null;
          const visibleNotebooks = notebooks.filter((n) => !n.isHidden);
          if (visibleNotebooks.length === 0) return null;
          return (
            <section key="featured" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">أحدث المذكرات المتاحة</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    اختر المذكرة المناسبة لمعاينة صفحاتها وطلب تخصيصها باسمك
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onBrowseCatalog}
                  className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold transition cursor-pointer"
                >
                  عرض الكل ({visibleNotebooks.length}) ←
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleNotebooks.slice(0, featuredLimit).map((nb) => (
                  <NotebookCard
                    key={nb.id}
                    notebook={nb}
                    onPreview={() => onPreviewNotebook(nb)}
                    onOrder={() => onOrderNotebook(nb)}
                  />
                ))}
              </div>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}

function CatalogPage({
  notebooks,
  settings,
  initialCategory = 'all',
  onPreviewNotebook,
  onOrderNotebook,
  onOrderCustom
}) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSelectedCategory(initialCategory || 'all');
    setSelectedStage('all');
    setSelectedGrade('all');
    setSelectedSubject('all');
    setSearchQuery('');
  }, [initialCategory]);

  const visibleNotebooks = useMemo(
    () => notebooks.filter((nb) => !nb.isHidden),
    [notebooks]
  );

  // Determine current folder level when not searching
  const isSearching = searchQuery.trim().length > 0;
  const folderLevel = useMemo(() => {
    if (isSearching) return 'notebooks';
    if (selectedCategory === 'all') return 'categories';
    if (selectedStage === 'all') return 'stages';
    if (selectedGrade === 'all') return 'grades';
    return 'notebooks';
  }, [isSearching, selectedCategory, selectedStage, selectedGrade]);

  const filteredNotebooks = useMemo(() => {
    return visibleNotebooks.filter((nb) => {
      if (selectedCategory !== 'all' && nb.category !== selectedCategory) return false;
      if (selectedStage !== 'all' && nb.stage !== selectedStage) return false;
      if (selectedGrade !== 'all' && nb.grade !== selectedGrade) return false;
      if (selectedSubject !== 'all' && nb.subject !== selectedSubject) return false;
      if (isSearching) {
        const q = searchQuery.trim().toLowerCase();
        const haystack = `${nb.title} ${nb.description} ${nb.subject} ${nb.grade} ${nb.stage} ${nb.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [visibleNotebooks, selectedCategory, selectedStage, selectedGrade, selectedSubject, isSearching, searchQuery]);

  const handleStepBack = () => {
    if (selectedGrade !== 'all') {
      setSelectedGrade('all');
      setSelectedSubject('all');
    } else if (selectedStage !== 'all') {
      setSelectedStage('all');
    } else if (selectedCategory !== 'all') {
      setSelectedCategory('all');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Top Search & Breadcrumb Navigation */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث مباشرة باسم المذكرة، المادة، أو الصف الدراسي..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3 rounded-2xl border border-slate-200 text-sm focus:border-blue-600 outline-hidden"
          />
        </div>

        {/* Folder Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStage('all');
                setSelectedGrade('all');
                setSelectedSubject('all');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                selectedCategory === 'all' && !isSearching
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              كل الأقسام
            </button>

            {selectedCategory !== 'all' && (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStage('all');
                    setSelectedGrade('all');
                    setSelectedSubject('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    selectedStage === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {selectedCategory}
                </button>
              </>
            )}

            {selectedStage !== 'all' && (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGrade('all');
                    setSelectedSubject('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    selectedGrade === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {selectedStage}
                </button>
              </>
            )}

            {selectedGrade !== 'all' && (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white">
                  {selectedGrade}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {folderLevel === 'notebooks' && settings.subjects.length > 0 && (
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
              >
                <option value="all">كل المواد</option>
                {settings.subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            )}

            {(selectedCategory !== 'all' || isSearching) && (
              <button
                type="button"
                onClick={() => {
                  if (isSearching) setSearchQuery('');
                  else handleStepBack();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>رجوع</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LEVEL 1: Categories Folders */}
      {folderLevel === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {settings.categories.map((cat) => {
            const count = visibleNotebooks.filter((n) => n.category === cat).length;
            return (
              <div
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-lg transition-all cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition flex items-center justify-center shrink-0">
                    <Folder className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition">
                      {cat}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {count > 0 ? `${count} مذكرة متاحة` : 'اضغط لاستعراض المراحل'}
                    </p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
              </div>
            );
          })}
        </div>
      )}

      {/* LEVEL 2: Educational Stages Folders inside Selected Category */}
      {folderLevel === 'stages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">
              اختر المرحلة الدراسية داخل «{selectedCategory}»
            </h3>
            <button
              type="button"
              onClick={() => setSelectedGrade('__ALL_IN_CATEGORY__')}
              className="hidden"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {settings.stages.map((st) => {
              const count = visibleNotebooks.filter(
                (n) => n.category === selectedCategory && n.stage === st
              ).length;
              return (
                <div
                  key={st}
                  onClick={() => setSelectedStage(st)}
                  className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-lg transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition flex items-center justify-center shrink-0">
                      <FolderOpen className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition">
                        {st}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {count > 0 ? `يحتوي على ${count} مذكرة` : 'تصفح صفوف المرحلة'}
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LEVEL 3: Grades Folders inside Selected Stage */}
      {folderLevel === 'grades' && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900">
            اختر الصف الدراسي داخل «{selectedStage}»
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {settings.grades.map((gr) => {
              const count = visibleNotebooks.filter(
                (n) =>
                  n.category === selectedCategory &&
                  n.stage === selectedStage &&
                  n.grade === gr
              ).length;
              return (
                <div
                  key={gr}
                  onClick={() => setSelectedGrade(gr)}
                  className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-lg transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition flex items-center justify-center shrink-0">
                      <Folder className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 group-hover:text-amber-700 transition">
                        {gr}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {count > 0 ? `${count} مذكرة جاهزة` : 'افتح المجلد'}
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-amber-600" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LEVEL 4: Notebooks inside Selected Grade (or Search Results) */}
      {folderLevel === 'notebooks' && (
        <>
          {filteredNotebooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotebooks.map((nb) => (
                <NotebookCard
                  key={nb.id}
                  notebook={nb}
                  onPreview={() => onPreviewNotebook(nb)}
                  onOrder={() => onOrderNotebook(nb)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center max-w-2xl mx-auto space-y-5 shadow-xs">
              {settings.emptyCatalogImage ? (
                <img
                  src={settings.emptyCatalogImage}
                  alt="Empty Section"
                  className="max-h-60 mx-auto rounded-2xl object-contain"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <BookOpen className="w-8 h-8" />
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">
                  {settings.emptyCatalogTitle || 'جاري تجهيز أحدث المذكرات لهذا القسم قريبًا!'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {settings.emptyCatalogSubtitle ||
                    'نعمل حاليًا على تنسيق ومراجعة مذكرات هذا القسم بأعلى جودة. يمكنك حجز مذكرتك مسبقًا.'}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onOrderCustom}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  {settings.emptyCatalogBtnText || 'اطلب تجهيز مذكرتك الآن'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isSearching) setSearchQuery('');
                    else handleStepBack();
                  }}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer"
                >
                  العودة للخلف
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OffersPage({ coupons, notebooks, onOrderNotebook, onPreviewNotebook, onCopyCode }) {
  const discountedNotebooks = notebooks.filter(
    (n) => !n.isHidden && Number(n.oldPrice) > Number(n.price)
  );
  const activeCoupons = coupons.filter((c) => c.active);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {activeCoupons.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900">كوبونات الخصم المتاحة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeCoupons.map((cp) => (
              <div
                key={cp.id}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs font-black">
                    خصم {cp.discountPercent}%
                  </span>
                  <p className="text-sm font-bold pt-2">{cp.description}</p>
                </div>
                <div className="flex items-center justify-between bg-slate-950/30 rounded-2xl px-4 py-3">
                  <span className="font-mono font-black tracking-wider text-amber-300">{cp.code}</span>
                  <button
                    type="button"
                    onClick={() => onCopyCode(cp.code)}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-black text-slate-900">مذكرات عليها خصومات خاصة</h2>
        {discountedNotebooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {discountedNotebooks.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                onPreview={() => onPreviewNotebook(nb)}
                onOrder={() => onOrderNotebook(nb)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-sm text-slate-500 font-bold">
            لا توجد مذكرات مخفضة حاليًا — يمكنك استخدام كوبونات الخصم أعلاه عند طلب أي مذكرة!
          </div>
        )}
      </div>
    </div>
  );
}

function TrackOrderPage({ orders, settings }) {
  const [queryText, setQueryText] = useState('');
  const [searched, setSearched] = useState(false);

  const matched = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return [];
    return orders.filter(
      (o) =>
        String(o.orderCode || '').toLowerCase() === q ||
        normalizePhone(o.phone) === normalizePhone(q)
    );
  }, [orders, queryText]);

  const statusLabels = {
    pending: { label: 'قيد المراجعة والتجهيز', cls: 'bg-amber-100 text-amber-800' },
    in_progress: { label: 'جاري التنسيق وإضافة الشعار', cls: 'bg-blue-100 text-blue-800' },
    completed: { label: 'مكتمل وجاهز للتسليم', cls: 'bg-emerald-100 text-emerald-800' }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4 text-center">
        <h2 className="text-2xl font-black text-slate-900">تتبع حالة طلبك</h2>
        <p className="text-xs text-slate-500">أدخل رقم الطلب (مثال: MZ-123456) أو رقم هاتفك المسجل في الطلب</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearched(true);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="رقم الطلب أو رقم الهاتف..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer"
          >
            بحث
          </button>
        </form>
      </div>

      {searched && (
        <div className="space-y-3">
          {matched.length > 0 ? (
            matched.map((ord) => {
              const st = statusLabels[ord.status] || statusLabels.pending;
              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-mono font-black text-blue-700">{ord.orderCode}</div>
                    <h4 className="text-sm font-black text-slate-900 mt-0.5">{ord.notebookTitle}</h4>
                    <p className="text-xs text-slate-500 mt-1">باسم: {ord.teacherName}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-3">
              <p className="text-xs font-bold text-slate-600">لم يتم العثور على طلب مطابق لهذا الرقم.</p>
              <a
                href={`https://wa.me/${formatWhatsAppNumber(settings.whatsappNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تواصل معنا عبر واتساب</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContactPage({ settings }) {
  const waNum = formatWhatsAppNumber(settings.whatsappNumber);
  const links = Array.isArray(settings.socialLinks) ? settings.socialLinks : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">تواصل مع فريق {settings.brandName}</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            نسعد بالرد على جميع استفسارات المعلمين وطلبات التخصيص الخاصة على مدار اليوم
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href={`https://wa.me/${waNum}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
          >
            <div>
              <div className="text-sm font-black text-slate-900">مراسلة مباشرة عبر واتساب</div>
              <div className="text-xs text-emerald-700 font-bold mt-1" dir="ltr">
                +{waNum}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
              <SocialBrandIcon url="whatsapp" className="w-6 h-6" />
            </div>
          </a>

          <a
            href={`tel:${normalizePhone(settings.whatsappNumber)}`}
            className="flex items-center justify-between p-5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
          >
            <div>
              <div className="text-sm font-black text-slate-900">الاتصال الهاتفي بخدمة العملاء</div>
              <div className="text-xs text-blue-700 font-bold mt-1" dir="ltr">
                {normalizePhone(settings.whatsappNumber)}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
          </a>

          {links.map((item) => (
            <a
              key={item.id}
              href={sanitizeUrl(item.url)}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between p-5 rounded-2xl border transition ${getSocialColorClasses(
                item.color
              )}`}
            >
              <div className="min-w-0 pl-3">
                <div className="text-sm font-black text-slate-900 truncate">{item.label}</div>
                <div className="text-xs opacity-75 truncate mt-1" dir="ltr">
                  {item.url}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center shrink-0">
                <SocialBrandIcon url={item.url} label={item.label} className="w-6 h-6" />
              </div>
            </a>
          ))}
        </div>

        {settings.paymentInstructions && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="font-black text-slate-900">بيانات الدفع والتحويل المعتمدة:</div>
            <p>{settings.paymentInstructions}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 10. Admin Tabs & Portal
// ==========================================
function AdminOrdersTab({ orders, onUpdateStatus, onDeleteOrder }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black text-slate-900">سجل الطلبات الواردة ({orders.length})</h3>
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-sm text-slate-500">
          لا توجد طلبات مسجلة بعد.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-blue-700">{ord.orderCode}</span>
                  <span className="text-xs text-slate-400">
                    • {new Date(ord.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900">{ord.notebookTitle}</h4>
                <p className="text-xs text-slate-600">
                  المعلم: <strong>{ord.teacherName}</strong> • هاتف: <span dir="ltr">{ord.phone}</span> • الإجمالي:{' '}
                  <strong>{ord.finalPrice} ج.م</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={ord.status || 'pending'}
                  onChange={(e) => onUpdateStatus(ord.id, e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                >
                  <option value="pending">قيد المراجعة</option>
                  <option value="in_progress">جاري التنسيق</option>
                  <option value="completed">مكتمل</option>
                </select>
                <button
                  type="button"
                  onClick={() => onDeleteOrder(ord.id)}
                  className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminNotebooksTab({
  notebooks,
  settings,
  onSaveNotebook,
  onDeleteNotebook,
  showToast
}) {
  const emptyForm = {
    id: '',
    title: '',
    category: settings.categories[0] || 'مذكرات الترم الأول',
    stage: settings.stages[0] || 'المرحلة الإعدادية',
    grade: settings.grades[0] || 'الصف الأول الإعدادي',
    subject: settings.subjects[0] || 'اللغة العربية',
    price: 100,
    oldPrice: 150,
    pages: 50,
    badge: '',
    description: '',
    coverImage: '',
    sampleImages: [],
    sampleCount: 0,
    driveUrl: '',
    isComingSoon: false,
    comingSoonText: '',
    isHidden: false
  };

  const [form, setForm] = useState(emptyForm);
  const [newSampleFiles, setNewSampleFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const startEdit = (nb) => {
    setForm({ ...emptyForm, ...nb });
    setNewSampleFiles([]);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1100, 0.82);
      setForm((prev) => ({ ...prev, coverImage: compressed }));
      showToast('تم تجهيز صورة الغلاف بجودة عالية');
    } catch {
      showToast('تعذر معالجة صورة الغلاف', 'error');
    }
  };

  const handleSamplesUpload = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 15);
    if (files.length === 0) return;
    try {
      const compressedList = [];
      for (const f of files) {
        const hd = await compressImageFile(f, 1280, 0.85);
        compressedList.push(hd);
      }
      setNewSampleFiles(compressedList);
      showToast(`تم تجهيز ${compressedList.length} صفحة عينة بجودة HD`);
    } catch {
      showToast('تعذر معالجة صور العينات', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('يرجى كتابة عنوان المذكرة', 'error');
      return;
    }
    setSaving(true);
    try {
      const nbId = form.id || 'nb-' + Date.now();
      const payload = {
        ...form,
        id: nbId,
        price: Number(form.price) || 0,
        oldPrice: Number(form.oldPrice) || 0,
        pages: Number(form.pages) || 0,
        sampleCount: newSampleFiles.length > 0 ? newSampleFiles.length : form.sampleCount || 0
      };
      await onSaveNotebook(payload, newSampleFiles.length > 0 ? newSampleFiles : null);
      setForm(emptyForm);
      setNewSampleFiles([]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">
            {form.id ? 'تعديل بيانات المذكرة' : 'إضافة مذكرة جديدة'}
          </h3>
          {form.id && (
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setNewSampleFiles([]);
              }}
              className="text-xs font-bold text-rose-600 cursor-pointer"
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="عنوان المذكرة..."
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
        />

        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
          >
            {settings.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
          >
            {settings.stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
          >
            {settings.grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
          >
            {settings.subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">السعر الحالي</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">قبل الخصم</label>
            <input
              type="number"
              value={form.oldPrice}
              onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">الصفحات</label>
            <input
              type="number"
              value={form.pages}
              onChange={(e) => setForm({ ...form, pages: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
            />
          </div>
        </div>

        <input
          type="text"
          placeholder="شارة التميز (مثال: الأكثر طلبًا / عرض خاص)"
          value={form.badge}
          onChange={(e) => setForm({ ...form, badge: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
        />

        <textarea
          rows={3}
          placeholder="وصف المذكرة..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs"
        />

        {/* Coming Soon Option */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
          <label className="flex items-center gap-2 text-xs font-black text-amber-950 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.isComingSoon)}
              onChange={(e) => setForm({ ...form, isComingSoon: e.target.checked })}
            />
            <span>المذكرة لم تكتمل بعد (وضع إعلان «قريبًا / حجز مسبق»)</span>
          </label>
          {form.isComingSoon && (
            <input
              type="text"
              placeholder="اكتب نص الإعلان أو موعد الصدور (مثال: قريبًا جدًا — احجز نسختك مبكرًا!)"
              value={form.comingSoonText || ''}
              onChange={(e) => setForm({ ...form, comingSoonText: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs"
            />
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            رابط Google Drive لمطالعة نسخة المذكرة (اختياري)
          </label>
          <input
            type="url"
            placeholder="https://drive.google.com/..."
            value={form.driveUrl || ''}
            onChange={(e) => setForm({ ...form, driveUrl: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            dir="ltr"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">صورة غلاف المذكرة</label>
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="text-xs w-full" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              صور صفحات عينة المعاينة (حتى 15 صفحة HD)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSamplesUpload}
              className="text-xs w-full"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm cursor-pointer transition"
        >
          {saving ? 'جاري الحفظ في السحابة...' : form.id ? 'حفظ التعديلات' : '+ إضافة المذكرة'}
        </button>
      </form>

      {/* Notebooks List */}
      <div className="lg:col-span-6 space-y-3">
        {notebooks.map((nb) => (
          <div
            key={nb.id}
            className={`rounded-2xl p-4 border flex items-center justify-between gap-3 transition ${
              nb.isHidden
                ? 'bg-slate-100/90 border-slate-300 opacity-80'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-slate-900 truncate">{nb.title}</h4>
                {nb.isHidden && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-700 text-white text-[10px] font-extrabold shrink-0">
                    مخفية عن الزوار
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {nb.category} • {nb.grade} • <span className="text-blue-700 font-bold">{nb.price} ج.م</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onSaveNotebook({ ...nb, isHidden: !nb.isHidden }, null)}
                title={nb.isHidden ? 'إظهار المذكرة للزوار' : 'إخفاء المذكرة مؤقتًا عن الزوار'}
                className={`px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition ${
                  nb.isHidden
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                {nb.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{nb.isHidden ? 'إظهار' : 'إخفاء'}</span>
              </button>
              <button
                type="button"
                onClick={() => startEdit(nb)}
                title="تعديل المذكرة"
                className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteNotebook(nb.id)}
                title="حذف نهائي"
                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCouponsTab({ coupons, onSaveCoupon, onDeleteCoupon, showToast }) {
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [description, setDescription] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('أدخل كود الخصم', 'error');
      return;
    }
    await onSaveCoupon({
      id: 'cp-' + Date.now(),
      code: code.trim().toUpperCase(),
      discountPercent: Number(discountPercent) || 10,
      description: description.trim() || `خصم ${discountPercent}%`,
      active: true
    });
    setCode('');
    setDescription('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <form
        onSubmit={handleAdd}
        className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 space-y-4"
      >
        <h3 className="text-lg font-black text-slate-900">إضافة كود خصم جديد</h3>
        <input
          type="text"
          placeholder="كود الخصم (مثال: SAVE20)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm uppercase font-mono"
        />
        <input
          type="number"
          placeholder="نسبة الخصم %"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
        />
        <input
          type="text"
          placeholder="وصف العرض..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
        />
        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-blue-600 text-white font-black text-sm cursor-pointer"
        >
          + إنشاء الكوبون
        </button>
      </form>

      <div className="lg:col-span-7 space-y-3">
        {coupons.map((cp) => (
          <div
            key={cp.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between"
          >
            <div>
              <span className="font-mono font-black text-blue-700">{cp.code}</span>
              <span className="mr-2 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                {cp.discountPercent}%
              </span>
              <p className="text-xs text-slate-500 mt-1">{cp.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onDeleteCoupon(cp.id)}
              className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminTaxonomyTab({ settings, onSaveSettings, showToast }) {
  const [newItems, setNewItems] = useState({ categories: '', stages: '', grades: '', subjects: '' });

  const addItem = async (key) => {
    const val = newItems[key].trim();
    if (!val) return;
    if (settings[key].includes(val)) {
      showToast('هذا العنصر موجود بالفعل', 'error');
      return;
    }
    await onSaveSettings({ ...settings, [key]: [...settings[key], val] });
    setNewItems({ ...newItems, [key]: '' });
  };

  const removeItem = async (key, item) => {
    await onSaveSettings({ ...settings, [key]: settings[key].filter((x) => x !== item) });
  };

  const groups = [
    { key: 'categories', title: 'الأقسام الرئيسية' },
    { key: 'stages', title: 'المراحل الدراسية' },
    { key: 'grades', title: 'الصفوف الدراسية' },
    { key: 'subjects', title: 'المواد الدراسية' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {groups.map((grp) => (
        <div key={grp.key} className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
          <h3 className="text-base font-black text-slate-900">{grp.title}</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`إضافة إلى ${grp.title}...`}
              value={newItems[grp.key]}
              onChange={(e) => setNewItems({ ...newItems, [grp.key]: e.target.value })}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
            <button
              type="button"
              onClick={() => addItem(grp.key)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer"
            >
              إضافة
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings[grp.key].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-800"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => removeItem(grp.key, item)}
                  className="text-rose-500 hover:text-rose-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminSettingsTab({ settings, onSaveSettings, onExportBackup, onImportBackup, showToast }) {
  const [form, setForm] = useState(settings);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newSocialLabel, setNewSocialLabel] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialColor, setNewSocialColor] = useState('blue');

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleImageUpload = async (e, fieldKey, maxW = 1100) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, maxW, 0.82);
      setForm((prev) => ({ ...prev, [fieldKey]: compressed }));
      showToast('تم تجهيز الصورة — اضغط «حفظ جميع الإعدادات» لتثبيتها');
    } catch {
      showToast('تعذر قراءة الصورة', 'error');
    }
  };

  const handleHeroCardCover = async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 900, 0.82);
      const updated = [...(form.heroCards || [])];
      updated[idx] = { ...updated[idx], coverImage: compressed };
      setForm({ ...form, heroCards: updated });
      showToast('تم رفع غلاف البطاقة');
    } catch {
      showToast('تعذر رفع الغلاف', 'error');
    }
  };

  const moveHomeSection = (idx, dir) => {
    const order = [...(form.homeSectionOrder || ['hero', 'sections', 'about', 'featured'])];
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    [order[idx], order[target]] = [order[target], order[idx]];
    setForm({ ...form, homeSectionOrder: order });
  };

  const moveOrderField = (idx, dir) => {
    const list = [...(form.orderFormFields || [])];
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    setForm({ ...form, orderFormFields: list });
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const field = {
      id: 'fld_' + Date.now(),
      label: newFieldLabel.trim(),
      placeholder: newFieldPlaceholder.trim(),
      type: 'text',
      required: false,
      enabled: true
    };
    setForm({ ...form, orderFormFields: [...(form.orderFormFields || []), field] });
    setNewFieldLabel('');
    setNewFieldPlaceholder('');
  };

  const addSocialLink = () => {
    if (!newSocialLabel.trim() || !newSocialUrl.trim()) {
      showToast('أدخل اسم المنصة والرابط', 'error');
      return;
    }
    const item = {
      id: 'soc_' + Date.now(),
      label: newSocialLabel.trim(),
      url: sanitizeUrl(newSocialUrl),
      color: newSocialColor
    };
    setForm({ ...form, socialLinks: [...(form.socialLinks || []), item] });
    setNewSocialLabel('');
    setNewSocialUrl('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await onSaveSettings(form);
  };

  const sectionNames = {
    hero: 'الواجهة الترحيبية الرئيسية (Hero)',
    sections: 'بطاقات الأقسام الرئيسية (الترم الأول / الثاني / التأسيس)',
    about: 'قسم مميزات المنصة',
    featured: 'قسم أحدث المذكرات المتاحة'
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* 1. Brand & Visual Hero */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-5">
        <h3 className="text-lg font-black text-slate-900">1. الهوية البصرية والشعار والواجهة الرئيسية</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنصة</label>
            <input
              type="text"
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الوصف المختصر تحت الاسم</label>
            <input
              type="text"
              value={form.brandTagline}
              onChange={(e) => setForm({ ...form, brandTagline: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800">شعار المنصة (500×500 بكسل)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'logoUrl', 500)}
              className="text-xs w-full"
            />
            {form.logoUrl && (
              <button
                type="button"
                onClick={() => setForm({ ...form, logoUrl: '' })}
                className="text-xs text-rose-600 font-bold cursor-pointer"
              >
                حذف الشعار
              </button>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800">
              صورة خلفية الواجهة الترحيبية (Hero)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'heroBgImage', 1400)}
              className="text-xs w-full"
            />
            {form.heroBgImage && (
              <button
                type="button"
                onClick={() => setForm({ ...form, heroBgImage: '' })}
                className="text-xs text-rose-600 font-bold cursor-pointer"
              >
                حذف صورة الخلفية
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              حجم الشعار ({form.logoSize || 64}px)
            </label>
            <input
              type="range"
              min={40}
              max={140}
              value={form.logoSize || 64}
              onChange={(e) => setForm({ ...form, logoSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              وضوح صورة الخلفية ({form.heroBgOpacity || 45}%)
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={form.heroBgOpacity || 45}
              onChange={(e) => setForm({ ...form, heroBgOpacity: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ارتفاع الواجهة ({form.heroHeight || 540}px)
            </label>
            <input
              type="range"
              min={360}
              max={760}
              value={form.heroHeight || 540}
              onChange={(e) => setForm({ ...form, heroHeight: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="العنوان الرئيسي في الواجهة"
            value={form.heroTitle}
            onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
          />
          <textarea
            rows={2}
            placeholder="النص الفرعي للواجهة"
            value={form.heroSubtitle}
            onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رقم الواتساب الأساسي</label>
            <input
              type="text"
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تعليمات الدفع والتحويل</label>
            <input
              type="text"
              value={form.paymentInstructions}
              onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showPromoBanner !== false}
              onChange={(e) => setForm({ ...form, showPromoBanner: e.target.checked })}
            />
            <span>إظهار الشريط الترويجي العلوي</span>
          </label>
          <input
            type="text"
            value={form.promoBanner}
            onChange={(e) => setForm({ ...form, promoBanner: e.target.value })}
            className="flex-1 min-w-[260px] px-4 py-2 rounded-xl border border-slate-200 text-xs"
          />
        </div>
      </div>

      {/* 2. Social Links Management */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
        <div>
          <h3 className="text-lg font-black text-slate-900">2. إدارة روابط التواصل الاجتماعي</h3>
          <p className="text-xs text-slate-500">
            أضف أو احذف أي رابط (فيسبوك، جروب واتساب، تليجرام، يوتيوب، تيك توك...) وستظهر أيقونته تلقائيًا في نافذة التواصل وصفحة اتصل بنا
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input
            type="text"
            placeholder="اسم الزر (مثال: قناة التليجرام)"
            value={newSocialLabel}
            onChange={(e) => setNewSocialLabel(e.target.value)}
            className="sm:col-span-4 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
          />
          <input
            type="url"
            placeholder="https://..."
            value={newSocialUrl}
            onChange={(e) => setNewSocialUrl(e.target.value)}
            className="sm:col-span-5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            dir="ltr"
          />
          <select
            value={newSocialColor}
            onChange={(e) => setNewSocialColor(e.target.value)}
            className="sm:col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
          >
            <option value="blue">أزرق</option>
            <option value="emerald">أخضر</option>
            <option value="sky">سماوي</option>
            <option value="rose">أحمر</option>
            <option value="amber">ذهبي</option>
          </select>
          <button
            type="button"
            onClick={addSocialLink}
            className="sm:col-span-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer"
          >
            + إضافة
          </button>
        </div>

        <div className="space-y-2">
          {(form.socialLinks || []).map((soc, idx) => (
            <div
              key={soc.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-700 shrink-0">
                  <SocialBrandIcon url={soc.url} label={soc.label} className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={soc.label}
                  onChange={(e) => {
                    const updated = [...form.socialLinks];
                    updated[idx] = { ...soc, label: e.target.value };
                    setForm({ ...form, socialLinks: updated });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold w-40"
                />
                <input
                  type="url"
                  value={soc.url}
                  onChange={(e) => {
                    const updated = [...form.socialLinks];
                    updated[idx] = { ...soc, url: e.target.value };
                    setForm({ ...form, socialLinks: updated });
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  dir="ltr"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    socialLinks: form.socialLinks.filter((item) => item.id !== soc.id)
                  })
                }
                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Home Layout & Hero Cards with Covers */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6">
        <h3 className="text-lg font-black text-slate-900">
          3. التحكم الكامل في الصفحة الرئيسية وأغلفة المراحل والأقسام
        </h3>

        <div className="space-y-2">
          <div className="text-xs font-black text-slate-700 mb-2">ترتيب أقسام الصفحة الرئيسية:</div>
          {(form.homeSectionOrder || ['hero', 'sections', 'about', 'featured']).map((secKey, idx) => (
            <div
              key={secKey}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200"
            >
              <span className="text-xs font-extrabold text-slate-800">{sectionNames[secKey] || secKey}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => moveHomeSection(idx, -1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveHomeSection(idx, 1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <label className="flex items-center gap-2 text-xs font-bold p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showHeroSection !== false}
              onChange={(e) => setForm({ ...form, showHeroSection: e.target.checked })}
            />
            <span>الواجهة الترحيبية</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showHeroSideCard !== false}
              onChange={(e) => setForm({ ...form, showHeroSideCard: e.target.checked })}
            />
            <span>بطاقة المميزات الجانبية</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showSectionsGrid !== false}
              onChange={(e) => setForm({ ...form, showSectionsGrid: e.target.checked })}
            />
            <span>بطاقات الأقسام</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showFeaturedSection !== false}
              onChange={(e) => setForm({ ...form, showFeaturedSection: e.target.checked })}
            />
            <span>أحدث المذكرات</span>
          </label>
        </div>

        {/* Hero Cards Cover Images */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800">
              بطاقات الأقسام في الصفحة الرئيسية وصور أغلفتها (800×450 بكسل):
            </span>
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  heroCards: [
                    ...(form.heroCards || []),
                    {
                      id: 'hc-' + Date.now(),
                      title: 'قسم جديد',
                      description: 'وصف مختصر للقسم...',
                      badge: 'جديد',
                      category: settings.categories[0] || 'مذكرات الترم الأول',
                      buttonText: 'تصفح القسم',
                      coverImage: ''
                    }
                  ]
                })
              }
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              + إضافة بطاقة قسم
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(form.heroCards || []).map((card, idx) => (
              <div key={card.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-700">بطاقة #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        heroCards: form.heroCards.filter((_, i) => i !== idx)
                      })
                    }
                    className="text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) => {
                    const updated = [...form.heroCards];
                    updated[idx] = { ...card, title: e.target.value };
                    setForm({ ...form, heroCards: updated });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                />
                <textarea
                  rows={2}
                  value={card.description}
                  onChange={(e) => {
                    const updated = [...form.heroCards];
                    updated[idx] = { ...card, description: e.target.value };
                    setForm({ ...form, heroCards: updated });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                />
                <select
                  value={card.category}
                  onChange={(e) => {
                    const updated = [...form.heroCards];
                    updated[idx] = { ...card, category: e.target.value };
                    setForm({ ...form, heroCards: updated });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                >
                  {settings.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">صورة غلاف البطاقة:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleHeroCardCover(idx, e)}
                    className="text-[11px] w-full"
                  />
                  {card.coverImage && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...form.heroCards];
                        updated[idx] = { ...card, coverImage: '' };
                        setForm({ ...form, heroCards: updated });
                      }}
                      className="text-[11px] text-rose-600 font-bold mt-1 cursor-pointer"
                    >
                      إزالة الغلاف
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Empty Catalog Customization */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
        <h3 className="text-lg font-black text-slate-900">
          4. تخصيص رسالة وصورة القسم الفارغ (عند عدم وجود مذكرات في القسم بعد)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="العنوان الرئيسي عند خلو القسم"
            value={form.emptyCatalogTitle || ''}
            onChange={(e) => setForm({ ...form, emptyCatalogTitle: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
          />
          <input
            type="text"
            placeholder="نص زر الحجز أو الطلب المسبق"
            value={form.emptyCatalogBtnText || ''}
            onChange={(e) => setForm({ ...form, emptyCatalogBtnText: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
          />
        </div>
        <textarea
          rows={2}
          placeholder="النص التوضيحي أو الإعلاني..."
          value={form.emptyCatalogSubtitle || ''}
          onChange={(e) => setForm({ ...form, emptyCatalogSubtitle: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
        />
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'emptyCatalogImage', 900)}
            className="text-xs"
          />
          {form.emptyCatalogImage && (
            <button
              type="button"
              onClick={() => setForm({ ...form, emptyCatalogImage: '' })}
              className="text-xs text-rose-600 font-bold cursor-pointer"
            >
              حذف الصورة
            </button>
          )}
        </div>
      </div>

      {/* 5. Order Form Fields Customization & Ordering */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
        <h3 className="text-lg font-black text-slate-900">5. تخصيص حقول نموذج الطلب وأماكنها</h3>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
          <label className="flex items-center gap-2 text-xs font-black text-blue-950 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showLogoUploadField !== false}
              onChange={(e) => setForm({ ...form, showLogoUploadField: e.target.checked })}
            />
            <span>إظهار حقل رفع شعار المعلم أو السنتر</span>
          </label>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">مكان حقل الشعار:</span>
            <select
              value={form.logoFieldPosition || 'top'}
              onChange={(e) => setForm({ ...form, logoFieldPosition: e.target.value })}
              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-white font-bold"
            >
              <option value="top">في أعلى النموذج</option>
              <option value="middle">في منتصف النموذج</option>
              <option value="bottom">في أسفل النموذج</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {(form.orderFormFields || []).map((fld, idx) => (
            <div
              key={fld.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveOrderField(idx, -1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveOrderField(idx, 1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
              </div>

              <input
                type="text"
                value={fld.label}
                onChange={(e) => {
                  const updated = [...form.orderFormFields];
                  updated[idx] = { ...fld, label: e.target.value };
                  setForm({ ...form, orderFormFields: updated });
                }}
                className="flex-1 min-w-[180px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
              />

              <input
                type="text"
                value={fld.placeholder}
                onChange={(e) => {
                  const updated = [...form.orderFormFields];
                  updated[idx] = { ...fld, placeholder: e.target.value };
                  setForm({ ...form, orderFormFields: updated });
                }}
                className="flex-1 min-w-[160px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
              />

              <div className="flex items-center gap-3 text-xs font-bold">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fld.enabled}
                    onChange={(e) => {
                      const updated = [...form.orderFormFields];
                      updated[idx] = { ...fld, enabled: e.target.checked };
                      setForm({ ...form, orderFormFields: updated });
                    }}
                  />
                  <span>إظهار</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fld.required}
                    onChange={(e) => {
                      const updated = [...form.orderFormFields];
                      updated[idx] = { ...fld, required: e.target.checked };
                      setForm({ ...form, orderFormFields: updated });
                    }}
                  />
                  <span>إلزامي</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      orderFormFields: form.orderFormFields.filter((x) => x.id !== fld.id)
                    })
                  }
                  className="text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <input
            type="text"
            placeholder="عنوان حقل جديد..."
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            className="flex-1 min-w-[180px] px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
          />
          <input
            type="text"
            placeholder="النص التوضيحي داخل الحقل..."
            value={newFieldPlaceholder}
            onChange={(e) => setNewFieldPlaceholder(e.target.value)}
            className="flex-1 min-w-[180px] px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
          />
          <button
            type="button"
            onClick={addCustomField}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black cursor-pointer"
          >
            + إضافة حقل جديد
          </button>
        </div>
      </div>

      {/* 6. Local Device Backup */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black">النسخ الاحتياطي على جهازك (JSON)</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            احتفظ بملف نسخة احتياطية كاملة لمذكراتك وإعداداتك وطلباتك على جهازك في أي وقت
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExportBackup}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل نسخة احتياطية</span>
          </button>
          <label className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>استعادة نسخة من جهازي</span>
            <input type="file" accept=".json" onChange={onImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-xl cursor-pointer transition"
      >
        حفظ جميع الإعدادات ومزامنتها
      </button>
    </form>
  );
}

function AdminPortal({
  adminUser,
  onClose,
  onLogout,
  orders,
  notebooks,
  coupons,
  settings,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSaveNotebook,
  onDeleteNotebook,
  onSaveCoupon,
  onDeleteCoupon,
  onSaveSettings,
  onSyncAllToCloud,
  onExportBackup,
  onImportBackup,
  showToast
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast('تم تسجيل الدخول إلى لوحة التحكم بنجاح');
    } catch (err) {
      showToast(`تعذر تسجيل الدخول: ${err.code || 'تأكد من البريد وكلمة المرور'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showToast('اكتب بريدك الإلكتروني أولًا لإرسال رابط استعادة كلمة المرور', 'error');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      showToast('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
    } catch {
      showToast('تعذر إرسال رابط الاستعادة — تأكد من صحة البريد', 'error');
    }
  };

  if (!adminUser) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-7 border border-slate-200 shadow-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">بوابة إدارة المنصة</h3>
                <p className="text-xs text-slate-500">تسجيل دخول المدير المعتمد</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">البريد الإلكتروني للإدارة</label>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">كلمة المرور</label>
              <input
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm cursor-pointer"
            >
              {loading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              className="w-full text-xs text-blue-700 hover:underline font-bold cursor-pointer"
            >
              نسيت كلمة المرور؟ إرسال رابط الاستعادة لبريدي
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Admin Bar */}
      <div className="bg-slate-950 text-white px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black">لوحة تحكم {settings.brandName}</h2>
            <p className="text-[11px] text-slate-400" dir="ltr">
              {adminUser.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSyncAllToCloud}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>مزامنة للسحابة</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
          >
            معاينة الموقع
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'orders', label: `الطلبات (${orders.length})`, icon: Package },
            { id: 'notebooks', label: `المذكرات (${notebooks.length})`, icon: BookOpen },
            { id: 'coupons', label: 'العروض والكوبونات', icon: Tag },
            { id: 'taxonomy', label: 'المراحل والمواد', icon: Layers },
            { id: 'settings', label: 'إعدادات الموقع', icon: Sliders }
          ].map((tab) => {
            const IconComp = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'orders' && (
          <AdminOrdersTab
            orders={orders}
            onUpdateStatus={onUpdateOrderStatus}
            onDeleteOrder={onDeleteOrder}
          />
        )}
        {activeTab === 'notebooks' && (
          <AdminNotebooksTab
            notebooks={notebooks}
            settings={settings}
            onSaveNotebook={onSaveNotebook}
            onDeleteNotebook={onDeleteNotebook}
            showToast={showToast}
          />
        )}
        {activeTab === 'coupons' && (
          <AdminCouponsTab
            coupons={coupons}
            onSaveCoupon={onSaveCoupon}
            onDeleteCoupon={onDeleteCoupon}
            showToast={showToast}
          />
        )}
        {activeTab === 'taxonomy' && (
          <AdminTaxonomyTab
            settings={settings}
            onSaveSettings={onSaveSettings}
            showToast={showToast}
          />
        )}
        {activeTab === 'settings' && (
          <AdminSettingsTab
            settings={settings}
            onSaveSettings={onSaveSettings}
            onExportBackup={onExportBackup}
            onImportBackup={onImportBackup}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}

// ==========================================
// 11. Main Application Component
// ==========================================
function MuzakkiratiApp() {
  const [activePage, setActivePage] = useState('home');
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [settings, setSettings] = useState(() =>
    normalizeSettings(readLS(LS_KEYS.SETTINGS, {}))
  );
  const [notebooks, setNotebooks] = useState(() =>
    readLS(LS_KEYS.NOTEBOOKS, INITIAL_NOTEBOOKS).map(normalizeNotebook).filter(Boolean)
  );
  const [coupons, setCoupons] = useState(() =>
    readLS(LS_KEYS.COUPONS, INITIAL_COUPONS)
  );
  const [orders, setOrders] = useState(() => readLS(LS_KEYS.ORDERS, []));
  const [adminUser, setAdminUser] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [orderModalTarget, setOrderModalTarget] = useState({
    open: false,
    notebook: null
  });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Check URL hash (#admin) & Keyboard Shortcut (Alt + Shift + A)
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setShowAdminModal(true);
      }
    };
    const handleKeyDown = (e) => {
      if (e.altKey && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.code === 'KeyA')) {
        e.preventDefault();
        setShowAdminModal(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const logoClickRef = useRef({ count: 0, timer: null });
  const handleBrandClick = () => {
    setActivePage('home');
    logoClickRef.current.count += 1;
    clearTimeout(logoClickRef.current.timer);
    if (logoClickRef.current.count >= 5) {
      logoClickRef.current.count = 0;
      setShowAdminModal(true);
      return;
    }
    logoClickRef.current.timer = setTimeout(() => {
      logoClickRef.current.count = 0;
    }, 1500);
  };

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAdminUser(user || null);
    });
    return () => unsub();
  }, []);

  // Firestore real-time listeners
  useEffect(() => {
    const unsubSettings = onSnapshot(
      publicDoc('config', 'main'),
      (snap) => {
        if (snap.exists()) {
          const merged = normalizeSettings(snap.data());
          setSettings(merged);
          writeLS(LS_KEYS.SETTINGS, merged);
        }
      },
      () => {}
    );

    const unsubNotebooks = onSnapshot(
      publicCol('notebooks'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => normalizeNotebook({ id: d.id, ...d.data() }))
            .filter(Boolean);
          setNotebooks(list);
          writeLS(LS_KEYS.NOTEBOOKS, list);
        }
      },
      () => {}
    );

    const unsubCoupons = onSnapshot(
      publicCol('coupons'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCoupons(list);
          writeLS(LS_KEYS.COUPONS, list);
        }
      },
      () => {}
    );

    const unsubOrders = onSnapshot(
      publicCol('orders'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        setOrders(list);
        writeLS(LS_KEYS.ORDERS, list);
      },
      () => {}
    );

    return () => {
      unsubSettings();
      unsubNotebooks();
      unsubCoupons();
      unsubOrders();
    };
  }, []);

  // Cloud & Local Persistence Handlers
  const handleSaveSettings = async (nextSettings) => {
    const cleanSettings = normalizeSettings(nextSettings);
    setSettings(cleanSettings);
    writeLS(LS_KEYS.SETTINGS, cleanSettings);
    try {
      await setDoc(publicDoc('config', 'main'), cleanSettings);
      showToast('تم حفظ الإعدادات ومزامنتها في السحابة بنجاح');
    } catch (err) {
      showToast(`تم الحفظ محليًا — تعذرت المزامنة السحابية: ${err.code || ''}`, 'error');
    }
  };

  const handleSaveNotebook = async (nbPayload, newSamplesArray) => {
    const cleanNotebook = { ...nbPayload, sampleImages: [] };
    const updatedList = notebooks.some((n) => n.id === cleanNotebook.id)
      ? notebooks.map((n) => (n.id === cleanNotebook.id ? cleanNotebook : n))
      : [cleanNotebook, ...notebooks];

    setNotebooks(updatedList);
    writeLS(LS_KEYS.NOTEBOOKS, updatedList);

    try {
      await setDoc(publicDoc('notebooks', cleanNotebook.id), cleanNotebook);
      if (Array.isArray(newSamplesArray) && newSamplesArray.length > 0) {
        const oldQ = query(publicCol('notebook_samples'), where('notebookId', '==', cleanNotebook.id));
        const oldSnap = await getDocs(oldQ);
        for (const d of oldSnap.docs) {
          await deleteDoc(d.ref);
        }
        for (let i = 0; i < newSamplesArray.length; i++) {
          const sampleId = `${cleanNotebook.id}_p_${i}`;
          await setDoc(publicDoc('notebook_samples', sampleId), {
            notebookId: cleanNotebook.id,
            pageIndex: i,
            imageData: newSamplesArray[i]
          });
        }
      }
      showToast('تم حفظ المذكرة وصفحات العينة في السحابة بنجاح');
    } catch (err) {
      showToast(`تعذر رفع المذكرة للسحابة: ${err.code || err.message}`, 'error');
    }
  };

  const handleDeleteNotebook = async (nbId) => {
    const updated = notebooks.filter((n) => n.id !== nbId);
    setNotebooks(updated);
    writeLS(LS_KEYS.NOTEBOOKS, updated);
    try {
      await deleteDoc(publicDoc('notebooks', nbId));
      const oldQ = query(publicCol('notebook_samples'), where('notebookId', '==', nbId));
      const oldSnap = await getDocs(oldQ);
      for (const d of oldSnap.docs) {
        await deleteDoc(d.ref);
      }
      showToast('تم حذف المذكرة نهائيًا');
    } catch {
      showToast('تم الحذف محليًا', 'error');
    }
  };

  const handleSaveCoupon = async (cp) => {
    const updated = [cp, ...coupons];
    setCoupons(updated);
    writeLS(LS_KEYS.COUPONS, updated);
    try {
      await setDoc(publicDoc('coupons', cp.id), cp);
      showToast('تم إضافة الكوبون');
    } catch {}
  };

  const handleDeleteCoupon = async (cpId) => {
    const updated = coupons.filter((c) => c.id !== cpId);
    setCoupons(updated);
    writeLS(LS_KEYS.COUPONS, updated);
    try {
      await deleteDoc(publicDoc('coupons', cpId));
      showToast('تم حذف الكوبون');
    } catch {}
  };

  const handleSubmitOrder = async (orderRecord) => {
    const updated = [orderRecord, ...orders];
    setOrders(updated);
    writeLS(LS_KEYS.ORDERS, updated);
    try {
      await setDoc(publicDoc('orders', orderRecord.id), orderRecord);
    } catch {}
    showToast(`تم تسجيل طلبك برقم ${orderRecord.orderCode}`);
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    const updatedOrder = { ...target, status };
    setOrders(orders.map((o) => (o.id === orderId ? updatedOrder : o)));
    try {
      await setDoc(publicDoc('orders', orderId), updatedOrder);
      showToast('تم تحديث حالة الطلب');
    } catch {}
  };

  const handleDeleteOrder = async (orderId) => {
    setOrders(orders.filter((o) => o.id !== orderId));
    try {
      await deleteDoc(publicDoc('orders', orderId));
      showToast('تم حذف الطلب');
    } catch {}
  };

  const handleSyncAllToCloud = async () => {
    try {
      await setDoc(publicDoc('config', 'main'), settings);
      for (const nb of notebooks) {
        await setDoc(publicDoc('notebooks', nb.id), { ...nb, sampleImages: [] });
      }
      for (const cp of coupons) {
        await setDoc(publicDoc('coupons', cp.id), cp);
      }
      showToast('تمت مزامنة جميع البيانات مع السحابة بنجاح');
    } catch (err) {
      showToast(`فشلت المزامنة: ${err.code || ''}`, 'error');
    }
  };

  const handleExportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      settings,
      notebooks,
      coupons,
      orders
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `el3bakera-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تنزيل ملف النسخة الاحتياطية على جهازك');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed.settings) await handleSaveSettings(normalizeSettings(parsed.settings));
        if (Array.isArray(parsed.notebooks)) {
          const cleanNbs = parsed.notebooks.map(normalizeNotebook).filter(Boolean);
          setNotebooks(cleanNbs);
          writeLS(LS_KEYS.NOTEBOOKS, cleanNbs);
        }
        if (Array.isArray(parsed.coupons)) {
          setCoupons(parsed.coupons);
          writeLS(LS_KEYS.COUPONS, parsed.coupons);
        }
        showToast('تمت استعادة النسخة الاحتياطية بنجاح');
      } catch {
        showToast('ملف النسخة الاحتياطية غير صالح', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAdminUser(null);
    setShowAdminModal(false);
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    showToast('تم تسجيل الخروج من لوحة التحكم');
  };

  if (showAdminModal && adminUser) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900">
        {toast && (
          <div
            className={`fixed bottom-5 left-5 z-60 px-4 py-3 rounded-2xl shadow-xl text-xs font-black text-white ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
            }`}
          >
            {toast.message}
          </div>
        )}
        <AdminPortal
          adminUser={adminUser}
          onClose={() => setShowAdminModal(false)}
          onLogout={handleLogout}
          orders={orders}
          notebooks={notebooks}
          coupons={coupons}
          settings={settings}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onDeleteOrder={handleDeleteOrder}
          onSaveNotebook={handleSaveNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          onSaveCoupon={handleSaveCoupon}
          onDeleteCoupon={handleDeleteCoupon}
          onSaveSettings={handleSaveSettings}
          onSyncAllToCloud={handleSyncAllToCloud}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          showToast={showToast}
        />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Promo Banner */}
      {settings.showPromoBanner !== false && settings.promoBanner && (
        <div className="bg-slate-950 text-white text-center px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-center gap-3">
          <span>{settings.promoBanner}</span>
          <button
            type="button"
            onClick={() => setActivePage('offers')}
            className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
          >
            استفد من العرض ←
          </button>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Brand */}
          <div
            onClick={handleBrandClick}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.brandName}
                style={{ width: `${settings.logoSize || 64}px`, height: `${settings.logoSize || 64}px` }}
                className="rounded-2xl object-contain bg-white border border-slate-100 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {settings.brandName}
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">{settings.brandTagline}</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full">
            {[
              { id: 'home', label: 'الرئيسية' },
              { id: 'catalog', label: 'المذكرات' },
              { id: 'offers', label: 'العروض والباقات' },
              { id: 'track', label: 'تتبع طلبك' },
              { id: 'contact', label: 'اتصل بنا' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                  activePage === item.id
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Actions: Social Hub + Admin Button (visible only if logged in) */}
          <div className="flex items-center gap-2">
            {adminUser && (
              <button
                type="button"
                onClick={() => setShowAdminModal(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-900 text-emerald-400 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>لوحة التحكم</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSocialModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تواصل معنا</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            settings={settings}
            notebooks={notebooks}
            onBrowseCatalog={() => {
              setCatalogCategory('all');
              setActivePage('catalog');
            }}
            onSelectCategory={(cat) => {
              setCatalogCategory(cat);
              setActivePage('catalog');
            }}
            onOrderCustom={() => setOrderModalTarget({ open: true, notebook: null })}
            onPreviewNotebook={(nb) => setPreviewNotebook(nb)}
            onOrderNotebook={(nb) => setOrderModalTarget({ open: true, notebook: nb })}
          />
        )}

        {activePage === 'catalog' && (
          <CatalogPage
            notebooks={notebooks}
            settings={settings}
            initialCategory={catalogCategory}
            onPreviewNotebook={(nb) => setPreviewNotebook(nb)}
            onOrderNotebook={(nb) => setOrderModalTarget({ open: true, notebook: nb })}
            onOrderCustom={() => setOrderModalTarget({ open: true, notebook: null })}
          />
        )}

        {activePage === 'offers' && (
          <OffersPage
            coupons={coupons}
            notebooks={notebooks}
            onPreviewNotebook={(nb) => setPreviewNotebook(nb)}
            onOrderNotebook={(nb) => setOrderModalTarget({ open: true, notebook: nb })}
            onCopyCode={(code) => {
              navigator.clipboard?.writeText(code);
              showToast(`تم نسخ الكود: ${code}`);
            }}
          />
        )}

        {activePage === 'track' && <TrackOrderPage orders={orders} settings={settings} />}

        {activePage === 'contact' && <ContactPage settings={settings} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 mt-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-black text-base">{settings.brandName}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{settings.brandTagline}</p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-sm font-black text-white">روابط سريعة</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => setActivePage('catalog')}
                  className="hover:text-white cursor-pointer"
                >
                  تصفح جميع المذكرات
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePage('offers')}
                  className="hover:text-white cursor-pointer"
                >
                  العروض وكوبونات الخصم
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePage('track')}
                  className="hover:text-white cursor-pointer"
                >
                  متابعة حالة الطلب
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setOrderModalTarget({ open: true, notebook: null })}
                  className="hover:text-white cursor-pointer"
                >
                  طلب إعداد مذكرة خاصة
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-black text-white">تواصل معنا</h4>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/${formatWhatsAppNumber(settings.whatsappNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                <SocialBrandIcon url="whatsapp" className="w-4 h-4" />
                <span>واتساب</span>
              </a>
              {(settings.socialLinks || []).map((soc) => (
                <a
                  key={soc.id}
                  href={sanitizeUrl(soc.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                >
                  <SocialBrandIcon url={soc.url} label={soc.label} className="w-4 h-4" />
                  <span>{soc.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-slate-900 py-4 px-4 text-center text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} {settings.brandName}. جميع الحقوق محفوظة.</span>
        </div>
      </footer>

      {/* Modals */}
      {previewNotebook && (
        <ProtectedPreviewModal
          notebook={previewNotebook}
          settings={settings}
          onClose={() => setPreviewNotebook(null)}
          onOrder={() => {
            const target = previewNotebook;
            setPreviewNotebook(null);
            setOrderModalTarget({ open: true, notebook: target });
          }}
        />
      )}

      {orderModalTarget.open && (
        <OrderModal
          notebook={orderModalTarget.notebook}
          settings={settings}
          coupons={coupons}
          onClose={() => setOrderModalTarget({ open: false, notebook: null })}
          onSubmitOrder={handleSubmitOrder}
          showToast={showToast}
        />
      )}

      {showSocialModal && (
        <SocialHubModal settings={settings} onClose={() => setShowSocialModal(false)} />
      )}

      {showAdminModal && !adminUser && (
        <AdminPortal
          adminUser={null}
          onClose={() => setShowAdminModal(false)}
          onLogout={handleLogout}
          orders={orders}
          notebooks={notebooks}
          coupons={coupons}
          settings={settings}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onDeleteOrder={handleDeleteOrder}
          onSaveNotebook={handleSaveNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          onSaveCoupon={handleSaveCoupon}
          onDeleteCoupon={handleDeleteCoupon}
          onSaveSettings={handleSaveSettings}
          onSyncAllToCloud={handleSyncAllToCloud}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          showToast={showToast}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-60 px-4 py-3 rounded-2xl shadow-xl text-xs font-black text-white flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MuzakkiratiApp />
    </ErrorBoundary>
  );
}
