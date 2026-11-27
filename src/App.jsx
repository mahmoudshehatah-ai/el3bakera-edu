import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  ShieldCheck,
  Tag,
  Sparkles,
  Package,
  Upload,
  Download,
  Edit3,
  Save,
  LogOut,
  FileText,
  Layers,
  Settings,
  ClipboardList,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Award,
  Users,
  Printer,
  Image as ImageIcon,
  Gift,
  ArrowRight
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore';

// قراءة متغيرات البيئة بأمان متوافق مع ES2015
const getEnvVar = (key, fallback) => {
  try {
    if (typeof window !== 'undefined') {
      const savedCfg = window.localStorage?.getItem('el3bakera_fb_config');
      if (savedCfg) {
        const parsed = JSON.parse(savedCfg);
        if (parsed?.[key]) return parsed[key];
      }
      if (window.__FIREBASE_CONFIG__?.[key]) {
        return window.__FIREBASE_CONFIG__[key];
      }
    }
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key];
    }
  } catch {}
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnvVar('apiKey', getEnvVar('VITE_FIREBASE_API_KEY', 'AIzaSyD_du5VY8nJGDJ169Fof9EAlI9x2W2d-14')),
  authDomain: getEnvVar('authDomain', getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'el3bakera-edu.firebaseapp.com')),
  projectId: getEnvVar('projectId', getEnvVar('VITE_FIREBASE_PROJECT_ID', 'el3bakera-edu')),
  storageBucket: getEnvVar('storageBucket', getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'el3bakera-edu.appspot.com')),
  messagingSenderId: getEnvVar('messagingSenderId', getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789')),
  appId: getEnvVar('appId', getEnvVar('VITE_FIREBASE_APP_ID', '1:123456789:web:abcdef'))
};

let app = null;
let auth = null;
let db = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'AIzaSyDummyKeyForPreview') {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch {}

const APP_ID = 'el3bakera-edu';
const publicCol = (colName) => collection(db, 'artifacts', APP_ID, 'public', 'data', colName);
const publicDoc = (colName, docId) => doc(db, 'artifacts', APP_ID, 'public', 'data', colName, docId);
const legacyCol = (colName) => collection(db, colName);
const legacyDoc = (colName, docId) => doc(db, colName, docId);

function safeText(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  return fallback;
}

function toTimeMs(ts) {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (ts.toMillis) return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isValidImageSrc(src) {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (trimmed.startsWith('data:image/') && trimmed.includes(';base64,') && trimmed.length > 100) {
    return true;
  }
  if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.includes('drive.google.com/drive/folders')) {
    return true;
  }
  return false;
}

function compressImageFile(file, maxWidth = 900, quality = 0.78, maxBytes = 420000) {
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
          curQuality = Math.max(0.45, +(curQuality - 0.08).toFixed(2));
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

function processHighQualityLogoFile(file, maxWidth = 4096, maxBytes = 10000000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const originalDataUrl = ev.target.result;
      // الحفاظ على البايتات الخام الأصلية 100% دون أي ضغط أو إعادة رسم لأي ملف حتى 10 ميجابايت
      if (typeof originalDataUrl === 'string' && originalDataUrl.length <= maxBytes) {
        resolve(originalDataUrl);
        return;
      }
      const isPngOrWebp = file.type === 'image/png' || file.type === 'image/webp';
      const img = new Image();
      img.onload = () => {
        let curWidth = img.width > maxWidth ? maxWidth : img.width;
        let curQuality = 0.99;
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
        while (result.length > maxBytes && curWidth > 1600) {
          curWidth = Math.round(curWidth * 0.85);
          if (!isPngOrWebp) curQuality = Math.max(0.92, +(curQuality - 0.03).toFixed(2));
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

function splitDataUrlToChunks(dataUrl, chunkSize = 350000) {
  if (!dataUrl || typeof dataUrl !== 'string') return [];
  const chunks = [];
  for (let i = 0; i < dataUrl.length; i += chunkSize) {
    chunks.push(dataUrl.slice(i, i + chunkSize));
  }
  return chunks;
}

function downloadDataUrlAsOriginalBlob(dataUrl, filenameBase = 'teacher_logo') {
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0]?.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const ext = mime.includes('png')
      ? 'png'
      : mime.includes('webp')
      ? 'webp'
      : mime.includes('svg')
      ? 'svg'
      : 'jpg';
    const byteString = atob(parts[1] || '');
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${filenameBase}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filenameBase}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function normalizeNotebook(id, data = {}) {
  return {
    id,
    title: safeText(data.title, 'مذكرة دراسية'),
    description: safeText(data.description || data.subtitle, ''),
    badge: safeText(data.badge || data.badgeText, ''),
    price: Number(data.price) || 0,
    oldPrice: Number(data.oldPrice) || 0,
    pagesCount: Number(data.pagesCount) || 0,
    categoryId: safeText(data.categoryId, ''),
    stageId: safeText(data.stageId, ''),
    gradeId: safeText(data.gradeId, ''),
    subject: safeText(data.subject, 'اللغة العربية'),
    coverImage: isValidImageSrc(data.coverImage) ? data.coverImage : '',
    driveLink: safeText(data.driveLink, ''),
    driveBtnColor: safeText(data.driveBtnColor, '#059669'),
    detailsPosition: safeText(data.detailsPosition, 'global'),
    featured: Boolean(data.featured),
    sampleImages: Array.isArray(data.sampleImages) ? data.sampleImages.filter(isValidImageSrc) : [],
    createdAt: data.createdAt || data.createdAtMs || null
  };
}

const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة للمذكرات التعليمية',
  platformTagline: 'مذكرات دراسية احترافية مخصصة للمعلم باسمه وبياناته الخاصة',
  heroBadge: 'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle: 'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة بيانات المعلم.',
  heroImage: '',
  logoImage: '',
  whatsappNumber: '201068481536',
  paymentInstructions: 'فودافون كاش : 01068481536 — أرسل صورة التحويل على واتساب لتأكيد الطلب وبدء التخصيص فورًا.',
  facebookUrl: 'https://www.facebook.com',
  telegramUrl: 'https://t.me/+vklZUBKqbWk4YTY0',
  topBannerEnabled: true,
  topBannerText: 'عرض خاص للمعلمين: خصم 15% على جميع المذكرات حتى نهاية الشهر بمناسبة اطلاق موقعنا',
  topBannerCoupon: 'M20',
  globalDetailsPosition: 'top',
  categories: [
    { id: 'cat_0', name: 'مذكرات الفصل الدراسي الأول', image: '' },
    { id: 'cat_1', name: 'مذكرات الفصل الدراسي الثاني', image: '' },
    { id: 'cat_2', name: 'كورسات التأسيس والمراجعات النهائية', image: '' }
  ],
  stages: [
    { id: 'stg_prim_1', name: 'المرحلة الابتدائية' },
    { id: 'stg_prep_1', name: 'المرحلة الإعدادية' },
    { id: 'stg_1795789584022', name: 'المرحلة الثانوية' }
  ],
  grades: [
    { id: 'grd_p4', stageId: 'stg_prim_1', name: 'الصف الرابع الابتدائي' },
    { id: 'grd_p5', stageId: 'stg_prim_1', name: 'الصف الخامس الابتدائي' },
    { id: 'grd_p6', stageId: 'stg_prim_1', name: 'الصف السادس الابتدائي' },
    { id: 'grd_m1', stageId: 'stg_prep_1', name: 'الصف الأول الإعدادي' },
    { id: 'grd_m2', stageId: 'stg_prep_1', name: 'الصف الثاني الإعدادي' },
    { id: 'grd_m3', stageId: 'stg_prep_1', name: 'الصف الثالث الإعدادي' },
    { id: 'grd_1795789597175', stageId: 'stg_1795789584022', name: 'الصف الأول الثانوي' },
    { id: 'grd_1795789611950', stageId: 'stg_1795789584022', name: 'الصف الثاني بكالوريا' },
    { id: 'grd_1795789612478', stageId: 'stg_1795789584022', name: 'الصف الثاني الثانوي' },
    { id: 'grd_1795789612785', stageId: 'stg_1795789584022', name: 'الصف الثالث الثانوي' }
  ],
  subjects: [
    'اللغة العربية',
    'اللغة الإنجليزية',
    'الرياضيات',
    'العلوم',
    'الدراسات الاجتماعية'
  ],
  quantityDiscountEnabled: true,
  quantityDiscountMinCount: 2,
  quantityDiscountType: 'percent',
  quantityDiscountValue: 15,
  quantityDiscountMaxAmount: 150,
  quantityDiscountScope: 'all',
  quantityDiscountNotebookIds: [],
  nextOrderRewardEnabled: true,
  nextOrderRewardPercent: 15,
  nextOrderRewardMaxDiscount: 0,
  nextOrderRewardDays: 7,
  nextOrderRewardPrefix: 'VIP'
};

const BACKUP_INITIAL_PACKAGES = [
  {
    id: 'Q5fhvYenW7ApQJ8H6iPE',
    title: 'المراجعلة الشاملة للمرحلة الإعدادية',
    description: 'مراجعة شاملة لكل صف تشمل (بنك المراجعة + بوكليت الامتحانات)',
    badge: 'وفّر أكثر مع الباقة',
    price: 650,
    oldPrice: 800,
    notebookIds: [
      '1RiLyOKr1A9pIpzF4JfJ',
      'XtvkC4ilRVUbdk4hPXZR',
      '5PU5jPmu0D2wBWOl7N26',
      'Za3cdwmUIgZdSsTtdZBG',
      '5bYQ6PQOifbAVJ7ya33u',
      'zMMZEaGQvdprL4vadOUY'
    ]
  }
];

const BACKUP_INITIAL_COUPONS = [
  {
    id: 'jFiYRhmRvnl9Jf0aJ274',
    code: 'M20',
    type: 'percent',
    value: 15,
    maxDiscount: 0,
    minOrder: 100,
    applyScope: 'all',
    targetNotebookIds: [],
    active: true
  },
  {
    id: 'etujmU4psKGIGZu24ntS',
    code: 'VIP7906',
    type: 'percent',
    value: 15,
    maxDiscount: 0,
    minOrder: 0,
    applyScope: 'all',
    targetNotebookIds: [],
    active: true
  },
  {
    id: 'MbXqI2jk3YDP3XkPbRJm',
    code: 'VIP1589',
    type: 'percent',
    value: 15,
    maxDiscount: 0,
    minOrder: 0,
    applyScope: 'all',
    targetNotebookIds: [],
    active: true
  },
  {
    id: 'yyOlqOnPnPctApTLeZt0',
    code: 'VIP8097',
    type: 'percent',
    value: 15,
    maxDiscount: 0,
    minOrder: 0,
    applyScope: 'all',
    targetNotebookIds: [],
    active: true
  },
  {
    id: 'aQvbcRXB3IhDQefmj5WB',
    code: 'VIP5742',
    type: 'percent',
    value: 15,
    maxDiscount: 0,
    minOrder: 0,
    applyScope: 'all',
    targetNotebookIds: [],
    active: true
  },
  {
    id: 'JVwJQllz46O1xnz0phSj',
    code: 'VIP3885',
    type: 'percent',
    value: 15,
    maxDiscount: 0,
    minOrder: 0,
    applyScope: 'all',
    targetNotebookIds: [],
    active: true
  },
  {
    id: 'ba5JSMjiaUnOMiLFfdfk',
    code: 'VIP2302',
    type: 'percent',
    value: 15,
    maxDiscount: 0,
    minOrder: 0,
    applyScope: 'all',
    targetNotebookIds: [],
    active: true
  }
];

export default function App() {
  // التصفح والحالات العامة
  const [activeView, setActiveView] = useState('home');
  const [selectedDetailNb, setSelectedDetailNb] = useState(null);
  const [detailSamples, setDetailSamples] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [notebooks, setNotebooks] = useState([]);
  const [packages, setPackages] = useState(BACKUP_INITIAL_PACKAGES);
  const [coupons, setCoupons] = useState(BACKUP_INITIAL_COUPONS);
  const [orders, setOrders] = useState([]);

  // فلاتر المكتبة
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');

  // عارض العينات المنبثق
  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [previewSamples, setPreviewSamples] = useState([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [activeSampleIdx, setActiveSampleIdx] = useState(0);

  // السلة والطلبات
  const [cart, setCart] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    teacherName: '',
    phone: '',
    seriesName: '',
    secondPhone: '',
    notes: ''
  });
  const [customerLogoText, setCustomerLogoText] = useState('');
  const [customerLogoImage, setCustomerLogoImage] = useState('');
  const [uploadingCustomerLogo, setUploadingCustomerLogo] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState(null);

  // تتبع الطلب
  const [trackCodeInput, setTrackCodeInput] = useState('');
  const [trackedOrderResult, setTrackedOrderResult] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // الإدارة
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUserEmail, setAdminUserEmail] = useState('');
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('mahmoudelzaaty7@gmail.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [fbApiKeyInput, setFbApiKeyInput] = useState(firebaseConfig.apiKey || '');
  const [showFbSetup, setShowFbSetup] = useState(!firebaseConfig.apiKey);
  const [adminTab, setAdminTab] = useState('notebooks');

  // نماذج الإدارة
  const [editingNotebookId, setEditingNotebookId] = useState(null);
  const [nbForm, setNbForm] = useState({
    title: '',
    description: '',
    badge: '',
    price: '',
    oldPrice: '',
    pagesCount: '',
    categoryId: '',
    stageId: '',
    gradeId: '',
    subject: 'اللغة العربية',
    coverImage: '',
    driveLink: '',
    driveBtnColor: '#059669',
    detailsPosition: 'global',
    featured: false
  });
  const [nbSamples, setNbSamples] = useState([]);
  const [samplesTouched, setSamplesTouched] = useState(false);
  const [savingNotebook, setSavingNotebook] = useState(false);

  const [editingPackageId, setEditingPackageId] = useState(null);
  const [pkgForm, setPkgForm] = useState({
    title: '',
    description: '',
    badge: 'وفّر أكثر مع الباقة',
    price: '',
    oldPrice: '',
    notebookIds: []
  });
  const [pkgNbSearch, setPkgNbSearch] = useState('');

  const [editingCouponId, setEditingCouponId] = useState(null);
  const [cpForm, setCpForm] = useState({
    code: '',
    type: 'percent',
    value: '',
    maxDiscount: '',
    minOrder: '',
    maxUses: '',
    applyScope: 'all',
    targetNotebookIds: []
  });
  const [cpNbSearch, setCpNbSearch] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeStageId, setNewGradeStageId] = useState('');

  const [toast, setToast] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');
  const [confirmClearCompleted, setConfirmClearCompleted] = useState(false);
  const [clearingCompleted, setClearingCompleted] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3600);
  };

  const handleCopyText = (txt) => {
    if (!txt) return;
    navigator.clipboard?.writeText(txt).catch(() => {});
    setCopiedCode(txt);
    showToast(`تم نسخ الكود: ${txt}`);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // المصادقة ومزامنة Firestore
  useEffect(() => {
    if (!auth) return;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        setIsAdmin(true);
        setAdminUserEmail(user.email || '');
      } else {
        setIsAdmin(false);
        setAdminUserEmail('');
        if (!user) {
          signInAnonymously(auth).catch(() => {});
        }
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!db) return;

    const loadMediaAssets = async (catsList) => {
      try {
        const [logoSnap, heroSnap] = await Promise.all([
          getDoc(publicDoc('settings', 'media_logo')).catch(() => null),
          getDoc(publicDoc('settings', 'media_hero')).catch(() => null)
        ]);
        const mediaUpdates = {};
        if (logoSnap?.exists() && isValidImageSrc(logoSnap.data()?.image)) {
          mediaUpdates.logoImage = logoSnap.data().image;
        }
        if (heroSnap?.exists() && isValidImageSrc(heroSnap.data()?.image)) {
          mediaUpdates.heroImage = heroSnap.data().image;
        }

        const catImages = {};
        if (Array.isArray(catsList) && catsList.length > 0) {
          await Promise.all(
            catsList.map(async (cat) => {
              const snap = await getDoc(publicDoc('settings', `media_cat_${cat.id}`)).catch(() => null);
              if (snap?.exists() && isValidImageSrc(snap.data()?.image)) {
                catImages[cat.id] = snap.data().image;
              }
            })
          );
        }

        setSettings((prev) => ({
          ...prev,
          ...mediaUpdates,
          categories: (prev.categories || []).map((c) =>
            catImages[c.id] ? { ...c, image: catImages[c.id] } : c
          )
        }));
      } catch {}
    };

    const mergeSettingsPayload = (data) => {
      if (!data) return;
      const mergedCats =
        Array.isArray(data.categories) && data.categories.length > 0
          ? data.categories
          : DEFAULT_SETTINGS.categories;

      setSettings((prev) => ({
        ...prev,
        ...data,
        categories: mergedCats.map((c) => {
          const oldCat = (prev.categories || []).find((oc) => oc.id === c.id);
          return {
            ...c,
            name: safeText(c.name || c.title || c.label, 'قسم دراسي'),
            image: isValidImageSrc(c.image) ? c.image : oldCat?.image || ''
          };
        }),
        stages:
          Array.isArray(data.stages) && data.stages.length > 0
            ? data.stages.map((s) => ({
                ...s,
                name: safeText(s.name || s.title || s.label, 'مرحلة دراسية')
              }))
            : prev.stages,
        grades:
          Array.isArray(data.grades) && data.grades.length > 0
            ? data.grades.map((g) => ({
                ...g,
                name: safeText(g.name || g.title || g.label, 'صف دراسي')
              }))
            : prev.grades
      }));

      loadMediaAssets(mergedCats);

      if (Array.isArray(data.cachedPackages) && data.cachedPackages.length > 0) {
        setPackages((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          data.cachedPackages.forEach((p) => {
            if (p?.id) map.set(p.id, p);
          });
          return Array.from(map.values());
        });
      }
      if (Array.isArray(data.cachedCoupons) && data.cachedCoupons.length > 0) {
        setCoupons((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          data.cachedCoupons.forEach((c) => {
            if (c?.id) map.set(c.id, c);
          });
          return Array.from(map.values());
        });
      }
    };

    const unsubSettings = onSnapshot(
      publicDoc('settings', 'main'),
      (snap) => {
        if (snap.exists()) mergeSettingsPayload(snap.data());
      },
      () => {}
    );

    const unsubNotebooks = onSnapshot(
      publicCol('notebooks'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => normalizeNotebook(d.id, d.data()));
          list.sort((a, b) => toTimeMs(b.createdAt) - toTimeMs(a.createdAt));
          setNotebooks(list);
        }
      },
      () => {}
    );

    const unsubPackages = onSnapshot(
      publicCol('packages'),
      (snap) => {
        if (!snap.empty) {
          setPackages((prev) => {
            const map = new Map(prev.map((p) => [p.id, p]));
            snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
            return Array.from(map.values());
          });
        }
      },
      () => {}
    );

    const unsubCoupons = onSnapshot(
      publicCol('coupons'),
      (snap) => {
        if (!snap.empty) {
          setCoupons((prev) => {
            const map = new Map(prev.map((c) => [c.id, c]));
            snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
            return Array.from(map.values());
          });
        }
      },
      () => {}
    );

    return () => {
      unsubSettings();
      unsubNotebooks();
      unsubPackages();
      unsubCoupons();
    };
  }, []);

  // مزامنة الطلبات للمدير فقط مع إعادة تجميع أجزاء شعار المعلم
  useEffect(() => {
    if (!isAdmin || !db) {
      setOrders([]);
      return;
    }
    const unsubOrders = onSnapshot(
      publicCol('orders'),
      (snap) => {
        const chunkMap = {};
        const rawOrders = [];
        snap.docs.forEach((d) => {
          const data = d.data() || {};
          if (data.isLogoChunk && data.orderCode) {
            if (!chunkMap[data.orderCode]) chunkMap[data.orderCode] = [];
            chunkMap[data.orderCode][Number(data.chunkIndex) || 0] = data.chunkData || '';
          } else {
            rawOrders.push({ id: d.id, ...data });
          }
        });
        const list = rawOrders.map((ord) => {
          if (ord.orderCode && Array.isArray(chunkMap[ord.orderCode]) && chunkMap[ord.orderCode].length > 0) {
            return { ...ord, customerLogoImage: chunkMap[ord.orderCode].join('') };
          }
          return ord;
        });
        list.sort((a, b) => toTimeMs(b.createdAt) - toTimeMs(a.createdAt));
        setOrders(list);
      },
      () => {}
    );
    return () => {
      try {
        unsubOrders();
      } catch {}
    };
  }, [isAdmin]);

  // جلب صور العينات لمذكرة معينة
  const fetchNotebookSamplesList = async (nb) => {
    if (!nb) return [];
    const collected = [];
    if (db) {
      const pagePromises = [];
      for (let i = 0; i < 24; i++) {
        pagePromises.push(getDoc(publicDoc('notebook_samples', `${nb.id}_p${i}`)).catch(() => null));
      }
      const pageSnaps = await Promise.all(pagePromises);
      pageSnaps.forEach((snap) => {
        if (snap && snap.exists()) {
          const img = snap.data()?.image;
          if (isValidImageSrc(img) && !collected.includes(img)) {
            collected.push(img);
          }
        }
      });

      if (collected.length === 0) {
        const mainSnap = await getDoc(publicDoc('notebook_samples', nb.id)).catch(() => null);
        if (mainSnap && mainSnap.exists()) {
          const imgs = mainSnap.data()?.images || [];
          imgs.forEach((img) => {
            if (isValidImageSrc(img) && !collected.includes(img)) collected.push(img);
          });
        }
      }
    }

    if (collected.length === 0 && Array.isArray(nb.sampleImages)) {
      nb.sampleImages.forEach((img) => {
        if (isValidImageSrc(img) && !collected.includes(img)) collected.push(img);
      });
    }
    return collected;
  };

  const openNotebookPreview = async (nb) => {
    setPreviewNotebook(nb);
    setActiveSampleIdx(0);
    setPreviewSamples([]);
    setLoadingSamples(true);
    try {
      const imgs = await fetchNotebookSamplesList(nb);
      setPreviewSamples(imgs);
    } finally {
      setLoadingSamples(false);
    }
  };

  const openNotebookFullDetails = async (nb) => {
    setSelectedDetailNb(nb);
    setDetailSamples([]);
    setActiveView('notebook_details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const imgs = await fetchNotebookSamplesList(nb);
    setDetailSamples(imgs);
  };

  // حسابات السلة والخصومات
  const addToCart = (item, isPackage = false) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: (i.qty || 1) + 1 } : i));
      }
      return [
        ...prev,
        {
          id: item.id,
          title: item.title,
          price: Number(item.price) || 0,
          coverImage: item.coverImage || '',
          isPackage,
          qty: 1
        }
      ];
    });
    showToast(`تمت إضافة "${item.title}" إلى السلة`);
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: (item.qty || 1) + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0),
    [cart]
  );

  const quantityDiscountInfo = useMemo(() => {
    if (!settings.quantityDiscountEnabled) {
      return { amount: 0, remaining: 0, qualified: false };
    }
    const minCount = Math.max(2, Number(settings.quantityDiscountMinCount) || 2);
    const scope = settings.quantityDiscountScope || 'all';
    const allowedIds = Array.isArray(settings.quantityDiscountNotebookIds)
      ? settings.quantityDiscountNotebookIds
      : [];

    const eligibleItems = cart.filter((item) => {
      if (item.isPackage) return false;
      if (scope === 'specific') return allowedIds.includes(item.id);
      return true;
    });

    const eligibleCount = eligibleItems.reduce((sum, i) => sum + (i.qty || 1), 0);
    const eligibleTotal = eligibleItems.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.qty || 1), 0);

    if (eligibleCount < minCount) {
      return {
        amount: 0,
        remaining: minCount - eligibleCount,
        qualified: false
      };
    }

    const val = Number(settings.quantityDiscountValue) || 0;
    let rawDiscount =
      settings.quantityDiscountType === 'fixed' ? val : Math.round((eligibleTotal * val) / 100);
    const maxCap = Number(settings.quantityDiscountMaxAmount) || 0;
    if (maxCap > 0 && rawDiscount > maxCap) rawDiscount = maxCap;
    rawDiscount = Math.min(rawDiscount, eligibleTotal);

    return {
      amount: rawDiscount,
      remaining: 0,
      qualified: rawDiscount > 0
    };
  }, [cart, settings]);

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon || cart.length === 0) return 0;
    const scope = appliedCoupon.applyScope || 'all';
    const targetIds = Array.isArray(appliedCoupon.targetNotebookIds) ? appliedCoupon.targetNotebookIds : [];

    const eligibleTotal = cart.reduce((sum, item) => {
      const lineTotal = (Number(item.price) || 0) * (item.qty || 1);
      if (scope === 'include') {
        return targetIds.includes(item.id) ? sum + lineTotal : sum;
      }
      if (scope === 'exclude') {
        return !targetIds.includes(item.id) ? sum + lineTotal : sum;
      }
      return sum + lineTotal;
    }, 0);

    if (eligibleTotal <= 0) return 0;
    const val = Number(appliedCoupon.value) || 0;
    let discount =
      appliedCoupon.type === 'fixed' ? val : Math.round((eligibleTotal * val) / 100);
    const maxCap = Number(appliedCoupon.maxDiscount) || 0;
    if (maxCap > 0 && discount > maxCap) discount = maxCap;
    return Math.min(discount, eligibleTotal);
  }, [appliedCoupon, cart]);

  const cartFinalTotal = Math.max(0, cartSubtotal - quantityDiscountInfo.amount - couponDiscountAmount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    let found = coupons.find((c) => safeText(c.code).toUpperCase() === code && c.active !== false);
    if (!found && settings.topBannerEnabled && safeText(settings.topBannerCoupon).toUpperCase() === code) {
      found = {
        id: 'banner_coupon',
        code,
        type: 'percent',
        value: 15,
        applyScope: 'all'
      };
    }

    if (!found) {
      showToast('كود الخصم غير صحيح أو منتهي الصلاحية.', 'error');
      return;
    }

    if (found.maxUses && Number(found.maxUses) > 0 && Number(found.usedCount || 0) >= Number(found.maxUses)) {
      showToast('عذرًا، تم استنفاد الحد الأقصى لاستخدام هذا الكوبون.', 'error');
      return;
    }

    if (found.minOrder && cartSubtotal < Number(found.minOrder)) {
      showToast(`الحد الأدنى لتطبيق هذا الكوبون هو ${found.minOrder} ج.م`, 'error');
      return;
    }

    const scope = found.applyScope || 'all';
    const targetIds = Array.isArray(found.targetNotebookIds) ? found.targetNotebookIds : [];
    const hasEligible = cart.some((item) => {
      if (scope === 'include') return targetIds.includes(item.id);
      if (scope === 'exclude') return !targetIds.includes(item.id);
      return true;
    });

    if (!hasEligible) {
      showToast('هذا الكوبون لا ينطبق على المذكرات الموجودة في السلة حاليًا.', 'error');
      return;
    }

    setAppliedCoupon(found);
    showToast(`تم تطبيق كود الخصم ${found.code} بنجاح!`);
  };

  // إرسال الطلب وحفظ شعار المعلم بالأجزاء الكاملة
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerForm.teacherName.trim() || !customerForm.phone.trim()) {
      showToast('يرجى إدخال اسم المعلم ورقم الهاتف.', 'error');
      return;
    }

    setSubmittingOrder(true);
    try {
      const orderCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const generatedRewardCode = settings.nextOrderRewardEnabled
        ? `NEXT-${Math.floor(1000 + Math.random() * 9000)}`
        : '';

      const logoChunks = customerLogoImage ? splitDataUrlToChunks(customerLogoImage, 350000) : [];
      const orderDoc = {
        orderCode,
        customer: customerForm,
        customerLogoText: customerLogoText.trim(),
        customerLogoImage: logoChunks.length === 1 ? logoChunks[0] : '',
        customerLogoChunksCount: logoChunks.length,
        hasLogoImage: logoChunks.length > 0,
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
        const createdOrderRef = await addDoc(publicCol('orders'), orderDoc);
        if (logoChunks.length > 1) {
          await Promise.all(
            logoChunks.map((chunkStr, cIdx) =>
              setDoc(
                publicDoc('orders', `${createdOrderRef.id}_logo_${cIdx}`),
                {
                  parentOrderId: createdOrderRef.id,
                  orderCode,
                  chunkIndex: cIdx,
                  chunkData: chunkStr,
                  isLogoChunk: true,
                  createdAt: serverTimestamp()
                },
                { merge: true }
              )
            )
          );
        }
        if (generatedRewardCode) {
          await setDoc(publicDoc('coupons', `reward_${orderCode}`), {
            id: `reward_${orderCode}`,
            code: generatedRewardCode,
            type: 'percent',
            value: Number(settings.nextOrderRewardPercent) || 15,
            maxDiscount: Number(settings.nextOrderRewardMaxDiscount) || 0,
            maxUses: 1,
            usedCount: 0,
            applyScope: 'all',
            active: true
          }).catch(() => {});
        }
        if (appliedCoupon?.id && appliedCoupon.id !== 'banner_coupon') {
          await setDoc(
            publicDoc('coupons', appliedCoupon.id),
            { usedCount: increment(1) },
            { merge: true }
          ).catch(() => {});
        }
      }

      const itemsLines = cart
        .map((i) => `• ${i.title} (${i.qty || 1} × ${i.price} ج.م)`)
        .join('\n');
      const waMsg = [
        `السلام عليكم، طلب جديد من *${settings.platformName}*`,
        `رقم الطلب: *${orderCode}*`,
        `اسم المعلم: *${customerForm.teacherName}*`,
        `رقم الهاتف: *${customerForm.phone}*`,
        customerForm.seriesName ? `اسم السلسلة: *${customerForm.seriesName}*` : '',
        customerLogoText ? `نص الشعار: *${customerLogoText}*` : '',
        customerLogoImage ? `🖼️ تم إرفاق صورة شعار المعلم بالجودة الأصلية الكاملة في النظام` : '',
        `------------------`,
        itemsLines,
        `------------------`,
        `الإجمالي النهائي: *${cartFinalTotal} ج.م*`,
        customerForm.notes ? `ملاحظات: ${customerForm.notes}` : ''
      ]
        .filter(Boolean)
        .join('\n');

      const waNum = safeText(settings.whatsappNumber, '201000000000').replace(/\D/g, '');
      window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}`, '_blank');

      setLastSubmittedOrder({ orderCode, rewardCoupon: generatedRewardCode });
      setCart([]);
      setAppliedCoupon(null);
      setCustomerLogoImage('');
      setCustomerLogoText('');
      showToast(`تم تسجيل طلبك بنجاح برقم ${orderCode}`);
    } catch {
      showToast('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // تتبع الطلب
  const handleTrackOrder = async () => {
    const code = trackCodeInput.trim().toUpperCase();
    if (!code) {
      showToast('يرجى إدخال رقم الطلب أولاً.', 'error');
      return;
    }
    setTrackingLoading(true);
    setTrackedOrderResult(null);
    try {
      const localMatch = orders.find((o) => safeText(o.orderCode).toUpperCase() === code);
      if (localMatch) {
        setTrackedOrderResult(localMatch);
        return;
      }
      if (db) {
        const snap = await getDocs(publicCol('orders'));
        const foundDoc = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .find((o) => !o.isLogoChunk && safeText(o.orderCode).toUpperCase() === code);
        if (foundDoc) {
          setTrackedOrderResult(foundDoc);
          return;
        }
      }
      showToast('لم يتم العثور على طلب بهذا الرقم.', 'error');
    } finally {
      setTrackingLoading(false);
    }
  };

  // حفظ وتعميم الإعدادات والوسائط للسحابة
  const saveAllSettingsToCloud = async (
    updatedSettings,
    nextPackages = packages,
    nextCoupons = coupons
  ) => {
    setSettings(updatedSettings);
    if (!db) return;

    const cleanCategories = (updatedSettings.categories || []).map((c) => ({
      id: c.id,
      name: c.name
    }));

    const payload = {
      ...updatedSettings,
      logoImage: '',
      heroImage: '',
      categories: cleanCategories,
      cachedPackages: nextPackages,
      cachedCoupons: nextCoupons,
      syncVersion: Date.now()
    };

    const tasks = [
      setDoc(publicDoc('settings', 'main'), payload, { merge: true }),
      setDoc(legacyDoc('settings', 'main'), payload, { merge: true }).catch(() => {})
    ];

    if (isValidImageSrc(updatedSettings.logoImage)) {
      tasks.push(
        setDoc(publicDoc('settings', 'media_logo'), { image: updatedSettings.logoImage }, { merge: true }).catch(() => {})
      );
    }
    if (isValidImageSrc(updatedSettings.heroImage)) {
      tasks.push(
        setDoc(publicDoc('settings', 'media_hero'), { image: updatedSettings.heroImage }, { merge: true }).catch(() => {})
      );
    }
    (updatedSettings.categories || []).forEach((cat) => {
      if (isValidImageSrc(cat.image)) {
        tasks.push(
          setDoc(publicDoc('settings', `media_cat_${cat.id}`), { image: cat.image }, { merge: true }).catch(() => {})
        );
      }
    });

    await Promise.all(tasks);
  };

  // تصدير نسخة احتياطية JSON
  const handleExportPlatformBackup = async () => {
    setExportingBackup(true);
    try {
      const backupPayload = {
        exportedAt: new Date().toISOString(),
        platform: settings.platformName,
        settings,
        notebooks,
        packages,
        coupons,
        orders: orders.map((o) => ({
          ...o,
          customerLogoImage: o.customerLogoImage ? '[مرفق صورة شعار]' : ''
        }))
      };
      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `el3bakera_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast('تم تحميل نسخة بيانات المنصة بنجاح!');
    } catch {
      showToast('تعذر تحميل ملف النسخة الاحتياطية.', 'error');
    } finally {
      setExportingBackup(false);
    }
  };

  // حفظ مذكرة جديدة أو معدّلة
  const handleSaveNotebook = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim() || !nbForm.price) {
      showToast('يرجى إدخال اسم المذكرة والسعر الحالي.', 'error');
      return;
    }
    setSavingNotebook(true);
    try {
      const nbId = editingNotebookId || `nb_${Date.now()}`;
      const docData = {
        title: nbForm.title.trim(),
        description: nbForm.description.trim(),
        badge: nbForm.badge.trim(),
        price: Number(nbForm.price) || 0,
        oldPrice: Number(nbForm.oldPrice) || 0,
        pagesCount: Number(nbForm.pagesCount) || 0,
        categoryId: nbForm.categoryId,
        stageId: nbForm.stageId,
        gradeId: nbForm.gradeId,
        subject: nbForm.subject.trim() || 'اللغة العربية',
        coverImage: nbForm.coverImage,
        driveLink: nbForm.driveLink.trim(),
        driveBtnColor: nbForm.driveBtnColor || '#059669',
        detailsPosition: nbForm.detailsPosition || 'global',
        featured: Boolean(nbForm.featured),
        updatedAt: serverTimestamp(),
        ...(editingNotebookId ? {} : { createdAt: serverTimestamp() })
      };

      if (db) {
        await setDoc(publicDoc('notebooks', nbId), docData, { merge: true });

        if (samplesTouched) {
          const validSamples = nbSamples.filter(isValidImageSrc).slice(0, 24);
          await Promise.all(
            validSamples.map((img, idx) =>
              setDoc(publicDoc('notebook_samples', `${nbId}_p${idx}`), {
                notebookId: nbId,
                pageIndex: idx,
                image: img
              })
            )
          );
          for (let j = validSamples.length; j < 24; j++) {
            await deleteDoc(publicDoc('notebook_samples', `${nbId}_p${j}`)).catch(() => {});
          }
          await setDoc(publicDoc('notebook_samples', nbId), {
            images: validSamples.slice(0, 2)
          }).catch(() => {});
        }
      }

      setEditingNotebookId(null);
      setNbForm({
        title: '',
        description: '',
        badge: '',
        price: '',
        oldPrice: '',
        pagesCount: '',
        categoryId: '',
        stageId: '',
        gradeId: '',
        subject: 'اللغة العربية',
        coverImage: '',
        driveLink: '',
        driveBtnColor: '#059669',
        detailsPosition: 'global',
        featured: false
      });
      setNbSamples([]);
      setSamplesTouched(false);
      showToast(editingNotebookId ? 'تم تحديث بيانات المذكرة بنجاح!' : 'تمت إضافة المذكرة بنجاح!');
    } catch {
      showToast('حدث خطأ أثناء حفظ المذكرة.', 'error');
    } finally {
      setSavingNotebook(false);
    }
  };

  const startEditNotebook = async (nb) => {
    setEditingNotebookId(nb.id);
    setNbForm({
      title: nb.title || '',
      description: nb.description || '',
      badge: nb.badge || '',
      price: String(nb.price || ''),
      oldPrice: String(nb.oldPrice || ''),
      pagesCount: String(nb.pagesCount || ''),
      categoryId: nb.categoryId || '',
      stageId: nb.stageId || '',
      gradeId: nb.gradeId || '',
      subject: nb.subject || 'اللغة العربية',
      coverImage: nb.coverImage || '',
      driveLink: nb.driveLink || '',
      driveBtnColor: nb.driveBtnColor || '#059669',
      detailsPosition: nb.detailsPosition || 'global',
      featured: Boolean(nb.featured)
    });
    setSamplesTouched(false);
    const existingSamples = await fetchNotebookSamplesList(nb);
    setNbSamples(existingSamples);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePackageNotebook = (nb) => {
    setPkgForm((prev) => {
      const exists = prev.notebookIds.includes(nb.id);
      const nextIds = exists
        ? prev.notebookIds.filter((id) => id !== nb.id)
        : [...prev.notebookIds, nb.id];
      const autoOldPrice = nextIds.reduce((sum, id) => {
        const item = notebooks.find((n) => n.id === id);
        return sum + (Number(item?.price) || 0);
      }, 0);
      return {
        ...prev,
        notebookIds: nextIds,
        oldPrice: autoOldPrice > 0 ? String(autoOldPrice) : prev.oldPrice
      };
    });
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!pkgForm.title.trim() || !pkgForm.price) {
      showToast('يرجى إدخال اسم الباقة وسعرها.', 'error');
      return;
    }
    const pkgId = editingPackageId || `pkg_${Date.now()}`;
    const pkgObj = {
      id: pkgId,
      title: pkgForm.title.trim(),
      description: pkgForm.description.trim(),
      badge: pkgForm.badge.trim(),
      price: Number(pkgForm.price) || 0,
      oldPrice: Number(pkgForm.oldPrice) || 0,
      notebookIds: pkgForm.notebookIds
    };
    const nextPackages = editingPackageId
      ? packages.map((p) => (p.id === pkgId ? pkgObj : p))
      : [pkgObj, ...packages];

    setPackages(nextPackages);
    if (db) {
      await setDoc(publicDoc('packages', pkgId), pkgObj, { merge: true }).catch(() => {});
      await saveAllSettingsToCloud(settings, nextPackages, coupons);
    }
    setEditingPackageId(null);
    setPkgForm({
      title: '',
      description: '',
      badge: 'وفّر أكثر مع الباقة',
      price: '',
      oldPrice: '',
      notebookIds: []
    });
    showToast('تم حفظ باقة التوفير ونشرها للعملاء!');
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!cpForm.code.trim() || !cpForm.value) {
      showToast('يرجى إدخال كود الكوبون وقيمة الخصم.', 'error');
      return;
    }
    const cpId = editingCouponId || `cp_${Date.now()}`;
    const cpObj = {
      id: cpId,
      code: cpForm.code.trim().toUpperCase(),
      type: cpForm.type,
      value: Number(cpForm.value) || 0,
      maxDiscount: Number(cpForm.maxDiscount) || 0,
      minOrder: Number(cpForm.minOrder) || 0,
      maxUses: Number(cpForm.maxUses) || 0,
      applyScope: cpForm.applyScope || 'all',
      targetNotebookIds: cpForm.targetNotebookIds || [],
      active: true
    };
    const nextCoupons = editingCouponId
      ? coupons.map((c) => (c.id === cpId ? cpObj : c))
      : [cpObj, ...coupons];

    setCoupons(nextCoupons);
    if (db) {
      await setDoc(publicDoc('coupons', cpId), cpObj, { merge: true }).catch(() => {});
      await saveAllSettingsToCloud(settings, packages, nextCoupons);
    }
    setEditingCouponId(null);
    setCpForm({
      code: '',
      type: 'percent',
      value: '',
      maxDiscount: '',
      minOrder: '',
      maxUses: '',
      applyScope: 'all',
      targetNotebookIds: []
    });
    showToast('تم حفظ كود الخصم ونشره للعملاء!');
  };

  const filteredNotebooks = useMemo(() => {
    return notebooks.filter((nb) => {
      if (selectedCategoryId && nb.categoryId !== selectedCategoryId) return false;
      if (selectedStageId && nb.stageId !== selectedStageId) return false;
      if (selectedGradeId && nb.gradeId !== selectedGradeId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inTitle = nb.title.toLowerCase().includes(q);
        const inDesc = nb.description.toLowerCase().includes(q);
        const inSub = nb.subject.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inSub) return false;
      }
      return true;
    });
  }, [notebooks, selectedCategoryId, selectedStageId, selectedGradeId, searchQuery]);

  const countNotebooksInCategory = (cat) =>
    notebooks.filter((nb) => nb.categoryId === cat.id).length;

  const effectivePreviewDetailsPos = useMemo(() => {
    if (!previewNotebook) return 'top';
    if (previewNotebook.detailsPosition && previewNotebook.detailsPosition !== 'global') {
      return previewNotebook.detailsPosition;
    }
    return settings.globalDetailsPosition || 'top';
  }, [previewNotebook, settings.globalDetailsPosition]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (fbApiKeyInput.trim() && fbApiKeyInput.trim() !== firebaseConfig.apiKey) {
      try {
        window.localStorage?.setItem(
          'el3bakera_fb_config',
          JSON.stringify({ ...firebaseConfig, apiKey: fbApiKeyInput.trim() })
        );
        window.location.reload();
        return;
      } catch {}
    }
    if (!auth) {
      setShowFbSetup(true);
      showToast('يرجى إدخال مفتاح Firebase API Key الخاص بمشروعك أولاً.', 'error');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      setAdminLoginOpen(false);
      setActiveView('admin');
      showToast('تم تسجيل الدخول إلى لوحة التحكم بنجاح.');
    } catch (err) {
      showToast(`تعذر تسجيل الدخول: ${err?.code || 'تأكد من البريد وكلمة المرور'}`, 'error');
    }
  };

  const whatsappDirectUrl = `https://wa.me/${safeText(settings.whatsappNumber, '201000000000').replace(/\D/g, '')}`;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* إشعار Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-black flex items-center gap-2.5 transition-all ${
            toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* الشريط الإعلاني العلوي */}
      {settings.topBannerEnabled && settings.topBannerText && (
        <div className="bg-blue-600 text-white py-2 px-4 text-center text-xs sm:text-sm font-bold flex flex-wrap items-center justify-center gap-2">
          <span>{safeText(settings.topBannerText)}</span>
          {settings.topBannerCoupon && (
            <button
              type="button"
              onClick={() => handleCopyText(settings.topBannerCoupon)}
              className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1 hover:bg-amber-300 transition"
            >
              <span>{safeText(settings.topBannerCoupon)}</span>
              {copiedCode === settings.topBannerCoupon ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}

      {/* الهيدر الرئيسي */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div
            onClick={() => setActiveView('home')}
            onDoubleClick={() => {
              if (isAdmin) {
                setActiveView('admin');
              } else {
                setAdminLoginOpen(true);
              }
            }}
            title="اضغط مرتين لدخول الإدارة"
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            {isValidImageSrc(settings.logoImage) ? (
              <img
                src={settings.logoImage}
                alt="شعار المنصة"
                className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black shadow-sm">
                <BookOpen className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {safeText(settings.platformName)}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-bold">
                {safeText(settings.platformTagline)}
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: 'home', label: 'الرئيسية' },
              { id: 'library', label: 'المذكرات' },
              { id: 'offers', label: 'العروض' },
              { id: 'track', label: 'تتبع طلبك' }
            ].map((navItem) => (
              <button
                key={navItem.id}
                type="button"
                onClick={() => setActiveView(navItem.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                  activeView === navItem.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {navItem.label}
              </button>
            ))}

            <a
              href={whatsappDirectUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black inline-flex items-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>تواصل معنا</span>
            </a>

            <button
              type="button"
              onClick={() => setActiveView('cart')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black inline-flex items-center gap-1.5 transition relative"
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
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black inline-flex items-center gap-1.5 transition ${
                  activeView === 'admin'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>لوحة الإدارة</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ================= الصفحة الرئيسية ================= */}
        {activeView === 'home' && (
          <div className="space-y-12">
            {/* البانر الترحيبي المتطور */}
            <section className="rounded-3xl bg-gradient-to-l from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-400/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>جاهزة للطباعة الفورية باسمك وشعارك</span>
                </span>
                <h2 className="text-2xl sm:text-4xl font-black leading-snug">
                  {safeText(settings.heroTitle, DEFAULT_SETTINGS.heroTitle)}
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {safeText(settings.heroSubtitle, DEFAULT_SETTINGS.heroSubtitle)}
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveView('library')}
                    className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-lg transition"
                  >
                    استعراض جميع المذكرات
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('offers')}
                    className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-sm border border-white/20 transition"
                  >
                    باقات التوفير والعروض
                  </button>
                </div>

                {/* شريط إحصائيات الثقة */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 max-w-lg">
                  <div>
                    <div className="text-lg sm:text-xl font-black text-amber-400">+{Math.max(notebooks.length, 50)}</div>
                    <div className="text-[11px] text-slate-300 font-bold">مذكرة وبنك أسئلة</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black text-emerald-400">+500</div>
                    <div className="text-[11px] text-slate-300 font-bold">معلم يثق بنا</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black text-blue-400">100%</div>
                    <div className="text-[11px] text-slate-300 font-bold">تخصيص باسمك وشعارك</div>
                  </div>
                </div>
              </div>

              {isValidImageSrc(settings.heroImage) && (
                <div className="w-full max-w-md lg:max-w-lg shrink-0">
                  <img
                    src={settings.heroImage}
                    alt="صورة العرض"
                    className="w-full h-auto rounded-3xl border-2 border-white/15 shadow-2xl object-contain bg-white/5"
                  />
                </div>
              )}
            </section>

            {/* الأقسام الدراسية مع دعم الصور المخصصة لكل قسم */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">الأقسام الدراسية</h2>
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
                  عرض الكل ({notebooks.length})
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(settings.categories || []).map((cat) => {
                  const catCount = countNotebooksInCategory(cat);
                  const hasCatImg = isValidImageSrc(cat.image);
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
                      {hasCatImg && (
                        <div className="h-40 w-full bg-slate-100 overflow-hidden">
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                      )}
                      <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition">
                            {safeText(cat.name)}
                          </h3>
                          <p className="text-xs text-slate-500 font-bold">{catCount} مذكرة متاحة</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                          <ChevronLeft className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* المذكرات الأكثر طلبًا / المميزة */}
            {notebooks.some((n) => n.featured) && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">المذكرات الأكثر طلبًا وتميزًا</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notebooks
                    .filter((n) => n.featured)
                    .slice(0, 6)
                    .map((nb) => (
                      <NotebookCard
                        key={nb.id}
                        nb={nb}
                        onPreview={() => openNotebookPreview(nb)}
                        onOpenDetails={() => openNotebookFullDetails(nb)}
                        onAddToCart={() => addToCart(nb, false)}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* أحدث المذكرات */}
            {notebooks.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">أحدث المذكرات المضافة</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notebooks.slice(0, 6).map((nb) => (
                    <NotebookCard
                      key={nb.id}
                      nb={nb}
                      onPreview={() => openNotebookPreview(nb)}
                      onOpenDetails={() => openNotebookFullDetails(nb)}
                      onAddToCart={() => addToCart(nb, false)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* لماذا يختارنا المعلمون */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">تنسيق احترافي جاهز للطباعة</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-bold">
                  تصميم عصري مريح لعين الطالب مع هوامش ومساحات حل منظمة وجاهزة للطباعة الفورية.
                </p>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">تخصيص كامل بهويتك الخاصة</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-bold">
                  وضع اسمك ورقم هاتفك واسم سلسلتك وشعارك الخاص على الغلاف وجميع الصفحات الداخلية.
                </p>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">محتوى مطابق لأحدث المواصفات</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-bold">
                  شرح مبسط وتدريبات متدرجة وبنوك أسئلة شاملة تغطي كافة نواتج التعلم والامتحانات.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* ================= صفحة تفاصيل المذكرة الكاملة ================= */}
        {activeView === 'notebook_details' && selectedDetailNb && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setActiveView('library')}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-700 inline-flex items-center gap-1.5 hover:bg-slate-100"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى المكتبة</span>
            </button>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  {selectedDetailNb.coverImage ? (
                    <img
                      src={selectedDetailNb.coverImage}
                      alt={selectedDetailNb.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <BookOpen className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openNotebookPreview(selectedDetailNb)}
                  className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>فتح عارض العينات التفاعلي</span>
                </button>
              </div>

              <div className="lg:col-span-2 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black">
                      {selectedDetailNb.subject}
                    </span>
                    {selectedDetailNb.pagesCount > 0 && (
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                        {selectedDetailNb.pagesCount} صفحة
                      </span>
                    )}
                    {selectedDetailNb.badge && (
                      <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                        {selectedDetailNb.badge}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{selectedDetailNb.title}</h2>

                  {selectedDetailNb.description && (
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-line font-bold">
                      {selectedDetailNb.description}
                    </div>
                  )}

                  {detailSamples.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-black text-slate-800">
                        نماذج من صفحات المذكرة ({detailSamples.length} صفحة):
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                        {detailSamples.slice(0, 10).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`صفحة ${i + 1}`}
                            onClick={() => openNotebookPreview(selectedDetailNb)}
                            className="aspect-[3/4] object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-blue-600">{selectedDetailNb.price} ج.م</span>
                    {Number(selectedDetailNb.oldPrice) > Number(selectedDetailNb.price) && (
                      <span className="text-base text-slate-400 line-through font-bold">
                        {selectedDetailNb.oldPrice} ج.م
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {selectedDetailNb.driveLink && (
                      <a
                        href={selectedDetailNb.driveLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ backgroundColor: selectedDetailNb.driveBtnColor || '#059669' }}
                        className="px-5 py-3 rounded-2xl text-white text-sm font-black inline-flex items-center gap-2 shadow"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>عينة Google Drive</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => addToCart(selectedDetailNb, false)}
                      className="px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black inline-flex items-center gap-2 shadow-lg"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>أضف المذكرة للسلة</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= مكتبة المذكرات ================= */}
        {activeView === 'library' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المذكرة أو المادة..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                >
                  <option value="">جميع الأقسام الرئيسية</option>
                  {(settings.categories || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {safeText(c.name)}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStageId}
                  onChange={(e) => {
                    setSelectedStageId(e.target.value);
                    setSelectedGradeId('');
                  }}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                >
                  <option value="">جميع المراحل الدراسية</option>
                  {(settings.stages || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {safeText(s.name)}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedGradeId}
                  onChange={(e) => setSelectedGradeId(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                >
                  <option value="">جميع الصفوف الدراسية</option>
                  {(settings.grades || [])
                    .filter((g) => !selectedStageId || g.stageId === selectedStageId)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {safeText(g.name)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {filteredNotebooks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
                <p className="text-lg font-black text-slate-700">لا توجد مذكرات مطابقة لبحثك حاليًا</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryId('');
                    setSelectedStageId('');
                    setSelectedGradeId('');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-black"
                >
                  إعادة ضبط الفلاتر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotebooks.map((nb) => (
                  <NotebookCard
                    key={nb.id}
                    nb={nb}
                    onPreview={() => openNotebookPreview(nb)}
                    onOpenDetails={() => openNotebookFullDetails(nb)}
                    onAddToCart={() => addToCart(nb, false)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= صفحة العروض وباقات التوفير ================= */}
        {activeView === 'offers' && (
          <div className="space-y-8">
            <div className="rounded-3xl bg-gradient-to-l from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black">
                  <Package className="w-3.5 h-3.5" />
                  <span>باقات مجمعة بأسعار مخفضة</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black">العروض وباقات التوفير الحصرية</h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                  وفّر أكثر عند طلب الباقات الشاملة لجميع الصفوف، ويمكنك الضغط على غلاف أي مذكرة داخل الباقة لمعاينة عينتها قبل الطلب.
                </p>
              </div>

              {(() => {
                const uniqueCoupons = [];
                const seen = new Set();
                if (settings.topBannerEnabled && settings.topBannerCoupon) {
                  const c = settings.topBannerCoupon.trim().toUpperCase();
                  seen.add(c);
                  uniqueCoupons.push({ code: c, label: 'خصم 15%' });
                }
                coupons
                  .filter((c) => c.active !== false && c.code)
                  .forEach((c) => {
                    const up = c.code.trim().toUpperCase();
                    if (!seen.has(up)) {
                      seen.add(up);
                      uniqueCoupons.push({
                        code: up,
                        label: c.type === 'fixed' ? `خصم ${c.value} ج.م` : `خصم ${c.value}%`
                      });
                    }
                  });

                if (uniqueCoupons.length === 0) return null;
                return (
                  <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-2 shrink-0">
                    <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>أكواد خصم فعالة (اضغط للنسخ):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uniqueCoupons.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => handleCopyText(item.code)}
                          className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{item.code}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900/15 text-[10px]">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {packages.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
                <p className="text-lg font-black text-slate-700">لا توجد باقات توفير مضافة حاليًا</p>
                <p className="text-xs text-slate-500">يمكنك تصفح المذكرات الفردية من قسم المذكرات.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {packages.map((pkg) => {
                  const pkgNotebooks = (pkg.notebookIds || [])
                    .map((id) => notebooks.find((n) => n.id === id))
                    .filter(Boolean);
                  const savedAmount = Math.max(0, (Number(pkg.oldPrice) || 0) - (Number(pkg.price) || 0));
                  const savePct =
                    Number(pkg.oldPrice) > 0 ? Math.round((savedAmount / Number(pkg.oldPrice)) * 100) : 0;

                  return (
                    <div
                      key={pkg.id}
                      className="bg-white rounded-3xl border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-xl overflow-hidden flex flex-col justify-between transition"
                    >
                      <div>
                        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                            <Package className="w-4 h-4" />
                            <span>{safeText(pkg.badge, 'باقة توفير مجمعة')}</span>
                          </span>
                          {savedAmount > 0 && (
                            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black">
                              وفّر {savedAmount} ج.م ({savePct}%)
                            </span>
                          )}
                        </div>

                        <div className="p-5 sm:p-6 space-y-4">
                          <div className="space-y-1.5">
                            <h3 className="text-xl font-black text-slate-900">{safeText(pkg.title)}</h3>
                            {pkg.description && (
                              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                {safeText(pkg.description)}
                              </p>
                            )}
                          </div>

                          {pkgNotebooks.length > 0 && (
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between text-xs font-black text-slate-700">
                                <span>محتويات الباقة ({pkgNotebooks.length} مذكرات):</span>
                                <span className="text-blue-600">اضغط على أي مذكرة للمعاينة</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {pkgNotebooks.map((itemNb) => (
                                  <div
                                    key={itemNb.id}
                                    onClick={() => openNotebookPreview(itemNb)}
                                    className="group rounded-2xl border border-slate-200 hover:border-blue-500 overflow-hidden bg-slate-50 cursor-pointer transition flex flex-col"
                                  >
                                    <div className="bg-slate-900 text-white px-2.5 py-2 text-[11px] font-black text-center line-clamp-2 min-h-[42px] flex items-center justify-center">
                                      {itemNb.title}
                                    </div>
                                    <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                                      {itemNb.coverImage ? (
                                        <img
                                          src={itemNb.coverImage}
                                          alt={itemNb.title}
                                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                          <BookOpen className="w-8 h-8" />
                                        </div>
                                      )}
                                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex items-center justify-between text-[10px] text-white font-bold">
                                        <span>{itemNb.pagesCount ? `${itemNb.pagesCount} ص` : ''}</span>
                                        <span className="inline-flex items-center gap-1 bg-blue-600 px-2 py-0.5 rounded-full">
                                          <Eye className="w-3 h-3" />
                                          معاينة
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="text-[11px] font-bold text-slate-500">سعر الباقة بالكامل:</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-blue-600">{pkg.price} ج.م</span>
                            {Number(pkg.oldPrice) > Number(pkg.price) && (
                              <span className="text-sm text-slate-400 line-through font-bold">
                                {pkg.oldPrice} ج.م
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            addToCart(
                              {
                                id: pkg.id,
                                title: pkg.title,
                                price: pkg.price,
                                coverImage: pkgNotebooks[0]?.coverImage || ''
                              },
                              true
                            )
                          }
                          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md inline-flex items-center gap-2 transition"
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
          </div>
        )}

        {/* ================= سلة المشتريات وإتمام الطلب ================= */}
        {activeView === 'cart' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl font-black text-slate-900">سلة المشتريات وإتمام الطلب</h2>

            {lastSubmittedOrder && cart.length === 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-black text-emerald-900">
                  تم إرسال طلبك بنجاح برقم: {lastSubmittedOrder.orderCode}
                </h3>
                {lastSubmittedOrder.rewardCoupon && (
                  <div className="bg-white rounded-2xl p-3 border border-emerald-200 inline-block">
                    <p className="text-xs font-bold text-slate-600">هدية طلبك القادم:</p>
                    <p className="text-base font-black text-blue-600">{lastSubmittedOrder.rewardCoupon}</p>
                  </div>
                )}
              </div>
            )}

            {cart.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                <p className="text-lg font-black text-slate-700">سلة المشتريات فارغة حاليًا</p>
                <button
                  type="button"
                  onClick={() => setActiveView('library')}
                  className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm"
                >
                  تصفح المذكرات
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-sm">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2.5 border-b last:border-b-0 border-slate-100"
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-sm sm:text-base font-black text-slate-900">{item.title}</h4>
                        <p className="text-xs font-black text-blue-600">{item.price} ج.م</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-black">{item.qty || 1}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, -(item.qty || 1))}
                          className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="أدخل كود الخصم إن وُجد..."
                      className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black"
                    >
                      تطبيق
                    </button>
                  </div>

                  {settings.quantityDiscountEnabled && quantityDiscountInfo.remaining > 0 && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black">
                      ✨ أضف {quantityDiscountInfo.remaining} مذكرة إضافية من المذكرات المشمولة لتحصل تلقائيًا على خصم{' '}
                      {settings.quantityDiscountType === 'fixed'
                        ? `${settings.quantityDiscountValue} ج.م`
                        : `${settings.quantityDiscountValue}%`}
                      !
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
                    <div className="flex justify-between font-bold text-slate-600">
                      <span>المجموع الفرعي:</span>
                      <span>{cartSubtotal} ج.م</span>
                    </div>
                    {quantityDiscountInfo.amount > 0 && (
                      <div className="flex justify-between font-black text-emerald-600">
                        <span>خصم الكميات التلقائي:</span>
                        <span>- {quantityDiscountInfo.amount} ج.م</span>
                      </div>
                    )}
                    {couponDiscountAmount > 0 && (
                      <div className="flex justify-between font-black text-emerald-600">
                        <span>خصم الكوبون ({appliedCoupon?.code}):</span>
                        <span>- {couponDiscountAmount} ج.م</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-lg font-black text-slate-900">
                      <span>الإجمالي النهائي:</span>
                      <span className="text-blue-600">{cartFinalTotal} ج.م</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
                  <h3 className="text-base font-black text-slate-900">بيانات التخصيص التي ستُطبع على المذكرة</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        اسم المعلم (كما سيُكتب على المذكرة) *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerForm.teacherName}
                        onChange={(e) => setCustomerForm({ ...customerForm, teacherName: e.target.value })}
                        placeholder="مثال: أ/ أحمد محمد"
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        رقم الهاتف (كما سيُكتب على المذكرة) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        placeholder="010xxxxxxxx"
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        اسم السلسلة أو الأكاديمية (إن وُجد)
                      </label>
                      <input
                        type="text"
                        value={customerForm.seriesName}
                        onChange={(e) => setCustomerForm({ ...customerForm, seriesName: e.target.value })}
                        placeholder="مثال: سلسلة العباقرة"
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        رقم هاتف إضافي أو العنوان
                      </label>
                      <input
                        type="text"
                        value={customerForm.secondPhone}
                        onChange={(e) => setCustomerForm({ ...customerForm, secondPhone: e.target.value })}
                        placeholder="اختياري"
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>
                  </div>

                  {/* شعار المعلم: نص + رفع صورة بالجودة الأصلية الكاملة */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <label className="block text-xs font-black text-slate-800">
                      شعار المعلم (Logo) — يمكنك كتابة نص الشعار أو رفع صورة الشعار (PNG / JPG):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <input
                        type="text"
                        value={customerLogoText}
                        onChange={(e) => setCustomerLogoText(e.target.value)}
                        placeholder="كتابة نص الشعار (إن وُجد)..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-300 text-xs font-black text-slate-800 flex items-center gap-1.5 cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>
                            {uploadingCustomerLogo
                              ? 'جارٍ تجهيز الشعار...'
                              : customerLogoImage
                              ? 'تغيير صورة الشعار'
                              : 'رفع صورة الشعار (PNG / JPG)'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingCustomerLogo(true);
                              try {
                                const hqLogo = await processHighQualityLogoFile(file, 4096, 10000000);
                                setCustomerLogoImage(hqLogo);
                                showToast('تم إرفاق صورة الشعار بالجودة الأصلية الكاملة!');
                              } catch {
                                showToast('تعذر قراءة ملف الصورة.', 'error');
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
                              alt="معاينة الشعار"
                              className="w-9 h-9 object-contain rounded"
                            />
                            <button
                              type="button"
                              onClick={() => setCustomerLogoImage('')}
                              className="text-rose-600 hover:text-rose-700 text-xs font-black"
                            >
                              حذف
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                      ملاحظات إضافية للتصميم أو الألوان
                    </label>
                    <textarea
                      rows={3}
                      value={customerForm.notes}
                      onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                      placeholder="اكتب أي تفاصيل إضافية تريدها..."
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-base shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    <span>{submittingOrder ? 'جارٍ تسجيل الطلب...' : 'تأكيد الطلب وإرساله عبر واتساب'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================= تتبع حالة الطلب ================= */}
        {activeView === 'track' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center">تتبع حالة طلبك</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={trackCodeInput}
                onChange={(e) => setTrackCodeInput(e.target.value)}
                placeholder="أدخل رقم الطلب مثل ORD-123456"
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold"
              />
              <button
                type="button"
                onClick={handleTrackOrder}
                disabled={trackingLoading}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm"
              >
                {trackingLoading ? 'بحث...' : 'تتبع'}
              </button>
            </div>

            {trackedOrderResult && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
                <div className="flex justify-between font-black">
                  <span>رقم الطلب: {trackedOrderResult.orderCode}</span>
                  <span className="px-3 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                    {trackedOrderResult.status === 'completed'
                      ? 'مكتمل وتم التسليم'
                      : trackedOrderResult.status === 'processing'
                      ? 'قيد التجهيز والتنسيق'
                      : 'قيد المراجعة'}
                  </span>
                </div>
                <p className="text-slate-600 font-bold">
                  اسم المعلم: {trackedOrderResult.customer?.teacherName}
                </p>
                <p className="text-slate-600 font-bold">الإجمالي: {trackedOrderResult.total} ج.م</p>
              </div>
            )}
          </div>
        )}

        {/* ================= لوحة تحكم الإدارة الشاملة ================= */}
        {activeView === 'admin' && isAdmin && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-900 text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black">لوحة تحكم الإدارة الشاملة</h2>
                  <p className="text-xs text-emerald-400 font-bold">متصل بالسحابة: {adminUserEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOut(auth)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black inline-flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'notebooks', label: 'المذكرات والعينات', count: notebooks.length, icon: FileText },
                { id: 'sections', label: 'الأقسام والمراحل', count: (settings.categories || []).length, icon: Layers },
                { id: 'offers', label: 'الكوبونات والباقات', count: packages.length + coupons.length, icon: Tag },
                { id: 'orders', label: 'الطلبات الواردة', count: orders.length, icon: ClipboardList },
                { id: 'settings', label: 'إعدادات المنصة', count: null, icon: Settings }
              ].map((tab) => {
                const IconComp = tab.icon;
                const active = adminTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAdminTab(tab.id)}
                    className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between gap-2 ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <IconComp className="w-5 h-5" />
                      {tab.count !== null && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-black ${
                            active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-black">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* تبويب 1: إدارة المذكرات والعينات */}
            {adminTab === 'notebooks' && (
              <div className="space-y-6">
                <form
                  onSubmit={handleSaveNotebook}
                  className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">
                      {editingNotebookId ? 'تعديل مذكرة حالية' : 'إضافة مذكرة جديدة'}
                    </h3>
                    {editingNotebookId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotebookId(null);
                          setNbSamples([]);
                          setSamplesTouched(false);
                        }}
                        className="text-xs font-black text-rose-600 hover:underline"
                      >
                        إلغاء التعديل
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">اسم المذكرة *</label>
                      <input
                        type="text"
                        required
                        value={nbForm.title}
                        onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">الشارة المميزة أعلى الغلاف</label>
                      <input
                        type="text"
                        value={nbForm.badge}
                        onChange={(e) => setNbForm({ ...nbForm, badge: e.target.value })}
                        placeholder="مثال: الأكثر طلبًا"
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">المادة الدراسية</label>
                      <input
                        type="text"
                        value={nbForm.subject}
                        onChange={(e) => setNbForm({ ...nbForm, subject: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">السعر الحالي (ج.م) *</label>
                      <input
                        type="number"
                        required
                        value={nbForm.price}
                        onChange={(e) => setNbForm({ ...nbForm, price: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">السعر قبل الخصم (ج.م)</label>
                      <input
                        type="number"
                        value={nbForm.oldPrice}
                        onChange={(e) => setNbForm({ ...nbForm, oldPrice: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">عدد الصفحات</label>
                      <input
                        type="number"
                        value={nbForm.pagesCount}
                        onChange={(e) => setNbForm({ ...nbForm, pagesCount: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">القسم الرئيسي</label>
                      <select
                        value={nbForm.categoryId}
                        onChange={(e) => setNbForm({ ...nbForm, categoryId: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                      >
                        <option value="">اختر القسم...</option>
                        {(settings.categories || []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">المرحلة الدراسية</label>
                      <select
                        value={nbForm.stageId}
                        onChange={(e) => setNbForm({ ...nbForm, stageId: e.target.value, gradeId: '' })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                      >
                        <option value="">اختر المرحلة...</option>
                        {(settings.stages || []).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">الصف الدراسي</label>
                      <select
                        value={nbForm.gradeId}
                        onChange={(e) => setNbForm({ ...nbForm, gradeId: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                      >
                        <option value="">اختر الصف...</option>
                        {(settings.grades || [])
                          .filter((g) => !nbForm.stageId || g.stageId === nbForm.stageId)
                          .map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        مكان عرض تفاصيل هذه المذكرة
                      </label>
                      <select
                        value={nbForm.detailsPosition}
                        onChange={(e) => setNbForm({ ...nbForm, detailsPosition: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                      >
                        <option value="global">حسب الإعداد العام للمنصة</option>
                        <option value="top">فوق صفحات المعاينة</option>
                        <option value="bottom">أسفل صفحات المعاينة</option>
                        <option value="hidden">إخفاء التفاصيل</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        رابط Google Drive للعينة الكاملة
                      </label>
                      <input
                        type="url"
                        value={nbForm.driveLink}
                        onChange={(e) => setNbForm({ ...nbForm, driveLink: e.target.value })}
                        placeholder="https://drive.google.com/..."
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">لون زر رابط Drive</label>
                      <input
                        type="color"
                        value={nbForm.driveBtnColor}
                        onChange={(e) => setNbForm({ ...nbForm, driveBtnColor: e.target.value })}
                        className="w-16 h-10 rounded-xl border border-slate-200 cursor-pointer"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
                      <input
                        id="nb_featured"
                        type="checkbox"
                        checked={Boolean(nbForm.featured)}
                        onChange={(e) => setNbForm({ ...nbForm, featured: e.target.checked })}
                      />
                      <label htmlFor="nb_featured" className="text-xs font-black text-slate-800 cursor-pointer">
                        تمييز هذه المذكرة في قسم «المذكرات الأكثر طلبًا وتميزًا» بالصفحة الرئيسية
                      </label>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        وصف وتفاصيل المذكرة الكاملة
                      </label>
                      <textarea
                        rows={4}
                        value={nbForm.description}
                        onChange={(e) => setNbForm({ ...nbForm, description: e.target.value })}
                        placeholder="اكتب وصفًا شاملًا ومفصلًا لمحتويات المذكرة ومميزاتها..."
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                      <label className="block text-xs font-black text-slate-800">صورة غلاف المذكرة</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const compressed = await compressImageFile(file, 900, 0.82, 420000);
                          setNbForm({ ...nbForm, coverImage: compressed });
                        }}
                        className="text-xs font-bold"
                      />
                      {isValidImageSrc(nbForm.coverImage) && (
                        <img
                          src={nbForm.coverImage}
                          alt="غلاف المذكرة"
                          className="w-24 h-32 object-cover rounded-xl border border-slate-200"
                        />
                      )}
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                      <label className="block text-xs font-black text-slate-800">
                        صفحات العينة للمعاينة ({nbSamples.length} صفحة)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          const compressedList = await Promise.all(
                            files.map((f) => compressImageFile(f, 1100, 0.8, 450000))
                          );
                          setSamplesTouched(true);
                          setNbSamples((prev) => [...prev, ...compressedList].slice(0, 24));
                        }}
                        className="text-xs font-bold"
                      />
                      {nbSamples.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {nbSamples.map((img, idx) => (
                            <div key={idx} className="relative w-14 h-20 rounded-lg border border-slate-200 overflow-hidden">
                              <img
                                src={img}
                                alt={`عينة ${idx + 1}`}
                                onError={() => {
                                  setSamplesTouched(true);
                                  setNbSamples((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setSamplesTouched(true);
                                  setNbSamples((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingNotebook}
                    className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow inline-flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingNotebook ? 'جارٍ الحفظ...' : editingNotebookId ? 'حفظ التعديلات' : 'إضافة المذكرة'}</span>
                  </button>
                </form>

                <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
                  <h3 className="text-base font-black text-slate-900">المذكرات المسجلة ({notebooks.length})</h3>
                  <div className="divide-y divide-slate-100">
                    {notebooks.map((nb) => (
                      <div key={nb.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {nb.coverImage ? (
                            <img src={nb.coverImage} alt={nb.title} className="w-11 h-14 rounded-lg object-cover border" />
                          ) : (
                            <div className="w-11 h-14 rounded-lg bg-slate-100 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-black text-slate-900">{nb.title}</h4>
                            <p className="text-xs text-slate-500 font-bold">
                              {nb.price} ج.م • {nb.subject}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditNotebook(nb)}
                            className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-black inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (db) await deleteDoc(publicDoc('notebooks', nb.id)).catch(() => {});
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-black"
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

            {/* تبويب 2: الأقسام والمراحل والصفوف */}
            {adminTab === 'sections' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
                  <h3 className="text-base font-black text-slate-900">الأقسام الرئيسية</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="اسم القسم الجديد..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-black cursor-pointer inline-flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>{newCatImage ? 'تم اختيار صورة القسم' : 'صورة للقسم (اختياري)'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const img = await compressImageFile(f, 700, 0.8, 300000);
                            setNewCatImage(img);
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCatName.trim()) return;
                          const next = {
                            ...settings,
                            categories: [
                              ...(settings.categories || []),
                              { id: `cat_${Date.now()}`, name: newCatName.trim(), image: newCatImage }
                            ]
                          };
                          saveAllSettingsToCloud(next);
                          setNewCatName('');
                          setNewCatImage('');
                          showToast('تمت إضافة القسم بنجاح!');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(settings.categories || []).map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs font-black gap-2">
                        <div className="flex items-center gap-2">
                          {isValidImageSrc(c.image) && (
                            <img src={c.image} alt={c.name} className="w-8 h-8 rounded-lg object-cover border" />
                          )}
                          <span>{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-blue-600 cursor-pointer underline text-[11px]">
                            صورة
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                const img = await compressImageFile(f, 700, 0.8, 300000);
                                const nextCats = settings.categories.map((x) =>
                                  x.id === c.id ? { ...x, image: img } : x
                                );
                                saveAllSettingsToCloud({ ...settings, categories: nextCats });
                                showToast('تم تحديث صورة القسم!');
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              saveAllSettingsToCloud({
                                ...settings,
                                categories: settings.categories.filter((x) => x.id !== c.id)
                              })
                            }
                            className="text-rose-600"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
                  <h3 className="text-base font-black text-slate-900">المراحل الدراسية</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      placeholder="اسم المرحلة..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newStageName.trim()) return;
                        const next = {
                          ...settings,
                          stages: [...(settings.stages || []), { id: `stage_${Date.now()}`, name: newStageName.trim() }]
                        };
                        saveAllSettingsToCloud(next);
                        setNewStageName('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-black"
                    >
                      إضافة
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(settings.stages || []).map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs font-black">
                        <span>{safeText(s.name || s.title || s.label)}</span>
                        <button
                          type="button"
                          onClick={() =>
                            saveAllSettingsToCloud({
                              ...settings,
                              stages: settings.stages.filter((x) => x.id !== s.id)
                            })
                          }
                          className="text-rose-600"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
                  <h3 className="text-base font-black text-slate-900">الصفوف الدراسية</h3>
                  <div className="space-y-2">
                    <select
                      value={newGradeStageId}
                      onChange={(e) => setNewGradeStageId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    >
                      <option value="">اختر المرحلة التابع لها...</option>
                      {(settings.stages || []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newGradeName}
                        onChange={(e) => setNewGradeName(e.target.value)}
                        placeholder="اسم الصف..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newGradeName.trim()) return;
                          const next = {
                            ...settings,
                            grades: [
                              ...(settings.grades || []),
                              { id: `grade_${Date.now()}`, stageId: newGradeStageId, name: newGradeName.trim() }
                            ]
                          };
                          saveAllSettingsToCloud(next);
                          setNewGradeName('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-black"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(settings.grades || []).map((g) => (
                      <div key={g.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs font-black">
                        <span>{safeText(g.name || g.title || g.label)}</span>
                        <button
                          type="button"
                          onClick={() =>
                            saveAllSettingsToCloud({
                              ...settings,
                              grades: settings.grades.filter((x) => x.id !== g.id)
                            })
                          }
                          className="text-rose-600"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* تبويب 3: الكوبونات وباقات التوفير وخصم الكميات ومكافأة الطلب القادم */}
            {adminTab === 'offers' && (
              <div className="space-y-8">
                {/* 1. إدارة باقات التوفير */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-900">
                    {editingPackageId ? 'تعديل باقة توفير' : 'إضافة باقة توفير مجمعة'}
                  </h3>

                  <form onSubmit={handleSavePackage} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">اسم الباقة *</label>
                        <input
                          type="text"
                          required
                          value={pkgForm.title}
                          onChange={(e) => setPkgForm({ ...pkgForm, title: e.target.value })}
                          placeholder="مثال: باقة المرحلة الإعدادية الشاملة"
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">سعر الباقة بعد الخصم (ج.م) *</label>
                        <input
                          type="number"
                          required
                          value={pkgForm.price}
                          onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">السعر قبل الخصم (يُحسب تلقائيًا)</label>
                        <input
                          type="number"
                          value={pkgForm.oldPrice}
                          onChange={(e) => setPkgForm({ ...pkgForm, oldPrice: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">الشارة المميزة أعلى الباقة</label>
                        <input
                          type="text"
                          value={pkgForm.badge}
                          onChange={(e) => setPkgForm({ ...pkgForm, badge: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">وصف الباقة ومميزاتها</label>
                      <textarea
                        rows={2}
                        value={pkgForm.description}
                        onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                        placeholder="اكتب وصفًا مختصرًا لمحتويات الباقة..."
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-800">
                          اختر المذكرات المضمنة في الباقة ({pkgForm.notebookIds.length} مختارة):
                        </span>
                        <input
                          type="text"
                          value={pkgNbSearch}
                          onChange={(e) => setPkgNbSearch(e.target.value)}
                          placeholder="بحث سريع في المذكرات..."
                          className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                        {notebooks
                          .filter((n) => !pkgNbSearch || n.title.toLowerCase().includes(pkgNbSearch.toLowerCase()))
                          .map((nb) => {
                            const checked = pkgForm.notebookIds.includes(nb.id);
                            return (
                              <button
                                key={nb.id}
                                type="button"
                                onClick={() => togglePackageNotebook(nb)}
                                className={`p-2.5 rounded-xl border text-right text-xs font-black flex items-center justify-between gap-2 transition ${
                                  checked
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400'
                                }`}
                              >
                                <span className="line-clamp-1">{nb.title}</span>
                                <span className="shrink-0">{nb.price} ج.م</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow"
                    >
                      {editingPackageId ? 'حفظ تعديلات الباقة' : 'حفظ الباقة'}
                    </button>
                  </form>

                  {packages.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <h4 className="text-sm font-black text-slate-800">الباقات المنشورة ({packages.length}):</h4>
                      {packages.map((p) => (
                        <div key={p.id} className="p-3 rounded-2xl bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-sm font-black text-slate-900">{p.title}</span>
                            <span className="mr-3 text-xs font-bold text-blue-600">{p.price} ج.م</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPackageId(p.id);
                                setPkgForm({
                                  title: p.title || '',
                                  description: p.description || '',
                                  badge: p.badge || '',
                                  price: String(p.price || ''),
                                  oldPrice: String(p.oldPrice || ''),
                                  notebookIds: p.notebookIds || []
                                });
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-black"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const next = packages.filter((x) => x.id !== p.id);
                                setPackages(next);
                                if (db) {
                                  await deleteDoc(publicDoc('packages', p.id)).catch(() => {});
                                  await saveAllSettingsToCloud(settings, next, coupons);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-black"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. خصم الكميات عند شراء أكثر من مذكرة */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">خصم الكميات التلقائي عند شراء أكثر من مذكرة</h3>
                    <label className="inline-flex items-center gap-2 text-xs font-black cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.quantityDiscountEnabled)}
                        onChange={(e) =>
                          saveAllSettingsToCloud({ ...settings, quantityDiscountEnabled: e.target.checked })
                        }
                      />
                      <span>تفعيل خصم الكميات</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">الحد الأدنى لعدد المذكرات</label>
                      <input
                        type="number"
                        min={2}
                        value={settings.quantityDiscountMinCount}
                        onChange={(e) =>
                          saveAllSettingsToCloud({
                            ...settings,
                            quantityDiscountMinCount: Number(e.target.value) || 2
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">نوع الخصم</label>
                      <select
                        value={settings.quantityDiscountType}
                        onChange={(e) =>
                          saveAllSettingsToCloud({ ...settings, quantityDiscountType: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                      >
                        <option value="percent">نسبة مئوية (%)</option>
                        <option value="fixed">مبلغ ثابت بالجنيه (ج.م)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">قيمة الخصم</label>
                      <input
                        type="number"
                        value={settings.quantityDiscountValue}
                        onChange={(e) =>
                          saveAllSettingsToCloud({
                            ...settings,
                            quantityDiscountValue: Number(e.target.value) || 0
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">أقصى خصم (ج.م)</label>
                      <input
                        type="number"
                        value={settings.quantityDiscountMaxAmount}
                        onChange={(e) =>
                          saveAllSettingsToCloud({
                            ...settings,
                            quantityDiscountMaxAmount: Number(e.target.value) || 0
                          })
                        }
                        placeholder="0 = بدون سقف"
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">نطاق التطبيق</label>
                      <select
                        value={settings.quantityDiscountScope}
                        onChange={(e) =>
                          saveAllSettingsToCloud({ ...settings, quantityDiscountScope: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                      >
                        <option value="all">جميع مذكرات المنصة</option>
                        <option value="specific">مذكرات محددة فقط</option>
                      </select>
                    </div>
                  </div>

                  {settings.quantityDiscountScope === 'specific' && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="block text-xs font-black text-slate-700">
                        حدد المذكرات المشمولة في خصم الكميات:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {notebooks.map((nb) => {
                          const selected = (settings.quantityDiscountNotebookIds || []).includes(nb.id);
                          return (
                            <button
                              key={nb.id}
                              type="button"
                              onClick={() => {
                                const cur = settings.quantityDiscountNotebookIds || [];
                                const nextIds = selected ? cur.filter((id) => id !== nb.id) : [...cur, nb.id];
                                saveAllSettingsToCloud({ ...settings, quantityDiscountNotebookIds: nextIds });
                              }}
                              className={`p-2 rounded-xl border text-right text-xs font-black ${
                                selected
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-800 border-slate-200'
                              }`}
                            >
                              {nb.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. إدارة كوبونات الخصم */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-900">
                    {editingCouponId ? 'تعديل كوبون خصم' : 'إضافة كوبون خصم جديد'}
                  </h3>

                  <form onSubmit={handleSaveCoupon} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">كود الخصم *</label>
                        <input
                          type="text"
                          required
                          value={cpForm.code}
                          onChange={(e) => setCpForm({ ...cpForm, code: e.target.value.toUpperCase() })}
                          placeholder="مثال: SAVE20"
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">نوع الخصم</label>
                        <select
                          value={cpForm.type}
                          onChange={(e) => setCpForm({ ...cpForm, type: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                        >
                          <option value="percent">نسبة مئوية (%)</option>
                          <option value="fixed">مبلغ ثابت (ج.م)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">قيمة الخصم *</label>
                        <input
                          type="number"
                          required
                          value={cpForm.value}
                          onChange={(e) => setCpForm({ ...cpForm, value: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">الحد الأقصى للخصم (ج.م)</label>
                        <input
                          type="number"
                          value={cpForm.maxDiscount}
                          onChange={(e) => setCpForm({ ...cpForm, maxDiscount: e.target.value })}
                          placeholder="اختياري"
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">الحد الأدنى للطلب (ج.م)</label>
                        <input
                          type="number"
                          value={cpForm.minOrder}
                          onChange={(e) => setCpForm({ ...cpForm, minOrder: e.target.value })}
                          placeholder="اختياري"
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">نطاق تطبيق الكوبون</label>
                        <select
                          value={cpForm.applyScope}
                          onChange={(e) => setCpForm({ ...cpForm, applyScope: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                        >
                          <option value="all">جميع المذكرات والباقات</option>
                          <option value="include">مذكرات محددة فقط</option>
                          <option value="exclude">الكل باستثناء مذكرات محددة</option>
                        </select>
                      </div>
                    </div>

                    {(cpForm.applyScope === 'include' || cpForm.applyScope === 'exclude') && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-800">
                            {cpForm.applyScope === 'include'
                              ? 'اختر المذكرات التي يسري عليها الكوبون:'
                              : 'اختر المذكرات المستثناة من الكوبون:'}
                          </span>
                          <input
                            type="text"
                            value={cpNbSearch}
                            onChange={(e) => setCpNbSearch(e.target.value)}
                            placeholder="بحث..."
                            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {notebooks
                            .filter((n) => !cpNbSearch || n.title.toLowerCase().includes(cpNbSearch.toLowerCase()))
                            .map((nb) => {
                              const selected = (cpForm.targetNotebookIds || []).includes(nb.id);
                              return (
                                <button
                                  key={nb.id}
                                  type="button"
                                  onClick={() => {
                                    const cur = cpForm.targetNotebookIds || [];
                                    const nextIds = selected ? cur.filter((id) => id !== nb.id) : [...cur, nb.id];
                                    setCpForm({ ...cpForm, targetNotebookIds: nextIds });
                                  }}
                                  className={`p-2 rounded-xl border text-right text-xs font-black ${
                                    selected
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-slate-800 border-slate-200'
                                  }`}
                                >
                                  {nb.title}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow"
                    >
                      {editingCouponId ? 'حفظ تعديلات الكوبون' : 'حفظ الكوبون'}
                    </button>
                  </form>

                  {coupons.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      {coupons.map((cp) => (
                        <div key={cp.id} className="p-3 rounded-2xl bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-black">
                              {cp.code}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {cp.type === 'fixed' ? `${cp.value} ج.م` : `${cp.value}%`} •{' '}
                              {cp.applyScope === 'include'
                                ? `مخصص (${cp.targetNotebookIds?.length || 0} مذكرات)`
                                : cp.applyScope === 'exclude'
                                ? `مستثنى (${cp.targetNotebookIds?.length || 0} مذكرات)`
                                : 'جميع المذكرات'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCouponId(cp.id);
                                setCpForm({
                                  code: cp.code || '',
                                  type: cp.type || 'percent',
                                  value: String(cp.value || ''),
                                  maxDiscount: String(cp.maxDiscount || ''),
                                  minOrder: String(cp.minOrder || ''),
                                  maxUses: String(cp.maxUses || ''),
                                  applyScope: cp.applyScope || 'all',
                                  targetNotebookIds: cp.targetNotebookIds || []
                                });
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-black"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const next = coupons.filter((x) => x.id !== cp.id);
                                setCoupons(next);
                                if (db) {
                                  await deleteDoc(publicDoc('coupons', cp.id)).catch(() => {});
                                  await saveAllSettingsToCloud(settings, packages, next);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-black"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. مكافأة الطلب القادم */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-black text-slate-900">مكافأة الطلب القادم التلقائية</h3>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs font-black cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.nextOrderRewardEnabled)}
                        onChange={(e) =>
                          saveAllSettingsToCloud({ ...settings, nextOrderRewardEnabled: e.target.checked })
                        }
                      />
                      <span>تفعيل المكافأة</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">نسبة خصم الكوبون المُهدى (%)</label>
                      <input
                        type="number"
                        value={settings.nextOrderRewardPercent}
                        onChange={(e) =>
                          saveAllSettingsToCloud({
                            ...settings,
                            nextOrderRewardPercent: Number(e.target.value) || 15
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">الحد الأقصى للخصم (ج.م)</label>
                      <input
                        type="number"
                        value={settings.nextOrderRewardMaxDiscount}
                        onChange={(e) =>
                          saveAllSettingsToCloud({
                            ...settings,
                            nextOrderRewardMaxDiscount: Number(e.target.value) || 100
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* تبويب 4: الطلبات الواردة وتنزيل شعار المعلم بالجودة الأصلية الكاملة */}
            {adminTab === 'orders' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-black text-slate-900">الطلبات الواردة ({orders.length})</h3>

                  {orders.some((o) => o.status === 'completed') && (
                    <div className="flex items-center gap-2">
                      {!confirmClearCompleted ? (
                        <button
                          type="button"
                          onClick={() => setConfirmClearCompleted(true)}
                          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black inline-flex items-center gap-1.5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>
                            مسح الطلبات المكتملة ({orders.filter((o) => o.status === 'completed').length})
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                          <span className="text-xs font-black text-rose-800">تأكيد مسح المكتملة؟</span>
                          <button
                            type="button"
                            disabled={clearingCompleted}
                            onClick={async () => {
                              setClearingCompleted(true);
                              try {
                                const completedList = orders.filter((o) => o.status === 'completed');
                                if (db) {
                                  for (const ord of completedList) {
                                    await deleteDoc(publicDoc('orders', ord.id)).catch(() => {});
                                    const chunksCount = Number(ord.customerLogoChunksCount) || 0;
                                    for (let i = 0; i < chunksCount; i++) {
                                      await deleteDoc(publicDoc('orders', `${ord.id}_logo_${i}`)).catch(() => {});
                                    }
                                  }
                                }
                                setOrders((prev) => prev.filter((o) => o.status !== 'completed'));
                                showToast(`تم مسح ${completedList.length} طلب مكتمل بنجاح.`);
                              } finally {
                                setClearingCompleted(false);
                                setConfirmClearCompleted(false);
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-black"
                          >
                            {clearingCompleted ? 'جارٍ المسح...' : 'نعم، امسح'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmClearCompleted(false)}
                            className="px-2.5 py-1 rounded-lg bg-white text-slate-700 text-xs font-black border"
                          >
                            إلغاء
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {orders.length === 0 ? (
                  <p className="text-sm text-slate-500 font-bold py-6 text-center">لا توجد طلبات واردة حاليًا.</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => {
                      const logoImg = isValidImageSrc(ord.customerLogoImage) ? ord.customerLogoImage : '';
                      const isPngLogo = logoImg.startsWith('data:image/png');
                      const approxKb = logoImg ? Math.round((logoImg.length * 0.75) / 1024) : 0;
                      return (
                        <div key={ord.id} className="p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm sm:text-base font-black text-slate-900">
                              {ord.orderCode} • {ord.customer?.teacherName} ({ord.customer?.phone})
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={ord.status || 'pending'}
                                onChange={async (e) => {
                                  if (db) {
                                    await setDoc(
                                      publicDoc('orders', ord.id),
                                      { status: e.target.value },
                                      { merge: true }
                                    ).catch(() => {});
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-black bg-slate-50"
                              >
                                <option value="pending">قيد المراجعة</option>
                                <option value="processing">قيد التجهيز</option>
                                <option value="completed">مكتمل</option>
                              </select>

                              <button
                                type="button"
                                title="حذف هذا الطلب"
                                onClick={async () => {
                                  if (db) {
                                    await deleteDoc(publicDoc('orders', ord.id)).catch(() => {});
                                    const chunksCount = Number(ord.customerLogoChunksCount) || 0;
                                    for (let i = 0; i < chunksCount; i++) {
                                      await deleteDoc(publicDoc('orders', `${ord.id}_logo_${i}`)).catch(() => {});
                                    }
                                  }
                                  setOrders((prev) => prev.filter((x) => x.id !== ord.id));
                                  showToast('تم حذف الطلب.');
                                }}
                                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-700 font-bold">
                            المطلوب:{' '}
                            {(ord.items || []).map((i) => `${i.title}${i.qty > 1 ? ` (×${i.qty})` : ''}`).join(' + ')}{' '}
                            • الإجمالي: <span className="text-blue-600 font-black">{ord.total} ج.م</span>
                          </p>

                          <div className="flex flex-wrap gap-2 text-xs">
                            {ord.customer?.seriesName && (
                              <span className="px-3 py-1 rounded-xl bg-slate-100 font-bold">
                                اسم السلسلة: <strong>{ord.customer.seriesName}</strong>
                              </span>
                            )}
                            {ord.customer?.secondPhone && (
                              <span className="px-3 py-1 rounded-xl bg-slate-100 font-bold">
                                هاتف إضافي / عنوان: <strong>{ord.customer.secondPhone}</strong>
                              </span>
                            )}
                            {ord.customerLogoText && (
                              <span className="px-3 py-1 rounded-xl bg-slate-100 font-bold">
                                نص الشعار: <strong>{ord.customerLogoText}</strong>
                              </span>
                            )}
                            {ord.customer?.notes && (
                              <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 font-bold">
                                ملاحظات: <strong>{ord.customer.notes}</strong>
                              </span>
                            )}
                          </div>

                          {logoImg && (
                            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={logoImg}
                                  alt="شعار المعلم"
                                  className="w-16 h-16 object-contain rounded-xl bg-white p-1 border border-slate-200"
                                />
                                <div>
                                  <p className="text-xs font-black text-slate-900">
                                    صورة شعار المعلم المرفقة ({approxKb} KB)
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-bold">
                                    محفوظة بالبايتات الخام الأصلية 100% للطباعة
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  downloadDataUrlAsOriginalBlob(
                                    logoImg,
                                    `logo_${ord.customer?.teacherName || ord.orderCode || 'teacher'}`
                                  )
                                }
                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow transition"
                              >
                                <Download className="w-4 h-4" />
                                <span>
                                  تنزيل الشعار بالجودة الأصلية الكاملة ({isPngLogo ? 'PNG شفاف' : 'JPG'})
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* تبويب 5: إعدادات المنصة */}
            {adminTab === 'settings' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-900">إعدادات المنصة العامة</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">اسم المنصة</label>
                    <input
                      type="text"
                      value={settings.platformName}
                      onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">الوصف المختصر تحت اسم المنصة</label>
                    <input
                      type="text"
                      value={settings.platformTagline}
                      onChange={(e) => setSettings({ ...settings, platformTagline: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-700 mb-1">العنوان الرئيسي للبانر الترحيبي</label>
                    <input
                      type="text"
                      value={settings.heroTitle}
                      onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-700 mb-1">الوصف الفرعي للبانر الترحيبي</label>
                    <textarea
                      rows={2}
                      value={settings.heroSubtitle}
                      onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">رقم واتساب الاستقبال (بالكود الدولي)</label>
                    <input
                      type="text"
                      value={settings.whatsappNumber}
                      onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                      placeholder="201068481536"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">تعليمات الدفع والتحويل (فودافون كاش / واتساب)</label>
                    <input
                      type="text"
                      value={settings.paymentInstructions || ''}
                      onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                      placeholder="فودافون كاش : 01068481536..."
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">رابط صفحة الفيسبوك (اختياري)</label>
                    <input
                      type="url"
                      value={settings.facebookUrl}
                      onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                      placeholder="https://facebook.com/..."
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">رابط قناة/حساب التليجرام (اختياري)</label>
                    <input
                      type="url"
                      value={settings.telegramUrl}
                      onChange={(e) => setSettings({ ...settings, telegramUrl: e.target.value })}
                      placeholder="https://t.me/..."
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      الموضع الافتراضي لتفاصيل المذكرة في المعاينة
                    </label>
                    <select
                      value={settings.globalDetailsPosition}
                      onChange={(e) => setSettings({ ...settings, globalDetailsPosition: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
                    >
                      <option value="top">فوق صفحات المعاينة</option>
                      <option value="bottom">أسفل صفحات المعاينة</option>
                      <option value="hidden">إخفاء التفاصيل</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">نص الشريط الإعلاني العلوي</label>
                    <input
                      type="text"
                      value={settings.topBannerText}
                      onChange={(e) => setSettings({ ...settings, topBannerText: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">كود الخصم في الشريط العلوي</label>
                    <input
                      type="text"
                      value={settings.topBannerCoupon}
                      onChange={(e) => setSettings({ ...settings, topBannerCoupon: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">شعار المنصة</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const logo = await compressImageFile(file, 400, 0.85, 250000);
                          setSettings({ ...settings, logoImage: logo });
                        }}
                        className="text-xs font-bold"
                      />
                      {isValidImageSrc(settings.logoImage) && (
                        <div className="flex items-center gap-2">
                          <img
                            src={settings.logoImage}
                            alt="الشعار"
                            className="w-10 h-10 rounded-xl object-cover border"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const next = { ...settings, logoImage: '' };
                              setSettings(next);
                              if (db) await deleteDoc(publicDoc('settings', 'media_logo')).catch(() => {});
                              await saveAllSettingsToCloud(next);
                            }}
                            className="text-xs font-black text-rose-600"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">صورة البانر الرئيسي (اختياري)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const hero = await compressImageFile(file, 1100, 0.85, 420000);
                          setSettings({ ...settings, heroImage: hero });
                        }}
                        className="text-xs font-bold"
                      />
                      {isValidImageSrc(settings.heroImage) && (
                        <div className="flex items-center gap-2">
                          <img
                            src={settings.heroImage}
                            alt="البانر"
                            className="w-16 h-10 rounded-xl object-cover border"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const next = { ...settings, heroImage: '' };
                              setSettings(next);
                              if (db) await deleteDoc(publicDoc('settings', 'media_hero')).catch(() => {});
                              await saveAllSettingsToCloud(next);
                            }}
                            className="text-xs font-black text-rose-600"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    saveAllSettingsToCloud(settings);
                    showToast('تم حفظ جميع إعدادات المنصة وتعميمها للعملاء!');
                  }}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow"
                >
                  حفظ الإعدادات
                </button>

                {/* قسم النسخ الاحتياطي وتحميل واستعادة بيانات المنصة */}
                <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">النسخ الاحتياطي لبيانات المنصة</h4>
                    <p className="text-xs text-slate-500 font-bold">
                      تحميل ملف شامل بجميع الإعدادات والأقسام والمذكرات والباقات والكوبونات والطلبات.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={exportingBackup}
                      onClick={handleExportPlatformBackup}
                      className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black inline-flex items-center gap-2 shadow transition"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>{exportingBackup ? 'جارٍ تجهيز الملف...' : 'تحميل بيانات المنصة (JSON)'}</span>
                    </button>

                    <label className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black inline-flex items-center gap-2 cursor-pointer transition">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>استعادة من ملف JSON</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (ev) => {
                            try {
                              const parsed = JSON.parse(ev.target.result);
                              if (parsed?.settings) {
                                await saveAllSettingsToCloud(
                                  parsed.settings,
                                  parsed.packages || packages,
                                  parsed.coupons || coupons
                                );
                              }
                              showToast('تمت استعادة الإعدادات من ملف النسخة الاحتياطية بنجاح!');
                            } catch {
                              showToast('ملف النسخة الاحتياطية غير صالح.', 'error');
                            }
                          };
                          reader.readAsText(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* نافذة معاينة عينات المذكرة */}
      {previewNotebook && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">{previewNotebook.title}</h3>
                <p className="text-xs text-slate-500 font-bold">
                  {previewNotebook.subject} {previewNotebook.pagesCount ? `• ${previewNotebook.pagesCount} صفحة` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewNotebook(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {effectivePreviewDetailsPos === 'top' && previewNotebook.description && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-bold">
                  {previewNotebook.description}
                </div>
              )}

              {loadingSamples ? (
                <div className="py-16 text-center text-sm font-black text-slate-500">جارٍ تحميل صفحات العينة...</div>
              ) : previewSamples.length > 0 ? (
                <div className="space-y-3">
                  <div className="relative bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center min-h-[340px]">
                    <img
                      src={previewSamples[activeSampleIdx]}
                      alt={`صفحة ${activeSampleIdx + 1}`}
                      onError={() =>
                        setPreviewSamples((prev) => prev.filter((_, i) => i !== activeSampleIdx))
                      }
                      className="max-h-[62vh] w-auto object-contain"
                    />
                    {previewSamples.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveSampleIdx((prev) => (prev > 0 ? prev - 1 : previewSamples.length - 1))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveSampleIdx((prev) => (prev < previewSamples.length - 1 ? prev + 1 : 0))
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="text-center text-xs font-black text-slate-600">
                    صفحة {activeSampleIdx + 1} من {previewSamples.length}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm font-bold text-slate-500">
                  لا توجد صور عينات مرفوعة لهذه المذكرة حاليًا.
                </div>
              )}

              {effectivePreviewDetailsPos === 'bottom' && previewNotebook.description && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-bold">
                  {previewNotebook.description}
                </div>
              )}
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {previewNotebook.driveLink && (
                  <a
                    href={previewNotebook.driveLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{ backgroundColor: previewNotebook.driveBtnColor || '#059669' }}
                    className="px-4 py-2.5 rounded-xl text-white text-xs font-black inline-flex items-center gap-1.5 shadow"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>تصفح العينة الكاملة عبر Google Drive</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const target = previewNotebook;
                    setPreviewNotebook(null);
                    openNotebookFullDetails(target);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-black"
                >
                  صفحة التفاصيل الكاملة
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  addToCart(previewNotebook, false);
                  setPreviewNotebook(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black inline-flex items-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>أضف للسلة ({previewNotebook.price} ج.م)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل دخول الإدارة */}
      {adminLoginOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleAdminLogin}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">تسجيل دخول الإدارة</h3>
              <button type="button" onClick={() => setAdminLoginOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">البريد الإلكتروني للإدارة</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="البريد الإلكتروني للإدارة"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">كلمة المرور</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
              />
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowFbSetup((v) => !v)}
                className="text-xs font-black text-blue-600 hover:underline"
              >
                {showFbSetup ? 'إخفاء إعدادات ربط السحابة (Firebase)' : 'ضبط مفتاح ربط السحابة (Firebase API Key)'}
              </button>
              {showFbSetup && (
                <div className="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-700">
                    Firebase Web API Key (من إعدادات مشروع el3bakera-edu):
                  </label>
                  <input
                    type="text"
                    value={fbApiKeyInput}
                    onChange={(e) => setFbApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm"
            >
              دخول
            </button>
          </form>
        </div>
      )}

      {/* الفوتر */}
      <footer className="bg-slate-950 text-slate-300 py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-white">{safeText(settings.platformName)}</p>
            <p className="text-xs text-slate-400">جميع المذكرات منسقة بأعلى جودة وجاهزة للطباعة والتسليم الفوري.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black"
              >
                صفحة الفيسبوك
              </a>
            )}
            {settings.telegramUrl && (
              <a
                href={settings.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black"
              >
                قناة التليجرام
              </a>
            )}
            <a
              href={whatsappDirectUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
            >
              تواصل معنا عبر واتساب
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// بطاقة عرض المذكرة
function NotebookCard({ nb, onPreview, onOpenDetails, onAddToCart }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 hover:border-blue-400 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col justify-between">
      <div>
        <div onClick={onPreview} className="relative aspect-[3/4] bg-slate-100 overflow-hidden cursor-pointer group">
          {nb.badge && (
            <span className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow">
              {nb.badge}
            </span>
          )}
          {nb.coverImage ? (
            <img
              src={nb.coverImage}
              alt={nb.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <BookOpen className="w-14 h-14" />
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>{nb.subject}</span>
            {nb.pagesCount > 0 && <span>{nb.pagesCount} صفحة</span>}
          </div>
          <h3
            onClick={onOpenDetails}
            className="text-base sm:text-lg font-black text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-2 transition"
          >
            {nb.title}
          </h3>
          {nb.description && (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{nb.description}</p>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-black text-blue-600">{nb.price} ج.م</span>
          {Number(nb.oldPrice) > Number(nb.price) && (
            <span className="text-xs text-slate-400 line-through font-bold">{nb.oldPrice} ج.م</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPreview}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-black inline-flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>معاينة</span>
          </button>
          <button
            type="button"
            onClick={onAddToCart}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black inline-flex items-center gap-1"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>اطلب</span>
          </button>
        </div>
      </div>
    </div>
  );
}
