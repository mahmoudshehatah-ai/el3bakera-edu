import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Trash2,
  Edit3,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Package,
  Tag,
  Lock,
  Upload,
  Download,
  Phone,
  MessageCircle,
  Sparkles,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Layers,
  Image as ImageIcon,
  Sliders,
  Truck,
  Database,
  Star,
  UserCheck,
  LogIn,
  RefreshCw,
  Gift
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
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
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs
} from 'firebase/firestore';

// ============================================================================
// تهيئة Firebase الآمنة المربوطة بمشروع el3bakera-edu
// ============================================================================
const PRIMARY_APP_ID = 'el3bakera-edu';
const ADMIN_EMAILS = ['mahmoudelzaaty7@gmail.com', 'mahmoudshehatahmohamed@gmail.com'];

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_du5VY8nJGDJ169Fof9EAlI9x2W2d-14",
  authDomain: "el3bakera-edu.firebaseapp.com",
  projectId: "el3bakera-edu",
  storageBucket: "el3bakera-edu.firebasestorage.app",
  messagingSenderId: "74663879858",
  appId: "1:74663879858:web:4327c0ea1b825dd6c615ab"
};

function resolveFirebaseConfig() {
  try {
    const saved = localStorage.getItem('el3bakera_custom_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_FIREBASE_CONFIG;
}

const activeFirebaseConfig = resolveFirebaseConfig();
let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (activeFirebaseConfig && activeFirebaseConfig.apiKey) {
  try {
    app = getApps().length ? getApp() : initializeApp(activeFirebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.warn('Firebase init skipped:', err);
  }
}

// ============================================================================
// غلاف حماية لمنع الشاشة البيضاء
// ============================================================================
class PlatformErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || String(error || '') };
  }
  componentDidCatch(error) {
    console.error('Platform runtime error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4 shadow-xl">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-black text-slate-900">حدث تعارض مؤقت في البيانات المخزنة</h2>
            <p className="text-sm text-slate-600">اضغط على الزر بالأسفل لإعادة تشغيل المنصة فوراً.</p>
            <button
              onClick={() => {
                try {
                  localStorage.clear();
                  indexedDB.deleteDatabase('el3bakera_persistent_db');
                } catch {}
                window.location.reload();
              }}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 cursor-pointer"
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

// ============================================================================
// البيانات والإعدادات الافتراضية لمنصة العباقرة
// ============================================================================
const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="28" fill="#0f172a"/>
    <circle cx="60" cy="60" r="44" fill="none" stroke="#facc15" stroke-width="3" stroke-dasharray="6 4"/>
    <path d="M60 28 L92 44 L60 60 L28 44 Z" fill="#facc15"/>
    <path d="M40 52 V72 C40 80 80 80 80 72 V52 L60 62 Z" fill="#38bdf8"/>
    <text x="60" y="99" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">العباقرة</text>
  </svg>`
)}`;

const DEFAULT_MULTI_OFFERS = [
  {
    id: 'moff_default_1',
    active: true,
    title: 'عرض خاص عند طلب أكثر من مذكرة!',
    subtitle: 'اطلب مذكرتين فأكثر واحصل على خصم تلقائي 15% يطبق مباشرة في سلة الطلبات مخصصة باسمك وشعارك.',
    badgeText: 'وفر حتى 150 ج.م تلقائياً',
    minItems: 2,
    discountPercent: 15,
    maxDiscount: 150,
    productIds: [],
    bgColor: '#0f172a',
    textColor: '#ffffff'
  }
];

const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة للمذكرات التعليمية',
  platformTagline: 'مذكرات دراسية احترافية مخصصة باسمك وبياناتك الخاصة',
  logoImage: '',
  heroImage: '',
  heroBgImage: '',
  heroOverlayOpacity: 75,
  heroBadge: '✨ جاهزة للطباعة الفورية باسمك وشعارك',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة اسم المعلم، رقم الهاتف، والشعار الخاص به على الغلاف وجميع الصفحات.',
  discountBadgeEnabled: true,
  showDiscountPercent: true,
  showDiscountAmount: true,
  discountBadgePosition: 'top-left',
  discountBadgeBg: '#10b981',
  discountBadgeText: '#ffffff',
  // إعدادات زر معاينة Google Drive
  driveButtonEnabled: true,
  driveButtonShowOnCard: true,
  driveButtonText: 'معاينة عينة Google Drive',
  driveButtonBg: '#ecfdf5',
  driveButtonTextColor: '#047857',
  // إعدادات التنبيه العام المنفصلة (يظهر حصراً في نافذة المعاينة)
  generalNoticeEnabled: true,
  generalNoticeTitle: 'تنبيه هام للمعلمين قبل تأكيد الطلب:',
  generalNoticeText:
    '• يتم تسليم المذكرة بصيغة PDF عالية الدقة جاهزة للطباعة ببيانات المعلم الخاصة دون أي بيانات تخصنا.\n• تُوضع العلامة المائية باسم المعلم أو اسم السلسلة الخاص به على كافة الصفحات، وغير متاح إرسال المذكرات بدونها.',
  generalNoticePosition: 'bottom',
  generalNoticeBg: '#f8fafc',
  generalNoticeTextColor: '#334155',
  // إعدادات التنبيه الخاص بكل مذكرة (مستقل تماماً عن التنبيه العام)
  tipNoticeEnabled: true,
  tipShowOnCard: true,
  tipNoticePosition: 'below-desc',
  tipNoticeBg: '#fffbeb',
  tipNoticeTextColor: '#78350f',
  // إعدادات التحكم في المذكرات الظاهرة على الشاشة الرئيسية
  homeProductsTitle: 'أحدث المذكرات المضافة',
  homeProductsSubtitle: 'اختر المذكرة لمعاينة صفحات العينة وطلبها مخصصة باسمك وشعارك',
  homeProductsMode: 'auto', // 'auto' | 'custom'
  homeProductsCount: 6,
  homeFeaturedProductIds: [],
  // عروض الحصول على أكثر من مذكرة
  multiOffers: DEFAULT_MULTI_OFFERS,
  promoEnabled: true,
  promoText: 'عرض خاص للمعلمين: خصم 15% على جميع المذكرات بمناسبة إطلاق المنصة',
  promoCouponCode: 'M20',
  promoBgColor: '#0654d0',
  promoTextColor: '#fde047',
  whatsappNumber: '201068481536',
  vodafoneCashNumber: '01068481536',
  adminPin: 'lolo12016127374665464',
  bulkDiscountEnabled: true,
  bulkDiscountMinItems: 2,
  bulkDiscountPercent: 15,
  bulkDiscountMaxAmount: 150,
  stages: [
    { id: 'stg_prim', name: 'المرحلة الابتدائية' },
    { id: 'stg_prep', name: 'المرحلة الإعدادية' },
    { id: 'stg_sec', name: 'المرحلة الثانوية' }
  ],
  grades: [
    { id: 'grd_p4', stageId: 'stg_prim', name: 'الصف الرابع الابتدائي' },
    { id: 'grd_p5', stageId: 'stg_prim', name: 'الصف الخامس الابتدائي' },
    { id: 'grd_p6', stageId: 'stg_prim', name: 'الصف السادس الابتدائي' },
    { id: 'grd_1795789580001', stageId: 'stg_prep', name: 'الصف الأول الإعدادي' },
    { id: 'grd_1795789580002', stageId: 'stg_prep', name: 'الصف الثاني الإعدادي' },
    { id: 'grd_1795789580003', stageId: 'stg_prep', name: 'الصف الثالث الإعدادي' },
    { id: 'grd_sec1', stageId: 'stg_sec', name: 'الصف الأول الثانوي' },
    { id: 'grd_sec2', stageId: 'stg_sec', name: 'الصف الثاني الثانوي' },
    { id: 'grd_1795789612785', stageId: 'stg_sec', name: 'الصف الثالث الثانوي' }
  ],
  categories: [
    {
      id: 'cat_term1',
      name: 'مذكرات الفصل الدراسي الأول',
      subtitle: 'شرح وتدريبات وبنوك مراجعة شاملة',
      coverImage: ''
    },
    {
      id: 'cat_term2',
      name: 'مذكرات الفصل الدراسي الثاني',
      subtitle: 'منسقة ومحدثة وفق أحدث مواصفات الوزارة',
      coverImage: ''
    },
    {
      id: 'cat_courses',
      name: 'كورسات التأسيس والمراجعات النهائية',
      subtitle: 'بناء مهارات الطلاب من الصفر حتى الإتقان',
      coverImage: ''
    }
  ],
  socialLinks: [
    { id: 'soc_fb', platform: 'facebook', label: 'صفحة الفيسبوك', url: 'https://www.facebook.com/share/17bS2p2v12/' },
    { id: 'soc_wa', platform: 'whatsapp', label: 'جروب الواتساب', url: 'https://chat.whatsapp.com/I8vT9t7k8t60H5H7s5X2yG' },
    { id: 'soc_tg', platform: 'telegram', label: 'قناة التيليجرام', url: 'https://t.me/el3bakera_edu' }
  ],
  trustFeatures: [
    {
      id: 'tr_1',
      title: 'محتوى متكامل ومطابق لأحدث المواصفات',
      desc: 'مذكرات منسقة باحترافية وتشمل أسئلة الكتاب المدرسي والتقييمات.'
    },
    {
      id: 'tr_2',
      title: 'تخصيص كامل باسمك ورقم هاتفك وشعارك',
      desc: 'نضع بياناتك الخاصة على الغلاف وجميع الصفحات كعلامة مائية احترافية.'
    },
    {
      id: 'tr_3',
      title: 'جاهزة للطباعة الفورية بصيغة PDF',
      desc: 'ملفات عالية الدقة ومُراجعة لغوياً وفنياً لتوفير وقتك ومجهودك.'
    }
  ],
  upcomingNotebooks: [
    {
      id: 'up_1',
      title: 'مذكرة المراجعة النهائية للصف الأول الثانوي',
      stage: 'المرحلة الثانوية',
      status: 'قيد المراجعة النهائية والتنسيق',
      expectedDate: 'قريباً جداً'
    },
    {
      id: 'up_2',
      title: 'بنك الأسئلة الشامل للصف السادس الابتدائي',
      stage: 'المرحلة الابتدائية',
      status: 'جاري التجهيز والإخراج الفني',
      expectedDate: 'خلال أيام'
    }
  ],
  testimonialsTitle: 'آراء وتقييمات المعلمين في مذكراتنا',
  testimonials: [
    {
      id: 'rev_1',
      teacherName: 'أ/ محمود عبد الرحمن',
      role: 'معلم أول لغة عربية',
      text: 'مذكرات منسقة باحترافية عالية جداً وتغني الطالب عن أي مصدر خارجي، والتخصيص بالاسم والشعار ممتاز.',
      image: ''
    },
    {
      id: 'rev_2',
      teacherName: 'أ/ سارة السيد',
      role: 'معلمة لغة عربية للمرحلة الإعدادية',
      text: 'سرعة في التسليم وجودة طباعة مبهرة، وبنوك المراجعة شاملة لكل أسئلة التقييمات والكتاب المدرسي.',
      image: ''
    }
  ]
};

const DEFAULT_PRODUCTS = [
  {
    id: 'nb_1795789801',
    title: 'بنك مراجعة الصف الثالث الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_1795789580003',
    categoryId: 'cat_term1',
    pagesCount: 109,
    price: 199,
    oldPrice: 250,
    badgeText: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
    tipText: 'ملاحظة: للمراجعة المُثلى اطلبها مع بوكليت الاختبارات',
    description:
      'بنك المراجعة يشمل: تدريبات مكثفة تحاكي أسئلة الامتحان بعدد صفحات 109 صفحة، ويضم أسئلة الكتاب المدرسي وكتاب التقييمات منسقة بشكل احترافي، المذكرة مجابة بالكامل.',
    driveSampleUrl: 'https://drive.google.com/drive/folders/1-sample-prep3',
    coverImage: '',
    sampleImages: [],
    hidden: false
  },
  {
    id: 'nb_1795789802',
    title: 'بنك مراجعة الصف الثاني الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_1795789580002',
    categoryId: 'cat_term1',
    pagesCount: 106,
    price: 149,
    oldPrice: 200,
    badgeText: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
    tipText: 'ملاحظة: للمراجعة المُثلى اطلبها مع بوكليت الاختبارات',
    description:
      'بنك المراجعة يشمل: تدريبات مكثفة تحاكي أسئلة الامتحان بعدد صفحات 106 صفحة، ويضم أسئلة الكتاب المدرسي وكتاب التقييمات منسقة بشكل احترافي، المذكرة مجابة بالكامل.',
    driveSampleUrl: 'https://drive.google.com/drive/folders/1-sample-prep2',
    coverImage: '',
    sampleImages: [],
    hidden: false
  },
  {
    id: 'nb_1795789803',
    title: 'بوكليت الاختبارات الشاملة للصف الثاني الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_1795789580002',
    categoryId: 'cat_term1',
    pagesCount: 48,
    price: 99,
    oldPrice: 150,
    badgeText: 'الخيار الأمثل لتدريب الطالب على الامتحان',
    tipText: 'ملاحظة: يضم أحدث النماذج الاسترشادية مجابة بالكامل',
    description:
      'البوكليت يشمل: 16 امتحانًا شاملًا بعدد صفحات 48 صفحة، تضم النماذج الاسترشادية منسقة بشكل احترافي، المذكرة مجابة بالكامل.',
    driveSampleUrl: 'https://drive.google.com/drive/folders/1-sample-prep2-booklet',
    coverImage: '',
    sampleImages: [],
    hidden: false
  },
  {
    id: 'nb_1795789804',
    title: 'بنك مراجعة الصف الأول الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_1795789580001',
    categoryId: 'cat_term1',
    pagesCount: 98,
    price: 149,
    oldPrice: 200,
    badgeText: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
    tipText: 'ملاحظة: شاملة أسئلة التقييمات الأسبوعية والكتاب المدرسي',
    description:
      'بنك المراجعة يشمل: تدريبات مكثفة تحاكي أسئلة الامتحان بعدد صفحات 98 صفحة، ويضم أسئلة الكتاب المدرسي وكتاب التقييمات منسقة بشكل احترافي.',
    driveSampleUrl: 'https://drive.google.com/drive/folders/1-sample-prep1',
    coverImage: '',
    sampleImages: [],
    hidden: false
  },
  {
    id: 'nb_1795789805',
    title: 'بوكليت الامتحانات النهائية للصف الثالث الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_1795789580003',
    categoryId: 'cat_term1',
    pagesCount: 52,
    price: 99,
    oldPrice: 150,
    badgeText: 'الخيار الأمثل لتدريب الطالب على الامتحان',
    tipText: 'ملاحظة: تدريبات مكثفة على نظام البوكليت الجديد',
    description:
      'بوكليت الامتحانات النهائية للصف الثالث الإعدادي: يضم 18 امتحانًا شاملًا وفق أحدث مواصفات الورقة الامتحانية مجابة بالكامل.',
    driveSampleUrl: 'https://drive.google.com/drive/folders/1-sample-prep3-booklet',
    coverImage: '',
    sampleImages: [],
    hidden: false
  },
  {
    id: 'nb_1795789806',
    title: 'منهج الترم الثاني للصف الثالث الثانوي',
    subject: 'اللغة العربية',
    stageId: 'stg_sec',
    gradeId: 'grd_1795789612785',
    categoryId: 'cat_term2',
    pagesCount: 140,
    price: 249,
    oldPrice: 300,
    badgeText: 'الاختيار الأمثل للمعلم لشرح وتدريبات الصف الثالث الثانوي',
    tipText: 'ملاحظة: متاحة بالنسخة المحلولة ونسخة الطالب',
    description:
      'مذكرة الشرح والتدريبات المتكاملة للصف الثالث الثانوي: تشمل شرحًا مبسطًا وتدريبات متدرجة على كافة فروع المادة وفق أحدث مواصفات الثانوية العامة.',
    driveSampleUrl: 'https://drive.google.com/drive/folders/1-sample-sec3',
    coverImage: '',
    sampleImages: [],
    hidden: false
  }
];

const DEFAULT_BUNDLES = [
  {
    id: 'bnd_prep_master',
    title: 'باقة مراجعات التقفيل الشاملة للمرحلة الإعدادية',
    subtitle:
      'تشمل بنوك المراجعة وبوكليتات الامتحانات النهائية للصفوف الأول والثاني والثالث الإعدادي مخصصة بالكامل باسمك وشعارك.',
    price: 649,
    originalPrice: 895,
    badge: 'وفر 246 ج.م',
    productIds: ['nb_1795789801', 'nb_1795789802', 'nb_1795789803', 'nb_1795789804', 'nb_1795789805']
  }
];

const DEFAULT_COUPONS = [
  { id: 'cp_m20', code: 'M20', discountPercent: 15, maxDiscount: 200, active: true },
  { id: 'cp_next15', code: 'NEXT15', discountPercent: 15, maxDiscount: 200, active: true },
  { id: 'cp_vip7906', code: 'VIP7906', discountPercent: 20, maxDiscount: 250, active: true }
];

// ============================================================================
// دوال المساعدة والتخزين
// ============================================================================
function safeText(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.name || val.title || val.label || fallback;
  }
  return fallback;
}

function normalizeItems(rawList, fallbackList, prefix) {
  if (!Array.isArray(rawList) || rawList.length === 0) return fallbackList;
  return rawList.map((item, idx) => {
    if (typeof item === 'string') {
      return { id: `${prefix}_${idx}`, name: item };
    }
    const resolvedName = safeText(item.name || item.title || item.label, `عنصر ${idx + 1}`);
    return {
      ...item,
      id: item.id || `${prefix}_${idx}`,
      name: resolvedName
    };
  });
}

function renderSocialPlatformIcon(soc, className = 'w-4 h-4') {
  const url = safeText(soc?.url).toLowerCase();
  const label = safeText(soc?.label).toLowerCase();
  const platform = safeText(soc?.platform).toLowerCase();

  if (platform === 'facebook' || url.includes('facebook.com') || url.includes('fb.com') || label.includes('فيس')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
      </svg>
    );
  }
  if (platform === 'telegram' || url.includes('t.me') || url.includes('telegram') || label.includes('تيليجرام') || label.includes('تليجرام')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    );
  }
  if (platform === 'whatsapp' || url.includes('wa.me') || url.includes('whatsapp') || label.includes('واتس')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.2c-.151.512.334.996.846.846l3.032-.892A9.954 9.954 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
      </svg>
    );
  }
  return <ExternalLink className={className} />;
}

function compressImageFile(file, maxWidth = 550, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function recompressDataUrl(dataUrl, maxWidth = 750, quality = 0.65) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// تقسيم وحفظ كل صورة في مستند منفصل في السحابة مع ضغط تلقائي ذكي إذا تجاوز الحجم 650KB
async function saveMediaAssetToCloud(dbInstance, appId, assetId, dataUrl) {
  if (!dbInstance) return;
  const mediaCol = collection(dbInstance, 'artifacts', appId, 'public', 'data', 'config');
  const docId = `media_${assetId}`;
  if (!dataUrl) {
    try {
      await deleteDoc(doc(mediaCol, docId));
    } catch {}
    return;
  }
  let finalDataUrl = dataUrl;
  if (finalDataUrl.length > 650000) {
    finalDataUrl = await recompressDataUrl(finalDataUrl, 750, 0.65);
  }
  if (finalDataUrl.length > 650000) {
    finalDataUrl = await recompressDataUrl(finalDataUrl, 560, 0.55);
  }
  await setDoc(doc(mediaCol, docId), {
    assetId,
    dataUrl: finalDataUrl,
    updatedAt: Date.now()
  });
}

const IDB_NAME = 'el3bakera_persistent_db';
const IDB_STORE = 'kv_store';

function idbSet(key, val) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(IDB_STORE)) {
          req.result.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        const tx = req.result.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(val, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      };
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

function idbGet(key) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(IDB_STORE)) {
          req.result.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        const tx = req.result.transaction(IDB_STORE, 'readonly');
        const getReq = tx.objectStore(IDB_STORE).get(key);
        getReq.onsuccess = () => resolve(getReq.result ?? null);
        getReq.onerror = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function safeLocalSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function stripHeavyProductMedia(list) {
  if (!Array.isArray(list)) return [];
  return list.map(({ sampleImages, ...rest }) => ({
    ...rest,
    coverImage:
      typeof rest.coverImage === 'string' && rest.coverImage.length < 150000
        ? rest.coverImage
        : ''
  }));
}

// ============================================================================
// المكون الرئيسي للمنصة
// ============================================================================
function MuzakkiratiPlatformContent() {
  const [user, setUser] = useState(null);

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_active_tab') || 'home';
      const isAuthed = localStorage.getItem('el3bakera_admin_auth') === 'true';
      if (saved === 'admin' && !isAuthed) return 'home';
      return saved;
    } catch {
      return 'home';
    }
  });
  const [tabHistory, setTabHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_active_tab') || 'home';
      const isAuthed = localStorage.getItem('el3bakera_admin_auth') === 'true';
      const initial = saved === 'admin' && !isAuthed ? 'home' : saved;
      return initial === 'home' ? ['home'] : ['home', initial];
    } catch {
      return ['home'];
    }
  });
  const [selectedCategory, setSelectedCategory] = useState('all');

  const navigateToTab = (newTab) => {
    if (newTab === activeTab) return;
    setTabHistory((prev) => [...prev, newTab]);
    setActiveTab(newTab);
    try {
      localStorage.setItem('el3bakera_active_tab', newTab);
      window.history.pushState({ tab: newTab }, '', newTab === 'admin' ? '#admin' : `#${newTab}`);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (previewProduct) {
      setPreviewProduct(null);
      setIsSampleFullscreen(false);
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
    setTabHistory((prev) => {
      if (prev.length > 1) {
        const nextHistory = prev.slice(0, -1);
        const prevTab = nextHistory[nextHistory.length - 1] || 'home';
        setActiveTab(prevTab);
        try {
          localStorage.setItem('el3bakera_active_tab', prevTab);
        } catch {}
        return nextHistory;
      }
      setActiveTab('home');
      try {
        localStorage.setItem('el3bakera_active_tab', 'home');
      } catch {}
      return ['home'];
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_settings_v7');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_products_v5');
      return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  });

  const [bundles, setBundles] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_bundles_v5');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_BUNDLES;
      return Array.isArray(parsed) ? parsed : DEFAULT_BUNDLES;
    } catch {
      return DEFAULT_BUNDLES;
    }
  });

  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_coupons_v5');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_COUPONS;
      return Array.isArray(parsed) ? parsed : DEFAULT_COUPONS;
    } catch {
      return DEFAULT_COUPONS;
    }
  });

  const [orders, setOrders] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');

  const [previewProduct, setPreviewProduct] = useState(null);
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [isSampleFullscreen, setIsSampleFullscreen] = useState(false);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const touchEndXRef = useRef(null);
  const isMouseDraggingRef = useRef(false);
  const sampleThumbsRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    teacherName: '',
    phone1: '',
    seriesName: '',
    phone2: '',
    hasLogo: 'نعم، سأرسله على الواتساب',
    notes: ''
  });

  const [trackPhone, setTrackPhone] = useState('');
  const [trackOrderId, setTrackOrderId] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      if (localStorage.getItem('el3bakera_manual_logout') === 'true') return false;
      return localStorage.getItem('el3bakera_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState('products');
  const logoTapCountRef = useRef(0);
  const logoTapTimerRef = useRef(null);
  const isSavingRef = useRef(false);

  // ربط زر الرجوع الفعلي في الهاتف والمتصفح
  useEffect(() => {
    const onPopState = (event) => {
      if (previewProduct) {
        setPreviewProduct(null);
        setIsSampleFullscreen(false);
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
      const targetTab = event.state?.tab || 'home';
      setActiveTab(targetTab);
      try {
        localStorage.setItem('el3bakera_active_tab', targetTab);
      } catch {}
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [previewProduct, isCartOpen, isContactModalOpen, isAdminModalOpen]);

  // تحميل البيانات من IndexedDB عند بدء التشغيل
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [idbSettings, idbProducts, idbBundles, idbCoupons] = await Promise.all([
        idbGet('settings_v7'),
        idbGet('products_v5'),
        idbGet('bundles_v5'),
        idbGet('coupons_v5')
      ]);
      if (!mounted) return;
      if (idbSettings) setSettings((prev) => ({ ...prev, ...idbSettings }));
      if (Array.isArray(idbProducts) && idbProducts.length > 0) setProducts(idbProducts);
      if (Array.isArray(idbBundles) && idbBundles.length > 0) setBundles(idbBundles);
      if (Array.isArray(idbCoupons) && idbCoupons.length > 0) setCoupons(idbCoupons);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    title: '',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_1795789580003',
    categoryId: 'cat_term1',
    pagesCount: 80,
    price: 149,
    oldPrice: 200,
    badgeText: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
    tipText: '',
    description: '',
    driveSampleUrl: 'https://drive.google.com/',
    coverImage: '',
    sampleImages: [],
    hidden: false
  });

  const [editingBundleId, setEditingBundleId] = useState(null);
  const [newBundleForm, setNewBundleForm] = useState({
    title: '',
    subtitle: '',
    price: 499,
    originalPrice: 650,
    badge: 'وفر 150 ج.م',
    driveSampleUrl: '',
    productIds: []
  });

  const [editingMultiOfferId, setEditingMultiOfferId] = useState(null);
  const [multiOfferForm, setMultiOfferForm] = useState({
    title: '',
    subtitle: '',
    badgeText: 'وفر 15% تلقائياً',
    minItems: 2,
    discountPercent: 15,
    maxDiscount: 150,
    productIds: [],
    bgColor: '#0f172a',
    textColor: '#ffffff',
    active: true
  });

  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    discountPercent: 15,
    maxDiscount: 200,
    active: true
  });

  const [newStageName, setNewStageName] = useState('');
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeStageId, setNewGradeStageId] = useState('stg_prep');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySubtitle, setNewCategorySubtitle] = useState('');
  const [newSocialLabel, setNewSocialLabel] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newUpcomingForm, setNewUpcomingForm] = useState({
    title: '',
    stage: 'المرحلة الإعدادية',
    status: 'جاري التجهيز والتنسيق',
    expectedDate: 'قريباً'
  });
  const [cloudSyncStatus, setCloudSyncStatus] = useState('checking');

  const [toast, setToast] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const isOfficialAdminGoogle = Boolean(
    user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  );

  const normalizedStages = useMemo(
    () => normalizeItems(settings.stages, DEFAULT_SETTINGS.stages, 'stg'),
    [settings.stages]
  );
  const normalizedGrades = useMemo(
    () => normalizeItems(settings.grades, DEFAULT_SETTINGS.grades, 'grd'),
    [settings.grades]
  );
  const normalizedCategories = useMemo(
    () => normalizeItems(settings.categories, DEFAULT_SETTINGS.categories, 'cat'),
    [settings.categories]
  );
  const safeSocialLinks = useMemo(
    () => (Array.isArray(settings.socialLinks) ? settings.socialLinks : DEFAULT_SETTINGS.socialLinks),
    [settings.socialLinks]
  );
  const safeTrustFeatures = useMemo(
    () => (Array.isArray(settings.trustFeatures) ? settings.trustFeatures : DEFAULT_SETTINGS.trustFeatures),
    [settings.trustFeatures]
  );
  const safeUpcoming = useMemo(
    () => (Array.isArray(settings.upcomingNotebooks) ? settings.upcomingNotebooks : []),
    [settings.upcomingNotebooks]
  );
  const safeTestimonials = useMemo(
    () => (Array.isArray(settings.testimonials) ? settings.testimonials : []),
    [settings.testimonials]
  );
  const safeMultiOffers = useMemo(
    () => (Array.isArray(settings.multiOffers) ? settings.multiOffers : DEFAULT_MULTI_OFFERS),
    [settings.multiOffers]
  );

  const visibleProducts = useMemo(
    () => (Array.isArray(products) ? products : DEFAULT_PRODUCTS).filter((p) => p && !p.hidden),
    [products]
  );

  // المذكرات التي تظهر على الشاشة الرئيسية وفق تحكم المدير
  const homeDisplayedProducts = useMemo(() => {
    const mode = settings.homeProductsMode || 'auto';
    if (mode === 'custom') {
      const selectedIds = Array.isArray(settings.homeFeaturedProductIds)
        ? settings.homeFeaturedProductIds
        : [];
      return selectedIds
        .map((id) => visibleProducts.find((p) => p.id === id))
        .filter(Boolean);
    }
    const maxCount = Math.max(1, Number(settings.homeProductsCount || 6));
    return visibleProducts.slice(0, maxCount);
  }, [visibleProducts, settings.homeProductsMode, settings.homeFeaturedProductIds, settings.homeProductsCount]);

  // فتح الإدارة عبر #admin أو 5 نقرات على الشعار
  useEffect(() => {
    const checkAdminHash = () => {
      if (window.location.hash === '#admin') {
        const manualOut = localStorage.getItem('el3bakera_manual_logout') === 'true';
        if (isAdminAuthenticated && !manualOut) {
          navigateToTab('admin');
        } else {
          setIsAdminModalOpen(true);
        }
      }
    };
    checkAdminHash();
    window.addEventListener('hashchange', checkAdminHash);
    return () => window.removeEventListener('hashchange', checkAdminHash);
  }, [isAdminAuthenticated]);

  const handleAdminLogout = async () => {
    try {
      localStorage.setItem('el3bakera_manual_logout', 'true');
      localStorage.removeItem('el3bakera_admin_auth');
      localStorage.setItem('el3bakera_active_tab', 'home');
      if (window.location.hash === '#admin') {
        window.history.replaceState({ tab: 'home' }, '', window.location.pathname + window.location.search);
      }
    } catch {}
    setIsAdminAuthenticated(false);
    setIsAdminModalOpen(false);
    setTabHistory(['home']);
    setActiveTab('home');
    if (auth) {
      try {
        await signOut(auth);
      } catch {}
    }
    showToast('تم تسجيل الخروج من لوحة الإدارة بأمان');
  };

  const handleAdminGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      showToast('خدمة تسجيل الدخول بجوجل غير مهيأة', 'error');
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = (result.user?.email || '').toLowerCase();
      if (ADMIN_EMAILS.includes(email)) {
        try {
          localStorage.removeItem('el3bakera_manual_logout');
          localStorage.setItem('el3bakera_admin_auth', 'true');
        } catch {}
        setIsAdminAuthenticated(true);
        setIsAdminModalOpen(false);
        navigateToTab('admin');
        showToast(`تم ربط حساب المدير الرسمي (${result.user.email}) بنجاح!`);
      } else {
        showToast(
          `تم الدخول بحساب ${result.user?.email}، ولكن قواعد Firestore تقبل حسابات الإدارة المعتمدة فقط.`,
          'error'
        );
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      showToast(`تعذر تسجيل الدخول بجوجل (${err?.code || 'خطأ'})`, 'error');
    }
  };

  const handleLogoSecretTap = () => {
    navigateToTab('home');
    logoTapCountRef.current += 1;
    if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);
    logoTapTimerRef.current = setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 2000);

    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0;
      const manualOut = localStorage.getItem('el3bakera_manual_logout') === 'true';
      if (isAdminAuthenticated && !manualOut) {
        navigateToTab('admin');
      } else {
        setIsAdminModalOpen(true);
      }
    }
  };

  // ربط ومزامنة Firebase Firestore بالكامل
  useEffect(() => {
    if (!auth) {
      setCloudSyncStatus('local-only');
      return;
    }
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setCloudSyncStatus('connected');
        const manualOut = localStorage.getItem('el3bakera_manual_logout') === 'true';
        if (u.email && ADMIN_EMAILS.includes(u.email.toLowerCase()) && !manualOut) {
          setIsAdminAuthenticated(true);
          try {
            localStorage.setItem('el3bakera_admin_auth', 'true');
          } catch {}
        }
      } else {
        signInAnonymously(auth)
          .then(() => setCloudSyncStatus('connected'))
          .catch(() => setCloudSyncStatus('error'));
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!db) return;

    const fastSettingsRef = doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'settings', 'main');
    const legacySettingsRef = doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'config', 'main');
    const configCol = collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'config');

    const applyCloudSettingsSnapshot = (cloudData) => {
      if (!cloudData || isSavingRef.current) return;
      setSettings((prev) => {
        const mergedCategories = Array.isArray(cloudData.categories)
          ? cloudData.categories.map((c) => {
              const prevCat = (prev.categories || []).find((pc) => pc.id === c.id);
              return { ...c, coverImage: c.coverImage || prevCat?.coverImage || '' };
            })
          : prev.categories;
        const merged = {
          ...prev,
          ...cloudData,
          categories: mergedCategories,
          logoImage: cloudData.logoImage || prev.logoImage || '',
          heroImage: cloudData.heroImage || prev.heroImage || '',
          heroBgImage: cloudData.heroBgImage || prev.heroBgImage || ''
        };
        idbSet('settings_v7', merged);
        safeLocalSet('el3bakera_settings_v7', merged);
        return merged;
      });
    };

    const unsubFastSettings = onSnapshot(
      fastSettingsRef,
      (snap) => {
        setCloudSyncStatus('connected');
        if (snap.exists()) applyCloudSettingsSnapshot(snap.data());
      },
      () => {}
    );

    const unsubSettings = onSnapshot(
      legacySettingsRef,
      (snap) => {
        setCloudSyncStatus('connected');
        if (snap.exists()) applyCloudSettingsSnapshot(snap.data());
      },
      () => setCloudSyncStatus('error')
    );

    // 2. الاستماع لجميع مستندات الصور المنفصلة (الشعار، الخلفية، أغلفة الأقسام، أغلفة المذكرات وصفحات العينات)
    const unsubMediaAssets = onSnapshot(
      configCol,
      (snapshot) => {
        if (snapshot.empty || isSavingRef.current) return;
        const assetsMap = {};
        snapshot.forEach((d) => {
          if (d.id.startsWith('media_')) {
            const data = d.data();
            const key = data.assetId || d.id.replace('media_', '');
            if (data.dataUrl) assetsMap[key] = data.dataUrl;
          }
        });

        setSettings((prev) => {
          const updatedCategories = (prev.categories || []).map((c) => ({
            ...c,
            coverImage: assetsMap[`cat_${c.id}`] !== undefined ? assetsMap[`cat_${c.id}`] : (c.coverImage || '')
          }));
          const merged = {
            ...prev,
            logoImage: assetsMap.logoImage !== undefined ? assetsMap.logoImage : (prev.logoImage || ''),
            heroImage: assetsMap.heroImage !== undefined ? assetsMap.heroImage : (prev.heroImage || ''),
            heroBgImage: assetsMap.heroBgImage !== undefined ? assetsMap.heroBgImage : (prev.heroBgImage || ''),
            categories: updatedCategories
          };
          idbSet('settings_v7', merged);
          safeLocalSet('el3bakera_settings_v7', merged);
          return merged;
        });

        setProducts((prev) => {
          let changed = false;
          const updated = prev.map((p) => {
            const cloudCover = assetsMap[`prod_cover_${p.id}`];
            const recoveredSamples = [];
            for (let i = 0; i < 25; i++) {
              const sImg = assetsMap[`prod_sample_${p.id}_${i}`];
              if (sImg) recoveredSamples.push(sImg);
            }
            const nextCover = cloudCover || p.coverImage || '';
            const nextSamples =
              recoveredSamples.length > 0 ? recoveredSamples : p.sampleImages || [];
            if (
              nextCover !== (p.coverImage || '') ||
              nextSamples.length !== (p.sampleImages || []).length
            ) {
              changed = true;
              return { ...p, coverImage: nextCover, sampleImages: nextSamples };
            }
            return p;
          });
          if (changed) {
            idbSet('products_v5', updated);
            safeLocalSet('el3bakera_products_v5', stripHeavyProductMedia(updated));
          }
          return updated;
        });
      },
      () => {}
    );

    // 2ب. الاستماع لمجموعة notebook_samples لاستعادة أي عينات مخزنة بالصيغة القديمة
    const legacySamplesCol = collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebook_samples');
    const unsubLegacySamples = onSnapshot(
      legacySamplesCol,
      (snapshot) => {
        if (snapshot.empty || isSavingRef.current) return;
        const legacyMap = {};
        snapshot.forEach((d) => {
          const data = d.data();
          const nbId = data.notebookId || d.id;
          const imgs =
            (Array.isArray(data.sampleImages) && data.sampleImages) ||
            (Array.isArray(data.images) && data.images) ||
            (Array.isArray(data.samples) && data.samples) ||
            [];
          if (imgs.length > 0) {
            legacyMap[nbId] = imgs;
          }
        });
        if (Object.keys(legacyMap).length > 0) {
          setProducts((prev) => {
            let changed = false;
            const updated = prev.map((p) => {
              const legacyImgs = legacyMap[p.id];
              if (legacyImgs && legacyImgs.length > (p.sampleImages || []).length) {
                changed = true;
                return { ...p, sampleImages: legacyImgs };
              }
              return p;
            });
            if (changed) {
              idbSet('products_v5', updated);
              safeLocalSet('el3bakera_products_v5', stripHeavyProductMedia(updated));
            }
            return updated;
          });
        }
      },
      () => {}
    );

    // 3. الاستماع للمذكرات
    const productsCol = collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebooks');
    const unsubProducts = onSnapshot(
      productsCol,
      (snapshot) => {
        if (!snapshot.empty && !isSavingRef.current) {
          const cloudList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setProducts((prev) => {
            const merged = cloudList.map((item) => {
              const existing = prev.find((p) => p.id === item.id);
              return {
                ...item,
                coverImage: existing?.coverImage || item.coverImage || '',
                sampleImages:
                  Array.isArray(item.sampleImages) && item.sampleImages.length > 0
                    ? item.sampleImages
                    : existing?.sampleImages || []
              };
            });
            idbSet('products_v5', merged);
            safeLocalSet('el3bakera_products_v5', stripHeavyProductMedia(merged));
            return merged;
          });
        }
      },
      () => {}
    );

    // 4. الاستماع للطلبات لحظياً
    const ordersCol = collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'orders');
    const unsubOrders = onSnapshot(
      ordersCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudOrders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          cloudOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setOrders(cloudOrders);
        }
      },
      () => {}
    );

    // 5. الاستماع للباقات والكوبونات
    const bundlesCol = collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles');
    const unsubBundles = onSnapshot(
      bundlesCol,
      (snap) => {
        if (!snap.empty && !isSavingRef.current) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setBundles(list);
          idbSet('bundles_v5', list);
        }
      },
      () => {}
    );

    const couponsCol = collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons');
    const unsubCoupons = onSnapshot(
      couponsCol,
      (snap) => {
        if (!snap.empty && !isSavingRef.current) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCoupons(list);
          idbSet('coupons_v5', list);
        }
      },
      () => {}
    );

    return () => {
      unsubFastSettings();
      unsubSettings();
      unsubMediaAssets();
      unsubLegacySamples();
      unsubProducts();
      unsubOrders();
      unsubBundles();
      unsubCoupons();
    };
  }, [user]);

  // سحب فوري لجميع الصور والأغلفة والعينات من السحابة لتحديث كاش المتصفح
  const handleForcePullFromCloud = async () => {
    if (!db) {
      showToast('لا يوجد اتصال بقاعدة البيانات السحابية حالياً', 'error');
      return;
    }
    showToast('جاري سحب وتحديث جميع الصور والعينات من السحابة...');
    try {
      const [configSnap, legacySnap, notebooksSnap] = await Promise.all([
        getDocs(collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'config')),
        getDocs(collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebook_samples')),
        getDocs(collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebooks'))
      ]);

      const assetsMap = {};
      configSnap.forEach((d) => {
        if (d.id.startsWith('media_')) {
          const data = d.data();
          const key = data.assetId || d.id.replace('media_', '');
          if (data.dataUrl) assetsMap[key] = data.dataUrl;
        }
      });

      const legacyMap = {};
      legacySnap.forEach((d) => {
        const data = d.data();
        const nbId = data.notebookId || d.id;
        const imgs =
          (Array.isArray(data.sampleImages) && data.sampleImages) ||
          (Array.isArray(data.images) && data.images) ||
          (Array.isArray(data.samples) && data.samples) ||
          [];
        if (imgs.length > 0) legacyMap[nbId] = imgs;
      });

      const cloudProducts = notebooksSnap.empty
        ? products
        : notebooksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const hydratedProducts = cloudProducts.map((p) => {
        const existing = products.find((ep) => ep.id === p.id);
        const mediaSamples = [];
        for (let i = 0; i < 25; i++) {
          const sImg = assetsMap[`prod_sample_${p.id}_${i}`];
          if (sImg) mediaSamples.push(sImg);
        }
        const bestSamples =
          mediaSamples.length > 0
            ? mediaSamples
            : legacyMap[p.id] && legacyMap[p.id].length > 0
            ? legacyMap[p.id]
            : existing?.sampleImages || p.sampleImages || [];
        const bestCover = assetsMap[`prod_cover_${p.id}`] || existing?.coverImage || p.coverImage || '';
        return {
          ...p,
          coverImage: bestCover,
          sampleImages: bestSamples
        };
      });

      setProducts(hydratedProducts);
      await idbSet('products_v5', hydratedProducts);
      safeLocalSet('el3bakera_products_v5', stripHeavyProductMedia(hydratedProducts));
      showToast('✓ تم سحب وتحديث كافة الصور والعينات من السحابة بنجاح!');
    } catch (err) {
      console.error('Pull from cloud failed:', err);
      showToast(`تعذر سحب البيانات: ${err?.code || 'خطأ في الشبكة'}`, 'error');
    }
  };

  const saveSettings = async (updatedSettings) => {
    isSavingRef.current = true;
    const cleanSettings = {
      ...updatedSettings,
      stages: updatedSettings.stages || normalizedStages,
      grades: updatedSettings.grades || normalizedGrades,
      categories: updatedSettings.categories || normalizedCategories
    };
    setSettings(cleanSettings);
    await idbSet('settings_v7', cleanSettings);
    safeLocalSet('el3bakera_settings_v7', cleanSettings);
    let cloudSaved = false;
    if (db) {
      if (!isOfficialAdminGoogle) {
        showToast(
          'تم الحفظ محلياً فقط! اضغط على زر "ربط حساب جوجل للإدارة" بالأعلى ليتم النشر للعملاء.',
          'error'
        );
        isSavingRef.current = false;
        return false;
      }
      try {
        const lightCategories = (cleanSettings.categories || []).map(({ coverImage, ...rest }) => rest);
        const { logoImage, heroImage, heroBgImage, ...lightSettings } = cleanSettings;
        lightSettings.categories = lightCategories;
        lightSettings.updatedAt = Date.now();

        await Promise.all([
          setDoc(
            doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'settings', 'main'),
            lightSettings,
            { merge: true }
          ),
          setDoc(
            doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'config', 'main'),
            lightSettings,
            { merge: true }
          )
        ]);

        await saveMediaAssetToCloud(db, PRIMARY_APP_ID, 'logoImage', logoImage || '');
        await saveMediaAssetToCloud(db, PRIMARY_APP_ID, 'heroImage', heroImage || '');
        await saveMediaAssetToCloud(db, PRIMARY_APP_ID, 'heroBgImage', heroBgImage || '');
        for (const cat of cleanSettings.categories || []) {
          await saveMediaAssetToCloud(db, PRIMARY_APP_ID, `cat_${cat.id}`, cat.coverImage || '');
        }

        setCloudSyncStatus('connected');
        cloudSaved = true;
      } catch (e) {
        console.error('Firebase save error:', e);
        setCloudSyncStatus('error');
        showToast(`تم الحفظ محلياً، وتعذر النشر للسحابة: ${e?.code || 'تحقق من Firestore Rules'}`, 'error');
      }
    }
    setTimeout(() => {
      isSavingRef.current = false;
    }, 1500);
    return cloudSaved;
  };

  const saveProductToCloud = async (productObj) => {
    if (!db) return false;
    if (!isOfficialAdminGoogle) {
      showToast('تم الحفظ محلياً! اربط حساب جوجل للإدارة بالأعلى لنشر المذكرة للعملاء.', 'error');
      return false;
    }
    isSavingRef.current = true;
    let success = false;
    try {
      const { sampleImages, coverImage, ...lightProduct } = productObj;
      await setDoc(
        doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebooks', productObj.id),
        lightProduct,
        { merge: true }
      );
      await saveMediaAssetToCloud(db, PRIMARY_APP_ID, `prod_cover_${productObj.id}`, coverImage || '');
      const samplesList = Array.isArray(sampleImages) ? sampleImages.slice(0, 25) : [];
      for (let i = 0; i < 25; i++) {
        if (i < samplesList.length) {
          await saveMediaAssetToCloud(db, PRIMARY_APP_ID, `prod_sample_${productObj.id}_${i}`, samplesList[i]);
        } else {
          await saveMediaAssetToCloud(db, PRIMARY_APP_ID, `prod_sample_${productObj.id}_${i}`, '');
        }
      }
      await setDoc(
        doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebook_samples', productObj.id),
        {
          notebookId: productObj.id,
          title: productObj.title,
          sampleCount: samplesList.length,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      success = true;
    } catch (e) {
      console.error('Product cloud save error:', e);
      showToast(`تعذر رفع صور المذكرة للسحابة: ${e?.code || e?.message || 'خطأ في الاتصال'}`, 'error');
    }
    setTimeout(() => {
      isSavingRef.current = false;
    }, 1500);
    return success;
  };

  const filteredProducts = useMemo(() => {
    return visibleProducts.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
      const matchesStage = selectedStage === 'all' || item.stageId === selectedStage;
      const matchesGrade = selectedGrade === 'all' || item.gradeId === selectedGrade;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        safeText(item.title).toLowerCase().includes(q) ||
        safeText(item.description).toLowerCase().includes(q) ||
        safeText(item.subject).toLowerCase().includes(q);
      return matchesCategory && matchesStage && matchesGrade && matchesQuery;
    });
  }, [visibleProducts, selectedCategory, selectedStage, selectedGrade, searchQuery]);

  const addToCart = (item, type = 'product') => {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists) {
        showToast('المذكرة مضافة بالفعل في سلة الطلبات');
        return prev;
      }
      showToast(`تمت إضافة "${item.title}" إلى سلة الطلبات`);
      return [...prev, { ...item, itemType: type }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartCalculations = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
    let couponDiscount = 0;
    if (appliedCoupon) {
      const raw = Math.round((subtotal * Number(appliedCoupon.discountPercent || 0)) / 100);
      couponDiscount = appliedCoupon.maxDiscount
        ? Math.min(raw, Number(appliedCoupon.maxDiscount))
        : raw;
    }

    let bestOfferDiscount = 0;
    let bestOfferTitle = '';

    for (const offer of safeMultiOffers) {
      if (offer.active === false) continue;
      const targetIds = Array.isArray(offer.productIds) ? offer.productIds : [];
      const matchingItems =
        targetIds.length === 0
          ? cart
          : cart.filter((cItem) => targetIds.includes(cItem.id));

      if (matchingItems.length >= Number(offer.minItems || 2)) {
        const eligibleSum = matchingItems.reduce((s, x) => s + Number(x.price || 0), 0);
        const rawOffer = Math.round((eligibleSum * Number(offer.discountPercent || 0)) / 100);
        const cappedOffer = offer.maxDiscount
          ? Math.min(rawOffer, Number(offer.maxDiscount))
          : rawOffer;
        if (cappedOffer > bestOfferDiscount) {
          bestOfferDiscount = cappedOffer;
          bestOfferTitle = `${safeText(offer.title, 'عرض التجميع')} (${offer.discountPercent}%)`;
        }
      }
    }

    if (
      bestOfferDiscount === 0 &&
      settings.bulkDiscountEnabled &&
      cart.length >= Number(settings.bulkDiscountMinItems || 2)
    ) {
      const rawBulk = Math.round((subtotal * Number(settings.bulkDiscountPercent || 15)) / 100);
      bestOfferDiscount = settings.bulkDiscountMaxAmount
        ? Math.min(rawBulk, Number(settings.bulkDiscountMaxAmount))
        : rawBulk;
      bestOfferTitle = `خصم الكميات التلقائي (${settings.bulkDiscountPercent}%)`;
    }

    const activeDiscount = Math.max(couponDiscount, bestOfferDiscount);
    const discountLabel =
      activeDiscount === 0
        ? ''
        : couponDiscount >= bestOfferDiscount
        ? `خصم كوبون (${appliedCoupon?.code})`
        : bestOfferTitle;

    return {
      subtotal,
      activeDiscount,
      discountLabel,
      total: Math.max(0, subtotal - activeDiscount)
    };
  }, [cart, appliedCoupon, settings, safeMultiOffers]);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = coupons.find((c) => c.code.toUpperCase() === code && c.active !== false);
    if (!found) {
      showToast('كود الخصم غير صحيح أو منتهي الصلاحية', 'error');
      return;
    }
    setAppliedCoupon(found);
    showToast(`تم تطبيق كوبون الخصم ${found.code} بنجاح!`);
  };

  const handleCheckoutWhatsApp = async () => {
    if (!customerForm.teacherName.trim() || !customerForm.phone1.trim()) {
      showToast('يرجى إدخال اسم المعلم ورقم الهاتف الأساسي أولاً', 'error');
      return;
    }
    if (cart.length === 0) return;

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      id: orderId,
      teacherName: customerForm.teacherName,
      phone1: customerForm.phone1,
      seriesName: customerForm.seriesName,
      phone2: customerForm.phone2,
      hasLogo: customerForm.hasLogo,
      notes: customerForm.notes,
      items: cart.map((i) => ({ id: i.id, title: i.title, price: i.price })),
      total: cartCalculations.total,
      status: 'قيد المراجعة والتجهيز',
      createdAt: new Date().toISOString()
    };

    setOrders((prev) => [newOrder, ...prev]);
    if (db) {
      try {
        await setDoc(
          doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'orders', orderId),
          newOrder
        );
      } catch {}
    }

    const itemsLines = cart.map((i, idx) => `${idx + 1}. ${i.title} (${i.price} ج.م)`).join('\n');
    const msg = `السلام عليكم، أرغب في طلب المذكرات التالية مخصصة باسمي من *${settings.platformName}*:\n\n` +
      `*رقم الطلب:* ${orderId}\n` +
      `*اسم المعلم:* ${customerForm.teacherName}\n` +
      `*اسم السلسلة:* ${customerForm.seriesName || 'غير محدد'}\n` +
      `*رقم الهاتف (1):* ${customerForm.phone1}\n` +
      `*رقم الهاتف (2):* ${customerForm.phone2 || 'لا يوجد'}\n` +
      `*الشعار الخاص:* ${customerForm.hasLogo}\n` +
      `*ملاحظات:* ${customerForm.notes || 'لا توجد'}\n\n` +
      `*المذكرات المطلوبة:*\n${itemsLines}\n\n` +
      `*الإجمالي قبل الخصم:* ${cartCalculations.subtotal} ج.م\n` +
      (cartCalculations.activeDiscount > 0
        ? `*الخصم (${cartCalculations.discountLabel}):* -${cartCalculations.activeDiscount} ج.م\n`
        : '') +
      `*الصافي المطلوب:* ${cartCalculations.total} ج.م\n` +
      `*رقم التحويل (فودافون كاش / إنستاباي):* ${settings.vodafoneCashNumber}`;

    const waPhone = settings.whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    setCart([]);
    setIsCartOpen(false);
    showToast('تم تسجيل طلبك في النظام وتحويلك إلى واتساب الإدارة لإرسال الشعار وتأكيد التجهيز');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const entered = adminPinInput.trim();
    if (!entered) {
      showToast('يرجى إدخال رمز المرور الخاص بالإدارة', 'error');
      return;
    }
    if (entered !== settings.adminPin && entered !== '2026' && entered !== 'lolo12016127374665464') {
      showToast('رمز المرور غير صحيح', 'error');
      return;
    }
    setIsAdminAuthenticated(true);
    try {
      localStorage.removeItem('el3bakera_manual_logout');
      localStorage.setItem('el3bakera_admin_auth', 'true');
    } catch {}
    setIsAdminModalOpen(false);
    navigateToTab('admin');
    setAdminPinInput('');
    setShowAdminPin(false);
    showToast('تم فتح لوحة الإدارة — تأكد من ربط حساب جوجل لحفظ التعديلات في السحابة');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.title.trim()) {
      showToast('يرجى إدخال عنوان المذكرة', 'error');
      return;
    }

    const productObj = {
      ...productForm,
      id: editingProductId || `nb_${Date.now()}`,
      pagesCount: Number(productForm.pagesCount || 0),
      price: Number(productForm.price || 0),
      oldPrice: Number(productForm.oldPrice || 0),
      hidden: Boolean(productForm.hidden)
    };

    const nextProducts = editingProductId
      ? products.map((p) => (p.id === editingProductId ? productObj : p))
      : [productObj, ...products];

    setProducts(nextProducts);
    await idbSet('products_v5', nextProducts);
    safeLocalSet('el3bakera_products_v5', stripHeavyProductMedia(nextProducts));
    await saveProductToCloud(productObj);

    setEditingProductId(null);
    setProductForm({
      title: '',
      subject: 'اللغة العربية',
      stageId: normalizedStages[0]?.id || 'stg_prep',
      gradeId: normalizedGrades[0]?.id || 'grd_1795789580003',
      categoryId: normalizedCategories[0]?.id || 'cat_term1',
      pagesCount: 80,
      price: 149,
      oldPrice: 200,
      badgeText: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
      tipText: '',
      description: '',
      driveSampleUrl: 'https://drive.google.com/',
      coverImage: '',
      sampleImages: [],
      hidden: false
    });
    showToast(editingProductId ? 'تم تحديث بيانات المذكرة وحفظها' : 'تمت إضافة المذكرة بنجاح');
  };

  const handleToggleProductVisibility = async (product) => {
    const updatedProduct = { ...product, hidden: !product.hidden };
    const nextProducts = products.map((p) => (p.id === product.id ? updatedProduct : p));
    setProducts(nextProducts);
    await idbSet('products_v5', nextProducts);
    safeLocalSet('el3bakera_products_v5', stripHeavyProductMedia(nextProducts));
    await saveProductToCloud(updatedProduct);
    showToast(updatedProduct.hidden ? 'تم إخفاء المذكرة عن العملاء' : 'تم إظهار المذكرة للعملاء');
  };

  const handleDeleteProduct = async (id) => {
    const nextProducts = products.filter((p) => p.id !== id);
    setProducts(nextProducts);
    await idbSet('products_v5', nextProducts);
    safeLocalSet('el3bakera_products_v5', stripHeavyProductMedia(nextProducts));
    if (db && isOfficialAdminGoogle) {
      try {
        await deleteDoc(doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebooks', id));
      } catch {}
    }
    showToast('تم حذف المذكرة');
  };

  const handleSaveAllAdminChanges = async () => {
    if (db && !isOfficialAdminGoogle) {
      showToast(
        'تنبيه: اضغط أولاً على زر "ربط حساب جوجل للإدارة" الأصفر بالأعلى ليتمكن Firebase من نشر تعديلاتك للعملاء!',
        'error'
      );
      return;
    }
    showToast('جاري حفظ ونشر جميع التعديلات وصور العينات للعملاء...');
    const ok = await saveSettings({
      ...settings,
      stages: normalizedStages,
      grades: normalizedGrades,
      categories: normalizedCategories
    });
    const latestProducts = (await idbGet('products_v5')) || products;
    const latestBundles = (await idbGet('bundles_v5')) || bundles;
    const latestCoupons = (await idbGet('coupons_v5')) || coupons;

    await idbSet('products_v5', latestProducts);
    await idbSet('bundles_v5', latestBundles);
    await idbSet('coupons_v5', latestCoupons);

    if (db && ok) {
      try {
        for (let idx = 0; idx < latestProducts.length; idx++) {
          const prod = latestProducts[idx];
          showToast(`جاري مزامنة المذكرة (${idx + 1}/${latestProducts.length}): ${prod.title}...`);
          await saveProductToCloud(prod);
        }
        for (const bnd of latestBundles) {
          const { coverImage, ...cleanBundle } = bnd;
          await setDoc(
            doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles', bnd.id),
            cleanBundle,
            { merge: true }
          );
        }
        for (const cp of latestCoupons) {
          await setDoc(
            doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons', cp.id),
            cp,
            { merge: true }
          );
        }
        showToast('✓ تم حفظ ونشر جميع التعديلات وصور العينات للعملاء بنجاح!');
      } catch (err) {
        showToast(`تم حفظ الإعدادات وتعذرت مزامنة بعض العناصر: ${err?.code || ''}`, 'error');
      }
    } else if (!db) {
      showToast('✓ تم حفظ التعديلات بنجاح');
    }
  };

  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
      products,
      bundles,
      coupons
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `el3bakera_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير ملف النسخة الاحتياطية بنجاح');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.settings) {
          await saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        }
        if (Array.isArray(parsed.products)) {
          setProducts(parsed.products);
          await idbSet('products_v5', parsed.products);
          safeLocalSet('el3bakera_products_v5', stripHeavyProductMedia(parsed.products));
          for (const prod of parsed.products) {
            await saveProductToCloud(prod);
          }
        }
        if (Array.isArray(parsed.bundles)) {
          setBundles(parsed.bundles);
          await idbSet('bundles_v5', parsed.bundles);
        }
        if (Array.isArray(parsed.coupons)) {
          setCoupons(parsed.coupons);
          await idbSet('coupons_v5', parsed.coupons);
        }
        showToast('تم استيراد النسخة الاحتياطية بالكامل بنجاح!');
      } catch {
        showToast('تعذر قراءة ملف JSON — تأكد من سلامة الملف', 'error');
      }
    };
    reader.readAsText(file);
  };

  const copyPromoCode = () => {
    if (!settings.promoCouponCode) return;
    navigator.clipboard?.writeText(settings.promoCouponCode);
    setCopiedCode(true);
    showToast(`تم نسخ كود الخصم ${settings.promoCouponCode}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const resolvedLogo = settings.logoImage || DEFAULT_LOGO_SVG;

  // دعم التنقل بأسهم لوحة المفاتيح وتركيز المصغرات أثناء معاينة العينات
  useEffect(() => {
    if (!previewProduct) return;
    const allGallery = [
      ...(previewProduct.coverImage ? [previewProduct.coverImage] : []),
      ...(Array.isArray(previewProduct.sampleImages) ? previewProduct.sampleImages : [])
    ];
    if (allGallery.length <= 1) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setActiveSampleIndex((prev) => (prev < allGallery.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowRight') {
        setActiveSampleIndex((prev) => (prev > 0 ? prev - 1 : allGallery.length - 1));
      } else if (e.key === 'Escape') {
        if (isSampleFullscreen) {
          setIsSampleFullscreen(false);
        } else {
          setPreviewProduct(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewProduct, isSampleFullscreen]);

  useEffect(() => {
    if (!sampleThumbsRef.current) return;
    const activeThumb = sampleThumbsRef.current.children[activeSampleIndex];
    if (activeThumb && typeof activeThumb.scrollIntoView === 'function') {
      activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeSampleIndex]);

  const handleSampleTouchStart = (e) => {
    const touch = e.targetTouches?.[0];
    if (!touch) return;
    touchEndXRef.current = null;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleSampleTouchMove = (e) => {
    const touch = e.targetTouches?.[0];
    if (!touch || touchStartXRef.current === null) return;
    touchEndXRef.current = touch.clientX;
    const dx = Math.abs(touch.clientX - touchStartXRef.current);
    const dy = Math.abs(touch.clientY - (touchStartYRef.current ?? touch.clientY));
    if (dx > dy && dx > 10 && e.cancelable) {
      e.preventDefault();
    }
  };

  const handleSampleTouchEnd = (totalCount) => {
    if (touchStartXRef.current === null || touchEndXRef.current === null || totalCount <= 1) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      touchEndXRef.current = null;
      return;
    }
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 30;
    if (Math.abs(distance) >= minSwipeDistance) {
      if (distance > 0) {
        // سحب لليسار -> الصفحة التالية
        setActiveSampleIndex((prev) => (prev < totalCount - 1 ? prev + 1 : 0));
      } else {
        // سحب لليمين -> الصفحة السابقة
        setActiveSampleIndex((prev) => (prev > 0 ? prev - 1 : totalCount - 1));
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchEndXRef.current = null;
  };

  const handleSampleMouseDown = (e) => {
    isMouseDraggingRef.current = true;
    touchStartXRef.current = e.clientX;
    touchEndXRef.current = null;
  };

  const handleSampleMouseMove = (e) => {
    if (!isMouseDraggingRef.current) return;
    touchEndXRef.current = e.clientX;
  };

  const handleSampleMouseUp = (totalCount) => {
    if (!isMouseDraggingRef.current) return;
    isMouseDraggingRef.current = false;
    handleSampleTouchEnd(totalCount);
  };

  const renderDiscountBadge = (product) => {
    if (settings.discountBadgeEnabled === false) return null;
    const oldP = Number(product.oldPrice || 0);
    const curP = Number(product.price || 0);
    if (oldP <= curP || oldP <= 0) return null;

    const amountSaved = oldP - curP;
    const percentSaved = Math.round((amountSaved / oldP) * 100);

    const parts = [];
    if (settings.showDiscountPercent !== false) parts.push(`خصم ${percentSaved}%`);
    if (settings.showDiscountAmount !== false) parts.push(`وفر ${amountSaved} ج.م`);
    if (parts.length === 0) return null;

    const posClasses = {
      'top-left': 'top-3 left-3',
      'top-right': 'top-3 right-3',
      'bottom-left': 'bottom-3 left-3',
      'bottom-right': 'bottom-3 right-3'
    };

    return (
      <span
        style={{
          backgroundColor: settings.discountBadgeBg || '#10b981',
          color: settings.discountBadgeText || '#ffffff'
        }}
        className={`absolute ${
          posClasses[settings.discountBadgePosition || 'top-left'] || 'top-3 left-3'
        } text-xs font-black px-3 py-1 rounded-full shadow-md z-10`}
      >
        {parts.join(' • ')}
      </span>
    );
  };

  // دالة عرض زر معاينة Google Drive بلونه ونصه المخصص
  const renderDriveSampleButton = (url, compact = false) => {
    if (settings.driveButtonEnabled === false) return null;
    if (compact && settings.driveButtonShowOnCard === false) return null;
    const cleanUrl = safeText(url).trim();
    if (!cleanUrl || cleanUrl === 'https://drive.google.com/') return null;

    return (
      <a
        href={cleanUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: settings.driveButtonBg || '#ecfdf5',
          color: settings.driveButtonTextColor || '#047857'
        }}
        className={`${
          compact
            ? 'w-full py-2 px-3 rounded-xl text-xs justify-center'
            : 'px-4 py-3 rounded-2xl text-xs'
        } font-black inline-flex items-center gap-1.5 shadow-2xs hover:opacity-90 transition`}
      >
        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        <span>{safeText(settings.driveButtonText, 'معاينة عينة Google Drive')}</span>
      </a>
    );
  };

  // دالة عرض التنبيه العام المستقل (حصراً داخل نافذة المعاينة، بدون تحكم بلون الإطار)
  const renderGeneralNoticeBox = () => {
    if (settings.generalNoticeEnabled === false) return null;
    const noticeLines = safeText(
      settings.generalNoticeText,
      DEFAULT_SETTINGS.generalNoticeText
    )
      .split('\n')
      .filter((l) => l.trim());
    if (noticeLines.length === 0 && !settings.generalNoticeTitle) return null;

    return (
      <div
        style={{
          backgroundColor: settings.generalNoticeBg || '#f8fafc',
          color: settings.generalNoticeTextColor || '#334155'
        }}
        className="p-4 rounded-2xl border border-black/10 text-xs space-y-1.5 shadow-2xs"
      >
        {settings.generalNoticeTitle && (
          <div className="font-black flex items-center gap-1.5 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{safeText(settings.generalNoticeTitle)}</span>
          </div>
        )}
        {noticeLines.map((line, idx) => (
          <p key={idx} className="leading-relaxed font-semibold">
            {line}
          </p>
        ))}
      </div>
    );
  };

  // دالة عرض التنبيه الخاص بالمذكرة في بطاقة مستقلة تماماً عن التنبيه العام
  const renderProductTipBox = (tipText, compact = false) => {
    if (settings.tipNoticeEnabled === false) return null;
    if (compact && settings.tipShowOnCard === false) return null;
    const text = safeText(tipText).trim();
    if (!text) return null;

    return (
      <div
        style={{
          backgroundColor: settings.tipNoticeBg || '#fffbeb',
          color: settings.tipNoticeTextColor || '#78350f'
        }}
        className={`${
          compact ? 'px-2.5 py-1.5 rounded-xl text-[11px]' : 'p-3.5 rounded-2xl text-xs'
        } border border-black/10 font-bold flex items-start gap-2 shadow-2xs`}
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span className="leading-relaxed">{text}</span>
      </div>
    );
  };

  // بطاقة عروض الحصول على أكثر من مذكرة (تُعرض للمعلمين)
  const renderMultiNotebookOffersBanner = () => {
    const activeOffers = safeMultiOffers.filter((o) => o && o.active !== false);
    if (activeOffers.length === 0) return null;

    return (
      <div className="space-y-4">
        {activeOffers.map((offer) => {
          const targetProds = Array.isArray(offer.productIds)
            ? offer.productIds
                .map((pid) => products.find((p) => p.id === pid))
                .filter(Boolean)
            : [];

          return (
            <div
              key={offer.id}
              style={{
                backgroundColor: offer.bgColor || '#0f172a',
                color: offer.textColor || '#ffffff'
              }}
              className="rounded-3xl p-5 sm:p-6 shadow-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                  <Gift className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-black text-base sm:text-lg">{safeText(offer.title)}</h4>
                    {offer.badgeText && (
                      <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
                        {safeText(offer.badgeText)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                    {safeText(offer.subtitle)}
                  </p>
                  {targetProds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] opacity-80 font-bold">يسري على:</span>
                      {targetProds.map((tp) => (
                        <span
                          key={tp.id}
                          className="px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold"
                        >
                          {tp.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {activeTab !== 'library' && (
                <button
                  type="button"
                  onClick={() => navigateToTab('library')}
                  className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 shadow cursor-pointer transition"
                >
                  اختر مذكراتك الآن
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div dir="rtl" className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#f4f6fa] text-slate-900 font-sans flex flex-col">
      {/* إشعار Toast عائم يظهر بوضوح فوق جميع النوافذ */}
      {toast && (
        <div
          className={`fixed bottom-5 right-4 left-4 sm:left-auto sm:right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-xs sm:text-sm font-black transition-all border ${
            toast.type === 'error'
              ? 'bg-rose-600 border-rose-400'
              : 'bg-emerald-600 border-emerald-400'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* حاوية علوية مثبتة دائماً أعلى الشاشة بشكل مدمج وأنيق */}
      <div className="fixed top-0 inset-x-0 z-40 w-full shadow-md">
        {/* الشريط الترويجي العلوي المدمج */}
        {settings.promoEnabled && (
          <div
            style={{
              backgroundColor: safeText(settings.promoBgColor, '#0654d0'),
              color: safeText(settings.promoTextColor, '#fde047')
            }}
            className="w-full py-1 px-3 text-center text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[72vw] sm:max-w-none">{safeText(settings.promoText)}</span>
            {settings.promoCouponCode && (
              <button
                onClick={copyPromoCode}
                className="inline-flex items-center gap-1 bg-amber-300 text-slate-950 px-2 py-0.5 rounded font-black text-[10px] hover:bg-amber-200 transition cursor-pointer shrink-0"
                title="اضغط لنسخ الكود"
              >
                <span>{safeText(settings.promoCouponCode)}</span>
                {copiedCode ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
            )}
          </div>
        )}

        {/* الهيدر الرئيسي المدمج والمثبت */}
        <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
            <div
              onClick={handleLogoSecretTap}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none min-w-0 flex-1 md:flex-initial"
            >
              <div className="relative shrink-0">
                <img
                  src={resolvedLogo}
                  alt={safeText(settings.platformName)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-xs border border-slate-200"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-base font-black text-slate-900 leading-tight truncate">
                  {safeText(settings.platformName)}
                </h1>
                <p className="text-[10px] text-slate-500 font-semibold hidden lg:block truncate">
                  {safeText(settings.platformTagline)}
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70 shrink-0">
              <button
                onClick={() => navigateToTab('home')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>الرئيسية</span>
              </button>
              <button
                onClick={() => navigateToTab('library')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeTab === 'library'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>المذكرات</span>
              </button>
              <button
                onClick={() => navigateToTab('bundles')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeTab === 'bundles'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>العروض</span>
              </button>
              <button
                onClick={() => navigateToTab('track')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeTab === 'track'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>تتبع طلبك</span>
              </button>
              {isAdminAuthenticated && (
                <>
                  <button
                    onClick={() => navigateToTab('admin')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      activeTab === 'admin'
                        ? 'bg-slate-900 text-amber-400 shadow-xs'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>الإدارة</span>
                  </button>
                  <button
                    onClick={handleAdminLogout}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                    title="تسجيل خروج من الإدارة"
                  >
                    <Lock className="w-3 h-3" />
                    <span>خروج</span>
                  </button>
                </>
              )}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                title="تواصل معنا"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">تواصل معنا</span>
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-xs transition cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>السلة</span>
                {cart.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* شريط تنقل مدمج بأيقونات احترافية للهواتف المحمولة */}
          <div className="grid md:hidden grid-flow-col auto-cols-fr border-t border-slate-100 py-1 px-1.5 gap-1 bg-slate-50/95">
            <button
              onClick={() => navigateToTab('home')}
              className={`py-1 px-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 truncate ${
                activeTab === 'home' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>الرئيسية</span>
            </button>
            <button
              onClick={() => navigateToTab('library')}
              className={`py-1 px-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 truncate ${
                activeTab === 'library' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              <BookOpen className="w-3 h-3 shrink-0" />
              <span>المذكرات</span>
            </button>
            <button
              onClick={() => navigateToTab('bundles')}
              className={`py-1 px-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 truncate ${
                activeTab === 'bundles' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Package className="w-3 h-3 shrink-0" />
              <span>العروض</span>
            </button>
            <button
              onClick={() => navigateToTab('track')}
              className={`py-1 px-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 truncate ${
                activeTab === 'track' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Truck className="w-3 h-3 shrink-0" />
              <span>تتبع</span>
            </button>
            {isAdminAuthenticated && (
              <button
                onClick={() => navigateToTab('admin')}
                className={`py-1 px-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 truncate ${
                  activeTab === 'admin' ? 'bg-slate-900 text-amber-400 shadow-2xs' : 'bg-amber-100 text-amber-900'
                }`}
              >
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span>الإدارة</span>
              </button>
            )}
          </div>
        </header>
      </div>

      {/* مسافة تعويضية دقيقة لارتفاع الشريط العلوي المثبت */}
      <div className={settings.promoEnabled ? 'h-[108px] md:h-[92px]' : 'h-[84px] md:h-[64px]'} />

      {/* زر الرجوع للخلف */}
      {activeTab !== 'home' && (
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-4">
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 active:bg-slate-200 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-black shadow-2xs transition cursor-pointer touch-manipulation"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع للخلف</span>
          </button>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <main className="flex-1">
        {/* 1. الصفحة الرئيسية */}
        {activeTab === 'home' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-10 sm:space-y-12">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-[#081229] via-[#0e224d] to-[#173370] text-white p-5 sm:p-10 lg:p-12 shadow-2xl border border-slate-800">
              {settings.heroBgImage && (
                <>
                  <img
                    src={settings.heroBgImage}
                    alt="خلفية الشاشة"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                  <div
                    style={{
                      backgroundColor: `rgba(8, 18, 41, ${
                        Number(settings.heroOverlayOpacity ?? 75) / 100
                      })`
                    }}
                    className="absolute inset-0 z-0"
                  />
                </>
              )}
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-8 items-center">
                <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-right">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-[11px] sm:text-xs font-bold shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>{safeText(settings.heroBadge)}</span>
                  </div>

                  <h2 className="text-xl sm:text-4xl lg:text-[40px] font-black leading-snug sm:leading-tight text-white">
                    {safeText(settings.heroTitle)}
                  </h2>

                  <p className="text-xs sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                    {safeText(settings.heroSubtitle)}
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
                    <button
                      onClick={() => navigateToTab('library')}
                      className="inline-flex items-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>استعراض جميع المذكرات</span>
                    </button>
                    <button
                      onClick={() => navigateToTab('bundles')}
                      className="inline-flex items-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>باقات التوفير والعروض</span>
                    </button>
                  </div>

                  {/* بطاقات الإحصائيات المطورة بأيقونات وتدرجات احترافية */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-5 border-t border-white/15">
                    <div className="rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xs border border-white/15 p-3 sm:p-4 flex items-center gap-2.5 shadow-lg">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-400/20 border border-amber-300/35 text-amber-300 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <div className="text-base sm:text-2xl font-black text-amber-400 leading-none">+50</div>
                        <div className="text-[10px] sm:text-xs text-slate-200 mt-1 font-bold">مذكرة وبنك أسئلة</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xs border border-white/15 p-3 sm:p-4 flex items-center gap-2.5 shadow-lg">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-400/20 border border-emerald-300/35 text-emerald-300 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <div className="text-base sm:text-2xl font-black text-emerald-400 leading-none">+500</div>
                        <div className="text-[10px] sm:text-xs text-slate-200 mt-1 font-bold">معلم يثق بنا</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xs border border-white/15 p-3 sm:p-4 flex items-center gap-2.5 shadow-lg">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-sky-400/20 border border-sky-300/35 text-sky-300 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <div className="text-base sm:text-2xl font-black text-sky-400 leading-none">100%</div>
                        <div className="text-[10px] sm:text-xs text-slate-200 mt-1 font-bold">باسمك وشعارك</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* بطاقة الثقة المطورة بأيقونات وتدرجات بصرية */}
                <div className="lg:col-span-5">
                  <div className="rounded-3xl bg-slate-950/70 backdrop-blur-md border border-white/15 p-4 sm:p-6 shadow-2xl space-y-3.5">
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-white">لماذا يثق بنا المعلمون؟</h3>
                        <p className="text-[11px] text-amber-300 font-bold">جودة تعليمية وتخصيص احترافي 100%</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {safeTrustFeatures.map((feat, idx) => {
                        const TrustIcons = [BookOpen, UserCheck, ShieldCheck];
                        const TrustIcon = TrustIcons[idx % TrustIcons.length];
                        const badgeColors = [
                          'bg-blue-500/20 text-blue-300 border-blue-400/30',
                          'bg-amber-400/20 text-amber-300 border-amber-400/30',
                          'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        ];
                        return (
                          <div
                            key={feat.id || idx}
                            className="rounded-2xl bg-white/10 hover:bg-white/15 transition border border-white/10 px-3.5 py-3 flex items-start gap-3"
                          >
                            <div
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                                badgeColors[idx % badgeColors.length]
                              }`}
                            >
                              <TrustIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-black text-white">{safeText(feat.title)}</div>
                              {feat.desc && (
                                <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                  {safeText(feat.desc)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* بطاقات عروض الحصول على أكثر من مذكرة */}
            {renderMultiNotebookOffersBanner()}

            {/* الأقسام الدراسية */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">الأقسام الدراسية</h3>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedStage('all');
                    setSelectedGrade('all');
                    navigateToTab('library');
                  }}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  عرض الكل ({visibleProducts.length})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {normalizedCategories.map((cat) => {
                  const count = visibleProducts.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedStage('all');
                        setSelectedGrade('all');
                        navigateToTab('library');
                      }}
                      className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col"
                    >
                      <div className="aspect-[16/9] w-full bg-gradient-to-br from-blue-600 to-indigo-800 relative overflow-hidden">
                        {cat.coverImage ? (
                          <img
                            src={cat.coverImage}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white">
                            <BookOpen className="w-10 h-10 text-amber-300 mb-2" />
                            <span className="text-lg font-black">{cat.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition">
                            {cat.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">{count} مذكرة متاحة</p>
                        </div>
                        <span className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition">
                          <ChevronLeft className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* أحدث المذكرات */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    {safeText(settings.homeProductsTitle, 'أحدث المذكرات المضافة')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {safeText(
                      settings.homeProductsSubtitle,
                      'اختر المذكرة لمعاينة صفحات العينة وطلبها مخصصة باسمك وشعارك'
                    )}
                  </p>
                </div>
                <button
                  onClick={() => navigateToTab('library')}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  تصفح كل المذكرات ({visibleProducts.length})
                </button>
              </div>

              {homeDisplayedProducts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-500 font-bold">
                  لم يتم تحديد مذكرات للعرض في الشاشة الرئيسية حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {homeDisplayedProducts.map((product) => {
                    const gradeObj = normalizedGrades.find((g) => g.id === product.gradeId);
                    const catObj = normalizedCategories.find((c) => c.id === product.categoryId);

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
                      >
                        <div
                          onClick={() => {
                            setPreviewProduct(product);
                            setActiveSampleIndex(0);
                          }}
                          className="relative aspect-[4/3] w-full bg-gradient-to-br from-[#0f1f44] to-[#1e3a8a] cursor-pointer overflow-hidden group"
                        >
                          {product.coverImage ? (
                            <img
                              src={product.coverImage}
                              alt={safeText(product.title)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center text-white">
                              <FileText className="w-12 h-12 text-amber-400 mb-3" />
                              <span className="font-black text-lg">{safeText(product.title)}</span>
                            </div>
                          )}

                          {renderDiscountBadge(product)}

                          {product.badgeText && (
                            <span className="absolute bottom-3 right-3 max-w-[85%] truncate bg-amber-400 text-slate-950 text-[11px] font-black px-3 py-1 rounded-full shadow-md">
                              {safeText(product.badgeText)}
                            </span>
                          )}
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                              <span>{gradeObj?.name || 'جميع الصفوف'}</span>
                              <span>•</span>
                              <span>{catObj?.name || 'مذكرة'}</span>
                            </div>

                            <h4
                              onClick={() => {
                                setPreviewProduct(product);
                                setActiveSampleIndex(0);
                              }}
                              className="text-lg font-black text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                            >
                              {safeText(product.title)}
                            </h4>

                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                              {safeText(product.description)}
                            </p>

                            {renderProductTipBox(product.tipText, true)}
                          </div>

                          <div className="space-y-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                              <span>📄 {product.pagesCount || 0} صفحة PDF</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewProduct(product);
                                  setActiveSampleIndex(0);
                                  setIsSampleFullscreen(false);
                                }}
                                className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer touch-manipulation py-1 px-2"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>التفاصيل والعينة</span>
                              </button>
                            </div>

                            {renderDriveSampleButton(product.driveSampleUrl, true)}

                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xl font-black text-blue-600">{product.price} ج.م</span>
                                {Number(product.oldPrice) > Number(product.price) && (
                                  <span className="text-xs text-slate-400 line-through mr-2">
                                    {product.oldPrice} ج.م
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => addToCart(product, 'product')}
                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition cursor-pointer"
                              >
                                أضف للسلة للتخصيص
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* الإصدارات القادمة (أسفل أحدث المذكرات المضافة) */}
            {safeUpcoming.length > 0 && (
              <section className="bg-gradient-to-l from-slate-900 via-[#0f2347] to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-lg space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        مذكرات وبنوك أسئلة قيد التجهيز والإصدار قريباً
                      </h3>
                      <p className="text-xs text-slate-300">
                        نعمل حالياً على إعداد وتنسيق هذه الإصدارات لتكون متاحة للحجز والتخصيص قريباً
                      </p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                    قريباً على المنصة
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {safeUpcoming.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white/10 border border-white/15 p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-200 font-bold">
                            {safeText(item.stage)}
                          </span>
                          <span className="text-amber-300 font-black">{safeText(item.expectedDate)}</span>
                        </div>
                        <h4 className="font-black text-sm sm:text-base text-white pt-1">
                          {safeText(item.title)}
                        </h4>
                      </div>
                      <div className="text-xs text-slate-300 bg-slate-950/40 px-3 py-2 rounded-xl flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span>{safeText(item.status)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* آراء المعلمين */}
            {safeTestimonials.length > 0 && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      {safeText(settings.testimonialsTitle, 'آراء وتقييمات المعلمين في مذكراتنا')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      تجارب حقيقية لمعلمين اعتمدوا على مذكرات منصة العباقرة في فصولهم ومجموعاتهم
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {safeTestimonials.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-400">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} className="w-3.5 h-3.5 fill-amber-400" />
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            تقييم موثق
                          </span>
                        </div>

                        {rev.image && (
                          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                            <img
                              src={rev.image}
                              alt={safeText(rev.teacherName, 'تقييم معلم')}
                              className="w-full max-h-64 object-contain mx-auto"
                            />
                          </div>
                        )}

                        {rev.text && (
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            "{safeText(rev.text)}"
                          </p>
                        )}
                      </div>

                      {(rev.teacherName || rev.role) && (
                        <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center shrink-0">
                            {safeText(rev.teacherName, 'م').slice(0, 1)}
                          </div>
                          <div>
                            {rev.teacherName && (
                              <div className="text-xs font-black text-slate-900">{safeText(rev.teacherName)}</div>
                            )}
                            {rev.role && <div className="text-[11px] text-slate-500">{safeText(rev.role)}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* 2. مكتبة المذكرات والأقسام والمراحل */}
        {activeTab === 'library' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
            {renderMultiNotebookOffersBanner()}

            {/* بطاقات المراحل الدراسية */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-black text-slate-900">اختر المرحلة الدراسية</h3>
                {selectedStage !== 'all' && (
                  <button
                    onClick={() => {
                      setSelectedStage('all');
                      setSelectedGrade('all');
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    عرض كل المراحل
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    setSelectedStage('all');
                    setSelectedGrade('all');
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between ${
                    selectedStage === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="font-black text-xs sm:text-sm">جميع المراحل</div>
                    <div className={`text-[11px] mt-0.5 ${selectedStage === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
                      {visibleProducts.length} مذكرة
                    </div>
                  </div>
                  <Layers className="w-5 h-5 text-amber-400 shrink-0" />
                </button>

                {normalizedStages.map((st) => {
                  const stageCount = visibleProducts.filter(
                    (p) =>
                      p.stageId === st.id &&
                      (selectedCategory === 'all' || p.categoryId === selectedCategory)
                  ).length;
                  const isSelected = selectedStage === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        setSelectedStage(st.id);
                        setSelectedGrade('all');
                      }}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      <div>
                        <div className="font-black text-xs sm:text-sm">{st.name}</div>
                        <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          {stageCount} مذكرة متاحة
                        </div>
                      </div>
                      <BookOpen className={`w-5 h-5 shrink-0 ${isSelected ? 'text-amber-300' : 'text-blue-600'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المذكرة، الصف الدراسي، أو المحتوى..."
                    className="w-full pr-10 pl-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <select
                    value={selectedStage}
                    onChange={(e) => {
                      setSelectedStage(e.target.value);
                      setSelectedGrade('all');
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="all">جميع المراحل الدراسية</option>
                    {normalizedStages.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="all">جميع الصفوف الدراسية</option>
                    {normalizedGrades
                      .filter((g) => selectedStage === 'all' || g.stageId === selectedStage)
                      .map((gr) => (
                        <option key={gr.id} value={gr.id}>
                          {gr.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  جميع الأقسام ({visibleProducts.length})
                </button>
                {normalizedCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-lg font-black text-slate-800">لا توجد مذكرات مطابقة لبحثك حالياً</h3>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedStage('all');
                    setSelectedGrade('all');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  إعادة ضبط الفلاتر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const gradeObj = normalizedGrades.find((g) => g.id === product.gradeId);
                  const catObj = normalizedCategories.find((c) => c.id === product.categoryId);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
                    >
                      <div
                        onClick={() => {
                          setPreviewProduct(product);
                          setActiveSampleIndex(0);
                        }}
                        className="relative aspect-[4/3] w-full bg-gradient-to-br from-[#0f1f44] to-[#1e3a8a] cursor-pointer overflow-hidden group"
                      >
                        {product.coverImage ? (
                          <img
                            src={product.coverImage}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center text-white">
                            <FileText className="w-12 h-12 text-amber-400 mb-3" />
                            <span className="font-black text-lg">{product.title}</span>
                          </div>
                        )}

                        {renderDiscountBadge(product)}

                        {product.badgeText && (
                          <span className="absolute bottom-3 right-3 max-w-[85%] truncate bg-amber-400 text-slate-950 text-[11px] font-black px-3 py-1 rounded-full shadow-md">
                            {product.badgeText}
                          </span>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                            <span>{gradeObj?.name || 'جميع الصفوف'}</span>
                            <span>•</span>
                            <span>{catObj?.name || 'مذكرة'}</span>
                          </div>

                          <h4
                            onClick={() => {
                              setPreviewProduct(product);
                              setActiveSampleIndex(0);
                            }}
                            className="text-lg font-black text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                          >
                            {product.title}
                          </h4>

                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {product.description}
                          </p>

                          {renderProductTipBox(product.tipText, true)}
                        </div>

                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                            <span>📄 {product.pagesCount} صفحة PDF</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewProduct(product);
                                setActiveSampleIndex(0);
                                setIsSampleFullscreen(false);
                              }}
                              className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer touch-manipulation py-1 px-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>التفاصيل والعينة</span>
                            </button>
                          </div>

                          {renderDriveSampleButton(product.driveSampleUrl, true)}

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xl font-black text-blue-600">{product.price} ج.م</span>
                              {product.oldPrice > product.price && (
                                <span className="text-xs text-slate-400 line-through mr-2">
                                  {product.oldPrice} ج.م
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => addToCart(product, 'product')}
                              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition cursor-pointer"
                            >
                              أضف للسلة للتخصيص
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. العروض والباقات */}
        {activeTab === 'bundles' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
            <div className="bg-gradient-to-bl from-[#081229] via-[#0e224d] to-[#1d4ed8] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-black mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>باقات توفير حصرية للمعلمين</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black">باقات التوفير والعروض الحصرية للمعلمين</h2>
                  <p className="text-xs sm:text-sm text-blue-100 mt-1.5 max-w-2xl leading-relaxed">
                    احصل على مجموعات متكاملة من المذكرات وبنوك الأسئلة بخصومات كبيرة + تخصيص كامل باسمك ورقم هاتفك وشعارك على كل مذكرة.
                  </p>
                </div>
                <span className="px-4 py-2.5 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shrink-0 shadow">
                  تخصيص كامل باسمك وشعارك
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/15">
                {[
                  {
                    icon: Package,
                    title: 'توفير حتى 30%',
                    desc: 'أسعار مخفضة للباقات الشاملة مقارنة بالطلب الفردي',
                    tone: 'bg-amber-400/20 text-amber-300 border-amber-300/30'
                  },
                  {
                    icon: UserCheck,
                    title: 'تخصيص كل مذكرة باسمك',
                    desc: 'إضافة اسمك ورقم هاتفك وشعارك على جميع مذكرات الباقة',
                    tone: 'bg-emerald-400/20 text-emerald-300 border-emerald-300/30'
                  },
                  {
                    icon: ShieldCheck,
                    title: 'ملفات PDF عالية الدقة',
                    desc: 'جاهزة للطباعة الفورية ومُراجعة لغوياً وفنياً بالكامل',
                    tone: 'bg-sky-400/20 text-sky-300 border-sky-300/30'
                  }
                ].map((item, i) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={i}
                      className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 flex items-start gap-3"
                    >
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${item.tone}`}>
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-black text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-200 mt-0.5 leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {renderMultiNotebookOffersBanner()}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bundles.map((bundle) => {
                const includedProds = (bundle.productIds || [])
                  .map((pid) => products.find((p) => p.id === pid))
                  .filter(Boolean);
                const savedAmount = Math.max(0, Number(bundle.originalPrice || 0) - Number(bundle.price || 0));

                return (
                  <div
                    key={bundle.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition flex flex-col justify-between"
                  >
                    <div>
                      {/* غلاف الباقة التلقائي الذي يعرض محتويات الباقة على هيئة أيقونات صغيرة وفوقها اسم المذكرة */}
                      <div className="bg-gradient-to-bl from-[#081229] via-[#0f2454] to-[#1d4ed8] p-5 sm:p-6 text-white relative space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {bundle.badge && (
                            <span className="inline-block bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-1 rounded-full shadow">
                              {bundle.badge}
                            </span>
                          )}
                          <span className="text-xs bg-white/15 px-3 py-1 rounded-full font-bold">
                            تشمل {includedProds.length} مذكرات
                          </span>
                        </div>

                        {includedProds.length > 0 && (
                          <div className="rounded-2xl bg-slate-950/45 border border-white/15 p-3.5">
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                              {includedProds.map((prod) => (
                                <div
                                  key={prod.id}
                                  onClick={() => {
                                    setPreviewProduct(prod);
                                    setActiveSampleIndex(0);
                                  }}
                                  className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 p-2 flex flex-col items-center justify-between text-center gap-1.5 cursor-pointer transition group"
                                  title={`معاينة: ${prod.title}`}
                                >
                                  <span className="text-[10px] sm:text-[11px] font-black text-amber-200 group-hover:text-white leading-tight line-clamp-2 min-h-[2rem] flex items-center justify-center">
                                    {prod.title}
                                  </span>
                                  {prod.coverImage ? (
                                    <img
                                      src={prod.coverImage}
                                      alt={prod.title}
                                      className="w-10 h-12 sm:w-11 sm:h-14 rounded-lg object-cover border border-white/25 shadow group-hover:scale-105 transition"
                                    />
                                  ) : (
                                    <div className="w-10 h-12 sm:w-11 sm:h-14 rounded-lg bg-amber-400/20 border border-amber-300/30 text-amber-300 flex items-center justify-center shrink-0">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h3 className="text-xl sm:text-2xl font-black leading-snug">{bundle.title}</h3>
                          <p className="text-xs sm:text-sm text-blue-100 mt-1.5 leading-relaxed">{bundle.subtitle}</p>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6 space-y-2.5">
                        <div className="text-xs font-black text-slate-600 flex items-center justify-between">
                          <span>تفاصيل المذكرات المشمولة (اضغط للمعاينة):</span>
                          {savedAmount > 0 && (
                            <span className="text-emerald-600 font-black">توفير {savedAmount} ج.م</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {includedProds.map((prod) => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => {
                                setPreviewProduct(prod);
                                setActiveSampleIndex(0);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-xs font-bold text-slate-800 hover:text-blue-700 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{prod.title}</span>
                            </button>
                          ))}
                        </div>
                        {bundle.driveSampleUrl && (
                          <div className="pt-2">
                            {renderDriveSampleButton(bundle.driveSampleUrl, true)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-2xl font-black text-blue-600">{bundle.price} ج.م</div>
                        {Number(bundle.originalPrice) > Number(bundle.price) && (
                          <div className="text-xs text-slate-400 line-through">
                            بدلاً من {bundle.originalPrice} ج.م
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(bundle, 'bundle')}
                        className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition cursor-pointer"
                      >
                        اطلب الباقة الآن
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. تتبع طلبك */}
        {activeTab === 'track' && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">تتبع حالة طلبك</h2>
                  <p className="text-xs text-slate-500">
                    أدخل رقم الطلب ورقم الهاتف المسجل للاطلاع على حالة التجهيز والتسليم لحظياً
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={trackOrderId}
                  onChange={(e) => setTrackOrderId(e.target.value)}
                  placeholder="رقم الطلب (مثال: ORD-123456)"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-600"
                />
                <input
                  type="text"
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value)}
                  placeholder="رقم الهاتف المسجل بالطلب"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-600"
                />
              </div>

              {(trackPhone.trim().length >= 4 || trackOrderId.trim().length >= 3) && (
                <div className="space-y-3 pt-2">
                  {orders.filter((o) => {
                    const matchPhone = !trackPhone.trim() || (o.phone1 || '').includes(trackPhone.trim());
                    const matchId = !trackOrderId.trim() || (o.id || '').toLowerCase().includes(trackOrderId.trim().toLowerCase());
                    return matchPhone && matchId;
                  }).length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-600 font-semibold">
                      لم يتم العثور على طلبات مطابقة لرقم الطلب ورقم الهاتف المدخل.
                    </div>
                  ) : (
                    orders
                      .filter((o) => {
                        const matchPhone = !trackPhone.trim() || (o.phone1 || '').includes(trackPhone.trim());
                        const matchId = !trackOrderId.trim() || (o.id || '').toLowerCase().includes(trackOrderId.trim().toLowerCase());
                        return matchPhone && matchId;
                      })
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-slate-900">{ord.id}</span>
                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 space-y-1">
                            <div>المعلم: <span className="font-bold text-slate-900">{ord.teacherName}</span></div>
                            <div>إجمالي الطلب: <span className="font-bold text-blue-600">{ord.total} ج.م</span></div>
                            <div>تاريخ الطلب: {new Date(ord.createdAt).toLocaleString('ar-EG')}</div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. لوحة الإدارة المتكاملة */}
        {activeTab === 'admin' && isAdminAuthenticated && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black">لوحة إدارة منصة العباقرة</h2>
                  <p className="text-xs text-slate-300">
                    {isOfficialAdminGoogle
                      ? `متصل بحساب المدير الرسمي (${user?.email}) ✓ — جميع التعديلات تُحفظ وتُعرض للعملاء فوراً`
                      : 'تنبيه: يجب ربط حساب جوجل للإدارة ليسمح Firebase بحفظ التعديلات للعملاء'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isOfficialAdminGoogle && (
                  <button
                    type="button"
                    onClick={handleAdminGoogleSignIn}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow cursor-pointer animate-pulse"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>ربط حساب جوجل للإدارة (مطلوب للحفظ)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleForcePullFromCloud}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>سحب الصور من السحابة</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllAdminChanges}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ ونشر جميع التعديلات للعملاء</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير نسخة احتياطية</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>تسجيل خروج</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200">
              {[
                { id: 'products', label: `المذكرات والعينات (${products.length})`, icon: BookOpen },
                { id: 'bundles', label: `الباقات (${bundles.length})`, icon: Package },
                { id: 'taxonomy', label: 'المراحل والصفوف والأقسام', icon: Layers },
                { id: 'coupons', label: `الكوبونات والعروض (${coupons.length})`, icon: Tag },
                { id: 'orders', label: `الطلبات (${orders.length})`, icon: ShoppingCart },
                { id: 'settings', label: 'الهوية والشعار والروابط', icon: Sliders },
                { id: 'backup', label: 'النسخ الاحتياطي JSON', icon: Database }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdminSubTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      adminSubTab === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* تبويب 1: إدارة المذكرات + إعدادات زر Google Drive والتنبيهات */}
            {adminSubTab === 'products' && (
              <div className="space-y-6">
                {/* بطاقة التحكم الكامل في المذكرات الظاهرة على الشاشة الرئيسية */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                      <div>
                        <h3 className="text-base font-black text-slate-900">
                          التحكم الكامل في المذكرات التي تظهر على الشاشة الرئيسية
                        </h3>
                        <p className="text-slate-500 mt-0.5">
                          تحكم في عنوان القسم، طريقة العرض (تلقائي أو اختيار يدوي لمذكرات محددة)، وترتيب ظهورها
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAllAdminChanges}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer shadow-sm"
                    >
                      حفظ ونشر إعدادات الرئيسية
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4">
                      <label className="block font-bold text-slate-600 mb-1">عنوان القسم في الرئيسية</label>
                      <input
                        type="text"
                        value={settings.homeProductsTitle ?? 'أحدث المذكرات المضافة'}
                        onChange={(e) =>
                          setSettings({ ...settings, homeProductsTitle: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <label className="block font-bold text-slate-600 mb-1">الوصف أسفل العنوان</label>
                      <input
                        type="text"
                        value={
                          settings.homeProductsSubtitle ??
                          'اختر المذكرة لمعاينة صفحات العينة وطلبها مخصصة باسمك وشعارك'
                        }
                        onChange={(e) =>
                          setSettings({ ...settings, homeProductsSubtitle: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block font-bold text-slate-600 mb-1">طريقة عرض المذكرات</label>
                      <select
                        value={settings.homeProductsMode || 'auto'}
                        onChange={(e) => {
                          const nextMode = e.target.value;
                          const currentIds = Array.isArray(settings.homeFeaturedProductIds)
                            ? settings.homeFeaturedProductIds
                            : [];
                          setSettings({
                            ...settings,
                            homeProductsMode: nextMode,
                            homeFeaturedProductIds:
                              nextMode === 'custom' && currentIds.length === 0
                                ? visibleProducts.slice(0, 6).map((p) => p.id)
                                : currentIds
                          });
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-black text-blue-700"
                      >
                        <option value="auto">تلقائي (عرض أحدث المذكرات)</option>
                        <option value="custom">يدوي (اختيار وترتيب مذكرات محددة)</option>
                      </select>
                    </div>
                  </div>

                  {(settings.homeProductsMode || 'auto') === 'auto' ? (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <span className="font-bold text-slate-700">
                        الوضع التلقائي يعرض أحدث المذكرات غير المخفية بالترتيب. حدد العدد الأقصى للعرض:
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={settings.homeProductsCount ?? 6}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              homeProductsCount: Math.max(1, Number(e.target.value || 6))
                            })
                          }
                          className="w-24 px-3 py-2 rounded-xl border border-slate-200 bg-white font-black text-center"
                        />
                        <span className="font-bold text-slate-600">مذكرة</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
                      <div className="lg:col-span-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="font-black text-slate-800">
                          1. اختر المذكرات التي تريد إظهارها في الشاشة الرئيسية:
                        </div>
                        <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                          {products.map((prod) => {
                            const selectedIds = Array.isArray(settings.homeFeaturedProductIds)
                              ? settings.homeFeaturedProductIds
                              : [];
                            const isChecked = selectedIds.includes(prod.id);
                            return (
                              <label
                                key={prod.id}
                                className={`flex items-center justify-between gap-2 p-2 rounded-xl border cursor-pointer transition ${
                                  isChecked
                                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-black'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      const nextIds = isChecked
                                        ? selectedIds.filter((id) => id !== prod.id)
                                        : [...selectedIds, prod.id];
                                      setSettings({
                                        ...settings,
                                        homeFeaturedProductIds: nextIds
                                      });
                                    }}
                                  />
                                  <span className="truncate">{prod.title}</span>
                                </div>
                                {prod.hidden && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold shrink-0">
                                    مخفية
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="lg:col-span-6 p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                        <div className="font-black text-blue-950">
                          2. ترتيب ظهور المذكرات المختارة في الرئيسية (
                          {(settings.homeFeaturedProductIds || []).length}):
                        </div>
                        {(settings.homeFeaturedProductIds || []).length === 0 ? (
                          <div className="p-6 text-center text-slate-500 font-bold">
                            حدد المذكرات من القائمة المجاورة لتظهر هنا وتتمكن من ترتيبها.
                          </div>
                        ) : (
                          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                            {(settings.homeFeaturedProductIds || []).map((fid, idx, arr) => {
                              const fProd = products.find((p) => p.id === fid);
                              if (!fProd) return null;
                              return (
                                <div
                                  key={fid}
                                  className="p-2 rounded-xl bg-white border border-blue-200 flex items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <span className="font-bold text-slate-900 truncate">
                                      {fProd.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => {
                                        if (idx === 0) return;
                                        const copy = [...arr];
                                        [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                                        setSettings({ ...settings, homeFeaturedProductIds: copy });
                                      }}
                                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-black cursor-pointer"
                                      title="تقديم للأعلى"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === arr.length - 1}
                                      onClick={() => {
                                        if (idx === arr.length - 1) return;
                                        const copy = [...arr];
                                        [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                                        setSettings({ ...settings, homeFeaturedProductIds: copy });
                                      }}
                                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-black cursor-pointer"
                                      title="تأخير للأسفل"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSettings({
                                          ...settings,
                                          homeFeaturedProductIds: arr.filter((id) => id !== fid)
                                        });
                                      }}
                                      className="p-1 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"
                                      title="إزالة من الرئيسية"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* بطاقة التحكم في زر معاينة Google Drive */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-base font-black text-slate-900">التحكم في زر معاينة عينة Google Drive</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-1.5 font-bold text-emerald-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.driveButtonEnabled !== false}
                          onChange={(e) =>
                            setSettings({ ...settings, driveButtonEnabled: e.target.checked })
                          }
                        />
                        <span>إظهار الزر للعملاء</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold text-blue-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.driveButtonShowOnCard !== false}
                          onChange={(e) =>
                            setSettings({ ...settings, driveButtonShowOnCard: e.target.checked })
                          }
                        />
                        <span>إظهاره على بطاقة المذكرة</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSaveAllAdminChanges}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer"
                      >
                        حفظ التعديلات
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5">
                      <label className="block font-bold text-slate-600 mb-1">نص الزر</label>
                      <input
                        type="text"
                        value={settings.driveButtonText ?? 'معاينة عينة Google Drive'}
                        onChange={(e) =>
                          setSettings({ ...settings, driveButtonText: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-1">لون الخلفية</label>
                      <input
                        type="color"
                        value={settings.driveButtonBg || '#ecfdf5'}
                        onChange={(e) =>
                          setSettings({ ...settings, driveButtonBg: e.target.value })
                        }
                        className="w-full h-10 rounded-xl border border-slate-200 cursor-pointer"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-1">لون النص</label>
                      <input
                        type="color"
                        value={settings.driveButtonTextColor || '#047857'}
                        onChange={(e) =>
                          setSettings({ ...settings, driveButtonTextColor: e.target.value })
                        }
                        className="w-full h-10 rounded-xl border border-slate-200 cursor-pointer"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <div className="text-[11px] font-bold text-slate-500 mb-1">معاينة شكل الزر:</div>
                      <div
                        style={{
                          backgroundColor: settings.driveButtonBg || '#ecfdf5',
                          color: settings.driveButtonTextColor || '#047857'
                        }}
                        className="py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border border-black/10"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{safeText(settings.driveButtonText, 'معاينة عينة Google Drive')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* بطاقة التحكم المطورة والمبسطة في التنبيهات */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 text-xs shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900">إعدادات التنبيهات المبسطة للمذكرات</h3>
                      <p className="text-slate-500 mt-0.5">اختر قالباً جاهزاً أو خصص الخلفية ولون النص وشاهد المعاينة المباشرة</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAllAdminChanges}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer shadow-sm"
                    >
                      حفظ ونشر تعديلات التنبيهات
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. التنبيه العام */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-sm text-slate-900">1. التنبيه العام (في نافذة المعاينة)</h4>
                        <label className="flex items-center gap-1.5 font-bold text-blue-600 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                          <input
                            type="checkbox"
                            checked={settings.generalNoticeEnabled !== false}
                            onChange={(e) =>
                              setSettings({ ...settings, generalNoticeEnabled: e.target.checked })
                            }
                          />
                          <span>إظهار التنبيه العام</span>
                        </label>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">عنوان التنبيه العام</label>
                        <input
                          type="text"
                          value={settings.generalNoticeTitle ?? 'تنبيه هام للمعلمين قبل تأكيد الطلب:'}
                          onChange={(e) =>
                            setSettings({ ...settings, generalNoticeTitle: e.target.value })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">نص التنبيه العام</label>
                        <textarea
                          rows={3}
                          value={settings.generalNoticeText ?? DEFAULT_SETTINGS.generalNoticeText}
                          onChange={(e) =>
                            setSettings({ ...settings, generalNoticeText: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <span className="block font-bold text-slate-600">قوالب ألوان جاهزة بضغطة واحدة:</span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { name: 'رمادي هادئ', bg: '#f8fafc', text: '#334155' },
                            { name: 'أزرق سماوي', bg: '#eff6ff', text: '#1e3a8a' },
                            { name: 'ذهبي دافئ', bg: '#fffbeb', text: '#78350f' },
                            { name: 'أخضر نعناعي', bg: '#ecfdf5', text: '#065f46' },
                            { name: 'كحلي داكن', bg: '#0f172a', text: '#f8fafc' }
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() =>
                                setSettings({
                                  ...settings,
                                  generalNoticeBg: preset.bg,
                                  generalNoticeTextColor: preset.text
                                })
                              }
                              style={{ backgroundColor: preset.bg, color: preset.text }}
                              className="px-3 py-1.5 rounded-xl border border-black/15 font-black text-[11px] shadow-2xs hover:scale-105 transition cursor-pointer"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">مكان الظهور</label>
                          <select
                            value={settings.generalNoticePosition || 'bottom'}
                            onChange={(e) =>
                              setSettings({ ...settings, generalNoticePosition: e.target.value })
                            }
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                          >
                            <option value="top">أعلى التفاصيل</option>
                            <option value="bottom">أسفل التفاصيل</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">لون الخلفية</label>
                          <input
                            type="color"
                            value={settings.generalNoticeBg || '#f8fafc'}
                            onChange={(e) =>
                              setSettings({ ...settings, generalNoticeBg: e.target.value })
                            }
                            className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">لون النص</label>
                          <input
                            type="color"
                            value={settings.generalNoticeTextColor || '#334155'}
                            onChange={(e) =>
                              setSettings({ ...settings, generalNoticeTextColor: e.target.value })
                            }
                            className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="block text-[11px] font-bold text-slate-500 mb-1.5">معاينة حية للتنبيه العام:</span>
                        {renderGeneralNoticeBox()}
                      </div>
                    </div>

                    {/* 2. التنبيه الخاص بكل مذكرة */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-black text-sm text-slate-900">2. التنبيه الخاص بكل مذكرة</h4>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 font-bold text-emerald-700 cursor-pointer bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                              <input
                                type="checkbox"
                                checked={settings.tipNoticeEnabled !== false}
                                onChange={(e) =>
                                  setSettings({ ...settings, tipNoticeEnabled: e.target.checked })
                                }
                              />
                              <span>بالمعاينة</span>
                            </label>
                            <label className="flex items-center gap-1.5 font-bold text-blue-600 cursor-pointer bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                              <input
                                type="checkbox"
                                checked={settings.tipShowOnCard !== false}
                                onChange={(e) =>
                                  setSettings({ ...settings, tipShowOnCard: e.target.checked })
                                }
                              />
                              <span>بالبطاقة</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block font-bold text-slate-600">قوالب ألوان جاهزة بضغطة واحدة:</span>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { name: 'ذهبي دافئ', bg: '#fffbeb', text: '#78350f' },
                              { name: 'أزرق ملكي', bg: '#1d4ed8', text: '#ffffff' },
                              { name: 'أخضر زمردي', bg: '#ecfdf5', text: '#065f46' },
                              { name: 'وردي تنبيهي', bg: '#fff1f2', text: '#9f1239' },
                              { name: 'كحلي داكن', bg: '#0f172a', text: '#fde047' }
                            ].map((preset) => (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() =>
                                  setSettings({
                                    ...settings,
                                    tipNoticeBg: preset.bg,
                                    tipNoticeTextColor: preset.text
                                  })
                                }
                                style={{ backgroundColor: preset.bg, color: preset.text }}
                                className="px-3 py-1.5 rounded-xl border border-black/15 font-black text-[11px] shadow-2xs hover:scale-105 transition cursor-pointer"
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">مكان الظهور</label>
                            <select
                              value={settings.tipNoticePosition || 'below-desc'}
                              onChange={(e) =>
                                setSettings({ ...settings, tipNoticePosition: e.target.value })
                              }
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                            >
                              <option value="above-desc">أعلى الوصف</option>
                              <option value="below-desc">أسفل الوصف</option>
                              <option value="before-actions">قبل أزرار الطلب</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">لون الخلفية</label>
                            <input
                              type="color"
                              value={settings.tipNoticeBg || '#fffbeb'}
                              onChange={(e) =>
                                setSettings({ ...settings, tipNoticeBg: e.target.value })
                              }
                              className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">لون النص</label>
                            <input
                              type="color"
                              value={settings.tipNoticeTextColor || '#78350f'}
                              onChange={(e) =>
                                setSettings({ ...settings, tipNoticeTextColor: e.target.value })
                              }
                              className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="block text-[11px] font-bold text-slate-500 mb-1.5">معاينة حية لتنبيه المذكرة:</span>
                        {renderProductTipBox('ملاحظة: للمراجعة المُثلى اطلبها مع بوكليت الاختبارات الشاملة', false)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* نموذج إضافة/تعديل المذكرات + قائمة المذكرات */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <form
                    onSubmit={handleSaveProduct}
                    className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 h-fit"
                  >
                    <h3 className="text-base font-black text-slate-900">
                      {editingProductId ? 'تعديل بيانات المذكرة' : 'إضافة مذكرة جديدة'}
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">عنوان المذكرة *</label>
                        <input
                          type="text"
                          required
                          value={productForm.title}
                          onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                          placeholder="مثال: بنك مراجعة الصف الثالث الإعدادي"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">المرحلة</label>
                          <select
                            value={productForm.stageId}
                            onChange={(e) => setProductForm({ ...productForm, stageId: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                          >
                            {normalizedStages.map((s) => (
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
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                          >
                            {normalizedGrades.map((g) => (
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
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                          >
                            {normalizedCategories.map((c) => (
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
                            onChange={(e) => setProductForm({ ...productForm, pagesCount: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">السعر بعد الخصم (ج.م)</label>
                          <input
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">السعر قبل الخصم (ج.م)</label>
                          <input
                            type="number"
                            value={productForm.oldPrice}
                            onChange={(e) => setProductForm({ ...productForm, oldPrice: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">الشريط الذهبي فوق المذكرة</label>
                        <input
                          type="text"
                          value={productForm.badgeText || ''}
                          onChange={(e) => setProductForm({ ...productForm, badgeText: e.target.value })}
                          placeholder="مثال: الخيار الأفضل للمراجعة"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">التنبيه الخاص بالمذكرة (صندوق مستقل)</label>
                        <input
                          type="text"
                          value={productForm.tipText || ''}
                          onChange={(e) => setProductForm({ ...productForm, tipText: e.target.value })}
                          placeholder="مثال: ملاحظة: للمراجعة المُثلى اطلبها مع البوكليت"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">رابط عينة Google Drive</label>
                        <input
                          type="url"
                          value={productForm.driveSampleUrl}
                          onChange={(e) => setProductForm({ ...productForm, driveSampleUrl: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none text-left"
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">وصف المذكرة</label>
                        <textarea
                          rows={3}
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                        />
                      </div>

                      <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                        <label className="block font-black text-blue-900">صورة غلاف المذكرة</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const compressed = await compressImageFile(f, 800, 0.82);
                            setProductForm((prev) => ({ ...prev, coverImage: compressed }));
                          }}
                          className="block w-full text-xs"
                        />
                        {productForm.coverImage && (
                          <img
                            src={productForm.coverImage}
                            alt="معاينة الغلاف"
                            className="h-24 rounded-xl object-cover border"
                          />
                        )}
                      </div>

                      <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                        <label className="block font-black text-emerald-900">
                          صور صفحات العينة الداخلية
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            const compressedList = await Promise.all(
                              files.map((f) => compressImageFile(f, 950, 0.8))
                            );
                            setProductForm((prev) => ({
                              ...prev,
                              sampleImages: [...(prev.sampleImages || []), ...compressedList]
                            }));
                            showToast(`تم تجهيز ${compressedList.length} صورة عينة`);
                          }}
                          className="block w-full text-xs"
                        />
                        {Array.isArray(productForm.sampleImages) && productForm.sampleImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {productForm.sampleImages.map((img, i) => (
                              <div key={i} className="relative">
                                <img src={img} alt="" className="w-14 h-16 object-cover rounded-lg border" />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProductForm((prev) => ({
                                      ...prev,
                                      sampleImages: prev.sampleImages.filter((_, idx) => idx !== i)
                                    }))
                                  }
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm cursor-pointer"
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
                                gradeId: 'grd_1795789580003',
                                categoryId: 'cat_term1',
                                pagesCount: 80,
                                price: 149,
                                oldPrice: 200,
                                badgeText: '',
                                tipText: '',
                                description: '',
                                driveSampleUrl: 'https://drive.google.com/',
                                coverImage: '',
                                sampleImages: [],
                                hidden: false
                              });
                            }}
                            className="px-4 py-3 rounded-xl bg-slate-200 text-slate-700 font-bold"
                          >
                            إلغاء
                          </button>
                        )}
                      </div>
                    </div>
                  </form>

                  <div className="lg:col-span-7 space-y-3">
                    {products.map((prod) => {
                      const isFeaturedOnHome =
                        (settings.homeProductsMode || 'auto') === 'custom' &&
                        Array.isArray(settings.homeFeaturedProductIds) &&
                        settings.homeFeaturedProductIds.includes(prod.id);

                      return (
                        <div
                          key={prod.id}
                          className={`bg-white rounded-2xl border p-4 flex items-center justify-between gap-4 shadow-2xs transition ${
                            prod.hidden ? 'border-amber-300 bg-amber-50/30 opacity-75' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <img
                              src={prod.coverImage || resolvedLogo}
                              alt={prod.title}
                              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-black text-sm text-slate-900">{prod.title}</h4>
                                {isFeaturedOnHome && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black">
                                    معروضة بالرئيسية
                                  </span>
                                )}
                                {prod.hidden && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-black">
                                    مخفية
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {prod.price} ج.م • {prod.pagesCount} صفحة •{' '}
                                <span className="text-emerald-600 font-bold">
                                  {(prod.sampleImages || []).length} عينة
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const currentIds = Array.isArray(settings.homeFeaturedProductIds)
                                  ? settings.homeFeaturedProductIds
                                  : visibleProducts.slice(0, 6).map((p) => p.id);
                                const exists = currentIds.includes(prod.id);
                                const nextIds = exists
                                  ? currentIds.filter((id) => id !== prod.id)
                                  : [...currentIds, prod.id];
                                setSettings({
                                  ...settings,
                                  homeProductsMode: 'custom',
                                  homeFeaturedProductIds: nextIds
                                });
                                showToast(
                                  exists
                                    ? 'تمت إزالة المذكرة من الشاشة الرئيسية — اضغط حفظ لنشر التعديل'
                                    : 'تم تثبيت المذكرة في الشاشة الرئيسية — اضغط حفظ لنشر التعديل'
                                );
                              }}
                              title={
                                isFeaturedOnHome
                                  ? 'إزالة من الشاشة الرئيسية'
                                  : 'تثبيت في الشاشة الرئيسية'
                              }
                              className={`p-2 rounded-xl transition cursor-pointer ${
                                isFeaturedOnHome
                                  ? 'bg-amber-100 text-amber-600'
                                  : 'bg-slate-100 text-slate-400 hover:text-amber-500'
                              }`}
                            >
                              <Star
                                className={`w-4 h-4 ${isFeaturedOnHome ? 'fill-amber-500' : ''}`}
                              />
                            </button>
                            <button
                              onClick={() => handleToggleProductVisibility(prod)}
                              title={prod.hidden ? 'إظهار المذكرة' : 'إخفاء المذكرة'}
                              className={`p-2 rounded-xl transition cursor-pointer ${
                                prod.hidden
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {prod.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                setEditingProductId(prod.id);
                                setProductForm({
                                  ...prod,
                                  badgeText: prod.badgeText || '',
                                  tipText: prod.tipText || '',
                                  sampleImages: prod.sampleImages || []
                                });
                              }}
                              className="p-2 rounded-xl bg-blue-50 text-blue-600 cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"
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

            {/* تبويب 2: إدارة الباقات (إضافة + تعديل كامل بدون صورة غلاف) */}
            {adminSubTab === 'bundles' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 h-fit">
                  <h3 className="text-base font-black text-slate-900">
                    {editingBundleId ? 'تعديل بيانات الباقة' : 'إضافة باقة مخفضة جديدة'}
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">اسم الباقة *</label>
                      <input
                        type="text"
                        placeholder="مثال: باقة مراجعات المرحلة الإعدادية"
                        value={newBundleForm.title}
                        onChange={(e) => setNewBundleForm({ ...newBundleForm, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">وصف الباقة</label>
                      <textarea
                        rows={2}
                        placeholder="وصف مختصر لمزايا الباقة..."
                        value={newBundleForm.subtitle}
                        onChange={(e) => setNewBundleForm({ ...newBundleForm, subtitle: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">سعر الباقة (ج.م)</label>
                        <input
                          type="number"
                          value={newBundleForm.price}
                          onChange={(e) => setNewBundleForm({ ...newBundleForm, price: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">السعر الأصلي قبل الخصم</label>
                        <input
                          type="number"
                          value={newBundleForm.originalPrice}
                          onChange={(e) =>
                            setNewBundleForm({ ...newBundleForm, originalPrice: Number(e.target.value) })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">شارة التوفير</label>
                      <input
                        type="text"
                        placeholder="مثال: وفر 150 ج.م"
                        value={newBundleForm.badge}
                        onChange={(e) => setNewBundleForm({ ...newBundleForm, badge: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">رابط عينة Google Drive للباقة (اختياري)</label>
                      <input
                        type="url"
                        dir="ltr"
                        placeholder="https://drive.google.com/..."
                        value={newBundleForm.driveSampleUrl || ''}
                        onChange={(e) => setNewBundleForm({ ...newBundleForm, driveSampleUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-left"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2 font-black text-slate-800">
                        <span>
                          اختر المذكرات المشمولة داخل الباقة ({newBundleForm.productIds.length}):
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px]">
                          الإجمالي:{' '}
                          {newBundleForm.productIds.reduce((sum, id) => {
                            const found = products.find((p) => p.id === id);
                            return sum + Number(found?.price || 0);
                          }, 0)}{' '}
                          ج.م
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {products.map((prod) => {
                          const isChecked = newBundleForm.productIds.includes(prod.id);
                          return (
                            <label
                              key={prod.id}
                              className={`flex items-center justify-between gap-2 p-2 rounded-xl border cursor-pointer transition ${
                                isChecked
                                  ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setNewBundleForm((prev) => {
                                      const nextIds = isChecked
                                        ? prev.productIds.filter((id) => id !== prod.id)
                                        : [...prev.productIds, prod.id];
                                      const computedOriginal = nextIds.reduce((sum, id) => {
                                        const found = products.find((p) => p.id === id);
                                        return sum + Number(found?.price || 0);
                                      }, 0);
                                      return {
                                        ...prev,
                                        productIds: nextIds,
                                        originalPrice: computedOriginal
                                      };
                                    });
                                  }}
                                />
                                <span className="truncate">{prod.title}</span>
                              </div>
                              <span className="text-[11px] font-bold shrink-0">{prod.price} ج.م</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newBundleForm.title.trim()) {
                            showToast('يرجى إدخال اسم الباقة أولاً', 'error');
                            return;
                          }
                          const bId = editingBundleId || `bnd_${Date.now()}`;
                          const { coverImage, ...cleanBundleData } = newBundleForm;
                          const bObj = { ...cleanBundleData, id: bId };
                          const next = editingBundleId
                            ? bundles.map((item) => (item.id === editingBundleId ? bObj : item))
                            : [bObj, ...bundles];
                          setBundles(next);
                          await idbSet('bundles_v5', next);
                          safeLocalSet('el3bakera_bundles_v5', next);
                          if (db && isOfficialAdminGoogle) {
                            await setDoc(
                              doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles', bId),
                              bObj,
                              { merge: true }
                            );
                          }
                          setEditingBundleId(null);
                          setNewBundleForm({
                            title: '',
                            subtitle: '',
                            price: 499,
                            originalPrice: 650,
                            badge: 'عرض خاص',
                            driveSampleUrl: '',
                            productIds: []
                          });
                          showToast(editingBundleId ? 'تم تحديث الباقة وحفظها بنجاح' : 'تمت إضافة الباقة وحفظها بنجاح');
                        }}
                        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm cursor-pointer"
                      >
                        {editingBundleId ? 'حفظ تعديلات الباقة' : 'إضافة الباقة'}
                      </button>
                      {editingBundleId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBundleId(null);
                            setNewBundleForm({
                              title: '',
                              subtitle: '',
                              price: 499,
                              originalPrice: 650,
                              badge: 'وفر 150 ج.م',
                              driveSampleUrl: '',
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
                </div>

                <div className="lg:col-span-7 space-y-3">
                  {bundles.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-slate-900 truncate">{b.title}</h4>
                          {b.badge && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black shrink-0">
                              {b.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {b.price} ج.م (بدلاً من {b.originalPrice} ج.م) • تشمل {(b.productIds || []).length} مذكرات
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBundleId(b.id);
                            setNewBundleForm({
                              title: b.title || '',
                              subtitle: b.subtitle || '',
                              price: Number(b.price || 0),
                              originalPrice: Number(b.originalPrice || 0),
                              badge: b.badge || '',
                              driveSampleUrl: b.driveSampleUrl || '',
                              productIds: Array.isArray(b.productIds) ? b.productIds : []
                            });
                          }}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 cursor-pointer"
                          title="تعديل الباقة"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const next = bundles.filter((x) => x.id !== b.id);
                            setBundles(next);
                            await idbSet('bundles_v5', next);
                            safeLocalSet('el3bakera_bundles_v5', next);
                            if (db && isOfficialAdminGoogle) {
                              await deleteDoc(
                                doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles', b.id)
                              );
                            }
                            showToast('تم حذف الباقة');
                          }}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"
                          title="حذف الباقة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* تبويب 3: إدارة المراحل والصفوف والأقسام */}
            {adminSubTab === 'taxonomy' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900">الأقسام الدراسية وصور الأغلفة</h3>
                      <p className="text-xs text-slate-500">
                        يمكنك تعديل اسم كل قسم أو رفع صورة غلاف جديدة له وحفظ التعديلات مباشرة
                      </p>
                    </div>
                    <button
                      onClick={handleSaveAllAdminChanges}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer"
                    >
                      حفظ تعديلات الأقسام
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="اسم القسم الجديد..."
                      className="sm:col-span-5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                    <input
                      type="text"
                      value={newCategorySubtitle}
                      onChange={(e) => setNewCategorySubtitle(e.target.value)}
                      placeholder="وصف مختصر للقسم..."
                      className="sm:col-span-5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                    <button
                      onClick={() => {
                        if (!newCategoryName.trim()) return;
                        const updatedCats = [
                          ...normalizedCategories,
                          {
                            id: `cat_${Date.now()}`,
                            name: newCategoryName.trim(),
                            subtitle: newCategorySubtitle.trim(),
                            coverImage: ''
                          }
                        ];
                        saveSettings({ ...settings, categories: updatedCats });
                        setNewCategoryName('');
                        setNewCategorySubtitle('');
                        showToast('تمت إضافة القسم بنجاح');
                      }}
                      className="sm:col-span-2 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer"
                    >
                      + إضافة قسم
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {normalizedCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col justify-between"
                      >
                        <div>
                          <div className="aspect-[16/9] bg-slate-200 relative overflow-hidden">
                            {cat.coverImage ? (
                              <img src={cat.coverImage} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                                بدون صورة غلاف
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const updatedCats = normalizedCategories.filter((c) => c.id !== cat.id);
                                setSettings({ ...settings, categories: updatedCats });
                                showToast('تم حذف القسم — اضغط حفظ التعديلات للاعتماد');
                              }}
                              className="absolute top-2 left-2 p-2 rounded-xl bg-rose-600 text-white shadow cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="p-4 space-y-2">
                            <input
                              type="text"
                              value={cat.name}
                              onChange={(e) => {
                                const updatedCats = normalizedCategories.map((c) =>
                                  c.id === cat.id ? { ...c, name: e.target.value } : c
                                );
                                setSettings({ ...settings, categories: updatedCats });
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black"
                            />
                            <label className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold cursor-pointer hover:underline">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{cat.coverImage ? 'تغيير صورة القسم' : 'رفع صورة غلاف للقسم'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  const img = await compressImageFile(f, 800, 0.82);
                                  const updatedCats = normalizedCategories.map((c) =>
                                    c.id === cat.id ? { ...c, coverImage: img } : c
                                  );
                                  setSettings({ ...settings, categories: updatedCats });
                                  showToast('تم تجهيز صورة القسم — اضغط حفظ التعديلات للاعتماد');
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-base font-black text-slate-900">المراحل الدراسية</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        placeholder="اسم المرحلة..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newStageName.trim()) return;
                          const next = [...normalizedStages, { id: `stg_${Date.now()}`, name: newStageName.trim() }];
                          setSettings({ ...settings, stages: next });
                          setNewStageName('');
                          showToast('تمت إضافة المرحلة — اضغط حفظ التعديلات للاعتماد');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                      >
                        إضافة
                      </button>
                    </div>
                    <div className="space-y-2">
                      {normalizedStages.map((st) => (
                        <div key={st.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs font-bold">
                          <span>{st.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSettings({
                                ...settings,
                                stages: normalizedStages.filter((s) => s.id !== st.id)
                              });
                              showToast('تم حذف المرحلة — اضغط حفظ التعديلات للاعتماد');
                            }}
                            className="text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAllAdminChanges}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer"
                    >
                      حفظ تعديلات المراحل
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-base font-black text-slate-900">الصفوف الدراسية</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <select
                        value={newGradeStageId}
                        onChange={(e) => setNewGradeStageId(e.target.value)}
                        className="sm:col-span-5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                      >
                        {normalizedStages.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newGradeName}
                        onChange={(e) => setNewGradeName(e.target.value)}
                        placeholder="اسم الصف الدراسي..."
                        className="sm:col-span-5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newGradeName.trim()) return;
                          const next = [
                            ...normalizedGrades,
                            {
                              id: `grd_${Date.now()}`,
                              stageId: newGradeStageId,
                              name: newGradeName.trim()
                            }
                          ];
                          setSettings({ ...settings, grades: next });
                          setNewGradeName('');
                          showToast('تمت إضافة الصف — اضغط حفظ التعديلات للاعتماد');
                        }}
                        className="sm:col-span-2 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                      >
                        إضافة
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {normalizedGrades.map((gr) => {
                        const stObj = normalizedStages.find((s) => s.id === gr.stageId);
                        return (
                          <div
                            key={gr.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs font-bold"
                          >
                            <div>
                              <span>{gr.name}</span>
                              {stObj && (
                                <span className="text-[11px] text-slate-400 mr-2">({stObj.name})</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSettings({
                                  ...settings,
                                  grades: normalizedGrades.filter((g) => g.id !== gr.id)
                                });
                                showToast('تم حذف الصف — اضغط حفظ التعديلات للاعتماد');
                              }}
                              className="text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAllAdminChanges}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer"
                    >
                      حفظ تعديلات الصفوف
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* تبويب 4: إدارة الكوبونات والشريط الترويجي وعروض الحصول على أكثر من مذكرة */}
            {adminSubTab === 'coupons' && (
              <div className="space-y-6 text-xs">
                {/* قسم إنشاء وإدارة عروض الحصول على أكثر من مذكرة (عروض متعددة + تحديد مذكرات معينة أو الكل) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-amber-500" />
                      <div>
                        <h3 className="text-base font-black text-slate-900">عروض الحصول على أكثر من مذكرة (عروض متعددة)</h3>
                        <p className="text-slate-500 mt-0.5">أنشئ عرضاً أو أكثر وحدد له نسبة الخصم والمذكرات المشمولة (أو اتركها بدون تحديد ليشمل جميع المذكرات)</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAllAdminChanges}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer"
                    >
                      حفظ ونشر العروض
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* نموذج إضافة / تعديل عرض */}
                    <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <h4 className="font-black text-sm text-slate-900">
                        {editingMultiOfferId ? 'تعديل العرض الحالي' : 'إضافة عرض جديد عند طلب أكثر من مذكرة'}
                      </h4>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">عنوان العرض *</label>
                        <input
                          type="text"
                          placeholder="مثال: عرض خاص عند طلب مذكرتين فأكثر!"
                          value={multiOfferForm.title}
                          onChange={(e) => setMultiOfferForm({ ...multiOfferForm, title: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">وصف العرض</label>
                        <textarea
                          rows={2}
                          placeholder="مثال: احصل على خصم 15% تلقائياً عند إضافة مذكرتين إلى السلة..."
                          value={multiOfferForm.subtitle}
                          onChange={(e) => setMultiOfferForm({ ...multiOfferForm, subtitle: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
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
                          <label className="block font-bold text-slate-600 mb-1">نسبة الخصم %</label>
                          <input
                            type="number"
                            value={multiOfferForm.discountPercent}
                            onChange={(e) => setMultiOfferForm({ ...multiOfferForm, discountPercent: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">أقصى خصم ج.م</label>
                          <input
                            type="number"
                            value={multiOfferForm.maxDiscount}
                            onChange={(e) => setMultiOfferForm({ ...multiOfferForm, maxDiscount: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                          />
                        </div>
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
                            const rawDisc = Math.round((selectedTotal * Number(multiOfferForm.discountPercent || 0)) / 100);
                            const finalDisc = multiOfferForm.maxDiscount
                              ? Math.min(rawDisc, Number(multiOfferForm.maxDiscount))
                              : rawDisc;
                            return (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px]">
                                الإجمالي: {selectedTotal} ج.م (بعد الخصم: {Math.max(0, selectedTotal - finalDisc)} ج.م)
                              </span>
                            );
                          })()}
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                          {products.map((prod) => {
                            const isChecked = multiOfferForm.productIds.includes(prod.id);
                            return (
                              <label
                                key={prod.id}
                                className={`flex items-center justify-between gap-2 p-2 rounded-xl border cursor-pointer transition ${
                                  isChecked
                                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setMultiOfferForm((prev) => ({
                                        ...prev,
                                        productIds: isChecked
                                          ? prev.productIds.filter((id) => id !== prod.id)
                                          : [...prev.productIds, prod.id]
                                      }));
                                    }}
                                  />
                                  <span className="truncate">{prod.title}</span>
                                </div>
                                <span className="text-[11px] font-bold shrink-0">{prod.price} ج.م</span>
                              </label>
                            );
                          })}
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
                            const offerObj = {
                              ...multiOfferForm,
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
                              discountPercent: 15,
                              maxDiscount: 150,
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
                                discountPercent: 15,
                                maxDiscount: 150,
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
                                  خصم {off.discountPercent}% عند {off.minItems}+ مذكرات
                                </span>
                                <h4 className="font-black text-sm text-slate-900 truncate">{off.title}</h4>
                              </div>
                              <p className="text-slate-500 truncate">{off.subtitle}</p>
                              <div className="text-[11px] font-bold text-blue-600">
                                {Array.isArray(off.productIds) && off.productIds.length > 0
                                  ? `يسري على ${off.productIds.length} مذكرات محددة`
                                  : 'شامل لجميع مذكرات المنصة'}
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
                                    discountPercent: Number(off.discountPercent || 15),
                                    maxDiscount: Number(off.maxDiscount || 150),
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

                {/* الشريط الترويجي العلوي وكوبونات الخصم */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-slate-900">الشريط الترويجي العلوي</h3>
                        <label className="flex items-center gap-1.5 font-bold text-blue-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.promoEnabled !== false}
                            onChange={(e) => setSettings({ ...settings, promoEnabled: e.target.checked })}
                          />
                          <span>تفعيل الشريط</span>
                        </label>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">نص العرض الترويجي</label>
                        <input
                          type="text"
                          value={settings.promoText || ''}
                          onChange={(e) => setSettings({ ...settings, promoText: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">كود الخصم</label>
                          <input
                            type="text"
                            value={settings.promoCouponCode || ''}
                            onChange={(e) =>
                              setSettings({ ...settings, promoCouponCode: e.target.value.toUpperCase() })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 uppercase font-black"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">لون الخلفية</label>
                          <input
                            type="color"
                            value={settings.promoBgColor || '#0654d0'}
                            onChange={(e) => setSettings({ ...settings, promoBgColor: e.target.value })}
                            className="w-full h-9 rounded-xl border border-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">لون النص</label>
                          <input
                            type="color"
                            value={settings.promoTextColor || '#fde047'}
                            onChange={(e) => setSettings({ ...settings, promoTextColor: e.target.value })}
                            className="w-full h-9 rounded-xl border border-slate-200"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveAllAdminChanges}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer"
                      >
                        حفظ إعدادات الشريط
                      </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                      <h3 className="text-base font-black text-slate-900">إضافة كوبون خصم جديد</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">الكود *</label>
                          <input
                            type="text"
                            placeholder="M20"
                            value={newCouponForm.code}
                            onChange={(e) =>
                              setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 uppercase font-black"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">نسبة الخصم %</label>
                          <input
                            type="number"
                            value={newCouponForm.discountPercent}
                            onChange={(e) =>
                              setNewCouponForm({ ...newCouponForm, discountPercent: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">أقصى خصم ج.م</label>
                          <input
                            type="number"
                            value={newCouponForm.maxDiscount}
                            onChange={(e) =>
                              setNewCouponForm({ ...newCouponForm, maxDiscount: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newCouponForm.code.trim()) {
                            showToast('يرجى كتابة كود الخصم أولاً', 'error');
                            return;
                          }
                          const cpObj = {
                            ...newCouponForm,
                            id: `cp_${Date.now()}`,
                            code: newCouponForm.code.trim().toUpperCase(),
                            active: true
                          };
                          const next = [cpObj, ...coupons];
                          setCoupons(next);
                          await idbSet('coupons_v5', next);
                          safeLocalSet('el3bakera_coupons_v5', next);
                          if (db && isOfficialAdminGoogle) {
                            await setDoc(
                              doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons', cpObj.id),
                              cpObj
                            );
                          }
                          setNewCouponForm({ code: '', discountPercent: 15, maxDiscount: 200, active: true });
                          showToast(`تمت إضافة الكوبون ${cpObj.code} بنجاح`);
                        }}
                        className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black cursor-pointer"
                      >
                        + إضافة الكوبون الآن
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-base font-black text-slate-900">
                      الكوبونات المتاحة على المنصة ({coupons.length})
                    </h3>
                    <div className="space-y-2.5">
                      {coupons.map((cp) => (
                        <div
                          key={cp.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-sm">
                              {cp.code}
                            </span>
                            <div>
                              <div className="font-black text-slate-900">
                                خصم {cp.discountPercent}% (بحد أقصى {cp.maxDiscount || 200} ج.م)
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {cp.active !== false ? 'مفعّل ويعمل في السلة' : 'معطّل حالياً'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const updated = { ...cp, active: cp.active === false };
                                const next = coupons.map((c) => (c.id === cp.id ? updated : c));
                                setCoupons(next);
                                await idbSet('coupons_v5', next);
                                safeLocalSet('el3bakera_coupons_v5', next);
                                if (db && isOfficialAdminGoogle) {
                                  await setDoc(
                                    doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons', cp.id),
                                    updated,
                                    { merge: true }
                                  );
                                }
                                showToast(updated.active ? 'تم تفعيل الكوبون' : 'تم تعطيل الكوبون');
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
                                cp.active !== false
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {cp.active !== false ? 'مفعّل' : 'معطّل'}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const next = coupons.filter((c) => c.id !== cp.id);
                                setCoupons(next);
                                await idbSet('coupons_v5', next);
                                safeLocalSet('el3bakera_coupons_v5', next);
                                if (db && isOfficialAdminGoogle) {
                                  await deleteDoc(
                                    doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons', cp.id)
                                  );
                                }
                                showToast('تم حذف الكوبون');
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
                </div>
              </div>
            )}

            {/* تبويب 5: الطلبات */}
            {adminSubTab === 'orders' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-base font-black text-slate-900">سجل طلبات المعلمين المحدث سحابياً ({orders.length})</h3>
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-500">لا توجد طلبات مسجلة حالياً.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-black text-sm text-slate-900">
                            {ord.id} — {ord.teacherName} ({ord.phone1})
                          </div>
                          <div className="text-slate-600 mt-1">
                            السلسلة: {ord.seriesName || 'غير محدد'} • الإجمالي: {ord.total} ج.م • التاريخ: {new Date(ord.createdAt).toLocaleDateString('ar-EG')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={ord.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              const updated = orders.map((o) => (o.id === ord.id ? { ...o, status: newStatus } : o));
                              setOrders(updated);
                              if (db && isOfficialAdminGoogle) {
                                await setDoc(
                                  doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'orders', ord.id),
                                  { status: newStatus },
                                  { merge: true }
                                );
                              }
                              showToast('تم تحديث حالة الطلب');
                            }}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                          >
                            <option value="قيد المراجعة والتجهيز">قيد المراجعة والتجهيز</option>
                            <option value="جارٍ التنفيذ والطباعة">جارٍ التنفيذ والطباعة</option>
                            <option value="تم الانتهاء وجاهز للتسليم">تم الانتهاء وجاهز للتسليم</option>
                            <option value="تم التسليم للعميل">تم التسليم للعميل</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* تبويب 6: الهوية والشعار والروابط */}
            {adminSubTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900">الهوية والشعار وخلفية الرئيسية</h3>
                    <button
                      onClick={handleSaveAllAdminChanges}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer shadow-sm"
                    >
                      حفظ التعديلات
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <label className="block font-bold text-slate-700">شعار المنصة</label>
                      <img src={resolvedLogo} alt="" className="w-16 h-16 rounded-xl object-cover border" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const img = await compressImageFile(f, 350, 0.85);
                          setSettings((prev) => ({ ...prev, logoImage: img }));
                          showToast('تم تجهيز الشعار — اضغط على زر "حفظ التعديلات" لاعتماده');
                        }}
                      />
                      {settings.logoImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setSettings((prev) => ({ ...prev, logoImage: '' }));
                            showToast('تمت إزالة الشعار — اضغط على "حفظ التعديلات"');
                          }}
                          className="text-[11px] text-rose-600 font-bold hover:underline block"
                        >
                          حذف الشعار المرفوع
                        </button>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <label className="block font-bold text-slate-700">خلفية الشاشة الرئيسية</label>
                      {settings.heroBgImage && (
                        <img
                          src={settings.heroBgImage}
                          alt=""
                          className="w-full h-16 rounded-xl object-cover border"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const img = await compressImageFile(f, 1000, 0.72);
                          setSettings((prev) => ({ ...prev, heroBgImage: img }));
                          showToast('تم تجهيز صورة الخلفية — اضغط على زر "حفظ التعديلات" لاعتمادها');
                        }}
                      />
                      {settings.heroBgImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setSettings((prev) => ({ ...prev, heroBgImage: '' }));
                            showToast('تمت إزالة الخلفية — اضغط على "حفظ التعديلات"');
                          }}
                          className="text-[11px] text-rose-600 font-bold hover:underline block"
                        >
                          حذف الخلفية المرفوعة
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">اسم المنصة</label>
                    <input
                      type="text"
                      value={settings.platformName}
                      onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">رقم الواتساب</label>
                      <input
                        type="text"
                        value={settings.whatsappNumber}
                        onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">رقم فودافون كاش</label>
                      <input
                        type="text"
                        value={settings.vodafoneCashNumber}
                        onChange={(e) =>
                          setSettings({ ...settings, vodafoneCashNumber: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAllAdminChanges}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md cursor-pointer"
                  >
                    حفظ ونشر تعديلات الهوية والشعار
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900">التحكم الكامل في روابط التواصل الاجتماعي</h4>
                    <button
                      type="button"
                      onClick={handleSaveAllAdminChanges}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer"
                    >
                      حفظ التعديلات
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <input
                        type="text"
                        placeholder="اسم الرابط (مثلاً: قناة التيليجرام)"
                        value={newSocialLabel}
                        onChange={(e) => setNewSocialLabel(e.target.value)}
                        className="sm:col-span-5 px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newSocialUrl}
                        onChange={(e) => setNewSocialUrl(e.target.value)}
                        className="sm:col-span-5 px-3 py-2 rounded-xl border border-slate-200 bg-white"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newSocialLabel.trim() || !newSocialUrl.trim()) {
                            showToast('يرجى كتابة اسم الرابط وعنوان الـ URL أولاً', 'error');
                            return;
                          }
                          const next = [
                            ...(settings.socialLinks || []),
                            {
                              id: `soc_${Date.now()}`,
                              label: newSocialLabel.trim(),
                              url: newSocialUrl.trim()
                            }
                          ];
                          await saveSettings({ ...settings, socialLinks: next });
                          setNewSocialLabel('');
                          setNewSocialUrl('');
                          showToast('تمت إضافة الرابط وحفظه بنجاح!');
                        }}
                        className="sm:col-span-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                      >
                        + إضافة
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(settings.socialLinks || []).map((soc) => (
                        <div
                          key={soc.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <div className="sm:col-span-4 flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                                {renderSocialPlatformIcon(soc, 'w-4 h-4')}
                              </span>
                              <input
                                type="text"
                                value={soc.label || ''}
                                onChange={(e) => {
                                  const next = (settings.socialLinks || []).map((s) =>
                                    s.id === soc.id ? { ...s, label: e.target.value } : s
                                  );
                                  setSettings({ ...settings, socialLinks: next });
                                }}
                                placeholder="اسم الرابط"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                              />
                            </div>
                            <input
                              type="url"
                              dir="ltr"
                              value={soc.url || ''}
                              onChange={(e) => {
                                const next = (settings.socialLinks || []).map((s) =>
                                  s.id === soc.id ? { ...s, url: e.target.value } : s
                                );
                                setSettings({ ...settings, socialLinks: next });
                              }}
                              placeholder="https://..."
                              className="sm:col-span-6 px-3 py-2 rounded-xl border border-slate-200 bg-white text-left"
                            />
                            <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
                              {soc.url && (
                                <a
                                  href={soc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 rounded-xl bg-blue-50 text-blue-600"
                                  title="تجربة فتح الرابط"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  const next = (settings.socialLinks || []).filter((s) => s.id !== soc.id);
                                  await saveSettings({ ...settings, socialLinks: next });
                                  showToast('تم حذف الرابط وحفظ التعديل');
                                }}
                                className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"
                                title="حذف الرابط"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* إدارة الإصدارات القادمة */}
                  <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    <h4 className="font-black text-slate-900">إدارة ركن المذكرات قيد التجهيز (أسفل المذكرات)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="عنوان المذكرة القادمة"
                        value={newUpcomingForm.title}
                        onChange={(e) =>
                          setNewUpcomingForm({ ...newUpcomingForm, title: e.target.value })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                      <input
                        type="text"
                        placeholder="المرحلة (مثلاً: المرحلة الثانوية)"
                        value={newUpcomingForm.stage}
                        onChange={(e) =>
                          setNewUpcomingForm({ ...newUpcomingForm, stage: e.target.value })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                      <input
                        type="text"
                        placeholder="حالة التجهيز"
                        value={newUpcomingForm.status}
                        onChange={(e) =>
                          setNewUpcomingForm({ ...newUpcomingForm, status: e.target.value })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newUpcomingForm.title.trim()) return;
                          const next = [
                            ...(settings.upcomingNotebooks || []),
                            { id: `up_${Date.now()}`, ...newUpcomingForm }
                          ];
                          await saveSettings({ ...settings, upcomingNotebooks: next });
                          setNewUpcomingForm({
                            title: '',
                            stage: 'المرحلة الإعدادية',
                            status: 'جاري التجهيز والتنسيق',
                            expectedDate: 'قريباً'
                          });
                          showToast('تمت الإضافة وحفظها بنجاح');
                        }}
                        className="py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
                      >
                        + إضافة إعلان
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {(settings.upcomingNotebooks || []).map((up) => (
                        <div
                          key={up.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <span className="font-bold truncate">{up.title}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              const next = (settings.upcomingNotebooks || []).filter(
                                (u) => u.id !== up.id
                              );
                              await saveSettings({ ...settings, upcomingNotebooks: next });
                              showToast('تم الحذف وحفظ التعديل');
                            }}
                            className="text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAllAdminChanges}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md cursor-pointer"
                  >
                    حفظ ونشر تعديلات الروابط والإصدارات القادمة
                  </button>
                </div>
              </div>
            )}

            {/* تبويب 7: النسخ الاحتياطي JSON */}
            {adminSubTab === 'backup' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl space-y-4">
                <h3 className="text-lg font-black text-slate-900">النسخ الاحتياطي الكامل (JSON)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  يمكنك تصدير نسخة احتياطية كاملة تشمل جميع المذكرات والباقات والكوبونات والإعدادات في ملف واحد، أو استيراد ملف نسخة احتياطية سابقة.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleExportBackup}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل نسخة احتياطية كاملة الآن</span>
                  </button>

                  <label className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>استيراد ملف نسخة احتياطية (JSON)</span>
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* الفوتر */}
      <footer className="bg-slate-950 text-slate-400 py-8 px-4 sm:px-6 lg:px-8 mt-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={resolvedLogo} alt={safeText(settings.platformName)} className="w-10 h-10 rounded-xl" />
            <div>
              <div className="text-white font-black text-sm">{safeText(settings.platformName)}</div>
              <div className="text-xs text-slate-400">
                جميع المذكرات منسقة بأعلى جودة وجاهزة للطباعة والتسليم الفوري بصيغة PDF.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            {safeSocialLinks.map((soc) => (
              <a
                key={soc.id}
                href={soc.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-amber-400 transition"
              >
                {renderSocialPlatformIcon(soc, 'w-4 h-4 text-amber-400 shrink-0')}
                <span>{safeText(soc.label)}</span>
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* سلة الطلبات */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base">سلة الطلبات والتخصيص ({cart.length})</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-xl bg-white/15 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-600">سلة الطلبات فارغة حالياً</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-black text-slate-900">{safeText(item.title)}</div>
                          <div className="text-blue-600 font-bold mt-0.5">{item.price} ج.م</div>
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

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="لديك كود خصم؟ (مثال: M20)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 uppercase"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
                    >
                      تطبيق
                    </button>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <h4 className="font-black text-sm text-slate-900">
                      بيانات المعلم التي ستُطبع على المذكرة:
                    </h4>
                    <input
                      type="text"
                      placeholder="اسم المعلم بالكامل *"
                      value={customerForm.teacherName}
                      onChange={(e) =>
                        setCustomerForm({ ...customerForm, teacherName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                    <input
                      type="text"
                      placeholder="رقم الهاتف الأساسي (واتساب) *"
                      value={customerForm.phone1}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone1: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="اسم السلسلة (اختياري)"
                        value={customerForm.seriesName}
                        onChange={(e) =>
                          setCustomerForm({ ...customerForm, seriesName: e.target.value })
                        }
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
                      <input
                        type="text"
                        placeholder="رقم هاتف إضافي (اختياري)"
                        value={customerForm.phone2}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone2: e.target.value })}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <select
                      value={customerForm.hasLogo}
                      onChange={(e) => setCustomerForm({ ...customerForm, hasLogo: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    >
                      <option value="نعم، سأرسله على الواتساب">لدي شعار خاص سأرسله على الواتساب</option>
                      <option value="لا يوجد شعار، اكتب الاسم فقط">لا يوجد شعار، اكتب الاسم ورقم الهاتف فقط</option>
                    </select>
                    <textarea
                      rows={2}
                      placeholder="ملاحظات إضافية للتصميم..."
                      value={customerForm.notes}
                      onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between">
                      <span>الإجمالي قبل الخصم:</span>
                      <span className="font-bold">{cartCalculations.subtotal} ج.م</span>
                    </div>
                    {cartCalculations.activeDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>{cartCalculations.discountLabel}:</span>
                        <span>-{cartCalculations.activeDiscount} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>الصافي المطلوب:</span>
                      <span className="text-blue-600">{cartCalculations.total} ج.م</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-white">
                <button
                  onClick={handleCheckoutWhatsApp}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg cursor-pointer"
                >
                  تأكيد الطلب وإرساله عبر واتساب
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة تواصل معنا */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">تواصل مع {settings.platformName}</h3>
                  <p className="text-[11px] text-slate-500">اختر وسيلة التواصل المناسبة لك</p>
                </div>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-between shadow-sm transition"
              >
                <span className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4" />
                  <span>محادثة واتساب مباشرة ({settings.vodafoneCashNumber})</span>
                </span>
                <ExternalLink className="w-4 h-4" />
              </a>

              {safeSocialLinks.map((soc) => (
                <a
                  key={soc.id}
                  href={soc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-800 hover:text-blue-700 font-bold text-xs sm:text-sm flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                      {renderSocialPlatformIcon(soc, 'w-4 h-4')}
                    </span>
                    <span>{safeText(soc.label)}</span>
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل دخول الإدارة الآمنة مع خيار تسجيل الدخول بجوجل */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">دخول لوحة الإدارة</h3>
                  <p className="text-[11px] text-slate-500">مخصص لمدير المنصة فقط</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setShowAdminPin(false);
                }}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdminGoogleSignIn}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول بحساب جوجل الرسمي للإدارة</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 font-bold">أو برمز المرور</span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showAdminPin ? 'text' : 'password'}
                  required
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="أدخل رمز المرور الخاص بالإدارة..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPin((prev) => !prev)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                  title={showAdminPin ? 'إخفاء رمز المرور' : 'إظهار رمز المرور'}
                >
                  {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow cursor-pointer"
              >
                دخول لوحة التحكم
              </button>
            </form>
          </div>
        </div>
      )}

      {/* معاينة المذكرة وعارض العينات بملء الشاشة مع دعم السحب باللمس لليمين واليسار */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div
            className={`bg-white overflow-hidden shadow-2xl border border-slate-200 flex flex-col ${
              isSampleFullscreen
                ? 'fixed inset-0 w-full h-full rounded-none z-[60]'
                : 'rounded-3xl max-w-3xl w-full my-auto max-h-[92vh]'
            }`}
          >
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className="font-black text-xs sm:text-base truncate">
                  {safeText(previewProduct.title)}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSampleFullscreen((prev) => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 text-xs font-black cursor-pointer touch-manipulation"
                >
                  {isSampleFullscreen ? 'تصغير العرض' : 'ملء الشاشة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewProduct(null);
                    setIsSampleFullscreen(false);
                  }}
                  className="p-1.5 rounded-xl bg-white/15 text-white cursor-pointer touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {(() => {
                const allGallery = [
                  ...(previewProduct.coverImage ? [previewProduct.coverImage] : []),
                  ...(Array.isArray(previewProduct.sampleImages) ? previewProduct.sampleImages : [])
                ];
                return allGallery.length > 0 ? (
                  <div className="space-y-3">
                    <div
                      onTouchStart={handleSampleTouchStart}
                      onTouchMove={handleSampleTouchMove}
                      onTouchEnd={() => handleSampleTouchEnd(allGallery.length)}
                      onMouseDown={handleSampleMouseDown}
                      onMouseMove={handleSampleMouseMove}
                      onMouseUp={() => handleSampleMouseUp(allGallery.length)}
                      onMouseLeave={() => handleSampleMouseUp(allGallery.length)}
                      className={`relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center select-none cursor-grab active:cursor-grabbing ${
                        isSampleFullscreen ? 'min-h-[68vh]' : ''
                      }`}
                      style={{ touchAction: 'pan-y' }}
                    >
                      <img
                        src={allGallery[activeSampleIndex] || allGallery[0]}
                        alt={safeText(previewProduct.title)}
                        draggable={false}
                        className={`w-full object-contain mx-auto transition-all pointer-events-none ${
                          isSampleFullscreen ? 'max-h-[75vh]' : 'max-h-80 sm:max-h-96'
                        }`}
                      />
                      {renderDiscountBadge(previewProduct)}

                      {allGallery.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSampleIndex((prev) =>
                                prev > 0 ? prev - 1 : allGallery.length - 1
                              );
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-lg flex items-center justify-center cursor-pointer touch-manipulation z-10"
                            title="الصفحة السابقة"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSampleIndex((prev) =>
                                prev < allGallery.length - 1 ? prev + 1 : 0
                              );
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-lg flex items-center justify-center cursor-pointer touch-manipulation z-10"
                            title="الصفحة التالية"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                            <span className="px-3 py-1 rounded-full bg-slate-900/85 text-white text-xs font-black">
                              صفحة {activeSampleIndex + 1} من {allGallery.length}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-black/65 text-slate-100 text-[10px] font-bold">
                              اسحب يميناً أو يساراً للتنقل
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    {allGallery.length > 1 && (
                      <div ref={sampleThumbsRef} className="flex gap-2 overflow-x-auto pb-1 scroll-smooth">
                        {allGallery.map((img, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setActiveSampleIndex(idx)}
                            className={`w-16 h-20 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer touch-manipulation transition ${
                              activeSampleIndex === idx ? 'border-blue-600 scale-105' : 'border-transparent opacity-70'
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-600 font-bold">
                    لا توجد صور عينات مرفوعة حالياً — يمكنك معاينة الملف الكامل عبر رابط Google Drive بالأسفل.
                  </div>
                );
              })()}

              {/* موضع التنبيه العام: أعلى التفاصيل */}
              {settings.generalNoticePosition === 'top' && renderGeneralNoticeBox()}

              {/* موضع التنبيه الخاص بالمذكرة: أعلى الوصف */}
              {settings.tipNoticePosition === 'above-desc' && renderProductTipBox(previewProduct.tipText, false)}

              <div className="space-y-2">
                <h4 className="text-lg sm:text-xl font-black text-slate-900">{safeText(previewProduct.title)}</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {safeText(previewProduct.description)}
                </p>
              </div>

              {/* موضع التنبيه الخاص بالمذكرة: أسفل الوصف */}
              {(settings.tipNoticePosition === 'below-desc' || !settings.tipNoticePosition) &&
                renderProductTipBox(previewProduct.tipText, false)}

              {/* موضع التنبيه العام: أسفل التفاصيل في بطاقة منفصلة */}
              {(settings.generalNoticePosition === 'bottom' || !settings.generalNoticePosition) &&
                renderGeneralNoticeBox()}

              {/* موضع التنبيه الخاص بالمذكرة: قبل أزرار الطلب */}
              {settings.tipNoticePosition === 'before-actions' &&
                renderProductTipBox(previewProduct.tipText, false)}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
                <div>
                  <span className="text-2xl font-black text-blue-600">{previewProduct.price} ج.م</span>
                  {Number(previewProduct.oldPrice) > Number(previewProduct.price) && (
                    <span className="text-sm text-slate-400 line-through mr-2">
                      {previewProduct.oldPrice} ج.م
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {renderDriveSampleButton(previewProduct.driveSampleUrl, false)}
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(previewProduct, 'product');
                      setPreviewProduct(null);
                      setIsSampleFullscreen(false);
                    }}
                    className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow cursor-pointer"
                  >
                    اطلبها مخصصة باسمك
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <PlatformErrorBoundary>
      <MuzakkiratiPlatformContent />
    </PlatformErrorBoundary>
  );
}
