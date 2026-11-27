import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  X,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Tag,
  Package,
  Settings,
  Image as ImageIcon,
  Upload,
  Lock,
  LogOut,
  AlertTriangle,
  Info,
  Download,
  RefreshCw,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
  Loader2,
  Globe,
  Send,
  Youtube,
  Facebook,
  Instagram,
  Phone,
  ArrowRight
} from 'lucide-react';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

// ============================================================================
// 1. إعدادات Firebase والمسارات السحابية
// ============================================================================
const APP_NAMESPACE = 'el3bakera-edu';
const LEGACY_NAMESPACE = 'muzakkirati-edu-app';
const ADMIN_EMAIL = 'mahmoudelzaaty7@gmail.com';
const LOCAL_API_KEY_STORAGE = 'el3bakera_firebase_web_api_key_v1';
const LOCAL_SETTINGS_KEY = 'el3bakera_settings_backup_v4';
const LOCAL_NOTEBOOKS_KEY = 'el3bakera_notebooks_backup_v4';
const LOCAL_SAMPLES_KEY = 'el3bakera_samples_backup_v4';

const LEGACY_NOTEBOOK_KEYS = [
  'el3bakera_notebooks_backup_v4',
  'el3bakera_notebooks_backup_v3',
  'el3bakera_notebooks_backup_v2',
  'el3bakera_notebooks_backup_v1',
  'muzakkirati_notebooks_backup'
];

function extractCleanApiKey(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const match = raw.match(/AIza[0-9A-Za-z_-]{20,}/);
  if (match) return match[0];
  return raw.replace(/apiKey\s*:\s*/gi, '').replace(/["',;\s]/g, '').trim();
}

function getEffectiveApiKey() {
  try {
    const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_API_KEY : '';
    const cleanedEnv = extractCleanApiKey(envKey);
    if (cleanedEnv && cleanedEnv.startsWith('AIza')) return cleanedEnv;
  } catch {
    // تجاهل
  }
  try {
    const saved = localStorage.getItem(LOCAL_API_KEY_STORAGE) || '';
    const cleanedSaved = extractCleanApiKey(saved);
    if (cleanedSaved && cleanedSaved.startsWith('AIza')) return cleanedSaved;
  } catch {
    // تجاهل
  }
  const hardcoded = extractCleanApiKey('AIzaSyD_du5VY8nJGDJ169Fof9EAlI9x2W2d-14');
  return hardcoded && hardcoded.startsWith('AIza') ? hardcoded : '';
}

function buildFirebaseConfig(customApiKey = '') {
  const effectiveKey = extractCleanApiKey(customApiKey) || getEffectiveApiKey();
  return {
    apiKey: effectiveKey || 'AIzaSyPlaceholderKeyForPreviewMode00000',
    authDomain: 'el3bakera-edu.firebaseapp.com',
    projectId: 'el3bakera-edu',
    storageBucket: 'el3bakera-edu.firebasestorage.app',
    messagingSenderId: '74663879858',
    appId: '1:74663879858:web:4327c0ea1b825dd6c615ab'
  };
}

let app = null;
let auth = null;
let db = null;

function initFirebaseServices(customApiKey = '') {
  try {
    const cfg = buildFirebaseConfig(customApiKey);
    const existing = getApps();
    if (existing.length > 0 && customApiKey) {
      // الاحتفاظ بالتطبيق الحالي إن لم يتغير المفتاح
    }
    app = existing.length > 0 ? existing[0] : initializeApp(cfg);
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    db = getFirestore(app);
    return true;
  } catch {
    return false;
  }
}

initFirebaseServices();

async function reinitFirebaseWithNewApiKey(rawKey) {
  const cleanKey = extractCleanApiKey(rawKey);
  if (!cleanKey || !cleanKey.startsWith('AIza')) {
    throw new Error('يرجى إدخال مفتاح Firebase Web API Key صحيح يبدأ بـ AIzaSy...');
  }
  try {
    localStorage.setItem(LOCAL_API_KEY_STORAGE, cleanKey);
  } catch {
    // تجاهل
  }
  try {
    const existing = getApps();
    for (const a of existing) {
      await deleteApp(a);
    }
  } catch {
    // تجاهل
  }
  const cfg = buildFirebaseConfig(cleanKey);
  app = initializeApp(cfg);
  auth = getAuth(app);
  await setPersistence(auth, browserLocalPersistence).catch(() => {});
  db = getFirestore(app);
  return { app, auth, db };
}

const publicCol = (colName) => collection(db, 'artifacts', APP_NAMESPACE, 'public', 'data', colName);
const publicDoc = (colName, docId) => doc(db, 'artifacts', APP_NAMESPACE, 'public', 'data', colName, docId);
const legacyPublicCol = (colName) => collection(db, 'artifacts', LEGACY_NAMESPACE, 'public', 'data', colName);
const legacyPublicDoc = (colName, docId) => doc(db, 'artifacts', LEGACY_NAMESPACE, 'public', 'data', colName, docId);

// ============================================================================
// 2. الثوابت والتصميمات الافتراضية والدوال المساعدة
// ============================================================================
const THEME_PALETTES = {
  royal: {
    label: 'أزرق ملكي (الافتراضي)',
    primaryBg: 'bg-blue-600 hover:bg-blue-700',
    primaryText: 'text-blue-600',
    primarySoftBg: 'bg-blue-50 text-blue-700 border-blue-200',
    accentBorder: 'hover:border-blue-400',
    cardGradient: 'from-blue-600 to-indigo-700'
  },
  emerald: {
    label: 'أخضر زمردي',
    primaryBg: 'bg-emerald-600 hover:bg-emerald-700',
    primaryText: 'text-emerald-600',
    primarySoftBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accentBorder: 'hover:border-emerald-400',
    cardGradient: 'from-emerald-600 to-teal-700'
  },
  indigo: {
    label: 'بنفسجي نيلي',
    primaryBg: 'bg-indigo-600 hover:bg-indigo-700',
    primaryText: 'text-indigo-600',
    primarySoftBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    accentBorder: 'hover:border-indigo-400',
    cardGradient: 'from-indigo-600 to-purple-700'
  },
  slate: {
    label: 'كحلي داكن كلاسيكي',
    primaryBg: 'bg-slate-900 hover:bg-slate-800',
    primaryText: 'text-slate-900',
    primarySoftBg: 'bg-slate-100 text-slate-800 border-slate-300',
    accentBorder: 'hover:border-slate-500',
    cardGradient: 'from-slate-800 to-slate-950'
  }
};

const DEFAULT_CATEGORIES = [
  {
    id: 'cat_term1',
    name: 'مذكرات الترم الأول',
    image: '',
    browseMode: 'hierarchical',
    stages: [
      {
        id: 'stg_prep_t1',
        name: 'المرحلة الإعدادية',
        grades: [
          { id: 'grd_1prep_t1', name: 'الصف الأول الإعدادي' },
          { id: 'grd_2prep_t1', name: 'الصف الثاني الإعدادي' },
          { id: 'grd_3prep_t1', name: 'الصف الثالث الإعدادي' }
        ]
      },
      {
        id: 'stg_sec_t1',
        name: 'المرحلة الثانوية',
        grades: [
          { id: 'grd_1sec_t1', name: 'الصف الأول الثانوي' },
          { id: 'grd_2sec_t1', name: 'الصف الثاني الثانوي' },
          { id: 'grd_3sec_t1', name: 'الصف الثالث الثانوي' }
        ]
      }
    ]
  },
  {
    id: 'cat_term2',
    name: 'مذكرات الترم الثاني',
    image: '',
    browseMode: 'hierarchical',
    stages: [
      {
        id: 'stg_prep_t2',
        name: 'المرحلة الإعدادية',
        grades: [
          { id: 'grd_1prep_t2', name: 'الصف الأول الإعدادي' },
          { id: 'grd_2prep_t2', name: 'الصف الثاني الإعدادي' },
          { id: 'grd_3prep_t2', name: 'الصف الثالث الإعدادي' }
        ]
      },
      {
        id: 'stg_sec_t2',
        name: 'المرحلة الثانوية',
        grades: [
          { id: 'grd_1sec_t2', name: 'الصف الأول الثانوي' },
          { id: 'grd_2sec_t2', name: 'الصف الثاني الثانوي' },
          { id: 'grd_3sec_t2', name: 'الصف الثالث الثانوي' }
        ]
      }
    ]
  },
  {
    id: 'cat_foundation',
    name: 'كورسات التأسيس',
    image: '',
    browseMode: 'direct',
    stages: [
      {
        id: 'stg_found_all',
        name: 'مناهج التأسيس الشاملة',
        grades: [
          { id: 'grd_found_primary', name: 'تأسيس المرحلة الابتدائية' },
          { id: 'grd_found_prep', name: 'تأسيس المرحلة الإعدادية' },
          { id: 'grd_found_sec', name: 'تأسيس المرحلة الثانوية' }
        ]
      }
    ]
  }
];

const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة للمذكرات التعليمية',
  platformTagline: 'مذكرات دراسية احترافية مخصصة باسمك وبياناتك الخاصة',
  primaryTheme: 'royal',
  logoImage: '',
  heroImage: '',
  heroOverlayOpacity: 65,
  heroMinHeight: 460,
  heroBadge: 'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة باحترافية ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة بياناتك الخاصة جاهزة للطباعة الفورية.',
  heroPrimaryBtnText: 'تصفح المذكرات الدراسية',
  heroSecondaryBtnText: 'العروض وباقات التوفير',
  heroCustomBtnText: 'اطلب مذكرة مخصصة',
  showHeroCustomBtn: true,
  promoEnabled: true,
  promoText: 'عرض خاص للمعلمين: خصم 15% على جميع مذكرات الترم + إضافة الشعار مجانًا لفترة محدودة!',
  promoCouponCode: 'OPEN15',
  promoBgColor: '#0f172a',
  promoTextColor: '#ffffff',
  globalAlerts: [],
  whatsappNumber: '201000000000',
  trustTitle: 'لماذا يثق بنا المعلمون؟',
  trustPoints: [
    'تخصيص كامل للغلاف والصفحات الداخلية باسم المعلم ورقم هاتفه وشعاره.',
    'ملفات PDF عالية الدقة منسقة وجاهزة للطباعة الفورية دون تعديل.',
    'محتوى علمي محدث وفق أحدث مواصفات وتعديلات الوزارة.',
    'تسليم سريع عبر واتساب أو Google Drive خلال وقت قياسي.'
  ],
  whatsNewEnabled: true,
  whatsNewTitle: 'ما الجديد؟ أحدث المذكرات والإصدارات',
  whatsNewMode: 'auto',
  whatsNewCount: 4,
  whatsNewManualIds: [],
  newsSectionEnabled: false,
  newsSectionTitle: 'أخبار المنصة ومذكرات قيد التجهيز',
  newsItems: [
    {
      id: 'news_1',
      title: 'جاري تجهيز مراجعات ليلة الامتحان النهائية لجميع الصفوف',
      date: 'قريبًا',
      description: 'يمكنك حجز نسختك المخصصة مسبقًا عبر واتساب ليتم تسليمها فور الصدور.'
    }
  ],
  customBannerEnabled: true,
  customBannerTitle: 'هل تحتاج مذكرة بتصميم خاص أو منهج مخصص؟',
  customBannerSubtitle:
    'فريقنا جاهز لتنسيق وإعداد مذكرتك الخاصة من الصفر باسمك وشعارك وألوانك المفضلة بأعلى جودة للطباعة.',
  customBannerBtnText: 'اطلب مذكرة مخصصة الآن',
  savingsBadgeColor: 'emerald',
  savingsBadgePosition: 'next_to_pages',
  footerNote: 'جميع المذكرات منسقة بأعلى جودة وجاهزة للطباعة والتسليم الفوري بصيغة PDF.',
  orderSuccessMessage: 'تم تسجيل طلبك بنجاح! احتفظ برقم الطلب لمتابعة حالة التجهيز.',
  nextOrderRewardEnabled: true,
  nextOrderRewardPercent: 15,
  nextOrderRewardDays: 7,
  nextOrderRewardPrefix: 'VIP',
  checkoutFields: [
    { id: 'teacherName', label: 'اسم المعلم (كما سيُكتب على المذكرة)', type: 'text', required: true, enabled: true, placeholder: 'مثال: أ/ محمود شحاتة' },
    { id: 'phone', label: 'رقم الواتساب للتواصل والتسليم', type: 'tel', required: true, enabled: true, placeholder: '010xxxxxxxx' },
    { id: 'subject', label: 'المادة الدراسية', type: 'text', required: false, enabled: true, placeholder: 'مثال: اللغة العربية' },
    { id: 'governorate', label: 'المحافظة / السنتر التعليمي', type: 'text', required: false, enabled: true, placeholder: 'اختياري' },
    { id: 'notes', label: 'ملاحظات إضافية (ألوان الغلاف أو بيانات الشعار)', type: 'textarea', required: false, enabled: true, placeholder: 'اكتب أي تفاصيل إضافية هنا...' }
  ],
  socialLinks: [
    { id: 'soc_fb', label: 'صفحتنا على فيسبوك', platform: 'facebook', url: 'https://facebook.com' },
    { id: 'soc_tg', label: 'قناتنا على تليجرام', platform: 'telegram', url: 'https://t.me' }
  ],
  categories: DEFAULT_CATEGORIES
};

function safeText(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return fallback;
}

function toTimeMs(ts) {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (ts.toMillis && typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  const parsed = Date.parse(String(ts));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function extractImageFromValue(val) {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('blob:')
    ) {
      return trimmed;
    }
    return '';
  }
  if (typeof val === 'object') {
    return (
      extractImageFromValue(val.url) ||
      extractImageFromValue(val.src) ||
      extractImageFromValue(val.image) ||
      extractImageFromValue(val.data) ||
      extractImageFromValue(val.base64) ||
      ''
    );
  }
  return '';
}

function extractAnyImagesFromDoc(docData) {
  const results = [];
  const visit = (node) => {
    if (!node) return;
    const direct = extractImageFromValue(node);
    if (direct) {
      if (!results.includes(direct)) results.push(direct);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
    } else if (typeof node === 'object') {
      Object.values(node).forEach(visit);
    }
  };
  visit(docData);
  return results;
}

function normalizeCategories(rawCats) {
  if (!Array.isArray(rawCats) || rawCats.length === 0) return DEFAULT_CATEGORIES;
  return rawCats.map((cat, idx) => ({
    id: safeText(cat?.id, `cat_${idx + 1}`),
    name: safeText(cat?.name || cat?.title || cat?.label, DEFAULT_CATEGORIES[idx]?.name || `قسم ${idx + 1}`),
    image: extractImageFromValue(cat?.image),
    browseMode: cat?.browseMode === 'direct' ? 'direct' : 'hierarchical',
    stages: Array.isArray(cat?.stages)
      ? cat.stages.map((stg, sIdx) => ({
          id: safeText(stg?.id, `stg_${idx}_${sIdx}`),
          name: safeText(stg?.name || stg?.title, `مرحلة ${sIdx + 1}`),
          grades: Array.isArray(stg?.grades)
            ? stg.grades.map((grd, gIdx) => ({
                id: safeText(grd?.id, `grd_${idx}_${sIdx}_${gIdx}`),
                name: safeText(grd?.name || grd?.title, `صف ${gIdx + 1}`)
              }))
            : []
        }))
      : []
  }));
}

function compressImageFile(file, maxWidth = 1400, quality = 0.85, maxBytes = 480000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let curWidth = img.width > maxWidth ? maxWidth : img.width;
        let curQuality = quality;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const renderAttempt = () => {
          const ratio = img.width > curWidth ? curWidth / img.width : 1;
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', curQuality);
        };

        let result = renderAttempt();
        while (result.length > maxBytes && curQuality > 0.45) {
          curQuality = +(curQuality - 0.1).toFixed(2);
          curWidth = Math.round(curWidth * 0.85);
          result = renderAttempt();
        }
        resolve(result);
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function shrinkDataUrlIfNeeded(dataUrl, maxBytes = 480000) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/') || dataUrl.length <= maxBytes) {
      resolve(dataUrl || '');
      return;
    }
    const img = new Image();
    img.onload = () => {
      let curWidth = Math.min(img.width, 1280);
      let curQuality = 0.78;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let result = dataUrl;
      while (result.length > maxBytes && curQuality >= 0.4) {
        const ratio = img.width > curWidth ? curWidth / img.width : 1;
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        result = canvas.toDataURL('image/jpeg', curQuality);
        curQuality = +(curQuality - 0.1).toFixed(2);
        curWidth = Math.round(curWidth * 0.82);
      }
      resolve(result);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function normalizeNotebook(id, data) {
  const d = data || {};
  const cover =
    extractImageFromValue(d.coverImage) ||
    extractImageFromValue(d.coverUrl) ||
    extractImageFromValue(d.coverBase64) ||
    extractImageFromValue(d.cover) ||
    extractImageFromValue(d.image) ||
    extractImageFromValue(d.img) ||
    extractImageFromValue(d.photo) ||
    '';

  const notice =
    safeText(d.noticeText).trim() ||
    safeText(d.notice).trim() ||
    safeText(d.alertText).trim() ||
    safeText(d.note).trim() ||
    safeText(d.warning).trim() ||
    safeText(d.pinnedNotice).trim() ||
    '';

  const inlineSamples = extractAnyImagesFromDoc(d).filter((im) => im !== cover);

  return {
    id,
    title: safeText(d.title || d.name, 'مذكرة دراسية'),
    subtitle: safeText(d.subtitle || d.description || d.desc, ''),
    price: Number(d.price) || 0,
    oldPrice: Number(d.oldPrice || d.priceBeforeDiscount) || 0,
    categoryId: safeText(d.categoryId || d.category || d.catId, ''),
    stageId: safeText(d.stageId || d.stage, ''),
    gradeId: safeText(d.gradeId || d.grade, ''),
    subject: safeText(d.subject, ''),
    term: safeText(d.term, ''),
    pagesCount: safeText(d.pagesCount || d.pages, ''),
    badgeText: safeText(d.badgeText || d.badge, ''),
    comingSoon: Boolean(d.comingSoon),
    hidden: Boolean(d.hidden),
    sortOrder: typeof d.sortOrder === 'number' ? d.sortOrder : 999,
    driveLink: safeText(d.driveLink || d.googleDriveLink || d.pdfLink || d.sampleUrl, ''),
    driveBtnColor: safeText(d.driveBtnColor, '#059669'),
    noticeText: notice,
    noticeColor: safeText(d.noticeColor, 'amber'),
    noticePosition: d.noticePosition === 'bottom' ? 'bottom' : 'top',
    coverImage: cover,
    inlineSamples,
    createdAtMs: toTimeMs(d.createdAt || d.updatedAt)
  };
}

function getSocialIcon(platform, url = '') {
  const p = (platform || url || '').toLowerCase();
  if (p.includes('facebook') || p.includes('fb')) return <Facebook className="w-4 h-4 text-blue-600" />;
  if (p.includes('telegram') || p.includes('t.me')) return <Send className="w-4 h-4 text-sky-500" />;
  if (p.includes('youtube') || p.includes('youtu')) return <Youtube className="w-4 h-4 text-red-600" />;
  if (p.includes('instagram')) return <Instagram className="w-4 h-4 text-pink-600" />;
  if (p.includes('whatsapp') || p.includes('wa.me')) return <Phone className="w-4 h-4 text-emerald-600" />;
  return <Globe className="w-4 h-4 text-slate-600" />;
}

// ============================================================================
// 3. المكون الرئيسي للمنصة
// ============================================================================
export default function App() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          categories: normalizeCategories(parsed.categories)
        };
      }
    } catch {
      // تجاهل
    }
    return DEFAULT_SETTINGS;
  });

  const [notebooks, setNotebooks] = useState(() => {
    try {
      for (const k of LEGACY_NOTEBOOK_KEYS) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item, idx) => normalizeNotebook(item.id || `local_${idx}`, item));
          }
        }
      }
    } catch {
      // تجاهل
    }
    return [];
  });

  const [samplesMap, setSamplesMap] = useState(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SAMPLES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [packages, setPackages] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [orders, setOrders] = useState([]);

  const [activeView, setActiveView] = useState('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [customerForm, setCustomerForm] = useState({});
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);

  const [trackOrderInput, setTrackOrderInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [previewPageIdx, setPreviewPageIdx] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [fetchedSampleNotices, setFetchedSampleNotices] = useState({});
  const fetchedSamplesDoneRef = useRef({});
  const touchStartXRef = useRef(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState(ADMIN_EMAIL);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [customApiKeyInput, setCustomApiKeyInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [toast, setToast] = useState(null);
  const isPoppingHistoryRef = useRef(false);

  const isAdmin = Boolean(firebaseUser && firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  const theme = THEME_PALETTES[settings.primaryTheme] || THEME_PALETTES.royal;

  const showToast = (message, type = 'success') => {
    setToast({ message: safeText(message), type });
    setTimeout(() => setToast(null), 3500);
  };

  // الاستماع لحالة تسجيل الدخول (بما فيها العودة من signInWithRedirect على الهاتف) وروابط ?admin=1
  useEffect(() => {
    if (!auth) return;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setFirebaseUser(user);
      } else {
        setFirebaseUser(null);
      }
    });

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1' || window.location.hash === '#admin') {
        setAdminLoginOpen(true);
      }
    } catch {
      // تجاهل
    }

    const onKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setAdminLoginOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      unsubAuth();
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // دعم زر الرجوع في المتصفح والهاتف
  useEffect(() => {
    if (isPoppingHistoryRef.current) {
      isPoppingHistoryRef.current = false;
      return;
    }
    if (
      previewNotebook ||
      cartOpen ||
      contactModalOpen ||
      adminLoginOpen ||
      activeView !== 'home' ||
      selectedCategoryId ||
      selectedStageId ||
      selectedGradeId
    ) {
      try {
        window.history.pushState({ muzakkiratiNav: true }, '');
      } catch {
        // تجاهل
      }
    }
  }, [
    previewNotebook,
    cartOpen,
    contactModalOpen,
    adminLoginOpen,
    activeView,
    selectedCategoryId,
    selectedStageId,
    selectedGradeId
  ]);

  useEffect(() => {
    const onPopState = () => {
      isPoppingHistoryRef.current = true;
      if (previewNotebook) {
        setPreviewNotebook(null);
        setPreviewFullscreen(false);
        setPreviewZoom(1);
        return;
      }
      if (cartOpen) {
        setCartOpen(false);
        return;
      }
      if (contactModalOpen) {
        setContactModalOpen(false);
        return;
      }
      if (adminLoginOpen) {
        setAdminLoginOpen(false);
        return;
      }
      if (selectedGradeId) {
        setSelectedGradeId('');
        return;
      }
      if (selectedStageId) {
        setSelectedStageId('');
        return;
      }
      if (selectedCategoryId) {
        setSelectedCategoryId('');
        return;
      }
      if (activeView !== 'home') {
        setActiveView('home');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [
    previewNotebook,
    cartOpen,
    contactModalOpen,
    adminLoginOpen,
    selectedGradeId,
    selectedStageId,
    selectedCategoryId,
    activeView
  ]);

  const handleLogoSecretClick = () => {
    const nextCount = logoClickCount + 1;
    if (nextCount >= 5) {
      setLogoClickCount(0);
      if (isAdmin) {
        setActiveView('admin');
      } else {
        setAdminLoginOpen(true);
      }
    } else {
      setLogoClickCount(nextCount);
    }
  };

  const handleBackNavigation = () => {
    if (selectedGradeId) {
      setSelectedGradeId('');
    } else if (selectedStageId) {
      setSelectedStageId('');
    } else if (selectedCategoryId) {
      setSelectedCategoryId('');
    } else {
      setActiveView('home');
    }
  };

  // مزامنة الإعدادات والمذكرات والباقات والكوبونات والطلبات لحظيًا للزوار والإدارة
  useEffect(() => {
    if (!db) return;

    let latestMainSettings = null;
    let latestLogo = '';
    let latestHero = '';
    const latestCatImages = {};

    const applyCombinedSettings = () => {
      setSettings((prev) => {
        const base = latestMainSettings ? { ...DEFAULT_SETTINGS, ...latestMainSettings } : { ...prev };
        const rawCats = latestMainSettings?.categories || base.categories || DEFAULT_CATEGORIES;
        const mergedCats = normalizeCategories(rawCats).map((c) => ({
          ...c,
          image: latestCatImages[c.id] || c.image || ''
        }));
        const next = {
          ...base,
          logoImage: latestLogo || base.logoImage || prev.logoImage || '',
          heroImage: latestHero || base.heroImage || prev.heroImage || '',
          categories: mergedCats
        };
        try {
          localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next));
        } catch {
          // تجاهل
        }
        return next;
      });
    };

    // جلب فوري من جميع مستندات الإعدادات والوسائط (الجديدة والقديمة)
    (async () => {
      try {
        const [mainSnap, logoSnap, heroSnap, configSnap, legacyMainSnap, legacyAssetsSnap, allSettingsSnap] =
          await Promise.all([
            getDoc(publicDoc('settings', 'main')).catch(() => null),
            getDoc(publicDoc('settings', 'media_logo')).catch(() => null),
            getDoc(publicDoc('settings', 'media_hero')).catch(() => null),
            getDoc(publicDoc('config', 'main')).catch(() => null),
            getDoc(legacyPublicDoc('settings', 'main')).catch(() => null),
            getDoc(legacyPublicDoc('settings', 'media_assets')).catch(() => null),
            getDocs(publicCol('settings')).catch(() => null)
          ]);

        const cfgData = configSnap && configSnap.exists() ? configSnap.data() : null;
        const legData = legacyMainSnap && legacyMainSnap.exists() ? legacyMainSnap.data() : null;
        const mainData = mainSnap && mainSnap.exists() ? mainSnap.data() : null;
        const combinedRaw = { ...(legData || {}), ...(cfgData || {}), ...(mainData || {}) };
        const rawAlerts =
          combinedRaw.globalAlerts || combinedRaw.alerts || combinedRaw.announcements || [];
        if (Array.isArray(rawAlerts) && rawAlerts.length > 0) {
          combinedRaw.globalAlerts = rawAlerts.map((al, i) =>
            typeof al === 'string'
              ? { id: `al_${i}`, text: al, color: 'amber', scope: 'all', active: true }
              : {
                  id: safeText(al?.id, `al_${i}`),
                  text: safeText(al?.text || al?.message || al?.title || al?.content, ''),
                  color: safeText(al?.color || al?.type, 'amber'),
                  scope: safeText(al?.scope || al?.placement, 'all'),
                  active: al?.active !== false
                }
          );
        }
        latestMainSettings = combinedRaw;

        if (logoSnap && logoSnap.exists() && logoSnap.data()?.logoImage) {
          latestLogo = extractImageFromValue(logoSnap.data().logoImage);
        } else if (mainData?.logoImage) {
          latestLogo = extractImageFromValue(mainData.logoImage);
        } else if (cfgData?.logoImage) {
          latestLogo = extractImageFromValue(cfgData.logoImage);
        } else if (legacyAssetsSnap && legacyAssetsSnap.exists() && legacyAssetsSnap.data()?.logoImage) {
          latestLogo = extractImageFromValue(legacyAssetsSnap.data().logoImage);
        }

        if (heroSnap && heroSnap.exists() && heroSnap.data()?.heroImage) {
          latestHero = extractImageFromValue(heroSnap.data().heroImage);
        } else if (mainData?.heroImage) {
          latestHero = extractImageFromValue(mainData.heroImage);
        } else if (cfgData?.heroImage) {
          latestHero = extractImageFromValue(cfgData.heroImage);
        } else if (legacyAssetsSnap && legacyAssetsSnap.exists() && legacyAssetsSnap.data()?.heroImage) {
          latestHero = extractImageFromValue(legacyAssetsSnap.data().heroImage);
        }

        if (allSettingsSnap) {
          allSettingsSnap.docs.forEach((d) => {
            if (d.id.startsWith('media_cat_')) {
              const catId = d.id.replace('media_cat_', '');
              const img = extractImageFromValue(d.data()?.image);
              if (img) latestCatImages[catId] = img;
            } else if (d.id === 'media_assets') {
              const ad = d.data() || {};
              if (!latestLogo && ad.logoImage) latestLogo = extractImageFromValue(ad.logoImage);
              if (!latestHero && ad.heroImage) latestHero = extractImageFromValue(ad.heroImage);
              if (ad.categoryImages && typeof ad.categoryImages === 'object') {
                Object.entries(ad.categoryImages).forEach(([cid, im]) => {
                  const clean = extractImageFromValue(im);
                  if (clean && !latestCatImages[cid]) latestCatImages[cid] = clean;
                });
              }
            }
          });
        }

        applyCombinedSettings();
      } catch {
        // تجاهل
      }
    })();

    // مستمع لحظي لأي تحديثات تطرأ على الإعدادات والوسائط ليرى العملاء التغييرات فورًا
    const unsubSettingsCol = onSnapshot(
      publicCol('settings'),
      (snap) => {
        snap.docs.forEach((d) => {
          const data = d.data() || {};
          if (d.id === 'main') {
            latestMainSettings = { ...(latestMainSettings || {}), ...data };
            if (data.logoImage) latestLogo = extractImageFromValue(data.logoImage);
            if (data.heroImage) latestHero = extractImageFromValue(data.heroImage);
          } else if (d.id === 'media_logo' && data.logoImage !== undefined) {
            latestLogo = extractImageFromValue(data.logoImage);
          } else if (d.id === 'media_hero' && data.heroImage !== undefined) {
            latestHero = extractImageFromValue(data.heroImage);
          } else if (d.id.startsWith('media_cat_')) {
            const catId = d.id.replace('media_cat_', '');
            latestCatImages[catId] = extractImageFromValue(data.image);
          }
        });
        applyCombinedSettings();
      },
      () => {}
    );

    // مستمع لحظي للمذكرات مع دمج المسار الاحتياطي السابق إن وجد
    const unsubNotebooks = onSnapshot(
      publicCol('notebooks'),
      async (snap) => {
        const map = new Map();
        snap.docs.forEach((d) => {
          map.set(d.id, normalizeNotebook(d.id, d.data()));
        });
        if (map.size === 0) {
          const legSnap = await getDocs(legacyPublicCol('notebooks')).catch(() => null);
          if (legSnap) {
            legSnap.docs.forEach((d) => {
              if (!map.has(d.id)) map.set(d.id, normalizeNotebook(d.id, d.data()));
            });
          }
        }
        if (map.size > 0) {
          const list = Array.from(map.values()).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
          setNotebooks(list);
          try {
            localStorage.setItem(LOCAL_NOTEBOOKS_KEY, JSON.stringify(list));
          } catch {
            // تجاهل
          }
        }
      },
      () => {}
    );

    const unsubPackages = onSnapshot(
      publicCol('packages'),
      (snap) => {
        setPackages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {}
    );
    const unsubCoupons = onSnapshot(
      publicCol('coupons'),
      (snap) => {
        setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {}
    );
    const unsubOrders = onSnapshot(
      publicCol('orders'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => toTimeMs(b.createdAt) - toTimeMs(a.createdAt));
        setOrders(list);
      },
      () => {}
    );
    return () => {
      unsubSettingsCol();
      unsubNotebooks();
      unsubPackages();
      unsubCoupons();
      unsubOrders();
    };
  }, []);

  // جلب سريع وشامل لصور العينات والتنبيهات من جميع المسارات عند فتح نافذة معاينة المذكرة
  useEffect(() => {
    if (!previewNotebook || !db) {
      setLoadingSamples(false);
      return;
    }
    let cancelled = false;
    const nbId = previewNotebook.id;
    const cachedList = samplesMap[nbId] || previewNotebook.inlineSamples || [];

    if (fetchedSamplesDoneRef.current[nbId]) {
      setLoadingSamples(false);
      return;
    }

    setLoadingSamples(cachedList.length === 0);

    const stopTimer = setTimeout(() => {
      if (!cancelled) setLoadingSamples(false);
    }, 1200);

    (async () => {
      try {
        const pageDocIds = Array.from({ length: 12 }, (_, idx) => `${nbId}_p${idx}`);
        const [mainSnap, legacySnap, ...pageSnaps] = await Promise.all([
          getDoc(publicDoc('notebook_samples', nbId)).catch(() => null),
          getDoc(legacyPublicDoc('notebook_samples', nbId)).catch(() => null),
          ...pageDocIds.map((pid) => getDoc(publicDoc('notebook_samples', pid)).catch(() => null))
        ]);

        if (cancelled) return;
        const collected = [];
        let foundNotice = '';

        const inspectDoc = (snap) => {
          if (!snap || !snap.exists()) return;
          const d = snap.data() || {};
          if (!foundNotice) {
            foundNotice =
              safeText(d.noticeText).trim() ||
              safeText(d.notice).trim() ||
              safeText(d.alertText).trim() ||
              safeText(d.note).trim() ||
              safeText(d.warning).trim() ||
              '';
          }
          extractAnyImagesFromDoc(d).forEach((im) => {
            if (im && im !== previewNotebook.coverImage && !collected.includes(im)) {
              collected.push(im);
            }
          });
        };

        inspectDoc(mainSnap);
        pageSnaps.forEach(inspectDoc);
        inspectDoc(legacySnap);

        fetchedSamplesDoneRef.current[nbId] = true;

        if (foundNotice) {
          setFetchedSampleNotices((prev) => ({ ...prev, [nbId]: foundNotice }));
        }

        if (collected.length > 0) {
          // تحميل مسبق في المتصفح لتسريع التقليب بين الصفحات
          collected.slice(0, 6).forEach((src) => {
            const preImg = new Image();
            preImg.src = src;
          });

          setSamplesMap((prev) => {
            const merged = Array.from(new Set([...(prev[nbId] || []), ...collected]));
            const updated = { ...prev, [nbId]: merged };
            try {
              localStorage.setItem(LOCAL_SAMPLES_KEY, JSON.stringify(updated));
            } catch {
              // تجاهل
            }
            return updated;
          });
        }
      } catch {
        // تجاهل
      } finally {
        clearTimeout(stopTimer);
        if (!cancelled) setLoadingSamples(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(stopTimer);
    };
  }, [previewNotebook]);

  const activeCategoryObj = useMemo(
    () => (settings.categories || []).find((c) => c.id === selectedCategoryId) || null,
    [settings.categories, selectedCategoryId]
  );

  const activeStageObj = useMemo(
    () => activeCategoryObj?.stages?.find((s) => s.id === selectedStageId) || null,
    [activeCategoryObj, selectedStageId]
  );

  const activeGradeObj = useMemo(
    () => activeStageObj?.grades?.find((g) => g.id === selectedGradeId) || null,
    [activeStageObj, selectedGradeId]
  );

  const visibleNotebooks = useMemo(() => {
    return notebooks.filter((nb) => !nb.hidden);
  }, [notebooks]);

  const countNotebooksInCategory = (cat) => {
    if (!cat) return 0;
    return visibleNotebooks.filter((nb) => {
      if (nb.categoryId === cat.id) return true;
      const cName = safeText(cat.name).trim();
      if (cName && (safeText(nb.term).includes(cName) || safeText(nb.title).includes(cName))) return true;
      return false;
    }).length;
  };

  const countNotebooksInStage = (catId, stgId) => {
    return visibleNotebooks.filter((nb) => nb.categoryId === catId && nb.stageId === stgId).length;
  };

  const countNotebooksInGrade = (catId, stgId, grdId) => {
    return visibleNotebooks.filter(
      (nb) => nb.categoryId === catId && nb.stageId === stgId && nb.gradeId === grdId
    ).length;
  };

  const filteredLibraryNotebooks = useMemo(() => {
    return visibleNotebooks.filter((nb) => {
      if (selectedCategoryId && nb.categoryId !== selectedCategoryId) return false;
      if (selectedStageId && nb.stageId !== selectedStageId) return false;
      if (selectedGradeId && nb.gradeId !== selectedGradeId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${nb.title} ${nb.subtitle} ${nb.subject} ${nb.term}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visibleNotebooks, selectedCategoryId, selectedStageId, selectedGradeId, searchQuery]);

  const whatsNewNotebooks = useMemo(() => {
    if (settings.whatsNewMode === 'manual' && Array.isArray(settings.whatsNewManualIds) && settings.whatsNewManualIds.length > 0) {
      return settings.whatsNewManualIds
        .map((id) => visibleNotebooks.find((n) => n.id === id))
        .filter(Boolean);
    }
    const sorted = [...visibleNotebooks].sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    return sorted.slice(0, Number(settings.whatsNewCount) || 4);
  }, [visibleNotebooks, settings.whatsNewMode, settings.whatsNewManualIds, settings.whatsNewCount]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((x) => x.id === item.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], qty: (copy[existingIdx].qty || 1) + 1 };
        return copy;
      }
      return [...prev, { ...item, qty: 1 }];
    });
    showToast(`تمت إضافة «${item.title}» إلى السلة.`);
  };

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0),
    [cart]
  );

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon || cartSubtotal <= 0) return 0;
    if (appliedCoupon.minOrder && cartSubtotal < Number(appliedCoupon.minOrder)) return 0;
    if (appliedCoupon.type === 'fixed') {
      return Math.min(cartSubtotal, Number(appliedCoupon.value) || 0);
    }
    return Math.round((cartSubtotal * (Number(appliedCoupon.value) || 0)) / 100);
  }, [appliedCoupon, cartSubtotal]);

  const cartFinalTotal = Math.max(0, cartSubtotal - couponDiscountAmount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (settings.promoEnabled && settings.promoCouponCode && code === settings.promoCouponCode.trim().toUpperCase()) {
      setAppliedCoupon({ code, type: 'percent', value: 15, minOrder: 0 });
      showToast(`تم تفعيل كود الخصم ${code} بنجاح!`);
      return;
    }
    const found = coupons.find((c) => c.code?.toUpperCase() === code && c.active !== false);
    if (!found) {
      showToast('كود الكوبون غير صحيح أو منتهي الصلاحية.', 'error');
      return;
    }
    if (found.expiresAt && Date.parse(found.expiresAt) < Date.now()) {
      showToast('انتهت صلاحية هذا الكوبون.', 'error');
      return;
    }
    if (found.maxUses && Number(found.usedCount || 0) >= Number(found.maxUses)) {
      showToast('تم استنفاد الحد الأقصى لاستخدام هذا الكوبون.', 'error');
      return;
    }
    if (found.minOrder && cartSubtotal < Number(found.minOrder)) {
      showToast(`الحد الأدنى لاستخدام هذا الكوبون هو ${found.minOrder} ج.م.`, 'error');
      return;
    }
    setAppliedCoupon(found);
    showToast(`تم تطبيق كوبون ${found.code} بنجاح!`);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmittingOrder(true);
    try {
      const orderCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      let generatedRewardCode = '';

      if (settings.nextOrderRewardEnabled !== false && db) {
        const prefix = (settings.nextOrderRewardPrefix || 'VIP').toUpperCase();
        generatedRewardCode = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
        const days = Number(settings.nextOrderRewardDays ?? 7);
        const expiresAt = days > 0 ? new Date(Date.now() + days * 86400000).toISOString().slice(0, 16) : '';
        await addDoc(publicCol('coupons'), {
          code: generatedRewardCode,
          type: 'percent',
          value: Number(settings.nextOrderRewardPercent) || 15,
          minOrder: 0,
          maxUses: 1,
          usedCount: 0,
          expiresAt,
          active: true,
          createdAt: serverTimestamp()
        }).catch(() => {});
      }

      const orderDoc = {
        orderCode,
        customer: customerForm,
        items: cart.map((i) => ({ id: i.id, title: i.title, price: i.price, qty: i.qty || 1 })),
        subtotal: cartSubtotal,
        discount: couponDiscountAmount,
        couponCode: appliedCoupon?.code || '',
        total: cartFinalTotal,
        rewardCoupon: generatedRewardCode,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      if (db) {
        await addDoc(publicCol('orders'), orderDoc);
        if (appliedCoupon?.id) {
          await updateDoc(publicDoc('coupons', appliedCoupon.id), {
            usedCount: Number(appliedCoupon.usedCount || 0) + 1
          }).catch(() => {});
        }
      }

      setLastCreatedOrder(orderDoc);
      setCart([]);
      setAppliedCoupon(null);
      setCouponInput('');

      const waNum = String(settings.whatsappNumber || '201000000000').replace(/[^0-9]/g, '');
      const itemsLines = orderDoc.items.map((it, idx) => `${idx + 1}. ${it.title} (${it.price} ج.م)`).join('\n');
      const waText = [
        `السلام عليكم، طلب جديد من ${settings.platformName}`,
        `رقم الطلب: ${orderCode}`,
        `اسم المعلم: ${customerForm.teacherName || '-'}`,
        `رقم الهاتف: ${customerForm.phone || '-'}`,
        customerForm.subject ? `المادة: ${customerForm.subject}` : '',
        customerForm.governorate ? `المحافظة: ${customerForm.governorate}` : '',
        `--- المذكرات المطلوبة ---`,
        itemsLines,
        `الإجمالي النهائي: ${cartFinalTotal} ج.م`,
        customerForm.notes ? `ملاحظات: ${customerForm.notes}` : ''
      ]
        .filter(Boolean)
        .join('\n');

      window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(waText)}`, '_blank');
      showToast('تم تسجيل طلبك وتحويلك إلى واتساب!');
    } catch (err) {
      showToast(`تعذر إرسال الطلب: ${err?.message || ''}`, 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    const code = trackOrderInput.trim().toUpperCase();
    if (!code) return;
    setTrackingLoading(true);
    try {
      const localMatch = orders.find((o) => o.orderCode?.toUpperCase() === code);
      if (localMatch) {
        setTrackedOrder(localMatch);
      } else if (db) {
        const snap = await getDocs(publicCol('orders'));
        const found = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .find((o) => o.orderCode?.toUpperCase() === code);
        setTrackedOrder(found || { notFound: true });
      }
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleAdminEmailLogin = async (e) => {
    e.preventDefault();
    setAdminLoginError('');
    setAdminLoggingIn(true);
    try {
      if (customApiKeyInput.trim()) {
        await reinitFirebaseWithNewApiKey(customApiKeyInput.trim());
      }
      const cred = await signInWithEmailAndPassword(auth, adminEmailInput.trim(), adminPassInput);
      if (cred.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        throw new Error('هذا البريد الإلكتروني غير مصرح له بدخول لوحة الإدارة.');
      }
      setFirebaseUser(cred.user);
      setAdminLoginOpen(false);
      setActiveView('admin');
      showToast('تم تسجيل الدخول إلى لوحة التحكم بنجاح!');
    } catch (err) {
      setAdminLoginError(`تعذر تسجيل الدخول السحابي: ${err?.message || ''}`);
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setAdminLoginError('');
    setAdminLoggingIn(true);
    try {
      if (customApiKeyInput.trim()) {
        await reinitFirebaseWithNewApiKey(customApiKeyInput.trim());
      }
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
      if (isMobile) {
        await signInWithRedirect(auth, provider);
        return;
      }
      const cred = await signInWithPopup(auth, provider);
      if (cred.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        throw new Error('هذا الحساب غير مصرح له بدخول لوحة الإدارة.');
      }
      setFirebaseUser(cred.user);
      setAdminLoginOpen(false);
      setActiveView('admin');
      showToast('تم تسجيل الدخول بحساب Google الإداري!');
    } catch (err) {
      setAdminLoginError(`تعذر الدخول عبر Google: ${err?.message || ''}`);
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const previewSamplesList = useMemo(() => {
    if (!previewNotebook) return [];
    const list = samplesMap[previewNotebook.id] || previewNotebook.inlineSamples || [];
    if (list.length > 0) return list;
    return previewNotebook.coverImage ? [previewNotebook.coverImage] : [];
  }, [previewNotebook, samplesMap]);

  const previewUnifiedNotices = useMemo(() => {
    if (!previewNotebook) return [];
    const items = [];
    const globalList = Array.isArray(settings.globalAlerts) ? settings.globalAlerts : [];
    globalList.forEach((al) => {
      if (al && al.active !== false && al.text && al.scope !== 'home_only') {
        items.push({ text: al.text, color: al.color || 'amber' });
      }
    });
    const nbNotice = previewNotebook.noticeText || fetchedSampleNotices[previewNotebook.id] || '';
    if (nbNotice) {
      items.push({ text: nbNotice, color: previewNotebook.noticeColor || 'amber' });
    }
    return items;
  }, [previewNotebook, settings.globalAlerts, fetchedSampleNotices]);

  const overlayAlpha = Math.min(0.95, Math.max(0.1, Number(settings.heroOverlayOpacity ?? 65) / 100));

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900 flex flex-col"
    >
      {/* إشعار عائم */}
      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-[120] max-w-sm px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-black flex items-center gap-2.5 ${
            toast.type === 'error'
              ? 'bg-rose-950 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${toast.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* الشريط الإعلاني العلوي */}
      {settings.promoEnabled !== false && settings.promoText && (
        <div
          style={{
            backgroundColor: settings.promoBgColor || '#0f172a',
            color: settings.promoTextColor || '#ffffff'
          }}
          className="w-full px-3 py-2 text-center text-xs sm:text-sm font-black flex flex-wrap items-center justify-center gap-2 shadow-sm"
        >
          <span>{safeText(settings.promoText)}</span>
          {settings.promoCouponCode && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(settings.promoCouponCode);
                showToast(`تم نسخ كود الخصم: ${settings.promoCouponCode}`);
              }}
              className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow hover:bg-amber-300 transition"
            >
              كود: {settings.promoCouponCode} (اضغط للنسخ)
            </button>
          )}
        </div>
      )}

      {/* الهيدر الرئيسي المتجاوب */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* الشعار واسم المنصة */}
          <div
            onClick={handleLogoSecretClick}
            className="flex items-center gap-2.5 cursor-pointer select-none min-w-0 max-w-full"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-900 border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
              {settings.logoImage ? (
                <img src={settings.logoImage} alt={settings.platformName} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-6 h-6 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-black text-slate-900 leading-tight truncate">
                {safeText(settings.platformName)}
              </h1>
              {settings.platformTagline && (
                <p className="text-[11px] sm:text-xs text-slate-500 font-bold truncate max-w-[220px] sm:max-w-md">
                  {safeText(settings.platformTagline)}
                </p>
              )}
            </div>
          </div>

          {/* أزرار التنقل */}
          <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setActiveView('home');
                setSelectedCategoryId('');
                setSelectedStageId('');
                setSelectedGradeId('');
              }}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                activeView === 'home' ? `${theme.primaryBg} text-white shadow-sm` : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الرئيسية
            </button>

            <button
              type="button"
              onClick={() => setActiveView('library')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                activeView === 'library' ? `${theme.primaryBg} text-white shadow-sm` : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              المذكرات
            </button>

            <button
              type="button"
              onClick={() => setActiveView('offers')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                activeView === 'offers' ? `${theme.primaryBg} text-white shadow-sm` : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              العروض والباقات
            </button>

            <button
              type="button"
              onClick={() => setActiveView('track')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                activeView === 'track' ? `${theme.primaryBg} text-white shadow-sm` : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              تتبع طلبك
            </button>

            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تواصل معنا</span>
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm transition"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>السلة</span>
              {cart.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
                  {cart.reduce((s, i) => s + (i.qty || 1), 0)}
                </span>
              )}
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveView('admin')}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition ${
                  activeView === 'admin'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>الإدارة</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* المحتوى الرئيسي حسب الصفحة النشطة */}
      <main className="flex-1 w-full">
        {activeView === 'admin' && isAdmin ? (
          <AdminDashboard
            settings={settings}
            setSettings={setSettings}
            notebooks={notebooks}
            samplesMap={samplesMap}
            setSamplesMap={setSamplesMap}
            packages={packages}
            coupons={coupons}
            orders={orders}
            firebaseUser={firebaseUser}
            onLogout={async () => {
              await signOut(auth);
              setFirebaseUser(null);
              setActiveView('home');
              showToast('تم تسجيل الخروج.');
            }}
            showToast={showToast}
          />
        ) : activeView === 'home' ? (
          <div className="space-y-12 pb-16">
            {/* الواجهة الرئيسية (Hero) */}
            <section
              style={{
                minHeight: `${Number(settings.heroMinHeight) || 460}px`,
                backgroundImage: settings.heroImage ? `url(${settings.heroImage})` : undefined
              }}
              className="relative bg-slate-950 bg-cover bg-center text-white flex items-center overflow-hidden"
            >
              <div
                style={{ backgroundColor: `rgba(11, 20, 42, ${settings.heroImage ? overlayAlpha : 0.96})` }}
                className="absolute inset-0"
              />
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  {settings.heroBadge && (
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-black">
                      <Sparkles className="w-4 h-4" />
                      <span>{safeText(settings.heroBadge)}</span>
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight">
                    {safeText(settings.heroTitle)}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-200 font-bold leading-relaxed max-w-2xl">
                    {safeText(settings.heroSubtitle)}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveView('library')}
                      className={`px-6 py-3.5 rounded-2xl ${theme.primaryBg} text-white text-sm font-black shadow-lg transition`}
                    >
                      {safeText(settings.heroPrimaryBtnText, 'تصفح المذكرات الدراسية')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('offers')}
                      className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm font-black backdrop-blur transition"
                    >
                      {safeText(settings.heroSecondaryBtnText, 'العروض وباقات التوفير')}
                    </button>
                    {settings.showHeroCustomBtn !== false && (
                      <button
                        type="button"
                        onClick={() => setContactModalOpen(true)}
                        className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black shadow-lg transition"
                      >
                        {safeText(settings.heroCustomBtnText, 'اطلب مذكرة مخصصة')}
                      </button>
                    )}
                  </div>
                </div>

                {/* بطاقة لماذا يثق بنا المعلمون */}
                <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center gap-2.5 text-amber-400 font-black text-base sm:text-lg">
                    <ShieldCheck className="w-6 h-6 shrink-0" />
                    <h3>{safeText(settings.trustTitle, 'لماذا يثق بنا المعلمون؟')}</h3>
                  </div>
                  <ul className="space-y-3">
                    {(settings.trustPoints || []).map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-100 font-bold leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                        <span>{safeText(pt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* الأقسام الرئيسية للمذكرات والكورسات */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="text-center space-y-1.5">
                <h2 className="text-xl sm:text-3xl font-black text-slate-900">الأقسام الرئيسية للمذكرات والكورسات</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-bold">اختر القسم المناسب لتصفح مجلدات المراحل والصفوف الدراسية</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(settings.categories || []).map((cat) => {
                  const nbCount = countNotebooksInCategory(cat);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSelectedStageId('');
                        setSelectedGradeId('');
                        setActiveView('library');
                      }}
                      className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-400 transition cursor-pointer flex flex-col justify-between"
                    >
                      <div className={`relative h-48 bg-gradient-to-br ${theme.cardGradient} overflow-hidden flex items-center justify-center`}>
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <Layers className="w-12 h-12 text-white/80" />
                        )}
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 text-white text-xs font-black backdrop-blur">
                          {nbCount} مذكرة متاحة
                        </span>
                      </div>
                      <div className="p-5 flex items-center justify-between">
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-blue-600 font-bold mt-0.5">
                            تصفح المراحل والصفوف الدراسية
                          </p>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* قسم ما الجديد */}
            {settings.whatsNewEnabled !== false && whatsNewNotebooks.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black mb-1">
                      إصدارات حديثة
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      {safeText(settings.whatsNewTitle, 'ما الجديد؟ أحدث المذكرات والإصدارات')}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView('library')}
                    className="text-xs sm:text-sm font-black text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>عرض الكل</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {whatsNewNotebooks.map((nb) => (
                    <NotebookCard
                      key={nb.id}
                      nb={nb}
                      theme={theme}
                      settings={settings}
                      onPreview={() => {
                        setPreviewNotebook(nb);
                        setPreviewPageIdx(0);
                        setPreviewZoom(1);
                      }}
                      onAdd={() => addToCart(nb)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : activeView === 'library' ? (
          /* صفحة مكتبة المذكرات */
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleBackNavigation}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-1"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>رجوع</span>
                </button>
                <div>
                  <h2 className="text-base sm:text-xl font-black text-slate-900">
                    {activeGradeObj?.name || activeStageObj?.name || activeCategoryObj?.name || 'جميع المذكرات الدراسية'}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold">تصفح المذكرات وافتح المعاينة المباشرة قبل الطلب</p>
                </div>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم المذكرة أو المادة..."
                  className="w-full pr-10 pl-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
            </div>

            {/* مجلدات المراحل داخل القسم المختار */}
            {activeCategoryObj && activeCategoryObj.browseMode !== 'direct' && !selectedStageId && (activeCategoryObj.stages || []).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCategoryObj.stages.map((stg) => (
                  <button
                    key={stg.id}
                    type="button"
                    onClick={() => setSelectedStageId(stg.id)}
                    className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 shadow-sm flex items-center justify-between text-right transition"
                  >
                    <div>
                      <div className="text-base font-black text-slate-900">{stg.name}</div>
                      <div className="text-xs text-slate-500 font-bold mt-0.5">
                        {countNotebooksInStage(activeCategoryObj.id, stg.id)} مذكرة متاحة
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-blue-600" />
                  </button>
                ))}
              </div>
            )}

            {/* مجلدات الصفوف داخل المرحلة المختارة */}
            {activeStageObj && !selectedGradeId && (activeStageObj.grades || []).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeStageObj.grades.map((grd) => (
                  <button
                    key={grd.id}
                    type="button"
                    onClick={() => setSelectedGradeId(grd.id)}
                    className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 shadow-sm flex items-center justify-between text-right transition"
                  >
                    <div>
                      <div className="text-base font-black text-slate-900">{grd.name}</div>
                      <div className="text-xs text-slate-500 font-bold mt-0.5">
                        {countNotebooksInGrade(activeCategoryObj.id, activeStageObj.id, grd.id)} مذكرة متاحة
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-blue-600" />
                  </button>
                ))}
              </div>
            )}

            {/* شبكة المذكرات */}
            {filteredLibraryNotebooks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-black text-slate-700">لا توجد مذكرات مطابقة في هذا المجلد حاليًا.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredLibraryNotebooks.map((nb) => (
                  <NotebookCard
                    key={nb.id}
                    nb={nb}
                    theme={theme}
                    settings={settings}
                    onPreview={() => {
                      setPreviewNotebook(nb);
                      setPreviewPageIdx(0);
                      setPreviewZoom(1);
                    }}
                    onAdd={() => addToCart(nb)}
                  />
                ))}
              </div>
            )}
          </section>
        ) : activeView === 'offers' ? (
          /* صفحة العروض وباقات التوفير */
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">العروض وباقات التوفير الحصرية</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
                اختر من باقاتنا المجمّعة بأسعار مخفضة أو استخدم كوبونات الخصم داخل السلة
              </p>
            </div>

            {packages.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm font-bold text-slate-500">
                لا توجد باقات مضافة حاليًا.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => {
                  const saved = Number(pkg.oldPrice) > Number(pkg.price) ? Number(pkg.oldPrice) - Number(pkg.price) : 0;
                  return (
                    <div key={pkg.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        {saved > 0 && (
                          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                            وفّر {saved} ج.م
                          </span>
                        )}
                        <h3 className="text-lg font-black text-slate-900">{pkg.title}</h3>
                        {pkg.description && <p className="text-xs sm:text-sm text-slate-600 font-bold">{pkg.description}</p>}
                      </div>
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-blue-600">{pkg.price} ج.م</span>
                          {Number(pkg.oldPrice) > Number(pkg.price) && (
                            <span className="text-sm text-slate-400 line-through font-bold">{pkg.oldPrice} ج.م</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => addToCart({ id: `pkg_${pkg.id}`, title: `باقة: ${pkg.title}`, price: pkg.price })}
                          className={`w-full py-3 rounded-2xl ${theme.primaryBg} text-white text-sm font-black shadow`}
                        >
                          أضف الباقة للسلة
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          /* صفحة تتبع الطلبات */
          <section className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
            <form onSubmit={handleTrackOrder} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">تتبع حالة طلبك</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-bold">أدخل رقم الطلب الذي حصلت عليه عند إتمام الطلب (مثال: ORD-123456)</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={trackOrderInput}
                  onChange={(e) => setTrackOrderInput(e.target.value)}
                  placeholder="ORD-XXXXXX"
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-black uppercase"
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className={`px-6 py-3 rounded-2xl ${theme.primaryBg} text-white text-sm font-black`}
                >
                  {trackingLoading ? 'جاري البحث...' : 'بحث'}
                </button>
              </div>
            </form>

            {trackedOrder && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                {trackedOrder.notFound ? (
                  <p className="text-sm font-black text-rose-600 text-center">لم يتم العثور على طلب بهذا الرقم.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-slate-900">طلب رقم: {trackedOrder.orderCode}</span>
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
                        {trackedOrder.status === 'completed'
                          ? 'مكتمل وتم التسليم'
                          : trackedOrder.status === 'processing'
                          ? 'جاري التنسيق'
                          : 'قيد المراجعة'}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 font-bold">
                      الإجمالي: {trackedOrder.total} ج.م
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ===================================================================== */}
      {/* نافذة معاينة المذكرة والعينات */}
      {/* ===================================================================== */}
      {previewNotebook && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div
            className={`bg-white flex flex-col overflow-hidden shadow-2xl ${
              previewFullscreen
                ? 'w-full h-full rounded-none'
                : 'w-full max-w-4xl max-h-[92vh] rounded-3xl border border-slate-200'
            }`}
          >
            {/* رأس نافذة المعاينة */}
            <div className="bg-slate-900 text-white px-3 sm:px-5 py-3 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black truncate">{previewNotebook.title}</h3>
                <p className="text-[11px] sm:text-xs text-slate-300 font-bold truncate">
                  {previewNotebook.subject ? `${previewNotebook.subject} • ` : ''}
                  {previewNotebook.pagesCount ? `${previewNotebook.pagesCount} صفحة • ` : ''}
                  صفحة {previewSamplesList.length > 0 ? previewPageIdx + 1 : 0} من {previewSamplesList.length}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20"
                  title="تصغير"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-black px-1.5">{Math.round(previewZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20"
                  title="تكبير"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFullscreen((f) => !f)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20"
                  title="ملء الشاشة"
                >
                  {previewFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewNotebook(null);
                    setPreviewFullscreen(false);
                    setPreviewZoom(1);
                  }}
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* التنبيه الموحد المضغوط أعلى العينات */}
            {previewNotebook.noticePosition !== 'bottom' && previewUnifiedNotices.length > 0 && (
              <UnifiedNoticeBox items={previewUnifiedNotices} compact />
            )}

            {/* تفاصيل المذكرة */}
            {(previewNotebook.subtitle || previewNotebook.badgeText) && (
              <div className="px-3 sm:px-5 py-2 bg-white border-b border-slate-100 space-y-1 shrink-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  {previewNotebook.badgeText && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
                      {previewNotebook.badgeText}
                    </span>
                  )}
                  {previewNotebook.subject && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                      المادة: {previewNotebook.subject}
                    </span>
                  )}
                  {previewNotebook.pagesCount && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                      عدد الصفحات: {previewNotebook.pagesCount} صفحة
                    </span>
                  )}
                </div>
                {previewNotebook.subtitle && (
                  <p className="text-xs text-slate-700 font-bold leading-relaxed line-clamp-3">
                    {previewNotebook.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* منطقة عرض صور العينات */}
            <div
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches?.[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (touchStartXRef.current === null || previewSamplesList.length <= 1) return;
                const diff = (e.changedTouches?.[0]?.clientX ?? 0) - touchStartXRef.current;
                if (Math.abs(diff) > 40) {
                  if (diff > 0) {
                    setPreviewPageIdx((i) => (i + 1) % previewSamplesList.length);
                  } else {
                    setPreviewPageIdx((i) => (i - 1 + previewSamplesList.length) % previewSamplesList.length);
                  }
                }
                touchStartXRef.current = null;
              }}
              className="relative flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-3 min-h-[260px]"
            >
              {loadingSamples ? (
                <div className="flex flex-col items-center gap-2 text-slate-600">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-xs font-black">جاري تحميل صفحات العينة...</span>
                </div>
              ) : previewSamplesList.length > 0 ? (
                <img
                  src={previewSamplesList[previewPageIdx] || previewSamplesList[0]}
                  alt={`عينة ${previewPageIdx + 1}`}
                  style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center top' }}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-md transition-transform"
                />
              ) : (
                <p className="text-xs sm:text-sm font-bold text-slate-500">لا توجد صور عينات مرفوعة لهذه المذكرة.</p>
              )}

              {previewSamplesList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPreviewPageIdx((i) => (i - 1 + previewSamplesList.length) % previewSamplesList.length)}
                    className="fixed sm:absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPageIdx((i) => (i + 1) % previewSamplesList.length)}
                    className="fixed sm:absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {previewNotebook.noticePosition === 'bottom' && previewUnifiedNotices.length > 0 && (
              <UnifiedNoticeBox items={previewUnifiedNotices} compact />
            )}

            {/* شريط الإجراءات السفلي داخل المعاينة */}
            <div className="bg-white border-t border-slate-200 px-3 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`text-lg sm:text-xl font-black ${theme.primaryText}`}>{previewNotebook.price} ج.م</span>
                {Number(previewNotebook.oldPrice) > Number(previewNotebook.price) && (
                  <>
                    <span className="text-xs text-slate-400 line-through font-bold">{previewNotebook.oldPrice} ج.م</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black">
                      وفّر {Number(previewNotebook.oldPrice) - Number(previewNotebook.price)} ج.م
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {previewNotebook.driveLink && (
                  <a
                    href={previewNotebook.driveLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{ backgroundColor: previewNotebook.driveBtnColor || '#059669' }}
                    className="px-4 py-2.5 rounded-2xl text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>معاينة PDF على Drive</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    addToCart(previewNotebook);
                    setPreviewNotebook(null);
                    setCartOpen(true);
                  }}
                  className={`px-5 py-2.5 rounded-2xl ${theme.primaryBg} text-white text-xs sm:text-sm font-black shadow`}
                >
                  اطلب المذكرة الآن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* نافذة سلة الطلبات */}
      {/* ===================================================================== */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full overflow-y-auto p-5 flex flex-col justify-between space-y-5 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black text-slate-900">سلة الطلبات ({cart.length})</h3>
                <button type="button" onClick={() => setCartOpen(false)} className="p-2 rounded-xl bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {lastCreatedOrder && cart.length === 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="text-sm font-black text-emerald-900">{safeText(settings.orderSuccessMessage)}</div>
                  <div className="text-xs font-black text-slate-800">رقم طلبك: {lastCreatedOrder.orderCode}</div>
                  {lastCreatedOrder.rewardCoupon && (
                    <div className="text-xs font-black text-amber-900 bg-amber-100 px-3 py-1.5 rounded-xl">
                      هدية لطلبك القادم: كود خصم {lastCreatedOrder.rewardCoupon}
                    </div>
                  )}
                </div>
              )}

              {cart.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-500 font-bold text-center py-8">السلة فارغة حاليًا.</p>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div key={item.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-slate-900 truncate">{item.title}</div>
                          <div className="text-xs text-blue-600 font-bold">{item.price} ج.م</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCart((prev) => prev.filter((x) => x.id !== item.id))}
                          className="p-1.5 rounded-xl bg-rose-100 text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* كود الخصم */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="هل لديك كود خصم؟"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black"
                    >
                      تطبيق
                    </button>
                  </div>

                  {/* نموذج بيانات المعلم */}
                  <form onSubmit={handleSubmitOrder} className="space-y-3 pt-2 border-t border-slate-100">
                    {(settings.checkoutFields || [])
                      .filter((f) => f.enabled !== false)
                      .map((field) => (
                        <div key={field.id}>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {field.label} {field.required ? '*' : ''}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              rows={2}
                              required={Boolean(field.required)}
                              placeholder={field.placeholder || ''}
                              value={customerForm[field.id] || ''}
                              onChange={(e) => setCustomerForm({ ...customerForm, [field.id]: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                            />
                          ) : (
                            <input
                              type={field.type || 'text'}
                              required={Boolean(field.required)}
                              placeholder={field.placeholder || ''}
                              value={customerForm[field.id] || ''}
                              onChange={(e) => setCustomerForm({ ...customerForm, [field.id]: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                            />
                          )}
                        </div>
                      ))}

                    <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-1 text-xs font-bold">
                      <div className="flex justify-between">
                        <span>المجموع الفرعي:</span>
                        <span>{cartSubtotal} ج.م</span>
                      </div>
                      {couponDiscountAmount > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>قيمة الخصم:</span>
                          <span>- {couponDiscountAmount} ج.م</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-black pt-1 border-t border-white/15">
                        <span>الإجمالي النهائي:</span>
                        <span>{cartFinalTotal} ج.م</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingOrder}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-lg"
                    >
                      {submittingOrder ? 'جاري تسجيل الطلب...' : 'إرسال تفاصيل الطلب على واتساب'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* نافذة تواصل معنا */}
      {/* ===================================================================== */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">تواصل معنا مباشرة</h3>
              <button type="button" onClick={() => setContactModalOpen(false)} className="p-2 rounded-xl bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-bold">
              للاستفسار أو طلب مذكرة مخصصة باسمك وشعارك، تواصل معنا عبر واتساب أو قنواتنا الرسمية:
            </p>
            <a
              href={`https://wa.me/${String(settings.whatsappNumber || '201000000000').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow"
            >
              <MessageCircle className="w-5 h-5" />
              <span>محادثة مباشرة عبر واتساب</span>
            </a>
            {(settings.socialLinks || []).length > 0 && (
              <div className="space-y-2 pt-2">
                {settings.socialLinks.map((soc) => (
                  <a
                    key={soc.id}
                    href={soc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs sm:text-sm font-black text-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      {getSocialIcon(soc.platform, soc.url)}
                      <span>{soc.label}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* نافذة تسجيل دخول الإدارة */}
      {/* ===================================================================== */}
      {adminLoginOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">دخول لوحة تحكم الإدارة</h3>
              </div>
              <button type="button" onClick={() => setAdminLoginOpen(false)} className="p-2 rounded-xl bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminEmailLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني الإداري</label>
                <input
                  type="email"
                  required
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={adminPassInput}
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-left"
                  dir="ltr"
                />
              </div>

              {!getEffectiveApiKey() && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مفتاح Firebase Web API Key (يُحفظ لمرة واحدة)
                  </label>
                  <input
                    type="text"
                    value={customApiKeyInput}
                    onChange={(e) => setCustomApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-left"
                    dir="ltr"
                  />
                </div>
              )}

              {adminLoginError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-black text-rose-700">
                  {adminLoginError}
                </div>
              )}

              <button
                type="submit"
                disabled={adminLoggingIn}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow"
              >
                {adminLoggingIn ? 'جاري التحقق...' : 'تسجيل الدخول للوحة التحكم'}
              </button>
            </form>

            <button
              type="button"
              disabled={adminLoggingIn}
              onClick={handleAdminGoogleLogin}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black"
            >
              دخول سريع بحساب Google الإداري
            </button>
          </div>
        </div>
      )}

      {/* الفوتر */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-right space-y-1">
            <div className="text-sm sm:text-base font-black text-white">{safeText(settings.platformName)}</div>
            <p className="text-xs text-slate-400 font-bold">{safeText(settings.footerNote)}</p>
          </div>
          {(settings.socialLinks || []).length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {settings.socialLinks.map((soc) => (
                <a
                  key={soc.id}
                  href={soc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black text-white flex items-center gap-1.5"
                >
                  {getSocialIcon(soc.platform, soc.url)}
                  <span>{soc.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// 9. مكون صندوق التنبيهات الموحّد (مضغوط وكل تنبيه في سطر واحد)
// ============================================================================
function UnifiedNoticeBox({ items = [], compact = false }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const themes = {
    amber: {
      wrapper: 'bg-amber-50/95 border-amber-300 border-r-amber-500 text-amber-950',
      iconBox: 'bg-amber-500 text-white'
    },
    blue: {
      wrapper: 'bg-blue-50/95 border-blue-300 border-r-blue-600 text-blue-950',
      iconBox: 'bg-blue-600 text-white'
    },
    rose: {
      wrapper: 'bg-rose-50/95 border-rose-300 border-r-rose-600 text-rose-950',
      iconBox: 'bg-rose-600 text-white'
    },
    emerald: {
      wrapper: 'bg-emerald-50/95 border-emerald-300 border-r-emerald-600 text-emerald-950',
      iconBox: 'bg-emerald-600 text-white'
    }
  };
  const primaryColor = items[0]?.color || 'amber';
  const st = themes[primaryColor] || themes.amber;

  return (
    <div className={`${compact ? 'px-3 sm:px-5 py-1.5 bg-slate-50 border-b border-slate-200/80 shrink-0' : ''}`}>
      <div className={`rounded-xl border border-r-4 px-2.5 py-1.5 space-y-1 ${st.wrapper}`}>
        {items.map((item, idx) => {
          const cleanText = safeText(item.text).replace(/^[-–—•*]\s*/, '').trim();
          return (
            <div key={idx} className="flex items-center gap-1.5 min-w-0 text-[11px] sm:text-xs font-black">
              <span className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${st.iconBox}`}>
                <AlertTriangle className="w-2.5 h-2.5" />
              </span>
              <span className="truncate leading-tight" title={cleanText}>
                {cleanText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NoticeBanner({ text, color = 'amber' }) {
  return <UnifiedNoticeBox items={[{ text, color }]} compact />;
}

// ============================================================================
// 10. بطاقة عرض المذكرة للزوار
// ============================================================================
const SAVINGS_COLOR_CLASSES = {
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rose: 'bg-rose-100 text-rose-800 border-rose-200',
  amber: 'bg-amber-100 text-amber-900 border-amber-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200'
};

function NotebookCard({ nb, theme, settings, onPreview, onAdd }) {
  const hasDiscount = Number(nb.oldPrice) > Number(nb.price) && Number(nb.oldPrice) > 0;
  const savedAmount = hasDiscount ? Number(nb.oldPrice) - Number(nb.price) : 0;
  const savedPercent = hasDiscount ? Math.round((savedAmount / Number(nb.oldPrice)) * 100) : 0;
  const badgeColorClass = SAVINGS_COLOR_CLASSES[settings?.savingsBadgeColor] || SAVINGS_COLOR_CLASSES.emerald;
  const badgePos = settings?.savingsBadgePosition || 'next_to_pages';

  const savingsBadgeEl = hasDiscount && badgePos !== 'hidden' && (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-xs font-black ${badgeColorClass}`}>
      <span>
        وفّر {savedAmount} ج.م ({savedPercent}%)
      </span>
    </span>
  );

  return (
    <div
      className={`group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl ${
        theme?.accentBorder || 'hover:border-blue-400'
      } transition flex flex-col justify-between`}
    >
      <div>
        <div
          onClick={onPreview}
          className={`relative h-52 bg-gradient-to-br ${
            theme?.cardGradient || 'from-blue-600 to-indigo-700'
          } cursor-pointer overflow-hidden flex items-center justify-center`}
        >
          {nb.coverImage ? (
            <img
              src={nb.coverImage}
              alt={nb.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <BookOpen className="w-12 h-12 text-white/80" />
          )}

          {nb.badgeText && (
            <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow">
              {nb.badgeText}
            </span>
          )}

          {hasDiscount && badgePos === 'on_cover' && (
            <span className={`absolute bottom-3 right-3 px-3 py-1 rounded-full border text-xs font-black shadow ${badgeColorClass}`}>
              وفّر {savedAmount} ج.م ({savedPercent}%)
            </span>
          )}

          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/35 transition flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 px-4 py-2 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-black shadow-lg flex items-center gap-1.5 transition">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>معاينة العينات</span>
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-1.5">
          <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-2">{nb.title}</h3>
          {nb.subtitle && <p className="text-xs text-slate-600 font-bold line-clamp-2">{nb.subtitle}</p>}
          {(nb.subject || nb.term || nb.pagesCount || (hasDiscount && badgePos === 'next_to_pages')) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {nb.subject && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">{nb.subject}</span>
              )}
              {nb.term && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">{nb.term}</span>
              )}
              {nb.pagesCount && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>{nb.pagesCount} صفحة</span>
                </span>
              )}
              {badgePos === 'next_to_pages' && savingsBadgeEl}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-lg font-black ${theme?.primaryText || 'text-blue-600'}`}>{nb.price} ج.م</span>
            {Number(nb.oldPrice) > Number(nb.price) && (
              <span className="text-xs text-slate-400 line-through font-bold">{nb.oldPrice} ج.م</span>
            )}
            {badgePos === 'next_to_price' && savingsBadgeEl}
          </div>

          <button
            type="button"
            onClick={onPreview}
            className="text-xs font-black text-slate-600 hover:text-blue-600 flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>معاينة</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className={`w-full py-2.5 rounded-2xl ${theme?.primaryBg || 'bg-blue-600 hover:bg-blue-700'} text-white text-xs sm:text-sm font-black shadow-sm transition`}
        >
          أضف للسلة
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 11. لوحة تحكم الإدارة الشاملة
// ============================================================================
function AdminDashboard({
  settings,
  setSettings,
  notebooks,
  samplesMap,
  setSamplesMap,
  packages,
  coupons,
  orders,
  firebaseUser,
  onLogout,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('notebooks');
  const [settingsSubTab, setSettingsSubTab] = useState('identity');
  const [localSettings, setLocalSettings] = useState(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // حالة نموذج المذكرة
  const emptyNotebookForm = {
    id: '',
    title: '',
    subtitle: '',
    price: '',
    oldPrice: '',
    categoryId: settings.categories?.[0]?.id || '',
    stageId: '',
    gradeId: '',
    subject: '',
    term: '',
    pagesCount: '',
    badgeText: '',
    driveLink: '',
    driveBtnColor: '#059669',
    noticeText: '',
    noticeColor: 'amber',
    noticePosition: 'top',
    hidden: false,
    coverImage: '',
    samples: []
  };
  const [nbForm, setNbForm] = useState(emptyNotebookForm);
  const [savingNb, setSavingNb] = useState(false);
  const [adminNbSearch, setAdminNbSearch] = useState('');
  const [pkgForm, setPkgForm] = useState({
    id: '',
    title: '',
    description: '',
    price: '',
    oldPrice: '',
    oldPriceManual: false,
    notebookIds: []
  });
  const [couponForm, setCouponForm] = useState({
    id: '',
    code: '',
    type: 'percent',
    value: '',
    minOrder: '',
    maxUses: '',
    expiresAt: '',
    active: true
  });

  // حفظ الإعدادات الشاملة في السحابة (بتقسيم الصور إلى مستندات مستقلة لتفادي حد الـ 1MB في Firestore)
  const saveAllSettingsToCloud = async (updatedObj) => {
    setSavingSettings(true);
    try {
      const safeLogo = await shrinkDataUrlIfNeeded(updatedObj.logoImage || '', 300000);
      const safeHero = await shrinkDataUrlIfNeeded(updatedObj.heroImage || '', 550000);

      const cleanCategories = [];
      const catWrites = [];

      for (const c of updatedObj.categories || []) {
        const safeCatImg = await shrinkDataUrlIfNeeded(c.image || '', 420000);
        cleanCategories.push({
          id: c.id,
          name: c.name,
          browseMode: c.browseMode || 'hierarchical',
          stages: c.stages || []
        });
        if (db) {
          catWrites.push(
            setDoc(
              publicDoc('settings', `media_cat_${c.id}`),
              { image: safeCatImg, updatedAt: serverTimestamp() },
              { merge: true }
            )
          );
        }
      }

      const mainPayload = {
        ...updatedObj,
        logoImage: '',
        heroImage: '',
        categories: cleanCategories,
        updatedAt: serverTimestamp()
      };

      const finalMerged = {
        ...updatedObj,
        logoImage: safeLogo,
        heroImage: safeHero,
        categories: (updatedObj.categories || []).map((c, idx) => ({
          ...c,
          image: cleanCategories[idx] ? c.image : ''
        }))
      };

      if (db) {
        await Promise.all([
          setDoc(publicDoc('settings', 'main'), mainPayload, { merge: true }),
          setDoc(publicDoc('settings', 'media_logo'), { logoImage: safeLogo, updatedAt: serverTimestamp() }, { merge: true }),
          setDoc(publicDoc('settings', 'media_hero'), { heroImage: safeHero, updatedAt: serverTimestamp() }, { merge: true }),
          ...catWrites
        ]);
      }

      setSettings(finalMerged);
      setLocalSettings(finalMerged);
      try {
        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(finalMerged));
      } catch {
        // تجاهل
      }
      showToast('تم حفظ الإعدادات والصور وتعميمها على جميع العملاء بنجاح!');
    } catch (err) {
      showToast(`تعذر الحفظ السحابي: ${err?.message || ''}`, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // حفظ أو تعديل مذكرة
  const handleSaveNotebook = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim()) return;
    setSavingNb(true);
    try {
      const payload = {
        title: nbForm.title.trim(),
        subtitle: nbForm.subtitle.trim(),
        price: Number(nbForm.price) || 0,
        oldPrice: Number(nbForm.oldPrice) || 0,
        categoryId: nbForm.categoryId,
        stageId: nbForm.stageId,
        gradeId: nbForm.gradeId,
        subject: nbForm.subject.trim(),
        term: nbForm.term.trim(),
        pagesCount: nbForm.pagesCount.trim(),
        badgeText: nbForm.badgeText.trim(),
        driveLink: nbForm.driveLink.trim(),
        driveBtnColor: nbForm.driveBtnColor || '#059669',
        noticeText: nbForm.noticeText.trim(),
        noticeColor: nbForm.noticeColor || 'amber',
        noticePosition: nbForm.noticePosition || 'top',
        hidden: Boolean(nbForm.hidden),
        coverImage: nbForm.coverImage || '',
        updatedAt: serverTimestamp()
      };

      let targetId = nbForm.id;
      if (targetId) {
        await updateDoc(publicDoc('notebooks', targetId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        payload.sortOrder = notebooks.length + 1;
        const created = await addDoc(publicCol('notebooks'), payload);
        targetId = created.id;
      }

      if (Array.isArray(nbForm.samples)) {
        const shrunkSamples = await Promise.all(
          nbForm.samples.map((s) => shrinkDataUrlIfNeeded(s, 450000))
        );
        const writePromises = [
          setDoc(
            publicDoc('notebook_samples', targetId),
            {
              samples: [],
              totalPages: shrunkSamples.length,
              noticeText: nbForm.noticeText.trim(),
              updatedAt: serverTimestamp()
            },
            { merge: true }
          )
        ];
        shrunkSamples.forEach((imgData, idx) => {
          writePromises.push(
            setDoc(
              publicDoc('notebook_samples', `${targetId}_p${idx}`),
              { image: imgData, pageIndex: idx, parentId: targetId, updatedAt: serverTimestamp() },
              { merge: true }
            )
          );
        });
        for (let oldIdx = shrunkSamples.length; oldIdx < 24; oldIdx++) {
          writePromises.push(deleteDoc(publicDoc('notebook_samples', `${targetId}_p${oldIdx}`)).catch(() => {}));
        }
        await Promise.all(writePromises);

        setSamplesMap((prev) => {
          const next = { ...prev, [targetId]: shrunkSamples };
          try {
            localStorage.setItem(LOCAL_SAMPLES_KEY, JSON.stringify(next));
          } catch {
            // تجاهل
          }
          return next;
        });
      }

      setNbForm(emptyNotebookForm);
      showToast('تم حفظ المذكرة والعينات بنجاح!');
    } catch (err) {
      showToast(`خطأ أثناء حفظ المذكرة: ${err?.message || ''}`, 'error');
    } finally {
      setSavingNb(false);
    }
  };

  const toggleNotebookHidden = async (nb) => {
    try {
      await updateDoc(publicDoc('notebooks', nb.id), { hidden: !nb.hidden });
      showToast(nb.hidden ? 'تم إظهار المذكرة للزوار.' : 'تم إخفاء المذكرة عن الزوار.');
    } catch (err) {
      showToast(`تعذر تحديث الحالة: ${err?.message || ''}`, 'error');
    }
  };

  const handleDuplicateNotebook = async (nb) => {
    try {
      const copyPayload = {
        title: `${nb.title} (نسخة)`,
        subtitle: nb.subtitle,
        price: nb.price,
        oldPrice: nb.oldPrice,
        categoryId: nb.categoryId,
        stageId: nb.stageId,
        gradeId: nb.gradeId,
        subject: nb.subject,
        term: nb.term,
        pagesCount: nb.pagesCount,
        badgeText: nb.badgeText,
        driveLink: nb.driveLink,
        driveBtnColor: nb.driveBtnColor,
        noticeText: nb.noticeText,
        noticeColor: nb.noticeColor,
        noticePosition: nb.noticePosition,
        hidden: false,
        coverImage: nb.coverImage,
        createdAt: serverTimestamp(),
        sortOrder: notebooks.length + 1
      };
      await addDoc(publicCol('notebooks'), copyPayload);
      showToast('تم تكرار المذكرة بنجاح!');
    } catch (err) {
      showToast(`تعذر تكرار المذكرة: ${err?.message || ''}`, 'error');
    }
  };

  const handleDeleteNotebook = async (nb) => {
    try {
      await deleteDoc(publicDoc('notebooks', nb.id));
      await deleteDoc(publicDoc('notebook_samples', nb.id)).catch(() => {});
      showToast('تم حذف المذكرة.');
    } catch (err) {
      showToast(`تعذر الحذف: ${err?.message || ''}`, 'error');
    }
  };

  // تبديل اختيار مذكرة داخل الباقة وحساب السعر قبل الخصم تلقائيًا
  const togglePackageNotebook = (nbId) => {
    setPkgForm((prev) => {
      const exists = prev.notebookIds.includes(nbId);
      const nextIds = exists ? prev.notebookIds.filter((id) => id !== nbId) : [...prev.notebookIds, nbId];
      const autoSum = nextIds.reduce((acc, id) => {
        const found = notebooks.find((n) => n.id === id);
        return acc + (Number(found?.price) || 0);
      }, 0);
      return {
        ...prev,
        notebookIds: nextIds,
        oldPrice: prev.oldPriceManual ? prev.oldPrice : autoSum > 0 ? String(autoSum) : ''
      };
    });
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!pkgForm.title.trim()) return;
    try {
      const data = {
        title: pkgForm.title.trim(),
        description: pkgForm.description.trim(),
        price: Number(pkgForm.price) || 0,
        oldPrice: Number(pkgForm.oldPrice) || 0,
        notebookIds: pkgForm.notebookIds,
        updatedAt: serverTimestamp()
      };
      if (pkgForm.id) {
        await updateDoc(publicDoc('packages', pkgForm.id), data);
      } else {
        await addDoc(publicCol('packages'), { ...data, createdAt: serverTimestamp() });
      }
      setPkgForm({ id: '', title: '', description: '', price: '', oldPrice: '', oldPriceManual: false, notebookIds: [] });
      showToast('تم حفظ الباقة التوفيرية بنجاح!');
    } catch (err) {
      showToast(`خطأ: ${err?.message || ''}`, 'error');
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;
    try {
      const data = {
        code: couponForm.code.trim().toUpperCase(),
        type: couponForm.type,
        value: Number(couponForm.value) || 0,
        minOrder: Number(couponForm.minOrder) || 0,
        maxUses: Number(couponForm.maxUses) || 0,
        expiresAt: couponForm.expiresAt || '',
        active: couponForm.active !== false,
        updatedAt: serverTimestamp()
      };
      if (couponForm.id) {
        await updateDoc(publicDoc('coupons', couponForm.id), data);
      } else {
        await addDoc(publicCol('coupons'), { ...data, usedCount: 0, createdAt: serverTimestamp() });
      }
      setCouponForm({ id: '', code: '', type: 'percent', value: '', minOrder: '', maxUses: '', expiresAt: '', active: true });
      showToast('تم حفظ كوبون الخصم بنجاح!');
    } catch (err) {
      showToast(`خطأ: ${err?.message || ''}`, 'error');
    }
  };

  const selectedFormCategory = (localSettings.categories || []).find((c) => c.id === nbForm.categoryId);
  const selectedFormStage = selectedFormCategory?.stages?.find((s) => s.id === nbForm.stageId);

  const filteredAdminNotebooks = notebooks.filter((n) => {
    if (!adminNbSearch.trim()) return true;
    return `${n.title} ${n.subject} ${n.term}`.toLowerCase().includes(adminNbSearch.trim().toLowerCase());
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* رأس لوحة التحكم */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black">لوحة تحكم الإدارة الشاملة</h2>
            <p className="text-xs text-emerald-400 font-bold">
              متصل بالسحابة بالحساب الإداري المعتمد: {firebaseUser?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* شريط التبويبات الرئيسية */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: 'notebooks', title: 'المذكرات والعينات', sub: 'إضافة وتعديل العينات', count: notebooks.length, icon: BookOpen },
          { id: 'categories', title: 'الأقسام والمراحل', sub: 'هيكلة الأقسام والصفوف', count: (localSettings.categories || []).length, icon: Layers },
          { id: 'offers', title: 'الكوبونات والباقات', sub: 'الخصومات وباقات التوفير', count: coupons.length + packages.length, icon: Tag },
          { id: 'orders', title: 'الطلبات الواردة', sub: 'متابعة وتسليم الطلبات', count: orders.length, icon: Package },
          { id: 'settings', title: 'إعدادات المنصة', sub: 'المظهر والواجهة والنموذج', count: null, icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-3xl border text-right transition flex flex-col justify-between gap-2 ${
                active
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-blue-600'}`} />
                {tab.count !== null && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black">{tab.title}</div>
                <div className={`text-[11px] font-bold ${active ? 'text-blue-100' : 'text-slate-500'}`}>{tab.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* تبويب 1: إدارة المذكرات والعينات */}
      {/* ===================================================================== */}
      {activeTab === 'notebooks' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveNotebook} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {nbForm.id ? 'تعديل مذكرة حالية' : 'إضافة مذكرة دراسية جديدة'}
              </h3>
              {nbForm.id && (
                <button
                  type="button"
                  onClick={() => setNbForm(emptyNotebookForm)}
                  className="text-xs font-black text-rose-600 hover:underline"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المذكرة *</label>
                <input
                  type="text"
                  required
                  value={nbForm.title}
                  onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف مختصر</label>
                <input
                  type="text"
                  value={nbForm.subtitle}
                  onChange={(e) => setNbForm({ ...nbForm, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الشارة المميزة أعلى الغلاف</label>
                <input
                  type="text"
                  placeholder="مثال: الخيار الأمثل للمراجعة"
                  value={nbForm.badgeText}
                  onChange={(e) => setNbForm({ ...nbForm, badgeText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">السعر الحالي (ج.م) *</label>
                <input
                  type="number"
                  required
                  value={nbForm.price}
                  onChange={(e) => setNbForm({ ...nbForm, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">السعر قبل الخصم (ج.م)</label>
                <input
                  type="number"
                  value={nbForm.oldPrice}
                  onChange={(e) => setNbForm({ ...nbForm, oldPrice: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد الصفحات</label>
                <input
                  type="text"
                  placeholder="مثال: 105"
                  value={nbForm.pagesCount}
                  onChange={(e) => setNbForm({ ...nbForm, pagesCount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">القسم الرئيسي</label>
                <select
                  value={nbForm.categoryId}
                  onChange={(e) => setNbForm({ ...nbForm, categoryId: e.target.value, stageId: '', gradeId: '' })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold"
                >
                  <option value="">-- اختر القسم --</option>
                  {(localSettings.categories || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المرحلة الدراسية</label>
                <select
                  value={nbForm.stageId}
                  onChange={(e) => setNbForm({ ...nbForm, stageId: e.target.value, gradeId: '' })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold"
                >
                  <option value="">-- اختياري --</option>
                  {(selectedFormCategory?.stages || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الصف الدراسي</label>
                <select
                  value={nbForm.gradeId}
                  onChange={(e) => setNbForm({ ...nbForm, gradeId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold"
                >
                  <option value="">-- اختياري --</option>
                  {(selectedFormStage?.grades || []).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المادة الدراسية</label>
                <input
                  type="text"
                  placeholder="مثال: اللغة العربية"
                  value={nbForm.subject}
                  onChange={(e) => setNbForm({ ...nbForm, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رابط Google Drive للعينة الكاملة</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={nbForm.driveLink}
                  onChange={(e) => setNbForm({ ...nbForm, driveLink: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">لون زر رابط Drive</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={nbForm.driveBtnColor || '#059669'}
                    onChange={(e) => setNbForm({ ...nbForm, driveBtnColor: e.target.value })}
                    className="w-12 h-10 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-500">{nbForm.driveBtnColor}</span>
                </div>
              </div>
            </div>

            {/* التنبيه الخاص بالمذكرة */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">تنبيه خاص يظهر عند معاينة المذكرة</label>
                <input
                  type="text"
                  placeholder="مثال: المذكرة متاحة بصيغتي Word و PDF قابلة للتعديل"
                  value={nbForm.noticeText}
                  onChange={(e) => setNbForm({ ...nbForm, noticeText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">لون التنبيه</label>
                <select
                  value={nbForm.noticeColor}
                  onChange={(e) => setNbForm({ ...nbForm, noticeColor: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                >
                  <option value="amber">أصفر تحذيري</option>
                  <option value="blue">أزرق معلوماتي</option>
                  <option value="rose">أحمر هام</option>
                  <option value="emerald">أخضر تأكيدي</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">موضع التنبيه</label>
                <select
                  value={nbForm.noticePosition}
                  onChange={(e) => setNbForm({ ...nbForm, noticePosition: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                >
                  <option value="top">أعلى العينات</option>
                  <option value="bottom">أسفل العينات</option>
                </select>
              </div>
            </div>

            {/* رفع صورة الغلاف وصور العينات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <div className="text-xs font-black text-slate-800">صورة غلاف المذكرة</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const compressed = await compressImageFile(f, 1200, 0.85);
                    setNbForm({ ...nbForm, coverImage: compressed });
                  }}
                  className="text-xs font-bold"
                />
                {nbForm.coverImage && (
                  <div className="relative w-28 h-36 rounded-xl overflow-hidden border">
                    <img src={nbForm.coverImage} alt="cover" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNbForm({ ...nbForm, coverImage: '' })}
                      className="absolute top-1 left-1 p-1 rounded-full bg-rose-600 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <div className="text-xs font-black text-slate-800">صور صفحات العينات (يمكن اختيار عدة صور معًا)</div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    const compressedList = await Promise.all(files.map((f) => compressImageFile(f, 1400, 0.85)));
                    setNbForm((prev) => ({ ...prev, samples: [...(prev.samples || []), ...compressedList] }));
                  }}
                  className="text-xs font-bold"
                />
                {(nbForm.samples || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {nbForm.samples.map((sImg, sIdx) => (
                      <div key={sIdx} className="relative w-16 h-20 rounded-lg overflow-hidden border">
                        <img src={sImg} alt={`sample_${sIdx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setNbForm((prev) => ({
                              ...prev,
                              samples: prev.samples.filter((_, i) => i !== sIdx)
                            }))
                          }
                          className="absolute top-0.5 left-0.5 p-0.5 rounded-full bg-rose-600 text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingNb}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-md transition"
            >
              {savingNb ? 'جاري الحفظ...' : nbForm.id ? 'حفظ التعديلات على المذكرة' : 'إضافة المذكرة للمنصة'}
            </button>
          </form>

          {/* قائمة المذكرات الحالية */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900">المذكرات المرفوعة ({notebooks.length})</h3>
              <input
                type="text"
                value={adminNbSearch}
                onChange={(e) => setAdminNbSearch(e.target.value)}
                placeholder="بحث سريع في المذكرات..."
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-64"
              />
            </div>

            <div className="space-y-3">
              {filteredAdminNotebooks.map((nb) => (
                <div
                  key={nb.id}
                  className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                    nb.hidden ? 'bg-slate-100 border-slate-300 opacity-80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-16 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {nb.coverImage ? (
                        <img src={nb.coverImage} alt={nb.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900 truncate">{nb.title}</h4>
                        {nb.hidden && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[11px] font-black">
                            مخفية عن الزوار
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 font-bold">
                        {nb.price} ج.م {nb.subject ? `• ${nb.subject}` : ''} {nb.pagesCount ? `• ${nb.pagesCount} صفحة` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleNotebookHidden(nb)}
                      className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 transition ${
                        nb.hidden
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                      }`}
                    >
                      {nb.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{nb.hidden ? 'إظهار للزوار' : 'إخفاء عن الزوار'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        let loadedSamples = samplesMap[nb.id] || nb.inlineSamples || [];
                        if (loadedSamples.length === 0 && db) {
                          const pageIds = Array.from({ length: 12 }, (_, i) => `${nb.id}_p${i}`);
                          const [sSnap, legSnap, ...pSnaps] = await Promise.all([
                            getDoc(publicDoc('notebook_samples', nb.id)).catch(() => null),
                            getDoc(legacyPublicDoc('notebook_samples', nb.id)).catch(() => null),
                            ...pageIds.map((pid) => getDoc(publicDoc('notebook_samples', pid)).catch(() => null))
                          ]);
                          const found = [];
                          [sSnap, ...pSnaps, legSnap].forEach((snap) => {
                            if (snap && snap.exists()) {
                              extractAnyImagesFromDoc(snap.data()).forEach((im) => {
                                if (im && im !== nb.coverImage && !found.includes(im)) found.push(im);
                              });
                            }
                          });
                          loadedSamples = found;
                        }
                        setNbForm({
                          ...nb,
                          price: String(nb.price),
                          oldPrice: nb.oldPrice ? String(nb.oldPrice) : '',
                          samples: loadedSamples
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateNotebook(nb)}
                      className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteNotebook(nb)}
                      className="px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-black flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* تبويب 2: إدارة الأقسام والمراحل والصفوف */}
      {/* ===================================================================== */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-base sm:text-lg font-black text-slate-900">إدارة الأقسام الرئيسية والمراحل والصفوف</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const updated = (localSettings.categories || []).map((c, idx) => ({
                    ...c,
                    name: DEFAULT_CATEGORIES[idx]?.name || c.name,
                    stages: c.stages?.length ? c.stages : DEFAULT_CATEGORIES[idx]?.stages || []
                  }));
                  setLocalSettings({ ...localSettings, categories: updated });
                  showToast('تمت استعادة الأسماء والمراحل الافتراضية، اضغط حفظ لتثبيتها.');
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-black"
              >
                استعادة الأسماء والمراحل الافتراضية مع الإبقاء على الصور
              </button>
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    categories: [
                      ...(localSettings.categories || []),
                      { id: `cat_${Date.now()}`, name: 'قسم جديد', image: '', browseMode: 'hierarchical', stages: [] }
                    ]
                  })
                }
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {(localSettings.categories || []).map((cat, cIdx) => (
              <div key={cat.id} className="p-4 sm:p-5 rounded-3xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={cIdx === 0}
                      onClick={() => {
                        const arr = [...localSettings.categories];
                        [arr[cIdx - 1], arr[cIdx]] = [arr[cIdx], arr[cIdx - 1]];
                        setLocalSettings({ ...localSettings, categories: arr });
                      }}
                      className="p-1 rounded bg-white border border-slate-200 disabled:opacity-40"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={cIdx === localSettings.categories.length - 1}
                      onClick={() => {
                        const arr = [...localSettings.categories];
                        [arr[cIdx + 1], arr[cIdx]] = [arr[cIdx], arr[cIdx + 1]];
                        setLocalSettings({ ...localSettings, categories: arr });
                      }}
                      className="p-1 rounded bg-white border border-slate-200 disabled:opacity-40"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => {
                      const arr = [...localSettings.categories];
                      arr[cIdx] = { ...cat, name: e.target.value };
                      setLocalSettings({ ...localSettings, categories: arr });
                    }}
                    className="flex-1 min-w-[180px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-black"
                  />

                  <select
                    value={cat.browseMode || 'hierarchical'}
                    onChange={(e) => {
                      const arr = [...localSettings.categories];
                      arr[cIdx] = { ...cat, browseMode: e.target.value };
                      setLocalSettings({ ...localSettings, categories: arr });
                    }}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    <option value="hierarchical">تصفح هرمي (مراحل وصفوف)</option>
                    <option value="direct">تصفح مباشر للمذكرات</option>
                  </select>

                  <label className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-black cursor-pointer hover:bg-slate-100">
                    <span>صورة القسم</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const compressed = await compressImageFile(f, 900, 0.85);
                        const arr = [...localSettings.categories];
                        arr[cIdx] = { ...cat, image: compressed };
                        setLocalSettings({ ...localSettings, categories: arr });
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const arr = [...localSettings.categories];
                      arr[cIdx] = {
                        ...cat,
                        stages: [...(cat.stages || []), { id: `stg_${Date.now()}`, name: 'مرحلة جديدة', grades: [] }]
                      };
                      setLocalSettings({ ...localSettings, categories: arr });
                    }}
                    className="px-3 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black"
                  >
                    + مرحلة
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const arr = localSettings.categories.filter((_, idx) => idx !== cIdx);
                      setLocalSettings({ ...localSettings, categories: arr });
                    }}
                    className="p-2.5 rounded-xl bg-rose-100 text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {cat.image && (
                  <div className="relative w-36 h-20 rounded-xl overflow-hidden border bg-white">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const arr = [...localSettings.categories];
                        arr[cIdx] = { ...cat, image: '' };
                        setLocalSettings({ ...localSettings, categories: arr });
                      }}
                      className="absolute top-1 left-1 p-1 rounded-full bg-rose-600 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* المراحل والصفوف داخل القسم */}
                {(cat.stages || []).length > 0 && (
                  <div className="space-y-2.5 pr-4 border-r-2 border-blue-200">
                    {cat.stages.map((stg, sIdx) => (
                      <div key={stg.id} className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={stg.name}
                            onChange={(e) => {
                              const arr = [...localSettings.categories];
                              const stages = [...cat.stages];
                              stages[sIdx] = { ...stg, name: e.target.value };
                              arr[cIdx] = { ...cat, stages };
                              setLocalSettings({ ...localSettings, categories: arr });
                            }}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-black"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const arr = [...localSettings.categories];
                              const stages = [...cat.stages];
                              stages[sIdx] = {
                                ...stg,
                                grades: [...(stg.grades || []), { id: `grd_${Date.now()}`, name: 'صف جديد' }]
                              };
                              arr[cIdx] = { ...cat, stages };
                              setLocalSettings({ ...localSettings, categories: arr });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-black"
                          >
                            + صف دراسي
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const arr = [...localSettings.categories];
                              arr[cIdx] = { ...cat, stages: cat.stages.filter((_, idx) => idx !== sIdx) };
                              setLocalSettings({ ...localSettings, categories: arr });
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(stg.grades || []).map((grd, gIdx) => (
                            <div key={grd.id} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                              <input
                                type="text"
                                value={grd.name}
                                onChange={(e) => {
                                  const arr = [...localSettings.categories];
                                  const stages = [...cat.stages];
                                  const grades = [...stg.grades];
                                  grades[gIdx] = { ...grd, name: e.target.value };
                                  stages[sIdx] = { ...stg, grades };
                                  arr[cIdx] = { ...cat, stages };
                                  setLocalSettings({ ...localSettings, categories: arr });
                                }}
                                className="bg-transparent text-xs font-bold w-36 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const arr = [...localSettings.categories];
                                  const stages = [...cat.stages];
                                  stages[sIdx] = { ...stg, grades: stg.grades.filter((_, idx) => idx !== gIdx) };
                                  arr[cIdx] = { ...cat, stages };
                                  setLocalSettings({ ...localSettings, categories: arr });
                                }}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={savingSettings}
            onClick={() => saveAllSettingsToCloud(localSettings)}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-md transition"
          >
            {savingSettings ? 'جاري الحفظ...' : 'حفظ هيكل الأقسام والصور'}
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* تبويب 3: الكوبونات والباقات والخصومات */}
      {/* ===================================================================== */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          {/* إدارة الباقات التوفيرية */}
          <form onSubmit={handleSavePackage} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {pkgForm.id ? 'تعديل باقة توفير' : 'إضافة باقة توفير وربط مذكراتها'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <input
                type="text"
                required
                placeholder="اسم الباقة"
                value={pkgForm.title}
                onChange={(e) => setPkgForm({ ...pkgForm, title: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
              />
              <textarea
                rows={1}
                placeholder="وصف الباقة ومميزاتها"
                value={pkgForm.description}
                onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
              />
              <input
                type="number"
                required
                placeholder="سعر الباقة بعد الخصم (ج.م)"
                value={pkgForm.price}
                onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
              />
              <input
                type="number"
                placeholder="السعر قبل الخصم (يُحسب تلقائيًا عند اختيار المذكرات)"
                value={pkgForm.oldPrice}
                onChange={(e) => setPkgForm({ ...pkgForm, oldPrice: e.target.value, oldPriceManual: true })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-black text-slate-700">حدد المذكرات المشمولة داخل الباقة (يُجمع سعرها تلقائيًا):</div>
              <div className="flex flex-wrap gap-2">
                {notebooks.map((nb) => {
                  const selected = pkgForm.notebookIds.includes(nb.id);
                  return (
                    <button
                      key={nb.id}
                      type="button"
                      onClick={() => togglePackageNotebook(nb.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-black border transition ${
                        selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {nb.title} ({nb.price} ج.م)
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black shadow-md"
            >
              {pkgForm.id ? 'حفظ تعديل الباقة' : 'حفظ الباقة'}
            </button>

            {packages.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-100">
                {packages.map((p) => (
                  <div key={p.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-black text-slate-900">{p.title}</div>
                      <div className="text-xs text-slate-600 font-bold">
                        {p.price} ج.م {p.oldPrice ? `(بدلاً من ${p.oldPrice} ج.م)` : ''}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPkgForm({
                            id: p.id,
                            title: p.title,
                            description: p.description || '',
                            price: String(p.price),
                            oldPrice: p.oldPrice ? String(p.oldPrice) : '',
                            oldPriceManual: true,
                            notebookIds: p.notebookIds || []
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDoc(publicDoc('packages', p.id))}
                        className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 text-xs font-black"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>

          {/* إدارة كوبونات الخصم */}
          <form onSubmit={handleSaveCoupon} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {couponForm.id ? 'تعديل كوبون خصم' : 'إضافة كوبون خصم جديد'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <input
                type="text"
                required
                placeholder="كود الكوبون (مثال: VIP20)"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-black uppercase"
              />
              <select
                value={couponForm.type}
                onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold"
              >
                <option value="percent">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (ج.م)</option>
              </select>
              <input
                type="number"
                required
                placeholder="قيمة الخصم"
                value={couponForm.value}
                onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
              />
              <input
                type="number"
                placeholder="الحد الأدنى للطلب (ج.م - اختياري)"
                value={couponForm.minOrder}
                onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
              />
              <input
                type="number"
                placeholder="أقصى عدد مرات استخدام (0 = مفتوح)"
                value={couponForm.maxUses}
                onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
              />
              <input
                type="datetime-local"
                value={couponForm.expiresAt}
                onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-md"
            >
              {couponForm.id ? 'حفظ تعديل الكوبون' : 'إضافة الكوبون'}
            </button>

            {coupons.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-100">
                {coupons.map((c) => (
                  <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-black text-slate-900">{c.code}</span>
                      <span className="text-xs text-slate-600 font-bold mr-2">
                        • خصم {c.value} {c.type === 'fixed' ? 'ج.م' : '%'} (مستخدم {c.usedCount || 0} مرة)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateDoc(publicDoc('coupons', c.id), { active: c.active === false })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                          c.active === false ? 'bg-amber-200 text-amber-950' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.active === false ? 'متوقف (تفعيل)' : 'نشط (إيقاف)'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCouponForm({
                            id: c.id,
                            code: c.code,
                            type: c.type || 'percent',
                            value: String(c.value),
                            minOrder: c.minOrder ? String(c.minOrder) : '',
                            maxUses: c.maxUses ? String(c.maxUses) : '',
                            expiresAt: c.expiresAt || '',
                            active: c.active !== false
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDoc(publicDoc('coupons', c.id))}
                        className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 text-xs font-black"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>

          {/* إعدادات كوبون مكافأة الطلب القادم التلقائي */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">كوبون مكافأة الطلب القادم التلقائي</h3>
              <input
                type="checkbox"
                checked={localSettings.nextOrderRewardEnabled !== false}
                onChange={(e) => setLocalSettings({ ...localSettings, nextOrderRewardEnabled: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نسبة الخصم (%)</label>
                <input
                  type="number"
                  value={localSettings.nextOrderRewardPercent || 15}
                  onChange={(e) => setLocalSettings({ ...localSettings, nextOrderRewardPercent: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مدة الصلاحية بالأيام (0 = مفتوح)</label>
                <input
                  type="number"
                  value={localSettings.nextOrderRewardDays ?? 7}
                  onChange={(e) => setLocalSettings({ ...localSettings, nextOrderRewardDays: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">بادئة الكود</label>
                <input
                  type="text"
                  value={localSettings.nextOrderRewardPrefix || 'VIP'}
                  onChange={(e) => setLocalSettings({ ...localSettings, nextOrderRewardPrefix: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold uppercase"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={savingSettings}
              onClick={() => saveAllSettingsToCloud(localSettings)}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black"
            >
              حفظ إعدادات مكافأة الطلب القادم
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* تبويب 4: الطلبات الواردة */}
      {/* ===================================================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="text-base sm:text-lg font-black text-slate-900">الطلبات الواردة ({orders.length})</h3>
          {orders.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-500 font-bold py-6 text-center">لا توجد طلبات مسجلة بعد.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{ord.orderCode}</span>
                      <span className="text-xs font-black text-blue-600">• {ord.total} ج.م</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={ord.status || 'pending'}
                        onChange={(e) => updateDoc(publicDoc('orders', ord.id), { status: e.target.value })}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black"
                      >
                        <option value="pending">قيد المراجعة</option>
                        <option value="processing">جاري التنسيق</option>
                        <option value="completed">مكتمل وتم التسليم</option>
                      </select>
                      {ord.customer?.phone && (
                        <a
                          href={`https://wa.me/${String(ord.customer.phone).replace(/[^0-9]/g, '').replace(/^0/, '20')}?text=${encodeURIComponent(
                            `السلام عليكم أ/ ${ord.customer.teacherName || ''}، تم تجهيز طلبك رقم ${ord.orderCode} من ${settings.platformName}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black"
                        >
                          واتساب المعلم
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteDoc(publicDoc('orders', ord.id))}
                        className="p-1.5 rounded-xl bg-rose-100 text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-700 font-bold">
                    المعلم: {ord.customer?.teacherName || '-'} | الهاتف: {ord.customer?.phone || '-'}
                  </div>
                  <div className="text-xs text-slate-600 font-bold">
                    المذكرات: {(ord.items || []).map((i) => i.title).join(' ، ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* تبويب 5: إعدادات المنصة والمظهر */}
      {/* ===================================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-5">
          {/* أزرار التبويبات الفرعية للإعدادات */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'identity', label: '1. الهوية والشريط الإعلاني' },
                { id: 'hero', label: '2. الواجهة وبطاقة الثقة' },
                { id: 'sections', label: '3. شارة التوفير وما الجديد' },
                { id: 'checkout', label: '4. السلة والتواصل والنسخ' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSettingsSubTab(st.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition ${
                    settingsSubTab === st.id
                      ? 'bg-slate-900 text-white shadow'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={savingSettings}
              onClick={() => saveAllSettingsToCloud(localSettings)}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow-md"
            >
              {savingSettings ? 'جاري الحفظ...' : 'حفظ كافة الإعدادات'}
            </button>
          </div>

          {/* 1. الهوية والشريط الإعلاني */}
          {settingsSubTab === 'identity' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنصة</label>
                  <input
                    type="text"
                    value={localSettings.platformName}
                    onChange={(e) => setLocalSettings({ ...localSettings, platformName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوصف المختصر بجانب الشعار</label>
                  <input
                    type="text"
                    value={localSettings.platformTagline}
                    onChange={(e) => setLocalSettings({ ...localSettings, platformTagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نظام الألوان الرئيسي</label>
                  <select
                    value={localSettings.primaryTheme || 'royal'}
                    onChange={(e) => setLocalSettings({ ...localSettings, primaryTheme: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold"
                  >
                    {Object.entries(THEME_PALETTES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم واتساب استقبال الطلبات (بالكود الدولي)</label>
                  <input
                    type="text"
                    value={localSettings.whatsappNumber}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
              </div>

              {/* الشعار وصورة الخلفية وشفافية التعتيم */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-black text-slate-800">شعار المنصة (Logo)</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const compressed = await compressImageFile(f, 400, 0.9);
                      setLocalSettings({ ...localSettings, logoImage: compressed });
                    }}
                    className="text-xs font-bold"
                  />
                  {localSettings.logoImage && (
                    <div className="flex items-center gap-3 pt-1">
                      <img src={localSettings.logoImage} alt="logo" className="w-14 h-14 rounded-xl object-cover border" />
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, logoImage: '' })}
                        className="text-xs font-black text-rose-600"
                      >
                        إزالة الشعار
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="text-xs font-black text-slate-800">صورة خلفية الواجهة الرئيسية (Hero)</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const compressed = await compressImageFile(f, 1600, 0.85);
                      setLocalSettings({ ...localSettings, heroImage: compressed });
                    }}
                    className="text-xs font-bold"
                  />
                  {localSettings.heroImage && (
                    <div className="flex items-center gap-3 pt-1">
                      <img src={localSettings.heroImage} alt="hero" className="w-28 h-14 rounded-xl object-cover border" />
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, heroImage: '' })}
                        className="text-xs font-black text-rose-600"
                      >
                        إزالة صورة الخلفية
                      </button>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      درجة شفافية التعتيم فوق الخلفية: {localSettings.heroOverlayOpacity ?? 65}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="95"
                      value={localSettings.heroOverlayOpacity ?? 65}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, heroOverlayOpacity: Number(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* الشريط الإعلاني العلوي */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">الشريط الإعلاني أعلى الشاشة الرئيسية</span>
                  <input
                    type="checkbox"
                    checked={localSettings.promoEnabled !== false}
                    onChange={(e) => setLocalSettings({ ...localSettings, promoEnabled: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">النص المكتوب على الشريط</label>
                    <input
                      type="text"
                      value={localSettings.promoText || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, promoText: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">كود الكوبون</label>
                    <input
                      type="text"
                      value={localSettings.promoCouponCode || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, promoCouponCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">لون الشريط</label>
                      <input
                        type="color"
                        value={localSettings.promoBgColor || '#0f172a'}
                        onChange={(e) => setLocalSettings({ ...localSettings, promoBgColor: e.target.value })}
                        className="w-12 h-10 rounded-xl border border-slate-200 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">لون النص</label>
                      <input
                        type="color"
                        value={localSettings.promoTextColor || '#ffffff'}
                        onChange={(e) => setLocalSettings({ ...localSettings, promoTextColor: e.target.value })}
                        className="w-12 h-10 rounded-xl border border-slate-200 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* إدارة التنبيهات العامة للمنصة */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-black text-slate-900">التنبيهات العامة للمنصة (تظهر للزوار في الرئيسية وداخل معاينة المذكرات)</span>
                    <p className="text-xs text-slate-600 font-bold">أضف تنبيهات هامة مثل مواعيد التسليم، خصومات الكميات، أو تعليمات الطلب</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        globalAlerts: [
                          ...(localSettings.globalAlerts || []),
                          {
                            id: `al_${Date.now()}`,
                            text: 'تنبيه هام: التسليم يتم خلال ساعات قليلة بصيغة PDF عالية الجودة جاهزة للطباعة.',
                            color: 'amber',
                            scope: 'all',
                            active: true
                          }
                        ]
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة تنبيه عام</span>
                  </button>
                </div>

                {(!localSettings.globalAlerts || localSettings.globalAlerts.length === 0) ? (
                  <p className="text-xs text-slate-500 font-bold py-2">لا توجد تنبيهات عامة مضافة حاليًا. اضغط «إضافة تنبيه عام» لإضافة تنبيه.</p>
                ) : (
                  <div className="space-y-2.5">
                    {localSettings.globalAlerts.map((al, idx) => (
                      <div key={al.id || idx} className="p-3 rounded-2xl bg-white border border-amber-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-6">
                          <input
                            type="text"
                            value={al.text || ''}
                            onChange={(e) => {
                              const arr = [...localSettings.globalAlerts];
                              arr[idx] = { ...al, text: e.target.value };
                              setLocalSettings({ ...localSettings, globalAlerts: arr });
                            }}
                            placeholder="اكتب نص التنبيه هنا..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <select
                            value={al.color || 'amber'}
                            onChange={(e) => {
                              const arr = [...localSettings.globalAlerts];
                              arr[idx] = { ...al, color: e.target.value };
                              setLocalSettings({ ...localSettings, globalAlerts: arr });
                            }}
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                          >
                            <option value="amber">أصفر تحذيري</option>
                            <option value="blue">أزرق معلوماتي</option>
                            <option value="rose">أحمر هام</option>
                            <option value="emerald">أخضر تأكيدي</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <select
                            value={al.scope || 'all'}
                            onChange={(e) => {
                              const arr = [...localSettings.globalAlerts];
                              arr[idx] = { ...al, scope: e.target.value };
                              setLocalSettings({ ...localSettings, globalAlerts: arr });
                            }}
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                          >
                            <option value="all">الرئيسية + المعاينة</option>
                            <option value="home_only">الرئيسية فقط</option>
                            <option value="preview_only">معاينة المذكرات فقط</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2 flex items-center justify-end gap-2">
                          <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={al.active !== false}
                              onChange={(e) => {
                                const arr = [...localSettings.globalAlerts];
                                arr[idx] = { ...al, active: e.target.checked };
                                setLocalSettings({ ...localSettings, globalAlerts: arr });
                              }}
                            />
                            <span>نشط</span>
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setLocalSettings({
                                ...localSettings,
                                globalAlerts: localSettings.globalAlerts.filter((_, i) => i !== idx)
                              })
                            }
                            className="p-2 rounded-xl bg-rose-100 text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. شارة التوفير وما الجديد والأخبار */}
          {settingsSubTab === 'sections' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              {/* التحكم في لون ومكان شارة التوفير */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs sm:text-sm font-black text-slate-900">
                  التحكم في لون ومكان شارة قيمة التوفير على المذكرات
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">مكان ظهور شارة التوفير</label>
                    <select
                      value={localSettings.savingsBadgePosition || 'next_to_pages'}
                      onChange={(e) => setLocalSettings({ ...localSettings, savingsBadgePosition: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    >
                      <option value="next_to_pages">بجوار أيقونة عدد الصفحات (الافتراضي)</option>
                      <option value="next_to_price">بجوار السعر</option>
                      <option value="on_cover">على صورة غلاف المذكرة</option>
                      <option value="hidden">إخفاء شارة التوفير</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">لون شارة التوفير</label>
                    <select
                      value={localSettings.savingsBadgeColor || 'emerald'}
                      onChange={(e) => setLocalSettings({ ...localSettings, savingsBadgeColor: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    >
                      <option value="emerald">أخضر زمردي</option>
                      <option value="rose">أحمر وردي مميز</option>
                      <option value="amber">ذهبي / عنبري</option>
                      <option value="blue">أزرق ملكي</option>
                      <option value="purple">بنفسجي</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* قسم ما الجديد */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">قسم «ما الجديد؟» في الصفحة الرئيسية</span>
                  <input
                    type="checkbox"
                    checked={localSettings.whatsNewEnabled !== false}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewEnabled: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={localSettings.whatsNewTitle || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewTitle: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                  <select
                    value={localSettings.whatsNewMode || 'auto'}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewMode: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    <option value="auto">اختيار تلقائي لأحدث المذكرات</option>
                    <option value="manual">اختيار يدوي لمذكرات محددة</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={localSettings.whatsNewCount || 4}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewCount: Number(e.target.value) })}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. السلة والتواصل والنسخ الاحتياطي */}
          {settingsSubTab === 'checkout' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              {/* حقول نموذج المعلم */}
              <div className="space-y-2.5">
                <div className="text-sm font-black text-slate-900">حقول بيانات المعلم داخل السلة</div>
                {(localSettings.checkoutFields || []).map((f, idx) => (
                  <div key={f.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => {
                        const arr = [...localSettings.checkoutFields];
                        arr[idx] = { ...f, label: e.target.value };
                        setLocalSettings({ ...localSettings, checkoutFields: arr });
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    />
                    <label className="flex items-center gap-1 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={f.enabled !== false}
                        onChange={(e) => {
                          const arr = [...localSettings.checkoutFields];
                          arr[idx] = { ...f, enabled: e.target.checked };
                          setLocalSettings({ ...localSettings, checkoutFields: arr });
                        }}
                      />
                      <span>مفعّل</span>
                    </label>
                    <label className="flex items-center gap-1 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={Boolean(f.required)}
                        onChange={(e) => {
                          const arr = [...localSettings.checkoutFields];
                          arr[idx] = { ...f, required: e.target.checked };
                          setLocalSettings({ ...localSettings, checkoutFields: arr });
                        }}
                      />
                      <span>إلزامي</span>
                    </label>
                  </div>
                ))}
              </div>

              {/* روابط التواصل الاجتماعي */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">روابط التواصل الاجتماعي</span>
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        socialLinks: [
                          ...(localSettings.socialLinks || []),
                          { id: `soc_${Date.now()}`, label: 'رابط جديد', platform: 'facebook', url: 'https://' }
                        ]
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black"
                  >
                    + إضافة رابط
                  </button>
                </div>
                {(localSettings.socialLinks || []).map((soc, idx) => (
                  <div key={soc.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-50 border">
                    <input
                      type="text"
                      value={soc.label}
                      onChange={(e) => {
                        const arr = [...localSettings.socialLinks];
                        arr[idx] = { ...soc, label: e.target.value };
                        setLocalSettings({ ...localSettings, socialLinks: arr });
                      }}
                      className="px-3 py-1.5 rounded-xl border bg-white text-xs font-bold"
                    />
                    <select
                      value={soc.platform || 'facebook'}
                      onChange={(e) => {
                        const arr = [...localSettings.socialLinks];
                        arr[idx] = { ...soc, platform: e.target.value };
                        setLocalSettings({ ...localSettings, socialLinks: arr });
                      }}
                      className="px-3 py-1.5 rounded-xl border bg-white text-xs font-bold"
                    >
                      <option value="facebook">فيسبوك</option>
                      <option value="telegram">تليجرام</option>
                      <option value="youtube">يوتيوب</option>
                      <option value="instagram">إنستجرام</option>
                      <option value="whatsapp">واتساب</option>
                      <option value="website">موقع إلكتروني</option>
                    </select>
                    <input
                      type="url"
                      value={soc.url}
                      onChange={(e) => {
                        const arr = [...localSettings.socialLinks];
                        arr[idx] = { ...soc, url: e.target.value };
                        setLocalSettings({ ...localSettings, socialLinks: arr });
                      }}
                      className="px-3 py-1.5 rounded-xl border bg-white text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          socialLinks: localSettings.socialLinks.filter((_, i) => i !== idx)
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 text-xs font-black"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>

              {/* النسخ الاحتياطي والاستعادة */}
              <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify({ settings: localSettings, notebooks, packages, coupons }, null, 2)], {
                      type: 'application/json'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `el3bakera_backup_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-black flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل نسخة احتياطية (JSON)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
