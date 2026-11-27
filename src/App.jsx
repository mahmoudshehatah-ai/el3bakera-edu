import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  BookOpen,
  ShoppingCart,
  Search,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Eye,
  Upload,
  Sparkles,
  Tag,
  Phone,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  LogOut,
  Package,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Download,
  FolderOpen,
  Sliders,
  Award,
  MessageCircle,
  ArrowLeft,
  Percent,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Filter,
  Layers
} from 'lucide-react';

// ============================================================================
// 1. إعدادات Firebase والاتصال بقاعدة البيانات السحابية (el3bakera-edu)
// ============================================================================
const LOCAL_API_KEY_STORAGE = 'el3bakera_firebase_web_api_key';

const normalizeApiKey = (raw) => {
  if (!raw) return '';
  const match = String(raw).match(/AIza[0-9A-Za-z_-]{20,}/);
  return match ? match[0] : '';
};

const getStoredOrEnvApiKey = () => {
  try {
    const fromStorage = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_API_KEY_STORAGE) : '';
    const cleanStorage = normalizeApiKey(fromStorage);
    if (cleanStorage) return cleanStorage;
  } catch {
    // تجاهل
  }
  try {
    const fromEnv = import.meta?.env?.VITE_FIREBASE_API_KEY;
    const cleanEnv = normalizeApiKey(fromEnv);
    if (cleanEnv) return cleanEnv;
  } catch {
    // تجاهل
  }
  return ['AIzaSyD_du5VY8nJGDJ169Fof9EAlI9x2W2d-14'].join('');
};

const buildFirebaseConfig = (apiKeyOverride = '') => ({
  apiKey: normalizeApiKey(apiKeyOverride) || getStoredOrEnvApiKey(),
  authDomain: 'el3bakera-edu.firebaseapp.com',
  projectId: 'el3bakera-edu',
  storageBucket: 'el3bakera-edu.firebasestorage.app',
  messagingSenderId: '74663879858',
  appId: '1:74663879858:web:4327c0ea1b825dd6c615ab'
});

const APP_ID = 'el3bakera-edu';
const LEGACY_APP_ID = 'muzakkirati-edu-app';
const ADMIN_EMAIL = 'mahmoudelzaaty7@gmail.com';

const LOCAL_SETTINGS_KEY = 'el3bakera_settings_backup_v4';
const LOCAL_NOTEBOOKS_KEY = 'el3bakera_notebooks_backup_v4';
const LOCAL_SAMPLES_KEY = 'el3bakera_samples_backup_v4';
const LOCAL_CART_KEY = 'el3bakera_cart_v4';

const LEGACY_NOTEBOOK_KEYS = [
  'el3bakera_notebooks_backup_v4',
  'el3bakera_notebooks_backup_v3',
  'el3bakera_notebooks_backup_v2',
  'el3bakera_notebooks_backup_v1',
  'muzakkirati_notebooks_backup'
];

let app = null;
let auth = null;
let db = null;

const initFirebaseServices = (apiKeyOverride = '') => {
  try {
    const cleanKey = normalizeApiKey(apiKeyOverride);
    const cfg = buildFirebaseConfig(cleanKey);
    const appName = cleanKey ? `el3bakera_${cleanKey.slice(-6)}` : '[DEFAULT]';
    const existing = getApps().find((a) => a.name === appName);
    app = existing || (appName === '[DEFAULT]' ? initializeApp(cfg) : initializeApp(cfg, appName));
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    db = getFirestore(app);
    return { app, auth, db };
  } catch (e) {
    console.warn('Firebase init fallback:', e);
    return { app, auth, db };
  }
};

initFirebaseServices();

const publicCol = (colName) => collection(db, 'artifacts', APP_ID, 'public', 'data', colName);
const publicDoc = (colName, docId) => doc(db, 'artifacts', APP_ID, 'public', 'data', colName, docId);
const legacyPublicCol = (colName) => collection(db, 'artifacts', LEGACY_APP_ID, 'public', 'data', colName);

const THEME_PALETTES = {
  blue: {
    label: 'الأزرق الملكي (الافتراضي)',
    primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    primaryText: 'text-blue-600',
    primarySoft: 'bg-blue-50 text-blue-700 border-blue-200',
    heroGradient: 'from-slate-950 via-blue-950/90 to-slate-900/75',
    cardGradient: 'from-blue-600 to-indigo-700',
    accentBorder: 'hover:border-blue-400'
  },
  emerald: {
    label: 'الزمردي التعليمي',
    primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    primaryText: 'text-emerald-600',
    primarySoft: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    heroGradient: 'from-slate-950 via-emerald-950/90 to-slate-900/75',
    cardGradient: 'from-emerald-600 to-teal-700',
    accentBorder: 'hover:border-emerald-400'
  },
  indigo: {
    label: 'البنفسجي النيلي الحديث',
    primaryBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    primaryText: 'text-indigo-600',
    primarySoft: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    heroGradient: 'from-slate-950 via-indigo-950/90 to-slate-900/75',
    cardGradient: 'from-indigo-600 to-violet-700',
    accentBorder: 'hover:border-indigo-400'
  },
  slate: {
    label: 'الكلاسيكي الداكن الفاخر',
    primaryBtn: 'bg-slate-900 hover:bg-slate-800 text-white',
    primaryText: 'text-slate-900',
    primarySoft: 'bg-slate-100 text-slate-800 border-slate-300',
    heroGradient: 'from-slate-950 via-slate-900/95 to-slate-800/80',
    cardGradient: 'from-slate-800 to-slate-950',
    accentBorder: 'hover:border-slate-500'
  }
};

// ============================================================================
// 2. دوال المساعدة وتطبيع البيانات لحماية الواجهة من أي صيغة غير متوقعة
// ============================================================================
const safeText = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (typeof val.ar === 'string') return val.ar;
    if (typeof val.text === 'string') return val.text;
    if (typeof val.label === 'string') return val.label;
    if (typeof val.name === 'string') return val.name;
    if (typeof val.title === 'string') return val.title;
  }
  return fallback;
};

const toTimeMs = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const t = Date.parse(val);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof val === 'object') {
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
  }
  return 0;
};

const extractImageFromValue = (v) => {
  if (!v) return '';
  if (typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('http'))) return v;
  if (typeof v === 'object') {
    for (const key of ['url', 'src', 'image', 'dataUrl', 'base64', 'data', 'content', 'file', 'path', 'img']) {
      if (typeof v[key] === 'string' && (v[key].startsWith('data:image') || v[key].startsWith('http'))) {
        return v[key];
      }
    }
  }
  return '';
};

const extractAnyImagesFromDoc = (data) => {
  if (!data || typeof data !== 'object') return [];
  const found = [];
  const candidateArrays = [
    data.pages,
    data.samples,
    data.samplePages,
    data.images,
    data.sampleImages,
    data.urls,
    data.files,
    data.previewPages
  ];
  for (const arr of candidateArrays) {
    if (Array.isArray(arr)) {
      for (const item of arr) {
        const img = extractImageFromValue(item);
        if (img && !found.includes(img)) found.push(img);
      }
    } else if (arr && typeof arr === 'object') {
      for (const val of Object.values(arr)) {
        const img = extractImageFromValue(val);
        if (img && !found.includes(img)) found.push(img);
      }
    }
  }
  for (const [k, val] of Object.entries(data)) {
    if (['coverImage', 'cover', 'thumbnail', 'thumb'].includes(k)) continue;
    const img = extractImageFromValue(val);
    if (img && !found.includes(img)) found.push(img);
  }
  return found;
};

const normalizeNotebook = (raw, docId = '') => {
  const n = raw && typeof raw === 'object' ? raw : {};
  const cover =
    extractImageFromValue(n.coverImage) ||
    extractImageFromValue(n.coverUrl) ||
    extractImageFromValue(n.coverBase64) ||
    extractImageFromValue(n.cover) ||
    extractImageFromValue(n.image) ||
    extractImageFromValue(n.imageUrl) ||
    extractImageFromValue(n.img) ||
    extractImageFromValue(n.photo) ||
    extractImageFromValue(n.thumbnail);
  const inlineSamples = extractAnyImagesFromDoc(n).filter((img) => img !== cover);
  return {
    id: safeText(n.id, docId),
    title: safeText(n.title || n.name, 'مذكرة دراسية'),
    subtitle: safeText(n.subtitle || n.description, ''),
    subject: safeText(n.subject, ''),
    term: safeText(n.term, ''),
    pagesCount: safeText(n.pagesCount || n.pages, ''),
    categoryId: safeText(n.categoryId, ''),
    stageId: safeText(n.stageId, ''),
    gradeId: safeText(n.gradeId, ''),
    price: Number(n.price ?? 0),
    oldPrice: Number(n.oldPrice ?? 0),
    coverImage: cover,
    driveUrl: safeText(n.driveUrl || n.pdfUrl || n.link, ''),
    noticeText: safeText(n.noticeText || n.notice, ''),
    noticePosition: safeText(n.noticePosition, 'top'),
    badgeText: safeText(n.badgeText || n.badge, ''),
    hidden: Boolean(n.hidden),
    sortOrder: n.sortOrder !== undefined && n.sortOrder !== null ? Number(n.sortOrder) : 9999,
    inlineSamples,
    createdAt: n.createdAt || null
  };
};

const DEFAULT_CATEGORIES = [
  {
    id: 'cat_term1',
    name: 'مذكرات الفصل الدراسي الأول',
    browseMode: 'hierarchy',
    image: '',
    stages: [
      {
        id: 'stg_prim_1',
        name: 'المرحلة الابتدائية',
        grades: [
          { id: 'grd_p4', name: 'الصف الرابع الابتدائي' },
          { id: 'grd_p5', name: 'الصف الخامس الابتدائي' },
          { id: 'grd_p6', name: 'الصف السادس الابتدائي' }
        ]
      },
      {
        id: 'stg_prep_1',
        name: 'المرحلة الإعدادية',
        grades: [
          { id: 'grd_m1', name: 'الصف الأول الإعدادي' },
          { id: 'grd_m2', name: 'الصف الثاني الإعدادي' },
          { id: 'grd_m3', name: 'الصف الثالث الإعدادي' }
        ]
      }
    ]
  },
  {
    id: 'cat_term2',
    name: 'مذكرات الفصل الدراسي الثاني',
    browseMode: 'hierarchy',
    image: '',
    stages: [
      {
        id: 'stg_prim_2',
        name: 'المرحلة الابتدائية',
        grades: [
          { id: 'grd_p4_2', name: 'الصف الرابع الابتدائي' },
          { id: 'grd_p5_2', name: 'الصف الخامس الابتدائي' },
          { id: 'grd_p6_2', name: 'الصف السادس الابتدائي' }
        ]
      }
    ]
  },
  {
    id: 'cat_found',
    name: 'كورسات التأسيس والمراجعات النهائية',
    browseMode: 'direct',
    image: '',
    stages: []
  }
];

const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة للمذكرات التعليمية',
  platformTagline: 'مذكرات دراسية احترافية مخصصة للمعلم باسمه وبياناته الخاصة',
  logoUrl: '',
  primaryTheme: 'blue',
  heroBadge: 'الإصدار المعتمد للمعلمين والسناتر التعليمية',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة باحترافية ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة بيانات المعلم وشعاره على الغلاف وجميع الصفحات.',
  heroPrimaryBtnText: 'تصفح مكتبة المذكرات',
  heroSecondaryBtnText: 'باقات التوفير والخصومات',
  heroCustomBtnText: 'اطلب إعداد مذكرة خاصة',
  showHeroCustomBtn: true,
  heroBgImage: '',
  heroOverlayOpacity: 78,
  heroMinHeight: 460,
  promoEnabled: true,
  promoText: 'عرض خاص للمعلمين: خصم 15% على جميع المذكرات بمناسبة إطلاق المنصة',
  promoCouponCode: 'M20',
  promoBgColor: '#0f172a',
  promoTextColor: '#fde047',
  whatsappNumber: '201000000000',
  trustTitle: 'لماذا يثق بنا المعلمون؟',
  trustPoints: [
    'محتوى متكامل ومطابق لأحدث تعليمات الوزارة ومنسق باحترافية.',
    'وضع اسم المعلم ورقم الهاتف والشعار على الغلاف وجميع الصفحات.',
    'معاينة حقيقية لصفحات المذكرة قبل تأكيد الطلب.',
    'تسليم سريع بصيغة PDF عالية الدقة جاهزة للطباعة.',
    'خدمة عملاء حقيقية لحل أي مشكلة.'
  ],
  whatsNewEnabled: true,
  whatsNewTitle: 'ما الجديد؟ أحدث المذكرات والإصدارات',
  whatsNewMode: 'auto',
  whatsNewCount: 4,
  whatsNewIds: [],
  newsSectionEnabled: true,
  newsSectionTitle: 'أخبار المنصة ومذكرات قيد التجهيز',
  newsItems: [
    {
      id: 'news_1',
      badge: 'قيد التجهيز',
      title: 'مراجعات ليلة الامتحان الشاملة لجميع الصفوف',
      date: 'قريبًا جدًا',
      summary: 'يجري الآن الانتهاء من تنسيق ومراجعة مذكرات المراجعة النهائية بنماذج الوزارة الحديثة.'
    }
  ],
  customBannerEnabled: true,
  customBannerTitle: 'هل تحتاج مذكرة بتصميم خاص أو منهج مخصص؟',
  customBannerSubtitle:
    'فريقنا جاهز لتنسيق وإعداد مذكرتك الخاصة من الصفر باسمك وشعارك وألوانك المفضلة بأعلى جودة للطباعة.',
  customBannerBtnText: 'اطلب مذكرة مخصصة الآن',
  footerNote: 'جميع المذكرات منسقة بأعلى جودة وجاهزة للطباعة والتسليم الفوري بصيغة PDF.',
  orderSuccessMessage: 'تم تسجيل طلبك بنجاح! سيقوم فريقنا بمراجعة بياناتك وإرسال المذكرة باسمك وشعارك عبر واتساب.',
  categories: DEFAULT_CATEGORIES,
  socialLinks: [
    { id: 'soc_fb', label: 'صفحتنا على فيسبوك', url: 'https://facebook.com' },
    { id: 'soc_tg', label: 'قناتنا على تليجرام', url: 'https://t.me' }
  ],
  checkoutFields: [
    { id: 'teacherName', label: 'اسم المعلم (كما سيُطبع على المذكرة)', type: 'text', placeholder: 'أ/ محمود...', options: '', required: true, enabled: true },
    { id: 'phone', label: 'رقم الواتساب للتواصل والتسليم', type: 'tel', placeholder: '010xxxxxxxx', options: '', required: true, enabled: true },
    { id: 'subject', label: 'المادة الدراسية / المسمى الوظيفي', type: 'text', placeholder: 'معلم أول لغة عربية...', options: '', required: false, enabled: true },
    { id: 'notes', label: 'ملاحظات إضافية للتصميم', type: 'textarea', placeholder: 'أي تفاصيل إضافية...', options: '', required: false, enabled: true }
  ],
  nextOrderReward: {
    enabled: true,
    discountPercent: 15,
    validDays: 7,
    prefix: 'VIP'
  }
};

const mergeAndNormalizeSettings = (base, incoming) => {
  if (!incoming || typeof incoming !== 'object') return base;
  const next = { ...base };

  const textKeys = [
    'platformName',
    'platformTagline',
    'primaryTheme',
    'heroBadge',
    'heroTitle',
    'heroSubtitle',
    'heroPrimaryBtnText',
    'heroSecondaryBtnText',
    'heroCustomBtnText',
    'promoText',
    'promoCouponCode',
    'promoBgColor',
    'promoTextColor',
    'whatsappNumber',
    'trustTitle',
    'whatsNewTitle',
    'whatsNewMode',
    'customBannerTitle',
    'customBannerSubtitle',
    'customBannerBtnText',
    'footerNote',
    'orderSuccessMessage'
  ];
  for (const k of textKeys) {
    if (incoming[k] !== undefined && incoming[k] !== null && String(incoming[k]).trim() !== '') {
      next[k] = safeText(incoming[k], base[k]);
    }
  }

  if (typeof incoming.promoEnabled === 'boolean') next.promoEnabled = incoming.promoEnabled;
  if (typeof incoming.showHeroCustomBtn === 'boolean') next.showHeroCustomBtn = incoming.showHeroCustomBtn;
  if (typeof incoming.customBannerEnabled === 'boolean') next.customBannerEnabled = incoming.customBannerEnabled;
  if (typeof incoming.whatsNewEnabled === 'boolean') next.whatsNewEnabled = incoming.whatsNewEnabled;
  if (typeof incoming.newsSectionEnabled === 'boolean') next.newsSectionEnabled = incoming.newsSectionEnabled;
  if (incoming.newsSectionTitle) next.newsSectionTitle = safeText(incoming.newsSectionTitle, base.newsSectionTitle);
  if (Array.isArray(incoming.newsItems)) next.newsItems = incoming.newsItems;
  if (typeof incoming.heroOverlayOpacity === 'number') next.heroOverlayOpacity = incoming.heroOverlayOpacity;
  if (typeof incoming.heroMinHeight === 'number') next.heroMinHeight = incoming.heroMinHeight;
  if (typeof incoming.whatsNewCount === 'number') next.whatsNewCount = incoming.whatsNewCount;
  if (Array.isArray(incoming.whatsNewIds)) next.whatsNewIds = incoming.whatsNewIds;

  const incomingLogo =
    extractImageFromValue(incoming.logoUrl) ||
    extractImageFromValue(incoming.logo) ||
    extractImageFromValue(incoming.siteLogo);
  if (incomingLogo) next.logoUrl = incomingLogo;

  const incomingHero =
    extractImageFromValue(incoming.heroBgImage) ||
    extractImageFromValue(incoming.heroImage) ||
    extractImageFromValue(incoming.bgImage) ||
    extractImageFromValue(incoming.bannerImage);
  if (incomingHero) next.heroBgImage = incomingHero;

  if (Array.isArray(incoming.trustPoints) && incoming.trustPoints.length > 0) {
    next.trustPoints = incoming.trustPoints.map((p) => safeText(p)).filter(Boolean);
  }

  if (Array.isArray(incoming.socialLinks) && incoming.socialLinks.length > 0) {
    next.socialLinks = incoming.socialLinks.map((s, idx) => ({
      id: safeText(s.id, `soc_${idx}`),
      label: safeText(s.label || s.name, 'رابط تواصل'),
      url: safeText(s.url || s.link, 'https://')
    }));
  }

  if (Array.isArray(incoming.checkoutFields) && incoming.checkoutFields.length > 0) {
    next.checkoutFields = incoming.checkoutFields;
  }

  if (incoming.nextOrderReward && typeof incoming.nextOrderReward === 'object') {
    next.nextOrderReward = { ...base.nextOrderReward, ...incoming.nextOrderReward };
  }

  const catImagesMap = incoming.categoryImages || incoming.catImages || {};
  if (Array.isArray(incoming.categories) && incoming.categories.length > 0) {
    next.categories = incoming.categories.map((cat, idx) => {
      const cid = safeText(cat.id, `cat_${idx}`);
      const existingCat = (base.categories || []).find((c) => c.id === cid) || (base.categories || [])[idx];
      const img =
        extractImageFromValue(cat.image) ||
        extractImageFromValue(cat.coverImage) ||
        extractImageFromValue(catImagesMap[cid]) ||
        (existingCat ? existingCat.image : '');
      const rawCatName = safeText(cat.name || cat.title || cat.label || cat.catName, '');
      const isGenericPlaceholder = /^قسم\s*\d+$/.test(rawCatName.trim());
      const finalCatName =
        rawCatName && !isGenericPlaceholder
          ? rawCatName
          : existingCat?.name || DEFAULT_CATEGORIES[idx]?.name || `قسم ${idx + 1}`;
      return {
        id: cid,
        name: finalCatName,
        browseMode: safeText(cat.browseMode, existingCat?.browseMode || 'hierarchy'),
        image: img,
        stages:
          Array.isArray(cat.stages) && cat.stages.length > 0
            ? cat.stages.map((st, sIdx) => ({
                id: safeText(st.id, `stg_${idx}_${sIdx}`),
                name: safeText(st.name || st.title || st.label, `مرحلة ${sIdx + 1}`),
                grades: Array.isArray(st.grades)
                  ? st.grades.map((gr, gIdx) => ({
                      id: safeText(gr.id, `grd_${idx}_${sIdx}_${gIdx}`),
                      name: safeText(gr.name || gr.title || gr.label, `صف ${gIdx + 1}`)
                    }))
                  : []
              }))
            : existingCat?.stages || []
      };
    });
  } else if (catImagesMap && typeof catImagesMap === 'object' && Object.keys(catImagesMap).length > 0) {
    next.categories = (next.categories || []).map((c) => ({
      ...c,
      image: extractImageFromValue(catImagesMap[c.id]) || c.image
    }));
  }

  return next;
};

const compressImageFile = (file, maxWidth = 1800, quality = 0.92) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const isCouponExpired = (coupon) => {
  if (!coupon || !coupon.expiresAt) return false;
  const expMs = toTimeMs(coupon.expiresAt);
  return expMs > 0 && Date.now() > expMs;
};

const formatExpiryAr = (expiresAt) => {
  if (!expiresAt) return '';
  const ms = toTimeMs(expiresAt);
  if (!ms) return '';
  try {
    return new Date(ms).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(expiresAt);
  }
};

// ============================================================================
// 3. حاجز الأمان لمنع توقف الواجهة عند أي خطأ غير متوقع
// ============================================================================
class PlatformErrorBoundary extends React.Component {
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
        <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-6 text-center shadow-lg space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-slate-900">تم استعادة الجلسة بأمان</h2>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">{this.state.errorMsg}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMsg: '' })}
              className="w-full py-3 rounded-2xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700"
            >
              إعادة عرض المنصة الآن
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 4. المكون الرئيسي للمنصة (MuzakkiratiApp)
// ============================================================================
function MuzakkiratiApp() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_SETTINGS_KEY);
      return saved ? mergeAndNormalizeSettings(DEFAULT_SETTINGS, JSON.parse(saved)) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const theme = THEME_PALETTES[settings.primaryTheme] || THEME_PALETTES.blue;

  const [notebooks, setNotebooks] = useState(() => {
    try {
      for (const k of LEGACY_NOTEBOOK_KEYS) {
        const saved = localStorage.getItem(k);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((n, idx) => normalizeNotebook(n, n?.id || `local_${idx}`));
          }
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [samplesMap, setSamplesMap] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_SAMPLES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [bundles, setBundles] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [orders, setOrders] = useState([]);

  const [activeView, setActiveView] = useState('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [previewPageIdx, setPreviewPageIdx] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const swipeStartXRef = useRef(null);

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [checkoutForm, setCheckoutForm] = useState({});
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackNotFound, setTrackNotFound] = useState(false);

  const [promoDismissed, setPromoDismissed] = useState(false);
  const [promoCopied, setPromoCopied] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [customRequestModalOpen, setCustomRequestModalOpen] = useState(false);
  const [customRequestForm, setCustomRequestForm] = useState({
    teacherName: '',
    phone: '',
    stageAndGrade: '',
    subject: '',
    details: ''
  });

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [previewAdminUnlocked, setPreviewAdminUnlocked] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState(ADMIN_EMAIL);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [customApiKeyInput, setCustomApiKeyInput] = useState(() => {
    try {
      return localStorage.getItem(LOCAL_API_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [toast, setToast] = useState(null);
  const logoClickCountRef = useRef(0);

  const isAdmin =
    (firebaseUser && firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) || previewAdminUnlocked;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
    } catch {
      // تجاهل
    }
  }, [cart]);

  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then((cred) => {
        if (cred?.user) {
          if (cred.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            setFirebaseUser(cred.user);
            setActiveView('admin');
            showToast('تم تسجيل الدخول السحابي بنجاح!');
          } else {
            signOut(auth).catch(() => {});
          }
        }
      })
      .catch(() => {});

    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user || null);
    });
    return () => unsub();
  }, []);

  // الطرق الثلاث للوصول إلى تسجيل دخول الإدارة (5 نقرات على الشعار + رابط ?admin=1 أو #admin + اختصار Ctrl+Shift+A)
  useEffect(() => {
    const checkUrlAdminTrigger = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('admin') === '1' || window.location.hash === '#admin') {
          if (isAdmin) setActiveView('admin');
          else setLoginModalOpen(true);
        }
      } catch {
        // تجاهل
      }
    };
    checkUrlAdminTrigger();
    window.addEventListener('hashchange', checkUrlAdminTrigger);

    const handleKeyShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'ش')) {
        e.preventDefault();
        if (isAdmin) setActiveView('admin');
        else setLoginModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyShortcut);
    return () => {
      window.removeEventListener('hashchange', checkUrlAdminTrigger);
      window.removeEventListener('keydown', handleKeyShortcut);
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!db) return;
    const unsubscribers = [];
    const handleSnapError = (err) => {
      console.warn('Snapshot warning:', err?.code || err?.message);
    };

    try {
      unsubscribers.push(
        onSnapshot(
          publicCol('settings'),
          (snap) => {
            if (!snap.empty) {
              setSettings((prev) => {
                let merged = { ...prev };
                snap.docs.forEach((d) => {
                  merged = mergeAndNormalizeSettings(merged, d.data());
                });
                try {
                  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(merged));
                } catch {
                  // تجاهل
                }
                return merged;
              });
            }
          },
          handleSnapError
        )
      );

      unsubscribers.push(
        onSnapshot(
          publicCol('config'),
          (snap) => {
            if (!snap.empty) {
              setSettings((prev) => {
                let merged = { ...prev };
                snap.docs.forEach((d) => {
                  const rawCfg = d.data() || {};
                  // ندمج الوسائط والبيانات من config دون استبدال الأقسام إذا كانت settings أحدث
                  const safeCfg = { ...rawCfg };
                  if (prev.updatedAt && rawCfg.updatedAt && toTimeMs(prev.updatedAt) > toTimeMs(rawCfg.updatedAt)) {
                    delete safeCfg.categories;
                  }
                  merged = mergeAndNormalizeSettings(merged, safeCfg);
                });
                try {
                  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(merged));
                } catch {
                  // تجاهل
                }
                return merged;
              });
            }
          },
          handleSnapError
        )
      );

      unsubscribers.push(
        onSnapshot(
          publicCol('notebooks'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => normalizeNotebook({ ...d.data(), id: d.id }, d.id));
              setNotebooks((prev) => {
                const map = new Map();
                prev.forEach((item) => map.set(item.id, item));
                list.forEach((item) => map.set(item.id, item));
                const merged = Array.from(map.values());
                try {
                  localStorage.setItem(LOCAL_NOTEBOOKS_KEY, JSON.stringify(merged));
                } catch {
                  // تجاهل
                }
                return merged;
              });
            }
          },
          handleSnapError
        )
      );

      // لا يتم تحميل مجموعة notebook_samples الضخمة عند فتح الصفحة الرئيسية لتسريع التحميل 10 أضعاف،
      // بل تُجلب صور عينات المذكرة عند الطلب فقط عند فتح نافذة معاينتها أو تعديلها.
      (async () => {
        const extraNotebookSources = [
          () => getDocs(legacyPublicCol('notebooks')),
          () => getDocs(collection(db, 'notebooks'))
        ];
        for (const fetchFn of extraNotebookSources) {
          try {
            const extraNbSnap = await fetchFn();
            if (!extraNbSnap.empty) {
              const extraList = extraNbSnap.docs.map((d) => normalizeNotebook({ ...d.data(), id: d.id }, d.id));
              setNotebooks((prev) => {
                const map = new Map();
                prev.forEach((item) => map.set(item.id, item));
                extraList.forEach((item) => {
                  if (!map.has(item.id)) map.set(item.id, item);
                });
                const merged = Array.from(map.values());
                try {
                  localStorage.setItem(LOCAL_NOTEBOOKS_KEY, JSON.stringify(merged));
                } catch {
                  // تجاهل
                }
                return merged;
              });
            }
          } catch {
            // تجاهل
          }
        }
      })();

      unsubscribers.push(
        onSnapshot(
          publicCol('bundles'),
          (snap) => {
            setBundles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          },
          handleSnapError
        )
      );

      unsubscribers.push(
        onSnapshot(
          publicCol('coupons'),
          (snap) => {
            setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          },
          handleSnapError
        )
      );

      unsubscribers.push(
        onSnapshot(
          publicCol('orders'),
          (snap) => {
            const list = snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .sort((a, b) => toTimeMs(b.createdAt) - toTimeMs(a.createdAt));
            setOrders(list);
          },
          handleSnapError
        )
      );
    } catch (e) {
      console.warn('Firestore setup warning:', e);
    }

    return () => {
      unsubscribers.forEach((u) => typeof u === 'function' && u());
    };
  }, []);

  const getNotebookSamples = (nb) => {
    if (!nb) return [];
    const direct = samplesMap[nb.id] || [];
    const prefixMatched = Object.entries(samplesMap)
      .filter(([k]) => k === nb.id || k.startsWith(`${nb.id}_`) || k.startsWith(`${nb.id}-`))
      .flatMap(([, arr]) => arr);
    const combined = Array.from(new Set([...direct, ...prefixMatched, ...(nb.inlineSamples || [])]));
    const filtered = combined.filter((img) => img && img !== nb.coverImage);
    return filtered.length > 0 ? filtered : nb.coverImage ? [nb.coverImage] : [];
  };

  useEffect(() => {
    if (!previewNotebook || !db) return;
    let cancelled = false;
    (async () => {
      const nbId = previewNotebook.id;
      const collected = [];
      const pushDocsImages = (docs) => {
        docs.forEach((d) => {
          const data = d.data() || {};
          const rawId = safeText(data.notebookId || data.nbId, d.id);
          const baseId = rawId.includes('_') ? rawId.split('_')[0] : rawId;
          if (baseId === nbId || d.id === nbId || d.id.startsWith(`${nbId}_`)) {
            extractAnyImagesFromDoc(data).forEach((im) => {
              if (!collected.includes(im)) collected.push(im);
            });
          }
        });
      };

      // 1. جلب سريع بالاستعلام المباشر لـ notebookId
      try {
        const qSnap = await getDocs(query(publicCol('notebook_samples'), where('notebookId', '==', nbId)));
        if (!cancelled && !qSnap.empty) pushDocsImages(qSnap.docs);
      } catch {
        // تجاهل
      }

      // 2. إن لم توجد بعد، فحص المجموعات الفرعية أو المستندات القديمة
      if (!cancelled && collected.length === 0) {
        const subPaths = [
          collection(db, 'artifacts', APP_ID, 'public', 'data', 'notebooks', nbId, 'samples'),
          collection(db, 'artifacts', APP_ID, 'public', 'data', 'notebooks', nbId, 'pages'),
          collection(db, 'artifacts', APP_ID, 'public', 'data', 'notebook_samples', nbId, 'pages'),
          publicCol('notebook_samples')
        ];
        for (const subCol of subPaths) {
          try {
            const subSnap = await getDocs(subCol);
            if (!cancelled && !subSnap.empty) {
              pushDocsImages(subSnap.docs);
              if (collected.length > 0) break;
            }
          } catch {
            // تجاهل
          }
        }
      }

      if (!cancelled && collected.length > 0) {
        setSamplesMap((prev) => {
          const updated = {
            ...prev,
            [nbId]: Array.from(new Set([...(prev[nbId] || []), ...collected]))
          };
          try {
            localStorage.setItem(LOCAL_SAMPLES_KEY, JSON.stringify(updated));
          } catch {
            // تجاهل
          }
          return updated;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewNotebook]);

  const visibleNotebooks = useMemo(() => {
    return [...notebooks]
      .filter((n) => !n.hidden)
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || toTimeMs(b.createdAt) - toTimeMs(a.createdAt));
  }, [notebooks]);

  const countNotebooksInCategory = (cat) => {
    if (!cat) return 0;
    const stageIds = new Set((cat.stages || []).map((s) => s.id));
    const gradeIds = new Set();
    (cat.stages || []).forEach((s) => (s.grades || []).forEach((g) => gradeIds.add(g.id)));
    const catNameNorm = safeText(cat.name).trim();
    return visibleNotebooks.filter((nb) => {
      if (nb.categoryId === cat.id || stageIds.has(nb.stageId) || gradeIds.has(nb.gradeId)) return true;
      if (!nb.categoryId && catNameNorm) {
        if (catNameNorm.includes('الأول') && /أول|الأول/.test(nb.term || nb.title)) return true;
        if (catNameNorm.includes('الثاني') && /ثاني|الثاني/.test(nb.term || nb.title)) return true;
        if (catNameNorm.includes('التأسيس') && /تأسيس|مراجع/.test(nb.term || nb.title)) return true;
      }
      return false;
    }).length;
  };

  const whatsNewNotebooks = useMemo(() => {
    if (!settings.whatsNewEnabled) return [];
    const count = Math.max(1, Number(settings.whatsNewCount || 4));
    if (settings.whatsNewMode === 'manual' && Array.isArray(settings.whatsNewIds) && settings.whatsNewIds.length > 0) {
      const idSet = new Set(settings.whatsNewIds);
      return visibleNotebooks.filter((n) => idSet.has(n.id)).slice(0, count);
    }
    return [...visibleNotebooks].sort((a, b) => toTimeMs(b.createdAt) - toTimeMs(a.createdAt)).slice(0, count);
  }, [visibleNotebooks, settings.whatsNewEnabled, settings.whatsNewMode, settings.whatsNewCount, settings.whatsNewIds]);

  const selectedCategoryObj = useMemo(
    () => (settings.categories || []).find((c) => c.id === selectedCategoryId) || null,
    [settings.categories, selectedCategoryId]
  );

  const filteredNotebooks = useMemo(() => {
    return visibleNotebooks.filter((nb) => {
      if (selectedCategoryId) {
        const stageIds = new Set((selectedCategoryObj?.stages || []).map((s) => s.id));
        const gradeIds = new Set();
        (selectedCategoryObj?.stages || []).forEach((s) => (s.grades || []).forEach((g) => gradeIds.add(g.id)));
        if (nb.categoryId !== selectedCategoryId && !stageIds.has(nb.stageId) && !gradeIds.has(nb.gradeId)) {
          return false;
        }
      }
      if (selectedStageId) {
        const stg = (selectedCategoryObj?.stages || []).find((s) => s.id === selectedStageId);
        const gradeIds = new Set((stg?.grades || []).map((g) => g.id));
        if (nb.stageId !== selectedStageId && !gradeIds.has(nb.gradeId)) return false;
      }
      if (selectedGradeId && nb.gradeId !== selectedGradeId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${nb.title} ${nb.subtitle} ${nb.subject} ${nb.term}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visibleNotebooks, selectedCategoryId, selectedCategoryObj, selectedStageId, selectedGradeId, searchQuery]);

  // دوال السلة
  const addNotebookToCart = (nb) => {
    setCart((prev) => {
      if (prev.some((item) => item.type === 'notebook' && item.id === nb.id)) {
        showToast('المذكرة مضافة بالفعل في سلة الطلبات', 'info');
        return prev;
      }
      showToast(`تمت إضافة «${nb.title}» إلى السلة`);
      return [
        ...prev,
        {
          type: 'notebook',
          id: nb.id,
          title: nb.title,
          price: Number(nb.price || 0),
          coverImage: nb.coverImage || ''
        }
      ];
    });
  };

  const addBundleToCart = (bundle) => {
    setCart((prev) => {
      if (prev.some((item) => item.type === 'bundle' && item.id === bundle.id)) {
        showToast('الباقة مضافة بالفعل في السلة', 'info');
        return prev;
      }
      showToast(`تمت إضافة باقة «${bundle.title}» إلى السلة`);
      return [
        ...prev,
        {
          type: 'bundle',
          id: bundle.id,
          title: bundle.title,
          price: Number(bundle.price || 0),
          coverImage: ''
        }
      ];
    });
  };

  const removeFromCart = (idx) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + Number(item.price || 0), 0), [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon || isCouponExpired(appliedCoupon)) return 0;
    if (appliedCoupon.type === 'fixed') {
      return Math.min(subtotal, Number(appliedCoupon.value || 0));
    }
    return Math.round((subtotal * Number(appliedCoupon.value || 0)) / 100);
  }, [appliedCoupon, subtotal]);

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = (codeOverride) => {
    const raw = (codeOverride !== undefined ? codeOverride : couponInput).trim().toUpperCase();
    setCouponError('');
    if (!raw) return;

    const found = coupons.find((c) => String(c.code || '').trim().toUpperCase() === raw && c.active !== false);
    if (!found) {
      setCouponError('كود الخصم غير صحيح أو غير مفعل.');
      return;
    }
    if (isCouponExpired(found)) {
      setCouponError(`عذرًا، انتهت مدة صلاحية هذا الكوبون في ${formatExpiryAr(found.expiresAt)}.`);
      return;
    }
    if (Number(found.minOrder || 0) > 0 && subtotal < Number(found.minOrder)) {
      setCouponError(`الحد الأدنى للطلب لاستخدام هذا الكوبون هو ${found.minOrder} ج.م.`);
      return;
    }
    setAppliedCoupon(found);
    setCouponInput(raw);
    showToast(`تم تطبيق كود الخصم (${raw}) بنجاح!`);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmittingOrder(true);
    try {
      const orderCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      let rewardCoupon = null;
      if (settings.nextOrderReward?.enabled) {
        const rewardCode = `${settings.nextOrderReward.prefix || 'VIP'}${Math.floor(1000 + Math.random() * 9000)}`;
        const validDays = Number(settings.nextOrderReward.validDays || 0);
        const expiresAt = validDays > 0 ? new Date(Date.now() + validDays * 86400000).toISOString() : '';
        rewardCoupon = {
          code: rewardCode,
          type: 'percent',
          value: Number(settings.nextOrderReward.discountPercent || 15),
          active: true,
          expiresAt,
          note: `مكافأة العميل عن الطلب ${orderCode}`
        };
        if (db) {
          try {
            await addDoc(publicCol('coupons'), { ...rewardCoupon, createdAt: serverTimestamp() });
          } catch {
            // تجاهل
          }
        }
      }

      const newOrder = {
        orderCode,
        customer: checkoutForm,
        items: cart,
        subtotal,
        discountAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        total: finalTotal,
        status: 'pending',
        rewardCoupon,
        createdAt: new Date().toISOString()
      };

      if (db) {
        try {
          await addDoc(publicCol('orders'), { ...newOrder, createdAt: serverTimestamp() });
        } catch {
          // تجاهل
        }
      }

      setCompletedOrder(newOrder);
      setCart([]);
      setAppliedCoupon(null);
      setCouponInput('');

      const itemsLines = newOrder.items.map((it, i) => `${i + 1}. ${it.title} (${it.price} ج.م)`).join('\n');
      const customerLines = Object.entries(checkoutForm)
        .filter(([, v]) => String(v || '').trim() !== '')
        .map(([k, v]) => `• ${k}: ${v}`)
        .join('\n');
      const waMsg = encodeURIComponent(
        `السلام عليكم، أرغب في تأكيد طلبي من ${settings.platformName}\n` +
          `رقم الطلب: ${orderCode}\n` +
          `---\n` +
          `المذكرات المطلوبة:\n${itemsLines}\n` +
          `---\n` +
          `الإجمالي النهائي: ${finalTotal} ج.م\n` +
          `بيانات المعلم:\n${customerLines}`
      );
      const waPhone = String(settings.whatsappNumber || '').replace(/[^\d]/g, '');
      if (waPhone) {
        window.open(`https://wa.me/${waPhone}?text=${waMsg}`, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleTrackOrder = (e) => {
    e.preventDefault();
    const q = trackQuery.trim().toUpperCase();
    if (!q) return;
    const found = orders.find(
      (o) =>
        String(o.orderCode || '').toUpperCase() === q ||
        JSON.stringify(o.customer || {}).includes(trackQuery.trim())
    );
    if (found) {
      setTrackedOrder(found);
      setTrackNotFound(false);
    } else {
      setTrackedOrder(null);
      setTrackNotFound(true);
    }
  };

  const handleAdminEmailLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const cleanKey = normalizeApiKey(customApiKeyInput);
      if (cleanKey) {
        try {
          localStorage.setItem(LOCAL_API_KEY_STORAGE, cleanKey);
        } catch {
          // تجاهل
        }
        initFirebaseServices(cleanKey);
      }
      if (!auth) throw new Error('لم يتم تهيئة Firebase Auth');
      const cred = await signInWithEmailAndPassword(auth, adminEmailInput.trim(), adminPassInput);
      if (cred.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        setLoginError('هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.');
      } else {
        setFirebaseUser(cred.user);
        setPreviewAdminUnlocked(false);
        setLoginModalOpen(false);
        setActiveView('admin');
        showToast('تم الاتصال بالسحابة بالحساب الإداري بنجاح!');
      }
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key') {
        setLoginError(
          'يرجى لصق مفتاح Web API Key الخاص بمشروعك من Firebase Console -> Project Settings في الخانة المخصصة بالأسفل لمرة واحدة.'
        );
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setLoginError('كلمة المرور غير صحيحة في Firebase. جرب «دخول سريع بحساب Google الإداري» بالأسفل.');
      } else if (code === 'auth/operation-not-allowed') {
        setLoginError('طريقة الدخول بالبريد غير مفعلة في Firebase Authentication — استخدم زر Google بالأسفل.');
      } else {
        setLoginError(`تعذر تسجيل الدخول السحابي: ${code || err?.message}`);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      const cleanKey = normalizeApiKey(customApiKeyInput);
      if (cleanKey) {
        try {
          localStorage.setItem(LOCAL_API_KEY_STORAGE, cleanKey);
        } catch {
          // تجاهل
        }
        initFirebaseServices(cleanKey);
      }
      if (!auth) throw new Error('لم يتم تهيئة Firebase Auth');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
      if (isMobileDevice) {
        await signInWithRedirect(auth, provider);
        return;
      }
      const cred = await signInWithPopup(auth, provider);
      if (cred.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        setLoginError(`الحساب (${cred.user?.email}) غير مصرح له. يرجى اختيار (${ADMIN_EMAIL}).`);
      } else {
        setFirebaseUser(cred.user);
        setPreviewAdminUnlocked(false);
        setLoginModalOpen(false);
        setActiveView('admin');
        showToast('تم تسجيل الدخول السحابي بحساب Google الإداري بنجاح!');
      }
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key') {
        setLoginError(
          'يرجى لصق مفتاح Web API Key الخاص بمشروعك من Firebase Console -> Project Settings في الخانة المخصصة بالأسفل لمرة واحدة.'
        );
      } else if (code === 'auth/unauthorized-domain') {
        setLoginError(
          `نطاق الموقع (${window.location.hostname}) غير مضاف في Firebase Console -> Authentication -> Settings -> Authorized domains.`
        );
      } else if (code === 'auth/operation-not-allowed') {
        setLoginError('يرجى تفعيل موفر Google في Firebase Console -> Authentication -> Sign-in method.');
      } else {
        setLoginError(`تعذر الدخول عبر Google: ${code || err?.message}`);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    setPreviewAdminUnlocked(false);
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        // تجاهل
      }
    }
    setActiveView('home');
    showToast('تم تسجيل الخروج من لوحة الإدارة', 'info');
  };

  const activeCoupons = useMemo(() => coupons.filter((c) => c.active !== false && !isCouponExpired(c)), [coupons]);

  return (
    <div dir="rtl" className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* إشعار Toast */}
      {toast && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black shadow-2xl border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* الشريط الترويجي العلوي */}
      {settings.promoEnabled && !promoDismissed && (
        <div
          style={{
            backgroundColor: settings.promoBgColor || '#0f172a',
            color: settings.promoTextColor || '#fde047'
          }}
          className="border-b border-black/15 px-3 py-2.5 text-xs sm:text-sm font-bold transition-colors"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 text-center">
            <span className="inline-flex items-center gap-1.5 font-black">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{settings.promoText}</span>
            </span>
            {settings.promoCouponCode && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(settings.promoCouponCode);
                  setPromoCopied(true);
                  setTimeout(() => setPromoCopied(false), 2000);
                  showToast(`تم نسخ الكوبون: ${settings.promoCouponCode}`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-black transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>الكوبون: {settings.promoCouponCode}</span>
                {promoCopied && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveView('offers')}
              className="px-3 py-1 rounded-lg bg-white text-slate-950 text-xs font-black hover:bg-slate-100 shadow-xs transition"
            >
              تصفح العروض ←
            </button>
            <button
              type="button"
              onClick={() => setPromoDismissed(true)}
              className="p-1 opacity-75 hover:opacity-100"
              aria-label="إغلاق الشريط"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* الهيدر الرئيسي المدمج والمتجاوب للهاتف والكمبيوتر */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          {/* الشعار واسم المنصة */}
          <button
            type="button"
            onClick={() => {
              setActiveView('home');
              logoClickCountRef.current += 1;
              if (logoClickCountRef.current >= 5) {
                logoClickCountRef.current = 0;
                if (isAdmin) setActiveView('admin');
                else setLoginModalOpen(true);
              }
            }}
            className="flex items-center gap-2.5 text-right group min-w-0 flex-1 md:flex-initial"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.platformName}
                className="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className={`w-10 h-10 sm:w-13 sm:h-13 rounded-2xl ${theme.primaryBtn} flex items-center justify-center shadow-md shrink-0`}>
                <BookOpen className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm sm:text-xl font-black text-slate-900 tracking-tight leading-snug truncate">
                {settings.platformName}
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 mt-0.5 truncate">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" />
                <span className="truncate">{settings.platformTagline}</span>
              </div>
            </div>
          </button>

          {/* روابط التنقل لسطح المكتب */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl shrink-0">
            {[
              { id: 'home', label: 'الرئيسية', icon: Sparkles },
              { id: 'library', label: 'المذكرات', icon: BookOpen },
              { id: 'offers', label: 'العروض والباقات', icon: Percent },
              { id: 'track', label: 'تتبع طلبك', icon: Package }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                    active ? `${theme.primaryBtn} shadow-sm` : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* أزرار السلة والتواصل والإدارة */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 text-xs sm:text-sm font-black text-slate-800 transition"
            >
              <ShoppingCart className={`w-4 h-4 ${theme.primaryText}`} />
              <span className="hidden sm:inline">السلة</span>
              {cart.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full ${theme.primaryBtn} text-[11px] font-black`}>
                  {cart.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-sm transition"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">تواصل</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveView(activeView === 'admin' ? 'home' : 'admin')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs sm:text-sm font-black transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{activeView === 'admin' ? 'الزوار' : 'الإدارة'}</span>
              </button>
            )}
          </div>
        </div>

        {/* شريط التنقل المدمج للهواتف والأجهزة اللوحية */}
        <div className="lg:hidden border-t border-slate-100 px-1.5 py-1.5 grid grid-cols-4 gap-1 bg-slate-50/95">
          {[
            { id: 'home', label: 'الرئيسية', icon: Sparkles },
            { id: 'library', label: 'المذكرات', icon: BookOpen },
            { id: 'offers', label: 'العروض', icon: Percent },
            { id: 'track', label: 'تتبع طلبك', icon: Package }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black transition truncate ${
                  active ? theme.primaryBtn : 'text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 5. محتوى الصفحات */}
      {/* ==================================================================== */}
      <main>
        {/* الصفحة الرئيسية */}
        {activeView === 'home' && (
          <div>
            {/* قسم الواجهة Hero */}
            <section
              style={{ minHeight: `${settings.heroMinHeight || 460}px` }}
              className="relative overflow-hidden bg-slate-950 text-white flex items-center py-12 sm:py-16 px-4 sm:px-6"
            >
              {settings.heroBgImage && (
                <img
                  src={settings.heroBgImage}
                  alt="خلفية المنصة"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div
                style={{ opacity: (settings.heroOverlayOpacity ?? 78) / 100 }}
                className={`absolute inset-0 bg-gradient-to-l ${theme.heroGradient}`}
              />

              <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{settings.heroBadge}</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight">{settings.heroTitle}</h1>
                  <p className="text-sm sm:text-base text-slate-200/90 font-bold leading-relaxed max-w-2xl">
                    {settings.heroSubtitle}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId('');
                        setSelectedStageId('');
                        setSelectedGradeId('');
                        setActiveView('library');
                      }}
                      className={`px-6 py-3.5 rounded-2xl ${theme.primaryBtn} text-xs sm:text-sm font-black shadow-lg transition`}
                    >
                      {settings.heroPrimaryBtnText || 'تصفح مكتبة المذكرات'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('offers')}
                      className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-black backdrop-blur-sm transition"
                    >
                      {settings.heroSecondaryBtnText || 'باقات التوفير والخصومات'}
                    </button>
                    {settings.showHeroCustomBtn !== false && (
                      <button
                        type="button"
                        onClick={() => setCustomRequestModalOpen(true)}
                        className="px-5 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black transition"
                      >
                        {settings.heroCustomBtnText || 'اطلب إعداد مذكرة خاصة'}
                      </button>
                    )}
                  </div>
                </div>

                {/* بطاقة لماذا يثق بنا المعلمون */}
                <div className="lg:col-span-5">
                  <div className="rounded-3xl bg-slate-900/80 backdrop-blur-md border border-white/15 p-5 sm:p-6 shadow-2xl space-y-4">
                    <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <span>{settings.trustTitle}</span>
                    </div>
                    <ul className="space-y-3">
                      {(settings.trustPoints || []).map((pt, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-100 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* الأقسام الرئيسية للمذكرات والكورسات */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-6">
              <div className="text-center space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">الأقسام الرئيسية للمذكرات والكورسات</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-bold">
                  اختر القسم المناسب لتصفح مجلدات المراحل والصفوف الدراسية
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(settings.categories || []).map((cat) => {
                  const count = countNotebooksInCategory(cat);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSelectedStageId('');
                        setSelectedGradeId('');
                        setActiveView('library');
                      }}
                      className={`group text-right bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl ${theme.accentBorder} transition flex flex-col`}
                    >
                      <div className={`relative h-44 w-full bg-gradient-to-br ${theme.cardGradient} flex items-center justify-center overflow-hidden`}>
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <BookOpen className="w-12 h-12 text-white/80" />
                        )}
                        <span className="absolute top-3 left-3 px-3.5 py-1.5 rounded-full bg-slate-950/85 text-white text-xs font-black backdrop-blur-sm">
                          {count} مذكرة متاحة
                        </span>
                      </div>
                      <div className="p-4 sm:p-5 flex items-center justify-between gap-2 w-full">
                        <div>
                          <h3 className={`font-black text-slate-900 text-base sm:text-lg group-hover:${theme.primaryText}`}>
                            {cat.name}
                          </h3>
                          <p className={`text-xs sm:text-sm ${theme.primaryText} font-bold mt-1`}>
                            {cat.browseMode === 'direct' ? 'عرض جميع المذكرات مباشرة' : 'تصفح المراحل والصفوف الدراسية'}
                          </p>
                        </div>
                        <ArrowLeft className={`w-5 h-5 ${theme.primaryText} group-hover:-translate-x-1 transition shrink-0`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* قسم ما الجديد */}
            {settings.whatsNewEnabled && whatsNewNotebooks.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full border text-[11px] font-black mb-1 ${theme.primarySoft}`}>
                      إصدارات حديثة
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{settings.whatsNewTitle}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView('library')}
                    className={`text-xs font-black ${theme.primaryText} flex items-center gap-1`}
                  >
                    <span>عرض الكل</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {whatsNewNotebooks.map((nb) => (
                    <NotebookCard
                      key={nb.id}
                      nb={nb}
                      theme={theme}
                      onPreview={() => {
                        setPreviewNotebook(nb);
                        setPreviewPageIdx(0);
                        setPreviewZoom(1);
                        setPreviewFullscreen(false);
                      }}
                      onAdd={() => addNotebookToCart(nb)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* قسم أخبار المنصة ومذكرات قيد التجهيز */}
            {settings.newsSectionEnabled && (settings.newsItems || []).length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 space-y-6">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black mb-1">
                    تحديثات وإصدارات قادمة
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">{settings.newsSectionTitle}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(settings.newsItems || []).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-3 py-1 rounded-full border text-[11px] font-black ${theme.primarySoft}`}>
                            {item.badge || 'خبر جديد'}
                          </span>
                          {item.date && <span className="text-[11px] text-slate-400 font-bold">{item.date}</span>}
                        </div>
                        <h3 className="font-black text-slate-900 text-sm sm:text-base">{item.title}</h3>
                        <p className="text-xs text-slate-600 font-bold leading-relaxed">{item.summary}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomRequestModalOpen(true)}
                        className={`self-start text-xs font-black ${theme.primaryText} flex items-center gap-1 pt-1`}
                      >
                        <span>احجز نسختك أو استفسر الآن</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* بنر طلب مذكرة بتصميم خاص */}
            {settings.customBannerEnabled !== false && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
                <div className={`rounded-3xl bg-gradient-to-l ${theme.heroGradient} text-white p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl`}>
                  <div className="space-y-2 text-center md:text-right">
                    <h3 className="text-xl sm:text-2xl font-black">{settings.customBannerTitle}</h3>
                    <p className="text-xs sm:text-sm text-slate-200 font-bold max-w-2xl">{settings.customBannerSubtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomRequestModalOpen(true)}
                    className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black shrink-0 shadow-lg transition"
                  >
                    {settings.customBannerBtnText || 'اطلب مذكرة مخصصة الآن'}
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {/* صفحة مكتبة المذكرات */}
        {activeView === 'library' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900">مكتبة المذكرات الدراسية</h2>
                  <p className="text-xs text-slate-500 font-bold">
                    تصفح المذكرات حسب القسم والمرحلة والصف أو ابحث باسم المادة
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن مذكرة أو مادة..."
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setSelectedStageId('');
                    setSelectedGradeId('');
                  }}
                  className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black"
                >
                  <option value="">جميع الأقسام الرئيسية</option>
                  {(settings.categories || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStageId}
                  onChange={(e) => {
                    setSelectedStageId(e.target.value);
                    setSelectedGradeId('');
                  }}
                  disabled={!selectedCategoryId || selectedCategoryObj?.browseMode === 'direct'}
                  className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black disabled:opacity-50"
                >
                  <option value="">جميع المراحل الدراسية</option>
                  {(selectedCategoryObj?.stages || []).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedGradeId}
                  onChange={(e) => setSelectedGradeId(e.target.value)}
                  disabled={!selectedStageId || selectedCategoryObj?.browseMode === 'direct'}
                  className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black disabled:opacity-50"
                >
                  <option value="">جميع الصفوف الدراسية</option>
                  {(
                    (selectedCategoryObj?.stages || []).find((s) => s.id === selectedStageId)?.grades || []
                  ).map((gr) => (
                    <option key={gr.id} value={gr.id}>
                      {gr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredNotebooks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-black text-slate-800 text-base">لا توجد مذكرات مطابقة لبحثك حاليًا</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('');
                    setSelectedStageId('');
                    setSelectedGradeId('');
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 rounded-xl ${theme.primaryBtn} text-xs font-black`}
                >
                  عرض جميع المذكرات
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredNotebooks.map((nb) => (
                  <NotebookCard
                    key={nb.id}
                    nb={nb}
                    theme={theme}
                    onPreview={() => {
                      setPreviewNotebook(nb);
                      setPreviewPageIdx(0);
                      setPreviewZoom(1);
                      setPreviewFullscreen(false);
                    }}
                    onAdd={() => addNotebookToCart(nb)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* صفحة العروض والباقات */}
        {activeView === 'offers' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Tag className={`w-5 h-5 ${theme.primaryText}`} />
                <span>كوبونات الخصم المتاحة حاليًا</span>
              </h2>
              {activeCoupons.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 text-xs font-bold text-slate-500">
                  لا توجد كوبونات خصم نشطة في الوقت الحالي.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeCoupons.map((cp) => (
                    <div
                      key={cp.id}
                      className="bg-white rounded-3xl border-2 border-dashed border-blue-300 p-5 flex flex-col justify-between gap-3 shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-xl border font-black text-sm tracking-wider ${theme.primarySoft}`}>
                            {cp.code}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                            خصم {cp.value} {cp.type === 'fixed' ? 'ج.م' : '%'}
                          </span>
                        </div>
                        {cp.note && <p className="text-xs text-slate-600 font-bold pt-1">{cp.note}</p>}
                        {Number(cp.minOrder || 0) > 0 && (
                          <p className="text-[11px] text-slate-500 font-bold">الحد الأدنى للطلب: {cp.minOrder} ج.م</p>
                        )}
                        {cp.expiresAt && (
                          <p className="text-[11px] text-amber-700 font-black flex items-center gap-1 pt-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>ينتهي في: {formatExpiryAr(cp.expiresAt)}</span>
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(cp.code);
                          setCouponInput(cp.code);
                          showToast(`تم نسخ الكوبون ${cp.code}`);
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-black transition flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ كود الخصم</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>باقات التوفير الشاملة للمعلمين</span>
              </h2>
              {bundles.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 text-xs font-bold text-slate-500">
                  سيتم إضافة باقات التوفير قريبًا.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {bundles.map((b) => {
                    const includedNbs = (b.notebookIds || [])
                      .map((id) => notebooks.find((n) => n.id === id))
                      .filter(Boolean);
                    return (
                      <div
                        key={b.id}
                        className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between gap-4 shadow-sm"
                      >
                        <div className="space-y-2">
                          <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black">
                            باقة توفير مميزة
                          </span>
                          <h3 className="text-base font-black text-slate-900">{b.title}</h3>
                          {b.description && <p className="text-xs text-slate-600 font-bold leading-relaxed">{b.description}</p>}
                          {includedNbs.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <div className="text-[11px] font-black text-slate-500">تشمل المذكرات التالية:</div>
                              <ul className="space-y-1">
                                {includedNbs.map((itemNb) => (
                                  <li key={itemNb.id} className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>{itemNb.title}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className={`text-lg font-black ${theme.primaryText}`}>{b.price} ج.م</span>
                            {Number(b.oldPrice) > Number(b.price) && (
                              <span className="text-xs text-slate-400 line-through mr-2 font-bold">{b.oldPrice} ج.م</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => addBundleToCart(b)}
                            className={`px-4 py-2.5 rounded-xl ${theme.primaryBtn} text-xs font-black`}
                          >
                            إضافة الباقة
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* صفحة تتبع الطلب */}
        {activeView === 'track' && (
          <section className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="text-center space-y-1.5">
                <div className={`w-12 h-12 rounded-2xl border ${theme.primarySoft} flex items-center justify-center mx-auto`}>
                  <Package className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900">تتبع حالة طلبك</h2>
                <p className="text-xs text-slate-500 font-bold">
                  أدخل رقم الطلب (مثال: ORD-123456) أو رقم هاتفك المسجل في الطلب
                </p>
              </div>

              <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="رقم الطلب أو رقم الهاتف..."
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs font-black"
                />
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-2xl ${theme.primaryBtn} text-xs font-black`}
                >
                  بحث عن الطلب
                </button>
              </form>

              {trackNotFound && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                  لم يتم العثور على طلب مطابق لهذا الرقم. تأكد من الرقم أو تواصل معنا عبر واتساب.
                </div>
              )}

              {trackedOrder && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`font-black ${theme.primaryText} text-sm`}>{trackedOrder.orderCode}</span>
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                      {trackedOrder.status === 'completed'
                        ? 'تم التسليم'
                        : trackedOrder.status === 'processing'
                        ? 'جاري تجهيز المذكرة باسمك'
                        : 'قيد المراجعة والتأكيد'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-bold space-y-1">
                    <div>الإجمالي: {trackedOrder.total} ج.م</div>
                    <div>عدد العناصر: {(trackedOrder.items || []).length}</div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* لوحة تحكم الإدارة */}
        {activeView === 'admin' && isAdmin && (
          <AdminDashboard
            settings={settings}
            setSettings={setSettings}
            notebooks={notebooks}
            samplesMap={samplesMap}
            setSamplesMap={setSamplesMap}
            bundles={bundles}
            coupons={coupons}
            orders={orders}
            showToast={showToast}
            onLogout={handleAdminLogout}
          />
        )}
      </main>

      {/* ==================================================================== */}
      {/* 6. نوافذ المعاينة، السلة، تسجيل الدخول، والتواصل */}
      {/* ==================================================================== */}
      {previewNotebook && (
        <div
          className={`fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center ${
            previewFullscreen ? 'p-0' : 'p-2 sm:p-5'
          }`}
        >
          <div
            className={`bg-white flex flex-col shadow-2xl border border-slate-200 overflow-hidden transition-all ${
              previewFullscreen
                ? 'w-screen h-screen rounded-none'
                : 'rounded-3xl max-w-5xl w-full max-h-[94vh]'
            }`}
          >
            {/* رأس نافذة المعاينة + شريط التكبير وملء الشاشة */}
            <div className="bg-white px-4 sm:px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-slate-900 text-base sm:text-lg truncate">{previewNotebook.title}</h3>
                {previewNotebook.subtitle && (
                  <p className="text-xs text-slate-500 font-bold truncate">{previewNotebook.subtitle}</p>
                )}
              </div>

              {/* أدوات التكبير والشاشة الكاملة */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                  title="تصغير"
                  className="p-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 shadow-xs"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2.5 text-xs font-black text-slate-800 min-w-[52px] text-center">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.min(2.75, +(z + 0.25).toFixed(2)))}
                  title="تكبير"
                  className="p-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 shadow-xs"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {previewZoom !== 1 && (
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(1)}
                    title="إعادة الحجم الطبيعي"
                    className="p-2 rounded-xl bg-white hover:bg-amber-50 text-amber-700 shadow-xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewFullscreen((f) => !f)}
                  title={previewFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة الكاملة'}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-blue-600 text-xs font-black flex items-center gap-1.5 transition"
                >
                  {previewFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  <span className="hidden sm:inline">{previewFullscreen ? 'تصغير النافذة' : 'ملء الشاشة'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPreviewNotebook(null);
                  setPreviewFullscreen(false);
                  setPreviewZoom(1);
                }}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* جسم المعاينة القابل للتمرير والتبديل بالسحب */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {previewNotebook.noticeText && previewNotebook.noticePosition !== 'bottom' && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{previewNotebook.noticeText}</span>
                </div>
              )}

              {(() => {
                const pages = getNotebookSamples(previewNotebook);
                const safeIdx = Math.min(previewPageIdx, Math.max(0, pages.length - 1));
                const currentImg = pages[safeIdx] || pages[0] || '';
                const goPrevPage = () => {
                  setPreviewZoom(1);
                  setPreviewPageIdx((i) => (i > 0 ? i - 1 : pages.length - 1));
                };
                const goNextPage = () => {
                  setPreviewZoom(1);
                  setPreviewPageIdx((i) => (i < pages.length - 1 ? i + 1 : 0));
                };
                return (
                  <div className="space-y-3">
                    <div
                      onTouchStart={(e) => {
                        if (previewZoom === 1 && e.touches?.[0]) {
                          swipeStartXRef.current = e.touches[0].clientX;
                        }
                      }}
                      onTouchEnd={(e) => {
                        if (previewZoom !== 1 || swipeStartXRef.current === null || pages.length <= 1) return;
                        const endX = e.changedTouches?.[0]?.clientX ?? swipeStartXRef.current;
                        const deltaX = endX - swipeStartXRef.current;
                        swipeStartXRef.current = null;
                        if (Math.abs(deltaX) > 45) {
                          if (deltaX > 0) goNextPage();
                          else goPrevPage();
                        }
                      }}
                      className="relative bg-slate-900/5 rounded-2xl border border-slate-200 overflow-auto flex items-center justify-center min-h-[360px] sm:min-h-[480px] max-h-[68vh] select-none"
                    >
                      {currentImg ? (
                        <div className="p-3 flex items-center justify-center min-w-full min-h-full">
                          <img
                            src={currentImg}
                            alt={`عينة ${safeIdx + 1}`}
                            draggable={false}
                            onDoubleClick={() => setPreviewZoom((z) => (z > 1 ? 1 : 1.75))}
                            style={{
                              transform: `scale(${previewZoom})`,
                              transformOrigin: 'top center'
                            }}
                            className="max-h-[64vh] w-auto object-contain rounded-lg shadow-md transition-transform duration-200 cursor-zoom-in"
                          />
                        </div>
                      ) : (
                        <div className="text-center p-8 text-slate-400 space-y-2">
                          <BookOpen className="w-12 h-12 mx-auto" />
                          <p className="text-sm font-bold">لا توجد صور عينة مرفوعة لهذه المذكرة حاليًا</p>
                        </div>
                      )}

                      {pages.length > 0 && (
                        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center pointer-events-none">
                          <span className="px-4 py-1.5 rounded-full bg-slate-900/85 text-white text-xs font-black backdrop-blur-sm shadow">
                            صفحة {safeIdx + 1} من {pages.length} {pages.length > 1 ? '• اسحب يمينًا أو يسارًا للتقليب' : ''}
                          </span>
                        </div>
                      )}

                      {pages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={goPrevPage}
                            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/95 shadow-lg border border-slate-200 text-slate-800 hover:bg-blue-600 hover:text-white transition"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={goNextPage}
                            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/95 shadow-lg border border-slate-200 text-slate-800 hover:bg-blue-600 hover:text-white transition"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>

                    {pages.length > 1 && (
                      <div className="flex items-center justify-center gap-2.5 overflow-x-auto py-1">
                        {pages.map((pg, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setPreviewZoom(1);
                              setPreviewPageIdx(idx);
                            }}
                            className={`w-16 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                              safeIdx === idx ? 'border-blue-600 scale-105 shadow' : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={pg} alt={`مصغرة ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {previewNotebook.noticeText && previewNotebook.noticePosition === 'bottom' && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{previewNotebook.noticeText}</span>
                </div>
              )}
            </div>

            {/* تذييل نافذة المعاينة */}
            <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className={`text-xl sm:text-2xl font-black ${theme.primaryText}`}>{previewNotebook.price} ج.م</span>
                {Number(previewNotebook.oldPrice) > Number(previewNotebook.price) && (
                  <span className="text-xs sm:text-sm text-slate-400 line-through font-bold">
                    {previewNotebook.oldPrice} ج.م
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {previewNotebook.driveUrl && (
                  <a
                    href={previewNotebook.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-xl bg-white border border-slate-300 hover:border-blue-500 text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5"
                  >
                    <ExternalLink className={`w-4 h-4 ${theme.primaryText}`} />
                    <span>معاينة PDF على Drive</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    addNotebookToCart(previewNotebook);
                    setPreviewNotebook(null);
                    setPreviewFullscreen(false);
                  }}
                  className={`px-6 py-3 rounded-xl ${theme.primaryBtn} text-xs sm:text-sm font-black flex items-center gap-2 shadow`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>أضف إلى السلة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة السلة وإتمام الطلب */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-5 sm:p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <ShoppingCart className={`w-5 h-5 ${theme.primaryText}`} />
                  <span>سلة الطلبات ({cart.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    setCompletedOrder(null);
                  }}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {completedOrder ? (
                <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-4 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-emerald-950 text-base">تم تسجيل طلبك بنجاح!</h4>
                  <p className="text-xs text-emerald-800 font-bold leading-relaxed">{settings.orderSuccessMessage}</p>
                  <p className="text-xs text-emerald-900 font-bold">
                    رقم تتبع الطلب: <span className="font-black underline">{completedOrder.orderCode}</span>
                  </p>
                  {completedOrder.rewardCoupon && (
                    <div className="p-3.5 rounded-2xl bg-white border border-emerald-300 text-xs space-y-1">
                      <div className="font-black text-blue-700">
                        هدية طلبك القادم: خصم {completedOrder.rewardCoupon.value}%
                      </div>
                      <div className="font-black text-base tracking-wider text-slate-900">
                        {completedOrder.rewardCoupon.code}
                      </div>
                      {completedOrder.rewardCoupon.expiresAt && (
                        <div className="text-[11px] text-amber-700 font-bold">
                          صالح حتى: {formatExpiryAr(completedOrder.rewardCoupon.expiresAt)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">سلة الطلبات فارغة حاليًا</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {cart.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-black text-slate-900">{item.title}</div>
                          <div className={`text-xs font-bold ${theme.primaryText} mt-0.5`}>{item.price} ج.م</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(idx)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* قسم الكوبون */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="أدخل كود الخصم..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black"
                      >
                        تطبيق
                      </button>
                    </div>
                    {couponError && <p className="text-xs font-bold text-rose-600">{couponError}</p>}
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-xs font-black text-emerald-700">
                        <span>
                          تم تطبيق الكوبون ({appliedCoupon.code}) — خصم {discountAmount} ج.م
                        </span>
                        <button
                          type="button"
                          onClick={() => setAppliedCoupon(null)}
                          className="text-rose-600 underline"
                        >
                          إزالة
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ملخص الإجمالي */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300 font-bold">
                      <span>المجموع الفرعي:</span>
                      <span>{subtotal} ج.م</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>الخصم:</span>
                        <span>- {discountAmount} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black pt-1.5 border-t border-slate-700">
                      <span>الإجمالي النهائي:</span>
                      <span className="text-amber-400">{finalTotal} ج.م</span>
                    </div>
                  </div>

                  {/* نموذج بيانات المعلم */}
                  <form onSubmit={handleSubmitOrder} className="space-y-3">
                    {(settings.checkoutFields || [])
                      .filter((f) => f.enabled !== false)
                      .map((f) => (
                        <div key={f.id}>
                          <label className="block text-xs font-black text-slate-700 mb-1">
                            {f.label} {f.required && <span className="text-rose-600">*</span>}
                          </label>
                          {f.type === 'textarea' ? (
                            <textarea
                              rows={2}
                              required={f.required}
                              placeholder={f.placeholder}
                              value={checkoutForm[f.label] || ''}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, [f.label]: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                            />
                          ) : f.type === 'select' ? (
                            <select
                              required={f.required}
                              value={checkoutForm[f.label] || ''}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, [f.label]: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                            >
                              <option value="">-- اختر --</option>
                              {String(f.options || '')
                                .split(/[,،]/)
                                .map((opt) => opt.trim())
                                .filter(Boolean)
                                .map((opt, oi) => (
                                  <option key={oi} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <input
                              type={f.type || 'text'}
                              required={f.required}
                              placeholder={f.placeholder}
                              value={checkoutForm[f.label] || ''}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, [f.label]: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                            />
                          )}
                        </div>
                      ))}

                    <button
                      type="submit"
                      disabled={submittingOrder}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{submittingOrder ? 'جاري تسجيل الطلب...' : 'تأكيد وإرسال تفاصيل الطلب على واتساب'}</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل دخول الإدارة */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl border ${theme.primarySoft} flex items-center justify-center`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">دخول لوحة تحكم الإدارة</h3>
                  <p className="text-[11px] text-slate-500 font-bold">مخصص لإدارة {settings.platformName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoginModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminEmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">البريد الإلكتروني الإداري</label>
                <input
                  type="email"
                  dir="ltr"
                  required
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    dir="ltr"
                    required
                    value={adminPassInput}
                    onChange={(e) => setAdminPassInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-blue-600"
                  >
                    {showPass ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>
              </div>

              {(!normalizeApiKey(customApiKeyInput) || loginError.includes('api-key')) && (
                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-1">
                    مفتاح Firebase Web API Key (يُحفظ في متصفحك لمرة واحدة فقط)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="AIzaSy..."
                    value={customApiKeyInput}
                    onChange={(e) => setCustomApiKeyInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-left"
                  />
                </div>
              )}

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className={`w-full py-3 rounded-xl ${theme.primaryBtn} text-xs font-black shadow`}
              >
                {loginLoading ? 'جاري التحقق...' : 'تسجيل الدخول للوحة التحكم'}
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <span className="bg-white px-3 text-[11px] text-slate-400 font-bold z-10">أو</span>
              <div className="absolute inset-x-0 h-px bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleAdminGoogleLogin}
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center gap-2 shadow"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>دخول سريع بحساب Google الإداري</span>
            </button>
          </div>
        </div>
      )}

      {/* نافذة تواصل معنا */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">تواصل مع فريق {settings.platformName}</h3>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 font-bold">
              يسعدنا الرد على استفساراتكم وتجهيز مذكراتكم بأعلى جودة وفي أسرع وقت.
            </p>
            <div className="space-y-2.5">
              {settings.whatsappNumber && (
                <a
                  href={`https://wa.me/${String(settings.whatsappNumber).replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>مراسلة مباشرة عبر واتساب</span>
                </a>
              )}
              {(settings.socialLinks || []).map((lnk) => (
                <a
                  key={lnk.id}
                  href={lnk.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-between"
                >
                  <span>{lnk.label}</span>
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* نافذة طلب مذكرة مخصصة */}
      {customRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">اطلب إعداد مذكرة خاصة باسمك</h3>
              <button
                type="button"
                onClick={() => setCustomRequestModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const msg = encodeURIComponent(
                  `طلب إعداد مذكرة مخصصة - ${settings.platformName}\n` +
                    `• اسم المعلم: ${customRequestForm.teacherName}\n` +
                    `• الهاتف: ${customRequestForm.phone}\n` +
                    `• المرحلة والصف: ${customRequestForm.stageAndGrade}\n` +
                    `• المادة: ${customRequestForm.subject}\n` +
                    `• التفاصيل: ${customRequestForm.details}`
                );
                const waPhone = String(settings.whatsappNumber || '').replace(/[^\d]/g, '');
                if (waPhone) window.open(`https://wa.me/${waPhone}?text=${msg}`, '_blank', 'noopener,noreferrer');
                setCustomRequestModalOpen(false);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                required
                placeholder="اسم المعلم"
                value={customRequestForm.teacherName}
                onChange={(e) => setCustomRequestForm({ ...customRequestForm, teacherName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="tel"
                required
                placeholder="رقم الواتساب"
                value={customRequestForm.phone}
                onChange={(e) => setCustomRequestForm({ ...customRequestForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="text"
                required
                placeholder="المرحلة والصف الدراسي"
                value={customRequestForm.stageAndGrade}
                onChange={(e) => setCustomRequestForm({ ...customRequestForm, stageAndGrade: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="text"
                required
                placeholder="المادة الدراسية"
                value={customRequestForm.subject}
                onChange={(e) => setCustomRequestForm({ ...customRequestForm, subject: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <textarea
                rows={3}
                placeholder="تفاصيل المذكرة المطلوبة..."
                value={customRequestForm.details}
                onChange={(e) => setCustomRequestForm({ ...customRequestForm, details: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
              >
                إرسال الطلب عبر واتساب
              </button>
            </form>
          </div>
        </div>
      )}

      {/* الفوتر */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 py-8 px-4 sm:px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center space-y-2">
          <div className="text-sm font-black text-white">{settings.platformName}</div>
          <p className="text-xs font-bold">{settings.platformTagline}</p>
          {settings.footerNote && <p className="text-[11px] text-slate-500 font-bold">{settings.footerNote}</p>}
          <p className="text-[11px] text-slate-500 pt-2">
            © {new Date().getFullYear()} جميع الحقوق محفوظة — {settings.platformName}
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// 6. بطاقة عرض المذكرة للزوار
// ============================================================================
function NotebookCard({ nb, theme, onPreview, onAdd }) {
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
          {(nb.subject || nb.term || nb.pagesCount) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {nb.subject && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">{nb.subject}</span>
              )}
              {nb.term && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">{nb.term}</span>
              )}
              {nb.pagesCount && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                  {nb.pagesCount} صفحة
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-lg font-black ${theme?.primaryText || 'text-blue-600'}`}>{nb.price} ج.م</span>
            {Number(nb.oldPrice) > Number(nb.price) && (
              <span className="text-xs text-slate-400 line-through mr-2 font-bold">{nb.oldPrice} ج.م</span>
            )}
          </div>
          <button
            type="button"
            onClick={onPreview}
            className="text-xs sm:text-sm font-black text-slate-700 hover:text-blue-600 flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className={`w-full py-2.5 rounded-xl ${
            theme?.primaryBtn || 'bg-blue-600 hover:bg-blue-700 text-white'
          } text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 shadow-xs`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>أضف للسلة</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 7. لوحة تحكم الإدارة الشاملة
// ============================================================================
function AdminDashboard({
  settings,
  setSettings,
  notebooks,
  samplesMap,
  setSamplesMap,
  bundles,
  coupons,
  orders,
  showToast,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('notebooks');
  const [settingsSubTab, setSettingsSubTab] = useState('brand');
  const [localSettings, setLocalSettings] = useState(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  const [adminNbSearch, setAdminNbSearch] = useState('');
  const [adminNbCatFilter, setAdminNbCatFilter] = useState('');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const [nbForm, setNbForm] = useState({
    id: '',
    title: '',
    subtitle: '',
    subject: '',
    term: '',
    pagesCount: '',
    categoryId: '',
    stageId: '',
    gradeId: '',
    price: '',
    oldPrice: '',
    coverImage: '',
    driveUrl: '',
    noticeText: '',
    noticePosition: 'top',
    badgeText: '',
    hidden: false,
    sortOrder: 0,
    samplePages: []
  });
  const [savingNb, setSavingNb] = useState(false);

  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percent',
    value: '15',
    minOrder: '',
    expiresAt: '',
    note: ''
  });
  const [editingCouponId, setEditingCouponId] = useState('');

  const [bundleForm, setBundleForm] = useState({
    title: '',
    description: '',
    price: '',
    oldPrice: '',
    notebookIds: []
  });

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const catImages = {};
      const cleanCategories = (localSettings.categories || []).map((c) => {
        if (c.image) catImages[c.id] = c.image;
        return { ...c, image: '' };
      });
      const mainPayload = {
        ...localSettings,
        logoUrl: '',
        heroBgImage: '',
        categories: cleanCategories,
        updatedAt: new Date().toISOString()
      };
      const mediaPayload = {
        logoUrl: localSettings.logoUrl || '',
        heroBgImage: localSettings.heroBgImage || '',
        categoryImages: catImages,
        updatedAt: new Date().toISOString()
      };
      if (db) {
        await setDoc(publicDoc('settings', 'main'), mainPayload, { merge: true });
        await setDoc(publicDoc('settings', 'media_assets'), mediaPayload, { merge: true });
        await setDoc(publicDoc('config', 'main'), mainPayload, { merge: true });
        setSettings(localSettings);
        try {
          localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(localSettings));
        } catch {
          // تجاهل
        }
        showToast('تم حفظ جميع الإعدادات في السحابة وتعميمها للعملاء بنجاح!');
      } else {
        setSettings(localSettings);
        showToast('تم حفظ الإعدادات محليًا');
      }
    } catch (err) {
      showToast(`تعذر الحفظ السحابي: ${err?.message || 'خطأ في الصلاحيات'}`, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveNotebook = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim()) return;
    setSavingNb(true);
    try {
      const nbData = {
        title: nbForm.title.trim(),
        subtitle: nbForm.subtitle.trim(),
        subject: nbForm.subject.trim(),
        term: nbForm.term.trim(),
        pagesCount: nbForm.pagesCount ? String(nbForm.pagesCount).trim() : '',
        categoryId: nbForm.categoryId,
        stageId: nbForm.stageId,
        gradeId: nbForm.gradeId,
        price: Number(nbForm.price || 0),
        oldPrice: Number(nbForm.oldPrice || 0),
        coverImage: nbForm.coverImage || '',
        driveUrl: nbForm.driveUrl.trim(),
        noticeText: nbForm.noticeText.trim(),
        noticePosition: nbForm.noticePosition || 'top',
        badgeText: nbForm.badgeText.trim(),
        hidden: Boolean(nbForm.hidden),
        sortOrder: Number(nbForm.sortOrder || 0)
      };

      let targetId = nbForm.id;
      if (db) {
        if (targetId) {
          await updateDoc(publicDoc('notebooks', targetId), nbData);
        } else {
          const added = await addDoc(publicCol('notebooks'), { ...nbData, createdAt: serverTimestamp() });
          targetId = added.id;
        }
        if (Array.isArray(nbForm.samplePages)) {
          await setDoc(
            publicDoc('notebook_samples', targetId),
            { notebookId: targetId, pages: nbForm.samplePages },
            { merge: true }
          );
          for (let pIdx = 0; pIdx < nbForm.samplePages.length; pIdx++) {
            await setDoc(
              publicDoc('notebook_samples', `${targetId}_p${pIdx}`),
              { notebookId: targetId, pageIndex: pIdx, image: nbForm.samplePages[pIdx] },
              { merge: true }
            );
          }
        }
      } else if (!targetId) {
        targetId = `nb_${Date.now()}`;
      }

      if (targetId && Array.isArray(nbForm.samplePages)) {
        setSamplesMap((prev) => ({ ...prev, [targetId]: nbForm.samplePages }));
      }

      setNbForm({
        id: '',
        title: '',
        subtitle: '',
        subject: '',
        term: '',
        pagesCount: '',
        categoryId: '',
        stageId: '',
        gradeId: '',
        price: '',
        oldPrice: '',
        coverImage: '',
        driveUrl: '',
        noticeText: '',
        noticePosition: 'top',
        badgeText: '',
        hidden: false,
        sortOrder: 0,
        samplePages: []
      });
      showToast('تم حفظ المذكرة وصور العينات بنجاح!');
    } catch (err) {
      showToast(`خطأ أثناء الحفظ: ${err?.message || 'تعذر الحفظ'}`, 'error');
    } finally {
      setSavingNb(false);
    }
  };

  const handleDeleteNotebook = async (id) => {
    try {
      if (db) {
        await deleteDoc(publicDoc('notebooks', id));
        await deleteDoc(publicDoc('notebook_samples', id)).catch(() => {});
      }
      showToast('تم حذف المذكرة');
    } catch (err) {
      showToast(err?.message || 'تعذر الحذف', 'error');
    }
  };

  const handleToggleNotebookVisibility = async (nb) => {
    const nextHidden = !nb.hidden;
    try {
      if (db) {
        await updateDoc(publicDoc('notebooks', nb.id), { hidden: nextHidden });
      }
      showToast(nextHidden ? `تم إخفاء «${nb.title}» عن الزوار` : `تم إظهار «${nb.title}» للزوار الآن`);
    } catch (err) {
      showToast(`تعذر تغيير حالة الظهور: ${err?.message}`, 'error');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;
    const data = {
      code: couponForm.code.trim().toUpperCase(),
      type: couponForm.type,
      value: Number(couponForm.value || 0),
      minOrder: Number(couponForm.minOrder || 0),
      expiresAt: couponForm.expiresAt || '',
      note: couponForm.note.trim(),
      active: true
    };
    if (db) {
      if (editingCouponId) {
        await updateDoc(publicDoc('coupons', editingCouponId), data);
      } else {
        await addDoc(publicCol('coupons'), { ...data, createdAt: serverTimestamp() });
      }
    }
    setEditingCouponId('');
    setCouponForm({ code: '', type: 'percent', value: '15', minOrder: '', expiresAt: '', note: '' });
    showToast(editingCouponId ? 'تم تحديث بيانات الكوبون بنجاح' : 'تم إنشاء كوبون الخصم بنجاح');
  };

  const handleCreateBundle = async (e) => {
    e.preventDefault();
    if (!bundleForm.title.trim()) return;
    if (db) {
      await addDoc(publicCol('bundles'), {
        title: bundleForm.title.trim(),
        description: bundleForm.description.trim(),
        price: Number(bundleForm.price || 0),
        oldPrice: Number(bundleForm.oldPrice || 0),
        notebookIds: bundleForm.notebookIds || [],
        createdAt: serverTimestamp()
      });
    }
    setBundleForm({ title: '', description: '', price: '', oldPrice: '', notebookIds: [] });
    showToast('تمت إضافة الباقة بنجاح');
  };

  const formSelectedCat = (localSettings.categories || []).find((c) => c.id === nbForm.categoryId);

  const adminFilteredNotebooks = useMemo(() => {
    return [...notebooks]
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
      .filter((nb) => {
        if (adminNbCatFilter && nb.categoryId !== adminNbCatFilter) return false;
        if (adminNbSearch.trim()) {
          const q = adminNbSearch.trim().toLowerCase();
          const hay = `${nb.title} ${nb.subtitle} ${nb.subject} ${nb.term}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [notebooks, adminNbCatFilter, adminNbSearch]);

  const orderStats = useMemo(() => {
    const pendingCount = orders.filter((o) => (o.status || 'pending') === 'pending').length;
    const processingCount = orders.filter((o) => o.status === 'processing').length;
    const completedCount = orders.filter((o) => o.status === 'completed').length;
    const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    return { pendingCount, processingCount, completedCount, totalRevenue };
  }, [orders]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* رأس لوحة التحكم */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black">لوحة تحكم الإدارة الشاملة</h2>
            <p className="text-xs sm:text-sm text-slate-300 font-bold">
              إدارة المذكرات، العينات، الأقسام، الكوبونات، والطلبات
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* شريط تبويبات لوحة التحكم */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { id: 'notebooks', label: 'المذكرات والعينات', sub: 'إضافة وتعديل ورفع العينات', count: notebooks.length, icon: BookOpen },
          { id: 'categories', label: 'الأقسام والمراحل', sub: 'هيكلة الأقسام والصفوف', count: (localSettings.categories || []).length, icon: Layers },
          { id: 'offers', label: 'الكوبونات والباقات', sub: 'الخصومات وباقات التوفير', count: coupons.length + bundles.length, icon: Tag },
          { id: 'orders', label: 'الطلبات الواردة', sub: 'متابعة وتسليم الطلبات', count: orders.length, icon: Package },
          { id: 'settings', label: 'إعدادات المنصة', sub: 'المظهر والواجهة والنموذج', count: null, icon: Sliders }
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between gap-2 ${
                active
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    active ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {t.count !== null && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      active ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black leading-snug">{t.label}</div>
                <div className={`text-[11px] font-bold mt-0.5 ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                  {t.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 1. تبويب المذكرات والعينات */}
      {activeTab === 'notebooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveNotebook}
            className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 space-y-3.5 h-fit shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">
                {nbForm.id ? 'تعديل المذكرة' : 'إضافة مذكرة جديدة'}
              </h3>
              {nbForm.id && (
                <button
                  type="button"
                  onClick={() =>
                    setNbForm({
                      id: '',
                      title: '',
                      subtitle: '',
                      subject: '',
                      term: '',
                      pagesCount: '',
                      categoryId: '',
                      stageId: '',
                      gradeId: '',
                      price: '',
                      oldPrice: '',
                      coverImage: '',
                      driveUrl: '',
                      noticeText: '',
                      noticePosition: 'top',
                      badgeText: '',
                      hidden: false,
                      sortOrder: 0,
                      samplePages: []
                    })
                  }
                  className="text-xs font-black text-rose-600"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            <input
              type="text"
              required
              placeholder="عنوان المذكرة *"
              value={nbForm.title}
              onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
            />
            <input
              type="text"
              placeholder="وصف مختصر للمذكرة"
              value={nbForm.subtitle}
              onChange={(e) => setNbForm({ ...nbForm, subtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
            />

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="المادة"
                value={nbForm.subject}
                onChange={(e) => setNbForm({ ...nbForm, subject: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="text"
                placeholder="الترم"
                value={nbForm.term}
                onChange={(e) => setNbForm({ ...nbForm, term: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="number"
                placeholder="عدد الصفحات"
                value={nbForm.pagesCount}
                onChange={(e) => setNbForm({ ...nbForm, pagesCount: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <select
              value={nbForm.categoryId}
              onChange={(e) => setNbForm({ ...nbForm, categoryId: e.target.value, stageId: '', gradeId: '' })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
            >
              <option value="">اختر القسم الرئيسي</option>
              {(localSettings.categories || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={nbForm.stageId}
                onChange={(e) => setNbForm({ ...nbForm, stageId: e.target.value, gradeId: '' })}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
              >
                <option value="">اختر المرحلة</option>
                {(formSelectedCat?.stages || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={nbForm.gradeId}
                onChange={(e) => setNbForm({ ...nbForm, gradeId: e.target.value })}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
              >
                <option value="">اختر الصف</option>
                {((formSelectedCat?.stages || []).find((s) => s.id === nbForm.stageId)?.grades || []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                required
                placeholder="السعر (ج.م) *"
                value={nbForm.price}
                onChange={(e) => setNbForm({ ...nbForm, price: e.target.value })}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="number"
                placeholder="السعر قبل الخصم"
                value={nbForm.oldPrice}
                onChange={(e) => setNbForm({ ...nbForm, oldPrice: e.target.value })}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="number"
                placeholder="الترتيب"
                value={nbForm.sortOrder}
                onChange={(e) => setNbForm({ ...nbForm, sortOrder: Number(e.target.value) })}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="شارة مميزة (مثلاً: جديد)"
                value={nbForm.badgeText}
                onChange={(e) => setNbForm({ ...nbForm, badgeText: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!nbForm.hidden}
                  onChange={(e) => setNbForm({ ...nbForm, hidden: e.target.checked })}
                />
                <span>إخفاء المذكرة مؤقتًا</span>
              </label>
            </div>

            <input
              type="url"
              dir="ltr"
              placeholder="رابط معاينة Google Drive (اختياري)"
              value={nbForm.driveUrl}
              onChange={(e) => setNbForm({ ...nbForm, driveUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-left"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="تنبيه يظهر داخل المعاينة"
                value={nbForm.noticeText}
                onChange={(e) => setNbForm({ ...nbForm, noticeText: e.target.value })}
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <select
                value={nbForm.noticePosition || 'top'}
                onChange={(e) => setNbForm({ ...nbForm, noticePosition: e.target.value })}
                className="px-2.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
              >
                <option value="top">أعلى العينات</option>
                <option value="bottom">أسفل العينات</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700">صورة الغلاف</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const dataUrl = await compressImageFile(file, 1100, 0.88);
                  setNbForm({ ...nbForm, coverImage: dataUrl });
                }}
                className="w-full text-xs"
              />
              {nbForm.coverImage && (
                <div className="flex items-center gap-3 pt-1">
                  <img src={nbForm.coverImage} alt="غلاف" className="w-16 h-20 rounded-xl object-cover border" />
                  <button
                    type="button"
                    onClick={() => setNbForm({ ...nbForm, coverImage: '' })}
                    className="text-xs font-black text-rose-600"
                  >
                    حذف الغلاف
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700">
                صور عينات الصفحات ({(nbForm.samplePages || []).length} صورة)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  const compressed = await Promise.all(files.map((f) => compressImageFile(f, 1800, 0.92)));
                  setNbForm((prev) => ({
                    ...prev,
                    samplePages: [...(prev.samplePages || []), ...compressed]
                  }));
                }}
                className="w-full text-xs"
              />
              {(nbForm.samplePages || []).length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {nbForm.samplePages.map((pg, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-[3/4]">
                      <img src={pg} alt={`عينة ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setNbForm((prev) => ({
                            ...prev,
                            samplePages: prev.samplePages.filter((_, i) => i !== idx)
                          }))
                        }
                        className="absolute top-1 left-1 w-5 h-5 rounded-full bg-rose-600 text-white text-xs font-black flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={savingNb}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow"
            >
              {savingNb ? 'جاري الحفظ...' : nbForm.id ? 'حفظ التعديلات' : 'إضافة المذكرة'}
            </button>
          </form>

          {/* قائمة المذكرات */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={adminNbSearch}
                  onChange={(e) => setAdminNbSearch(e.target.value)}
                  placeholder="ابحث في المذكرات بالعنوان أو المادة..."
                  className="w-full pr-10 pl-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={adminNbCatFilter}
                  onChange={(e) => setAdminNbCatFilter(e.target.value)}
                  className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-black"
                >
                  <option value="">جميع الأقسام ({notebooks.length})</option>
                  {(localSettings.categories || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {adminFilteredNotebooks.map((nb) => {
              const directSamples = samplesMap[nb.id] || [];
              const prefixSamples = Object.entries(samplesMap)
                .filter(([k]) => k === nb.id || k.startsWith(`${nb.id}_`) || k.startsWith(`${nb.id}-`))
                .flatMap(([, arr]) => arr);
              const existingSamples = Array.from(
                new Set([...directSamples, ...prefixSamples, ...(nb.inlineSamples || [])])
              ).filter((im) => im && im !== nb.coverImage);
              const catName = (localSettings.categories || []).find((c) => c.id === nb.categoryId)?.name || 'غير مصنف';

              return (
                <div
                  key={nb.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs hover:border-blue-300 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {nb.coverImage ? (
                      <img src={nb.coverImage} alt="" className="w-14 h-20 rounded-xl object-cover border shrink-0" />
                    ) : (
                      <div className="w-14 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-black text-slate-900 text-sm sm:text-base flex flex-wrap items-center gap-2">
                        <span className="truncate">{nb.title}</span>
                        {nb.hidden && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-black">
                            مخفية
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-bold mt-1">
                        {catName} {nb.subject ? `• ${nb.subject}` : ''} {nb.pagesCount ? `• ${nb.pagesCount} صفحة` : ''}
                      </div>
                      <div className="text-xs sm:text-sm font-black text-blue-600 mt-1">
                        {nb.price} ج.م • ({existingSamples.length} صور عينة)
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setNbForm({
                          ...nb,
                          id: '',
                          title: `${nb.title} (نسخة)`,
                          samplePages: existingSamples
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black"
                    >
                      نسخ
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        let loadedSamples = existingSamples;
                        if (loadedSamples.length === 0 && db) {
                          try {
                            const qSnap = await getDocs(
                              query(publicCol('notebook_samples'), where('notebookId', '==', nb.id))
                            );
                            const fetched = [];
                            qSnap.docs.forEach((d) => {
                              extractAnyImagesFromDoc(d.data()).forEach((im) => {
                                if (!fetched.includes(im) && im !== nb.coverImage) fetched.push(im);
                              });
                            });
                            if (fetched.length > 0) {
                              loadedSamples = fetched;
                              setSamplesMap((prev) => ({ ...prev, [nb.id]: fetched }));
                            }
                          } catch {
                            // تجاهل
                          }
                        }
                        setNbForm({
                          ...nb,
                          samplePages: loadedSamples
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleNotebookVisibility(nb)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                        nb.hidden
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-800 hover:bg-slate-900 text-amber-300 shadow-xs'
                      }`}
                    >
                      {nb.hidden ? 'إظهار للزوار' : 'إخفاء عن الزوار'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotebook(nb.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. تبويب الأقسام والمراحل والصفوف */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-black text-slate-900 text-base">إدارة الأقسام الرئيسية والمراحل والصفوف</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    categories: DEFAULT_CATEGORIES.map((defCat, idx) => ({
                      ...defCat,
                      id: prev.categories?.[idx]?.id || defCat.id,
                      image: prev.categories?.[idx]?.image || ''
                    }))
                  }))
                }
                className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black"
              >
                استعادة الأسماء والمراحل الافتراضية مع الإبقاء على الصور
              </button>
              <button
                type="button"
                onClick={() =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    categories: [
                      ...(prev.categories || []),
                      { id: `cat_${Date.now()}`, name: 'قسم جديد', browseMode: 'hierarchy', image: '', stages: [] }
                    ]
                  }))
                }
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {(localSettings.categories || []).map((cat, cIdx) => (
              <div key={cat.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={cIdx === 0}
                      onClick={() => {
                        const arr = [...localSettings.categories];
                        [arr[cIdx - 1], arr[cIdx]] = [arr[cIdx], arr[cIdx - 1]];
                        setLocalSettings({ ...localSettings, categories: arr });
                      }}
                      className="p-1 rounded bg-white border border-slate-200 disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={cIdx === (localSettings.categories || []).length - 1}
                      onClick={() => {
                        const arr = [...localSettings.categories];
                        [arr[cIdx + 1], arr[cIdx]] = [arr[cIdx], arr[cIdx + 1]];
                        setLocalSettings({ ...localSettings, categories: arr });
                      }}
                      className="p-1 rounded bg-white border border-slate-200 disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalSettings((prev) => ({
                        ...prev,
                        categories: prev.categories.map((c, i) => (i === cIdx ? { ...c, name: val } : c))
                      }));
                    }}
                    className="flex-1 min-w-[180px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-black"
                  />

                  <select
                    value={cat.browseMode || 'hierarchy'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalSettings((prev) => ({
                        ...prev,
                        categories: prev.categories.map((c, i) => (i === cIdx ? { ...c, browseMode: val } : c))
                      }));
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    <option value="hierarchy">تصفح هرمي (مراحل وصفوف)</option>
                    <option value="direct">عرض المذكرات مباشرة</option>
                  </select>

                  <label className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-black cursor-pointer hover:border-blue-400">
                    <span>صورة القسم</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const dataUrl = await compressImageFile(file, 900, 0.85);
                        setLocalSettings((prev) => ({
                          ...prev,
                          categories: prev.categories.map((c, i) => (i === cIdx ? { ...c, image: dataUrl } : c))
                        }));
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        categories: prev.categories.map((c, i) =>
                          i === cIdx
                            ? {
                                ...c,
                                stages: [...(c.stages || []), { id: `stg_${Date.now()}`, name: 'مرحلة جديدة', grades: [] }]
                              }
                            : c
                        )
                      }))
                    }
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black"
                  >
                    + مرحلة
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        categories: prev.categories.filter((_, i) => i !== cIdx)
                      }))
                    }
                    className="p-2 rounded-xl bg-rose-50 text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {cat.image && (
                  <div className="flex items-center gap-3">
                    <img src={cat.image} alt="" className="h-16 w-28 rounded-xl object-cover border" />
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          categories: prev.categories.map((c, i) => (i === cIdx ? { ...c, image: '' } : c))
                        }))
                      }
                      className="text-xs font-black text-rose-600"
                    >
                      حذف الصورة
                    </button>
                  </div>
                )}

                <div className="pr-4 space-y-2.5 border-r-2 border-blue-200">
                  {(cat.stages || []).map((st, sIdx) => (
                    <div key={st.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={st.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocalSettings((prev) => ({
                              ...prev,
                              categories: prev.categories.map((c, i) =>
                                i === cIdx
                                  ? { ...c, stages: c.stages.map((s, si) => (si === sIdx ? { ...s, name: val } : s)) }
                                  : c
                              )
                            }));
                          }}
                          className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setLocalSettings((prev) => ({
                              ...prev,
                              categories: prev.categories.map((c, i) =>
                                i === cIdx
                                  ? {
                                      ...c,
                                      stages: c.stages.map((s, si) =>
                                        si === sIdx
                                          ? { ...s, grades: [...(s.grades || []), { id: `grd_${Date.now()}`, name: 'صف جديد' }] }
                                          : s
                                      )
                                    }
                                  : c
                              )
                            }))
                          }
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-black"
                        >
                          + صف دراسي
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLocalSettings((prev) => ({
                              ...prev,
                              categories: prev.categories.map((c, i) =>
                                i === cIdx ? { ...c, stages: c.stages.filter((_, si) => si !== sIdx) } : c
                              )
                            }))
                          }
                          className="p-1.5 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(st.grades || []).map((gr, gIdx) => (
                          <div
                            key={gr.id}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200"
                          >
                            <input
                              type="text"
                              value={gr.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLocalSettings((prev) => ({
                                  ...prev,
                                  categories: prev.categories.map((c, i) =>
                                    i === cIdx
                                      ? {
                                          ...c,
                                          stages: c.stages.map((s, si) =>
                                            si === sIdx
                                              ? {
                                                  ...s,
                                                  grades: s.grades.map((g, gi) => (gi === gIdx ? { ...g, name: val } : g))
                                                }
                                              : s
                                          )
                                        }
                                      : c
                                  )
                                }));
                              }}
                              className="bg-transparent text-xs font-bold w-36 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setLocalSettings((prev) => ({
                                  ...prev,
                                  categories: prev.categories.map((c, i) =>
                                    i === cIdx
                                      ? {
                                          ...c,
                                          stages: c.stages.map((s, si) =>
                                            si === sIdx
                                              ? { ...s, grades: s.grades.filter((_, gi) => gi !== gIdx) }
                                              : s
                                          )
                                        }
                                      : c
                                  )
                                }))
                              }
                              className="text-rose-500 font-black text-sm"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow"
          >
            {savingSettings ? 'جاري الحفظ...' : 'حفظ هيكل الأقسام والصور'}
          </button>
        </div>
      )}

      {/* 3. تبويب الكوبونات وباقات التوفير */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-base">
                  {editingCouponId ? 'تعديل بيانات كوبون الخصم' : 'إنشاء كوبون خصم بمدة صلاحية'}
                </h3>
                {editingCouponId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCouponId('');
                      setCouponForm({ code: '', type: 'percent', value: '15', minOrder: '', expiresAt: '', note: '' });
                    }}
                    className="text-xs font-black text-slate-500 hover:text-slate-800"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>
              <form onSubmit={handleCreateCoupon} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="كود الخصم (مثلاً: M20)"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase"
                  />
                  <select
                    value={couponForm.type}
                    onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    <option value="percent">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">قيمة الخصم *</label>
                    <input
                      type="number"
                      required
                      value={couponForm.value}
                      onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">الحد الأدنى للطلب</label>
                    <input
                      type="number"
                      placeholder="0 = بدون حد"
                      value={couponForm.minOrder}
                      onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ الانتهاء</label>
                    <input
                      type="datetime-local"
                      value={couponForm.expiresAt}
                      onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="ملاحظة أو وصف للكوبون"
                  value={couponForm.note}
                  onChange={(e) => setCouponForm({ ...couponForm, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black"
                >
                  {editingCouponId ? 'حفظ تعديلات الكوبون' : 'إضافة الكوبون'}
                </button>
              </form>

              <div className="space-y-2 pt-2">
                {coupons.map((cp) => {
                  const expired = isCouponExpired(cp);
                  const isPaused = cp.active === false;
                  return (
                    <div
                      key={cp.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-xs text-slate-900">{cp.code}</span>
                          <span className="text-xs font-bold text-emerald-700">
                            ({cp.value} {cp.type === 'fixed' ? 'ج.م' : '%'})
                          </span>
                          {Number(cp.minOrder || 0) > 0 && (
                            <span className="text-[11px] font-bold text-slate-500">• حد أدنى {cp.minOrder} ج.م</span>
                          )}
                          {expired && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-black">
                              منتهي
                            </span>
                          )}
                          {isPaused && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                              متوقف
                            </span>
                          )}
                        </div>
                        {cp.note && <div className="text-xs text-slate-600 font-bold mt-0.5">{cp.note}</div>}
                        {cp.expiresAt && (
                          <div className="text-xs text-slate-500 font-bold">ينتهي: {formatExpiryAr(cp.expiresAt)}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCouponId(cp.id);
                            setCouponForm({
                              code: cp.code || '',
                              type: cp.type || 'percent',
                              value: String(cp.value ?? '15'),
                              minOrder: cp.minOrder ? String(cp.minOrder) : '',
                              expiresAt: cp.expiresAt ? String(cp.expiresAt).slice(0, 16) : '',
                              note: cp.note || ''
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (db) await updateDoc(publicDoc('coupons', cp.id), { active: isPaused });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                            isPaused
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          }`}
                        >
                          {isPaused ? 'تفعيل' : 'إيقاف'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (db) await deleteDoc(publicDoc('coupons', cp.id));
                          }}
                          className="p-1.5 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
              <h3 className="font-black text-slate-900 text-base">إضافة باقة توفير وربط مذكراتها</h3>
              <form onSubmit={handleCreateBundle} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="اسم الباقة"
                  value={bundleForm.title}
                  onChange={(e) => setBundleForm({ ...bundleForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
                <textarea
                  rows={2}
                  placeholder="وصف الباقة ومميزاتها"
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="number"
                    required
                    placeholder="سعر الباقة (ج.م)"
                    value={bundleForm.price}
                    onChange={(e) => setBundleForm({ ...bundleForm, price: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  <input
                    type="number"
                    placeholder="السعر قبل الخصم"
                    value={bundleForm.oldPrice}
                    onChange={(e) => setBundleForm({ ...bundleForm, oldPrice: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                {notebooks.length > 0 && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-black text-slate-700">حدد المذكرات المشمولة داخل الباقة (اختياري):</div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {notebooks.map((n) => {
                        const checked = (bundleForm.notebookIds || []).includes(n.id);
                        return (
                          <label
                            key={n.id}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer ${
                              checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={checked}
                              onChange={() => {
                                const cur = bundleForm.notebookIds || [];
                                setBundleForm({
                                  ...bundleForm,
                                  notebookIds: checked ? cur.filter((id) => id !== n.id) : [...cur, n.id]
                                });
                              }}
                            />
                            <span>{n.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs sm:text-sm font-black"
                >
                  حفظ الباقة
                </button>
              </form>

              <div className="space-y-2 pt-2">
                {bundles.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-black text-xs text-slate-900">{b.title}</div>
                      <div className="text-xs font-bold text-blue-600">
                        {b.price} ج.م {(b.notebookIds || []).length > 0 ? `• (${b.notebookIds.length} مذكرات)` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (db) await deleteDoc(publicDoc('bundles', b.id));
                      }}
                      className="p-1.5 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* إعدادات كوبون مكافأة الطلب القادم التلقائي داخل صفحة العروض والباقات */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">كوبون مكافأة الطلب القادم التلقائي للعميل</h3>
                <p className="text-xs text-slate-500 font-bold">
                  يُنشأ تلقائيًا بعد إتمام كل طلب ويُمنح للمعلم لتشجيعه على الطلب مرة أخرى
                </p>
              </div>
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!localSettings.nextOrderReward?.enabled}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      nextOrderReward: { ...localSettings.nextOrderReward, enabled: e.target.checked }
                    })
                  }
                />
                <span>تفعيل المكافأة التلقائية</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نسبة الخصم (%)</label>
                <input
                  type="number"
                  value={localSettings.nextOrderReward?.discountPercent ?? 15}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      nextOrderReward: { ...localSettings.nextOrderReward, discountPercent: Number(e.target.value) }
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مدة الصلاحية بالأيام (0 = مفتوح)</label>
                <input
                  type="number"
                  value={localSettings.nextOrderReward?.validDays ?? 7}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      nextOrderReward: { ...localSettings.nextOrderReward, validDays: Number(e.target.value) }
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">بادئة الكود</label>
                <input
                  type="text"
                  value={localSettings.nextOrderReward?.prefix ?? 'VIP'}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      nextOrderReward: { ...localSettings.nextOrderReward, prefix: e.target.value.toUpperCase() }
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black uppercase"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black"
            >
              {savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات مكافأة الطلب القادم'}
            </button>
          </div>
        </div>
      )}

      {/* 4. تبويب الطلبات الواردة */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-[11px] font-bold text-slate-500">قيد المراجعة</div>
              <div className="text-xl font-black text-amber-600 mt-0.5">{orderStats.pendingCount}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-[11px] font-bold text-slate-500">جاري التجهيز</div>
              <div className="text-xl font-black text-blue-600 mt-0.5">{orderStats.processingCount}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-[11px] font-bold text-slate-500">طلبات مكتملة</div>
              <div className="text-xl font-black text-emerald-600 mt-0.5">{orderStats.completedCount}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-[11px] font-bold text-slate-500">إجمالي المبيعات</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{orderStats.totalRevenue} ج.م</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="بحث برقم الطلب أو اسم المعلم أو الهاتف..."
              className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
            />
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-black"
            >
              <option value="all">جميع الحالات ({orders.length})</option>
              <option value="pending">قيد المراجعة</option>
              <option value="processing">جاري التجهيز</option>
              <option value="completed">تم التسليم</option>
            </select>
          </div>

          {orders.filter((o) => {
            if (orderStatusFilter !== 'all' && (o.status || 'pending') !== orderStatusFilter) return false;
            if (orderSearch.trim()) {
              const q = orderSearch.trim().toLowerCase();
              const blob = `${o.orderCode} ${JSON.stringify(o.customer || {})}`.toLowerCase();
              if (!blob.includes(q)) return false;
            }
            return true;
          }).length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-xs font-bold text-slate-500">
              لا توجد طلبات مطابقة حاليًا.
            </div>
          ) : (
            orders
              .filter((o) => {
                if (orderStatusFilter !== 'all' && (o.status || 'pending') !== orderStatusFilter) return false;
                if (orderSearch.trim()) {
                  const q = orderSearch.trim().toLowerCase();
                  const blob = `${o.orderCode} ${JSON.stringify(o.customer || {})}`.toLowerCase();
                  if (!blob.includes(q)) return false;
                }
                return true;
              })
              .map((ord) => {
                const phoneVal = Object.entries(ord.customer || {}).find(([k]) => /واتساب|هاتف|phone/i.test(k))?.[1];
                const cleanPhone = String(phoneVal || '').replace(/[^\d]/g, '');
                const waClientPhone = cleanPhone.startsWith('01') ? `2${cleanPhone}` : cleanPhone;

                return (
                  <div key={ord.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-black text-blue-700 text-sm">{ord.orderCode}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {waClientPhone && (
                          <a
                            href={`https://wa.me/${waClientPhone}?text=${encodeURIComponent(
                              `مرحبًا أستاذنا الفاضل، تم تجهيز طلبك رقم ${ord.orderCode} من ${settings.platformName} بنجاح!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>مراسلة المعلم</span>
                          </a>
                        )}
                        <select
                          value={ord.status || 'pending'}
                          onChange={async (e) => {
                            const st = e.target.value;
                            if (db && auth?.currentUser) {
                              await updateDoc(publicDoc('orders', ord.id), { status: st });
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-black"
                        >
                          <option value="pending">قيد المراجعة</option>
                          <option value="processing">جاري التجهيز</option>
                          <option value="completed">تم التسليم</option>
                        </select>
                        <button
                          type="button"
                          onClick={async () => {
                            if (db && auth?.currentUser) await deleteDoc(publicDoc('orders', ord.id));
                          }}
                          className="p-1.5 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-700 font-bold">
                      الإجمالي: {ord.total} ج.م • العناصر: {(ord.items || []).map((i) => i.title).join(' ، ')}
                    </div>
                    {ord.customer && Object.keys(ord.customer).length > 0 && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-bold flex flex-wrap gap-3">
                        {Object.entries(ord.customer).map(([k, v]) => (
                          <span key={k}>
                            <strong className="text-slate-800">{k}:</strong> {safeText(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* 5. تبويب إعدادات الموقع والمظهر */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* شريط الرأس والتنقل الداخلي الأنيق لصفحة الإعدادات */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">مركز تخصيص المنصة والمظهر</h3>
                <p className="text-xs text-slate-500 font-bold">
                  تحكم في هوية المنصة، الشريط الإعلاني، الواجهة الرئيسية، ونموذج طلبات المعلمين
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow-md transition"
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'brand', label: '1. الهوية والشريط الإعلاني' },
                { id: 'hero', label: '2. الواجهة وبطاقة الثقة' },
                { id: 'sections', label: '3. ما الجديد والأخبار' },
                { id: 'forms', label: '4. السلة والتواصل والنسخ' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSettingsSubTab(st.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black border transition ${
                    settingsSubTab === st.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* 1. الهوية والألوان والشريط الترويجي */}
          {settingsSubTab === 'brand' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-2.5 h-6 rounded-full bg-blue-600" />
                  <h3 className="font-black text-slate-900 text-base">الهوية الأساسية للمنصة</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">اسم المنصة</label>
                    <input
                      type="text"
                      value={localSettings.platformName}
                      onChange={(e) => setLocalSettings({ ...localSettings, platformName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">الوصف المختصر تحت الاسم</label>
                    <input
                      type="text"
                      value={localSettings.platformTagline}
                      onChange={(e) => setLocalSettings({ ...localSettings, platformTagline: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">نظام الألوان الرئيسي للمنصة</label>
                    <select
                      value={localSettings.primaryTheme || 'blue'}
                      onChange={(e) => setLocalSettings({ ...localSettings, primaryTheme: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-black"
                    >
                      {Object.entries(THEME_PALETTES).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">رقم واتساب استقبال الطلبات</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={localSettings.whatsappNumber}
                      onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm font-bold text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <label className="block text-xs font-black text-slate-800">شعار المنصة (Logo)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const dataUrl = await compressImageFile(file, 400, 0.85);
                        setLocalSettings({ ...localSettings, logoUrl: dataUrl });
                      }}
                      className="text-xs"
                    />
                    {localSettings.logoUrl && (
                      <div className="flex items-center gap-3 pt-1">
                        <img src={localSettings.logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border bg-white" />
                        <button
                          type="button"
                          onClick={() => setLocalSettings({ ...localSettings, logoUrl: '' })}
                          className="text-xs font-black text-rose-600"
                        >
                          حذف الشعار
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <label className="block text-xs font-black text-slate-800">صورة خلفية الواجهة الرئيسية (Hero)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const dataUrl = await compressImageFile(file, 1400, 0.78);
                        setLocalSettings({ ...localSettings, heroBgImage: dataUrl });
                      }}
                      className="text-xs"
                    />
                    {localSettings.heroBgImage && (
                      <div className="flex items-center gap-3 pt-1">
                        <img src={localSettings.heroBgImage} alt="Hero" className="h-16 w-28 rounded-xl object-cover border" />
                        <button
                          type="button"
                          onClick={() => setLocalSettings({ ...localSettings, heroBgImage: '' })}
                          className="text-xs font-black text-rose-600"
                        >
                          حذف الخلفية
                        </button>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-1">
                        <span>شفافية التعتيم فوق صورة الخلفية</span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                          {localSettings.heroOverlayOpacity ?? 78}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={95}
                        value={localSettings.heroOverlayOpacity ?? 78}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, heroOverlayOpacity: Number(e.target.value) })
                        }
                        className="w-full cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-700 mb-1.5">لون النص</label>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50">
                      <input
                        type="color"
                        value={localSettings.promoTextColor || '#fde047'}
                        onChange={(e) => setLocalSettings({ ...localSettings, promoTextColor: e.target.value })}
                        className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-bold text-slate-600" dir="ltr">
                        {localSettings.promoTextColor || '#fde047'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. إعدادات الواجهة الرئيسية (Hero) وبطاقة الثقة */}
          {settingsSubTab === 'hero' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-2.5 h-6 rounded-full bg-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">الواجهة الرئيسية وبطاقة «لماذا يثق بنا المعلمون؟»</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">الشارة العلوية (Badge)</label>
                  <input
                    type="text"
                    value={localSettings.heroBadge}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroBadge: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    شفافية التعتيم فوق الخلفية ({localSettings.heroOverlayOpacity ?? 78}%)
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={95}
                    value={localSettings.heroOverlayOpacity ?? 78}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroOverlayOpacity: Number(e.target.value) })}
                    className="w-full mt-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    ارتفاع الواجهة ({localSettings.heroMinHeight ?? 460}px)
                  </label>
                  <input
                    type="number"
                    min={320}
                    max={800}
                    value={localSettings.heroMinHeight ?? 460}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroMinHeight: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">العنوان الرئيسي في الواجهة</label>
                <input
                  type="text"
                  value={localSettings.heroTitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">النص التعريفي في الواجهة</label>
                <textarea
                  rows={2}
                  value={localSettings.heroSubtitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroSubtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">نص الزر الرئيسي الأول</label>
                  <input
                    type="text"
                    value={localSettings.heroPrimaryBtnText || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroPrimaryBtnText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">نص زر الباقات الثاني</label>
                  <input
                    type="text"
                    value={localSettings.heroSecondaryBtnText || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroSecondaryBtnText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">نص زر المذكرة الخاصة</label>
                  <input
                    type="text"
                    value={localSettings.heroCustomBtnText || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroCustomBtnText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={localSettings.trustTitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, trustTitle: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-black"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        trustPoints: [...(localSettings.trustPoints || []), 'ميزة جديدة للمعلمين']
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-black"
                  >
                    + نقطة
                  </button>
                </div>
                <div className="space-y-2">
                  {(localSettings.trustPoints || []).map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pt}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocalSettings({
                            ...localSettings,
                            trustPoints: localSettings.trustPoints.map((p, i) => (i === idx ? val : p))
                          });
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            trustPoints: localSettings.trustPoints.filter((_, i) => i !== idx)
                          })
                        }
                        className="p-2 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. إعدادات قسم «ما الجديد؟» وقسم «الأخبار ومذكرات قيد التجهيز» */}
          {settingsSubTab === 'sections' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-2.5 h-6 rounded-full bg-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">قسم «ما الجديد؟» وقسم «الأخبار ومذكرات قيد التجهيز»</h3>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-slate-800">تفعيل قسم «ما الجديد؟» في الرئيسية</span>
                  <input
                    type="checkbox"
                    checked={!!localSettings.whatsNewEnabled}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewEnabled: e.target.checked })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={localSettings.whatsNewTitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewTitle: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                  <select
                    value={localSettings.whatsNewMode || 'auto'}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewMode: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    <option value="auto">اختيار تلقائي (الأحدث)</option>
                    <option value="manual">اختيار يدوي محدد</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={localSettings.whatsNewCount || 4}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewCount: Number(e.target.value) })}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                </div>
                {localSettings.whatsNewMode === 'manual' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {notebooks.map((nb) => {
                      const checked = (localSettings.whatsNewIds || []).includes(nb.id);
                      return (
                        <label
                          key={nb.id}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                            checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={() => {
                              const cur = localSettings.whatsNewIds || [];
                              setLocalSettings({
                                ...localSettings,
                                whatsNewIds: checked ? cur.filter((id) => id !== nb.id) : [...cur, nb.id]
                              });
                            }}
                          />
                          <span>{nb.title}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-slate-800">تفعيل قسم «أخبار المنصة ومذكرات قيد التجهيز»</span>
                  <input
                    type="checkbox"
                    checked={!!localSettings.newsSectionEnabled}
                    onChange={(e) => setLocalSettings({ ...localSettings, newsSectionEnabled: e.target.checked })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={localSettings.newsSectionTitle || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, newsSectionTitle: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        newsItems: [
                          ...(localSettings.newsItems || []),
                          {
                            id: `news_${Date.now()}`,
                            badge: 'قيد التجهيز',
                            title: 'إصدار جديد قيد الإعداد',
                            date: 'قريبًا',
                            summary: 'تفاصيل الإصدار القادم...'
                          }
                        ]
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black"
                  >
                    + إضافة خبر / إصدار
                  </button>
                </div>
                <div className="space-y-2.5">
                  {(localSettings.newsItems || []).map((item, idx) => (
                    <div key={item.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="الشارة (قيد التجهيز)"
                          value={item.badge}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocalSettings({
                              ...localSettings,
                              newsItems: localSettings.newsItems.map((n, i) => (i === idx ? { ...n, badge: val } : n))
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                        />
                        <input
                          type="text"
                          placeholder="عنوان الخبر"
                          value={item.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocalSettings({
                              ...localSettings,
                              newsItems: localSettings.newsItems.map((n, i) => (i === idx ? { ...n, title: val } : n))
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="الموعد (قريبًا)"
                            value={item.date}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalSettings({
                                ...localSettings,
                                newsItems: localSettings.newsItems.map((n, i) => (i === idx ? { ...n, date: val } : n))
                              });
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setLocalSettings({
                                ...localSettings,
                                newsItems: localSettings.newsItems.filter((_, i) => i !== idx)
                              })
                            }
                            className="p-1.5 text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="وصف مختصر"
                        value={item.summary}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocalSettings({
                            ...localSettings,
                            newsItems: localSettings.newsItems.map((n, i) => (i === idx ? { ...n, summary: val } : n))
                          });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. حقول السلة وروابط التواصل والنسخ الاحتياطي */}
          {settingsSubTab === 'forms' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">حقول نموذج طلب المعلم في السلة</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          checkoutFields: [
                            ...(localSettings.checkoutFields || []),
                            { id: `fld_${Date.now()}`, label: 'حقل إضافي', type: 'text', placeholder: '', options: '', required: false, enabled: true }
                          ]
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black"
                    >
                      + حقل
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(localSettings.checkoutFields || []).map((f, idx) => (
                      <div key={f.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const arr = [...localSettings.checkoutFields];
                                [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                setLocalSettings({ ...localSettings, checkoutFields: arr });
                              }}
                              className="p-0.5 rounded bg-white border disabled:opacity-30"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === (localSettings.checkoutFields || []).length - 1}
                              onClick={() => {
                                const arr = [...localSettings.checkoutFields];
                                [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                                setLocalSettings({ ...localSettings, checkoutFields: arr });
                              }}
                              className="p-0.5 rounded bg-white border disabled:opacity-30"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={f.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalSettings({
                                ...localSettings,
                                checkoutFields: localSettings.checkoutFields.map((it, i) =>
                                  i === idx ? { ...it, label: val } : it
                                )
                              });
                            }}
                            className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                          />
                          <select
                            value={f.type || 'text'}
                            onChange={(e) =>
                              setLocalSettings({
                                ...localSettings,
                                checkoutFields: localSettings.checkoutFields.map((it, i) =>
                                  i === idx ? { ...it, type: e.target.value } : it
                                )
                              })
                            }
                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                          >
                            <option value="text">نص</option>
                            <option value="tel">رقم هاتف</option>
                            <option value="select">قائمة منسدلة</option>
                            <option value="textarea">ملاحظات طويلة</option>
                          </select>
                          <label className="text-xs font-bold flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={!!f.required}
                              onChange={(e) =>
                                setLocalSettings({
                                  ...localSettings,
                                  checkoutFields: localSettings.checkoutFields.map((it, i) =>
                                    i === idx ? { ...it, required: e.target.checked } : it
                                  )
                                })
                              }
                            />
                            <span>إلزامي</span>
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setLocalSettings({
                                ...localSettings,
                                checkoutFields: localSettings.checkoutFields.filter((_, i) => i !== idx)
                              })
                            }
                            className="p-1 text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {f.type === 'select' && (
                          <input
                            type="text"
                            placeholder="اكتب خيارات القائمة مفصولة بفاصلة (مثال: ترم أول، ترم ثاني، مراجعة)"
                            value={f.options || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalSettings({
                                ...localSettings,
                                checkoutFields: localSettings.checkoutFields.map((it, i) =>
                                  i === idx ? { ...it, options: val } : it
                                )
                              });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">رسالة تأكيد الطلب بعد الإرسال</label>
                    <input
                      type="text"
                      value={localSettings.orderSuccessMessage || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, orderSuccessMessage: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">روابط التواصل الاجتماعي</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          socialLinks: [
                            ...(localSettings.socialLinks || []),
                            { id: `soc_${Date.now()}`, label: 'رابط جديد', url: 'https://' }
                          ]
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black"
                    >
                      + رابط
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(localSettings.socialLinks || []).map((lnk, idx) => (
                      <div key={lnk.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                        <input
                          type="text"
                          value={lnk.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocalSettings({
                              ...localSettings,
                              socialLinks: localSettings.socialLinks.map((it, i) =>
                                i === idx ? { ...it, label: val } : it
                              )
                            });
                          }}
                          className="w-1/3 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                        />
                        <input
                          type="url"
                          dir="ltr"
                          value={lnk.url}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocalSettings({
                              ...localSettings,
                              socialLinks: localSettings.socialLinks.map((it, i) =>
                                i === idx ? { ...it, url: val } : it
                              )
                            });
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-left"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setLocalSettings({
                              ...localSettings,
                              socialLinks: localSettings.socialLinks.filter((_, i) => i !== idx)
                            })
                          }
                          className="p-1 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* بنر المذكرة الخاصة ونص الفوتر */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">بنر «طلب مذكرة بتصميم خاص» وتذييل الصفحة (Footer)</span>
                  <input
                    type="checkbox"
                    checked={localSettings.customBannerEnabled !== false}
                    onChange={(e) => setLocalSettings({ ...localSettings, customBannerEnabled: e.target.checked })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="عنوان البنر"
                    value={localSettings.customBannerTitle || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, customBannerTitle: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="نص زر البنر"
                    value={localSettings.customBannerBtnText || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, customBannerBtnText: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                  />
                </div>
                <input
                  type="text"
                  placeholder="وصف البنر"
                  value={localSettings.customBannerSubtitle || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, customBannerSubtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="ملاحظة تذييل الصفحة (Footer)"
                  value={localSettings.footerNote || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, footerNote: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                />
              </div>

              {/* النسخ الاحتياطي والاستعادة */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">النسخ الاحتياطي للإعدادات والبيانات (JSON)</h3>
                  <p className="text-xs text-slate-500 font-bold">احفظ نسخة كاملة من إعداداتك على جهازك أو استعدها في أي وقت</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(localSettings, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `el3bakera-settings-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast('تم تنزيل ملف النسخة الاحتياطية');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل نسخة احتياطية (JSON)</span>
                  </button>
                  <label className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-blue-500 text-xs font-black cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>استعادة من ملف JSON</span>
                    <input
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          try {
                            const parsed = JSON.parse(ev.target.result);
                            setLocalSettings((prev) => mergeAndNormalizeSettings(prev, parsed));
                            showToast('تم تحميل الإعدادات من الملف — اضغط حفظ لتثبيتها');
                          } catch {
                            showToast('ملف JSON غير صالح', 'error');
                          }
                        };
                        reader.readAsText(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow-lg"
          >
            {savingSettings ? 'جاري حفظ الإعدادات...' : 'حفظ جميع الإعدادات الآن'}
          </button>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// 7. المكون الجذري المُصدَّر افتراضيًا (App)
// ============================================================================
export default function App() {
  return (
    <PlatformErrorBoundary>
      <MuzakkiratiApp />
    </PlatformErrorBoundary>
  );
}
