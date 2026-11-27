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
  signInAnonymously,
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
const LOCAL_PACKAGES_KEY = 'el3bakera_packages_backup_v4';
const LOCAL_COUPONS_KEY = 'el3bakera_coupons_backup_v4';

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
  heroMobileImage: '',
  heroOverlayOpacity: 65,
  heroMinHeight: 460,
  heroBadge: 'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة باحترافية ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة بياناتك الخاصة جاهزة للطباعة الفورية.',
  heroPrimaryBtnText: 'تصفح المذكرات الدراسية',
  heroSecondaryBtnText: 'العروض وباقات التوفير',
  heroCustomBtnText: 'اطلب إعداد مذكرة خاصة',
  heroCustomBtnColor: '#facc15',
  showHeroCustomBtn: true,
  promoEnabled: true,
  promoText: 'عرض خاص للمعلمين: خصم 15% على جميع مذكرات الترم + إضافة الشعار مجانًا لفترة محدودة!',
  promoCouponCode: 'OPEN15',
  promoDiscountPercent: 15,
  promoMaxDiscount: 0,
  promoApplyScope: 'all',
  promoTargetNotebookIds: [],
  promoBgColor: '#0f172a',
  promoTextColor: '#ffffff',
  globalAlertsEnabled: true,
  globalAlertsPosition: 'preview_top',
  globalAlertsShowInFullscreen: false,
  previewDetailsPosition: 'above_samples',
  previewDetailsShowInFullscreen: false,
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
  newsSectionBadge: 'قريبًا على المنصة',
  newsSectionTitle: 'أخبار المنصة ومذكرات قيد التجهيز',
  newsItems: [
    {
      id: 'news_1',
      title: 'جاري تجهيز مراجعات ليلة الامتحان النهائية لجميع الصفوف',
      date: 'قريبًا',
      badgeColor: 'amber',
      description: 'يمكنك حجز نسختك المخصصة مسبقًا عبر واتساب ليتم تسليمها فور الصدور.',
      showBookingBtn: true,
      bookingBtnText: 'احجز نسختك مسبقًا عبر واتساب',
      bookingBtnColor: '#0f172a'
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
  nextOrderRewardMaxDiscount: 0,
  nextOrderRewardDays: 7,
  nextOrderRewardPrefix: 'VIP',
  quantityDiscountEnabled: false,
  quantityDiscountMinCount: 2,
  quantityDiscountType: 'fixed',
  quantityDiscountValue: 30,
  quantityDiscountMaxAmount: 0,
  quantityDiscountScope: 'all',
  quantityDiscountNotebookIds: [],
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

function renderSafeNode(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (React.isValidElement(val)) return val;
  if (typeof val === 'string' || typeof val === 'number') return val;
  if (typeof val === 'boolean') return String(val);
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
      (trimmed.startsWith('data:image/') && trimmed.length > 60) ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://')
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
        while (result.length > maxBytes && curWidth > 260) {
          curWidth = Math.round(curWidth * 0.78);
          if (!isPngOrWebp) curQuality = Math.max(0.7, +(curQuality - 0.08).toFixed(2));
          result = renderAttempt();
        }
        if (result.length > maxBytes) {
          const fallbackCanvas = document.createElement('canvas');
          const ratio = img.width > 900 ? 900 / img.width : 1;
          fallbackCanvas.width = Math.round(img.width * ratio);
          fallbackCanvas.height = Math.round(img.height * ratio);
          const fCtx = fallbackCanvas.getContext('2d');
          fCtx.fillStyle = '#ffffff';
          fCtx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
          fCtx.drawImage(img, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
          result = fallbackCanvas.toDataURL('image/jpeg', 0.85);
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

function processHighQualityLogoFile(file, maxWidth = 1800, maxBytes = 820000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const originalDataUrl = ev.target.result;
      const isPngOrWebp = file.type === 'image/png' || file.type === 'image/webp';
      if (typeof originalDataUrl === 'string' && originalDataUrl.length <= maxBytes) {
        resolve(originalDataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        let curWidth = img.width > maxWidth ? maxWidth : img.width;
        let curQuality = 0.94;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const renderAttempt = () => {
          const ratio = img.width > curWidth ? curWidth / img.width : 1;
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return isPngOrWebp
            ? canvas.toDataURL('image/png')
            : canvas.toDataURL('image/jpeg', curQuality);
        };

        let result = renderAttempt();
        while (result.length > maxBytes && curWidth > 450) {
          curWidth = Math.round(curWidth * 0.82);
          if (!isPngOrWebp) curQuality = Math.max(0.75, +(curQuality - 0.06).toFixed(2));
          result = renderAttempt();
        }
        resolve(result);
      };
      img.onerror = reject;
      img.src = originalDataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
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
    detailsPosition: ['default', 'above_samples', 'below_samples', 'hidden'].includes(d.detailsPosition)
      ? d.detailsPosition
      : 'default',
    noticeEnabled: d.noticeEnabled !== false,
    noticeText: notice,
    noticeColor: safeText(d.noticeColor, 'amber'),
    noticePosition: ['top', 'bottom', 'below_details'].includes(d.noticePosition) ? d.noticePosition : 'top',
    noticeShowInFullscreen: Boolean(d.noticeShowInFullscreen),
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

  const [packages, setPackages] = useState(() => {
    try {
      const raw = localStorage.getItem(LOCAL_PACKAGES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [coupons, setCoupons] = useState(() => {
    try {
      const raw = localStorage.getItem(LOCAL_COUPONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
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
  const [customerLogoImage, setCustomerLogoImage] = useState('');
  const [customerLogoText, setCustomerLogoText] = useState('');
  const [uploadingCustomerLogo, setUploadingCustomerLogo] = useState(false);
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
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [customApiKeyInput, setCustomApiKeyInput] = useState('');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [toast, setToast] = useState(null);
  const isPoppingHistoryRef = useRef(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const onResizeViewport = () => setIsMobileViewport(window.innerWidth < 768);
    window.addEventListener('resize', onResizeViewport);
    return () => window.removeEventListener('resize', onResizeViewport);
  }, []);

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
        if (!user) {
          signInAnonymously(auth).catch(() => {});
        }
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
    let latestHeroMobile = '';
    const latestCatImages = {};
    const pkgSourcesMap = { embedded: [], legacy: [], live: [] };
    const cpSourcesMap = { embedded: [], legacy: [], live: [] };

    const syncMergedPackages = () => {
      const merged = new Map();
      [...pkgSourcesMap.embedded, ...pkgSourcesMap.legacy, ...pkgSourcesMap.live].forEach((p) => {
        if (p && p.id) merged.set(p.id, p);
      });
      if (merged.size > 0) {
        const finalList = Array.from(merged.values());
        setPackages(finalList);
        try {
          localStorage.setItem(LOCAL_PACKAGES_KEY, JSON.stringify(finalList));
        } catch {
          // تجاهل
        }
      }
    };

    const syncMergedCoupons = () => {
      const merged = new Map();
      [...cpSourcesMap.embedded, ...cpSourcesMap.legacy, ...cpSourcesMap.live].forEach((c) => {
        if (c && c.id) merged.set(c.id, c);
      });
      if (merged.size > 0) {
        const finalList = Array.from(merged.values());
        setCoupons(finalList);
        try {
          localStorage.setItem(LOCAL_COUPONS_KEY, JSON.stringify(finalList));
        } catch {
          // تجاهل
        }
      }
    };

    const applyCombinedSettings = () => {
      if (latestMainSettings) {
        if (Array.isArray(latestMainSettings.cachedPackages) && latestMainSettings.cachedPackages.length > 0) {
          pkgSourcesMap.embedded = latestMainSettings.cachedPackages;
          syncMergedPackages();
        }
        if (Array.isArray(latestMainSettings.cachedCoupons) && latestMainSettings.cachedCoupons.length > 0) {
          cpSourcesMap.embedded = latestMainSettings.cachedCoupons;
          syncMergedCoupons();
        }
      }
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
          heroMobileImage: latestHeroMobile || base.heroMobileImage || prev.heroMobileImage || '',
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
        const [mainSnap, logoSnap, heroSnap, heroMobileSnap, configSnap, legacyMainSnap, legacyAssetsSnap, allSettingsSnap] =
          await Promise.all([
            getDoc(publicDoc('settings', 'main')).catch(() => null),
            getDoc(publicDoc('settings', 'media_logo')).catch(() => null),
            getDoc(publicDoc('settings', 'media_hero')).catch(() => null),
            getDoc(publicDoc('settings', 'media_hero_mobile')).catch(() => null),
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

        if (heroMobileSnap && heroMobileSnap.exists() && heroMobileSnap.data()?.heroMobileImage) {
          latestHeroMobile = extractImageFromValue(heroMobileSnap.data().heroMobileImage);
        } else if (mainData?.heroMobileImage) {
          latestHeroMobile = extractImageFromValue(mainData.heroMobileImage);
        }

        if (allSettingsSnap) {
          allSettingsSnap.docs.forEach((d) => {
            if (d.id.startsWith('media_cat_')) {
              const cid = d.id.replace('media_cat_', '');
              const imgVal = extractImageFromValue(d.data()?.image);
              if (imgVal) latestCatImages[cid] = imgVal;
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
          } else if (d.id === 'media_hero_mobile' && data.heroMobileImage !== undefined) {
            latestHeroMobile = extractImageFromValue(data.heroMobileImage);
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

    // جلب فوري للباقات والكوبونات من جميع المسارات (حتى بدون مصادقة)
    (async () => {
      try {
        const [pkgSnap, legPkgSnap, cpSnap, legCpSnap] = await Promise.all([
          getDocs(publicCol('packages')).catch(() => null),
          getDocs(legacyPublicCol('packages')).catch(() => null),
          getDocs(publicCol('coupons')).catch(() => null),
          getDocs(legacyPublicCol('coupons')).catch(() => null)
        ]);
        if (legPkgSnap) {
          pkgSourcesMap.legacy = legPkgSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
        if (pkgSnap) {
          pkgSourcesMap.live = pkgSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
        syncMergedPackages();

        if (legCpSnap) {
          cpSourcesMap.legacy = legCpSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
        if (cpSnap) {
          cpSourcesMap.live = cpSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
        syncMergedCoupons();
      } catch {
        // تجاهل
      }
    })();

    const unsubPackages = onSnapshot(
      publicCol('packages'),
      (snap) => {
        pkgSourcesMap.live = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (snap.docs.length === 0) {
          pkgSourcesMap.embedded = [];
          pkgSourcesMap.legacy = [];
          setPackages([]);
          try {
            localStorage.setItem(LOCAL_PACKAGES_KEY, '[]');
          } catch {
            // تجاهل
          }
        } else {
          syncMergedPackages();
        }
      },
      () => {}
    );
    const unsubCoupons = onSnapshot(
      publicCol('coupons'),
      (snap) => {
        cpSourcesMap.live = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (snap.docs.length === 0) {
          cpSourcesMap.embedded = [];
          cpSourcesMap.legacy = [];
          setCoupons([]);
          try {
            localStorage.setItem(LOCAL_COUPONS_KEY, '[]');
          } catch {
            // تجاهل
          }
        } else {
          syncMergedCoupons();
        }
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

  // حساب خصم الكميات التلقائي عند شراء أكثر من مذكرة
  const quantityDiscountInfo = useMemo(() => {
    if (!settings.quantityDiscountEnabled || cart.length === 0) {
      return { amount: 0, eligibleCount: 0, remainingToQualify: 0, minCount: 2 };
    }
    const minCount = Math.max(2, Number(settings.quantityDiscountMinCount) || 2);
    const scope = settings.quantityDiscountScope || 'all';
    const targetIds = Array.isArray(settings.quantityDiscountNotebookIds) ? settings.quantityDiscountNotebookIds : [];

    let eligibleCount = 0;
    let eligibleSubtotal = 0;

    cart.forEach((item) => {
      const isPackage = String(item.id || '').startsWith('pkg_');
      if (isPackage) return;
      const isIncluded = scope === 'all' || targetIds.includes(item.id);
      if (isIncluded) {
        const qty = Number(item.qty) || 1;
        eligibleCount += qty;
        eligibleSubtotal += (Number(item.price) || 0) * qty;
      }
    });

    if (eligibleCount < minCount || eligibleSubtotal <= 0) {
      return {
        amount: 0,
        eligibleCount,
        remainingToQualify: eligibleCount > 0 ? Math.max(0, minCount - eligibleCount) : minCount,
        minCount
      };
    }

    const dType = settings.quantityDiscountType || 'fixed';
    const dVal = Number(settings.quantityDiscountValue) || 0;
    let discount = dType === 'percent' ? Math.round((eligibleSubtotal * dVal) / 100) : dVal;
    const maxCap = Number(settings.quantityDiscountMaxAmount) || 0;
    if (maxCap > 0) discount = Math.min(discount, maxCap);
    discount = Math.min(eligibleSubtotal, Math.max(0, discount));

    return { amount: discount, eligibleCount, remainingToQualify: 0, minCount };
  }, [
    cart,
    settings.quantityDiscountEnabled,
    settings.quantityDiscountMinCount,
    settings.quantityDiscountType,
    settings.quantityDiscountValue,
    settings.quantityDiscountMaxAmount,
    settings.quantityDiscountScope,
    settings.quantityDiscountNotebookIds
  ]);

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon || cartSubtotal <= 0) return 0;

    // تحديد المجموع الخاضع للخصم حسب نطاق الكوبون (الكل / مذكرات محددة / استثناء مذكرات)
    const scope = appliedCoupon.applyScope || 'all';
    const targetIds = Array.isArray(appliedCoupon.targetNotebookIds) ? appliedCoupon.targetNotebookIds : [];

    const eligibleSubtotal = cart.reduce((sum, item) => {
      const itemTotal = (Number(item.price) || 0) * (item.qty || 1);
      if (scope === 'include') {
        return targetIds.includes(item.id) ? sum + itemTotal : sum;
      }
      if (scope === 'exclude') {
        return !targetIds.includes(item.id) ? sum + itemTotal : sum;
      }
      return sum + itemTotal;
    }, 0);

    if (eligibleSubtotal <= 0) return 0;
    if (appliedCoupon.minOrder && eligibleSubtotal < Number(appliedCoupon.minOrder)) return 0;

    let discount = 0;
    if (appliedCoupon.type === 'fixed') {
      discount = Math.min(eligibleSubtotal, Number(appliedCoupon.value) || 0);
    } else {
      discount = Math.round((eligibleSubtotal * (Number(appliedCoupon.value) || 0)) / 100);
    }
    const maxCap = Number(appliedCoupon.maxDiscount) || 0;
    if (maxCap > 0) {
      discount = Math.min(discount, maxCap);
    }
    return Math.min(eligibleSubtotal, discount);
  }, [appliedCoupon, cartSubtotal, cart]);

  const cartFinalTotal = Math.max(0, cartSubtotal - quantityDiscountInfo.amount - couponDiscountAmount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    let candidateCoupon = null;
    if (settings.promoEnabled && settings.promoCouponCode && code === settings.promoCouponCode.trim().toUpperCase()) {
      candidateCoupon = {
        code,
        type: 'percent',
        value: Number(settings.promoDiscountPercent) || 15,
        maxDiscount: Number(settings.promoMaxDiscount) || 0,
        applyScope: settings.promoApplyScope || 'all',
        targetNotebookIds: Array.isArray(settings.promoTargetNotebookIds) ? settings.promoTargetNotebookIds : [],
        minOrder: 0
      };
    } else {
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
      candidateCoupon = found;
    }

    const scope = candidateCoupon.applyScope || 'all';
    const targetIds = Array.isArray(candidateCoupon.targetNotebookIds) ? candidateCoupon.targetNotebookIds : [];
    const eligibleSubtotal = cart.reduce((sum, item) => {
      const itemTotal = (Number(item.price) || 0) * (item.qty || 1);
      if (scope === 'include') return targetIds.includes(item.id) ? sum + itemTotal : sum;
      if (scope === 'exclude') return !targetIds.includes(item.id) ? sum + itemTotal : sum;
      return sum + itemTotal;
    }, 0);

    if (eligibleSubtotal <= 0) {
      showToast(
        scope === 'include'
          ? 'هذا الكوبون مخصص لمذكرات محددة غير موجودة في سلتك الحالية.'
          : 'المذكرات الموجودة في سلتك مستثناة من هذا الكوبون.',
        'error'
      );
      return;
    }

    if (candidateCoupon.minOrder && eligibleSubtotal < Number(candidateCoupon.minOrder)) {
      showToast(`الحد الأدنى للمذكرات المشمولة بهذا الكوبون هو ${candidateCoupon.minOrder} ج.م.`, 'error');
      return;
    }

    setAppliedCoupon(candidateCoupon);
    showToast(`تم تطبيق كوبون ${candidateCoupon.code} بنجاح!`);
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
          maxDiscount: Number(settings.nextOrderRewardMaxDiscount) || 0,
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
        customerLogoText: customerLogoText.trim(),
        customerLogoImage: customerLogoImage || '',
        hasLogoImage: Boolean(customerLogoImage),
        items: cart.map((i) => ({ id: i.id, title: i.title, price: i.price, qty: i.qty || 1 })),
        subtotal: cartSubtotal,
        quantityDiscount: quantityDiscountInfo.amount,
        discount: couponDiscountAmount + quantityDiscountInfo.amount,
        couponCode: appliedCoupon?.code || '',
        total: cartFinalTotal,
        rewardCoupon: generatedRewardCode,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      if (db) {
        let savedOrderSuccess = false;
        try {
          await addDoc(publicCol('orders'), orderDoc);
          savedOrderSuccess = true;
        } catch {
          // في حال تجاوز حجم المستند الحد المسموح، نضغط الشعار قليلًا ونعيد المحاولة فورًا
          const lighterLogo = orderDoc.customerLogoImage
            ? await shrinkDataUrlIfNeeded(orderDoc.customerLogoImage, 240000)
            : '';
          await addDoc(publicCol('orders'), {
            ...orderDoc,
            customerLogoImage: lighterLogo,
            hasLogoImage: Boolean(lighterLogo)
          });
          savedOrderSuccess = true;
        }
        if (savedOrderSuccess && customerLogoImage) {
          await setDoc(
            publicDoc('order_logos', orderCode),
            {
              orderCode,
              image: customerLogoImage,
              teacherName: safeText(customerForm.teacherName),
              createdAt: serverTimestamp()
            },
            { merge: true }
          ).catch(() => {});
        }
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
      setCustomerLogoImage('');
      setCustomerLogoText('');

      const waNum = String(settings.whatsappNumber || '201000000000').replace(/[^0-9]/g, '');
      const itemsLines = orderDoc.items.map((it, idx) => `${idx + 1}. ${it.title} (${it.price} ج.م)`).join('\n');
      const customFieldsLines = (settings.checkoutFields || [])
        .filter((f) => f && f.enabled !== false && f.id !== 'logo' && f.type !== 'file')
        .map((f) => {
          const val = safeText(customerForm[f.id]).trim();
          return val ? `${f.label}: ${val}` : '';
        })
        .filter(Boolean);

      const waText = [
        `السلام عليكم، طلب جديد من ${settings.platformName}`,
        `رقم الطلب: ${orderCode}`,
        ...customFieldsLines,
        customerLogoText.trim() ? `نص شعار المعلم: ${customerLogoText.trim()}` : '',
        orderDoc.hasLogoImage ? `صورة الشعار: مرفقة بالجودة الكاملة داخل الطلب (${orderCode})` : '',
        `--- المذكرات المطلوبة ---`,
        itemsLines,
        `الإجمالي النهائي: ${cartFinalTotal} ج.م`
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
    const rawList = samplesMap[previewNotebook.id] || previewNotebook.inlineSamples || [];
    const validList = rawList.map((item) => extractImageFromValue(item)).filter(Boolean);
    if (validList.length > 0) return validList;
    const validCover = extractImageFromValue(previewNotebook.coverImage);
    return validCover ? [validCover] : [];
  }, [previewNotebook, samplesMap]);

  useEffect(() => {
    if (previewPageIdx >= previewSamplesList.length && previewSamplesList.length > 0) {
      setPreviewPageIdx(0);
    }
  }, [previewPageIdx, previewSamplesList.length]);

  const previewGlobalNotices = useMemo(() => {
    if (!previewNotebook || settings.globalAlertsEnabled === false) return [];
    const items = [];
    (settings.globalAlerts || []).forEach((al) => {
      if (al && al.active !== false && safeText(al.text).trim()) {
        items.push({ text: safeText(al.text).trim(), color: safeText(al.color, 'amber') });
      }
    });
    return items;
  }, [previewNotebook, settings.globalAlertsEnabled, settings.globalAlerts]);

  const previewNotebookNotice = useMemo(() => {
    if (!previewNotebook || previewNotebook.noticeEnabled === false) return null;
    const nbNotice = previewNotebook.noticeText || fetchedSampleNotices[previewNotebook.id] || '';
    if (!nbNotice) return null;
    return [{ text: nbNotice, color: previewNotebook.noticeColor || 'amber' }];
  }, [previewNotebook, fetchedSampleNotices]);

  const overlayAlpha = Math.min(0.95, Math.max(0.1, Number(settings.heroOverlayOpacity ?? 65) / 100));
  const activeHeroBg =
    isMobileViewport && settings.heroMobileImage ? settings.heroMobileImage : settings.heroImage;

  const topHeaderRef = useRef(null);
  const [topHeaderHeight, setTopHeaderHeight] = useState(88);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (topHeaderRef.current) {
        setTopHeaderHeight(topHeaderRef.current.offsetHeight || 0);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    const timer = setTimeout(updateHeaderHeight, 150);
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      clearTimeout(timer);
    };
  }, [settings.promoEnabled, settings.promoText, settings.platformName, settings.platformTagline, isAdmin, cart.length]);

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

      {/* حاوية مثبتة دائمًا بالأعلى تجمع الشريط الإعلاني والهيدر بشكل مضغوط وعصري */}
      <div ref={topHeaderRef} className="fixed top-0 right-0 left-0 z-40 w-full shadow-md">
        {/* الشريط الإعلاني العلوي المضغوط */}
        {settings.promoEnabled !== false && settings.promoText && (
          <div
            style={{
              backgroundColor: settings.promoBgColor || '#0f172a',
              color: settings.promoTextColor || '#ffffff'
            }}
            className="w-full px-2.5 sm:px-4 py-1 sm:py-1.5 text-center text-[11px] sm:text-xs font-black flex items-center justify-center gap-1.5 sm:gap-2"
          >
            <span className="truncate max-w-[68vw] sm:max-w-none">{safeText(settings.promoText)}</span>
            {settings.promoCouponCode && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(settings.promoCouponCode);
                  showToast(`تم نسخ كود الخصم: ${settings.promoCouponCode}`);
                }}
                className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black shadow hover:bg-amber-300 transition shrink-0"
              >
                {settings.promoCouponCode}
              </button>
            )}
          </div>
        )}

        {/* الهيدر الرئيسي الرشيق والمتجاوب */}
        <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-3">
            {/* الصف العلوي: الشعار واسم المنصة الكامل + أزرار التواصل والسلة */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div
                onClick={handleLogoSecretClick}
                className="flex items-center gap-2.5 cursor-pointer select-none min-w-0 flex-1"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 border border-amber-400/60 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                  {settings.logoImage ? (
                    <img src={settings.logoImage} alt={settings.platformName} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-[13px] sm:text-lg font-black text-slate-900 leading-snug line-clamp-1">
                    {safeText(settings.platformName)}
                  </h1>
                  {settings.platformTagline && (
                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold truncate">
                      {safeText(settings.platformTagline)}
                    </p>
                  )}
                </div>
              </div>

              {/* أزرار سريعة على الهاتف (أيقونات أنيقة مدمجة) */}
              <div className="flex lg:hidden items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(true)}
                  aria-label="تواصل معنا"
                  className="h-9 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>تواصل</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  aria-label="السلة"
                  className="relative h-9 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black flex items-center gap-1 shadow-sm"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                  <span>السلة</span>
                  {cart.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                      {cart.reduce((s, i) => s + (i.qty || 1), 0)}
                    </span>
                  )}
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setActiveView('admin')}
                    className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                      activeView === 'admin' ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-950'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* شريط التنقل المتناسق (شبكة متساوية العرض على الهاتف) */}
            <nav className="grid grid-cols-4 lg:flex items-center gap-1.5 bg-slate-100/90 lg:bg-transparent p-1 lg:p-0 rounded-2xl border border-slate-200/70 lg:border-0">
              <button
                type="button"
                onClick={() => {
                  setActiveView('home');
                  setSelectedCategoryId('');
                  setSelectedStageId('');
                  setSelectedGradeId('');
                }}
                className={`py-1.5 px-2 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-sm font-black text-center transition ${
                  activeView === 'home' ? `${theme.primaryBg} text-white shadow-sm` : 'text-slate-700 hover:bg-white/80'
                }`}
              >
                الرئيسية
              </button>

              <button
                type="button"
                onClick={() => setActiveView('library')}
                className={`py-1.5 px-2 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-sm font-black text-center transition ${
                  activeView === 'library' ? `${theme.primaryBg} text-white shadow-sm` : 'text-slate-700 hover:bg-white/80'
                }`}
              >
                المذكرات
              </button>

              <button
                type="button"
                onClick={() => setActiveView('offers')}
                className={`py-1.5 px-2 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-sm font-black text-center transition ${
                  activeView === 'offers' ? `${theme.primaryBg} text-white shadow-sm` : 'text-slate-700 hover:bg-white/80'
                }`}
              >
                العروض
              </button>

              <button
                type="button"
                onClick={() => setActiveView('track')}
                className={`py-1.5 px-2 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-sm font-black text-center transition ${
                  activeView === 'track' ? `${theme.primaryBg} text-white shadow-sm` : 'text-slate-700 hover:bg-white/80'
                }`}
              >
                تتبع طلبك
              </button>

              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="hidden lg:flex px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black items-center gap-1.5 shadow-sm transition whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تواصل معنا</span>
              </button>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="hidden lg:flex relative px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black items-center gap-1.5 shadow-sm transition whitespace-nowrap"
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
                  className={`hidden lg:flex px-3.5 py-2 rounded-xl text-sm font-black items-center gap-1.5 transition whitespace-nowrap ${
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
      </div>

      {/* فاصل علوي يساوي ارتفاع الهيدر المثبّت حتى لا يختفي أي محتوى تحته */}
      <div style={{ height: `${topHeaderHeight || 88}px` }} className="w-full shrink-0" />

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
            {/* الواجهة الرئيسية (Hero) — الخلفية مدمجة خلف المحتوى مباشرة على الهاتف والكمبيوتر */}
            <section
              style={{
                minHeight: isMobileViewport ? 'auto' : `${Number(settings.heroMinHeight) || 460}px`,
                backgroundImage: activeHeroBg ? `url(${activeHeroBg})` : undefined
              }}
              className="relative bg-slate-950 bg-cover bg-center bg-no-repeat text-white flex items-center overflow-hidden"
            >
              <div
                style={{ backgroundColor: `rgba(11, 20, 42, ${activeHeroBg ? overlayAlpha : 0.96})` }}
                className="absolute inset-0"
              />
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                  {settings.heroBadge && (
                    <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-black">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>{safeText(settings.heroBadge)}</span>
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-snug sm:leading-tight">
                    {safeText(settings.heroTitle)}
                  </h2>
                  <p className="text-xs sm:text-base text-slate-200 font-bold leading-relaxed max-w-2xl">
                    {safeText(settings.heroSubtitle)}
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveView('library')}
                      className={`px-6 py-3.5 rounded-2xl ${theme.primaryBg} text-white text-sm font-black shadow-lg transition text-center`}
                    >
                      {safeText(settings.heroPrimaryBtnText, 'تصفح المذكرات الدراسية')}
                    </button>
                    <div className="grid grid-cols-2 sm:flex gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveView('offers')}
                        className="px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs sm:text-sm font-black backdrop-blur transition text-center"
                      >
                        {safeText(settings.heroSecondaryBtnText, 'العروض والباقات')}
                      </button>
                      {settings.showHeroCustomBtn !== false && (
                        <button
                          type="button"
                          onClick={() => setContactModalOpen(true)}
                          style={{ backgroundColor: settings.heroCustomBtnColor || '#facc15' }}
                          className="px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl hover:opacity-95 text-slate-950 text-xs sm:text-sm font-black shadow-lg transition text-center"
                        >
                          {safeText(settings.heroCustomBtnText, 'اطلب إعداد مذكرة خاصة')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* بطاقة لماذا يثق بنا المعلمون */}
                <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-2xl">
                  <div className="flex items-center gap-2 sm:gap-2.5 text-amber-400 font-black text-sm sm:text-lg">
                    <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                    <h3>{safeText(settings.trustTitle, 'لماذا يثق بنا المعلمون؟')}</h3>
                  </div>
                  <ul className="space-y-2 sm:space-y-3">
                    {(settings.trustPoints || []).map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm text-slate-100 font-bold leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-1" />
                        <span>{safeText(pt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* الأقسام الدراسية الرئيسية في الصفحة الرئيسية */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">تصفح الأقسام الدراسية</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold">اختر القسم الدراسي لعرض المراحل والصفوف والمذكرات</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('');
                    setSelectedStageId('');
                    setSelectedGradeId('');
                    setActiveView('library');
                  }}
                  className="text-xs sm:text-sm font-black text-blue-600 hover:underline"
                >
                  عرض جميع المذكرات ({visibleNotebooks.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(settings.categories || []).map((cat) => {
                  const catCount = countNotebooksInCategory(cat);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSelectedStageId('');
                        setSelectedGradeId('');
                        setActiveView('library');
                      }}
                      className="group bg-white rounded-3xl border border-slate-200 hover:border-blue-400 overflow-hidden shadow-sm hover:shadow-xl cursor-pointer transition flex flex-col justify-between"
                    >
                      <div className="relative h-44 bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center overflow-hidden">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <BookOpen className="w-12 h-12 text-amber-400/90" />
                        )}
                      </div>
                      <div className="p-5 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-slate-900">{safeText(cat.name)}</h3>
                          <p className="text-xs text-slate-500 font-bold mt-0.5">{catCount} مذكرة متاحة</p>
                        </div>
                        <span className={`px-3.5 py-2 rounded-xl ${theme.primaryBg} text-white text-xs font-black`}>
                          تصفح
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* قسم ما الجديد؟ أحدث المذكرات */}
            {settings.whatsNewEnabled !== false && whatsNewNotebooks.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      {safeText(settings.whatsNewTitle, 'ما الجديد؟ أحدث المذكرات والإصدارات')}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView('library')}
                    className="text-xs sm:text-sm font-black text-blue-600 hover:underline"
                  >
                    عرض الكل
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

            {/* قسم الإعلان عن القادم وأخبار المنصة */}
            {settings.newsSectionEnabled !== false && Array.isArray(settings.newsItems) && settings.newsItems.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {safeText(settings.newsSectionBadge, 'قريبًا على المنصة') && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{safeText(settings.newsSectionBadge, 'قريبًا على المنصة')}</span>
                      </span>
                    )}
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      {safeText(settings.newsSectionTitle, 'أخبار المنصة ومذكرات قيد التجهيز')}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {settings.newsItems.map((item, idx) => {
                    const badgePalette = {
                      amber: 'bg-amber-400 text-slate-950',
                      blue: 'bg-blue-600 text-white',
                      emerald: 'bg-emerald-600 text-white',
                      rose: 'bg-rose-600 text-white'
                    }[item.badgeColor || 'amber'] || 'bg-amber-400 text-slate-950';
                    const showBtn = item.showBookingBtn !== false;
                    return (
                      <div
                        key={item.id || idx}
                        className="bg-white rounded-3xl border border-amber-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            {safeText(item.date) && (
                              <span className={`px-3 py-1 rounded-full text-xs font-black ${badgePalette}`}>
                                {safeText(item.date)}
                              </span>
                            )}
                            <Sparkles className="w-4 h-4 text-amber-500 mr-auto" />
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                            {safeText(item.title)}
                          </h3>
                          {item.description && (
                            <p className="text-xs sm:text-sm text-slate-600 font-bold leading-relaxed">
                              {safeText(item.description)}
                            </p>
                          )}
                        </div>

                        {showBtn && (
                          <div className="pt-3 border-t border-slate-100">
                            <a
                              href={`https://wa.me/${String(settings.whatsappNumber || '201000000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `السلام عليكم، أرغب في الاستفسار أو الحجز المسبق بخصوص: ${safeText(item.title)}`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ backgroundColor: item.bookingBtnColor || '#0f172a' }}
                              className="w-full py-2.5 rounded-2xl hover:opacity-95 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition"
                            >
                              <MessageCircle className="w-4 h-4 text-emerald-400" />
                              <span>{safeText(item.bookingBtnText, 'احجز نسختك مسبقًا عبر واتساب')}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* بنر طلب مذكرة مخصصة */}
            {settings.customBannerEnabled !== false && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="rounded-3xl bg-gradient-to-l from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center lg:text-right max-w-2xl">
                    <h2 className="text-xl sm:text-2xl font-black">
                      {safeText(settings.customBannerTitle, 'هل تحتاج مذكرة بتصميم خاص أو منهج مخصص؟')}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 font-bold leading-relaxed">
                      {safeText(
                        settings.customBannerSubtitle,
                        'فريقنا جاهز لتنسيق وإعداد مذكرتك الخاصة من الصفر باسمك وشعارك وألوانك المفضلة بأعلى جودة للطباعة.'
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(true)}
                    className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black shadow-lg shrink-0 transition"
                  >
                    {safeText(settings.customBannerBtnText, 'اطلب مذكرة مخصصة الآن')}
                  </button>
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
          /* صفحة العروض وباقات التوفير بتصميم احترافي متطور */
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* ترويسة الصفحة الفخمة */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-2.5 max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-black">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>خصومات حصرية وباقات مجمّعة للمعلمين</span>
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                    العروض وباقات التوفير الحصرية
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 font-bold leading-relaxed">
                    وفّر أكثر عند طلب الباقات الشاملة لجميع الصفوف، مع إمكانية معاينة كل مذكرة داخل الباقة وتطبيق كوبونات الخصم داخل السلة.
                  </p>
                </div>

                {/* عرض الكوبونات النشطة للنسخ الفوري */}
                {(() => {
                  const activeCouponsList = [
                    ...(settings.promoEnabled !== false && settings.promoCouponCode
                      ? [
                          {
                            id: 'promo_top',
                            code: settings.promoCouponCode.trim().toUpperCase(),
                            label: `خصم ${settings.promoDiscountPercent || 15}%`
                          }
                        ]
                      : []),
                    ...coupons
                      .filter(
                        (c) =>
                          c.active !== false &&
                          (!c.expiresAt || Date.parse(c.expiresAt) >= Date.now()) &&
                          c.code?.trim().toUpperCase() !== settings.promoCouponCode?.trim().toUpperCase()
                      )
                      .map((c) => ({
                        id: c.id,
                        code: c.code,
                        label: `خصم ${c.value}${c.type === 'fixed' ? ' ج.م' : '%'}`
                      }))
                  ];
                  if (activeCouponsList.length === 0) return null;
                  return (
                    <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-2 shrink-0">
                      <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span>أكواد خصم فعّالة (اضغط للنسخ):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeCouponsList.map((cp) => (
                          <button
                            key={cp.id}
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(cp.code);
                              showToast(`تم نسخ كود الخصم: ${cp.code}`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow transition"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{cp.code}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-950/15 text-[10px]">{cp.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {packages.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm sm:text-base font-black text-slate-700">لا توجد باقات مضافة حاليًا.</p>
                <p className="text-xs text-slate-500 font-bold">يمكنك تصفح مكتبة المذكرات الفردية والاستفادة من كوبونات الخصم.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {packages.map((pkg) => {
                  const hasOld = Number(pkg.oldPrice) > Number(pkg.price) && Number(pkg.oldPrice) > 0;
                  const saved = hasOld ? Number(pkg.oldPrice) - Number(pkg.price) : 0;
                  const savedPct = hasOld ? Math.round((saved / Number(pkg.oldPrice)) * 100) : 0;
                  const includedNotebooks = Array.isArray(pkg.notebookIds)
                    ? pkg.notebookIds.map((nid) => notebooks.find((n) => n.id === nid)).filter(Boolean)
                    : [];

                  return (
                    <div
                      key={pkg.id}
                      className="group bg-white rounded-3xl border-2 border-slate-200/90 hover:border-amber-400 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* شريط علوي ملكي للباقة */}
                        <div className="bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 px-5 py-3.5 text-white flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow">
                              <Package className="w-4 h-4" />
                            </div>
                            <span className="text-xs sm:text-sm font-black text-amber-300">
                              باقة توفير شاملة • {includedNotebooks.length} مذكرات
                            </span>
                          </div>
                          {saved > 0 && (
                            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black shadow">
                              وفّر {saved} ج.م ({savedPct}%)
                            </span>
                          )}
                        </div>

                        <div className="p-5 sm:p-6 space-y-4">
                          {/* عنوان ووصف الباقة */}
                          <div className="space-y-1.5">
                            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                              {safeText(pkg.title)}
                            </h3>
                            {pkg.description && (
                              <p className="text-xs sm:text-sm text-slate-600 font-bold leading-relaxed">
                                {safeText(pkg.description)}
                              </p>
                            )}
                          </div>

                          {/* شبكة بطاقات أغلفة المذكرات المشمولة داخل الباقة */}
                          {includedNotebooks.length > 0 && (
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between text-xs font-black text-slate-800 px-1">
                                <span className="flex items-center gap-1.5">
                                  <BookOpen className="w-4 h-4 text-blue-600" />
                                  <span>محتويات الباقة (اضغط على أي مذكرة لمعاينة عيناتها):</span>
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px]">
                                  {includedNotebooks.length} مذكرات
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {includedNotebooks.map((foundNb, idx) => (
                                  <div
                                    key={`${foundNb.id}_${idx}`}
                                    onClick={() => {
                                      setPreviewNotebook(foundNb);
                                      setPreviewPageIdx(0);
                                      setPreviewZoom(1);
                                    }}
                                    className="group/item rounded-2xl border border-slate-200 hover:border-blue-500 bg-white shadow-sm hover:shadow-lg overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between"
                                  >
                                    {/* اسم المذكرة أعلى الغلاف بتصميم احترافي واضح */}
                                    <div className="px-2.5 py-2 bg-gradient-to-l from-slate-900 to-blue-950 text-white border-b border-slate-800">
                                      <div className="flex items-start gap-1.5">
                                        <span className="w-4 h-4 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                          {idx + 1}
                                        </span>
                                        <h4 className="text-[11px] sm:text-xs font-black leading-snug line-clamp-2">
                                          {foundNb.title}
                                        </h4>
                                      </div>
                                    </div>

                                    {/* صورة الغلاف مع تأثير المعاينة */}
                                    <div className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                                      {foundNb.coverImage ? (
                                        <img
                                          src={foundNb.coverImage}
                                          alt={foundNb.title}
                                          loading="lazy"
                                          className="w-full h-full object-cover group-hover/item:scale-105 transition duration-500"
                                        />
                                      ) : (
                                        <BookOpen className="w-8 h-8 text-slate-400" />
                                      )}

                                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent flex flex-col justify-end p-2">
                                        <div className="flex items-center justify-between gap-1">
                                          {foundNb.pagesCount ? (
                                            <span className="px-2 py-0.5 rounded-md bg-white/90 text-slate-900 text-[10px] font-black">
                                              {foundNb.pagesCount} ص
                                            </span>
                                          ) : (
                                            <span />
                                          )}
                                          <span className="px-2 py-1 rounded-lg bg-blue-600 group-hover/item:bg-amber-400 text-white group-hover/item:text-slate-950 text-[10px] font-black flex items-center gap-1 shadow transition">
                                            <Eye className="w-3 h-3" />
                                            <span>معاينة</span>
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* شريط السعر وزر الإضافة للسلة */}
                      <div className="px-5 sm:px-6 py-4 bg-gradient-to-l from-slate-50 to-blue-50/40 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-bold text-slate-500">سعر الباقة بالكامل:</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-blue-600">{pkg.price} ج.م</span>
                            {hasOld && (
                              <span className="text-sm text-slate-400 line-through font-bold">
                                {pkg.oldPrice} ج.م
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            addToCart({ id: `pkg_${pkg.id}`, title: `باقة: ${pkg.title}`, price: pkg.price })
                          }
                          className={`px-6 py-3.5 rounded-2xl ${theme.primaryBg} text-white text-xs sm:text-sm font-black shadow-lg flex items-center justify-center gap-2 transition shrink-0`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>أضف الباقة للسلة</span>
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
      {previewNotebook && (() => {
        const showGlobalInThisView =
          previewGlobalNotices.length > 0 &&
          (!previewFullscreen || settings.globalAlertsShowInFullscreen);
        const showNbNoticeInThisView =
          previewNotebookNotice &&
          (!previewFullscreen || previewNotebook.noticeShowInFullscreen);
        const nbCustomDetailsPos =
          previewNotebook.detailsPosition && previewNotebook.detailsPosition !== 'default'
            ? previewNotebook.detailsPosition
            : settings.previewDetailsPosition || 'above_samples';
        const showDetailsInThisView =
          nbCustomDetailsPos !== 'hidden' &&
          (!previewFullscreen || settings.previewDetailsShowInFullscreen);
        const detailsPos = nbCustomDetailsPos;

        const detailsBlock = showDetailsInThisView && (
          <div className="px-3.5 sm:px-5 py-2.5 bg-white border-b border-slate-200/80 space-y-1.5 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {previewNotebook.badgeText && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
                  {safeText(previewNotebook.badgeText)}
                </span>
              )}
              {previewNotebook.subject && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                  المادة: {safeText(previewNotebook.subject)}
                </span>
              )}
              {previewNotebook.pagesCount && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                  عدد الصفحات: {safeText(previewNotebook.pagesCount)} صفحة
                </span>
              )}
            </div>
            {previewNotebook.subtitle && (
              <p className="text-xs sm:text-sm text-slate-700 font-bold leading-relaxed">
                {safeText(previewNotebook.subtitle)}
              </p>
            )}
          </div>
        );

        return (
          <div
            className={`fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center ${
              previewFullscreen ? 'p-0' : 'p-2 sm:p-4'
            }`}
          >
            <div
              className={`bg-white w-full flex flex-col overflow-hidden shadow-2xl ${
                previewFullscreen ? 'h-full rounded-none' : 'max-w-4xl max-h-[92vh] rounded-3xl'
              }`}
            >
              {/* رأس نافذة المعاينة */}
              <div className="bg-slate-900 text-white px-3.5 sm:px-5 py-3 flex items-center justify-between gap-2 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black truncate">{safeText(previewNotebook.title)}</h3>
                  <p className="text-[11px] text-slate-300 font-bold">
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
                  <span className="text-xs font-black px-1">{Math.round(previewZoom * 100)}%</span>
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
                    title={previewFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}
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

              {/* منطقة التمرير الكاملة */}
              <div className="flex-1 overflow-y-auto bg-slate-100 flex flex-col">
                {showGlobalInThisView && settings.globalAlertsPosition !== 'preview_bottom' && (
                  <UnifiedNoticeBox items={previewGlobalNotices} compact />
                )}

                {showNbNoticeInThisView && previewNotebook.noticePosition === 'top' && (
                  <UnifiedNoticeBox items={previewNotebookNotice} compact />
                )}

                {detailsPos === 'above_samples' && detailsBlock}

                {showNbNoticeInThisView && previewNotebook.noticePosition === 'below_details' && (
                  <UnifiedNoticeBox items={previewNotebookNotice} compact />
                )}

                {/* عارض صفحة العينة كاملة */}
                <div
                  onTouchStart={(e) => {
                    touchStartXRef.current = e.touches?.[0]?.clientX ?? null;
                  }}
                  onTouchEnd={(e) => {
                    if (touchStartXRef.current === null || previewSamplesList.length <= 1) return;
                    const endX = e.changedTouches?.[0]?.clientX ?? touchStartXRef.current;
                    const diff = touchStartXRef.current - endX;
                    if (Math.abs(diff) > 40) {
                      if (diff > 0) {
                        setPreviewPageIdx((p) => (p + 1) % previewSamplesList.length);
                      } else {
                        setPreviewPageIdx((p) => (p - 1 + previewSamplesList.length) % previewSamplesList.length);
                      }
                    }
                    touchStartXRef.current = null;
                  }}
                  className="relative flex-1 min-h-[340px] flex items-center justify-center p-2 sm:p-4 bg-slate-200/70 overflow-auto"
                >
                  {loadingSamples && previewSamplesList.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 text-slate-600">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="text-xs font-black">جاري تحميل صفحات العينة...</span>
                    </div>
                  ) : previewSamplesList.length > 0 ? (
                    <img
                      src={previewSamplesList[previewPageIdx] || previewSamplesList[0]}
                      alt={`صفحة ${previewPageIdx + 1}`}
                      style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top center' }}
                      className="w-auto h-auto max-w-full max-h-[65vh] sm:max-h-[72vh] object-contain rounded-xl shadow-lg bg-white transition-transform duration-200"
                    />
                  ) : (
                    <div className="text-center text-slate-500 space-y-2 py-12">
                      <BookOpen className="w-10 h-10 mx-auto text-slate-400" />
                      <p className="text-xs font-black">لا توجد صور عينات مرفوعة لهذه المذكرة حاليًا.</p>
                    </div>
                  )}

                  {previewSamplesList.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewPageIdx((p) => (p - 1 + previewSamplesList.length) % previewSamplesList.length)
                        }
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewPageIdx((p) => (p + 1) % previewSamplesList.length)}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {detailsPos === 'below_samples' && detailsBlock}

                {showNbNoticeInThisView && previewNotebook.noticePosition === 'bottom' && (
                  <UnifiedNoticeBox items={previewNotebookNotice} compact />
                )}

                {showGlobalInThisView && settings.globalAlertsPosition === 'preview_bottom' && (
                  <UnifiedNoticeBox items={previewGlobalNotices} compact />
                )}
              </div>

              {/* الشريط السفلي للطلب ورابط Drive */}
              {!previewFullscreen && (
                <div className="bg-white border-t border-slate-200 px-3.5 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-black text-blue-600">{previewNotebook.price} ج.م</span>
                    {Number(previewNotebook.oldPrice) > Number(previewNotebook.price) && (
                      <span className="text-xs text-slate-400 line-through font-bold">
                        {previewNotebook.oldPrice} ج.م
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {previewNotebook.driveLink && (
                      <a
                        href={previewNotebook.driveLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ backgroundColor: previewNotebook.driveBtnColor || '#059669' }}
                        className="px-3.5 py-2.5 rounded-2xl text-white text-xs font-black flex items-center gap-1.5 shadow"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>معاينة PDF على Drive</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(previewNotebook);
                        setPreviewNotebook(null);
                      }}
                      className={`px-4 py-2.5 rounded-2xl ${theme.primaryBg} text-white text-xs sm:text-sm font-black shadow`}
                    >
                      اطلب المذكرة الآن
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* نافذة سلة الطلبات الجانبية */}
      {/* ===================================================================== */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black">سلة المشتريات وإتمام الطلب</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  setLastCreatedOrder(null);
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {lastCreatedOrder ? (
                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-lg font-black text-emerald-950">تم تسجيل طلبك بنجاح!</h4>
                  <p className="text-xs sm:text-sm text-emerald-800 font-bold">{safeText(settings.orderSuccessMessage)}</p>
                  <div className="p-3 rounded-2xl bg-white border border-emerald-200 text-sm font-black text-slate-900">
                    رقم الطلب: {safeText(lastCreatedOrder.orderCode)}
                  </div>
                  {lastCreatedOrder.rewardCoupon && (
                    <div className="p-3 rounded-2xl bg-amber-100 border border-amber-300 text-xs font-black text-amber-950">
                      هدية لطلبك القادم! كود خصم {settings.nextOrderRewardPercent || 15}%: {lastCreatedOrder.rewardCoupon}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setLastCreatedOrder(null);
                      setCartOpen(false);
                    }}
                    className="w-full py-3 rounded-2xl bg-slate-900 text-white text-sm font-black"
                  >
                    العودة للمنصة
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-black text-slate-600">سلة الطلبات فارغة حاليًا.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-slate-900 truncate">{safeText(item.title)}</div>
                          <div className="text-xs text-blue-600 font-black">{Number(item.price) || 0} ج.م</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setCart((prev) =>
                                prev
                                  .map((x) => (x.id === item.id ? { ...x, qty: (x.qty || 1) - 1 } : x))
                                  .filter((x) => (x.qty || 1) > 0)
                              )
                            }
                            className="p-1.5 rounded-lg bg-white border border-slate-200"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black px-1.5">{item.qty || 1}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setCart((prev) =>
                                prev.map((x) => (x.id === item.id ? { ...x, qty: (x.qty || 1) + 1 } : x))
                              )
                            }
                            className="p-1.5 rounded-lg bg-white border border-slate-200"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCart((prev) => prev.filter((x) => x.id !== item.id))}
                            className="p-1.5 rounded-lg bg-rose-100 text-rose-700 mr-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* كود الكوبون */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="هل لديك كود خصم؟"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black"
                    >
                      تطبيق
                    </button>
                  </div>

                  {/* شريط تشجيعي لخصم الكميات */}
                  {settings.quantityDiscountEnabled && quantityDiscountInfo.remainingToQualify > 0 && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-black text-amber-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        أضف {quantityDiscountInfo.remainingToQualify}{' '}
                        {quantityDiscountInfo.remainingToQualify === 1 ? 'مذكرة إضافية' : 'مذكرات إضافية'} من المذكرات المشمولة لتحصل تلقائيًا على خصم{' '}
                        {settings.quantityDiscountValue}
                        {settings.quantityDiscountType === 'percent' ? '%' : ' ج.م'}!
                      </span>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs sm:text-sm font-black">
                    <div className="flex justify-between text-slate-600">
                      <span>المجموع الفرعي:</span>
                      <span>{cartSubtotal} ج.م</span>
                    </div>
                    {quantityDiscountInfo.amount > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>خصم شراء {quantityDiscountInfo.eligibleCount} مذكرات:</span>
                        <span>- {quantityDiscountInfo.amount} ج.م</span>
                      </div>
                    )}
                    {couponDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>خصم الكوبون ({appliedCoupon?.code}):</span>
                        <span>- {couponDiscountAmount} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base text-slate-900 pt-1.5 border-t border-slate-200">
                      <span>الإجمالي النهائي:</span>
                      <span>{cartFinalTotal} ج.م</span>
                    </div>
                  </div>

                  {/* بيانات المعلم */}
                  <form onSubmit={handleSubmitOrder} className="space-y-3">
                    {(settings.checkoutFields || [])
                      .filter((f) => f && f.enabled !== false && f.type !== 'file' && f.id !== 'logo')
                      .map((field) => (
                        <div key={field.id}>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {safeText(field.label)} {field.required ? '*' : ''}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              rows={2}
                              required={Boolean(field.required)}
                              placeholder={safeText(field.placeholder)}
                              value={customerForm[field.id] || ''}
                              onChange={(e) => setCustomerForm({ ...customerForm, [field.id]: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                            />
                          ) : (
                            <input
                              type={field.type || 'text'}
                              required={Boolean(field.required)}
                              placeholder={safeText(field.placeholder)}
                              value={customerForm[field.id] || ''}
                              onChange={(e) => setCustomerForm({ ...customerForm, [field.id]: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                            />
                          )}
                        </div>
                      ))}

                    {/* قسم شعار المعلم المرن (كتابة نص أو رفع صورة) */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-800">
                          شعار المعلم (Logo) — اكتب نص الشعار أو ارفع صورة (اختياري)
                        </label>
                        {uploadingCustomerLogo && (
                          <span className="text-[11px] font-black text-blue-600">جاري تجهيز الصورة...</span>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="اكتب نص الشعار إذا كان نصيًا (مثال: سلسلة الأوائل التعليمية)"
                        value={customerLogoText}
                        onChange={(e) => setCustomerLogoText(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <label className="px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-300 text-xs font-black text-slate-800 flex items-center gap-1.5 cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>{customerLogoImage ? 'تغيير صورة الشعار' : 'رفع صورة الشعار (PNG / JPG)'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingCustomerLogo(true);
                              try {
                                const hqLogo = await processHighQualityLogoFile(file, 1600, 620000);
                                setCustomerLogoImage(hqLogo);
                              } finally {
                                setUploadingCustomerLogo(false);
                              }
                            }}
                            className="hidden"
                          />
                        </label>

                        {customerLogoImage && (
                          <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-emerald-300">
                            <img
                              src={customerLogoImage}
                              alt="شعار المعلم"
                              className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200"
                            />
                            <span className="text-[11px] font-black text-emerald-700">تم إرفاق الشعار</span>
                            <button
                              type="button"
                              onClick={() => setCustomerLogoImage('')}
                              className="p-1 rounded-lg bg-rose-100 text-rose-700"
                              title="حذف الصورة"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingOrder || uploadingCustomerLogo}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-lg flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{submittingOrder ? 'جاري إرسال الطلب...' : 'تأكيد الطلب وإرساله عبر واتساب'}</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* نافذة التواصل وطلب مذكرة مخصصة */}
      {/* ===================================================================== */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-slate-900">تواصل معنا أو اطلب مذكرة خاصة</h3>
              <button type="button" onClick={() => setContactModalOpen(false)} className="p-2 rounded-xl bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-bold leading-relaxed">
              تواصل معنا مباشرة عبر واتساب لتخصيص أي مذكرة باسمك وشعارك أو لطلب إعداد مذكرة جديدة بالكامل.
            </p>
            <a
              href={`https://wa.me/${String(settings.whatsappNumber || '201000000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `السلام عليكم، أرغب في الاستفسار أو طلب مذكرة مخصصة من ${safeText(settings.platformName)}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow"
            >
              <MessageCircle className="w-5 h-5" />
              <span>محادثة فورية عبر واتساب</span>
            </a>
            {(settings.socialLinks || []).length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {settings.socialLinks.map((soc, idx) => (
                  <a
                    key={soc.id || idx}
                    href={safeText(soc.url, '#')}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-black text-slate-800 flex items-center gap-2"
                  >
                    {getSocialIcon(soc.platform, soc.url)}
                    <span className="truncate">{safeText(soc.label)}</span>
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
const NOTICE_COLOR_OPTIONS = [
  { id: 'amber', label: 'أصفر ذهبي (تحذيري)', hex: '#f59e0b' },
  { id: 'blue', label: 'أزرق ملكي (معلوماتي)', hex: '#2563eb' },
  { id: 'rose', label: 'أحمر قرمزي (هام)', hex: '#e11d48' },
  { id: 'emerald', label: 'أخضر زمردي (تأكيدي)', hex: '#059669' },
  { id: 'indigo', label: 'بنفسجي نيلي', hex: '#4f46e5' },
  { id: 'purple', label: 'بنفسجي ملكي', hex: '#9333ea' },
  { id: 'orange', label: 'برتقالي دافئ', hex: '#ea580c' },
  { id: 'cyan', label: 'سماوي فيروزي', hex: '#0891b2' },
  { id: 'pink', label: 'وردي أنيق', hex: '#db2777' },
  { id: 'slate', label: 'كحلي داكن فاخر', hex: '#0f172a' }
];

function resolveNoticeColorHex(colorVal) {
  const c = safeText(colorVal, 'amber').trim();
  if (c.startsWith('#')) return c;
  const found = NOTICE_COLOR_OPTIONS.find((opt) => opt.id === c);
  return found ? found.hex : '#f59e0b';
}

function UnifiedNoticeBox({ items = [], compact = false }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const primaryHex = resolveNoticeColorHex(items[0]?.color || 'amber');

  return (
    <div className={`${compact ? 'px-3 sm:px-5 py-1.5 bg-slate-50 border-b border-slate-200/80 shrink-0' : ''}`}>
      <div
        style={{
          backgroundColor: `${primaryHex}14`,
          borderColor: `${primaryHex}55`,
          borderRightColor: primaryHex
        }}
        className="rounded-xl border border-r-4 px-2.5 py-1.5 space-y-1 text-slate-900"
      >
        {items.map((item, idx) => {
          const cleanText = safeText(item.text).replace(/^[-–—•*]\s*/, '').trim();
          const itemHex = resolveNoticeColorHex(item.color || primaryHex);
          return (
            <div key={idx} className="flex items-center gap-1.5 min-w-0 text-[11px] sm:text-xs font-black">
              <span
                style={{ backgroundColor: itemHex }}
                className="w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-white"
              >
                <AlertTriangle className="w-2.5 h-2.5" />
              </span>
              <span className="truncate leading-tight text-slate-900" title={cleanText}>
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
            <span
              title={nb.badgeText}
              className="absolute top-3 right-3 max-w-[calc(100%-1.5rem)] truncate whitespace-nowrap px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shadow"
            >
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
  const [orderLogosMap, setOrderLogosMap] = useState({});
  const [loadingLogoCode, setLoadingLogoCode] = useState('');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // مزامنة تلقائية لأي باقات أو كوبونات حالية إلى مستند الإعدادات العام لظهورها للعملاء فورًا
  useEffect(() => {
    if (!db) return;
    if (packages.length === 0 && coupons.length === 0) return;
    const compactPkgs = packages.map((p) => ({
      id: p.id,
      title: p.title || '',
      description: p.description || '',
      price: Number(p.price) || 0,
      oldPrice: Number(p.oldPrice) || 0,
      notebookIds: Array.isArray(p.notebookIds) ? p.notebookIds : []
    }));
    const compactCps = coupons.map((c) => ({
      id: c.id,
      code: c.code || '',
      type: c.type || 'percent',
      value: Number(c.value) || 0,
      maxDiscount: Number(c.maxDiscount) || 0,
      minOrder: Number(c.minOrder) || 0,
      applyScope: c.applyScope || 'all',
      targetNotebookIds: Array.isArray(c.targetNotebookIds) ? c.targetNotebookIds : [],
      expiresAt: c.expiresAt || '',
      active: c.active !== false
    }));
    Promise.all([
      setDoc(publicDoc('settings', 'main'), { cachedPackages: compactPkgs, cachedCoupons: compactCps }, { merge: true }),
      setDoc(publicDoc('config', 'main'), { cachedPackages: compactPkgs, cachedCoupons: compactCps }, { merge: true })
    ]).catch(() => {});
  }, [packages, coupons]);

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
    detailsPosition: 'default',
    noticeEnabled: true,
    noticeText: '',
    noticeColor: 'amber',
    noticePosition: 'top',
    noticeShowInFullscreen: false,
    hidden: false,
    coverImage: '',
    samples: []
  };
  const [nbForm, setNbForm] = useState(emptyNotebookForm);
  const [savingNb, setSavingNb] = useState(false);
  const [loadingEditSamples, setLoadingEditSamples] = useState(false);
  const [samplesTouched, setSamplesTouched] = useState(false);
  const [adminNbSearch, setAdminNbSearch] = useState('');
  const [pkgNbSearch, setPkgNbSearch] = useState('');
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
    maxDiscount: '',
    minOrder: '',
    maxUses: '',
    expiresAt: '',
    applyScope: 'all',
    targetNotebookIds: [],
    active: true
  });
  const [couponNbSearch, setCouponNbSearch] = useState('');
  const [qtyDiscountNbSearch, setQtyDiscountNbSearch] = useState('');

  const saveAllSettingsToCloud = async (updatedObj) => {
    setSavingSettings(true);
    try {
      const safeLogo = await shrinkDataUrlIfNeeded(updatedObj.logoImage || '', 260000);
      const safeHero = await shrinkDataUrlIfNeeded(updatedObj.heroImage || '', 450000);
      const safeHeroMobile = await shrinkDataUrlIfNeeded(updatedObj.heroMobileImage || '', 450000);
      const cleanCategories = [];
      const catWrites = [];

      for (const c of updatedObj.categories || []) {
        const safeCatImg = await shrinkDataUrlIfNeeded(c.image || '', 380000);
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

      const syncStamp = Date.now();
      const compactPackages = packages.map((p) => ({
        id: p.id,
        title: p.title || '',
        description: p.description || '',
        price: Number(p.price) || 0,
        oldPrice: Number(p.oldPrice) || 0,
        notebookIds: Array.isArray(p.notebookIds) ? p.notebookIds : []
      }));
      const compactCoupons = coupons.map((c) => ({
        id: c.id,
        code: c.code || '',
        type: c.type || 'percent',
        value: Number(c.value) || 0,
        maxDiscount: Number(c.maxDiscount) || 0,
        minOrder: Number(c.minOrder) || 0,
        applyScope: c.applyScope || 'all',
        targetNotebookIds: Array.isArray(c.targetNotebookIds) ? c.targetNotebookIds : [],
        expiresAt: c.expiresAt || '',
        active: c.active !== false
      }));

      const mainPayload = {
        ...updatedObj,
        logoImage: '',
        heroImage: '',
        heroMobileImage: '',
        categories: cleanCategories,
        cachedPackages: compactPackages,
        cachedCoupons: compactCoupons,
        syncVersion: syncStamp,
        updatedAt: serverTimestamp()
      };

      const finalMerged = {
        ...updatedObj,
        logoImage: safeLogo,
        heroImage: safeHero,
        heroMobileImage: safeHeroMobile,
        syncVersion: syncStamp,
        categories: (updatedObj.categories || []).map((c, idx) => ({
          ...c,
          image: cleanCategories[idx] ? c.image : ''
        }))
      };

      if (db) {
        await Promise.all([
          setDoc(publicDoc('settings', 'main'), mainPayload, { merge: true }),
          setDoc(publicDoc('config', 'main'), mainPayload, { merge: true }),
          setDoc(legacyPublicDoc('settings', 'main'), mainPayload, { merge: true }),
          setDoc(publicDoc('settings', 'media_logo'), { logoImage: safeLogo, syncVersion: syncStamp, updatedAt: serverTimestamp() }, { merge: true }),
          setDoc(publicDoc('settings', 'media_hero'), { heroImage: safeHero, syncVersion: syncStamp, updatedAt: serverTimestamp() }, { merge: true }),
          setDoc(
            publicDoc('settings', 'media_hero_mobile'),
            { heroMobileImage: safeHeroMobile, syncVersion: syncStamp, updatedAt: serverTimestamp() },
            { merge: true }
          ),
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
        detailsPosition: nbForm.detailsPosition || 'default',
        noticeEnabled: nbForm.noticeEnabled !== false,
        noticeText: nbForm.noticeText.trim(),
        noticeColor: nbForm.noticeColor || 'amber',
        noticePosition: nbForm.noticePosition || 'top',
        noticeShowInFullscreen: Boolean(nbForm.noticeShowInFullscreen),
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

      if (Array.isArray(nbForm.samples) && (samplesTouched || nbForm.samples.length > 0)) {
        const validSamples = nbForm.samples.map((s) => extractImageFromValue(s)).filter(Boolean);
        const shrunkSamples = await Promise.all(
          validSamples.map((s) => shrinkDataUrlIfNeeded(s, 450000))
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
      setSamplesTouched(false);
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
      let savedId = pkgForm.id;
      if (savedId) {
        await updateDoc(publicDoc('packages', savedId), data);
        await setDoc(legacyPublicDoc('packages', savedId), data, { merge: true }).catch(() => {});
      } else {
        const created = await addDoc(publicCol('packages'), { ...data, createdAt: serverTimestamp() });
        savedId = created.id;
        await setDoc(legacyPublicDoc('packages', savedId), { ...data, createdAt: serverTimestamp() }, { merge: true }).catch(() => {});
      }
      const nextPkgs = pkgForm.id
        ? packages.map((p) => (p.id === savedId ? { ...p, ...data, id: savedId } : p))
        : [...packages, { ...data, id: savedId }];
      await setDoc(
        publicDoc('settings', 'main'),
        { cachedPackages: nextPkgs, syncVersion: Date.now() },
        { merge: true }
      ).catch(() => {});
      setPkgForm({ id: '', title: '', description: '', price: '', oldPrice: '', oldPriceManual: false, notebookIds: [] });
      showToast('تم حفظ الباقة التوفيرية وتعميمها على العملاء بنجاح!');
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
        maxDiscount: Number(couponForm.maxDiscount) || 0,
        minOrder: Number(couponForm.minOrder) || 0,
        maxUses: Number(couponForm.maxUses) || 0,
        expiresAt: couponForm.expiresAt || '',
        applyScope: couponForm.applyScope || 'all',
        targetNotebookIds:
          (couponForm.applyScope || 'all') === 'all' ? [] : Array.isArray(couponForm.targetNotebookIds) ? couponForm.targetNotebookIds : [],
        active: couponForm.active !== false,
        updatedAt: serverTimestamp()
      };
      let savedId = couponForm.id;
      if (savedId) {
        await updateDoc(publicDoc('coupons', savedId), data);
      } else {
        const created = await addDoc(publicCol('coupons'), { ...data, usedCount: 0, createdAt: serverTimestamp() });
        savedId = created.id;
      }
      const nextCps = couponForm.id
        ? coupons.map((c) => (c.id === savedId ? { ...c, ...data, id: savedId } : c))
        : [...coupons, { ...data, id: savedId, usedCount: 0 }];
      await setDoc(
        publicDoc('settings', 'main'),
        { cachedCoupons: nextCps, syncVersion: Date.now() },
        { merge: true }
      ).catch(() => {});
      setCouponForm({
        id: '',
        code: '',
        type: 'percent',
        value: '',
        maxDiscount: '',
        minOrder: '',
        maxUses: '',
        expiresAt: '',
        applyScope: 'all',
        targetNotebookIds: [],
        active: true
      });
      setCouponNbSearch('');
      showToast('تم حفظ كوبون الخصم وتعميمه على العملاء بنجاح!');
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
                  onClick={() => {
                    setNbForm(emptyNotebookForm);
                    setSamplesTouched(false);
                  }}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">موضع تفاصيل هذه المذكرة في المعاينة</label>
                <select
                  value={nbForm.detailsPosition || 'default'}
                  onChange={(e) => setNbForm({ ...nbForm, detailsPosition: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold"
                >
                  <option value="default">حسب الإعداد العام للمنصة</option>
                  <option value="above_samples">فوق صفحات المعاينة</option>
                  <option value="below_samples">أسفل صفحات المعاينة</option>
                  <option value="hidden">إخفاء تفاصيل هذه المذكرة</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  وصف وتفاصيل المذكرة (اكتب المحتويات والمميزات بحرية في عدة أسطر)
                </label>
                <textarea
                  rows={4}
                  placeholder="اكتب وصف المذكرة ومحتوياتها وعدد النماذج والتدريبات بالتفصيل..."
                  value={nbForm.subtitle}
                  onChange={(e) => setNbForm({ ...nbForm, subtitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold leading-relaxed resize-y min-h-[110px]"
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
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-slate-900">التنبيه الخاص بهذه المذكرة (منفصل عن التنبيهات العامة)</span>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nbForm.noticeEnabled !== false}
                      onChange={(e) => setNbForm({ ...nbForm, noticeEnabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>إظهار التنبيه</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-black text-blue-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(nbForm.noticeShowInFullscreen)}
                      onChange={(e) => setNbForm({ ...nbForm, noticeShowInFullscreen: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>إظهاره في وضع الشاشة الكاملة</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">نص التنبيه الخاص بالمذكرة</label>
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
                  <div className="flex items-center gap-1.5">
                    <select
                      value={NOTICE_COLOR_OPTIONS.some((o) => o.id === nbForm.noticeColor) ? nbForm.noticeColor : 'custom'}
                      onChange={(e) => {
                        if (e.target.value !== 'custom') {
                          setNbForm({ ...nbForm, noticeColor: e.target.value });
                        }
                      }}
                      className="flex-1 min-w-0 px-2.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    >
                      {NOTICE_COLOR_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                      <option value="custom">لون مخصص</option>
                    </select>
                    <input
                      type="color"
                      title="اختر أي درجة لون مخصصة"
                      value={resolveNoticeColorHex(nbForm.noticeColor)}
                      onChange={(e) => setNbForm({ ...nbForm, noticeColor: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer shrink-0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">موضع التنبيه</label>
                  <select
                    value={nbForm.noticePosition || 'top'}
                    onChange={(e) => setNbForm({ ...nbForm, noticePosition: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    <option value="top">فوق صفحات المعاينة</option>
                    <option value="below_details">أسفل تفاصيل المذكرة</option>
                    <option value="bottom">أسفل صفحات المعاينة</option>
                  </select>
                </div>
              </div>
            </div>

            {/* رفع صورة الغلاف وصفحات العينات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-800">صورة غلاف المذكرة</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const dataUrl = await compressImageFile(file, 1000, 0.85, 380000);
                    setNbForm((prev) => ({ ...prev, coverImage: dataUrl }));
                  }}
                  className="text-xs font-bold"
                />
                {nbForm.coverImage && (
                  <div className="relative w-24 h-28 rounded-xl overflow-hidden border border-slate-300">
                    <img src={nbForm.coverImage} alt="غلاف" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNbForm((prev) => ({ ...prev, coverImage: '' }))}
                      className="absolute top-1 left-1 p-1 rounded-full bg-rose-600 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800">
                    صفحات العينة للمعاينة ({nbForm.samples?.length || 0} صفحة)
                  </label>
                  {loadingEditSamples && (
                    <span className="text-[11px] font-black text-blue-600">جاري تحميل العينات...</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    const compressed = await Promise.all(
                      files.map((f) => compressImageFile(f, 1300, 0.84, 420000))
                    );
                    setSamplesTouched(true);
                    setNbForm((prev) => ({ ...prev, samples: [...(prev.samples || []), ...compressed] }));
                  }}
                  className="text-xs font-bold"
                />
                {Array.isArray(nbForm.samples) && nbForm.samples.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {nbForm.samples.map((smp, sIdx) => (
                      <div key={sIdx} className="relative w-14 h-18 rounded-lg overflow-hidden border border-slate-300 bg-white">
                        <img src={smp} alt={`عينة ${sIdx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setSamplesTouched(true);
                            setNbForm((prev) => ({
                              ...prev,
                              samples: prev.samples.filter((_, i) => i !== sIdx)
                            }));
                          }}
                          className="absolute top-0.5 left-0.5 p-0.5 rounded-full bg-rose-600 text-white"
                        >
                          <X className="w-2.5 h-2.5" />
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
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow"
            >
              {savingNb ? 'جاري حفظ المذكرة والعينات...' : nbForm.id ? 'حفظ التعديلات' : 'إضافة المذكرة للمنصة'}
            </button>
          </form>

          {/* قائمة المذكرات الحالية */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-black text-slate-900">المذكرات المضافة ({notebooks.length})</h3>
              <input
                type="text"
                value={adminNbSearch}
                onChange={(e) => setAdminNbSearch(e.target.value)}
                placeholder="بحث في المذكرات..."
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold w-64"
              />
            </div>

            <div className="space-y-2.5">
              {filteredAdminNotebooks.map((nb) => (
                <div
                  key={nb.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-14 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {nb.coverImage ? (
                        <img src={nb.coverImage} alt={nb.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-slate-900 truncate">{nb.title}</div>
                      <div className="text-xs text-slate-500 font-bold">
                        {nb.price} ج.م {nb.hidden ? '• (مخفية عن الزوار)' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        setSamplesTouched(false);
                        const existingSamples = (samplesMap[nb.id] || nb.inlineSamples || [])
                          .map((im) => extractImageFromValue(im))
                          .filter(Boolean);
                        setNbForm({
                          ...emptyNotebookForm,
                          ...nb,
                          price: String(nb.price || ''),
                          oldPrice: nb.oldPrice ? String(nb.oldPrice) : '',
                          samples: existingSamples
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        if (db) {
                          setLoadingEditSamples(true);
                          try {
                            const pageIds = Array.from({ length: 24 }, (_, i) => `${nb.id}_p${i}`);
                            const [mainSnap, legacySnap, ...pageSnaps] = await Promise.all([
                              getDoc(publicDoc('notebook_samples', nb.id)).catch(() => null),
                              getDoc(legacyPublicDoc('notebook_samples', nb.id)).catch(() => null),
                              ...pageIds.map((pid) => getDoc(publicDoc('notebook_samples', pid)).catch(() => null))
                            ]);
                            const loaded = [];
                            const collectFromSnap = (snap) => {
                              if (!snap || !snap.exists()) return;
                              extractAnyImagesFromDoc(snap.data() || {}).forEach((im) => {
                                if (im && im !== nb.coverImage && !loaded.includes(im)) {
                                  loaded.push(im);
                                }
                              });
                            };
                            pageSnaps.forEach(collectFromSnap);
                            if (loaded.length === 0) {
                              collectFromSnap(mainSnap);
                              collectFromSnap(legacySnap);
                            }
                            const finalLoaded = loaded.length > 0 ? loaded : existingSamples;
                            if (finalLoaded.length > 0) {
                              setNbForm((prev) => (prev.id === nb.id ? { ...prev, samples: finalLoaded } : prev));
                              setSamplesMap((prev) => ({ ...prev, [nb.id]: finalLoaded }));
                            }
                          } finally {
                            setLoadingEditSamples(false);
                          }
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-800 text-xs font-black flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateNotebook(nb)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-800 text-xs font-black"
                    >
                      تكرار
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleNotebookHidden(nb)}
                      className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-black"
                    >
                      {nb.hidden ? 'إظهار' : 'إخفاء'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotebook(nb)}
                      className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 text-xs font-black"
                    >
                      حذف
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg font-black text-slate-900">هيكلة الأقسام والمراحل والصفوف</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    categories: [
                      ...(localSettings.categories || []),
                      { id: `cat_${Date.now()}`, name: 'قسم دراسي جديد', image: '', browseMode: 'hierarchical', stages: [] }
                    ]
                  })
                }
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم رئيسي</span>
              </button>
              <button
                type="button"
                disabled={savingSettings}
                onClick={() => saveAllSettingsToCloud(localSettings)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black"
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ الأقسام'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {(localSettings.categories || []).map((cat, cIdx) => (
              <div key={cat.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => {
                      const arr = [...localSettings.categories];
                      arr[cIdx] = { ...cat, name: e.target.value };
                      setLocalSettings({ ...localSettings, categories: arr });
                    }}
                    className="flex-1 min-w-[180px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black"
                  />
                  <select
                    value={cat.browseMode || 'hierarchical'}
                    onChange={(e) => {
                      const arr = [...localSettings.categories];
                      arr[cIdx] = { ...cat, browseMode: e.target.value };
                      setLocalSettings({ ...localSettings, categories: arr });
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    <option value="hierarchical">مراحل ثم صفوف</option>
                    <option value="direct">عرض مباشر للمذكرات</option>
                  </select>
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
                    className="px-3 py-2 rounded-xl bg-blue-100 text-blue-800 text-xs font-black"
                  >
                    + مرحلة
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        categories: localSettings.categories.filter((_, i) => i !== cIdx)
                      })
                    }
                    className="p-2 rounded-xl bg-rose-100 text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {(cat.stages || []).map((stg, sIdx) => (
                  <div key={stg.id} className="mr-4 p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={stg.name}
                        onChange={(e) => {
                          const cats = [...localSettings.categories];
                          const stgs = [...cat.stages];
                          stgs[sIdx] = { ...stg, name: e.target.value };
                          cats[cIdx] = { ...cat, stages: stgs };
                          setLocalSettings({ ...localSettings, categories: cats });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const cats = [...localSettings.categories];
                          const stgs = [...cat.stages];
                          stgs[sIdx] = {
                            ...stg,
                            grades: [...(stg.grades || []), { id: `grd_${Date.now()}`, name: 'صف جديد' }]
                          };
                          cats[cIdx] = { ...cat, stages: stgs };
                          setLocalSettings({ ...localSettings, categories: cats });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black"
                      >
                        + صف
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cats = [...localSettings.categories];
                          cats[cIdx] = { ...cat, stages: cat.stages.filter((_, i) => i !== sIdx) };
                          setLocalSettings({ ...localSettings, categories: cats });
                        }}
                        className="p-1.5 rounded-lg bg-rose-100 text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(stg.grades || []).map((grd, gIdx) => (
                        <div key={grd.id} className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <input
                            type="text"
                            value={grd.name}
                            onChange={(e) => {
                              const cats = [...localSettings.categories];
                              const stgs = [...cat.stages];
                              const grds = [...stg.grades];
                              grds[gIdx] = { ...grd, name: e.target.value };
                              stgs[sIdx] = { ...stg, grades: grds };
                              cats[cIdx] = { ...cat, stages: stgs };
                              setLocalSettings({ ...localSettings, categories: cats });
                            }}
                            className="bg-transparent text-xs font-bold w-32 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cats = [...localSettings.categories];
                              const stgs = [...cat.stages];
                              stgs[sIdx] = { ...stg, grades: stg.grades.filter((_, i) => i !== gIdx) };
                              cats[cIdx] = { ...cat, stages: stgs };
                              setLocalSettings({ ...localSettings, categories: cats });
                            }}
                            className="text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* تبويب 3: الكوبونات والباقات التوفيرية */}
      {/* ===================================================================== */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          {/* خصم الكميات التلقائي عند شراء أكثر من مذكرة */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={Boolean(localSettings.quantityDiscountEnabled)}
                  onChange={(e) => setLocalSettings({ ...localSettings, quantityDiscountEnabled: e.target.checked })}
                  className="w-5 h-5"
                />
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    خصم تلقائي عند شراء أكثر من مذكرة (خصم الكميات)
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    يُطبّق تلقائيًا داخل السلة عندما يطلب العميل العدد المحدد من المذكرات المشمولة دون الحاجة لكود
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingSettings}
                onClick={() => saveAllSettingsToCloud(localSettings)}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow"
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات خصم الكميات'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأدنى لعدد المذكرات</label>
                <input
                  type="number"
                  min={2}
                  value={localSettings.quantityDiscountMinCount ?? 2}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, quantityDiscountMinCount: Math.max(2, Number(e.target.value)) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الخصم</label>
                <select
                  value={localSettings.quantityDiscountType || 'fixed'}
                  onChange={(e) => setLocalSettings({ ...localSettings, quantityDiscountType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold"
                >
                  <option value="fixed">مبلغ ثابت (ج.م)</option>
                  <option value="percent">نسبة مئوية (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  قيمة الخصم ({localSettings.quantityDiscountType === 'percent' ? '%' : 'ج.م'})
                </label>
                <input
                  type="number"
                  min={0}
                  value={localSettings.quantityDiscountValue ?? 30}
                  onChange={(e) => setLocalSettings({ ...localSettings, quantityDiscountValue: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأقصى للخصم (ج.م)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0 = بدون حد"
                  value={localSettings.quantityDiscountMaxAmount ?? 0}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, quantityDiscountMaxAmount: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المذكرات المشمولة بالخصم</label>
                <select
                  value={localSettings.quantityDiscountScope || 'all'}
                  onChange={(e) => setLocalSettings({ ...localSettings, quantityDiscountScope: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-black text-blue-700"
                >
                  <option value="all">جميع مذكرات المنصة</option>
                  <option value="selected">مذكرات محددة فقط</option>
                </select>
              </div>
            </div>

            {localSettings.quantityDiscountScope === 'selected' && (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs sm:text-sm font-black text-slate-900">
                      حدد المذكرات التي يدخل شراؤها ضمن خصم الكميات ({localSettings.quantityDiscountNotebookIds?.length || 0} مذكرة مختارة):
                    </div>
                    <p className="text-[11px] text-slate-600 font-bold">
                      عند شراء {localSettings.quantityDiscountMinCount || 2} مذكرات أو أكثر من القائمة المحددة أدناه يُطبق الخصم تلقائيًا.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={qtyDiscountNbSearch}
                    onChange={(e) => setQtyDiscountNbSearch(e.target.value)}
                    placeholder="ابحث باسم المذكرة..."
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold w-56"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                  {notebooks
                    .filter((nb) => {
                      if (!qtyDiscountNbSearch.trim()) return true;
                      return `${nb.title} ${nb.subject}`.toLowerCase().includes(qtyDiscountNbSearch.trim().toLowerCase());
                    })
                    .map((nb) => {
                      const isChecked = (localSettings.quantityDiscountNotebookIds || []).includes(nb.id);
                      return (
                        <label
                          key={nb.id}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition ${
                            isChecked
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const current = localSettings.quantityDiscountNotebookIds || [];
                                const next = isChecked
                                  ? current.filter((id) => id !== nb.id)
                                  : [...current, nb.id];
                                setLocalSettings({ ...localSettings, quantityDiscountNotebookIds: next });
                              }}
                              className="w-4 h-4 shrink-0"
                            />
                            <span className="truncate">{nb.title}</span>
                          </div>
                          <span className={`text-[11px] font-black shrink-0 ${isChecked ? 'text-white/90' : 'text-blue-600'}`}>
                            {nb.price} ج.م
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* إدارة كوبونات الخصم */}
          <form onSubmit={handleSaveCoupon} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {couponForm.id ? `تعديل الكوبون: ${couponForm.code}` : 'إضافة أو تعديل كوبون خصم'}
              </h3>
              {couponForm.id && (
                <button
                  type="button"
                  onClick={() =>
                    setCouponForm({
                      id: '',
                      code: '',
                      type: 'percent',
                      value: '',
                      maxDiscount: '',
                      minOrder: '',
                      maxUses: '',
                      expiresAt: '',
                      applyScope: 'all',
                      targetNotebookIds: [],
                      active: true
                    })
                  }
                  className="text-xs font-black text-rose-600 hover:underline"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كود الكوبون *</label>
                <input
                  type="text"
                  required
                  placeholder="SAVE20"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الخصم</label>
                <select
                  value={couponForm.type}
                  onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                >
                  <option value="percent">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (ج.م)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">قيمة الخصم *</label>
                <input
                  type="number"
                  required
                  value={couponForm.value}
                  onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأقصى للخصم (ج.م)</label>
                <input
                  type="number"
                  placeholder="0 = بدون حد"
                  value={couponForm.maxDiscount}
                  onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأدنى للطلب (ج.م)</label>
                <input
                  type="number"
                  value={couponForm.minOrder}
                  onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نطاق تطبيق الكوبون</label>
                <select
                  value={couponForm.applyScope || 'all'}
                  onChange={(e) => setCouponForm({ ...couponForm, applyScope: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-blue-700"
                >
                  <option value="all">جميع المذكرات والباقات</option>
                  <option value="include">مذكرات محددة فقط</option>
                  <option value="exclude">الكل باستثناء مذكرات محددة</option>
                </select>
              </div>
            </div>

            {/* اختيار المذكرات المشمولة أو المستثناة */}
            {(couponForm.applyScope === 'include' || couponForm.applyScope === 'exclude') && (
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  couponForm.applyScope === 'include'
                    ? 'bg-blue-50/70 border-blue-200'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs sm:text-sm font-black text-slate-900">
                      {couponForm.applyScope === 'include'
                        ? `حدد المذكرات التي يسري عليها الخصم فقط (${couponForm.targetNotebookIds?.length || 0} مذكرة مختارة):`
                        : `حدد المذكرات المستثناة من الخصم (${couponForm.targetNotebookIds?.length || 0} مذكرة مستثناة):`}
                    </div>
                    <p className="text-[11px] text-slate-600 font-bold">
                      {couponForm.applyScope === 'include'
                        ? 'سيُحتسب الخصم على أسعار المذكرات المحددة فقط داخل سلة العميل.'
                        : 'سيسري الخصم على جميع محتويات السلة ما عدا المذكرات المحددة أدناه.'}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={couponNbSearch}
                    onChange={(e) => setCouponNbSearch(e.target.value)}
                    placeholder="ابحث باسم المذكرة..."
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold w-56"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                  {notebooks
                    .filter((nb) => {
                      if (!couponNbSearch.trim()) return true;
                      return `${nb.title} ${nb.subject}`.toLowerCase().includes(couponNbSearch.trim().toLowerCase());
                    })
                    .map((nb) => {
                      const isSelected = (couponForm.targetNotebookIds || []).includes(nb.id);
                      return (
                        <label
                          key={nb.id}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition ${
                            isSelected
                              ? couponForm.applyScope === 'include'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const current = couponForm.targetNotebookIds || [];
                                const next = isSelected
                                  ? current.filter((id) => id !== nb.id)
                                  : [...current, nb.id];
                                setCouponForm({ ...couponForm, targetNotebookIds: next });
                              }}
                              className="w-4 h-4 shrink-0"
                            />
                            <span className="truncate">{nb.title}</span>
                          </div>
                          <span className={`text-[11px] font-black shrink-0 ${isSelected ? 'text-white/90' : 'text-blue-600'}`}>
                            {nb.price} ج.م
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow"
              >
                {couponForm.id ? 'حفظ تعديلات الكوبون' : 'حفظ الكوبون'}
              </button>
            </div>

            {coupons.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                {coupons.map((cp) => {
                  const scopeCount = Array.isArray(cp.targetNotebookIds) ? cp.targetNotebookIds.length : 0;
                  return (
                    <div key={cp.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-900">{cp.code}</div>
                        <div className="text-xs text-slate-600 font-bold">
                          خصم {cp.value}
                          {cp.type === 'fixed' ? ' ج.م' : '%'}
                          {Number(cp.maxDiscount) > 0 ? ` (بحد أقصى ${cp.maxDiscount} ج.م)` : ''}
                        </div>
                        {cp.applyScope === 'include' && (
                          <div className="text-[11px] text-blue-700 font-black mt-0.5">
                            يسري على {scopeCount} مذكرة محددة فقط
                          </div>
                        )}
                        {cp.applyScope === 'exclude' && (
                          <div className="text-[11px] text-rose-700 font-black mt-0.5">
                            مستثنى منه {scopeCount} مذكرة محددة
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setCouponForm({
                              id: cp.id,
                              code: cp.code || '',
                              type: cp.type || 'percent',
                              value: String(cp.value || ''),
                              maxDiscount: cp.maxDiscount ? String(cp.maxDiscount) : '',
                              minOrder: cp.minOrder ? String(cp.minOrder) : '',
                              maxUses: cp.maxUses ? String(cp.maxUses) : '',
                              expiresAt: cp.expiresAt || '',
                              applyScope: cp.applyScope || 'all',
                              targetNotebookIds: Array.isArray(cp.targetNotebookIds) ? cp.targetNotebookIds : [],
                              active: cp.active !== false
                            })
                          }
                          className="p-2 rounded-xl bg-blue-100 text-blue-800"
                          title="تعديل الكوبون"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDoc(publicDoc('coupons', cp.id))}
                          className="p-2 rounded-xl bg-rose-100 text-rose-700"
                          title="حذف الكوبون"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </form>

          {/* إدارة باقات التوفير */}
          <form onSubmit={handleSavePackage} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {pkgForm.id ? 'تعديل باقة توفير حالية' : 'إضافة باقة توفير مجمعة'}
              </h3>
              {pkgForm.id && (
                <button
                  type="button"
                  onClick={() =>
                    setPkgForm({
                      id: '',
                      title: '',
                      description: '',
                      price: '',
                      oldPrice: '',
                      oldPriceManual: false,
                      notebookIds: []
                    })
                  }
                  className="text-xs font-black text-rose-600 hover:underline"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الباقة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: باقة المراجعة النهائية للمرحلة الإعدادية"
                  value={pkgForm.title}
                  onChange={(e) => setPkgForm({ ...pkgForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سعر الباقة بعد الخصم (ج.م) *</label>
                <input
                  type="number"
                  required
                  placeholder="مثال: 650"
                  value={pkgForm.price}
                  onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  السعر قبل الخصم (يُحسب تلقائيًا من المذكرات المختارة)
                </label>
                <input
                  type="number"
                  placeholder="مثال: 800"
                  value={pkgForm.oldPrice}
                  onChange={(e) => setPkgForm({ ...pkgForm, oldPrice: e.target.value, oldPriceManual: true })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف ومميزات الباقة</label>
                <textarea
                  rows={2}
                  placeholder="اكتب تفاصيل الباقة ومميزاتها..."
                  value={pkgForm.description}
                  onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
                />
              </div>
            </div>

            {/* اختيار المذكرات المشمولة داخل الباقة */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs sm:text-sm font-black text-slate-900">
                    اختر المذكرات المضمنة في الباقة ({pkgForm.notebookIds.length} مذكرة مختارة)
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold">
                    عند تحديد المذكرات يتم جمع أسعارها تلقائيًا في خانة «السعر قبل الخصم»
                  </p>
                </div>
                <input
                  type="text"
                  value={pkgNbSearch}
                  onChange={(e) => setPkgNbSearch(e.target.value)}
                  placeholder="ابحث لاختيار مذكرة..."
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold w-56"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
                {notebooks
                  .filter((nb) => {
                    if (!pkgNbSearch.trim()) return true;
                    return `${nb.title} ${nb.subject}`.toLowerCase().includes(pkgNbSearch.trim().toLowerCase());
                  })
                  .map((nb) => {
                    const checked = pkgForm.notebookIds.includes(nb.id);
                    return (
                      <label
                        key={nb.id}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition ${
                          checked
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePackageNotebook(nb.id)}
                            className="w-4 h-4 shrink-0"
                          />
                          <span className="truncate">{nb.title}</span>
                        </div>
                        <span className="text-[11px] font-black text-blue-600 shrink-0">{nb.price} ج.م</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow"
            >
              {pkgForm.id ? 'حفظ تعديلات الباقة' : 'حفظ الباقة التوفيرية'}
            </button>

            {/* قائمة الباقات المضافة حاليًا */}
            {packages.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="text-xs sm:text-sm font-black text-slate-900">
                  الباقات التوفيرية المضافة ({packages.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-900 truncate">{pkg.title}</div>
                        <div className="text-xs text-slate-600 font-bold">
                          السعر: {pkg.price} ج.م
                          {Number(pkg.oldPrice) > Number(pkg.price) ? ` (بدلاً من ${pkg.oldPrice} ج.م)` : ''}
                          {Array.isArray(pkg.notebookIds) && pkg.notebookIds.length > 0
                            ? ` • تشمل ${pkg.notebookIds.length} مذكرات`
                            : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPkgForm({
                              id: pkg.id,
                              title: pkg.title || '',
                              description: pkg.description || '',
                              price: String(pkg.price || ''),
                              oldPrice: pkg.oldPrice ? String(pkg.oldPrice) : '',
                              oldPriceManual: false,
                              notebookIds: Array.isArray(pkg.notebookIds) ? pkg.notebookIds : []
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-800 text-xs font-black"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteDoc(publicDoc('packages', pkg.id));
                            await deleteDoc(legacyPublicDoc('packages', pkg.id)).catch(() => {});
                            const remaining = packages.filter((p) => p.id !== pkg.id);
                            await setDoc(
                              publicDoc('settings', 'main'),
                              { cachedPackages: remaining, syncVersion: Date.now() },
                              { merge: true }
                            ).catch(() => {});
                            showToast('تم حذف الباقة.');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 text-xs font-black"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* تبويب 4: الطلبات الواردة */}
      {/* ===================================================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="text-base sm:text-lg font-black text-slate-900">الطلبات الواردة ({orders.length})</h3>
          {orders.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-500 font-bold text-center py-8">لا توجد طلبات مسجلة حتى الآن.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => {
                const logoImg = extractImageFromValue(
                  orderLogosMap[ord.orderCode] || ord.customerLogoImage || ord.customer?.logo
                );
                const hasCloudLogo = Boolean(ord.hasLogoImage || logoImg);
                const logoTxt = safeText(ord.customerLogoText || ord.customer?.logoText).trim();
                const isPngLogo = logoImg.startsWith('data:image/png');
                return (
                  <div key={ord.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-black text-slate-900">
                        {ord.orderCode} • {ord.customer?.teacherName || 'معلم'} ({ord.customer?.phone || '-'})
                      </div>
                      <select
                        value={ord.status || 'pending'}
                        onChange={(e) => updateDoc(publicDoc('orders', ord.id), { status: e.target.value })}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black"
                      >
                        <option value="pending">قيد المراجعة</option>
                        <option value="processing">جاري التنسيق</option>
                        <option value="completed">مكتمل وتم التسليم</option>
                      </select>
                    </div>

                    <div className="text-xs text-slate-600 font-bold">
                      المطلوب: {(ord.items || []).map((i) => i.title).join(' + ')} • الإجمالي: {ord.total} ج.م
                    </div>

                    {/* عرض كل بيانات المعلم المسجلة في الطلب */}
                    {ord.customer && Object.keys(ord.customer).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(ord.customer)
                          .filter(([k, v]) => {
                            const strVal = safeText(v).trim();
                            return (
                              k !== 'logo' &&
                              strVal &&
                              !strVal.startsWith('data:image/') &&
                              !strVal.toLowerCase().includes('fakepath')
                            );
                          })
                          .map(([k, v]) => {
                            const fieldDef = (localSettings.checkoutFields || []).find((f) => f.id === k);
                            return (
                              <span
                                key={k}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700"
                              >
                                {fieldDef?.label || k}: <strong className="text-slate-950">{safeText(v)}</strong>
                              </span>
                            );
                          })}
                      </div>
                    )}

                    {/* تنبيه للطلبات القديمة التي أُرسلت قبل تفعيل الرفع السحابي للشعار */}
                    {!hasCloudLogo &&
                      Object.values(ord.customer || {}).some((v) => safeText(v).toLowerCase().includes('fakepath')) && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-black text-amber-900">
                          ملاحظة: هذا الطلب سُجّل قبل تفعيل ميزة الرفع السحابي للشعار؛ يمكنك استلام صورة الشعار من المعلم عبر واتساب.
                        </div>
                      )}

                    {/* عرض نص أو صورة شعار المعلم مع زر تنزيل مباشر */}
                    {(logoTxt || hasCloudLogo) && (
                      <div className="p-3 rounded-xl bg-white border border-blue-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {logoImg && (
                            <img
                              src={logoImg}
                              alt="شعار المعلم"
                              className="w-14 h-14 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1"
                            />
                          )}
                          <div className="space-y-0.5">
                            <div className="text-xs font-black text-blue-800">شعار المعلم المرفق:</div>
                            {logoTxt && (
                              <div className="text-xs sm:text-sm font-black text-slate-900">«{logoTxt}»</div>
                            )}
                          </div>
                        </div>

                        {logoImg ? (
                          <button
                            type="button"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = logoImg;
                              link.download = `logo_${ord.customer?.teacherName || ord.orderCode || 'teacher'}.${
                                isPngLogo ? 'png' : 'jpg'
                              }`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تنزيل الشعار بالجودة الكاملة ({isPngLogo ? 'PNG شفاف' : 'JPG'})</span>
                          </button>
                        ) : hasCloudLogo ? (
                          <button
                            type="button"
                            disabled={loadingLogoCode === ord.orderCode}
                            onClick={async () => {
                              setLoadingLogoCode(ord.orderCode);
                              try {
                                const snap = await getDoc(publicDoc('order_logos', ord.orderCode));
                                if (snap.exists() && snap.data()?.image) {
                                  const imgData = snap.data().image;
                                  setOrderLogosMap((prev) => ({ ...prev, [ord.orderCode]: imgData }));
                                } else {
                                  showToast(
                                    'تعذر العثور على ملف الشعار في السحابة (تأكد من إعادة تجربة طلب جديد بعد التحديث).',
                                    'error'
                                  );
                                }
                              } finally {
                                setLoadingLogoCode('');
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow transition"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              {loadingLogoCode === ord.orderCode ? 'جاري جلب الشعار...' : 'جلب وتنزيل صورة الشعار'}
                            </span>
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* تبويب 5: إعدادات المنصة الشاملة */}
      {/* ===================================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'identity', label: '1. الهوية والشريط الإعلاني' },
                { id: 'hero', label: '2. الواجهة وبطاقة الثقة' },
                { id: 'sections', label: '3. شارة التوفير وما الجديد والأخبار' },
                { id: 'checkout', label: '4. السلة والتواصل والنسخ الاحتياطي' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSettingsSubTab(st.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition ${
                    settingsSubTab === st.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow"
            >
              {savingSettings ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
            </button>
          </div>

          {/* 1. الهوية والشريط الإعلاني */}
          {settingsSubTab === 'identity' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنصة</label>
                  <input
                    type="text"
                    value={localSettings.platformName || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, platformName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوصف المختصر أسفل الاسم</label>
                  <input
                    type="text"
                    value={localSettings.platformTagline || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, platformTagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم واتساب لاستقبال الطلبات</label>
                  <input
                    type="text"
                    value={localSettings.whatsappNumber || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شعار المنصة (Logo)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await compressImageFile(f, 500, 0.85, 220000);
                      setLocalSettings({ ...localSettings, logoImage: url });
                    }}
                    className="text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">صورة خلفية الكمبيوتر (Hero)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await compressImageFile(f, 1600, 0.82, 480000);
                      setLocalSettings({ ...localSettings, heroImage: url });
                    }}
                    className="text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">صورة خلفية الهاتف المخصصة (اختياري)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await compressImageFile(f, 1080, 0.82, 450000);
                      setLocalSettings({ ...localSettings, heroMobileImage: url });
                    }}
                    className="text-xs font-bold"
                  />
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
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-bold text-slate-700 mb-1">النص المكتوب على الشريط</label>
                    <input
                      type="text"
                      value={localSettings.promoText || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, promoText: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">كود الخصم</label>
                    <input
                      type="text"
                      value={localSettings.promoCouponCode || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, promoCouponCode: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">نسبة الخصم %</label>
                    <input
                      type="number"
                      value={localSettings.promoDiscountPercent ?? 15}
                      onChange={(e) => setLocalSettings({ ...localSettings, promoDiscountPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">أقصى خصم (ج.م)</label>
                    <input
                      type="number"
                      value={localSettings.promoMaxDiscount ?? 0}
                      onChange={(e) => setLocalSettings({ ...localSettings, promoMaxDiscount: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-center gap-1">
                    <input
                      type="color"
                      title="لون الخلفية"
                      value={localSettings.promoBgColor || '#0f172a'}
                      onChange={(e) => setLocalSettings({ ...localSettings, promoBgColor: e.target.value })}
                      className="w-8 h-9 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="color"
                      title="لون النص"
                      value={localSettings.promoTextColor || '#ffffff'}
                      onChange={(e) => setLocalSettings({ ...localSettings, promoTextColor: e.target.value })}
                      className="w-8 h-9 rounded-lg border border-slate-200 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* التنبيهات العامة للمنصة (منفصلة عن التنبيه الخاص بكل مذكرة) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={localSettings.globalAlertsEnabled !== false}
                      onChange={(e) => setLocalSettings({ ...localSettings, globalAlertsEnabled: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <div>
                      <div className="text-sm font-black text-slate-900">التنبيهات العامة للمنصة (صندوق مستقل)</div>
                      <p className="text-xs text-slate-600 font-bold">
                        منفصلة تمامًا عن التنبيه الخاص بكل مذكرة مع إمكانية التحكم في ظهورها وموضعها وألوانها
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={localSettings.globalAlertsPosition || 'preview_top'}
                      onChange={(e) => setLocalSettings({ ...localSettings, globalAlertsPosition: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-black"
                    >
                      <option value="preview_top">فوق صفحات المعاينة</option>
                      <option value="preview_bottom">أسفل صفحات المعاينة</option>
                      <option value="home_top">في الصفحة الرئيسية أعلى الأقسام</option>
                    </select>
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-black text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(localSettings.globalAlertsShowInFullscreen)}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, globalAlertsShowInFullscreen: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span>إظهار في ملء الشاشة</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          globalAlertsEnabled: true,
                          globalAlerts: [
                            ...(localSettings.globalAlerts || []),
                            { id: `al_${Date.now()}`, text: 'تنبيه جديد للمعلمين', color: 'amber', scope: 'preview_only', active: true }
                          ]
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة تنبيه عام</span>
                    </button>
                  </div>
                </div>

                {(localSettings.globalAlerts || []).map((al, idx) => (
                  <div key={al.id || idx} className="p-3 rounded-2xl bg-white border border-amber-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-7 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={al.active !== false}
                        onChange={(e) => {
                          const arr = [...localSettings.globalAlerts];
                          arr[idx] = { ...al, active: e.target.checked };
                          setLocalSettings({ ...localSettings, globalAlerts: arr });
                        }}
                        className="w-4 h-4 shrink-0"
                      />
                      <input
                        type="text"
                        value={al.text || ''}
                        onChange={(e) => {
                          const arr = [...localSettings.globalAlerts];
                          arr[idx] = { ...al, text: e.target.value };
                          setLocalSettings({ ...localSettings, globalAlerts: arr });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div className="sm:col-span-4 flex items-center gap-1.5">
                      <select
                        value={NOTICE_COLOR_OPTIONS.some((o) => o.id === al.color) ? al.color : 'custom'}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') {
                            const arr = [...localSettings.globalAlerts];
                            arr[idx] = { ...al, color: e.target.value };
                            setLocalSettings({ ...localSettings, globalAlerts: arr });
                          }
                        }}
                        className="flex-1 min-w-0 px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                      >
                        {NOTICE_COLOR_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                        <option value="custom">لون مخصص</option>
                      </select>
                      <input
                        type="color"
                        title="اختر أي درجة لون مخصصة"
                        value={resolveNoticeColorHex(al.color)}
                        onChange={(e) => {
                          const arr = [...localSettings.globalAlerts];
                          arr[idx] = { ...al, color: e.target.value };
                          setLocalSettings({ ...localSettings, globalAlerts: arr });
                        }}
                        className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer shrink-0"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
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

              {/* التحكم في موضع تفاصيل المذكرة داخل نافذة المعاينة ووضع الشاشة الكاملة */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-slate-900">تفاصيل المذكرة داخل نافذة المعاينة (الوصف، المادة، عدد الصفحات)</div>
                  <p className="text-xs text-slate-600 font-bold">حدد موضع ظهور التفاصيل وهل تظهر عند تفعيل وضع ملء الشاشة أم لا</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={localSettings.previewDetailsPosition || 'above_samples'}
                    onChange={(e) => setLocalSettings({ ...localSettings, previewDetailsPosition: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-black"
                  >
                    <option value="above_samples">فوق صفحات المعاينة (الافتراضي)</option>
                    <option value="below_samples">أسفل صفحات المعاينة</option>
                  </select>
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-black text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(localSettings.previewDetailsShowInFullscreen)}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, previewDetailsShowInFullscreen: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span>إظهار في ملء الشاشة</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 2. الواجهة وبطاقة الثقة */}
          {settingsSubTab === 'hero' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شارة الواجهة الرئيسية العلوية</label>
                  <input
                    type="text"
                    value={localSettings.heroBadge || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroBadge: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ارتفاع قسم الواجهة (px)</label>
                  <input
                    type="number"
                    value={localSettings.heroMinHeight || 460}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroMinHeight: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">العنوان الرئيسي الكبير (Hero Title)</label>
                  <input
                    type="text"
                    value={localSettings.heroTitle || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-black"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">النص التعريفي أسفل العنوان</label>
                  <textarea
                    rows={2}
                    value={localSettings.heroSubtitle || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroSubtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>

                {/* التحكم الكامل في زر طلب إعداد مذكرة خاصة */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">التحكم في زر «اطلب إعداد مذكرة خاصة»</span>
                    <label className="flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.showHeroCustomBtn !== false}
                        onChange={(e) => setLocalSettings({ ...localSettings, showHeroCustomBtn: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>إظهار الزر في الواجهة الرئيسية</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">النص المكتوب على الزر</label>
                      <input
                        type="text"
                        value={localSettings.heroCustomBtnText ?? 'اطلب إعداد مذكرة خاصة'}
                        onChange={(e) => setLocalSettings({ ...localSettings, heroCustomBtnText: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">لون الزر</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={localSettings.heroCustomBtnColor || '#facc15'}
                          onChange={(e) => setLocalSettings({ ...localSettings, heroCustomBtnColor: e.target.value })}
                          className="w-12 h-10 rounded-xl border border-slate-200 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-500">
                          {localSettings.heroCustomBtnColor || '#facc15'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* نقاط بطاقة الثقة */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">بطاقة «لماذا يثق بنا المعلمون؟»</span>
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        trustPoints: [...(localSettings.trustPoints || []), 'ميزة جديدة للمنصة']
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black"
                  >
                    + إضافة نقطة
                  </button>
                </div>
                <input
                  type="text"
                  value={localSettings.trustTitle || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, trustTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black"
                />
                {(localSettings.trustPoints || []).map((pt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={pt}
                      onChange={(e) => {
                        const arr = [...localSettings.trustPoints];
                        arr[idx] = e.target.value;
                        setLocalSettings({ ...localSettings, trustPoints: arr });
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          trustPoints: localSettings.trustPoints.filter((_, i) => i !== idx)
                        })
                      }
                      className="p-2 rounded-xl bg-rose-100 text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. شارة التوفير وما الجديد والأخبار */}
          {settingsSubTab === 'sections' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              {/* التحكم الكامل في قسم الإعلان عن القادم وأخبار المنصة */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localSettings.newsSectionEnabled !== false}
                      onChange={(e) => setLocalSettings({ ...localSettings, newsSectionEnabled: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-black text-slate-900">قسم الإعلان عن القادم وأخبار المنصة</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        newsSectionEnabled: true,
                        newsItems: [
                          ...(localSettings.newsItems || []),
                          {
                            id: `news_${Date.now()}`,
                            title: 'عنوان الإصدار القادم',
                            date: 'قريبًا',
                            badgeColor: 'amber',
                            description: 'تفاصيل الإصدار القادم...',
                            showBookingBtn: true,
                            bookingBtnText: 'احجز نسختك مسبقًا عبر واتساب',
                            bookingBtnColor: '#0f172a'
                          }
                        ]
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-amber-500 text-white text-xs font-black flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة إعلان قادم</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">نص الشارة العلوية للقسم</label>
                    <input
                      type="text"
                      value={localSettings.newsSectionBadge ?? 'قريبًا على المنصة'}
                      onChange={(e) => setLocalSettings({ ...localSettings, newsSectionBadge: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">العنوان الرئيسي للقسم</label>
                    <input
                      type="text"
                      value={localSettings.newsSectionTitle || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, newsSectionTitle: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs font-black"
                    />
                  </div>
                </div>

                {(localSettings.newsItems || []).map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 rounded-2xl bg-white border border-amber-200 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="عنوان الإعلان"
                        value={item.title || ''}
                        onChange={(e) => {
                          const arr = [...localSettings.newsItems];
                          arr[idx] = { ...item, title: e.target.value };
                          setLocalSettings({ ...localSettings, newsItems: arr });
                        }}
                        className="sm:col-span-6 px-3 py-2 rounded-xl border border-slate-200 text-xs font-black"
                      />
                      <input
                        type="text"
                        placeholder="شارة الموعد (مثل: قريبًا)"
                        value={item.date || ''}
                        onChange={(e) => {
                          const arr = [...localSettings.newsItems];
                          arr[idx] = { ...item, date: e.target.value };
                          setLocalSettings({ ...localSettings, newsItems: arr });
                        }}
                        className="sm:col-span-3 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                      <select
                        value={item.badgeColor || 'amber'}
                        onChange={(e) => {
                          const arr = [...localSettings.newsItems];
                          arr[idx] = { ...item, badgeColor: e.target.value };
                          setLocalSettings({ ...localSettings, newsItems: arr });
                        }}
                        className="sm:col-span-2 px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                      >
                        <option value="amber">شارة ذهبية</option>
                        <option value="blue">شارة زرقاء</option>
                        <option value="emerald">شارة خضراء</option>
                        <option value="rose">شارة حمراء</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            newsItems: localSettings.newsItems.filter((_, i) => i !== idx)
                          })
                        }
                        className="sm:col-span-1 p-2 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="وصف مختصر للإعلان القادم"
                      value={item.description || ''}
                      onChange={(e) => {
                        const arr = [...localSettings.newsItems];
                        arr[idx] = { ...item, description: e.target.value };
                        setLocalSettings({ ...localSettings, newsItems: arr });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.showBookingBtn !== false}
                          onChange={(e) => {
                            const arr = [...localSettings.newsItems];
                            arr[idx] = { ...item, showBookingBtn: e.target.checked };
                            setLocalSettings({ ...localSettings, newsItems: arr });
                          }}
                          className="w-4 h-4"
                        />
                        <span>إظهار زر «احجز نسختك مسبقًا عبر واتساب»</span>
                      </label>

                      {item.showBookingBtn !== false && (
                        <>
                          <input
                            type="text"
                            placeholder="نص الزر"
                            value={item.bookingBtnText ?? 'احجز نسختك مسبقًا عبر واتساب'}
                            onChange={(e) => {
                              const arr = [...localSettings.newsItems];
                              arr[idx] = { ...item, bookingBtnText: e.target.value };
                              setLocalSettings({ ...localSettings, newsItems: arr });
                            }}
                            className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                          />
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-600">لون الزر:</span>
                            <input
                              type="color"
                              value={item.bookingBtnColor || '#0f172a'}
                              onChange={(e) => {
                                const arr = [...localSettings.newsItems];
                                arr[idx] = { ...item, bookingBtnColor: e.target.value };
                                setLocalSettings({ ...localSettings, newsItems: arr });
                              }}
                              className="w-8 h-7 rounded border border-slate-200 cursor-pointer"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
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
