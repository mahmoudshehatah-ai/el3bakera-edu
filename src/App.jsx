import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  ShoppingCart,
  Search,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Award,
  FileText,
  X,
  Plus,
  Trash2,
  Tag,
  MessageCircle,
  Lock,
  Eye,
  Upload,
  Check,
  Edit3,
  Copy,
  Layers,
  Sliders,
  Download,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Package,
  Truck,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Star,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

const ADMIN_ALLOWED_EMAILS = ['mahmoudelzaaty7@gmail.com', 'mahmoudshehatahmohamed@gmail.com'];
const MANUAL_LOGOUT_FLAG = 'el3bakera_manual_logout';

// ==========================================
// 1. إدارة التخزين المحلي الدائم واسع السعة (IndexedDB)
// ==========================================
const DB_NAME = 'el3bakera_persistent_db';
const DB_STORE = 'keyval';

const openPersistentDB = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(DB_STORE)) {
        req.result.createObjectStore(DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const idbGet = async (key) => {
  try {
    const db = await openPersistentDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

const idbSet = async (key, val) => {
  try {
    const db = await openPersistentDB();
    await new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // fallback silently
  }
};

// ==========================================
// 2. الإعدادات الافتراضية المعتمدة لمنصة العباقرة
// ==========================================
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: ['AIzaSyD_du5VY8', 'nJGDJ169Fof9EA', 'lI9x2W2d-14'].join(''),
  authDomain: 'el3bakera-edu.firebaseapp.com',
  projectId: 'el3bakera-edu',
  storageBucket: 'el3bakera-edu.firebasestorage.app',
  messagingSenderId: '74663879858',
  appId: '1:74663879858:web:4327c0ea1b825dd6c615ab'
};

const DEFAULT_LOGO_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%230f172a'/><stop offset='100%25' stop-color='%232563eb'/></linearGradient></defs><rect width='120' height='120' rx='28' fill='url(%23g)'/><text x='60' y='68' font-size='44' font-family='Arial' font-weight='900' fill='%23fbbf24' text-anchor='middle'>ع</text><text x='60' y='96' font-size='14' font-family='Arial' font-weight='bold' fill='%23ffffff' text-anchor='middle'>العباقرة</text></svg>";

const makeCoverSvg = (title, subtitle, bg1, bg2) =>
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 280'><defs><linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='${encodeURIComponent(
    bg1
  )}'/><stop offset='100%25' stop-color='${encodeURIComponent(
    bg2
  )}'/></linearGradient></defs><rect width='400' height='280' fill='url(%23bg)'/><circle cx='350' cy='40' r='90' fill='rgba(255,255,255,0.08)'/><text x='200' y='130' font-size='24' font-family='Arial' font-weight='bold' fill='%23ffffff' text-anchor='middle'>${encodeURIComponent(
    title
  )}</text><text x='200' y='170' font-size='16' font-family='Arial' fill='%23fde047' text-anchor='middle'>${encodeURIComponent(
    subtitle
  )}</text></svg>`;

const DEFAULT_MULTI_OFFERS = [
  {
    id: 'moff_default_1',
    active: true,
    title: 'عرض خاص عند طلب أكثر من مذكرة!',
    subtitle: 'اطلب مذكرتين فأكثر واحصل على خصم تلقائي 15% يطبق مباشرة في سلة الطلبات مخصصة باسمك وشعارك.',
    badgeText: 'وفر حتى 150 ج.م تلقائياً',
    minItems: 2,
    discountType: 'percent', // 'percent' | 'fixed'
    discountValue: 15,
    discountPercent: 15,
    maxDiscount: 150,
    allowCouponStacking: false,
    productIds: [],
    bgColor: '#0f172a',
    textColor: '#ffffff'
  }
];

const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة للمذكرات التعليمية',
  platformTagline: 'مذكرات دراسية احترافية مخصصة باسمك وبياناتك الخاصة',
  logoImage: '',
  heroBgImage: '',
  heroOverlayOpacity: 82,
  heroBadge: 'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة بيانات المعلم.',
  whatsappNumber: '201068481536',
  vodafoneCashNumber: '01068481536',
  adminPin: 'lolo120161273',

  homeProductsTitle: 'أحدث المذكرات المضافة',
  homeProductsSubtitle: 'اختر المذكرة المناسبة لطلابك واطلبها مخصصة باسمك وشعارك',
  homeProductsMode: 'auto', // 'auto' | 'custom'
  homeMaxProducts: 6,
  homeSelectedProductIds: [],

  driveButtonLabel: 'معاينة عينة Google Drive',
  driveButtonBgColor: '#ecfdf5',
  driveButtonTextColor: '#047857',

  promoEnabled: true,
  promoText: 'عرض خاص للمعلمين: خصم 15% على جميع المذكرات بمناسبة إطلاق المنصة',
  promoCouponCode: 'M20',
  promoBgColor: '#0654d0',
  promoTextColor: '#fde047',

  bulkDiscountEnabled: true,
  bulkMinItems: 2,
  bulkDiscountPercent: 15,
  bulkMaxDiscount: 150,

  multiOffers: DEFAULT_MULTI_OFFERS,

  discountBadge: {
    enabled: true,
    showPercentage: true,
    showSavedAmount: true,
    position: 'top-right',
    bgColor: '#059669',
    textColor: '#ffffff'
  },

  generalNotice: {
    enabled: true,
    title: 'تنبيه هام للمعلمين قبل تأكيد الطلب:',
    text: '• يتم تسليم المذكرة بصيغة PDF عالية الدقة جاهزة للطباعة ببيانات المعلم الخاصة دون أي بيانات تخصنا.\n• تُوضع العلامة المائية باسم المعلم أو اسم السلسلة الخاص به على كافة الصفحات، وغير متاح إرسال المذكرات بدونها.',
    position: 'top',
    bgColor: '#fffbeb',
    textColor: '#78350f',
    borderColor: '#fde68a'
  },

  productNoticeStyle: {
    showOnCard: true,
    showInPreview: true,
    position: 'bottom',
    bgColor: '#eff6ff',
    textColor: '#1e3a8a',
    borderColor: '#bfdbfe'
  },

  libraryNoticeTitle: 'تنبيه هام للمعلمين قبل تأكيد الطلب:',
  libraryNoticeText:
    '• يتم تسليم المذكرة بصيغة PDF عالية الدقة جاهزة للطباعة ببيانات المعلم الخاصة دون أي بيانات تخصنا.\n• تُوضع العلامة المائية باسم المعلم أو اسم السلسلة الخاص به على كافة الصفحات، وغير متاح إرسال المذكرات بدونها.',
  testimonialsTitle: 'آراء وتقييمات المعلمين',

  stages: [
    { id: 'stg_primary', name: 'المرحلة الابتدائية', order: 1 },
    { id: 'stg_prep', name: 'المرحلة الإعدادية', order: 2 },
    { id: 'stg_sec', name: 'المرحلة الثانوية', order: 3 }
  ],
  grades: [
    { id: 'grd_p4', stageId: 'stg_primary', name: 'الصف الرابع الابتدائي', order: 1 },
    { id: 'grd_p5', stageId: 'stg_primary', name: 'الصف الخامس الابتدائي', order: 2 },
    { id: 'grd_p6', stageId: 'stg_primary', name: 'الصف السادس الابتدائي', order: 3 },
    { id: 'grd_m1', stageId: 'stg_prep', name: 'الصف الأول الإعدادي', order: 1 },
    { id: 'grd_m2', stageId: 'stg_prep', name: 'الصف الثاني الإعدادي', order: 2 },
    { id: 'grd_m3', stageId: 'stg_prep', name: 'الصف الثالث الإعدادي', order: 3 },
    { id: 'grd_s1', stageId: 'stg_sec', name: 'الصف الأول الثانوي', order: 1 },
    { id: 'grd_s2', stageId: 'stg_sec', name: 'الصف الثاني الثانوي', order: 2 },
    { id: 'grd_s3', stageId: 'stg_sec', name: 'الصف الثالث الثانوي', order: 3 }
  ],
  categories: [
    {
      id: 'cat_term1',
      name: 'مذكرات الفصل الدراسي الأول',
      coverImage: makeCoverSvg('مذكرات الفصل الدراسي الأول', 'شرح مبسط وتدريبات متكاملة', '#1e3a8a', '#2563eb')
    },
    {
      id: 'cat_term2',
      name: 'مذكرات الفصل الدراسي الثاني',
      coverImage: makeCoverSvg('مذكرات الفصل الدراسي الثاني', 'منسقة وجاهزة للطباعة', '#065f46', '#10b981')
    },
    {
      id: 'cat_final_rev',
      name: 'مراجعات وبنوك أسئلة نهائية',
      coverImage: makeCoverSvg('مراجعات وبنوك أسئلة', 'ليلة الامتحان والامتحانات الشاملة', '#7c2d12', '#ea580c')
    }
  ],
  socialLinks: [
    { id: 'soc_fb', label: 'صفحة الفيسبوك', url: 'https://www.facebook.com/share/17bS2p2v12/' },
    { id: 'soc_wa', label: 'جروب الواتساب', url: 'https://chat.whatsapp.com/I8vT9t7k8t60H5H7s5X2yG' },
    { id: 'soc_tg', label: 'قناة التيليجرام', url: 'https://t.me/el3bakera_edu' }
  ],
  upcomingItems: [
    {
      id: 'up_1',
      title: 'مذكرة المراجعة النهائية للصف الأول الثانوي',
      stageName: 'المرحلة الثانوية',
      statusText: 'قيد المراجعة النهائية والطباعة',
      expectedDate: 'قريباً جداً'
    },
    {
      id: 'up_2',
      title: 'بنك الأسئلة الشامل للصف السادس الابتدائي',
      stageName: 'المرحلة الابتدائية',
      statusText: 'جاري التنسيق وإضافة نماذج الوزارة',
      expectedDate: 'الأسبوع القادم'
    }
  ],
  testimonials: [
    {
      id: 'rev_1',
      author: 'أ. محمد عبد الرحمن - معلم أول لغة عربية',
      text: 'مذكرات في قمة الاحترافية والتنسيق، تم وضع اسمي ورقم هاتفي وشعار السلسلة على كل صفحة بدقة مبهرة والطلاب انبهروا بها.',
      image: ''
    },
    {
      id: 'rev_2',
      author: 'أ. سارة محمود - معلمة المرحلة الإعدادية',
      text: 'سرعة في التسليم وجودة طباعة عالية جداً، وبنوك الأسئلة شاملة لكل جزئيات المنهج دون أي أخطاء.',
      image: ''
    }
  ],
  trustPoints: [
    {
      id: 'tp_1',
      title: 'تخصيص حصري بهويتك',
      desc: 'إضافة اسمك ورقم هاتفك وشعار سلسلتك كعلامة مائية احترافية على كافة الصفحات.'
    },
    {
      id: 'tp_2',
      title: 'جاهزة للطباعة فوراً PDF',
      desc: 'ملفات عالية الدقة بأبعاد قياسية ومراجعة لغوية وفنية دقيقة وفق أحدث التعديلات.'
    },
    {
      id: 'tp_3',
      title: 'تسليم سريع ودعم متواصل',
      desc: 'استلم مذكرتك المخصصة عبر واتساب في أسرع وقت مع متابعة كاملة قبل وبعد التسليم.'
    }
  ]
};

const DEFAULT_PRODUCTS = [
  {
    id: 'prod_m3_bank',
    title: 'بنك مراجعة الصف الثالث الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_m3',
    categoryId: 'cat_final_rev',
    pagesCount: 109,
    price: 199,
    originalPrice: 250,
    goldRibbon: 'الأكثر طلباً للمراجعة النهائية',
    tipText: 'ملاحظة: يشمل جميع فروع اللغة العربية بالإجابات النموذجية.',
    driveSampleUrl: 'https://drive.google.com/',
    description: 'بنك أسئلة ومراجعة نهائية شاملة لمنهج الصف الثالث الإعدادي في اللغة العربية وفق أحدث مواصفات الورقة الامتحانية.',
    coverImage: makeCoverSvg('بنك مراجعة 3 إعدادي', '109 صفحة • شاملة الإجابات', '#1e293b', '#2563eb'),
    sampleImages: [],
    hidden: false
  },
  {
    id: 'prod_m2_bank',
    title: 'بنك مراجعة الصف الثاني الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_m2',
    categoryId: 'cat_final_rev',
    pagesCount: 106,
    price: 149,
    originalPrice: 200,
    goldRibbon: 'الخيار الأفضل للمراجعة وتهيئة الطالب',
    tipText: '',
    driveSampleUrl: 'https://drive.google.com/',
    description: 'مراجعة شاملة وتدريبات متدرجة على كافة دروس المنهج للصف الثاني الإعدادي مع نماذج امتحانات متوقعة.',
    coverImage: makeCoverSvg('بنك مراجعة 2 إعدادي', '106 صفحة • منسقة باحترافية', '#0f172a', '#0284c7'),
    sampleImages: [],
    hidden: false
  },
  {
    id: 'prod_m2_booklet',
    title: 'بوكليت الاختبارات الشاملة للصف الثاني الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_m2',
    categoryId: 'cat_final_rev',
    pagesCount: 48,
    price: 99,
    originalPrice: 150,
    goldRibbon: 'نماذج امتحانات مطابقة للمواصفات',
    tipText: '',
    driveSampleUrl: 'https://drive.google.com/',
    description: 'بوكليت اختبارات نهائية شاملة لتدريب طلاب الصف الثاني الإعدادي على نظام البوكليت والأسئلة المتوقعة.',
    coverImage: makeCoverSvg('بوكليت اختبارات 2 إعدادي', '48 صفحة • اختبارات شاملة', '#312e81', '#4f46e5'),
    sampleImages: [],
    hidden: false
  },
  {
    id: 'prod_m1_bank',
    title: 'بنك مراجعة الصف الأول الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_m1',
    categoryId: 'cat_final_rev',
    pagesCount: 98,
    price: 149,
    originalPrice: 200,
    goldRibbon: 'محدث وفق المنهج الجديد',
    tipText: '',
    driveSampleUrl: 'https://drive.google.com/',
    description: 'بنك أسئلة متكامل لمنهج الصف الأول الإعدادي الجديد يشمل القراءة والنصوص والنحو والتعبير والإملاء.',
    coverImage: makeCoverSvg('بنك مراجعة 1 إعدادي', '98 صفحة • المنهج الجديد', '#064e3b', '#059669'),
    sampleImages: [],
    hidden: false
  },
  {
    id: 'prod_m3_booklet',
    title: 'بوكليت الامتحانات النهائية للصف الثالث الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_m3',
    categoryId: 'cat_final_rev',
    pagesCount: 52,
    price: 99,
    originalPrice: 150,
    goldRibbon: 'مراجعة ليلة الامتحان',
    tipText: '',
    driveSampleUrl: 'https://drive.google.com/',
    description: 'بوكليت امتحانات نهائية مركزة للصف الثالث الإعدادي تغطي أهم أفكار المحافظات والأسئلة المتوقعة.',
    coverImage: makeCoverSvg('بوكليت امتحانات 3 إعدادي', '52 صفحة • نماذج المحافظات', '#7c2d12', '#d97706'),
    sampleImages: [],
    hidden: false
  },
  {
    id: 'prod_s3_term2',
    title: 'منهج الترم الثاني للصف الثالث الثانوي 2027',
    subject: 'اللغة العربية',
    stageId: 'stg_sec',
    gradeId: 'grd_s3',
    categoryId: 'cat_term2',
    pagesCount: 140,
    price: 249,
    originalPrice: 300,
    goldRibbon: 'إصدار خاص للثانوية العامة',
    tipText: 'مذكرة متكاملة للثانوية العامة شاملة الشرح والتطبيقات.',
    driveSampleUrl: 'https://drive.google.com/',
    description: 'مذكرة شرح وتدريبات متكاملة لطلاب الصف الثالث الثانوي وفق أحدث تعديلات الوزارة ونظام التقييم الحديث.',
    coverImage: makeCoverSvg('الثالث الثانوي 2027', '140 صفحة • شرح وتدريبات', '#1e1b4b', '#7c3aed'),
    sampleImages: [],
    hidden: false
  }
];

const DEFAULT_BUNDLES = [
  {
    id: 'bnd_prep_all',
    title: 'باقة مراجعات التقفيل الشاملة للمرحلة الإعدادية',
    description: 'احصل على جميع بنوك المراجعة وبوكليتات الامتحانات للمرحلة الإعدادية (الصفوف الأول والثاني والثالث الإعدادي) في باقة واحدة موفرة ومخصصة بالكامل باسمك وشعارك.',
    price: 649,
    originalPrice: 895,
    badge: 'وفر 246 ج.م دفعة واحدة',
    driveSampleUrl: 'https://drive.google.com/',
    allowCoupon: false,
    productIds: ['prod_m3_bank', 'prod_m2_bank', 'prod_m2_booklet', 'prod_m1_bank', 'prod_m3_booklet']
  }
];

const DEFAULT_COUPONS = [
  { id: 'cp_m20', code: 'M20', discountPercent: 15, maxUses: 500, usedCount: 12, active: true },
  { id: 'cp_next15', code: 'NEXT15', discountPercent: 15, maxUses: 1000, usedCount: 5, active: true },
  { id: 'cp_vip1', code: 'VIP7906', discountPercent: 20, maxUses: 10, usedCount: 0, active: true }
];

// ==========================================
// 3. دوال مساعدة للضغط والأمان والبيانات
// ==========================================
const safeText = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return fallback;
};

const normalizeItems = (arr, fallbackArr) => {
  if (!Array.isArray(arr) || arr.length === 0) return fallbackArr;
  return arr.filter((item) => item && typeof item === 'object');
};

const compressImageFile = (file, maxWidth = 750, quality = 0.72) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(ev.target.result);
      img.src = ev.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

const recompressDataUrl = (dataUrl, maxWidth = 680, quality = 0.65) =>
  new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

// ==========================================
// 4. حاجز الحماية من تعارض البيانات (ErrorBoundary)
// ==========================================
class PlatformErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">حدث تعارض مؤقت في البيانات المخزنة</h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              اضغط على الزر بالأسفل لإعادة تشغيل المنصة وتحديث الذاكرة المؤقتة فوراً.
            </p>
            <button
              onClick={() => {
                try {
                  localStorage.clear();
                } catch {}
                window.location.reload();
              }}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg cursor-pointer"
            >
              إعادة تشغيل المنصة الآن
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 5. المكون الرئيسي لمنصة العباقرة
// ==========================================
function MuzakkiratiPlatformInner() {
  // الحالة الأساسية للإعدادات والبيانات
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_settings_v7');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          heroBgImage: parsed.heroBgImage || parsed.heroImage || DEFAULT_SETTINGS.heroBgImage,
          discountBadge: { ...DEFAULT_SETTINGS.discountBadge, ...(parsed.discountBadge || {}) },
          generalNotice: { ...DEFAULT_SETTINGS.generalNotice, ...(parsed.generalNotice || {}) },
          productNoticeStyle: { ...DEFAULT_SETTINGS.productNoticeStyle, ...(parsed.productNoticeStyle || {}) },
          stages: normalizeItems(parsed.stages, DEFAULT_SETTINGS.stages),
          grades: normalizeItems(parsed.grades, DEFAULT_SETTINGS.grades),
          categories: normalizeItems(parsed.categories, DEFAULT_SETTINGS.categories),
          socialLinks: normalizeItems(parsed.socialLinks, DEFAULT_SETTINGS.socialLinks),
          upcomingItems: normalizeItems(parsed.upcomingItems, DEFAULT_SETTINGS.upcomingItems),
          testimonials: normalizeItems(parsed.testimonials, DEFAULT_SETTINGS.testimonials),
          trustPoints: normalizeItems(parsed.trustPoints, DEFAULT_SETTINGS.trustPoints),
          multiOffers: normalizeItems(parsed.multiOffers, DEFAULT_MULTI_OFFERS)
        };
      }
      // استعادة تلقائية من المفتاح السابق v6 إذا كان موجوداً
      const savedV6 = localStorage.getItem('el3bakera_settings_v6') || localStorage.getItem('el3bakera_settings_v5');
      if (savedV6) {
        const parsed6 = JSON.parse(savedV6);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed6,
          heroBgImage: parsed6.heroBgImage || parsed6.heroImage || DEFAULT_SETTINGS.heroBgImage,
          discountBadge: { ...DEFAULT_SETTINGS.discountBadge, ...(parsed6.discountBadge || {}) },
          generalNotice: { ...DEFAULT_SETTINGS.generalNotice, ...(parsed6.generalNotice || {}) },
          productNoticeStyle: { ...DEFAULT_SETTINGS.productNoticeStyle, ...(parsed6.productNoticeStyle || {}) },
          stages: normalizeItems(parsed6.stages, DEFAULT_SETTINGS.stages),
          grades: normalizeItems(parsed6.grades, DEFAULT_SETTINGS.grades),
          categories: normalizeItems(parsed6.categories, DEFAULT_SETTINGS.categories),
          socialLinks: normalizeItems(parsed6.socialLinks, DEFAULT_SETTINGS.socialLinks),
          upcomingItems: normalizeItems(parsed6.upcomingItems, DEFAULT_SETTINGS.upcomingItems),
          testimonials: normalizeItems(parsed6.testimonials, DEFAULT_SETTINGS.testimonials),
          trustPoints: normalizeItems(parsed6.trustPoints, DEFAULT_SETTINGS.trustPoints),
          multiOffers: normalizeItems(parsed6.multiOffers, DEFAULT_MULTI_OFFERS)
        };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [bundles, setBundles] = useState(DEFAULT_BUNDLES);
  const [coupons, setCoupons] = useState(DEFAULT_COUPONS);
  const [orders, setOrders] = useState([]);

  // التنقل والنوافذ المنبثقة
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('all');
  const [selectedGradeId, setSelectedGradeId] = useState('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  const [previewProduct, setPreviewProduct] = useState(null);
  const [activeSampleIdx, setActiveSampleIdx] = useState(0);
  const [isFullscreenSample, setIsFullscreenSample] = useState(false);

  // مراجع السحب باللمس والفأرة للعينات
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const mouseStartXRef = useRef(null);
  const thumbnailsContainerRef = useRef(null);

  // سلة الطلبات والتخصيص
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_cart_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    teacherName: '',
    phone1: '',
    seriesName: '',
    phone2: '',
    hasLogo: 'سأرسله على واتساب',
    logoText: '',
    logoFileName: '',
    logoDataUrl: '',
    notes: ''
  });

  // نافذة التواصل وتتبع الطلب
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [trackPhoneInput, setTrackPhoneInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // التنبيهات العائمة (Toast)
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ==========================================
  // 6. مصادقة الإدارة وربط Firebase Firestore
  // ==========================================
  const [user, setUser] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      if (localStorage.getItem(MANUAL_LOGOUT_FLAG) === '1') return false;
      return localStorage.getItem('el3bakera_admin_auth') === '1';
    } catch {
      return false;
    }
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminTab, setAdminTab] = useState('products');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const logoTapCountRef = useRef(0);
  const logoTapTimerRef = useRef(null);

  const firebaseServices = useMemo(() => {
    try {
      const app = getApps().length ? getApps()[0] : initializeApp(DEFAULT_FIREBASE_CONFIG);
      let dbInstance;
      try {
        dbInstance = initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true
        });
      } catch {
        dbInstance = getFirestore(app);
      }
      return {
        app,
        auth: getAuth(app),
        db: dbInstance
      };
    } catch {
      return { app: null, auth: null, db: null };
    }
  }, []);

  const isOfficialGoogleAdmin = useMemo(() => {
    const email = user?.email?.toLowerCase() || '';
    return ADMIN_ALLOWED_EMAILS.includes(email);
  }, [user]);

  useEffect(() => {
    const { auth } = firebaseServices;
    if (!auth) return;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const email = currentUser.email?.toLowerCase() || '';
        const manualLogout = localStorage.getItem(MANUAL_LOGOUT_FLAG) === '1';
        if (ADMIN_ALLOWED_EMAILS.includes(email) && !manualLogout) {
          setIsAdminAuthenticated(true);
          try {
            localStorage.setItem('el3bakera_admin_auth', '1');
          } catch {}
        }
      } else {
        try {
          await signInAnonymously(auth);
        } catch {}
      }
    });

    return () => unsubAuth();
  }, [firebaseServices]);

  // دالة التنقل وزر الرجوع للهاتف
  const navigateToTab = (tabName) => {
    setActiveTab(tabName);
    try {
      if (tabName === 'admin') {
        window.history.pushState({ tab: 'admin' }, '', '#admin');
      } else {
        window.history.pushState({ tab: tabName }, '', window.location.pathname);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  const handleGoBack = () => {
    if (isFullscreenSample) {
      setIsFullscreenSample(false);
      return;
    }
    if (previewProduct) {
      setPreviewProduct(null);
      return;
    }
    if (isCartOpen) {
      setIsCartOpen(false);
      return;
    }
    if (isContactModalOpen) {
      setIsContactModalOpen(false);
      return;
    }
    if (isAdminModalOpen) {
      setIsAdminModalOpen(false);
      return;
    }
    if (activeTab !== 'home') {
      navigateToTab('home');
    }
  };

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        if (isAdminAuthenticated) {
          setActiveTab('admin');
        } else {
          setIsAdminModalOpen(true);
        }
      }
    };
    checkHash();
    const onPopState = () => {
      if (isFullscreenSample) {
        setIsFullscreenSample(false);
        return;
      }
      if (previewProduct) {
        setPreviewProduct(null);
        return;
      }
      if (isCartOpen) {
        setIsCartOpen(false);
        return;
      }
      if (isContactModalOpen) {
        setIsContactModalOpen(false);
        return;
      }
      if (window.location.hash === '#admin' && isAdminAuthenticated) {
        setActiveTab('admin');
      } else {
        setActiveTab('home');
      }
    };
    window.addEventListener('hashchange', checkHash);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('popstate', onPopState);
    };
  }, [isAdminAuthenticated, isFullscreenSample, previewProduct, isCartOpen, isContactModalOpen]);

  const handleLogoSecretTap = () => {
    navigateToTab('home');
    logoTapCountRef.current += 1;
    clearTimeout(logoTapTimerRef.current);
    logoTapTimerRef.current = setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 1800);
    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0;
      if (isAdminAuthenticated) {
        navigateToTab('admin');
      } else {
        setIsAdminModalOpen(true);
      }
    }
  };

  const handleAdminGoogleLogin = async () => {
    const { auth } = firebaseServices;
    if (!auth) {
      showToast('خدمة المصادقة غير متوفرة حالياً', 'error');
      return;
    }
    try {
      localStorage.removeItem(MANUAL_LOGOUT_FLAG);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const email = result.user?.email?.toLowerCase() || '';
      if (ADMIN_ALLOWED_EMAILS.includes(email)) {
        setUser(result.user);
        setIsAdminAuthenticated(true);
        localStorage.setItem('el3bakera_admin_auth', '1');
        setIsAdminModalOpen(false);
        navigateToTab('admin');
        showToast(`مرحباً بك (${email}) — تم تفعيل الحفظ السحابي الرسمي!`);
      } else {
        await signOut(auth);
        showToast('هذا الحساب غير مصرح له بإدارة المنصة', 'error');
      }
    } catch (err) {
      showToast(`تعذر تسجيل الدخول بجوجل (${err?.code || 'خطأ'})`, 'error');
    }
  };

  const handleAdminPinSubmit = (e) => {
    e.preventDefault();
    const validPin = safeText(settings.adminPin, 'lolo120161273');
    if (adminPinInput.trim() === validPin || adminPinInput.trim() === '2026') {
      localStorage.removeItem(MANUAL_LOGOUT_FLAG);
      setIsAdminAuthenticated(true);
      try {
        localStorage.setItem('el3bakera_admin_auth', '1');
      } catch {}
      setIsAdminModalOpen(false);
      setAdminPinInput('');
      navigateToTab('admin');
      showToast('تم فتح لوحة الإدارة بنجاح');
    } else {
      showToast('رمز الدخول غير صحيح', 'error');
    }
  };

  const handleAdminLogout = async () => {
    try {
      localStorage.setItem(MANUAL_LOGOUT_FLAG, '1');
      localStorage.removeItem('el3bakera_admin_auth');
    } catch {}
    setIsAdminAuthenticated(false);
    if (activeTab === 'admin') {
      setActiveTab('home');
    }
    try {
      if (window.location.hash === '#admin') {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch {}
    try {
      if (firebaseServices.auth) {
        await signOut(firebaseServices.auth);
      }
    } catch {}
    showToast('تم تسجيل الخروج من لوحة الإدارة نهائياً');
  };

  // ==========================================
  // 7. التحميل المحلي والمزامنة الفورية مع السحابة (Firestore)
  // ==========================================
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [
        localProds,
        localProdsOld,
        localBundles,
        localBundlesOld,
        localCoupons,
        localCouponsOld,
        localSettings,
        localSettingsOld
      ] = await Promise.all([
        idbGet('products_v6'),
        idbGet('products_v5'),
        idbGet('bundles_v6'),
        idbGet('bundles_v5'),
        idbGet('coupons_v6'),
        idbGet('coupons_v5'),
        idbGet('settings_v7'),
        idbGet('settings_v6')
      ]);
      if (!mounted) return;
      const chosenProds = (Array.isArray(localProds) && localProds.length > 0) ? localProds : localProdsOld;
      const chosenBundles = (Array.isArray(localBundles) && localBundles.length > 0) ? localBundles : localBundlesOld;
      const chosenCoupons = (Array.isArray(localCoupons) && localCoupons.length > 0) ? localCoupons : localCouponsOld;
      const chosenSettings = localSettings || localSettingsOld;

      if (Array.isArray(chosenProds) && chosenProds.length > 0) setProducts(chosenProds);
      if (Array.isArray(chosenBundles) && chosenBundles.length > 0) setBundles(chosenBundles);
      if (Array.isArray(chosenCoupons) && chosenCoupons.length > 0) setCoupons(chosenCoupons);
      if (chosenSettings && typeof chosenSettings === 'object') {
        setSettings((prev) => ({
          ...prev,
          ...chosenSettings,
          heroBgImage: chosenSettings.heroBgImage || chosenSettings.heroImage || prev.heroBgImage,
          discountBadge: { ...prev.discountBadge, ...(chosenSettings.discountBadge || {}) },
          generalNotice: { ...prev.generalNotice, ...(chosenSettings.generalNotice || {}) },
          productNoticeStyle: { ...prev.productNoticeStyle, ...(chosenSettings.productNoticeStyle || {}) },
          stages: normalizeItems(chosenSettings.stages, prev.stages),
          grades: normalizeItems(chosenSettings.grades, prev.grades),
          categories: normalizeItems(chosenSettings.categories, prev.categories),
          socialLinks: normalizeItems(chosenSettings.socialLinks, prev.socialLinks),
          upcomingItems: normalizeItems(chosenSettings.upcomingItems, prev.upcomingItems),
          testimonials: normalizeItems(chosenSettings.testimonials, prev.testimonials),
          trustPoints: normalizeItems(chosenSettings.trustPoints, prev.trustPoints),
          multiOffers: normalizeItems(chosenSettings.multiOffers, prev.multiOffers || DEFAULT_MULTI_OFFERS)
        }));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const { db } = firebaseServices;
    if (!db || !user) return;

    const basePath = ['artifacts', 'el3bakera-edu', 'public', 'data'];
    const settingsDocRef = doc(db, ...basePath, 'settings', 'main');
    const configMainDocRef = doc(db, ...basePath, 'config', 'main');
    const configColRef = collection(db, ...basePath, 'config');
    const productsColRef = collection(db, ...basePath, 'notebooks');
    const samplesColRef = collection(db, ...basePath, 'notebook_samples');
    const bundlesColRef = collection(db, ...basePath, 'bundles');
    const couponsColRef = collection(db, ...basePath, 'coupons');
    const ordersColRef = collection(db, ...basePath, 'orders');

    const applyCloudSettingsSnapshot = (raw) => {
      if (!raw || typeof raw !== 'object') return;
      setSettings((prev) => {
        const merged = {
          ...prev,
          ...raw,
          logoImage: raw.logoImage || prev.logoImage,
          heroBgImage: raw.heroBgImage || raw.heroImage || prev.heroBgImage,
          discountBadge: { ...prev.discountBadge, ...(raw.discountBadge || {}) },
          generalNotice: { ...prev.generalNotice, ...(raw.generalNotice || {}) },
          productNoticeStyle: { ...prev.productNoticeStyle, ...(raw.productNoticeStyle || {}) },
          stages: normalizeItems(raw.stages, prev.stages),
          grades: normalizeItems(raw.grades, prev.grades),
          categories: normalizeItems(raw.categories, prev.categories).map((c) => {
            const existingCat = prev.categories?.find((pc) => pc.id === c.id);
            return {
              ...c,
              coverImage: c.coverImage || existingCat?.coverImage || makeCoverSvg(c.name, '', '#1e3a8a', '#2563eb')
            };
          }),
          socialLinks: normalizeItems(raw.socialLinks, prev.socialLinks),
          upcomingItems: normalizeItems(raw.upcomingItems, prev.upcomingItems),
          testimonials: normalizeItems(raw.testimonials, prev.testimonials),
          trustPoints: normalizeItems(raw.trustPoints, prev.trustPoints),
          multiOffers: normalizeItems(raw.multiOffers, prev.multiOffers || DEFAULT_MULTI_OFFERS)
        };
        try {
          localStorage.setItem('el3bakera_settings_v7', JSON.stringify(merged));
        } catch {}
        idbSet('settings_v7', merged);
        return merged;
      });
    };

    // جلب فوري عند الفتح من config/main و settings/main
    Promise.all([getDoc(configMainDocRef), getDoc(settingsDocRef)])
      .then(([cfgSnap, setSnap]) => {
        if (cfgSnap.exists()) applyCloudSettingsSnapshot(cfgSnap.data());
        if (setSnap.exists()) applyCloudSettingsSnapshot(setSnap.data());
      })
      .catch(() => {});

    const unsubSettings = onSnapshot(
      settingsDocRef,
      (snap) => {
        if (snap.exists()) applyCloudSettingsSnapshot(snap.data());
      },
      () => {}
    );

    const unsubConfigMain = onSnapshot(
      configMainDocRef,
      (snap) => {
        if (snap.exists()) applyCloudSettingsSnapshot(snap.data());
      },
      () => {}
    );

    const unsubProducts = onSnapshot(
      productsColRef,
      (snap) => {
        if (snap.empty) return;
        const cloudList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts((prev) => {
          const prevMap = new Map(prev.map((item) => [item.id, item]));
          const merged = cloudList.map((cItem) => {
            const existing = prevMap.get(cItem.id);
            return {
              ...cItem,
              coverImage: cItem.coverImage || existing?.coverImage || makeCoverSvg(cItem.title || 'مذكرة', '', '#1e293b', '#2563eb'),
              sampleImages:
                Array.isArray(cItem.sampleImages) && cItem.sampleImages.length > 0
                  ? cItem.sampleImages
                  : existing?.sampleImages || []
            };
          });
          idbSet('products_v6', merged);
          return merged;
        });
      },
      () => {}
    );

    const unsubLegacySamples = onSnapshot(
      samplesColRef,
      (snap) => {
        if (snap.empty) return;
        const sampleMap = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          const pid = data.productId || d.id;
          const imgs = Array.isArray(data.sampleImages)
            ? data.sampleImages
            : Array.isArray(data.images)
            ? data.images
            : [];
          if (imgs.length > 0) sampleMap[pid] = imgs;
        });
        if (Object.keys(sampleMap).length > 0) {
          setProducts((prev) => {
            const updated = prev.map((p) => {
              if (sampleMap[p.id] && sampleMap[p.id].length >= (p.sampleImages?.length || 0)) {
                return { ...p, sampleImages: sampleMap[p.id] };
              }
              return p;
            });
            setTimeout(() => idbSet('products_v6', updated), 300);
            return updated;
          });
        }
      },
      () => {}
    );

    // جلب الصور الأساسية فقط (الشعار، الخلفية، أغلفة الأقسام وأغلفة المذكرات) لمرة واحدة وبأقصى سرعة
    // أما صور العينات الداخلية فتُحمَّل عند الطلب فقط عند فتح معاينة المذكرة لمنع البطء الشديد!
    let cancelledMedia = false;
    const essentialAssetIds = [
      'media_logo',
      'media_hero_bg',
      ...DEFAULT_SETTINGS.categories.map((c) => `media_cat_${c.id}`)
    ];

    Promise.all(
      essentialAssetIds.map((id) =>
        getDoc(doc(db, ...basePath, 'config', id)).catch(() => null)
      )
    ).then((snaps) => {
      if (cancelledMedia) return;
      const mediaMap = {};
      snaps.forEach((s) => {
        if (s && s.exists() && s.data()?.dataUrl) {
          mediaMap[s.id] = s.data().dataUrl;
        }
      });
      if (Object.keys(mediaMap).length === 0) return;
      setSettings((prev) => {
        const next = {
          ...prev,
          logoImage: mediaMap.media_logo || prev.logoImage,
          heroBgImage: mediaMap.media_hero_bg || prev.heroBgImage,
          categories: (prev.categories || []).map((c) => ({
            ...c,
            coverImage: mediaMap[`media_cat_${c.id}`] || c.coverImage
          }))
        };
        setTimeout(() => idbSet('settings_v7', next), 300);
        return next;
      });
    });

    // جلب أغلفة المذكرات وأغلفة الأقسام الإضافية بشكل خفيف بعد تحميل الصفحة
    getDocs(productsColRef)
      .then((pSnap) => {
        if (cancelledMedia || pSnap.empty) return;
        const prodIds = pSnap.docs.map((d) => d.id);
        Promise.all(
          prodIds.map((pid) =>
            getDoc(doc(db, ...basePath, 'config', `media_prod_cover_${pid}`)).catch(() => null)
          )
        ).then((coverSnaps) => {
          if (cancelledMedia) return;
          const coverMap = {};
          coverSnaps.forEach((cs) => {
            if (cs && cs.exists() && cs.data()?.dataUrl) {
              coverMap[cs.id] = cs.data().dataUrl;
            }
          });
          if (Object.keys(coverMap).length === 0) return;
          setProducts((prev) => {
            const updated = prev.map((p) => ({
              ...p,
              coverImage: coverMap[`media_prod_cover_${p.id}`] || p.coverImage
            }));
            setTimeout(() => idbSet('products_v6', updated), 400);
            return updated;
          });
        });
      })
      .catch(() => {});

    const unsubBundles = onSnapshot(
      bundlesColRef,
      (snap) => {
        if (snap.empty) return;
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBundles(list);
        idbSet('bundles_v6', list);
      },
      () => {}
    );

    const unsubCoupons = onSnapshot(
      couponsColRef,
      (snap) => {
        if (snap.empty) return;
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCoupons(list);
        idbSet('coupons_v6', list);
      },
      () => {}
    );

    const unsubOrders = onSnapshot(
      ordersColRef,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => !String(item.id).includes('_logo_'))
          .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        setOrders(list);
      },
      () => {}
    );

    return () => {
      cancelledMedia = true;
      unsubSettings();
      unsubConfigMain();
      unsubProducts();
      unsubLegacySamples();
      unsubBundles();
      unsubCoupons();
      unsubOrders();
    };
  }, [firebaseServices, user]);

  // دوال الحفظ السحابي والمحلي
  const saveMediaAssetToCloud = async (assetId, rawDataUrl) => {
    const { db } = firebaseServices;
    if (!db || !rawDataUrl || !rawDataUrl.startsWith('data:image')) return;
    let dataUrl = rawDataUrl;
    if (dataUrl.length > 650000) {
      dataUrl = await recompressDataUrl(dataUrl, 680, 0.65);
    }
    if (dataUrl.length > 850000) {
      dataUrl = await recompressDataUrl(dataUrl, 520, 0.55);
    }
    const basePath = ['artifacts', 'el3bakera-edu', 'public', 'data', 'config'];
    await setDoc(doc(db, ...basePath, assetId), {
      assetId,
      dataUrl,
      updatedAt: serverTimestamp()
    });
  };

  const saveSettings = async (nextSettings) => {
    setSettings(nextSettings);
    try {
      localStorage.setItem('el3bakera_settings_v7', JSON.stringify(nextSettings));
    } catch {}
    await idbSet('settings_v7', nextSettings);

    const { db } = firebaseServices;
    if (!db) return;

    const cleanSettings = { ...nextSettings };
    delete cleanSettings.logoImage;
    delete cleanSettings.heroBgImage;
    if (Array.isArray(cleanSettings.categories)) {
      cleanSettings.categories = cleanSettings.categories.map((c) => ({
        id: c.id,
        name: c.name
      }));
    }

    try {
      const basePath = ['artifacts', 'el3bakera-edu', 'public', 'data'];
      await Promise.all([
        setDoc(doc(db, ...basePath, 'settings', 'main'), cleanSettings, { merge: true }),
        setDoc(doc(db, ...basePath, 'config', 'main'), cleanSettings, { merge: true })
      ]);
      if (nextSettings.logoImage?.startsWith('data:image')) {
        await saveMediaAssetToCloud('media_logo', nextSettings.logoImage);
      }
      if (nextSettings.heroBgImage?.startsWith('data:image')) {
        await saveMediaAssetToCloud('media_hero_bg', nextSettings.heroBgImage);
      }
      if (Array.isArray(nextSettings.categories)) {
        for (const cat of nextSettings.categories) {
          if (cat.coverImage?.startsWith('data:image')) {
            await saveMediaAssetToCloud(`media_cat_${cat.id}`, cat.coverImage);
          }
        }
      }
    } catch (err) {
      if (!isOfficialGoogleAdmin) {
        showToast('تنبيه: اضغط زر "ربط حساب جوجل للإدارة" لحفظ التعديلات في السحابة للعملاء', 'error');
      } else {
        showToast(`تعذر الحفظ في السحابة: ${err?.message || ''}`, 'error');
      }
    }
  };

  const saveProductToCloud = async (prod) => {
    const { db } = firebaseServices;
    if (!db) return;
    const basePath = ['artifacts', 'el3bakera-edu', 'public', 'data'];
    const { coverImage, sampleImages, ...meta } = prod;
    await setDoc(doc(db, ...basePath, 'notebooks', prod.id), meta, { merge: true });
    if (coverImage?.startsWith('data:image')) {
      await saveMediaAssetToCloud(`media_prod_cover_${prod.id}`, coverImage);
    }
    const samples = Array.isArray(sampleImages) ? sampleImages.slice(0, 25) : [];
    for (let i = 0; i < samples.length; i++) {
      if (samples[i]?.startsWith('data:image')) {
        await saveMediaAssetToCloud(`media_prod_sample_${prod.id}_${i}`, samples[i]);
      }
    }
    for (let j = samples.length; j < 25; j++) {
      try {
        await deleteDoc(doc(db, ...basePath, 'config', `media_prod_sample_${prod.id}_${j}`));
      } catch {}
    }
  };

  const handlePublishAllToCloud = async () => {
    if (!isOfficialGoogleAdmin) {
      showToast('يجب ربط حساب جوجل للإدارة أولاً ليسمح Firebase بنشر التعديلات للعملاء', 'error');
      return;
    }
    setIsSyncingCloud(true);
    try {
      await saveSettings(settings);
      const localProds = await idbGet('products_v6');
      const listToPublish =
        Array.isArray(localProds) && localProds.length > 0 ? localProds : products;
      for (let i = 0; i < listToPublish.length; i++) {
        showToast(`جاري رفع المذكرة (${i + 1}/${listToPublish.length}): ${listToPublish[i].title}`);
        await saveProductToCloud(listToPublish[i]);
      }
      const { db } = firebaseServices;
      const basePath = ['artifacts', 'el3bakera-edu', 'public', 'data'];
      for (const b of bundles) {
        await setDoc(doc(db, ...basePath, 'bundles', b.id), b, { merge: true });
      }
      for (const c of coupons) {
        await setDoc(doc(db, ...basePath, 'coupons', c.id), c, { merge: true });
      }
      showToast('تم حفظ ونشر جميع التعديلات والصور للعملاء بنجاح 100%!');
    } catch (err) {
      showToast(`خطأ أثناء النشر: ${err?.message || ''}`, 'error');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleForcePullFromCloud = async () => {
    const { db } = firebaseServices;
    if (!db) return;
    setIsSyncingCloud(true);
    try {
      const basePath = ['artifacts', 'el3bakera-edu', 'public', 'data'];
      const [configSnap, prodsSnap, bundlesSnap, couponsSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, ...basePath, 'config')),
        getDocs(collection(db, ...basePath, 'notebooks')),
        getDocs(collection(db, ...basePath, 'bundles')),
        getDocs(collection(db, ...basePath, 'coupons')),
        getDoc(doc(db, ...basePath, 'settings', 'main'))
      ]);

      const mediaMap = {};
      configSnap.docs.forEach((d) => {
        if (d.id.startsWith('media_')) {
          const data = d.data();
          if (data?.dataUrl) mediaMap[d.id] = data.dataUrl;
        }
      });

      if (settingsSnap.exists()) {
        const sData = settingsSnap.data();
        const mergedSettings = {
          ...settings,
          ...sData,
          logoImage: mediaMap.media_logo || settings.logoImage,
          heroBgImage: mediaMap.media_hero_bg || settings.heroBgImage
        };
        setSettings(mergedSettings);
        await idbSet('settings_v7', mergedSettings);
      }

      if (!prodsSnap.empty) {
        const pulledProds = prodsSnap.docs.map((d) => {
          const p = { id: d.id, ...d.data() };
          const samples = [];
          for (let i = 0; i < 25; i++) {
            const key = `media_prod_sample_${p.id}_${i}`;
            if (mediaMap[key]) samples.push(mediaMap[key]);
          }
          return {
            ...p,
            coverImage: mediaMap[`media_prod_cover_${p.id}`] || p.coverImage || '',
            sampleImages: samples.length > 0 ? samples : p.sampleImages || []
          };
        });
        setProducts(pulledProds);
        await idbSet('products_v6', pulledProds);
      }

      if (!bundlesSnap.empty) {
        const pulledBundles = bundlesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBundles(pulledBundles);
        await idbSet('bundles_v6', pulledBundles);
      }

      if (!couponsSnap.empty) {
        const pulledCoupons = couponsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCoupons(pulledCoupons);
        await idbSet('coupons_v6', pulledCoupons);
      }

      showToast('تم سحب وتحديث كافة البيانات والصور من السحابة بنجاح!');
    } catch (err) {
      showToast(`تعذر السحب من السحابة: ${err?.message || ''}`, 'error');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleDownloadBackupFile = async () => {
    try {
      showToast('جاري تجهيز ملف النسخة الاحتياطية الكاملة...');
      const [dbSettings, dbProducts, dbBundles, dbCoupons] = await Promise.all([
        idbGet('settings_v7'),
        idbGet('products_v6'),
        idbGet('bundles_v6'),
        idbGet('coupons_v6')
      ]);
      const payloadObj = {
        exportedAt: new Date().toISOString(),
        settings: dbSettings || settings,
        products: Array.isArray(dbProducts) && dbProducts.length > 0 ? dbProducts : products,
        bundles: Array.isArray(dbBundles) && dbBundles.length > 0 ? dbBundles : bundles,
        coupons: Array.isArray(dbCoupons) && dbCoupons.length > 0 ? dbCoupons : coupons
      };
      const jsonStr = JSON.stringify(payloadObj);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `el3bakera_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('تم تحميل ملف النسخة الاحتياطية على جهازك بنجاح');
    } catch {
      showToast('حدث خطأ أثناء تجهيز ملف النسخة الاحتياطية', 'error');
    }
  };

  // تحميل صور العينات الداخلية لمذكرة محددة عند فتح المعاينة فقط (لتسريع المنصة 10 أضعاف)
  const loadProductSamplesOnDemand = async (prod) => {
    setPreviewProduct(prod);
    setActiveSampleIdx(0);
    if (!prod || (Array.isArray(prod.sampleImages) && prod.sampleImages.length > 0)) return;
    const { db } = firebaseServices;
    if (!db) return;
    try {
      const basePath = ['artifacts', 'el3bakera-edu', 'public', 'data'];
      // فحص مجموعة notebook_samples أولاً
      const legacySnap = await getDoc(doc(db, ...basePath, 'notebook_samples', prod.id)).catch(() => null);
      if (legacySnap && legacySnap.exists()) {
        const imgs = legacySnap.data()?.sampleImages || legacySnap.data()?.images || [];
        if (imgs.length > 0) {
          setPreviewProduct((prev) => (prev && prev.id === prod.id ? { ...prev, sampleImages: imgs } : prev));
          setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, sampleImages: imgs } : p)));
          return;
        }
      }
      // جلب العينات الفردية
      const sampleSnaps = await Promise.all(
        Array.from({ length: 15 }, (_, idx) =>
          getDoc(doc(db, ...basePath, 'config', `media_prod_sample_${prod.id}_${idx}`)).catch(() => null)
        )
      );
      const loadedImgs = sampleSnaps
        .filter((s) => s && s.exists() && s.data()?.dataUrl)
        .map((s) => s.data().dataUrl);
      if (loadedImgs.length > 0) {
        setPreviewProduct((prev) => (prev && prev.id === prod.id ? { ...prev, sampleImages: loadedImgs } : prev));
        setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, sampleImages: loadedImgs } : p)));
      }
    } catch {}
  };

  // ==========================================
  // 8. إدارة السلة والخصومات والعروض المتعددة
  // ==========================================
  useEffect(() => {
    try {
      localStorage.setItem('el3bakera_cart_v2', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const addToCart = (item, type = 'notebook') => {
    setCart((prev) => {
      if (prev.some((x) => x.id === item.id)) {
        showToast('هذا العنصر مضاف بالفعل في سلة الطلبات', 'error');
        return prev;
      }
      showToast(`تمت إضافة "${safeText(item.title)}" إلى السلة`);
      return [
        ...prev,
        {
          id: item.id,
          type,
          title: safeText(item.title),
          price: Number(item.price || 0),
          coverImage: item.coverImage || ''
        }
      ];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((x) => x.id !== id));
  };

  const safeMultiOffers = useMemo(
    () => normalizeItems(settings.multiOffers, DEFAULT_MULTI_OFFERS),
    [settings.multiOffers]
  );

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);

    // العناصر المسموح بتطبيق كوبون الخصم عليها (تُستثنى الباقات إلا إذا سمح المدير بذلك للباقة)
    const couponEligibleSubtotal = cart.reduce((sum, item) => {
      if (item.type === 'bundle') {
        const bndObj = bundles.find((b) => b.id === item.id);
        const isAllowed = bndObj ? Boolean(bndObj.allowCoupon) : Boolean(item.allowCoupon);
        return isAllowed ? sum + Number(item.price || 0) : sum;
      }
      return sum + Number(item.price || 0);
    }, 0);

    // حساب أفضل عرض من عروض الحصول على أكثر من مذكرة
    let bestOfferDiscount = 0;
    let bestOfferTitle = '';
    let bestOfferAllowStacking = false;

    for (const offer of safeMultiOffers) {
      if (offer.active === false) continue;
      const targetIds = Array.isArray(offer.productIds) ? offer.productIds : [];
      const matchingItems =
        targetIds.length === 0
          ? cart
          : cart.filter((cItem) => targetIds.includes(cItem.id));

      if (matchingItems.length >= Number(offer.minItems || 2)) {
        const eligibleSum = matchingItems.reduce((s, x) => s + Number(x.price || 0), 0);
        const type = offer.discountType || 'percent';
        const val = Number(offer.discountValue ?? offer.discountPercent ?? 0);
        let calculatedOffer = 0;

        if (type === 'fixed') {
          calculatedOffer = Math.min(val, eligibleSum);
        } else {
          const rawOffer = Math.round((eligibleSum * val) / 100);
          calculatedOffer = offer.maxDiscount
            ? Math.min(rawOffer, Number(offer.maxDiscount))
            : rawOffer;
        }

        if (calculatedOffer > bestOfferDiscount) {
          bestOfferDiscount = calculatedOffer;
          bestOfferAllowStacking = Boolean(offer.allowCouponStacking);
          bestOfferTitle =
            type === 'fixed'
              ? `${safeText(offer.title, 'عرض التجميع')} (خصم ${val} ج.م)`
              : `${safeText(offer.title, 'عرض التجميع')} (${val}%)`;
        }
      }
    }

    // حساب خصم الكوبون إن وُجد (مع قراءة كافة مسميات الحقل الممكنة)
    let couponDiscount = 0;
    const couponPct = Number(
      appliedCoupon?.discountPercent ?? appliedCoupon?.discount ?? appliedCoupon?.value ?? 0
    );
    if (appliedCoupon && couponEligibleSubtotal > 0 && couponPct > 0) {
      couponDiscount = Math.round((couponEligibleSubtotal * couponPct) / 100);
    }

    // منطق دمج أو مقارنة الخصم بين الكوبون وعرض أكثر من مذكرة
    let finalDiscount = 0;
    let discountReason = '';

    if (bestOfferDiscount > 0 && couponDiscount > 0) {
      if (bestOfferAllowStacking) {
        finalDiscount = Math.min(subtotal, bestOfferDiscount + couponDiscount);
        discountReason = `${bestOfferTitle} + كوبون (${appliedCoupon.code} - ${couponPct}%)`;
      } else if (couponDiscount >= bestOfferDiscount) {
        finalDiscount = couponDiscount;
        discountReason = `كوبون خصم (${appliedCoupon.code} - ${couponPct}%)`;
      } else {
        finalDiscount = bestOfferDiscount;
        discountReason = bestOfferTitle;
      }
    } else if (couponDiscount > 0) {
      finalDiscount = couponDiscount;
      discountReason = `كوبون خصم (${appliedCoupon.code} - ${couponPct}%)`;
    } else if (bestOfferDiscount > 0) {
      finalDiscount = bestOfferDiscount;
      discountReason = bestOfferTitle;
    }

    const total = Math.max(0, subtotal - finalDiscount);
    return {
      subtotal,
      couponEligibleSubtotal,
      couponDiscount,
      bestOfferDiscount,
      finalDiscount,
      discountReason,
      total
    };
  }, [cart, bundles, safeMultiOffers, appliedCoupon]);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = coupons.find((c) => safeText(c.code).toUpperCase() === code && c.active !== false);
    if (!found) {
      showToast('كود الكوبون غير صالح أو منتهي الصلاحية', 'error');
      return;
    }
    if (found.maxUses && Number(found.usedCount || 0) >= Number(found.maxUses)) {
      showToast('تم استنفاد الحد الأقصى لاستخدام هذا الكوبون', 'error');
      return;
    }
    const eligibleSum = cart.reduce((sum, item) => {
      if (item.type === 'bundle') {
        const bndObj = bundles.find((b) => b.id === item.id);
        const isAllowed = bndObj ? Boolean(bndObj.allowCoupon) : Boolean(item.allowCoupon);
        return isAllowed ? sum + Number(item.price || 0) : sum;
      }
      return sum + Number(item.price || 0);
    }, 0);

    if (eligibleSum <= 0) {
      showToast('الباقات المخفضة في السلة مستثناة من كوبونات الخصم الإضافية', 'error');
      return;
    }

    const pct = Number(found.discountPercent ?? found.discount ?? found.value ?? 15);
    const normalizedCoupon = { ...found, discountPercent: pct };
    setAppliedCoupon(normalizedCoupon);
    showToast(`تم تطبيق كوبون الخصم (${normalizedCoupon.code}) بنسبة ${pct}%`);
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (isSubmittingOrder) return;
    if (cart.length === 0) {
      showToast('سلة الطلبات فارغة', 'error');
      return;
    }
    if (!customerForm.teacherName.trim() || !customerForm.phone1.trim()) {
      showToast('يرجى إدخال اسم المعلم ورقم الهاتف الأساسي', 'error');
      return;
    }
    if (
      customerForm.hasLogo === 'رفع صورة الشعار الآن بالجودة الكاملة' &&
      !customerForm.logoDataUrl
    ) {
      showToast('يرجى اختيار ملف صورة الشعار أولاً أو تغيير خيار الشعار', 'error');
      return;
    }
    if (
      customerForm.hasLogo === 'كتابة نص الشعار' &&
      !customerForm.logoText.trim()
    ) {
      showToast('يرجى كتابة نص الشعار المطلوب وضعه على المذكرة', 'error');
      return;
    }

    setIsSubmittingOrder(true);
    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      id: orderId,
      teacherName: customerForm.teacherName.trim(),
      phone1: customerForm.phone1.trim(),
      seriesName: customerForm.seriesName.trim(),
      phone2: customerForm.phone2.trim(),
      hasLogo: customerForm.hasLogo,
      logoText: customerForm.hasLogo === 'كتابة نص الشعار' ? customerForm.logoText.trim() : '',
      logoFileName: customerForm.logoFileName || '',
      logoDataUrl: customerForm.logoDataUrl || '',
      notes: customerForm.notes.trim(),
      items: cart.map((x) => ({ id: x.id, title: x.title, price: x.price })),
      subtotal: cartTotals.subtotal,
      discount: cartTotals.finalDiscount,
      discountReason: cartTotals.discountReason,
      total: cartTotals.total,
      status: 'قيد المراجعة والتجهيز',
      createdAtMs: Date.now(),
      createdAtStr: new Date().toLocaleString('ar-EG')
    };

    const itemsLines = cart.map((i, idx) => `${idx + 1}. ${i.title} (${i.price} ج.م)`).join('\n');
    const logoSummary =
      newOrder.hasLogo === 'كتابة نص الشعار'
        ? `نص الشعار: "${newOrder.logoText}"`
        : `${newOrder.hasLogo}${newOrder.logoFileName ? ` (مرفق: ${newOrder.logoFileName})` : ''}`;

    const msg = [
      `السلام عليكم، طلب تخصيص مذكرات جديد من *${safeText(settings.platformName)}*`,
      `رقم الطلب: *${orderId}*`,
      `------------------------`,
      `👤 اسم المعلم: *${newOrder.teacherName}*`,
      `📱 رقم الهاتف: *${newOrder.phone1}*`,
      newOrder.seriesName ? `📚 اسم السلسلة: *${newOrder.seriesName}*` : '',
      newOrder.phone2 ? `📞 هاتف إضافي: *${newOrder.phone2}*` : '',
      `🎨 الشعار الخاص: *${logoSummary}*`,
      newOrder.notes ? `📝 ملاحظات: ${newOrder.notes}` : '',
      `------------------------`,
      `📦 *المذكرات المطلوبة:*`,
      itemsLines,
      `------------------------`,
      `الإجمالي قبل الخصم: ${cartTotals.subtotal} ج.م`,
      cartTotals.finalDiscount > 0 ? `الخصم (${cartTotals.discountReason}): -${cartTotals.finalDiscount} ج.م` : '',
      `💰 *المطلوب سداده: ${cartTotals.total} ج.م*`,
      `💳 التحويل على فودافون كاش / إنستاباي: *${safeText(settings.vodafoneCashNumber)}*`
    ]
      .filter(Boolean)
      .join('\n');

    const waUrl = `https://wa.me/${safeText(settings.whatsappNumber, '201068481536').replace(
      /\D/g,
      ''
    )}?text=${encodeURIComponent(msg)}`;

    // فتح نافذة الواتساب فوراً داخل حدث النقر حتى لا يحظرها متصفح الهاتف
    let waWin = null;
    try {
      waWin = window.open(waUrl, '_blank');
    } catch {}

    let savedToCloud = false;
    try {
      const { db, auth } = firebaseServices;
      if (auth && !auth.currentUser) {
        await signInAnonymously(auth);
      }
      if (db) {
        const basePath = ['artifacts', 'el3bakera-edu', 'public', 'data'];
        const { logoDataUrl, ...orderMeta } = newOrder;
        const chunkSize = 450000;
        const chunks = [];
        if (logoDataUrl) {
          for (let i = 0; i < logoDataUrl.length; i += chunkSize) {
            chunks.push(logoDataUrl.slice(i, i + chunkSize));
          }
        }
        await setDoc(doc(db, ...basePath, 'orders', orderId), {
          ...orderMeta,
          hasUploadedLogo: chunks.length > 0,
          logoChunksCount: chunks.length,
          logoDataUrl: chunks.length === 1 ? chunks[0] : ''
        });
        if (chunks.length > 1) {
          for (let idx = 0; idx < chunks.length; idx++) {
            await setDoc(doc(db, ...basePath, 'orders', `${orderId}_logo_${idx}`), {
              orderId,
              chunkIndex: idx,
              dataUrl: chunks[idx],
              updatedAt: serverTimestamp()
            });
          }
        }
        savedToCloud = true;
      }
    } catch (err) {
      showToast('تعذر حفظ الطلب في السحابة تلقائياً، سيتم إرساله عبر واتساب مباشرة', 'error');
    }

    setOrders((prev) => [newOrder, ...prev]);

    setCart([]);
    setAppliedCoupon(null);
    setCustomerForm({
      teacherName: '',
      phone1: '',
      seriesName: '',
      phone2: '',
      hasLogo: 'سأرسله على واتساب',
      logoText: '',
      logoFileName: '',
      logoDataUrl: '',
      notes: ''
    });
    setIsCartOpen(false);
    setIsSubmittingOrder(false);

    if (!waWin || waWin.closed || typeof waWin.closed === 'undefined') {
      window.location.href = waUrl;
    } else if (savedToCloud) {
      showToast(`تم تسجيل طلبك رقم ${orderId} وإرساله للإدارة وواتساب!`);
    }
  };

  const handleSampleMouseDown = (e) => {
    mouseStartXRef.current = e.clientX;
  };

  const handleSampleMouseUp = (e) => {
    if (mouseStartXRef.current === null) return;
    const deltaX = e.clientX - mouseStartXRef.current;
    mouseStartXRef.current = null;
    if (Math.abs(deltaX) > 45) {
      if (deltaX > 0) goNextSample();
      else goPrevSample();
    }
  };

  // ==========================================
  // 10. حالات نماذج لوحة الإدارة
  // ==========================================
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    title: '',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_m3',
    categoryId: 'cat_final_rev',
    pagesCount: 80,
    price: 149,
    originalPrice: 200,
    goldRibbon: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
    tipText: '',
    driveSampleUrl: 'https://drive.google.com/',
    description: '',
    coverImage: '',
    sampleImages: [],
    hidden: false
  });

  const [editingBundleId, setEditingBundleId] = useState(null);
  const [bundleForm, setBundleForm] = useState({
    title: '',
    description: '',
    price: 499,
    originalPrice: 650,
    badge: 'وفر 150 ج.م',
    driveSampleUrl: 'https://drive.google.com/',
    allowCoupon: false,
    productIds: []
  });

  const [editingMultiOfferId, setEditingMultiOfferId] = useState(null);
  const [multiOfferForm, setMultiOfferForm] = useState({
    title: '',
    subtitle: '',
    badgeText: 'وفر 15% تلقائياً',
    minItems: 2,
    discountType: 'percent',
    discountValue: 15,
    discountPercent: 15,
    maxDiscount: 150,
    allowCouponStacking: false,
    productIds: [],
    bgColor: '#0f172a',
    textColor: '#ffffff',
    active: true
  });

  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    discountPercent: 15,
    maxUses: 100
  });

  const [newStageName, setNewStageName] = useState('');
  const [newGradeForm, setNewGradeForm] = useState({ stageId: 'stg_prep', name: '' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSocialForm, setNewSocialForm] = useState({ label: '', url: '' });
  const [newUpcomingForm, setNewUpcomingForm] = useState({
    title: '',
    stageName: 'المرحلة الإعدادية',
    statusText: 'جاري التجهيز والتنسيق',
    expectedDate: 'قريباً'
  });
  const [newTestimonialForm, setNewTestimonialForm] = useState({
    author: '',
    text: '',
    image: ''
  });
  const [jsonBackupText, setJsonBackupText] = useState('');

  // المذكرات المرئية للعملاء والمفلترة
  const visibleProducts = useMemo(
    () => products.filter((p) => !p.hidden),
    [products]
  );

  const homeDisplayedProducts = useMemo(() => {
    if (settings.homeProductsMode === 'custom' && Array.isArray(settings.homeSelectedProductIds)) {
      const selected = settings.homeSelectedProductIds
        .map((id) => visibleProducts.find((p) => p.id === id))
        .filter(Boolean);
      if (selected.length > 0) return selected;
    }
    return visibleProducts.slice(0, Number(settings.homeMaxProducts || 6));
  }, [visibleProducts, settings.homeProductsMode, settings.homeSelectedProductIds, settings.homeMaxProducts]);

  const filteredProducts = useMemo(() => {
    return visibleProducts.filter((p) => {
      if (selectedStageId !== 'all' && p.stageId !== selectedStageId) return false;
      if (selectedGradeId !== 'all' && p.gradeId !== selectedGradeId) return false;
      if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${safeText(p.title)} ${safeText(p.description)} ${safeText(p.subject)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visibleProducts, selectedStageId, selectedGradeId, selectedCategoryId, searchQuery]);

  const copyPromoCode = () => {
    const code = safeText(settings.promoCouponCode);
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    showToast(`تم نسخ كود الخصم (${code})`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // مكون شارة الخصم
  const renderDiscountBadge = (price, originalPrice) => {
    const badgeCfg = settings.discountBadge || DEFAULT_SETTINGS.discountBadge;
    if (!badgeCfg.enabled) return null;
    const p = Number(price || 0);
    const orig = Number(originalPrice || 0);
    if (orig <= p || orig <= 0) return null;
    const saved = orig - p;
    const pct = Math.round((saved / orig) * 100);
    const parts = [];
    if (badgeCfg.showPercentage) parts.push(`خصم ${pct}%`);
    if (badgeCfg.showSavedAmount) parts.push(`وفر ${saved} ج.م`);
    if (parts.length === 0) return null;

    const posClass =
      badgeCfg.position === 'top-left'
        ? 'top-3 left-3'
        : badgeCfg.position === 'bottom-right'
        ? 'bottom-3 right-3'
        : badgeCfg.position === 'bottom-left'
        ? 'bottom-3 left-3'
        : 'top-3 right-3';

    return (
      <span
        style={{
          backgroundColor: badgeCfg.bgColor || '#059669',
          color: badgeCfg.textColor || '#ffffff'
        }}
        className={`absolute ${posClass} px-3 py-1 rounded-xl text-[11px] font-black shadow-lg z-10`}
      >
        {parts.join(' • ')}
      </span>
    );
  };

  // مكون بطاقة المذكرة
  const renderProductCard = (prod) => {
    const stageObj = settings.stages.find((s) => s.id === prod.stageId);
    const gradeObj = settings.grades.find((g) => g.id === prod.gradeId);
    const noticeStyle = settings.productNoticeStyle || DEFAULT_SETTINGS.productNoticeStyle;
    const showCardTip = noticeStyle.showOnCard !== false && safeText(prod.tipText).trim().length > 0;

    return (
      <div
        key={prod.id}
        className="group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
      >
        {/* صورة الغلاف */}
      <div
        onClick={() => loadProductSamplesOnDemand(prod)}
        className="relative h-56 bg-slate-900 overflow-hidden cursor-pointer"
      >
        <img
          src={prod.coverImage || makeCoverSvg(prod.title, '', '#1e293b', '#2563eb')}
          alt={safeText(prod.title)}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {renderDiscountBadge(prod.price, prod.originalPrice)}
          {Array.isArray(prod.sampleImages) && prod.sampleImages.length > 0 && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-black flex items-center gap-1">
              <Eye className="w-3 h-3 text-amber-400" />
              <span>{prod.sampleImages.length} صفحات عينة</span>
            </span>
          )}
        </div>

        {/* الشريط الذهبي */}
        {safeText(prod.goldRibbon).trim() && (
          <div className="bg-gradient-to-l from-amber-400 via-amber-300 to-yellow-300 text-slate-950 px-4 py-1.5 text-[11px] font-black flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{safeText(prod.goldRibbon)}</span>
          </div>
        )}

        {/* تفاصيل المذكرة */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black">
              {stageObj && (
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700">{stageObj.name}</span>
              )}
              {gradeObj && (
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700">{gradeObj.name}</span>
              )}
              {Number(prod.pagesCount) > 0 && (
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700">
                  {prod.pagesCount} صفحة
                </span>
              )}
            </div>

            <h3
              onClick={() => loadProductSamplesOnDemand(prod)}
              className="text-base font-black text-slate-900 leading-snug hover:text-blue-600 transition cursor-pointer"
            >
              {safeText(prod.title)}
            </h3>

            <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
              {safeText(prod.description)}
            </p>

            {/* صندوق التنبيه الخاص بالمذكرة (منفصل ومستقل) */}
            {showCardTip && (
              <div
                style={{
                  backgroundColor: noticeStyle.bgColor || '#eff6ff',
                  color: noticeStyle.textColor || '#1e3a8a'
                }}
                className="p-2.5 rounded-xl text-[11px] font-bold leading-relaxed border border-black/5"
              >
                {safeText(prod.tipText)}
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            {/* زر Google Drive القابل لتخصيص اللون */}
            {safeText(prod.driveSampleUrl).trim() && (
              <a
                href={safeText(prod.driveSampleUrl)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: safeText(settings.driveButtonBgColor, '#ecfdf5'),
                  color: safeText(settings.driveButtonTextColor, '#047857')
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border border-black/5 hover:opacity-90 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>{safeText(settings.driveButtonLabel, 'معاينة عينة Google Drive')}</span>
              </a>
            )}

            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-blue-600">{prod.price} ج.م</span>
                  {Number(prod.originalPrice) > Number(prod.price) && (
                    <span className="text-xs text-slate-400 line-through font-bold">
                      {prod.originalPrice} ج.م
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => loadProductSamplesOnDemand(prod)}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition cursor-pointer flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>العينات</span>
                </button>
                <button
                  onClick={() => addToCart(prod, 'notebook')}
                  className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition cursor-pointer flex items-center gap-1"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>اطلبها</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const resolvedLogo =
    settings.logoImage && settings.logoImage.startsWith('data:image')
      ? settings.logoImage
      : DEFAULT_LOGO_SVG;

  const activeMultiOffers = safeMultiOffers.filter((o) => o.active !== false);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden flex flex-col">
      {/* إشعار Toast عائم */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 left-5 sm:left-auto z-[90] px-5 py-3.5 rounded-2xl shadow-2xl text-white text-xs font-black flex items-center gap-2.5 transition-all ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900 border border-slate-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ==========================================
          الشريط العلوي المثبت دائماً أعلى الشاشة
      ========================================== */}
      <div className="fixed top-0 inset-x-0 z-40 w-full">
        {settings.promoEnabled && (
          <div
            style={{
              backgroundColor: safeText(settings.promoBgColor, '#0654d0'),
              color: safeText(settings.promoTextColor, '#fde047')
            }}
            className="w-full py-1.5 px-3 text-center text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[70vw] sm:max-w-none">{safeText(settings.promoText)}</span>
            {settings.promoCouponCode && (
              <button
                onClick={copyPromoCode}
                className="inline-flex items-center gap-1 bg-amber-300 text-slate-950 px-2.5 py-0.5 rounded-md font-black text-[10px] hover:bg-amber-200 transition cursor-pointer shrink-0 shadow-2xs"
                title="اضغط لنسخ الكود"
              >
                <span>{safeText(settings.promoCouponCode)}</span>
                {copiedCode ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
            )}
          </div>
        )}

        <header className="w-full bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.08)]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-[70px] flex items-center justify-between gap-3">
            {/* الشعار واسم المنصة */}
            <div
              onClick={handleLogoSecretTap}
              className="flex items-center gap-3 cursor-pointer select-none min-w-0 group"
            >
              <div className="relative shrink-0">
                <img
                  src={resolvedLogo}
                  alt={safeText(settings.platformName)}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover shadow-sm border border-slate-200 group-hover:scale-105 transition-transform"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate group-hover:text-blue-700 transition">
                  {safeText(settings.platformName)}
                </h1>
                <p className="text-[11px] text-slate-500 font-semibold hidden sm:block truncate mt-0.5">
                  {safeText(settings.platformTagline)}
                </p>
              </div>
            </div>

            {/* قائمة التنقل للكمبيوتر */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70">
              {[
                { id: 'home', label: 'الرئيسية', icon: Sparkles },
                { id: 'library', label: 'المذكرات', icon: BookOpen },
                { id: 'bundles', label: 'العروض والباقات', icon: Package },
                { id: 'track', label: 'تتبع طلبك', icon: Truck }
              ].map((navItem) => {
                const NavIcon = navItem.icon;
                const isActive = activeTab === navItem.id;
                return (
                  <button
                    key={navItem.id}
                    onClick={() => navigateToTab(navItem.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    <NavIcon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                    <span>{navItem.label}</span>
                  </button>
                );
              })}

              {isAdminAuthenticated && (
                <div className="flex items-center gap-1 pr-1 mr-1 border-r border-slate-300">
                  <button
                    onClick={() => navigateToTab('admin')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                      activeTab === 'admin'
                        ? 'bg-slate-900 text-amber-400 shadow-sm'
                        : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>الإدارة</span>
                  </button>
                  <button
                    onClick={handleAdminLogout}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                    title="تسجيل خروج من الإدارة"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </nav>

            {/* أزرار التواصل والسلة */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black transition cursor-pointer"
                title="تواصل معنا"
              >
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3.5 h-3.5" />
                </span>
                <span className="hidden sm:inline">تواصل معنا</span>
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-sm transition cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 text-amber-400 shrink-0" />
                <span>السلة</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {cart.length}
                </span>
              </button>
            </div>
          </div>

          {/* شريط تنقل سفلي داخل الهيدر للهواتف والأجهزة اللوحية */}
          <div className="flex lg:hidden items-center justify-around border-t border-slate-100 py-1.5 px-2 gap-1 bg-slate-50/95">
            {[
              { id: 'home', label: 'الرئيسية', icon: Sparkles },
              { id: 'library', label: 'المذكرات', icon: BookOpen },
              { id: 'bundles', label: 'العروض', icon: Package },
              { id: 'track', label: 'تتبع طلبك', icon: Truck }
            ].map((navItem) => {
              const NavIcon = navItem.icon;
              const isActive = activeTab === navItem.id;
              return (
                <button
                  key={navItem.id}
                  onClick={() => navigateToTab(navItem.id)}
                  className={`flex-1 py-1.5 px-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <NavIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span className="truncate">{navItem.label}</span>
                </button>
              );
            })}
            {isAdminAuthenticated && (
              <button
                onClick={() => navigateToTab('admin')}
                className={`py-1.5 px-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shrink-0 ${
                  activeTab === 'admin' ? 'bg-slate-900 text-amber-400' : 'bg-amber-100 text-amber-950'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>الإدارة</span>
              </button>
            )}
          </div>
        </header>
      </div>

      {/* مسافة تعويضية دقيقة لارتفاع الشريط العلوي المثبت */}
      <div className={settings.promoEnabled ? 'h-[132px] lg:h-[104px]' : 'h-[104px] lg:h-[74px]'} />

      {/* زر الرجوع للخلف عند التصفح */}
      {activeTab !== 'home' && (
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4">
          <button
            onClick={handleGoBack}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleGoBack();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-black shadow-2xs hover:bg-slate-100 active:scale-95 transition cursor-pointer touch-manipulation"
          >
            <ChevronRight className="w-4 h-4 text-blue-600" />
            <span>رجوع للخلف</span>
          </button>
        </div>
      )}

      {/* ==========================================
          المحتوى الرئيسي للصفحات
      ========================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* ------------------------------------------
            1. الصفحة الرئيسية (HOME)
        ------------------------------------------ */}
        {activeTab === 'home' && (
          <>
            {/* واجهة البطل (Hero Section) */}
            <section className="relative rounded-[2rem] overflow-hidden bg-slate-900 text-white shadow-2xl border border-slate-800">
              {settings.heroBgImage && (
                <img
                  src={settings.heroBgImage}
                  alt="خلفية المنصة"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div
                style={{
                  backgroundColor: `rgba(15, 23, 42, ${Number(settings.heroOverlayOpacity ?? 82) / 100})`
                }}
                className="absolute inset-0 bg-gradient-to-bl from-slate-950/90 via-blue-950/80 to-slate-900/95"
              />

              <div className="relative z-10 p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{safeText(settings.heroBadge)}</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-black leading-[1.25] tracking-tight text-white">
                    {safeText(settings.heroTitle)}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-2xl">
                    {safeText(settings.heroSubtitle)}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => navigateToTab('library')}
                      className="px-6 py-4 rounded-2xl bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition cursor-pointer flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>استعراض جميع المذكرات</span>
                    </button>

                    <button
                      onClick={() => navigateToTab('bundles')}
                      className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-black text-sm transition cursor-pointer flex items-center gap-2"
                    >
                      <Package className="w-4 h-4 text-amber-400" />
                      <span>باقات التوفير والعروض</span>
                    </button>
                  </div>

                  {/* بطاقات الإحصائيات المطورة */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-3">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-base sm:text-xl font-black text-white">+50</div>
                        <div className="text-[10px] sm:text-xs text-slate-300 font-bold truncate">
                          مذكرة وبنك أسئلة
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-base sm:text-xl font-black text-white">+500</div>
                        <div className="text-[10px] sm:text-xs text-slate-300 font-bold truncate">
                          معلم يثق بنا
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md">
                        <ShieldCheck className="w-5 h-5 text-slate-950" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-base sm:text-xl font-black text-amber-300">100%</div>
                        <div className="text-[10px] sm:text-xs text-slate-300 font-bold truncate">
                          تخصيص باسمك وشعارك
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* بطاقة الثقة للمعلمين */}
                <div className="lg:col-span-5">
                  <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 space-y-5 shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">لماذا يثق بنا المعلمون؟</h3>
                        <p className="text-xs text-slate-300 font-medium">جودة طباعة وهوية مخصصة بالكامل</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {normalizeItems(settings.trustPoints, DEFAULT_SETTINGS.trustPoints).map((tp, idx) => (
                        <div
                          key={tp.id || idx}
                          className="p-3.5 rounded-2xl bg-slate-950/40 border border-white/10 flex items-start gap-3"
                        >
                          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white">{safeText(tp.title)}</h4>
                            <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-relaxed">
                              {safeText(tp.desc || tp.subtitle)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* عروض الحصول على أكثر من مذكرة */}
            {activeMultiOffers.length > 0 && (
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMultiOffers.map((offer) => (
                  <div
                    key={offer.id}
                    style={{
                      backgroundColor: offer.bgColor || '#0f172a',
                      color: offer.textColor || '#ffffff'
                    }}
                    className="rounded-3xl p-6 shadow-lg border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      {offer.badgeText && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
                          <Sparkles className="w-3 h-3" />
                          <span>{safeText(offer.badgeText)}</span>
                        </span>
                      )}
                      <h3 className="text-lg font-black leading-snug">{safeText(offer.title)}</h3>
                      <p className="text-xs opacity-85 font-medium leading-relaxed">
                        {safeText(offer.subtitle)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigateToTab('library')}
                      className="px-5 py-3 rounded-2xl bg-white text-slate-950 font-black text-xs hover:bg-amber-300 transition cursor-pointer shrink-0 shadow-md"
                    >
                      اختر مذكراتك الآن
                    </button>
                  </div>
                ))}
              </section>
            )}

            {/* الأقسام الدراسية */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">الأقسام الدراسية</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    تصفح المذكرات وبنوك الأسئلة حسب القسم الدراسي
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {settings.categories.map((cat) => {
                  const count = visibleProducts.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSelectedStageId('all');
                        setSelectedGradeId('all');
                        navigateToTab('library');
                      }}
                      className="group relative h-48 rounded-3xl overflow-hidden bg-slate-900 shadow-md hover:shadow-xl transition cursor-pointer border border-slate-200"
                    >
                      <img
                        src={cat.coverImage || makeCoverSvg(cat.name, '', '#1e3a8a', '#2563eb')}
                        alt={safeText(cat.name)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                      <div className="absolute bottom-4 right-4 left-4 flex items-end justify-between text-white">
                        <div>
                          <h3 className="text-base font-black">{safeText(cat.name)}</h3>
                          <span className="text-[11px] text-amber-300 font-bold">
                            {count} مذكرة متاحة
                          </span>
                        </div>
                        <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center group-hover:bg-blue-600 transition">
                          <ChevronLeft className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* المذكرات المعروضة على الشاشة الرئيسية */}
            <section className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {safeText(settings.homeProductsTitle, 'أحدث المذكرات المضافة')}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    {safeText(
                      settings.homeProductsSubtitle,
                      'اختر المذكرة المناسبة لطلابك واطلبها مخصصة باسمك وشعارك'
                    )}
                  </p>
                </div>
                <button
                  onClick={() => navigateToTab('library')}
                  className="px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black transition cursor-pointer"
                >
                  عرض جميع المذكرات ({visibleProducts.length})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {homeDisplayedProducts.map((prod) => renderProductCard(prod))}
              </div>
            </section>

            {/* ركن قريباً على المنصة (أسفل أحدث المذكرات المضافة) */}
            {Array.isArray(settings.upcomingItems) && settings.upcomingItems.length > 0 && (
              <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black">قريباً على المنصة</h2>
                      <p className="text-xs text-slate-300 font-medium">
                        مذكرات وبنوك أسئلة قيد التجهيز والمراجعة النهائية
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.upcomingItems.map((up) => (
                    <div
                      key={up.id}
                      className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-500/30 text-blue-200 text-[10px] font-black">
                          {safeText(up.stageName)}
                        </span>
                        <h3 className="text-sm font-black text-white">{safeText(up.title)}</h3>
                        <p className="text-xs text-slate-300 font-medium">{safeText(up.statusText)}</p>
                      </div>
                      <span className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-[11px] font-black shrink-0">
                        {safeText(up.expectedDate, 'قريباً')}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* آراء وتقييمات المعلمين */}
            {Array.isArray(settings.testimonials) && settings.testimonials.length > 0 && (
              <section className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {safeText(settings.testimonialsTitle, 'آراء وتقييمات المعلمين')}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    تجارب حقيقية لمعلمين استخدموا مذكراتنا المخصصة في فصولهم ومجموعاتهم
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {settings.testimonials.map((rev) => {
                    const authorName = safeText(rev.author || rev.name || 'معلم بالمنصة');
                    const authorRole = safeText(rev.role || rev.subtitle || '');
                    return (
                      <div
                        key={rev.id}
                        className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black">
                              تقييم موثق
                            </span>
                            <div className="flex items-center gap-1 text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                            "{safeText(rev.text)}"
                          </p>
                          {rev.image && (
                            <img
                              src={rev.image}
                              alt={authorName}
                              className="w-full max-h-48 object-contain rounded-2xl border border-slate-100 bg-slate-50"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                            {authorName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900">{authorName}</div>
                            {authorRole && (
                              <div className="text-[11px] text-slate-500 font-semibold">{authorRole}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* ------------------------------------------
            2. صفحة مكتبة المذكرات (LIBRARY)
        ------------------------------------------ */}
        {activeTab === 'library' && (
          <section className="space-y-6">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">مكتبة المذكرات وبنوك الأسئلة</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    ابحث وصفِّ المذكرات حسب المرحلة الدراسية أو الصف الدراسي أو القسم
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-black">
                  النتائج: {filteredProducts.length} مذكرة
                </span>
              </div>

              {/* أدوات البحث والفلترة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ابحث باسم المذكرة أو الصف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <select
                  value={selectedStageId}
                  onChange={(e) => {
                    setSelectedStageId(e.target.value);
                    setSelectedGradeId('all');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                >
                  <option value="all">جميع المراحل الدراسية</option>
                  {settings.stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedGradeId}
                  onChange={(e) => setSelectedGradeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                >
                  <option value="all">جميع الصفوف الدراسية</option>
                  {settings.grades
                    .filter((g) => selectedStageId === 'all' || g.stageId === selectedStageId)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                </select>

                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                >
                  <option value="all">جميع الأقسام</option>
                  {settings.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-black text-slate-800">لا توجد مذكرات مطابقة لبحثك</h3>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStageId('all');
                    setSelectedGradeId('all');
                    setSelectedCategoryId('all');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer"
                >
                  إعادة ضبط الفلاتر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => renderProductCard(prod))}
              </div>
            )}
          </section>
        )}

        {/* ------------------------------------------
            3. صفحة الباقات والعروض (BUNDLES)
        ------------------------------------------ */}
        {activeTab === 'bundles' && (
          <section className="space-y-8">
            {/* بطاقات الإحصائيات وركن الثقة */}
            <div className="rounded-3xl bg-gradient-to-bl from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black mb-2">
                    <Package className="w-3.5 h-3.5" />
                    <span>توفير مضاعف للمعلمين</span>
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black">الباقات المخفضة والعروض الحصرية</h2>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                    اختر باقة متكاملة لصفوفك الدراسية واستفد بأكبر خصم مع تخصيص كامل باسمك وشعارك
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black">توفير يصل إلى 30%</div>
                    <div className="text-[11px] text-slate-300">عند طلب الباقات المجمعة</div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black">تخصيص كل مذكرة بالباقة</div>
                    <div className="text-[11px] text-slate-300">باسمك ورقمك وشعار سلسلتك</div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black">تسليم فوري بصيغة PDF</div>
                    <div className="text-[11px] text-slate-300">عالية الدقة وجاهزة للطباعة</div>
                  </div>
                </div>
              </div>
            </div>

            {/* عروض الحصول على أكثر من مذكرة */}
            {activeMultiOffers.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900">عروض الخصم التلقائي عند طلب أكثر من مذكرة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeMultiOffers.map((offer) => (
                    <div
                      key={offer.id}
                      style={{
                        backgroundColor: offer.bgColor || '#0f172a',
                        color: offer.textColor || '#ffffff'
                      }}
                      className="rounded-3xl p-6 shadow-md flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        {offer.badgeText && (
                          <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
                            {safeText(offer.badgeText)}
                          </span>
                        )}
                        <h4 className="text-lg font-black">{safeText(offer.title)}</h4>
                        <p className="text-xs opacity-85 leading-relaxed">{safeText(offer.subtitle)}</p>
                      </div>
                      <button
                        onClick={() => navigateToTab('library')}
                        className="self-start px-5 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-black hover:bg-amber-300 transition cursor-pointer"
                      >
                        ابدأ اختيار المذكرات
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* قائمة الباقات */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bundles.map((bnd) => {
                const includedProducts = (bnd.productIds || [])
                  .map((id) => products.find((p) => p.id === id))
                  .filter(Boolean);
                const savedAmount = Math.max(0, Number(bnd.originalPrice || 0) - Number(bnd.price || 0));

                return (
                  <div
                    key={bnd.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col"
                  >
                    {/* غلاف الباقة التفاعلي: أيقونات/مصغرات المذكرات وفوقها اسم كل مذكرة */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-5 text-white space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
                          {safeText(bnd.badge, savedAmount > 0 ? `وفر ${savedAmount} ج.م` : 'باقة موفرة')}
                        </span>
                        <span className="text-xs text-slate-300 font-bold">
                          تشمل {includedProducts.length} مذكرات
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                        {includedProducts.map((incProd) => (
                          <div
                            key={incProd.id}
                            onClick={() => {
                              setPreviewProduct(incProd);
                              setActiveSampleIdx(0);
                            }}
                            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 flex flex-col items-center text-center gap-2 transition cursor-pointer"
                          >
                            <span className="text-[11px] font-black text-amber-200 line-clamp-2 leading-snug min-h-[2.2rem] flex items-center">
                              {safeText(incProd.title)}
                            </span>
                            <img
                              src={incProd.coverImage || makeCoverSvg(incProd.title, '', '#1e293b', '#2563eb')}
                              alt={safeText(incProd.title)}
                              className="w-14 h-16 rounded-xl object-cover border border-white/20 shadow-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                      <div className="space-y-2">
                        <h3 className="text-lg font-black text-slate-900">{safeText(bnd.title)}</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          {safeText(bnd.description)}
                        </p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        {safeText(bnd.driveSampleUrl).trim() && (
                          <a
                            href={safeText(bnd.driveSampleUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              backgroundColor: safeText(settings.driveButtonBgColor, '#ecfdf5'),
                              color: safeText(settings.driveButtonTextColor, '#047857')
                            }}
                            className="w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border border-black/5 hover:opacity-90 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>معاينة عينات الباقة على Google Drive</span>
                          </a>
                        )}

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-blue-600">{bnd.price} ج.م</span>
                              {Number(bnd.originalPrice) > Number(bnd.price) && (
                                <span className="text-xs text-slate-400 line-through font-bold">
                                  {bnd.originalPrice} ج.م
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => addToCart(bnd, 'bundle')}
                            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition cursor-pointer flex items-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>اطلب الباقة الآن</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ------------------------------------------
            4. صفحة تتبع طلبك (TRACK)
        ------------------------------------------ */}
        {activeTab === 'track' && (
          <section className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Truck className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-slate-900">تتبع حالة طلبك</h2>
              <p className="text-xs text-slate-500 font-semibold">
                أدخل رقم الهاتف المسجل في الطلب لعرض تفاصيل وحالة تجهيز مذكراتك
              </p>
            </div>

            <input
              type="text"
              placeholder="أدخل رقم الهاتف (مثال: 010xxxxxxxx)"
              value={trackPhoneInput}
              onChange={(e) => setTrackPhoneInput(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-center outline-none focus:border-blue-500"
            />

            {trackPhoneInput.trim().length >= 6 && (
              <div className="space-y-3">
                {orders
                  .filter(
                    (o) =>
                      safeText(o.phone1).includes(trackPhoneInput.trim()) ||
                      safeText(o.phone2).includes(trackPhoneInput.trim())
                  )
                  .map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-black">
                        <span className="text-blue-600">طلب #{ord.id}</span>
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900">
                          {safeText(ord.status, 'قيد التجهيز')}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800">المعلم: {safeText(ord.teacherName)}</div>
                      <div className="text-slate-500">
                        المذكرات: {(ord.items || []).map((i) => i.title).join(' + ')}
                      </div>
                      <div className="font-black text-emerald-700">الإجمالي: {ord.total} ج.م</div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* ------------------------------------------
            5. لوحة الإدارة المتكاملة (ADMIN PANEL)
        ------------------------------------------ */}
        {activeTab === 'admin' && isAdminAuthenticated && (
          <section className="space-y-6">
            {/* شريط التحكم العلوي للإدارة */}
            <div className="rounded-3xl bg-slate-900 text-white p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black">لوحة إدارة منصة العباقرة</h2>
                  <p className="text-[11px] text-slate-300 font-medium">
                    {isOfficialGoogleAdmin
                      ? `متصل بحساب المدير الرسمي (${user?.email}) ✓ — جاهز للنشر السحابي الفوري`
                      : 'تنبيه: يجب ربط حساب جوجل للإدارة ليسمح Firebase بحفظ التعديلات للعملاء'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isOfficialGoogleAdmin && (
                  <button
                    onClick={handleAdminGoogleLogin}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer"
                  >
                    ربط حساب جوجل للإدارة
                  </button>
                )}

                <button
                  onClick={handlePublishAllToCloud}
                  disabled={isSyncingCloud}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                  <span>حفظ ونشر جميع التعديلات للعملاء</span>
                </button>

                <button
                  onClick={handleDownloadBackupFile}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل نسخة احتياطية</span>
                </button>

                <button
                  onClick={handleForcePullFromCloud}
                  disabled={isSyncingCloud}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>سحب الصور من السحابة</span>
                </button>

                <button
                  onClick={handleAdminLogout}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>

            {/* تبويبات لوحة الإدارة */}
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
              {[
                { id: 'products', label: `المذكرات والعينات (${products.length})`, icon: BookOpen },
                { id: 'bundles', label: `الباقات (${bundles.length})`, icon: Package },
                { id: 'taxonomy', label: 'المراحل والصفوف والأقسام', icon: Layers },
                { id: 'coupons', label: `الكوبونات والعروض (${coupons.length})`, icon: Tag },
                { id: 'orders', label: `الطلبات (${orders.length})`, icon: ShoppingCart },
                { id: 'identity', label: 'الهوية والشعار والروابط', icon: Sliders },
                { id: 'backup', label: 'النسخ الاحتياطي JSON', icon: Download }
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setAdminTab(t.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                      adminTab === t.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ------------------------------------------
                تبويب 1: إدارة المذكرات والعينات والتنبيهات
            ------------------------------------------ */}
            {adminTab === 'products' && (
              <div className="space-y-6">
                {/* التحكم في المذكرات الظاهرة على الشاشة الرئيسية */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        التحكم الكامل في المذكرات الظاهرة على الشاشة الرئيسية
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        تحكم في عنوان القسم، واختيار العرض التلقائي أو تحديد وترتيب مذكرات معينة للظهور في الرئيسية
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await saveSettings(settings);
                        showToast('تم حفظ إعدادات الشاشة الرئيسية بنجاح');
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer"
                    >
                      حفظ إعدادات الرئيسية
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">عنوان القسم في الرئيسية</label>
                      <input
                        type="text"
                        value={settings.homeProductsTitle || ''}
                        onChange={(e) => setSettings({ ...settings, homeProductsTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">وصف القسم</label>
                      <input
                        type="text"
                        value={settings.homeProductsSubtitle || ''}
                        onChange={(e) => setSettings({ ...settings, homeProductsSubtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">طريقة العرض في الرئيسية</label>
                      <select
                        value={settings.homeProductsMode || 'auto'}
                        onChange={(e) => setSettings({ ...settings, homeProductsMode: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-black text-blue-700"
                      >
                        <option value="auto">عرض تلقائي لأحدث المذكرات</option>
                        <option value="custom">اختيار يدوي وترتيب مخصص للمذكرات</option>
                      </select>
                    </div>
                  </div>

                  {settings.homeProductsMode === 'auto' ? (
                    <div className="flex items-center gap-3 text-xs">
                      <label className="font-bold text-slate-700">عدد المذكرات المعروضة في الرئيسية:</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={settings.homeMaxProducts || 6}
                        onChange={(e) => setSettings({ ...settings, homeMaxProducts: Number(e.target.value) })}
                        className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 font-black"
                      />
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="font-black text-slate-800">
                        المذكرات المختارة للظهور في الرئيسية بالترتيب ({(settings.homeSelectedProductIds || []).length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(settings.homeSelectedProductIds || []).map((id, idx) => {
                          const p = products.find((item) => item.id === id);
                          if (!p) return null;
                          return (
                            <div
                              key={id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-blue-200 font-bold"
                            >
                              <span className="text-blue-600 font-black">#{idx + 1}</span>
                              <span>{p.title}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (idx === 0) return;
                                  const arr = [...settings.homeSelectedProductIds];
                                  [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                  setSettings({ ...settings, homeSelectedProductIds: arr });
                                }}
                                className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const arr = [...settings.homeSelectedProductIds];
                                  if (idx >= arr.length - 1) return;
                                  [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                                  setSettings({ ...settings, homeSelectedProductIds: arr });
                                }}
                                className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* التحكم في التنبيهات وزر Google Drive */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. التحكم في التنبيه العام */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-slate-900">1. التحكم في التنبيه العام (في نافذة المعاينة فقط)</h4>
                        <label className="inline-flex items-center gap-1.5 font-black text-blue-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.generalNotice?.enabled !== false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                generalNotice: { ...settings.generalNotice, enabled: e.target.checked }
                              })
                            }
                          />
                          <span>إظهار التنبيه العام</span>
                        </label>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">عنوان التنبيه العام</label>
                        <input
                          type="text"
                          value={settings.generalNotice?.title || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              generalNotice: { ...settings.generalNotice, title: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">نص التنبيه العام</label>
                        <textarea
                          rows={3}
                          value={settings.generalNotice?.text || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              generalNotice: { ...settings.generalNotice, text: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-600">قوالب سريعة:</span>
                        {[
                          { name: 'ذهبي دافئ', bg: '#fffbeb', txt: '#78350f' },
                          { name: 'أزرق هادئ', bg: '#eff6ff', txt: '#1e3a8a' },
                          { name: 'أخضر نعناعي', bg: '#ecfdf5', txt: '#065f46' },
                          { name: 'كحلي داكن', bg: '#0f172a', txt: '#ffffff' }
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                generalNotice: {
                                  ...settings.generalNotice,
                                  bgColor: preset.bg,
                                  textColor: preset.txt
                                }
                              })
                            }
                            style={{ backgroundColor: preset.bg, color: preset.txt }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-black border border-black/10 cursor-pointer"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">المكان</label>
                          <select
                            value={settings.generalNotice?.position || 'top'}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                generalNotice: { ...settings.generalNotice, position: e.target.value }
                              })
                            }
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                          >
                            <option value="top">أعلى التفاصيل</option>
                            <option value="bottom">أسفل الوصف</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">لون الخلفية</label>
                          <input
                            type="color"
                            value={settings.generalNotice?.bgColor || '#fffbeb'}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                generalNotice: { ...settings.generalNotice, bgColor: e.target.value }
                              })
                            }
                            className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">لون النص</label>
                          <input
                            type="color"
                            value={settings.generalNotice?.textColor || '#78350f'}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                generalNotice: { ...settings.generalNotice, textColor: e.target.value }
                              })
                            }
                            className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. التحكم في التنبيه الخاص بكل مذكرة + زر Google Drive */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-black text-slate-900">2. التنبيه الخاص بكل مذكرة (صندوق مستقل)</h4>
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-1 font-black text-emerald-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.productNoticeStyle?.showInPreview !== false}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    productNoticeStyle: {
                                      ...settings.productNoticeStyle,
                                      showInPreview: e.target.checked
                                    }
                                  })
                                }
                              />
                              <span>بالمعاينة</span>
                            </label>
                            <label className="inline-flex items-center gap-1 font-black text-blue-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.productNoticeStyle?.showOnCard !== false}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    productNoticeStyle: {
                                      ...settings.productNoticeStyle,
                                      showOnCard: e.target.checked
                                    }
                                  })
                                }
                              />
                              <span>بالبطاقة</span>
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">مكان الظهور</label>
                            <select
                              value={settings.productNoticeStyle?.position || 'bottom'}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  productNoticeStyle: {
                                    ...settings.productNoticeStyle,
                                    position: e.target.value
                                  }
                                })
                              }
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                            >
                              <option value="bottom">أسفل الوصف</option>
                              <option value="top">أعلى الوصف</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">لون الخلفية</label>
                            <input
                              type="color"
                              value={settings.productNoticeStyle?.bgColor || '#eff6ff'}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  productNoticeStyle: {
                                    ...settings.productNoticeStyle,
                                    bgColor: e.target.value
                                  }
                                })
                              }
                              className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">لون النص</label>
                            <input
                              type="color"
                              value={settings.productNoticeStyle?.textColor || '#1e3a8a'}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  productNoticeStyle: {
                                    ...settings.productNoticeStyle,
                                    textColor: e.target.value
                                  }
                                })
                              }
                              className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. التحكم في زر معاينة Google Drive */}
                      <div className="pt-3 border-t border-slate-200 space-y-2.5">
                        <h4 className="font-black text-slate-900">3. التحكم في زر معاينة Google Drive</h4>
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-6">
                            <label className="block font-bold text-slate-600 mb-1">نص الزر</label>
                            <input
                              type="text"
                              value={settings.driveButtonLabel || ''}
                              onChange={(e) => setSettings({ ...settings, driveButtonLabel: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block font-bold text-slate-600 mb-1">لون الزر</label>
                            <input
                              type="color"
                              value={settings.driveButtonBgColor || '#ecfdf5'}
                              onChange={(e) => setSettings({ ...settings, driveButtonBgColor: e.target.value })}
                              className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block font-bold text-slate-600 mb-1">لون النص</label>
                            <input
                              type="color"
                              value={settings.driveButtonTextColor || '#047857'}
                              onChange={(e) => setSettings({ ...settings, driveButtonTextColor: e.target.value })}
                              className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await saveSettings(settings);
                      showToast('تم حفظ ونشر إعدادات التنبيهات وزر Drive بنجاح');
                    }}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm cursor-pointer"
                  >
                    حفظ ونشر تعديلات التنبيهات وزر Google Drive
                  </button>
                </div>

                {/* نموذج إضافة/تعديل مذكرة + قائمة المذكرات */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
                    <h3 className="text-base font-black text-slate-900">
                      {editingProductId ? 'تعديل بيانات المذكرة' : 'إضافة مذكرة جديدة'}
                    </h3>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">عنوان المذكرة *</label>
                      <input
                        type="text"
                        placeholder="مثال: بنك مراجعة الصف الثالث الإعدادي"
                        value={productForm.title}
                        onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">المرحلة</label>
                        <select
                          value={productForm.stageId}
                          onChange={(e) => setProductForm({ ...productForm, stageId: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                        >
                          {settings.stages.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">الصف الدراسي</label>
                        <select
                          value={productForm.gradeId}
                          onChange={(e) => setProductForm({ ...productForm, gradeId: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                        >
                          {settings.grades.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">القسم</label>
                        <select
                          value={productForm.categoryId}
                          onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                        >
                          {settings.categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">عدد الصفحات</label>
                        <input
                          type="number"
                          value={productForm.pagesCount}
                          onChange={(e) => setProductForm({ ...productForm, pagesCount: Number(e.target.value) })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">السعر بعد الخصم (ج.م)</label>
                        <input
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">السعر قبل الخصم (ج.م)</label>
                        <input
                          type="number"
                          value={productForm.originalPrice}
                          onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">الشريط الذهبي فوق المذكرة</label>
                      <input
                        type="text"
                        value={productForm.goldRibbon}
                        onChange={(e) => setProductForm({ ...productForm, goldRibbon: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">التنبيه الخاص بالمذكرة (صندوق مستقل)</label>
                      <input
                        type="text"
                        placeholder="مثال: ملاحظة: للمراجعة المثلى اطلبها مع البوكليت"
                        value={productForm.tipText}
                        onChange={(e) => setProductForm({ ...productForm, tipText: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">رابط عينة Google Drive</label>
                      <input
                        type="url"
                        value={productForm.driveSampleUrl}
                        onChange={(e) => setProductForm({ ...productForm, driveSampleUrl: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">وصف المذكرة</label>
                      <textarea
                        rows={3}
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                      <label className="block font-black text-blue-900">صورة غلاف المذكرة</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const compressed = await compressImageFile(file, 750, 0.75);
                          setProductForm({ ...productForm, coverImage: compressed });
                        }}
                        className="w-full text-xs"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-black text-emerald-900">
                          صور صفحات العينة الداخلية ({productForm.sampleImages?.length || 0})
                        </label>
                        {productForm.sampleImages?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, sampleImages: [] })}
                            className="text-rose-600 font-bold cursor-pointer"
                          >
                            مسح الكل
                          </button>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          const compressedList = await Promise.all(
                            files.map((f) => compressImageFile(f, 750, 0.72))
                          );
                          setProductForm((prev) => ({
                            ...prev,
                            sampleImages: [...(prev.sampleImages || []), ...compressedList]
                          }));
                        }}
                        className="w-full text-xs"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!productForm.title.trim()) {
                            showToast('يرجى إدخال عنوان المذكرة', 'error');
                            return;
                          }
                          const prodObj = {
                            ...productForm,
                            id: editingProductId || `prod_${Date.now()}`
                          };
                          const nextList = editingProductId
                            ? products.map((p) => (p.id === editingProductId ? prodObj : p))
                            : [prodObj, ...products];
                          setProducts(nextList);
                          await idbSet('products_v6', nextList);
                          await saveProductToCloud(prodObj);
                          setEditingProductId(null);
                          setProductForm({
                            title: '',
                            subject: 'اللغة العربية',
                            stageId: 'stg_prep',
                            gradeId: 'grd_m3',
                            categoryId: 'cat_final_rev',
                            pagesCount: 80,
                            price: 149,
                            originalPrice: 200,
                            goldRibbon: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
                            tipText: '',
                            driveSampleUrl: 'https://drive.google.com/',
                            description: '',
                            coverImage: '',
                            sampleImages: [],
                            hidden: false
                          });
                          showToast(editingProductId ? 'تم تحديث المذكرة وحفظها' : 'تمت إضافة المذكرة وحفظها');
                        }}
                        className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm cursor-pointer"
                      >
                        {editingProductId ? 'حفظ التعديلات' : 'إضافة المذكرة'}
                      </button>

                      {editingProductId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProductId(null);
                            setProductForm({
                              title: '',
                              subject: 'اللغة العربية',
                              stageId: 'stg_prep',
                              gradeId: 'grd_m3',
                              categoryId: 'cat_final_rev',
                              pagesCount: 80,
                              price: 149,
                              originalPrice: 200,
                              goldRibbon: '',
                              tipText: '',
                              driveSampleUrl: 'https://drive.google.com/',
                              description: '',
                              coverImage: '',
                              sampleImages: [],
                              hidden: false
                            });
                          }}
                          className="px-4 py-3.5 rounded-2xl bg-slate-200 text-slate-800 font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                      )}
                    </div>
                  </div>

                  {/* قائمة المذكرات */}
                  <div className="lg:col-span-7 space-y-3">
                    {products.map((prod) => {
                      const isPinnedHome = (settings.homeSelectedProductIds || []).includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          className={`p-4 rounded-2xl bg-white border flex items-center justify-between gap-3 ${
                            prod.hidden ? 'border-slate-200 opacity-60' : 'border-slate-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={prod.coverImage || makeCoverSvg(prod.title, '', '#1e293b', '#2563eb')}
                              alt={safeText(prod.title)}
                              className="w-12 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                                {safeText(prod.title)}
                              </h4>
                              <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                                {prod.price} ج.م • {prod.pagesCount || 0} صفحة •{' '}
                                <span className="text-emerald-600 font-black">
                                  {prod.sampleImages?.length || 0} عينة
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* تثبيت في الشاشة الرئيسية */}
                            <button
                              type="button"
                              onClick={async () => {
                                const current = settings.homeSelectedProductIds || [];
                                const nextSelected = current.includes(prod.id)
                                  ? current.filter((x) => x !== prod.id)
                                  : [...current, prod.id];
                                await saveSettings({
                                  ...settings,
                                  homeProductsMode: 'custom',
                                  homeSelectedProductIds: nextSelected
                                });
                                showToast(
                                  isPinnedHome
                                    ? 'تمت إزالة المذكرة من الشاشة الرئيسية'
                                    : 'تم تثبيت المذكرة في الشاشة الرئيسية'
                                );
                              }}
                              className={`p-2 rounded-xl cursor-pointer ${
                                isPinnedHome
                                  ? 'bg-amber-100 text-amber-600'
                                  : 'bg-slate-100 text-slate-400 hover:text-amber-500'
                              }`}
                              title="تثبيت/إزالة من الشاشة الرئيسية"
                            >
                              <Star className={`w-4 h-4 ${isPinnedHome ? 'fill-amber-400' : ''}`} />
                            </button>

                            {/* إخفاء / إظهار */}
                            <button
                              type="button"
                              onClick={async () => {
                                const updated = { ...prod, hidden: !prod.hidden };
                                const nextList = products.map((p) => (p.id === prod.id ? updated : p));
                                setProducts(nextList);
                                await idbSet('products_v6', nextList);
                                await saveProductToCloud(updated);
                                showToast(updated.hidden ? 'تم إخفاء المذكرة' : 'تم إظهار المذكرة');
                              }}
                              className={`p-2 rounded-xl cursor-pointer ${
                                prod.hidden ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                              }`}
                              title={prod.hidden ? 'إظهار للعملاء' : 'إخفاء عن العملاء'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* تعديل */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProductId(prod.id);
                                setProductForm({
                                  title: prod.title || '',
                                  subject: prod.subject || 'اللغة العربية',
                                  stageId: prod.stageId || 'stg_prep',
                                  gradeId: prod.gradeId || 'grd_m3',
                                  categoryId: prod.categoryId || 'cat_final_rev',
                                  pagesCount: prod.pagesCount || 80,
                                  price: prod.price || 149,
                                  originalPrice: prod.originalPrice || 200,
                                  goldRibbon: prod.goldRibbon || '',
                                  tipText: prod.tipText || '',
                                  driveSampleUrl: prod.driveSampleUrl || 'https://drive.google.com/',
                                  description: prod.description || '',
                                  coverImage: prod.coverImage || '',
                                  sampleImages: Array.isArray(prod.sampleImages) ? prod.sampleImages : [],
                                  hidden: Boolean(prod.hidden)
                                });
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                              className="p-2 rounded-xl bg-blue-50 text-blue-600 cursor-pointer"
                              title="تعديل"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* حذف */}
                            <button
                              type="button"
                              onClick={async () => {
                                const nextList = products.filter((p) => p.id !== prod.id);
                                setProducts(nextList);
                                await idbSet('products_v6', nextList);
                                try {
                                  const { db } = firebaseServices;
                                  if (db) {
                                    await deleteDoc(
                                      doc(db, 'artifacts', 'el3bakera-edu', 'public', 'data', 'notebooks', prod.id)
                                    );
                                  }
                                } catch {}
                                showToast('تم حذف المذكرة');
                              }}
                              className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------
                تبويب 2: إدارة الباقات (BUNDLES)
            ------------------------------------------ */}
            {adminTab === 'bundles' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
                  <h3 className="text-base font-black text-slate-900">
                    {editingBundleId ? 'تعديل الباقة' : 'إضافة باقة مخفضة جديدة'}
                  </h3>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">اسم الباقة *</label>
                    <input
                      type="text"
                      placeholder="اسم الباقة"
                      value={bundleForm.title}
                      onChange={(e) => setBundleForm({ ...bundleForm, title: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">وصف الباقة</label>
                    <textarea
                      rows={2}
                      placeholder="وصف الباقة"
                      value={bundleForm.description}
                      onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">سعر الباقة (ج.م)</label>
                      <input
                        type="number"
                        value={bundleForm.price}
                        onChange={(e) => setBundleForm({ ...bundleForm, price: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">السعر الأصلي الإجمالي</label>
                      <input
                        type="number"
                        value={bundleForm.originalPrice}
                        onChange={(e) => setBundleForm({ ...bundleForm, originalPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">شارة التوفير</label>
                      <input
                        type="text"
                        value={bundleForm.badge}
                        onChange={(e) => setBundleForm({ ...bundleForm, badge: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">رابط Google Drive للباقة</label>
                      <input
                        type="url"
                        value={bundleForm.driveSampleUrl}
                        onChange={(e) => setBundleForm({ ...bundleForm, driveSampleUrl: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>
                  </div>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200 cursor-pointer">
                    <div>
                      <div className="font-black text-amber-950">السماح بتطبيق كوبونات الخصم على هذه الباقة</div>
                      <div className="text-[11px] text-amber-800 font-medium">
                        عند إلغاء التفعيل تُستثنى الباقة من كوبونات الخصم في السلة
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(bundleForm.allowCoupon)}
                      onChange={(e) => setBundleForm({ ...bundleForm, allowCoupon: e.target.checked })}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </label>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between font-black text-slate-800">
                      <span>اختر المذكرات المشمولة ({bundleForm.productIds.length}):</span>
                      <span className="text-emerald-700">الإجمالي: {bundleForm.originalPrice} ج.م</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {products.map((p) => {
                        const checked = bundleForm.productIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const nextIds = e.target.checked
                                    ? [...bundleForm.productIds, p.id]
                                    : bundleForm.productIds.filter((id) => id !== p.id);
                                  const totalSelected = nextIds.reduce((sum, id) => {
                                    const found = products.find((item) => item.id === id);
                                    return sum + Number(found?.price || 0);
                                  }, 0);
                                  setBundleForm({
                                    ...bundleForm,
                                    productIds: nextIds,
                                    originalPrice: totalSelected > 0 ? totalSelected : bundleForm.originalPrice
                                  });
                                }}
                              />
                              <span className="truncate font-bold">{p.title}</span>
                            </div>
                            <span className="text-blue-600 font-black shrink-0">{p.price} ج.م</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!bundleForm.title.trim()) {
                          showToast('يرجى إدخال اسم الباقة', 'error');
                          return;
                        }
                        const bObj = {
                          ...bundleForm,
                          id: editingBundleId || `bnd_${Date.now()}`
                        };
                        const nextList = editingBundleId
                          ? bundles.map((b) => (b.id === editingBundleId ? bObj : b))
                          : [bObj, ...bundles];
                        setBundles(nextList);
                        await idbSet('bundles_v6', nextList);
                        try {
                          const { db } = firebaseServices;
                          if (db) {
                            await setDoc(
                              doc(db, 'artifacts', 'el3bakera-edu', 'public', 'data', 'bundles', bObj.id),
                              bObj,
                              { merge: true }
                            );
                          }
                        } catch {}
                        setEditingBundleId(null);
                        setBundleForm({
                          title: '',
                          description: '',
                          price: 499,
                          originalPrice: 650,
                          badge: 'وفر 150 ج.م',
                          driveSampleUrl: 'https://drive.google.com/',
                          allowCoupon: false,
                          productIds: []
                        });
                        showToast(editingBundleId ? 'تم تحديث الباقة وحفظها' : 'تم حفظ الباقة الجديدة');
                      }}
                      className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm cursor-pointer"
                    >
                      {editingBundleId ? 'حفظ تعديلات الباقة' : 'حفظ الباقة'}
                    </button>
                    {editingBundleId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBundleId(null);
                          setBundleForm({
                            title: '',
                            description: '',
                            price: 499,
                            originalPrice: 650,
                            badge: 'وفر 150 ج.م',
                            driveSampleUrl: 'https://drive.google.com/',
                            allowCoupon: false,
                            productIds: []
                          });
                        }}
                        className="px-4 py-3 rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-3">
                  {bundles.map((bnd) => (
                    <div
                      key={bnd.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-sm text-slate-900">{bnd.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                              bnd.allowCoupon
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {bnd.allowCoupon ? 'تقبل الكوبونات' : 'مستثناة من الكوبونات'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-bold mt-0.5">
                          {bnd.price} ج.م (بدلاً من {bnd.originalPrice} ج.م) • {(bnd.productIds || []).length} مذكرات
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBundleId(bnd.id);
                            setBundleForm({
                              title: bnd.title || '',
                              description: bnd.description || '',
                              price: bnd.price || 499,
                              originalPrice: bnd.originalPrice || 650,
                              badge: bnd.badge || '',
                              driveSampleUrl: bnd.driveSampleUrl || 'https://drive.google.com/',
                              allowCoupon: Boolean(bnd.allowCoupon),
                              productIds: Array.isArray(bnd.productIds) ? bnd.productIds : []
                            });
                          }}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const nextList = bundles.filter((b) => b.id !== bnd.id);
                            setBundles(nextList);
                            await idbSet('bundles_v6', nextList);
                            try {
                              const { db } = firebaseServices;
                              if (db) {
                                await deleteDoc(
                                  doc(db, 'artifacts', 'el3bakera-edu', 'public', 'data', 'bundles', bnd.id)
                                );
                              }
                            } catch {}
                            showToast('تم حذف الباقة');
                          }}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------
                تبويب 3: المراحل والصفوف والأقسام
            ------------------------------------------ */}
            {adminTab === 'taxonomy' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                {/* المراحل الدراسية */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
                  <h3 className="text-base font-black text-slate-900">المراحل الدراسية</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="اسم المرحلة الجديدة..."
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-bold"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newStageName.trim()) return;
                        const nextStages = [
                          ...settings.stages,
                          { id: `stg_${Date.now()}`, name: newStageName.trim(), order: settings.stages.length + 1 }
                        ];
                        await saveSettings({ ...settings, stages: nextStages });
                        setNewStageName('');
                        showToast('تمت إضافة المرحلة');
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-black cursor-pointer"
                    >
                      إضافة
                    </button>
                  </div>
                  <div className="space-y-2">
                    {settings.stages.map((s) => (
                      <div key={s.id} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                        <span className="font-bold">{s.name}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            const nextStages = settings.stages.filter((item) => item.id !== s.id);
                            await saveSettings({ ...settings, stages: nextStages });
                          }}
                          className="text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* الصفوف الدراسية */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
                  <h3 className="text-base font-black text-slate-900">الصفوف الدراسية</h3>
                  <div className="space-y-2">
                    <select
                      value={newGradeForm.stageId}
                      onChange={(e) => setNewGradeForm({ ...newGradeForm, stageId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                    >
                      {settings.stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="اسم الصف الدراسي..."
                        value={newGradeForm.name}
                        onChange={(e) => setNewGradeForm({ ...newGradeForm, name: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-bold"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newGradeForm.name.trim()) return;
                          const nextGrades = [
                            ...settings.grades,
                            {
                              id: `grd_${Date.now()}`,
                              stageId: newGradeForm.stageId,
                              name: newGradeForm.name.trim(),
                              order: settings.grades.length + 1
                            }
                          ];
                          await saveSettings({ ...settings, grades: nextGrades });
                          setNewGradeForm({ ...newGradeForm, name: '' });
                          showToast('تمت إضافة الصف');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-black cursor-pointer"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {settings.grades.map((g) => (
                      <div key={g.id} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                        <span className="font-bold">{g.name}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            const nextGrades = settings.grades.filter((item) => item.id !== g.id);
                            await saveSettings({ ...settings, grades: nextGrades });
                          }}
                          className="text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* الأقسام الدراسية */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
                  <h3 className="text-base font-black text-slate-900">الأقسام الدراسية</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="اسم القسم الجديد..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-bold"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newCategoryName.trim()) return;
                        const nextCats = [
                          ...settings.categories,
                          {
                            id: `cat_${Date.now()}`,
                            name: newCategoryName.trim(),
                            coverImage: makeCoverSvg(newCategoryName.trim(), '', '#1e3a8a', '#2563eb')
                          }
                        ];
                        await saveSettings({ ...settings, categories: nextCats });
                        setNewCategoryName('');
                        showToast('تمت إضافة القسم');
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-black cursor-pointer"
                    >
                      إضافة
                    </button>
                  </div>
                  <div className="space-y-2">
                    {settings.categories.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{c.name}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              const nextCats = settings.categories.filter((item) => item.id !== c.id);
                              await saveSettings({ ...settings, categories: nextCats });
                            }}
                            className="text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const img = await compressImageFile(file, 700, 0.75);
                            const nextCats = settings.categories.map((item) =>
                              item.id === c.id ? { ...item, coverImage: img } : item
                            );
                            await saveSettings({ ...settings, categories: nextCats });
                            showToast('تم تحديث صورة القسم');
                          }}
                          className="w-full text-[10px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------
                تبويب 4: الكوبونات وعروض الحصول على أكثر من مذكرة
            ------------------------------------------ */}
            {adminTab === 'coupons' && (
              <div className="space-y-6 text-xs">
                {/* 1. إدارة عروض الحصول على أكثر من مذكرة */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      إدارة عروض الحصول على أكثر من مذكرة (عروض متعددة)
                    </h3>
                    <p className="text-slate-500 font-medium">
                      أنشئ عرضاً أو أكثر وحدد نوع الخصم (نسبة مئوية % أو مبلغ ثابت ج.م) ومذكرات محددة أو اجعله شاملاً
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">عنوان العرض *</label>
                        <input
                          type="text"
                          placeholder="مثال: عرض خاص عند طلب مذكرتين فأكثر"
                          value={multiOfferForm.title}
                          onChange={(e) => setMultiOfferForm({ ...multiOfferForm, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">وصف العرض</label>
                        <textarea
                          rows={2}
                          placeholder="تفاصيل العرض للعميل..."
                          value={multiOfferForm.subtitle}
                          onChange={(e) => setMultiOfferForm({ ...multiOfferForm, subtitle: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">أقل عدد مذكرات</label>
                          <input
                            type="number"
                            min={2}
                            value={multiOfferForm.minItems}
                            onChange={(e) => setMultiOfferForm({ ...multiOfferForm, minItems: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">نوع الخصم</label>
                          <select
                            value={multiOfferForm.discountType || 'percent'}
                            onChange={(e) =>
                              setMultiOfferForm({
                                ...multiOfferForm,
                                discountType: e.target.value
                              })
                            }
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-black text-blue-700"
                          >
                            <option value="percent">نسبة مئوية (%)</option>
                            <option value="fixed">مبلغ ثابت (ج.م)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">
                            {(multiOfferForm.discountType || 'percent') === 'fixed'
                              ? 'مبلغ الخصم (ج.م)'
                              : 'نسبة الخصم (%)'}
                          </label>
                          <input
                            type="number"
                            value={multiOfferForm.discountValue ?? multiOfferForm.discountPercent ?? 15}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setMultiOfferForm({
                                ...multiOfferForm,
                                discountValue: val,
                                discountPercent: val
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                          />
                        </div>
                        {(multiOfferForm.discountType || 'percent') === 'percent' && (
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">أقصى خصم ج.م</label>
                            <input
                              type="number"
                              value={multiOfferForm.maxDiscount}
                              onChange={(e) => setMultiOfferForm({ ...multiOfferForm, maxDiscount: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-6">
                          <label className="block font-bold text-slate-600 mb-1">نص الشارة الذهبية</label>
                          <input
                            type="text"
                            placeholder="وفر حتى 150 ج.م"
                            value={multiOfferForm.badgeText}
                            onChange={(e) => setMultiOfferForm({ ...multiOfferForm, badgeText: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block font-bold text-slate-600 mb-1">الخلفية</label>
                          <input
                            type="color"
                            value={multiOfferForm.bgColor}
                            onChange={(e) => setMultiOfferForm({ ...multiOfferForm, bgColor: e.target.value })}
                            className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block font-bold text-slate-600 mb-1">لون النص</label>
                          <input
                            type="color"
                            value={multiOfferForm.textColor}
                            onChange={(e) => setMultiOfferForm({ ...multiOfferForm, textColor: e.target.value })}
                            className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                          />
                        </div>
                      </div>

                      <label className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200 cursor-pointer">
                        <div>
                          <div className="font-black text-amber-950">السماح بدمج كوبونات الخصم مع هذا العرض</div>
                          <div className="text-[11px] text-amber-800 font-medium">
                            عند إلغاء التفعيل يُطبَّق الخصم الأعلى فقط (العرض أو الكوبون) ولا يُجمعان معاً
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(multiOfferForm.allowCouponStacking)}
                          onChange={(e) =>
                            setMultiOfferForm({ ...multiOfferForm, allowCouponStacking: e.target.checked })
                          }
                          className="w-4 h-4 accent-blue-600"
                        />
                      </label>

                      <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 font-black text-slate-800">
                          <span>
                            تحديد مذكرات معينة للعرض ({multiOfferForm.productIds.length === 0 ? 'شامل لجميع المذكرات' : `${multiOfferForm.productIds.length} مذكرات محددة`}):
                          </span>
                          {multiOfferForm.productIds.length > 0 && (() => {
                            const selectedTotal = multiOfferForm.productIds.reduce((sum, id) => {
                              const found = products.find((p) => p.id === id);
                              return sum + Number(found?.price || 0);
                            }, 0);
                            const type = multiOfferForm.discountType || 'percent';
                            const val = Number(multiOfferForm.discountValue ?? multiOfferForm.discountPercent ?? 0);
                            let finalDisc = 0;
                            if (type === 'fixed') {
                              finalDisc = Math.min(val, selectedTotal);
                            } else {
                              const rawDisc = Math.round((selectedTotal * val) / 100);
                              finalDisc = multiOfferForm.maxDiscount
                                ? Math.min(rawDisc, Number(multiOfferForm.maxDiscount))
                                : rawDisc;
                            }
                            return (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px]">
                                الإجمالي: {selectedTotal} ج.م (بعد الخصم: {Math.max(0, selectedTotal - finalDisc)} ج.م)
                              </span>
                            );
                          })()}
                        </div>

                        <div className="max-h-36 overflow-y-auto space-y-1">
                          {products.map((p) => (
                            <label
                              key={p.id}
                              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={multiOfferForm.productIds.includes(p.id)}
                                  onChange={(e) => {
                                    const nextIds = e.target.checked
                                      ? [...multiOfferForm.productIds, p.id]
                                      : multiOfferForm.productIds.filter((id) => id !== p.id);
                                    setMultiOfferForm({ ...multiOfferForm, productIds: nextIds });
                                  }}
                                />
                                <span className="truncate font-bold">{p.title}</span>
                              </div>
                              <span className="text-blue-600 font-black shrink-0">{p.price} ج.م</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!multiOfferForm.title.trim()) {
                              showToast('يرجى إدخال عنوان العرض أولاً', 'error');
                              return;
                            }
                            const val = Number(multiOfferForm.discountValue ?? multiOfferForm.discountPercent ?? 0);
                            const offerObj = {
                              ...multiOfferForm,
                              discountType: multiOfferForm.discountType || 'percent',
                              discountValue: val,
                              discountPercent: val,
                              id: editingMultiOfferId || `moff_${Date.now()}`
                            };
                            const nextOffers = editingMultiOfferId
                              ? safeMultiOffers.map((o) => (o.id === editingMultiOfferId ? offerObj : o))
                              : [offerObj, ...safeMultiOffers];
                            await saveSettings({ ...settings, multiOffers: nextOffers });
                            setEditingMultiOfferId(null);
                            setMultiOfferForm({
                              title: '',
                              subtitle: '',
                              badgeText: 'وفر 15% تلقائياً',
                              minItems: 2,
                              discountType: 'percent',
                              discountValue: 15,
                              discountPercent: 15,
                              maxDiscount: 150,
                              allowCouponStacking: false,
                              productIds: [],
                              bgColor: '#0f172a',
                              textColor: '#ffffff',
                              active: true
                            });
                            showToast(editingMultiOfferId ? 'تم تحديث العرض وحفظه' : 'تمت إضافة العرض وحفظه بنجاح');
                          }}
                          className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm cursor-pointer"
                        >
                          {editingMultiOfferId ? 'حفظ تعديلات العرض' : '+ إضافة وحفظ العرض'}
                        </button>
                        {editingMultiOfferId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMultiOfferId(null);
                              setMultiOfferForm({
                                title: '',
                                subtitle: '',
                                badgeText: 'وفر 15% تلقائياً',
                                minItems: 2,
                                discountType: 'percent',
                                discountValue: 15,
                                discountPercent: 15,
                                maxDiscount: 150,
                                allowCouponStacking: false,
                                productIds: [],
                                bgColor: '#0f172a',
                                textColor: '#ffffff',
                                active: true
                              });
                            }}
                            className="px-4 py-3 rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
                          >
                            إلغاء
                          </button>
                        )}
                      </div>
                    </div>

                    {/* قائمة العروض المضافة */}
                    <div className="lg:col-span-7 space-y-3">
                      {safeMultiOffers.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 font-bold">
                          لا توجد عروض مضافة حالياً — أضف أول عرض من النموذج المجاور.
                        </div>
                      ) : (
                        safeMultiOffers.map((off) => (
                          <div
                            key={off.id}
                            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                              off.active === false ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-2xs'
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  style={{ backgroundColor: off.bgColor || '#0f172a', color: off.textColor || '#fff' }}
                                  className="px-2.5 py-0.5 rounded-lg font-black text-[11px]"
                                >
                                  {(off.discountType || 'percent') === 'fixed'
                                    ? `خصم ${off.discountValue ?? off.discountPercent ?? 0} ج.م عند ${off.minItems}+ مذكرات`
                                    : `خصم ${off.discountValue ?? off.discountPercent ?? 0}% عند ${off.minItems}+ مذكرات`}
                                </span>
                                <h4 className="font-black text-sm text-slate-900 truncate">{off.title}</h4>
                              </div>
                              <p className="text-slate-500 truncate">{off.subtitle}</p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                                <span className="text-blue-600">
                                  {Array.isArray(off.productIds) && off.productIds.length > 0
                                    ? `يسري على ${off.productIds.length} مذكرات محددة`
                                    : 'شامل لجميع مذكرات المنصة'}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md ${
                                    off.allowCouponStacking
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-800'
                                  }`}
                                >
                                  {off.allowCouponStacking ? 'يُدمج مع الكوبون' : 'لا يُدمج مع الكوبون'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={async () => {
                                  const nextOffers = safeMultiOffers.map((item) =>
                                    item.id === off.id ? { ...item, active: item.active === false } : item
                                  );
                                  await saveSettings({ ...settings, multiOffers: nextOffers });
                                  showToast('تم تحديث حالة العرض');
                                }}
                                className={`px-2.5 py-1.5 rounded-xl font-bold cursor-pointer ${
                                  off.active === false
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {off.active === false ? 'مخفي' : 'مفعّل'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMultiOfferId(off.id);
                                  setMultiOfferForm({
                                    title: off.title || '',
                                    subtitle: off.subtitle || '',
                                    badgeText: off.badgeText || '',
                                    minItems: Number(off.minItems || 2),
                                    discountType: off.discountType || 'percent',
                                    discountValue: Number(off.discountValue ?? off.discountPercent ?? 15),
                                    discountPercent: Number(off.discountValue ?? off.discountPercent ?? 15),
                                    maxDiscount: Number(off.maxDiscount || 150),
                                    allowCouponStacking: Boolean(off.allowCouponStacking),
                                    productIds: Array.isArray(off.productIds) ? off.productIds : [],
                                    bgColor: off.bgColor || '#0f172a',
                                    textColor: off.textColor || '#ffffff',
                                    active: off.active !== false
                                  });
                                }}
                                className="p-2 rounded-xl bg-blue-50 text-blue-600 cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const nextOffers = safeMultiOffers.filter((item) => item.id !== off.id);
                                  await saveSettings({ ...settings, multiOffers: nextOffers });
                                  showToast('تم حذف العرض');
                                }}
                                className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. إدارة الشريط الترويجي العلوي + كوبونات الخصم */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* الشريط الترويجي العلوي */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-slate-900">الشريط الترويجي العلوي</h3>
                      <label className="inline-flex items-center gap-1.5 font-black text-blue-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.promoEnabled !== false}
                          onChange={(e) => setSettings({ ...settings, promoEnabled: e.target.checked })}
                        />
                        <span>تفعيل الشريط</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={settings.promoText || ''}
                      onChange={(e) => setSettings({ ...settings, promoText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="كود الكوبون"
                        value={settings.promoCouponCode || ''}
                        onChange={(e) => setSettings({ ...settings, promoCouponCode: e.target.value })}
                        className="px-3 py-2 rounded-xl border border-slate-200 font-black"
                      />
                      <input
                        type="color"
                        value={settings.promoBgColor || '#0654d0'}
                        onChange={(e) => setSettings({ ...settings, promoBgColor: e.target.value })}
                        className="w-full h-9 rounded-xl border border-slate-200"
                      />
                      <input
                        type="color"
                        value={settings.promoTextColor || '#fde047'}
                        onChange={(e) => setSettings({ ...settings, promoTextColor: e.target.value })}
                        className="w-full h-9 rounded-xl border border-slate-200"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await saveSettings(settings);
                        showToast('تم حفظ إعدادات الشريط الترويجي');
                      }}
                      className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-black cursor-pointer"
                    >
                      حفظ الشريط الترويجي
                    </button>
                  </div>

                  {/* كوبونات الخصم */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
                    <h3 className="text-base font-black text-slate-900">كوبونات الخصم</h3>
                    <div className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="الكود (M20)"
                        value={newCouponForm.code}
                        onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
                        className="col-span-5 px-3 py-2 rounded-xl border border-slate-200 font-black"
                      />
                      <input
                        type="number"
                        placeholder="النسبة %"
                        value={newCouponForm.discountPercent}
                        onChange={(e) =>
                          setNewCouponForm({ ...newCouponForm, discountPercent: Number(e.target.value) })
                        }
                        className="col-span-4 px-3 py-2 rounded-xl border border-slate-200 font-bold"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newCouponForm.code.trim()) return;
                          const cpObj = {
                            id: `cp_${Date.now()}`,
                            code: newCouponForm.code.trim().toUpperCase(),
                            discountPercent: Number(newCouponForm.discountPercent || 15),
                            maxUses: Number(newCouponForm.maxUses || 100),
                            usedCount: 0,
                            active: true
                          };
                          const nextList = [cpObj, ...coupons];
                          setCoupons(nextList);
                          await idbSet('coupons_v6', nextList);
                          try {
                            const { db } = firebaseServices;
                            if (db) {
                              await setDoc(
                                doc(db, 'artifacts', 'el3bakera-edu', 'public', 'data', 'coupons', cpObj.id),
                                cpObj
                              );
                            }
                          } catch {}
                          setNewCouponForm({ code: '', discountPercent: 15, maxUses: 100 });
                          showToast('تمت إضافة الكوبون');
                        }}
                        className="col-span-3 py-2 rounded-xl bg-blue-600 text-white font-black cursor-pointer"
                      >
                        + إضافة
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {coupons.map((c) => (
                        <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                          <span className="font-black text-blue-700">
                            {c.code} — خصم {c.discountPercent}%
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              const nextList = coupons.filter((item) => item.id !== c.id);
                              setCoupons(nextList);
                              await idbSet('coupons_v6', nextList);
                              try {
                                const { db } = firebaseServices;
                                if (db) {
                                  await deleteDoc(
                                    doc(db, 'artifacts', 'el3bakera-edu', 'public', 'data', 'coupons', c.id)
                                  );
                                }
                              } catch {}
                            }}
                            className="text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------
                تبويب 5: الطلبات (ORDERS)
            ------------------------------------------ */}
            {adminTab === 'orders' && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-black text-slate-900">سجل طلبات المعلمين ({orders.length})</h3>
                  {orders.some((o) => o.status === 'تم التسليم ومكتمل') && (
                    <button
                      type="button"
                      onClick={async () => {
                        const completedIds = orders
                          .filter((o) => o.status === 'تم التسليم ومكتمل')
                          .map((o) => o.id);
                        setOrders((prev) => prev.filter((o) => o.status !== 'تم التسليم ومكتمل'));
                        try {
                          const { db } = firebaseServices;
                          if (db) {
                            const basePath = ['artifacts', 'el3bakera-edu', 'public', 'data'];
                            await Promise.all(
                              completedIds.map((id) =>
                                deleteDoc(doc(db, ...basePath, 'orders', id)).catch(() => {})
                              )
                            );
                          }
                        } catch {}
                        showToast(`تم حذف ${completedIds.length} طلب مكتمل بنجاح`);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف جميع الطلبات المكتملة</span>
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <p className="text-slate-500 font-bold py-8 text-center">لا توجد طلبات مسجلة حتى الآن.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className={`p-4 rounded-2xl border space-y-2.5 ${
                          ord.status === 'تم التسليم ومكتمل'
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 font-black">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-blue-600">
                              #{ord.id} — {ord.teacherName} ({ord.phone1})
                            </span>
                            {ord.seriesName && (
                              <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                                سلسلة: {ord.seriesName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-emerald-700 text-sm">{ord.total} ج.م</span>
                            <select
                              value={ord.status || 'قيد المراجعة والتجهيز'}
                              onChange={async (e) => {
                                const nextStatus = e.target.value;
                                setOrders((prev) =>
                                  prev.map((item) =>
                                    item.id === ord.id ? { ...item, status: nextStatus } : item
                                  )
                                );
                                try {
                                  const { db } = firebaseServices;
                                  if (db) {
                                    await setDoc(
                                      doc(db, 'artifacts', 'el3bakera-edu', 'public', 'data', 'orders', ord.id),
                                      { status: nextStatus },
                                      { merge: true }
                                    );
                                  }
                                } catch {}
                                showToast('تم تحديث حالة الطلب');
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-black text-[11px]"
                            >
                              <option value="قيد المراجعة والتجهيز">قيد المراجعة والتجهيز</option>
                              <option value="جاري التنفيذ والتخصيص">جاري التنفيذ والتخصيص</option>
                              <option value="تم التسليم ومكتمل">تم التسليم ومكتمل</option>
                            </select>

                            <button
                              type="button"
                              onClick={async () => {
                                setOrders((prev) => prev.filter((item) => item.id !== ord.id));
                                try {
                                  const { db } = firebaseServices;
                                  if (db) {
                                    const basePath = ['artifacts', 'el3bakera-edu', 'public', 'data'];
                                    await deleteDoc(doc(db, ...basePath, 'orders', ord.id));
                                    await deleteDoc(doc(db, ...basePath, 'config', `order_logo_${ord.id}`)).catch(
                                      () => {}
                                    );
                                  }
                                } catch {}
                                showToast('تم حذف الطلب بنجاح');
                              }}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                              title="حذف الطلب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="text-slate-600 font-bold">
                          المذكرات: {(ord.items || []).map((i) => i.title).join(' + ')}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span>
                            الشعار: {safeText(ord.hasLogo)}
                            {ord.logoText ? ` — النص: "${safeText(ord.logoText)}"` : ''}
                          </span>

                          {(ord.logoDataUrl || ord.hasUploadedLogo || ord.hasLogo === 'رفع صورة الشعار الآن بالجودة الكاملة') && (
                            <button
                              type="button"
                              onClick={async () => {
                                let finalLogoUrl = ord.logoDataUrl;
                                if (!finalLogoUrl && firebaseServices.db) {
                                  const basePath = ['artifacts', 'el3bakera-edu', 'public', 'data'];
                                  const count = Number(ord.logoChunksCount || 0);
                                  if (count > 1) {
                                    const chunkSnaps = await Promise.all(
                                      Array.from({ length: count }, (_, idx) =>
                                        getDoc(doc(firebaseServices.db, ...basePath, 'orders', `${ord.id}_logo_${idx}`)).catch(() => null)
                                      )
                                    );
                                    const assembled = chunkSnaps
                                      .filter((s) => s && s.exists())
                                      .map((s) => s.data()?.dataUrl || '')
                                      .join('');
                                    if (assembled) finalLogoUrl = assembled;
                                  }
                                  if (!finalLogoUrl) {
                                    try {
                                      const freshOrderSnap = await getDoc(
                                        doc(firebaseServices.db, ...basePath, 'orders', ord.id)
                                      );
                                      if (freshOrderSnap.exists() && freshOrderSnap.data()?.logoDataUrl) {
                                        finalLogoUrl = freshOrderSnap.data().logoDataUrl;
                                      }
                                    } catch {}
                                  }
                                  if (!finalLogoUrl) {
                                    try {
                                      const snap = await getDoc(
                                        doc(firebaseServices.db, ...basePath, 'config', `order_logo_${ord.id}`)
                                      );
                                      if (snap.exists()) finalLogoUrl = snap.data()?.dataUrl;
                                    } catch {}
                                  }
                                }
                                if (!finalLogoUrl) {
                                  showToast('لم يقم العميل بإرفاق ملف الشعار في هذا الطلب', 'error');
                                  return;
                                }
                                const a = document.createElement('a');
                                a.href = finalLogoUrl;
                                a.download = ord.logoFileName || `logo_${ord.teacherName}_${ord.id}.png`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                showToast('تم تحميل شعار المعلم بالجودة الكاملة');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>تحميل شعار المعلم بالجودة الكاملة</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------
                تبويب 6: الهوية والشعار والروابط
            ------------------------------------------ */}
            {adminTab === 'identity' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
                  <h3 className="text-base font-black text-slate-900">الهوية والشعار وخلفية الرئيسية</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <label className="block font-black text-slate-800">شعار المنصة</label>
                      <img src={resolvedLogo} alt="logo" className="w-14 h-14 rounded-xl object-cover" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const img = await compressImageFile(file, 300, 0.85);
                          setSettings({ ...settings, logoImage: img });
                        }}
                        className="w-full text-[10px]"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <label className="block font-black text-slate-800">خلفية الشاشة الرئيسية</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const img = await compressImageFile(file, 900, 0.72);
                          setSettings({ ...settings, heroBgImage: img });
                        }}
                        className="w-full text-[10px]"
                      />
                      <label className="block font-bold text-slate-600">
                        درجة التعتيم: {settings.heroOverlayOpacity}%
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={95}
                        value={settings.heroOverlayOpacity}
                        onChange={(e) =>
                          setSettings({ ...settings, heroOverlayOpacity: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">اسم المنصة</label>
                    <input
                      type="text"
                      value={settings.platformName}
                      onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">رقم الواتساب</label>
                      <input
                        type="text"
                        value={settings.whatsappNumber}
                        onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">رقم فودافون كاش</label>
                      <input
                        type="text"
                        value={settings.vodafoneCashNumber}
                        onChange={(e) => setSettings({ ...settings, vodafoneCashNumber: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">رمز دخول الإدارة الاحتياطي</label>
                    <input
                      type="text"
                      value={settings.adminPin}
                      onChange={(e) => setSettings({ ...settings, adminPin: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await saveSettings(settings);
                      showToast('تم حفظ ونشر إعدادات الهوية والشعار بنجاح');
                    }}
                    className="w-full py-3 rounded-2xl bg-blue-600 text-white font-black text-sm cursor-pointer"
                  >
                    حفظ تعديلات الهوية والشعار
                  </button>
                </div>

                {/* روابط التواصل وقريباً على المنصة */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-5">
                  <div className="space-y-3">
                    <h3 className="text-base font-black text-slate-900">روابط التواصل الاجتماعي</h3>
                    <div className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="اسم الرابط"
                        value={newSocialForm.label}
                        onChange={(e) => setNewSocialForm({ ...newSocialForm, label: e.target.value })}
                        className="col-span-5 px-3 py-2 rounded-xl border border-slate-200 font-bold"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newSocialForm.url}
                        onChange={(e) => setNewSocialForm({ ...newSocialForm, url: e.target.value })}
                        className="col-span-5 px-3 py-2 rounded-xl border border-slate-200 font-bold"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newSocialForm.label.trim() || !newSocialForm.url.trim()) return;
                          const nextLinks = [
                            ...settings.socialLinks,
                            { id: `soc_${Date.now()}`, label: newSocialForm.label.trim(), url: newSocialForm.url.trim() }
                          ];
                          await saveSettings({ ...settings, socialLinks: nextLinks });
                          setNewSocialForm({ label: '', url: '' });
                          showToast('تمت إضافة الرابط وحفظه');
                        }}
                        className="col-span-2 py-2 rounded-xl bg-blue-600 text-white font-black cursor-pointer"
                      >
                        إضافة
                      </button>
                    </div>

                    <div className="space-y-2">
                      {settings.socialLinks.map((link) => (
                        <div key={link.id} className="p-2.5 rounded-xl bg-slate-50 flex items-center gap-2">
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => {
                              const nextLinks = settings.socialLinks.map((l) =>
                                l.id === link.id ? { ...l, label: e.target.value } : l
                              );
                              setSettings({ ...settings, socialLinks: nextLinks });
                            }}
                            className="w-1/3 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                          />
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => {
                              const nextLinks = settings.socialLinks.map((l) =>
                                l.id === link.id ? { ...l, url: e.target.value } : l
                              );
                              setSettings({ ...settings, socialLinks: nextLinks });
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const nextLinks = settings.socialLinks.filter((l) => l.id !== link.id);
                              await saveSettings({ ...settings, socialLinks: nextLinks });
                              showToast('تم حذف الرابط');
                            }}
                            className="p-1.5 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await saveSettings(settings);
                        showToast('تم حفظ روابط التواصل بنجاح');
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black cursor-pointer"
                    >
                      حفظ تعديلات روابط التواصل
                    </button>
                  </div>

                  {/* إدارة ركن قريباً على المنصة */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <h3 className="text-base font-black text-slate-900">إدارة ركن قريباً على المنصة</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="عنوان المذكرة القادمة"
                        value={newUpcomingForm.title}
                        onChange={(e) => setNewUpcomingForm({ ...newUpcomingForm, title: e.target.value })}
                        className="px-3 py-2 rounded-xl border border-slate-200 font-bold"
                      />
                      <input
                        type="text"
                        placeholder="المرحلة"
                        value={newUpcomingForm.stageName}
                        onChange={(e) => setNewUpcomingForm({ ...newUpcomingForm, stageName: e.target.value })}
                        className="px-3 py-2 rounded-xl border border-slate-200 font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newUpcomingForm.title.trim()) return;
                        const nextUp = [
                          ...(settings.upcomingItems || []),
                          { id: `up_${Date.now()}`, ...newUpcomingForm }
                        ];
                        await saveSettings({ ...settings, upcomingItems: nextUp });
                        setNewUpcomingForm({
                          title: '',
                          stageName: 'المرحلة الإعدادية',
                          statusText: 'جاري التجهيز والتنسيق',
                          expectedDate: 'قريباً'
                        });
                        showToast('تمت الإضافة لقسم قريباً');
                      }}
                      className="w-full py-2 rounded-xl bg-blue-600 text-white font-black cursor-pointer"
                    >
                      + إضافة إعلان مذكرة قادمة
                    </button>
                    <div className="space-y-1.5">
                      {(settings.upcomingItems || []).map((u) => (
                        <div key={u.id} className="p-2 rounded-xl bg-slate-50 flex items-center justify-between">
                          <span className="font-bold">{u.title}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              const nextUp = settings.upcomingItems.filter((item) => item.id !== u.id);
                              await saveSettings({ ...settings, upcomingItems: nextUp });
                            }}
                            className="text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------
                تبويب 7: النسخ الاحتياطي JSON
            ------------------------------------------ */}
            {adminTab === 'backup' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 text-xs">
                <h3 className="text-base font-black text-slate-900">تصدير واستيراد نسخة احتياطية JSON</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadBackupFile}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل ملف النسخة الاحتياطية الآن</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const [dbSettings, dbProducts, dbBundles, dbCoupons] = await Promise.all([
                        idbGet('settings_v7'),
                        idbGet('products_v6'),
                        idbGet('bundles_v6'),
                        idbGet('coupons_v6')
                      ]);
                      const jsonStr = JSON.stringify(
                        {
                          settings: dbSettings || settings,
                          products: Array.isArray(dbProducts) && dbProducts.length > 0 ? dbProducts : products,
                          bundles: Array.isArray(dbBundles) && dbBundles.length > 0 ? dbBundles : bundles,
                          coupons: Array.isArray(dbCoupons) && dbCoupons.length > 0 ? dbCoupons : coupons
                        },
                        null,
                        2
                      );
                      setJsonBackupText(jsonStr);
                      showToast('تم عرض بيانات النسخة الاحتياطية في الصندوق بالأسفل');
                    }}
                    className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black cursor-pointer"
                  >
                    عرض البيانات كنص
                  </button>
                </div>

                <textarea
                  rows={6}
                  placeholder="الصق محتوى ملف JSON هنا لاستعادته أو اضغط عرض البيانات كنص..."
                  value={jsonBackupText}
                  onChange={(e) => setJsonBackupText(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const parsed = JSON.parse(jsonBackupText);
                      if (parsed.settings) await saveSettings({ ...settings, ...parsed.settings });
                      if (Array.isArray(parsed.products)) {
                        setProducts(parsed.products);
                        await idbSet('products_v6', parsed.products);
                      }
                      if (Array.isArray(parsed.bundles)) {
                        setBundles(parsed.bundles);
                        await idbSet('bundles_v6', parsed.bundles);
                      }
                      if (Array.isArray(parsed.coupons)) {
                        setCoupons(parsed.coupons);
                        await idbSet('coupons_v6', parsed.coupons);
                      }
                      showToast('تم استيراد النسخة الاحتياطية بنجاح');
                    } catch {
                      showToast('صيغة JSON غير صالحة', 'error');
                    }
                  }}
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white font-black cursor-pointer"
                >
                  استعادة البيانات من النص
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ==========================================
          الفوتر (Footer)
      ========================================== */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img src={resolvedLogo} alt="logo" className="w-10 h-10 rounded-xl object-cover" />
              <h3 className="text-base font-black text-white">{safeText(settings.platformName)}</h3>
            </div>
            <p className="text-slate-400 leading-relaxed">{safeText(settings.platformTagline)}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-black text-white">روابط سريعة</h4>
            <div className="flex flex-col gap-1.5">
              <button onClick={() => navigateToTab('home')} className="text-right hover:text-amber-400 cursor-pointer">
                الرئيسية
              </button>
              <button onClick={() => navigateToTab('library')} className="text-right hover:text-amber-400 cursor-pointer">
                مكتبة المذكرات
              </button>
              <button onClick={() => navigateToTab('bundles')} className="text-right hover:text-amber-400 cursor-pointer">
                العروض والباقات
              </button>
              <button onClick={() => navigateToTab('track')} className="text-right hover:text-amber-400 cursor-pointer">
                تتبع طلبك
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-black text-white">تواصل معنا وتابعنا</h4>
            <div className="flex flex-wrap gap-2">
              {settings.socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={safeText(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-blue-600 text-white font-bold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>{safeText(link.label)}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ==========================================
          نافذة معاينة تفاصيل المذكرة والعينات (مع السحب باللمس وملء الشاشة)
      ========================================== */}
      {previewProduct && (
        <div
          onClick={() => {
            if (!isFullscreenSample) setPreviewProduct(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col ${
              isFullscreenSample
                ? 'fixed inset-0 z-[70] rounded-none max-w-none h-screen'
                : 'max-w-3xl rounded-3xl max-h-[92vh]'
            }`}
          >
            {/* رأس النافذة */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                <h3 className="text-xs sm:text-sm font-black truncate">{safeText(previewProduct.title)}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsFullscreenSample((prev) => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  {isFullscreenSample ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span>{isFullscreenSample ? 'تصغير' : 'ملء الشاشة'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsFullscreenSample(false);
                    setPreviewProduct(null);
                  }}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* عارض الصور مع دعم السحب لليمين واليسار */}
            <div
              onTouchStart={handleSampleTouchStart}
              onTouchEnd={handleSampleTouchEnd}
              onMouseDown={handleSampleMouseDown}
              onMouseUp={handleSampleMouseUp}
              className={`relative bg-slate-950 flex items-center justify-center select-none touch-pan-y overflow-hidden ${
                isFullscreenSample ? 'flex-1' : 'h-72 sm:h-96'
              }`}
            >
              {previewImagesList.length > 0 && (
                <img
                  src={previewImagesList[activeSampleIdx] || previewImagesList[0]}
                  alt={`صفحة ${activeSampleIdx + 1}`}
                  draggable={false}
                  className="max-h-full max-w-full object-contain transition-all duration-200"
                />
              )}

              {previewImagesList.length > 1 && (
                <>
                  <button
                    onClick={goPrevSample}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-lg flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goNextSample}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-lg flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-slate-900/85 text-white text-[11px] font-black">
                صفحة {activeSampleIdx + 1} من {previewImagesList.length} (اسحب يميناً أو يساراً)
              </div>
            </div>

            {/* شريط المصغرات */}
            {previewImagesList.length > 1 && (
              <div
                ref={thumbnailsContainerRef}
                className="bg-slate-100 px-3 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 border-b border-slate-200"
              >
                {previewImagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSampleIdx(idx)}
                    className={`w-12 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                      activeSampleIdx === idx ? 'border-blue-600 scale-105 shadow-sm' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* تفاصيل المذكرة والتنبيهات في الوضع العادي */}
            {!isFullscreenSample && (
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {settings.generalNotice?.enabled !== false &&
                  settings.generalNotice?.position === 'top' && (
                    <div
                      style={{
                        backgroundColor: settings.generalNotice.bgColor || '#fffbeb',
                        color: settings.generalNotice.textColor || '#78350f'
                      }}
                      className="p-3.5 rounded-2xl border border-black/5 space-y-1"
                    >
                      <div className="font-black">{safeText(settings.generalNotice.title)}</div>
                      <div className="whitespace-pre-line leading-relaxed font-medium">
                        {safeText(settings.generalNotice.text)}
                      </div>
                    </div>
                  )}

                <div>
                  <h4 className="text-base font-black text-slate-900 mb-1">{safeText(previewProduct.title)}</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {safeText(previewProduct.description)}
                  </p>
                </div>

                {settings.productNoticeStyle?.showInPreview !== false &&
                  safeText(previewProduct.tipText).trim() && (
                    <div
                      style={{
                        backgroundColor: settings.productNoticeStyle.bgColor || '#eff6ff',
                        color: settings.productNoticeStyle.textColor || '#1e3a8a'
                      }}
                      className="p-3.5 rounded-2xl border border-black/5 font-bold leading-relaxed"
                    >
                      {safeText(previewProduct.tipText)}
                    </div>
                  )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-blue-600">{previewProduct.price} ج.م</span>
                    {Number(previewProduct.originalPrice) > Number(previewProduct.price) && (
                      <span className="text-xs text-slate-400 line-through font-bold">
                        {previewProduct.originalPrice} ج.م
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {safeText(previewProduct.driveSampleUrl).trim() && (
                      <a
                        href={safeText(previewProduct.driveSampleUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: safeText(settings.driveButtonBgColor, '#ecfdf5'),
                          color: safeText(settings.driveButtonTextColor, '#047857')
                        }}
                        className="px-4 py-3 rounded-2xl font-black flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>{safeText(settings.driveButtonLabel, 'معاينة عينة Google Drive')}</span>
                      </a>
                    )}

                    <button
                      onClick={() => {
                        addToCart(previewProduct, 'notebook');
                        setIsFullscreenSample(false);
                        setPreviewProduct(null);
                      }}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer"
                    >
                      اطلبها مخصصة باسمك
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          نافذة سلة الطلبات والتخصيص
      ========================================== */}
      {isCartOpen && (
        <div
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            <div className="p-5 space-y-5 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900">سلة الطلبات والتخصيص ({cart.length})</h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-slate-500 font-bold">سلة الطلبات فارغة حالياً</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 truncate">{item.title}</div>
                          <div className="text-blue-600 font-black">{item.price} ج.م</div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* كود الكوبون */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="هل لديك كود خصم؟ (مثال: M20)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 font-black uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-black cursor-pointer"
                      >
                        تطبيق
                      </button>
                    </div>

                    {appliedCoupon && (
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black">
                        <span>
                          الكوبون المفعّل: {appliedCoupon.code} (خصم{' '}
                          {Number(
                            appliedCoupon.discountPercent ?? appliedCoupon.discount ?? appliedCoupon.value ?? 0
                          )}
                          %)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponInput('');
                            showToast('تم إلغاء الكوبون');
                          }}
                          className="text-rose-600 hover:underline cursor-pointer"
                        >
                          إزالة
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ملخص الأسعار */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-600">
                      <span>الإجمالي قبل الخصم:</span>
                      <span>{cartTotals.subtotal} ج.م</span>
                    </div>
                    {cartTotals.finalDiscount > 0 && (
                      <div className="flex justify-between font-black text-emerald-700">
                        <span>{cartTotals.discountReason}:</span>
                        <span>-{cartTotals.finalDiscount} ج.م</span>
                      </div>
                    )}
                    {appliedCoupon && cartTotals.couponEligibleSubtotal < cartTotals.subtotal && (
                      <div className="text-[11px] text-amber-800 font-bold">
                        * الباقات المخفضة مستثناة من كوبون الخصم الإضافي.
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-blue-200">
                      <span>المطلوب سداده:</span>
                      <span className="text-blue-700">{cartTotals.total} ج.م</span>
                    </div>
                  </div>

                  {/* بيانات التخصيص للمعلم */}
                  <form onSubmit={handleConfirmOrder} className="space-y-3">
                    <h4 className="font-black text-slate-900">بيانات التخصيص للمعلم:</h4>
                    <input
                      type="text"
                      required
                      placeholder="اسم المعلم كما سيظهر على المذكرة *"
                      value={customerForm.teacherName}
                      onChange={(e) => setCustomerForm({ ...customerForm, teacherName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="رقم الهاتف الأساسي (واتساب) *"
                      value={customerForm.phone1}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone1: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                    <input
                      type="text"
                      placeholder="اسم السلسلة أو السنتر (اختياري)"
                      value={customerForm.seriesName}
                      onChange={(e) => setCustomerForm({ ...customerForm, seriesName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                    <input
                      type="tel"
                      placeholder="رقم هاتف إضافي للغلاف (اختياري)"
                      value={customerForm.phone2}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone2: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                    <select
                      value={customerForm.hasLogo}
                      onChange={(e) => setCustomerForm({ ...customerForm, hasLogo: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                    >
                      <option value="رفع صورة الشعار الآن بالجودة الكاملة">
                        رفع صورة الشعار الآن بالجودة الكاملة
                      </option>
                      <option value="كتابة نص الشعار">كتابة نص الشعار (نص يوضع على الغلاف والصفحات)</option>
                      <option value="سأرسله على واتساب">لدي شعار خاص وسأرسله على واتساب</option>
                      <option value="بدون شعار (الاسم فقط)">بدون شعار (كتابة الاسم ورقم الهاتف فقط)</option>
                    </select>

                    {customerForm.hasLogo === 'كتابة نص الشعار' && (
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                        <label className="block font-black text-amber-950">
                          اكتب نص الشعار المطلوب:
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: سلسلة الأوائل في اللغة العربية - أ/ أحمد"
                          value={customerForm.logoText}
                          onChange={(e) => setCustomerForm({ ...customerForm, logoText: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-bold"
                        />
                      </div>
                    )}

                    {customerForm.hasLogo === 'رفع صورة الشعار الآن بالجودة الكاملة' && (
                      <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                        <label className="block font-black text-blue-950">
                          اختر ملف الشعار الأصلي (يُرفع بجودته الكاملة دون ضغط):
                        </label>
                        <input
                          type="file"
                          accept="image/*,.svg,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setCustomerForm((prev) => ({
                                ...prev,
                                logoFileName: file.name,
                                logoDataUrl: ev.target?.result || ''
                              }));
                              showToast(`تم إرفاق الشعار (${file.name}) بالجودة الكاملة`);
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="w-full text-xs"
                        />
                        {customerForm.logoDataUrl && customerForm.logoDataUrl.startsWith('data:image') && (
                          <div className="flex items-center gap-2 pt-1">
                            <img
                              src={customerForm.logoDataUrl}
                              alt="معاينة الشعار"
                              className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 p-1"
                            />
                            <span className="text-[11px] font-black text-emerald-700 truncate">
                              ✓ جاهز بالجودة الكاملة: {customerForm.logoFileName}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <textarea
                      rows={2}
                      placeholder="أي ملاحظات إضافية للتصميم..."
                      value={customerForm.notes}
                      onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-sm shadow-lg cursor-pointer touch-manipulation"
                    >
                      {isSubmittingOrder ? 'جاري تسجيل وإرسال الطلب...' : 'تأكيد الطلب وإرساله عبر واتساب'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          نافذة تواصل معنا
      ========================================== */}
      {isContactModalOpen && (
        <div
          onClick={() => setIsContactModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">تواصل مع {safeText(settings.platformName)}</h3>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <a
              href={`https://wa.me/${safeText(settings.whatsappNumber, '201068481536').replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>محادثة مباشرة على واتساب</span>
            </a>

            <div className="space-y-2">
              {settings.socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={safeText(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 flex items-center justify-between font-black text-slate-800"
                >
                  <span>{safeText(link.label)}</span>
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          نافذة تسجيل دخول الإدارة
      ========================================== */}
      {isAdminModalOpen && (
        <div
          onClick={() => setIsAdminModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">دخول لوحة الإدارة</h3>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdminGoogleLogin}
              className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm cursor-pointer"
            >
              تسجيل الدخول بحساب جوجل للإدارة
            </button>

            <form onSubmit={handleAdminPinSubmit} className="space-y-3 pt-2 border-t border-slate-100">
              <input
                type="password"
                placeholder="أو أدخل رمز دخول الإدارة..."
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-center"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black cursor-pointer"
              >
                دخول بالرمز
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <PlatformErrorBoundary>
      <MuzakkiratiPlatformInner />
    </PlatformErrorBoundary>
  );
}
