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
  RefreshCw,
  LogIn
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
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

if (activeFirebaseConfig && activeFirebaseConfig.apiKey) {
  try {
    app = getApps().length ? getApp() : initializeApp(activeFirebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
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
  generalNoticeEnabled: true,
  generalNoticeTitle: 'تنبيه هام للمعلمين قبل تأكيد الطلب:',
  generalNoticeText:
    '• يتم تسليم المذكرة بصيغة PDF عالية الدقة جاهزة للطباعة ببيانات المعلم الخاصة دون أي بيانات تخصنا.\n• تُوضع العلامة المائية باسم المعلم أو اسم السلسلة الخاص به على كافة الصفحات، وغير متاح إرسال المذكرات بدونها.',
  generalNoticePosition: 'bottom',
  generalNoticeBg: '#f8fafc',
  generalNoticeTextColor: '#334155',
  generalNoticeBorder: '#cbd5e1',
  tipNoticeEnabled: true,
  tipShowOnCard: true,
  tipNoticePosition: 'below-desc',
  tipNoticeBg: '#fffbeb',
  tipNoticeTextColor: '#78350f',
  tipNoticeBorder: '#fde68a',
  driveBtnEnabled: true,
  driveBtnShowOnCard: true,
  driveBtnLabel: 'عينة Google Drive',
  driveBtnBg: '#059669',
  driveBtnText: '#ffffff',
  multiOffers: [
    {
      id: 'mo_default_1',
      active: true,
      badge: '🔥 عرض خاص عند طلب أكثر من مذكرة',
      title: 'احصل على خصم تلقائي 15% عند اختيار مذكرتين أو أكثر!',
      subtitle:
        'اجمع أي مذكرات أو بوكليتات من مختلف الصفوف والمراحل في سلة واحدة وسيتم تطبيق الخصم تلقائياً بحد أقصى 150 ج.م.',
      minItems: 2,
      discountPercent: 15,
      maxDiscount: 150,
      productIds: [], // مصفوفة فارغة = يسري على جميع المذكرات
      bgColor: '#0f172a',
      accentColor: '#facc15'
    }
  ],
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
    { id: 'soc_fb', label: 'صفحة الفيسبوك', url: 'https://www.facebook.com/share/17bS2p2v12/' },
    { id: 'soc_wa', label: 'جروب الواتساب', url: 'https://chat.whatsapp.com/I8vT9t7k8t60H5H7s5X2yG' },
    { id: 'soc_tg', label: 'قناة التيليجرام', url: 'https://t.me/el3bakera_edu' }
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
    productIds: ['nb_1795789801', 'nb_1795789802', 'nb_1795789803', 'nb_1795789804', 'nb_1795789805'],
    coverImage: ''
  }
];

const DEFAULT_COUPONS = [
  { id: 'cp_m20', code: 'M20', discountPercent: 15, maxDiscount: 200, active: true },
  { id: 'cp_next15', code: 'NEXT15', discountPercent: 15, maxDiscount: 200, active: true },
  { id: 'cp_vip7906', code: 'VIP7906', discountPercent: 20, maxDiscount: 250, active: true }
];

// ============================================================================
// دوال المساعدة والتخزين والضغط
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

function compressImageFile(file, maxWidth = 700, quality = 0.72) {
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

function recompressDataUrl(dataUrl, maxWidth = 650, quality = 0.65) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || dataUrl.length <= 580000) {
      resolve(dataUrl);
      return;
    }
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
      let out = canvas.toDataURL('image/jpeg', quality);
      if (out.length > 650000) {
        out = canvas.toDataURL('image/jpeg', 0.5);
      }
      resolve(out);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

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
  const safeDataUrl = await recompressDataUrl(dataUrl, 680, 0.68);
  if (safeDataUrl.length > 820000) {
    throw new Error('حجم الصورة كبير جداً');
  }
  await setDoc(doc(mediaCol, docId), {
    assetId,
    dataUrl: safeDataUrl,
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

function renderSocialIcon(label = '', url = '') {
  const txt = `${label} ${url}`.toLowerCase();
  if (txt.includes('face') || txt.includes('فيس')) {
    return (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
      </svg>
    );
  }
  if (txt.includes('t.me') || txt.includes('tele') || txt.includes('تيليجرام') || txt.includes('تليجرام')) {
    return (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    );
  }
  if (txt.includes('whats') || txt.includes('واتس')) {
    return (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
      </svg>
    );
  }
  return <ExternalLink className="w-4 h-4 shrink-0" />;
}

// ============================================================================
// المكون الرئيسي للمنصة
// ============================================================================
function MuzakkiratiPlatformContent() {
  const [user, setUser] = useState(null);
  const [adminGoogleUser, setAdminGoogleUser] = useState(null);

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const isAuth = localStorage.getItem('el3bakera_admin_auth') === 'true';
      const savedTab = localStorage.getItem('el3bakera_active_tab') || 'home';
      if (savedTab === 'admin' && !isAuth) return 'home';
      return savedTab;
    } catch {
      return 'home';
    }
  });
  const [tabHistory, setTabHistory] = useState(() => {
    try {
      const isAuth = localStorage.getItem('el3bakera_admin_auth') === 'true';
      const initial = localStorage.getItem('el3bakera_active_tab') || 'home';
      if (initial === 'admin' && !isAuth) return ['home'];
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
    if (previewProduct || isSampleFullscreen) {
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
    if (tabHistory.length > 1) {
      const nextHistory = tabHistory.slice(0, -1);
      const prevTab = nextHistory[nextHistory.length - 1] || 'home';
      setTabHistory(nextHistory);
      setActiveTab(prevTab);
      try {
        localStorage.setItem('el3bakera_active_tab', prevTab);
      } catch {}
    } else {
      setActiveTab('home');
      setTabHistory(['home']);
      try {
        localStorage.setItem('el3bakera_active_tab', 'home');
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [settings, setSettings] = useState(() => {
    try {
      const saved =
        localStorage.getItem('el3bakera_settings_v6') ||
        localStorage.getItem('el3bakera_settings_v5');
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
      return saved ? JSON.parse(saved) : DEFAULT_BUNDLES;
    } catch {
      return DEFAULT_BUNDLES;
    }
  });

  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_coupons_v5');
      return saved ? JSON.parse(saved) : DEFAULT_COUPONS;
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
    try {
      window.history.replaceState({ tab: activeTab }, '', activeTab === 'admin' ? '#admin' : `#${activeTab}`);
    } catch {}
    const onPopState = (event) => {
      if (previewProduct || isSampleFullscreen) {
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
  }, [previewProduct, isSampleFullscreen, isCartOpen, isContactModalOpen, isAdminModalOpen]);

  // تحميل البيانات من IndexedDB
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [idbSettings, idbProducts, idbBundles, idbCoupons] = await Promise.all([
        idbGet('settings_v6'),
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

  const [newBundleForm, setNewBundleForm] = useState({
    title: '',
    subtitle: '',
    price: 499,
    originalPrice: 650,
    badge: 'وفر 150 ج.م',
    productIds: []
  });
  const [editingBundleId, setEditingBundleId] = useState(null);

  const [newMultiOfferForm, setNewMultiOfferForm] = useState({
    badge: '🔥 عرض خاص عند طلب أكثر من مذكرة',
    title: '',
    subtitle: '',
    minItems: 2,
    discountPercent: 15,
    maxDiscount: 150,
    productIds: [],
    bgColor: '#0f172a',
    accentColor: '#facc15',
    active: true
  });
  const [editingMultiOfferId, setEditingMultiOfferId] = useState(null);

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
  const [newTestimonialForm, setNewTestimonialForm] = useState({
    teacherName: '',
    role: '',
    text: '',
    image: ''
  });
  const [cloudSyncStatus, setCloudSyncStatus] = useState('checking');
  const [toast, setToast] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

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
  const safeMultiOffers = useMemo(() => {
    if (Array.isArray(settings.multiOffers)) return settings.multiOffers;
    if (settings.bulkDiscountEnabled !== false) {
      return [
        {
          id: 'mo_legacy',
          active: settings.multiOfferEnabled !== false,
          badge: settings.multiOfferBadge || '🔥 عرض خاص عند طلب أكثر من مذكرة',
          title: `احصل على خصم تلقائي ${settings.bulkDiscountPercent || 15}% عند اختيار ${settings.bulkDiscountMinItems || 2} مذكرات أو أكثر!`,
          subtitle:
            settings.multiOfferSubtitle ||
            `اجمع أي مذكرات أو بوكليتات في سلة واحدة وسيتم تطبيق الخصم تلقائياً بحد أقصى ${settings.bulkDiscountMaxAmount || 150} ج.م.`,
          minItems: Number(settings.bulkDiscountMinItems || 2),
          discountPercent: Number(settings.bulkDiscountPercent || 15),
          maxDiscount: Number(settings.bulkDiscountMaxAmount || 150),
          productIds: [],
          bgColor: settings.multiOfferBg || '#0f172a',
          accentColor: settings.multiOfferAccent || '#facc15'
        }
      ];
    }
    return [];
  }, [settings]);

  const visibleProducts = useMemo(
    () => (Array.isArray(products) ? products : DEFAULT_PRODUCTS).filter((p) => p && !p.hidden),
    [products]
  );

  // تسجيل الدخول للإدارة بحساب جوجل الرسمي
  const handleAdminGoogleSignIn = async () => {
    if (!auth) {
      showToast('خدمة المصادقة غير مهيأة حالياً', 'error');
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, provider);
      const email = (res.user?.email || '').toLowerCase();
      if (!ADMIN_EMAILS.includes(email)) {
        await signOut(auth);
        await signInAnonymously(auth).catch(() => {});
        showToast('عذراً، هذا الحساب غير مصرح له بإدارة المنصة', 'error');
        return;
      }
      localStorage.removeItem('el3bakera_manual_logout');
      setAdminGoogleUser(res.user);
      setIsAdminAuthenticated(true);
      localStorage.setItem('el3bakera_admin_auth', 'true');
      setIsAdminModalOpen(false);
      navigateToTab('admin');
      showToast(`✓ تم ربط حساب المدير (${email}) بنجاح!`);
    } catch (err) {
      showToast(`تعذر تسجيل الدخول بجوجل (${err?.code || 'خطأ'})`, 'error');
    }
  };

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
    setAdminGoogleUser(null);
    setIsAdminModalOpen(false);
    setTabHistory(['home']);
    setActiveTab('home');
    if (auth) {
      try {
        await signOut(auth);
        await signInAnonymously(auth).catch(() => {});
      } catch {}
    }
    showToast('تم تسجيل الخروج من لوحة الإدارة بأمان');
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

  // ربط Firebase Auth
  useEffect(() => {
    if (!auth) {
      setCloudSyncStatus('local-only');
      return;
    }
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      const email = (u?.email || '').toLowerCase();
      const manualOut = localStorage.getItem('el3bakera_manual_logout') === 'true';
      if (ADMIN_EMAILS.includes(email) && !manualOut) {
        setAdminGoogleUser(u);
        setIsAdminAuthenticated(true);
        try {
          localStorage.setItem('el3bakera_admin_auth', 'true');
        } catch {}
      } else if (!u) {
        signInAnonymously(auth).catch(() => {});
      }
    });
    return () => unsubAuth();
  }, []);

  // استماع لحظي لجميع مجموعات Firestore
  useEffect(() => {
    if (!db) return;

    const settingsFastRef = doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'settings', 'main');
    const settingsLegacyRef = doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'config', 'main');
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
        idbSet('settings_v6', merged);
        safeLocalSet('el3bakera_settings_v6', merged);
        return merged;
      });
    };

    const unsubFastSettings = onSnapshot(
      settingsFastRef,
      (snap) => {
        setCloudSyncStatus('connected');
        if (snap.exists()) applyCloudSettingsSnapshot(snap.data());
      },
      () => {}
    );

    const unsubSettings = onSnapshot(
      settingsLegacyRef,
      (snap) => {
        setCloudSyncStatus('connected');
        if (snap.exists()) applyCloudSettingsSnapshot(snap.data());
      },
      () => setCloudSyncStatus('error')
    );

    const unsubMediaAssets = onSnapshot(
      configCol,
      (snapshot) => {
        if (snapshot.empty || isSavingRef.current) return;
        const assetsMap = {};
        const samplesMap = {};

        snapshot.forEach((d) => {
          if (d.id.startsWith('media_')) {
            const data = d.data();
            const key = data.assetId || d.id.replace('media_', '');
            if (data.dataUrl) {
              assetsMap[key] = data.dataUrl;
              const sampleMatch = key.match(/^prod_sample_(.+)_(\d+)$/);
              if (sampleMatch) {
                const prodId = sampleMatch[1];
                const idx = Number(sampleMatch[2]);
                if (!samplesMap[prodId]) samplesMap[prodId] = [];
                samplesMap[prodId][idx] = data.dataUrl;
              }
            }
          }
        });

        setSettings((prev) => {
          const updatedCategories = (prev.categories || []).map((c) => ({
            ...c,
            coverImage:
              assetsMap[`cat_${c.id}`] !== undefined ? assetsMap[`cat_${c.id}`] : c.coverImage || ''
          }));
          const merged = {
            ...prev,
            logoImage: assetsMap.logoImage !== undefined ? assetsMap.logoImage : prev.logoImage || '',
            heroImage: assetsMap.heroImage !== undefined ? assetsMap.heroImage : prev.heroImage || '',
            heroBgImage:
              assetsMap.heroBgImage !== undefined ? assetsMap.heroBgImage : prev.heroBgImage || '',
            categories: updatedCategories
          };
          idbSet('settings_v6', merged);
          safeLocalSet('el3bakera_settings_v6', merged);
          return merged;
        });

        setProducts((prev) => {
          let changed = false;
          const updated = prev.map((p) => {
            const cloudCover = assetsMap[`prod_cover_${p.id}`];
            const cloudSamples = samplesMap[p.id] ? samplesMap[p.id].filter(Boolean) : null;
            const nextCover = cloudCover || p.coverImage || '';
            const nextSamples =
              cloudSamples && cloudSamples.length > 0 ? cloudSamples : p.sampleImages || [];
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

        setBundles((prev) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          idbSet('bundles_v5', list);
          return list;
        });
      },
      () => {}
    );

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

    const bundlesCol = collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles');
    const unsubBundles = onSnapshot(
      bundlesCol,
      (snap) => {
        if (!snap.empty && !isSavingRef.current) {
          setBundles((prev) => {
            const list = snap.docs.map((d) => {
              const data = { id: d.id, ...d.data() };
              const prevB = prev.find((pb) => pb.id === d.id);
              return { ...data, coverImage: data.coverImage || prevB?.coverImage || '' };
            });
            idbSet('bundles_v5', list);
            return list;
          });
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
      unsubProducts();
      unsubOrders();
      unsubBundles();
      unsubCoupons();
    };
  }, [user]);

  const handleForcePullFromCloud = async () => {
    if (!db) {
      showToast('السحابة غير متصلة', 'error');
      return;
    }
    showToast('جاري سحب وتحديث كافة البيانات والصور من السحابة...');
    try {
      const [configSnap, notebooksSnap] = await Promise.all([
        getDocs(collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'config')),
        getDocs(collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebooks'))
      ]);
      const assetsMap = {};
      const samplesMap = {};
      configSnap.forEach((d) => {
        if (d.id.startsWith('media_')) {
          const data = d.data();
          const key = data.assetId || d.id.replace('media_', '');
          if (data.dataUrl) {
            assetsMap[key] = data.dataUrl;
            const m = key.match(/^prod_sample_(.+)_(\d+)$/);
            if (m) {
              if (!samplesMap[m[1]]) samplesMap[m[1]] = [];
              samplesMap[m[1]][Number(m[2])] = data.dataUrl;
            }
          }
        }
      });
      if (!notebooksSnap.empty) {
        const pulled = notebooksSnap.docs.map((d) => {
          const base = { id: d.id, ...d.data() };
          const cloudSamples = samplesMap[d.id] ? samplesMap[d.id].filter(Boolean) : [];
          return {
            ...base,
            coverImage: assetsMap[`prod_cover_${d.id}`] || base.coverImage || '',
            sampleImages: cloudSamples.length > 0 ? cloudSamples : base.sampleImages || []
          };
        });
        setProducts(pulled);
        await idbSet('products_v5', pulled);
        safeLocalSet('el3bakera_products_v5', stripHeavyProductMedia(pulled));
      }
      showToast('✓ تم سحب وتحديث جميع البيانات والصور بنجاح!');
    } catch (err) {
      showToast(`تعذر السحب من السحابة: ${err?.code || ''}`, 'error');
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
    await idbSet('settings_v6', cleanSettings);
    safeLocalSet('el3bakera_settings_v6', cleanSettings);
    let cloudSaved = false;
    if (db) {
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
        showToast(
          `يرجى ربط حساب جوجل للإدارة أولاً ليسمح Firebase بالحفظ (${e?.code || 'permission-denied'})`,
          'error'
        );
      }
    }
    setTimeout(() => {
      isSavingRef.current = false;
    }, 1500);
    return cloudSaved;
  };

  const saveProductToCloud = async (productObj) => {
    if (!db) return;
    isSavingRef.current = true;
    try {
      const { sampleImages, coverImage, ...lightProduct } = productObj;
      await setDoc(
        doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebooks', productObj.id),
        lightProduct,
        { merge: true }
      );
      await saveMediaAssetToCloud(db, PRIMARY_APP_ID, `prod_cover_${productObj.id}`, coverImage || '');
      const samplesList = Array.isArray(sampleImages) ? sampleImages.slice(0, 25) : [];
      for (let i = 0; i < samplesList.length; i++) {
        await saveMediaAssetToCloud(db, PRIMARY_APP_ID, `prod_sample_${productObj.id}_${i}`, samplesList[i]);
      }
      for (let j = samplesList.length; j < 25; j++) {
        await saveMediaAssetToCloud(db, PRIMARY_APP_ID, `prod_sample_${productObj.id}_${j}`, '');
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
    } catch (e) {
      console.error('Product cloud save error:', e);
      showToast(`تعذر رفع صور المذكرة للسحابة: ${e?.code || e?.message || 'خطأ'}`, 'error');
    }
    setTimeout(() => {
      isSavingRef.current = false;
    }, 1500);
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

    let bulkDiscount = 0;
    let bestMultiOfferTitle = '';
    for (const offer of safeMultiOffers) {
      if (offer.active === false) continue;
      const targetIds = Array.isArray(offer.productIds) ? offer.productIds : [];
      const matchingItems =
        targetIds.length === 0
          ? cart
          : cart.filter((item) => targetIds.includes(item.id));
      if (matchingItems.length >= Number(offer.minItems || 2)) {
        const eligibleSubtotal = matchingItems.reduce((s, it) => s + Number(it.price || 0), 0);
        const rawOfferDisc = Math.round(
          (eligibleSubtotal * Number(offer.discountPercent || 15)) / 100
        );
        const cappedOfferDisc = offer.maxDiscount
          ? Math.min(rawOfferDisc, Number(offer.maxDiscount))
          : rawOfferDisc;
        if (cappedOfferDisc > bulkDiscount) {
          bulkDiscount = cappedOfferDisc;
          bestMultiOfferTitle = `عرض المذكرات المتعددة (${offer.discountPercent}%)`;
        }
      }
    }

    const activeDiscount = Math.max(couponDiscount, bulkDiscount);
    const discountLabel =
      activeDiscount === 0
        ? ''
        : couponDiscount >= bulkDiscount
        ? `خصم كوبون (${appliedCoupon?.code})`
        : bestMultiOfferTitle || 'خصم المذكرات المتعددة';

    return {
      subtotal,
      activeDiscount,
      discountLabel,
      total: Math.max(0, subtotal - activeDiscount)
    };
  }, [cart, appliedCoupon, safeMultiOffers]);

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
    const msg =
      `السلام عليكم، أرغب في طلب المذكرات التالية مخصصة باسمي من *${settings.platformName}*:\n\n` +
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
    localStorage.removeItem('el3bakera_manual_logout');
    setIsAdminAuthenticated(true);
    try {
      localStorage.setItem('el3bakera_admin_auth', 'true');
    } catch {}
    setIsAdminModalOpen(false);
    navigateToTab('admin');
    setAdminPinInput('');
    setShowAdminPin(false);
    showToast('تم تسجيل الدخول إلى لوحة الإدارة بنجاح');
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
    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebooks', id));
      } catch {}
    }
    showToast('تم حذف المذكرة');
  };

  const handleSaveAllAdminChanges = async () => {
    showToast('جاري حفظ ونشر جميع التعديلات...');
    const ok = await saveSettings({
      ...settings,
      stages: normalizedStages,
      grades: normalizedGrades,
      categories: normalizedCategories
    });
    const storedProducts = await idbGet('products_v5');
    const latestProducts =
      Array.isArray(storedProducts) && storedProducts.length > 0
        ? products.map((p) => {
            const sp = storedProducts.find((item) => item.id === p.id);
            return {
              ...p,
              coverImage: p.coverImage || sp?.coverImage || '',
              sampleImages:
                Array.isArray(p.sampleImages) && p.sampleImages.length > 0
                  ? p.sampleImages
                  : sp?.sampleImages || []
            };
          })
        : products;

    await idbSet('products_v5', latestProducts);
    await idbSet('bundles_v5', bundles);
    await idbSet('coupons_v5', coupons);
    if (db && ok) {
      try {
        for (const prod of latestProducts) {
          await saveProductToCloud(prod);
        }
        for (const b of bundles) {
          const { coverImage, ...lightBundle } = b;
          await setDoc(
            doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles', b.id),
            lightBundle,
            { merge: true }
          );
        }
        for (const cp of coupons) {
          await setDoc(
            doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons', cp.id),
            cp,
            { merge: true }
          );
        }
        showToast('✓ تم حفظ ونشر جميع التعديلات والصور للعملاء بنجاح!');
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

  const renderGeneralNoticeBox = () => {
    if (settings.generalNoticeEnabled === false) return null;
    const noticeLines = safeText(settings.generalNoticeText, DEFAULT_SETTINGS.generalNoticeText)
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

  return (
    <div dir="rtl" className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#f4f6fa] text-slate-900 font-sans flex flex-col">
      {/* إشعار Toast عائم */}
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

      {/* الشريط الترويجي العلوي */}
      {settings.promoEnabled && (
        <div
          style={{
            backgroundColor: safeText(settings.promoBgColor, '#0654d0'),
            color: safeText(settings.promoTextColor, '#fde047')
          }}
          className="w-full py-2 px-3 text-center text-[11px] sm:text-sm font-bold flex flex-wrap items-center justify-center gap-2 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="leading-snug">{safeText(settings.promoText)}</span>
          {settings.promoCouponCode && (
            <button
              onClick={copyPromoCode}
              className="inline-flex items-center gap-1 bg-amber-300 text-slate-950 px-2.5 py-0.5 rounded-md font-black text-[11px] hover:bg-amber-200 transition cursor-pointer"
              title="اضغط لنسخ الكود"
            >
              <span>{safeText(settings.promoCouponCode)}</span>
              {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}

      {/* الهيدر الرئيسي المتجاوب بالكامل */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          <div
            onClick={handleLogoSecretTap}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none min-w-0 flex-1"
          >
            <img
              src={resolvedLogo}
              alt={safeText(settings.platformName)}
              className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl object-cover shadow-sm border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-lg font-black text-slate-900 leading-tight truncate">
                {safeText(settings.platformName)}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block truncate">
                {safeText(settings.platformTagline)}
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigateToTab('home')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'home'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => navigateToTab('library')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'library'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              المذكرات
            </button>
            <button
              onClick={() => navigateToTab('bundles')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'bundles'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              العروض
            </button>
            <button
              onClick={() => navigateToTab('track')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'track'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              تتبع طلبك
            </button>
            {isAdminAuthenticated && (
              <>
                <button
                  onClick={() => navigateToTab('admin')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                    activeTab === 'admin'
                      ? 'bg-slate-900 text-amber-400 shadow-sm'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  لوحة الإدارة
                </button>
                <button
                  onClick={handleAdminLogout}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                >
                  تسجيل خروج
                </button>
              </>
            )}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
              title="تواصل معنا"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">تواصل معنا</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400 shrink-0" />
              <span>السلة</span>
              {cart.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* شريط تنقل متجاوب للهواتف المحمولة */}
        <div className="grid md:hidden grid-flow-col auto-cols-fr border-t border-slate-100 py-1.5 px-2 gap-1 bg-white">
          <button
            onClick={() => navigateToTab('home')}
            className={`py-1.5 rounded-lg text-[11px] font-bold text-center truncate ${
              activeTab === 'home' ? 'bg-blue-600 text-white' : 'text-slate-600'
            }`}
          >
            الرئيسية
          </button>
          <button
            onClick={() => navigateToTab('library')}
            className={`py-1.5 rounded-lg text-[11px] font-bold text-center truncate ${
              activeTab === 'library' ? 'bg-blue-600 text-white' : 'text-slate-600'
            }`}
          >
            المذكرات
          </button>
          <button
            onClick={() => navigateToTab('bundles')}
            className={`py-1.5 rounded-lg text-[11px] font-bold text-center truncate ${
              activeTab === 'bundles' ? 'bg-blue-600 text-white' : 'text-slate-600'
            }`}
          >
            العروض
          </button>
          <button
            onClick={() => navigateToTab('track')}
            className={`py-1.5 rounded-lg text-[11px] font-bold text-center truncate ${
              activeTab === 'track' ? 'bg-blue-600 text-white' : 'text-slate-600'
            }`}
          >
            تتبع طلبك
          </button>
          {isAdminAuthenticated && (
            <button
              onClick={() => navigateToTab('admin')}
              className={`py-1.5 rounded-lg text-[11px] font-bold text-center truncate ${
                activeTab === 'admin' ? 'bg-slate-900 text-amber-400' : 'bg-amber-100 text-amber-900'
              }`}
            >
              الإدارة
            </button>
          )}
        </div>
      </header>

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
      <main className="flex-1 w-full">
        {/* 1. الصفحة الرئيسية */}
        {activeTab === 'home' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-10 sm:space-y-12">
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-[#0b1938] via-[#0e224d] to-[#081229] text-white p-5 sm:p-10 lg:p-12 shadow-xl border border-slate-800">
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
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-right">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] sm:text-xs font-bold">
                    <span>{safeText(settings.heroBadge)}</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black leading-tight text-white">
                    {safeText(settings.heroTitle)}
                  </h2>

                  <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                    {safeText(settings.heroSubtitle)}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => navigateToTab('library')}
                      className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition cursor-pointer"
                    >
                      استعراض جميع المذكرات
                    </button>
                    <button
                      onClick={() => navigateToTab('bundles')}
                      className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
                    >
                      باقات التوفير والعروض
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-5 border-t border-white/10 max-w-xl">
                    <div className="rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 p-3 sm:p-3.5 flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <div className="text-base sm:text-xl font-black text-amber-400 leading-none">+50</div>
                        <div className="text-[10px] sm:text-xs text-slate-200 mt-1 font-bold">مذكرة وبنك أسئلة</div>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 p-3 sm:p-3.5 flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <div className="text-base sm:text-xl font-black text-emerald-400 leading-none">+500</div>
                        <div className="text-[10px] sm:text-xs text-slate-200 mt-1 font-bold">معلم يثق بنا</div>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 p-3 sm:p-3.5 flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-400/20 border border-sky-400/30 text-sky-300 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <div className="text-base sm:text-xl font-black text-sky-400 leading-none">100%</div>
                        <div className="text-[10px] sm:text-xs text-slate-200 mt-1 font-bold">تخصيص باسمك</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="rounded-3xl bg-slate-950/70 backdrop-blur-md border border-white/15 p-5 sm:p-6 shadow-2xl space-y-4">
                    <div className="flex items-center gap-3.5 pb-3.5 border-b border-white/10">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/20">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-white">لماذا يثق بنا المعلمون؟</h3>
                        <p className="text-[11px] text-amber-300 font-bold">جودة تعليمية وتخصيص احترافي 100%</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {safeTrustFeatures.map((feat, idx) => {
                        const TrustIcons = [FileText, Sparkles, CheckCircle2];
                        const TrustIcon = TrustIcons[idx % TrustIcons.length];
                        const iconBg = [
                          'bg-sky-500/20 text-sky-300 border-sky-400/30',
                          'bg-amber-400/20 text-amber-300 border-amber-400/30',
                          'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        ][idx % 3];
                        return (
                          <div
                            key={feat.id || idx}
                            className="rounded-2xl bg-white/10 hover:bg-white/15 transition border border-white/10 px-4 py-3.5 flex items-start gap-3.5"
                          >
                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
                              <TrustIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-black text-white">{safeText(feat.title)}</div>
                              {feat.desc && (
                                <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
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

            {/* الأقسام الدراسية */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-2xl font-black text-slate-900">الأقسام الدراسية</h3>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedStage('all');
                    setSelectedGrade('all');
                    navigateToTab('library');
                  }}
                  className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
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
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900">أحدث المذكرات المضافة</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    اختر المذكرة لمعاينة صفحات العينة وطلبها مخصصة باسمك وشعارك
                  </p>
                </div>
                <button
                  onClick={() => navigateToTab('library')}
                  className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  تصفح كل المذكرات ({visibleProducts.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleProducts.slice(0, 6).map((product) => {
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
                          setIsSampleFullscreen(false);
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
                              setIsSampleFullscreen(false);
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
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                            <span>📄 {product.pagesCount || 0} صفحة PDF</span>
                            <div className="flex items-center gap-2">
                              {settings.driveBtnEnabled !== false &&
                                settings.driveBtnShowOnCard !== false &&
                                product.driveSampleUrl && (
                                  <a
                                    href={product.driveSampleUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      backgroundColor: settings.driveBtnBg || '#059669',
                                      color: settings.driveBtnText || '#ffffff'
                                    }}
                                    className="px-2.5 py-1 rounded-lg font-black text-[11px] inline-flex items-center gap-1 shadow-2xs hover:opacity-90 transition"
                                  >
                                    <span>{safeText(settings.driveBtnLabel, 'عينة Drive')}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewProduct(product);
                                  setActiveSampleIndex(0);
                                  setIsSampleFullscreen(false);
                                }}
                                className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer touch-manipulation py-1 px-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>التفاصيل والعينة</span>
                              </button>
                            </div>
                          </div>

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
            </section>

            {/* عروض الحصول على أكثر من مذكرة */}
            {safeMultiOffers.filter((o) => o.active !== false).length > 0 && (
              <section className="space-y-4">
                {safeMultiOffers
                  .filter((o) => o.active !== false)
                  .map((offer) => {
                    const specificProds = Array.isArray(offer.productIds)
                      ? offer.productIds.map((pid) => products.find((p) => p.id === pid)).filter(Boolean)
                      : [];
                    return (
                      <div
                        key={offer.id}
                        style={{ backgroundColor: offer.bgColor || '#0f172a' }}
                        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                      >
                        <div className="space-y-2.5 max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              style={{
                                backgroundColor: offer.accentColor || '#facc15',
                                color: '#0f172a'
                              }}
                              className="inline-block px-3.5 py-1 rounded-full text-xs font-black"
                            >
                              {safeText(offer.badge, '🔥 عرض خاص عند طلب أكثر من مذكرة')}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold">
                              {specificProds.length > 0
                                ? `يسري على ${specificProds.length} مذكرات محددة`
                                : 'يسري على جميع المذكرات'}
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black leading-snug">
                            {safeText(offer.title)}
                          </h3>
                          {offer.subtitle && (
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                              {safeText(offer.subtitle)}
                            </p>
                          )}
                          {specificProds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {specificProds.map((sp) => (
                                <span
                                  key={sp.id}
                                  className="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold text-amber-200"
                                >
                                  • {sp.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => navigateToTab('library')}
                            style={{
                              backgroundColor: offer.accentColor || '#facc15',
                              color: '#0f172a'
                            }}
                            className="px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-lg hover:opacity-95 transition cursor-pointer"
                          >
                            اختر مذكراتك الآن واستفد بالخصم
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </section>
            )}

            {/* الإصدارات القادمة */}
            {safeUpcoming.length > 0 && (
              <section className="bg-gradient-to-l from-slate-900 via-[#0f2347] to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-lg space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        قريباً على المنصة — مذكرات وبنوك أسئلة قيد التجهيز
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
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900">
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

        {/* 2. مكتبة المذكرات */}
        {activeTab === 'library' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
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
                          setIsSampleFullscreen(false);
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
                              setIsSampleFullscreen(false);
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
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                            <span>📄 {product.pagesCount} صفحة PDF</span>
                            <div className="flex items-center gap-2">
                              {settings.driveBtnEnabled !== false &&
                                settings.driveBtnShowOnCard !== false &&
                                product.driveSampleUrl && (
                                  <a
                                    href={product.driveSampleUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      backgroundColor: settings.driveBtnBg || '#059669',
                                      color: settings.driveBtnText || '#ffffff'
                                    }}
                                    className="px-2.5 py-1 rounded-lg font-black text-[11px] inline-flex items-center gap-1 shadow-2xs hover:opacity-90 transition"
                                  >
                                    <span>{safeText(settings.driveBtnLabel, 'عينة Drive')}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewProduct(product);
                                  setActiveSampleIndex(0);
                                  setIsSampleFullscreen(false);
                                }}
                                className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer touch-manipulation py-1 px-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>التفاصيل والعينة</span>
                              </button>
                            </div>
                          </div>

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="bg-gradient-to-l from-[#0b1938] via-[#132c63] to-[#1d4ed8] rounded-3xl p-6 sm:p-9 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl border border-blue-800/60">
              <div className="space-y-2 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>باقات التوفير الحصرية للمعلمين</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                  باقات شاملة بأسعار مخفضة وتخصيص كامل باسمك وشعارك
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  وفر أكثر عند حجز باقة متكاملة من المذكرات وبنوك الأسئلة، أو استفد من عرض الحصول على أكثر من مذكرة بخصم تلقائي {settings.bulkDiscountPercent}% في السلة.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => navigateToTab('library')}
                  className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition cursor-pointer"
                >
                  تصفح جميع المذكرات
                </button>
              </div>
            </div>

            {safeMultiOffers.filter((o) => o.active !== false).length > 0 && (
              <div className="space-y-4">
                {safeMultiOffers
                  .filter((o) => o.active !== false)
                  .map((offer) => {
                    const specificProds = Array.isArray(offer.productIds)
                      ? offer.productIds.map((pid) => products.find((p) => p.id === pid)).filter(Boolean)
                      : [];
                    return (
                      <div
                        key={offer.id}
                        style={{ backgroundColor: offer.bgColor || '#0f172a' }}
                        className="rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              style={{
                                backgroundColor: offer.accentColor || '#facc15',
                                color: '#0f172a'
                              }}
                              className="inline-block px-3 py-0.5 rounded-full text-[11px] font-black"
                            >
                              {safeText(offer.badge, '🔥 عرض خاص عند طلب أكثر من مذكرة')}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-bold">
                              {specificProds.length > 0
                                ? `محدد لـ ${specificProds.length} مذكرات`
                                : 'شامل جميع المذكرات'}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-black">{safeText(offer.title)}</h3>
                          {offer.subtitle && (
                            <p className="text-xs text-slate-300 leading-relaxed">{safeText(offer.subtitle)}</p>
                          )}
                          {specificProds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {specificProds.map((sp) => (
                                <span
                                  key={sp.id}
                                  className="px-2.5 py-0.5 rounded-lg bg-white/10 text-[11px] font-bold text-amber-200"
                                >
                                  • {sp.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => navigateToTab('library')}
                          style={{
                            backgroundColor: offer.accentColor || '#facc15',
                            color: '#0f172a'
                          }}
                          className="px-5 py-3 rounded-2xl font-black text-xs shadow shrink-0 cursor-pointer"
                        >
                          كوّن مجموعتك الآن
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
              {bundles.map((bundle) => {
                const includedProducts = (bundle.productIds || [])
                  .map((pid) => products.find((p) => p.id === pid))
                  .filter(Boolean);
                const savedAmount =
                  Number(bundle.originalPrice || 0) > Number(bundle.price || 0)
                    ? Number(bundle.originalPrice) - Number(bundle.price)
                    : 0;
                const savedPercent =
                  savedAmount > 0
                    ? Math.round((savedAmount / Number(bundle.originalPrice)) * 100)
                    : 0;

                return (
                  <div
                    key={bundle.id}
                    className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-md hover:shadow-2xl transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="bg-gradient-to-bl from-[#0b1938] via-[#132b5e] to-[#1d4ed8] p-6 sm:p-7 text-white space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-1 rounded-full shadow">
                            <Package className="w-3.5 h-3.5" />
                            <span>
                              {bundle.badge || (savedAmount > 0 ? `وفر ${savedAmount} ج.م` : 'باقة مميزة')}
                            </span>
                          </span>
                          {savedPercent > 0 && (
                            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black shadow">
                              خصم {savedPercent}%
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black leading-snug">
                          {safeText(bundle.title)}
                        </h3>
                        <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                          {safeText(bundle.subtitle)}
                        </p>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-700">
                            محتويات الباقة ({includedProducts.length} مذكرات):
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            اضغط على أي مذكرة للمعاينة
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {includedProducts.map((prod) => (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setPreviewProduct(prod);
                                setActiveSampleIndex(0);
                                setIsSampleFullscreen(false);
                              }}
                              className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/90 hover:border-blue-300 flex flex-col items-center text-center gap-2 cursor-pointer transition shadow-2xs"
                            >
                              <div className="text-xs font-black text-slate-900 leading-snug line-clamp-2 min-h-[2.25rem] flex items-center justify-center">
                                {safeText(prod.title)}
                              </div>

                              <div className="w-14 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-[#0f1f44] to-[#1e3a8a] border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                                {prod.coverImage ? (
                                  <img
                                    src={prod.coverImage}
                                    alt={safeText(prod.title)}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FileText className="w-6 h-6 text-amber-400" />
                                )}
                              </div>

                              <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-slate-200/80">
                                {prod.pagesCount || 0} صفحة • معاينة
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold text-slate-500">سعر الباقة بالكامل:</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-blue-600">
                            {bundle.price} ج.م
                          </span>
                          {Number(bundle.originalPrice) > Number(bundle.price) && (
                            <span className="text-xs sm:text-sm text-slate-400 line-through font-bold">
                              {bundle.originalPrice} ج.م
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(bundle, 'bundle')}
                        className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/20 transition cursor-pointer"
                      >
                        أضف الباقة للسلة للتخصيص
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
                  <p className="text-xs text-slate-300 mt-0.5">
                    {adminGoogleUser
                      ? `متصل بحساب المدير الرسمي (${adminGoogleUser.email}) ✓ — جميع التعديلات تُحفظ وتُعرض للعملاء فوراً`
                      : 'تنبيه: اضغط "ربط حساب جوجل للإدارة" ليسمح Firebase بحفظ التعديلات للعملاء'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!adminGoogleUser && (
                  <button
                    type="button"
                    onClick={handleAdminGoogleSignIn}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>ربط حساب جوجل للإدارة (مطلوب للحفظ)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleForcePullFromCloud}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
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

            {/* تبويب 1: المذكرات والعينات */}
            {adminSubTab === 'products' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        إعدادات التنبيهات وزر Google Drive الخاصة بالمذكرات
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        تحكم في التنبيه العام، والتنبيه الخاص بكل مذكرة، وزر عينة Google Drive بسهولة
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAllAdminChanges}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer shadow-sm"
                    >
                      حفظ ونشر الإعدادات
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. التنبيه العام */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-sm text-slate-900">
                          1. التنبيه العام (في نافذة المعاينة فقط)
                        </h4>
                        <label className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 font-bold text-blue-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.generalNoticeEnabled !== false}
                            onChange={(e) =>
                              setSettings({ ...settings, generalNoticeEnabled: e.target.checked })
                            }
                          />
                          <span>مفعّل</span>
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold"
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1.5">قوالب ألوان جاهزة:</label>
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

                      <div className="grid grid-cols-3 gap-2.5">
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

                      <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500">معاينة مباشرة:</span>
                        {renderGeneralNoticeBox()}
                      </div>
                    </div>

                    {/* 2. التنبيه الخاص بكل مذكرة */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-black text-sm text-slate-900">
                          2. التنبيه الخاص بكل مذكرة (صندوق منفصل)
                        </h4>
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 font-bold text-emerald-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.tipNoticeEnabled !== false}
                              onChange={(e) =>
                                setSettings({ ...settings, tipNoticeEnabled: e.target.checked })
                              }
                            />
                            <span>بالمعاينة</span>
                          </label>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 font-bold text-blue-600 cursor-pointer">
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

                      <div>
                        <label className="block font-bold text-slate-600 mb-1.5">قوالب ألوان جاهزة:</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { name: 'ذهبي دافئ', bg: '#fffbeb', text: '#78350f' },
                            { name: 'أزرق ملكي', bg: '#1d4ed8', text: '#ffffff' },
                            { name: 'أخضر زمردي', bg: '#059669', text: '#ffffff' },
                            { name: 'أزرق فاتح', bg: '#eff6ff', text: '#1e40af' },
                            { name: 'وردي تنبيهي', bg: '#fff1f2', text: '#9f1239' }
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

                      <div className="grid grid-cols-3 gap-2.5">
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

                      <div className="pt-3 border-t border-slate-200/80 space-y-2">
                        <span className="text-[11px] font-bold text-slate-500">معاينة مباشرة للتنبيه الخاص:</span>
                        {renderProductTipBox('ملاحظة: للمراجعة المُثلى اطلبها مع بوكليت الاختبارات', false)}
                        <button
                          type="button"
                          onClick={handleSaveAllAdminChanges}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm cursor-pointer"
                        >
                          حفظ ونشر تعديلات التنبيهات
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. التحكم الكامل في زر معاينة Google Drive */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-black text-sm text-slate-900">
                          3. التحكم في زر معاينة Google Drive للعملاء
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          تحكم في إظهار الزر على بطاقة المذكرة وفي نافذة التفاصيل، مع تخصيص نصه وألوانه
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 font-bold text-emerald-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.driveBtnEnabled !== false}
                            onChange={(e) =>
                              setSettings({ ...settings, driveBtnEnabled: e.target.checked })
                            }
                          />
                          <span>تفعيل الزر</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 font-bold text-blue-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.driveBtnShowOnCard !== false}
                            onChange={(e) =>
                              setSettings({ ...settings, driveBtnShowOnCard: e.target.checked })
                            }
                          />
                          <span>إظهاره على البطاقة</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-4">
                        <label className="block font-bold text-slate-600 mb-1">نص الزر</label>
                        <input
                          type="text"
                          value={settings.driveBtnLabel ?? 'عينة Google Drive'}
                          onChange={(e) =>
                            setSettings({ ...settings, driveBtnLabel: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-600 mb-1">لون الزر</label>
                        <input
                          type="color"
                          value={settings.driveBtnBg || '#059669'}
                          onChange={(e) =>
                            setSettings({ ...settings, driveBtnBg: e.target.value })
                          }
                          className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-600 mb-1">لون النص</label>
                        <input
                          type="color"
                          value={settings.driveBtnText || '#ffffff'}
                          onChange={(e) =>
                            setSettings({ ...settings, driveBtnText: e.target.value })
                          }
                          className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                        />
                      </div>
                      <div className="sm:col-span-4 flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-500">معاينة:</span>
                        <span
                          style={{
                            backgroundColor: settings.driveBtnBg || '#059669',
                            color: settings.driveBtnText || '#ffffff'
                          }}
                          className="px-3 py-1.5 rounded-xl font-black text-xs inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{safeText(settings.driveBtnLabel, 'عينة Google Drive')}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* نموذج إضافة/تعديل المذكرة وقائمة المذكرات */}
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
                    {products.map((prod) => (
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
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm text-slate-900">{prod.title}</h4>
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
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* تبويب 2: إدارة الباقات */}
            {adminSubTab === 'bundles' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 h-fit">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900">
                      {editingBundleId ? 'تعديل بيانات الباقة' : 'إضافة باقة مخفضة جديدة'}
                    </h3>
                    {editingBundleId && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black">
                        وضع التعديل
                      </span>
                    )}
                  </div>
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
                        placeholder="وصف مختصر لمميزات الباقة..."
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
                          placeholder="سعر الباقة"
                          value={newBundleForm.price}
                          onChange={(e) => setNewBundleForm({ ...newBundleForm, price: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">السعر الأصلي (ج.م)</label>
                        <input
                          type="number"
                          placeholder="السعر الأصلي"
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
                        placeholder="مثال: وفر 246 ج.م"
                        value={newBundleForm.badge}
                        onChange={(e) => setNewBundleForm({ ...newBundleForm, badge: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="font-black text-slate-800">
                        اختر المذكرات المشمولة داخل الباقة ({newBundleForm.productIds.length}):
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
                                    setNewBundleForm((prev) => ({
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
                          if (!newBundleForm.title.trim()) {
                            showToast('يرجى إدخال اسم الباقة أولاً', 'error');
                            return;
                          }
                          const bObj = {
                            ...newBundleForm,
                            id: editingBundleId || `bnd_${Date.now()}`,
                            price: Number(newBundleForm.price || 0),
                            originalPrice: Number(newBundleForm.originalPrice || 0)
                          };
                          const next = editingBundleId
                            ? bundles.map((x) => (x.id === editingBundleId ? bObj : x))
                            : [bObj, ...bundles];
                          setBundles(next);
                          await idbSet('bundles_v5', next);
                          if (db) {
                            await setDoc(
                              doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles', bObj.id),
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
                            badge: 'وفر 150 ج.م',
                            productIds: []
                          });
                          showToast(editingBundleId ? '✓ تم حفظ تعديلات الباقة بنجاح' : '✓ تمت إضافة الباقة وحفظها بنجاح');
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
                            setNewBundleForm({
                              title: '',
                              subtitle: '',
                              price: 499,
                              originalPrice: 650,
                              badge: 'وفر 150 ج.م',
                              productIds: []
                            });
                          }}
                          className="px-4 py-3 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
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
                      className={`bg-white rounded-2xl border p-4 flex items-center justify-between gap-3 ${
                        editingBundleId === b.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm">{b.title}</h4>
                          {b.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
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
                              productIds: Array.isArray(b.productIds) ? b.productIds : []
                            });
                          }}
                          title="تعديل الباقة"
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const next = bundles.filter((x) => x.id !== b.id);
                            setBundles(next);
                            await idbSet('bundles_v5', next);
                            if (db) {
                              await deleteDoc(
                                doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles', b.id)
                              );
                            }
                            if (editingBundleId === b.id) setEditingBundleId(null);
                            showToast('تم حذف الباقة');
                          }}
                          title="حذف الباقة"
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
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

            {/* تبويب 4: الكوبونات والعروض */}
            {adminSubTab === 'coupons' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                <div className="lg:col-span-6 space-y-6">
                  {/* الشريط الترويجي العلوي */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-slate-900">الشريط الترويجي العلوي</h3>
                      <label className="flex items-center gap-1.5 font-bold text-blue-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.promoEnabled !== false}
                          onChange={(e) =>
                            setSettings({ ...settings, promoEnabled: e.target.checked })
                          }
                        />
                        <span>مفعّل</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={settings.promoText}
                      onChange={(e) => setSettings({ ...settings, promoText: e.target.value })}
                      placeholder="نص العرض العلوي..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">كود الكوبون</label>
                        <input
                          type="text"
                          value={settings.promoCouponCode}
                          onChange={(e) =>
                            setSettings({ ...settings, promoCouponCode: e.target.value.toUpperCase() })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-black uppercase"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">لون الخلفية</label>
                        <input
                          type="color"
                          value={settings.promoBgColor || '#0654d0'}
                          onChange={(e) =>
                            setSettings({ ...settings, promoBgColor: e.target.value })
                          }
                          className="w-full h-9 rounded-xl border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">لون النص</label>
                        <input
                          type="color"
                          value={settings.promoTextColor || '#fde047'}
                          onChange={(e) =>
                            setSettings({ ...settings, promoTextColor: e.target.value })
                          }
                          className="w-full h-9 rounded-xl border border-slate-200"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAllAdminChanges}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer"
                    >
                      حفظ الشريط الترويجي
                    </button>
                  </div>

                  {/* إدارة عروض الحصول على أكثر من مذكرة */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-black text-slate-900">
                          {editingMultiOfferId
                            ? 'تعديل عرض المذكرات المتعددة'
                            : 'إنشاء عروض الحصول على أكثر من مذكرة'}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          أنشئ عرضاً أو أكثر وحدد ما إذا كان يسري على جميع المذكرات أو مذكرات معينة فقط
                        </p>
                      </div>
                      {editingMultiOfferId && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black">
                          وضع التعديل
                        </span>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">عنوان العرض *</label>
                          <input
                            type="text"
                            placeholder="مثال: خصم 15% عند طلب مذكرتين أو أكثر"
                            value={newMultiOfferForm.title}
                            onChange={(e) =>
                              setNewMultiOfferForm({ ...newMultiOfferForm, title: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">نص الشارة العلوية</label>
                          <input
                            type="text"
                            placeholder="🔥 عرض خاص عند طلب أكثر من مذكرة"
                            value={newMultiOfferForm.badge}
                            onChange={(e) =>
                              setNewMultiOfferForm({ ...newMultiOfferForm, badge: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">وصف العرض</label>
                        <textarea
                          rows={2}
                          placeholder="اشرح تفاصيل العرض للعملاء..."
                          value={newMultiOfferForm.subtitle}
                          onChange={(e) =>
                            setNewMultiOfferForm({ ...newMultiOfferForm, subtitle: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">الحد الأدنى</label>
                          <input
                            type="number"
                            min="2"
                            value={newMultiOfferForm.minItems}
                            onChange={(e) =>
                              setNewMultiOfferForm({
                                ...newMultiOfferForm,
                                minItems: Number(e.target.value)
                              })
                            }
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">الخصم %</label>
                          <input
                            type="number"
                            value={newMultiOfferForm.discountPercent}
                            onChange={(e) =>
                              setNewMultiOfferForm({
                                ...newMultiOfferForm,
                                discountPercent: Number(e.target.value)
                              })
                            }
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">أقصى خصم</label>
                          <input
                            type="number"
                            value={newMultiOfferForm.maxDiscount}
                            onChange={(e) =>
                              setNewMultiOfferForm({
                                ...newMultiOfferForm,
                                maxDiscount: Number(e.target.value)
                              })
                            }
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">لون الخلفية</label>
                          <input
                            type="color"
                            value={newMultiOfferForm.bgColor}
                            onChange={(e) =>
                              setNewMultiOfferForm({ ...newMultiOfferForm, bgColor: e.target.value })
                            }
                            className="w-full h-9 rounded-xl border border-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">لون الزر</label>
                          <input
                            type="color"
                            value={newMultiOfferForm.accentColor}
                            onChange={(e) =>
                              setNewMultiOfferForm({ ...newMultiOfferForm, accentColor: e.target.value })
                            }
                            className="w-full h-9 rounded-xl border border-slate-200"
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-800">
                            نطاق العرض:{' '}
                            {newMultiOfferForm.productIds.length === 0
                              ? 'يشمل جميع المذكرات (اتركه فارغاً للكل)'
                              : `محدد لـ (${newMultiOfferForm.productIds.length}) مذكرات`}
                          </span>
                          {newMultiOfferForm.productIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setNewMultiOfferForm({ ...newMultiOfferForm, productIds: [] })
                              }
                              className="text-blue-600 font-bold hover:underline cursor-pointer"
                            >
                              تحديد الكل (إلغاء التخصيص)
                            </button>
                          )}
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                          {products.map((prod) => {
                            const checked = newMultiOfferForm.productIds.includes(prod.id);
                            return (
                              <label
                                key={prod.id}
                                className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer ${
                                  checked
                                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      setNewMultiOfferForm((prev) => ({
                                        ...prev,
                                        productIds: checked
                                          ? prev.productIds.filter((id) => id !== prod.id)
                                          : [...prev.productIds, prod.id]
                                      }))
                                    }
                                  />
                                  <span className="truncate">{prod.title}</span>
                                </span>
                                <span className="text-[11px] shrink-0">{prod.price} ج.م</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!newMultiOfferForm.title.trim()) {
                              showToast('يرجى إدخال عنوان العرض أولاً', 'error');
                              return;
                            }
                            const offerObj = {
                              ...newMultiOfferForm,
                              id: editingMultiOfferId || `mo_${Date.now()}`,
                              minItems: Number(newMultiOfferForm.minItems || 2),
                              discountPercent: Number(newMultiOfferForm.discountPercent || 15),
                              maxDiscount: Number(newMultiOfferForm.maxDiscount || 150)
                            };
                            const nextOffers = editingMultiOfferId
                              ? safeMultiOffers.map((o) =>
                                  o.id === editingMultiOfferId ? offerObj : o
                                )
                              : [offerObj, ...safeMultiOffers];
                            setEditingMultiOfferId(null);
                            setNewMultiOfferForm({
                              badge: '🔥 عرض خاص عند طلب أكثر من مذكرة',
                              title: '',
                              subtitle: '',
                              minItems: 2,
                              discountPercent: 15,
                              maxDiscount: 150,
                              productIds: [],
                              bgColor: '#0f172a',
                              accentColor: '#facc15',
                              active: true
                            });
                            await saveSettings({ ...settings, multiOffers: nextOffers });
                            showToast(
                              editingMultiOfferId
                                ? '✓ تم تحديث العرض ونشره للعملاء'
                                : '✓ تم إضافة العرض ونشره للعملاء'
                            );
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black cursor-pointer"
                        >
                          {editingMultiOfferId ? 'حفظ تعديلات العرض' : '+ إضافة ونشر العرض'}
                        </button>
                        {editingMultiOfferId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMultiOfferId(null);
                              setNewMultiOfferForm({
                                badge: '🔥 عرض خاص عند طلب أكثر من مذكرة',
                                title: '',
                                subtitle: '',
                                minItems: 2,
                                discountPercent: 15,
                                maxDiscount: 150,
                                productIds: [],
                                bgColor: '#0f172a',
                                accentColor: '#facc15',
                                active: true
                              });
                            }}
                            className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
                          >
                            إلغاء
                          </button>
                        )}
                      </div>
                    </div>

                    {/* قائمة العروض الحالية */}
                    <div className="space-y-2">
                      {safeMultiOffers.map((off) => (
                        <div
                          key={off.id}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5">
                            <div className="font-black text-slate-900">{off.title}</div>
                            <div className="text-[11px] text-slate-500">
                              خصم {off.discountPercent}% عند اختيار {off.minItems} مذكرات •{' '}
                              {Array.isArray(off.productIds) && off.productIds.length > 0
                                ? `محدد لـ ${off.productIds.length} مذكرات`
                                : 'شامل جميع المذكرات'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                const nextOffers = safeMultiOffers.map((o) =>
                                  o.id === off.id ? { ...o, active: o.active === false } : o
                                );
                                await saveSettings({ ...settings, multiOffers: nextOffers });
                              }}
                              className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer ${
                                off.active !== false
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {off.active !== false ? 'مفعّل' : 'مخفي'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMultiOfferId(off.id);
                                setNewMultiOfferForm({
                                  badge: off.badge || '',
                                  title: off.title || '',
                                  subtitle: off.subtitle || '',
                                  minItems: Number(off.minItems || 2),
                                  discountPercent: Number(off.discountPercent || 15),
                                  maxDiscount: Number(off.maxDiscount || 150),
                                  productIds: Array.isArray(off.productIds) ? off.productIds : [],
                                  bgColor: off.bgColor || '#0f172a',
                                  accentColor: off.accentColor || '#facc15',
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
                                const nextOffers = safeMultiOffers.filter((o) => o.id !== off.id);
                                await saveSettings({ ...settings, multiOffers: nextOffers });
                                showToast('✓ تم حذف العرض');
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

                {/* إضافة وإدارة كوبونات الخصم */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 h-fit">
                  <h3 className="text-base font-black text-slate-900">إضافة وإدارة كوبونات الخصم</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <input
                      type="text"
                      placeholder="كود الكوبون (مثال: SAVE20)"
                      value={newCouponForm.code}
                      onChange={(e) =>
                        setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })
                      }
                      className="sm:col-span-4 px-3 py-2 rounded-xl border border-slate-200 bg-white font-black uppercase"
                    />
                    <input
                      type="number"
                      placeholder="نسبة الخصم %"
                      value={newCouponForm.discountPercent}
                      onChange={(e) =>
                        setNewCouponForm({
                          ...newCouponForm,
                          discountPercent: Number(e.target.value)
                        })
                      }
                      className="sm:col-span-3 px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                    <input
                      type="number"
                      placeholder="أقصى خصم ج.م"
                      value={newCouponForm.maxDiscount}
                      onChange={(e) =>
                        setNewCouponForm({ ...newCouponForm, maxDiscount: Number(e.target.value) })
                      }
                      className="sm:col-span-3 px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const cleanCode = newCouponForm.code.trim().toUpperCase();
                        if (!cleanCode) {
                          showToast('يرجى إدخال كود الكوبون أولاً', 'error');
                          return;
                        }
                        const cpObj = {
                          id: `cp_${Date.now()}`,
                          code: cleanCode,
                          discountPercent: Number(newCouponForm.discountPercent || 10),
                          maxDiscount: Number(newCouponForm.maxDiscount || 200),
                          active: true
                        };
                        const next = [cpObj, ...coupons];
                        setCoupons(next);
                        await idbSet('coupons_v5', next);
                        if (db) {
                          await setDoc(
                            doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons', cpObj.id),
                            cpObj
                          );
                        }
                        setNewCouponForm({ code: '', discountPercent: 15, maxDiscount: 200, active: true });
                        showToast(`تمت إضافة كوبون ${cleanCode} بنجاح`);
                      }}
                      className="sm:col-span-2 py-2 rounded-xl bg-blue-600 text-white font-black cursor-pointer"
                    >
                      + إضافة
                    </button>
                  </div>

                  <div className="space-y-2">
                    {coupons.map((cp) => (
                      <div
                        key={cp.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
                      >
                        <div>
                          <span className="font-black text-sm text-slate-900">{cp.code}</span>
                          <span className="text-slate-500 mr-2">
                            • خصم {cp.discountPercent}% (بحد أقصى {cp.maxDiscount} ج.م)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const next = coupons.map((c) =>
                                c.id === cp.id ? { ...c, active: c.active === false } : c
                              );
                              setCoupons(next);
                              await idbSet('coupons_v5', next);
                              if (db) {
                                await setDoc(
                                  doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons', cp.id),
                                  { active: cp.active === false },
                                  { merge: true }
                                );
                              }
                            }}
                            className={`px-3 py-1 rounded-xl font-bold cursor-pointer ${
                              cp.active !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
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
                              if (db) {
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
                              if (db) {
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
                      <div className="pt-1">
                        <label className="block text-[11px] font-bold text-slate-600">
                          درجة التعتيم: {settings.heroOverlayOpacity ?? 75}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="95"
                          value={settings.heroOverlayOpacity ?? 75}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              heroOverlayOpacity: Number(e.target.value)
                            }))
                          }
                          className="w-full"
                        />
                      </div>
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

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">رمز دخول الإدارة</label>
                    <input
                      type="text"
                      value={settings.adminPin}
                      onChange={(e) => setSettings({ ...settings, adminPin: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAllAdminChanges}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md cursor-pointer"
                  >
                    حفظ ونشر تعديلات الهوية والشعار
                  </button>
                </div>

                {/* إدارة روابط التواصل والإصدارات القادمة */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-base text-slate-900">إدارة روابط التواصل الاجتماعي</h4>
                      <p className="text-[11px] text-slate-500">
                        عدّل اسم أي رابط أو عنوانه مباشرة وسيُحفظ للعملاء فوراً
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAllAdminChanges}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer"
                    >
                      حفظ التعديلات
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
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
                          if (!newSocialLabel.trim() || !newSocialUrl.trim()) return;
                          const next = [
                            ...(settings.socialLinks || []),
                            {
                              id: `soc_${Date.now()}`,
                              label: newSocialLabel.trim(),
                              url: newSocialUrl.trim()
                            }
                          ];
                          const updated = { ...settings, socialLinks: next };
                          setNewSocialLabel('');
                          setNewSocialUrl('');
                          await saveSettings(updated);
                          showToast('✓ تمت إضافة الرابط وحفظه للعملاء');
                        }}
                        className="sm:col-span-2 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
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
                              className="sm:col-span-4 px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                            />
                            <input
                              type="url"
                              value={soc.url || ''}
                              onChange={(e) => {
                                const next = (settings.socialLinks || []).map((s) =>
                                  s.id === soc.id ? { ...s, url: e.target.value } : s
                                );
                                setSettings({ ...settings, socialLinks: next });
                              }}
                              placeholder="https://..."
                              dir="ltr"
                              className="sm:col-span-6 px-3 py-2 rounded-xl border border-slate-200 bg-white text-left"
                            />
                            <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
                              {soc.url && (
                                <a
                                  href={soc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="تجربة فتح الرابط"
                                  className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  const next = (settings.socialLinks || []).filter((s) => s.id !== soc.id);
                                  await saveSettings({ ...settings, socialLinks: next });
                                  showToast('✓ تم حذف الرابط وحفظ التغيير');
                                }}
                                title="حذف الرابط"
                                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
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
                    <h4 className="font-black text-slate-900">إدارة ركن قريباً على المنصة</h4>
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
                          setNewUpcomingForm({
                            title: '',
                            stage: 'المرحلة الإعدادية',
                            status: 'جاري التجهيز والتنسيق',
                            expectedDate: 'قريباً'
                          });
                          await saveSettings({ ...settings, upcomingNotebooks: next });
                          showToast('✓ تمت الإضافة والحفظ للعملاء');
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
                              showToast('✓ تم الحذف والحفظ');
                            }}
                            className="text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* إدارة آراء وتقييمات المعلمين */}
                  <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    <h4 className="font-black text-slate-900">إدارة آراء وتقييمات المعلمين</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="اسم المعلم (اختياري)"
                        value={newTestimonialForm.teacherName}
                        onChange={(e) =>
                          setNewTestimonialForm({ ...newTestimonialForm, teacherName: e.target.value })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                      <input
                        type="text"
                        placeholder="الصفة / المادة (اختياري)"
                        value={newTestimonialForm.role}
                        onChange={(e) =>
                          setNewTestimonialForm({ ...newTestimonialForm, role: e.target.value })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="نص التقييم (اختياري في حال رفع صورة تقييم)..."
                      value={newTestimonialForm.text}
                      onChange={(e) =>
                        setNewTestimonialForm({ ...newTestimonialForm, text: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer inline-flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        <span>{newTestimonialForm.image ? 'تم إرفاق صورة ✓' : 'إرفاق صورة تقييم'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const img = await compressImageFile(f, 750, 0.8);
                            setNewTestimonialForm((prev) => ({ ...prev, image: img }));
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newTestimonialForm.text.trim() && !newTestimonialForm.image) {
                            showToast('يرجى كتابة نص التقييم أو إرفاق صورة', 'error');
                            return;
                          }
                          const next = [
                            ...(settings.testimonials || []),
                            { id: `rev_${Date.now()}`, ...newTestimonialForm }
                          ];
                          setNewTestimonialForm({ teacherName: '', role: '', text: '', image: '' });
                          await saveSettings({ ...settings, testimonials: next });
                          showToast('✓ تمت إضافة التقييم ونشره للعملاء');
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                      >
                        + نشر التقييم
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {(settings.testimonials || []).map((rev) => (
                        <div
                          key={rev.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <span className="font-bold truncate">
                            {rev.teacherName || rev.text || 'تقييم مصور'}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              const next = (settings.testimonials || []).filter((r) => r.id !== rev.id);
                              await saveSettings({ ...settings, testimonials: next });
                              showToast('✓ تم حذف التقييم');
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
                    حفظ ونشر جميع التعديلات للعملاء الآن
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
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-amber-400 transition"
              >
                {renderSocialIcon(soc.label, soc.url)}
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
                    {renderSocialIcon(soc.label, soc.url)}
                    <span>{safeText(soc.label)}</span>
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل دخول الإدارة */}
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
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-sm shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول بحساب المدير الرسمي (Google)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-bold">أو برمز المرور</span>
              <div className="flex-grow border-t border-slate-200"></div>
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

      {/* معاينة المذكرة وعارض العينات */}
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
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
                      <img
                        src={allGallery[activeSampleIndex] || allGallery[0]}
                        alt={safeText(previewProduct.title)}
                        className={`w-full object-contain mx-auto transition-all ${
                          isSampleFullscreen ? 'max-h-[72vh]' : 'max-h-80 sm:max-h-96'
                        }`}
                      />
                      {renderDiscountBadge(previewProduct)}

                      {allGallery.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSampleIndex((prev) =>
                                prev > 0 ? prev - 1 : allGallery.length - 1
                              )
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-slate-900 shadow-lg flex items-center justify-center cursor-pointer touch-manipulation"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSampleIndex((prev) =>
                                prev < allGallery.length - 1 ? prev + 1 : 0
                              )
                            }
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-slate-900 shadow-lg flex items-center justify-center cursor-pointer touch-manipulation"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-black">
                            صفحة {activeSampleIndex + 1} من {allGallery.length}
                          </span>
                        </>
                      )}
                    </div>
                    {allGallery.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {allGallery.map((img, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setActiveSampleIndex(idx)}
                            className={`w-16 h-20 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer touch-manipulation ${
                              activeSampleIndex === idx ? 'border-blue-600' : 'border-transparent opacity-70'
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

              {settings.generalNoticePosition === 'top' && renderGeneralNoticeBox()}
              {settings.tipNoticePosition === 'above-desc' && renderProductTipBox(previewProduct.tipText, false)}

              <div className="space-y-2">
                <h4 className="text-lg sm:text-xl font-black text-slate-900">{safeText(previewProduct.title)}</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {safeText(previewProduct.description)}
                </p>
              </div>

              {(settings.tipNoticePosition === 'below-desc' || !settings.tipNoticePosition) &&
                renderProductTipBox(previewProduct.tipText, false)}

              {(settings.generalNoticePosition === 'bottom' || !settings.generalNoticePosition) &&
                renderGeneralNoticeBox()}

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
                  {settings.driveBtnEnabled !== false && previewProduct.driveSampleUrl && (
                    <a
                      href={previewProduct.driveSampleUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        backgroundColor: settings.driveBtnBg || '#059669',
                        color: settings.driveBtnText || '#ffffff'
                      }}
                      className="px-4 py-3 rounded-2xl text-xs font-black inline-flex items-center gap-1.5 shadow hover:opacity-95 transition"
                    >
                      <span>{safeText(settings.driveBtnLabel, 'معاينة Google Drive')}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
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
