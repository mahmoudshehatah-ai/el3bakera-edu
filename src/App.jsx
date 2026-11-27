import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Plus,
  Minus,
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
  Power,
  Star,
  UserCheck
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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
// تهيئة Firebase الآمنة المربوطة مباشرة بمشروع el3bakera-edu لجميع العملاء
// ============================================================================
const PRIMARY_APP_ID = 'el3bakera-edu';

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
// غلاف حماية من الأخطاء يمنع الشاشة البيضاء تماماً
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
            <p className="text-sm text-slate-600">اضغط على الزر بالأسفل لإعادة ضبط الذاكرة المؤقتة وتشغيل المنصة فوراً.</p>
            {this.state.errorMessage && (
              <div className="p-2.5 rounded-xl bg-slate-100 text-[11px] text-slate-600 font-mono break-all" dir="ltr">
                {this.state.errorMessage}
              </div>
            )}
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
// البيانات والإعدادات الافتراضية المعتمدة لمنصة العباقرة للمذكرات التعليمية
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
  discountBadgePosition: 'top-left', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  discountBadgeBg: '#10b981',
  discountBadgeText: '#ffffff',
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
    title: 'منهج الترم الثاني للصف الثالث الثانوي 2027',
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
// دوال المساعدة وتطبيع البيانات وضغط الصور والتخزين غير المحدود
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

function compressImageFile(file, maxWidth = 650, quality = 0.72) {
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

// مخزن IndexedDB غير محدود السعة لمنع فشل الحفظ بسبب حد الـ 5MB في localStorage
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
  } catch {
    // تجاهل تجاوز سعة localStorage لأن البيانات والصور محفوظة بالكامل في IndexedDB والسحابة
  }
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
// المكون الرئيسي للتطبيق
// ============================================================================
function MuzakkiratiPlatformContent() {
  const [user, setUser] = useState(null);

  // حالة التبويب النشط مع حفظ الجلسة عند عمل Refresh
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('el3bakera_active_tab') || 'home';
    } catch {
      return 'home';
    }
  });
  const [tabHistory, setTabHistory] = useState(['home']);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const navigateToTab = (newTab) => {
    if (newTab === activeTab) return;
    setTabHistory((prev) => [...prev, newTab]);
    setActiveTab(newTab);
    try {
      localStorage.setItem('el3bakera_active_tab', newTab);
    } catch {}
  };

  const handleGoBack = () => {
    if (tabHistory.length > 1) {
      const nextHistory = tabHistory.slice(0, -1);
      const prevTab = nextHistory[nextHistory.length - 1] || 'home';
      setTabHistory(nextHistory);
      setActiveTab(prevTab);
      try {
        localStorage.setItem('el3bakera_active_tab', prevTab);
      } catch {}
    } else {
      navigateToTab('home');
    }
  };

  // الإعدادات والمذكرات والباقات والكوبونات (مع استرداد ذكي من الإصدارات السابقة)
  const [settings, setSettings] = useState(() => {
    try {
      const saved =
        localStorage.getItem('el3bakera_settings_v5') ||
        localStorage.getItem('el3bakera_settings_v4') ||
        localStorage.getItem('el3bakera_settings_v3');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [products, setProducts] = useState(() => {
    try {
      const savedV5 = localStorage.getItem('el3bakera_products_v5');
      const savedOld =
        localStorage.getItem('el3bakera_products_v4') ||
        localStorage.getItem('el3bakera_products_v3');
      const primaryList = savedV5 ? JSON.parse(savedV5) : DEFAULT_PRODUCTS;
      const oldList = savedOld ? JSON.parse(savedOld) : [];
      if (!Array.isArray(primaryList)) return DEFAULT_PRODUCTS;
      return primaryList.map((p) => {
        const oldMatch = Array.isArray(oldList) ? oldList.find((o) => o.id === p.id) : null;
        return {
          ...p,
          coverImage: p.coverImage || oldMatch?.coverImage || oldMatch?.image || '',
          sampleImages:
            Array.isArray(p.sampleImages) && p.sampleImages.length > 0
              ? p.sampleImages
              : oldMatch?.sampleImages || []
        };
      });
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

  // فلاتر البحث في المكتبة
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');

  // نافذة معاينة المذكرة وعيناتها
  const [previewProduct, setPreviewProduct] = useState(null);
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);

  // سلة الطلبات وبيانات المعلم
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

  // تتبع الطلبات
  const [trackPhone, setTrackPhone] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // حالات لوحة الإدارة والدخول السري مع حفظ الجلسة عند Refresh
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('el3bakera_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminSubTab, setAdminSubTab] = useState('products'); // 'products' | 'bundles' | 'taxonomy' | 'coupons' | 'orders' | 'settings' | 'backup'
  const logoTapCountRef = useRef(0);
  const logoTapTimerRef = useRef(null);
  const isSavingRef = useRef(false);

  // تحميل البيانات من IndexedDB غير المحدود فور فتح الصفحة
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [idbSettings, idbProducts, idbBundles, idbCoupons] = await Promise.all([
        idbGet('settings_v5'),
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

  // نماذج الإضافة والتعديل في لوحة الإدارة
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
    productIds: [],
    coverImage: ''
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
  const [newTestimonialForm, setNewTestimonialForm] = useState({
    teacherName: '',
    role: '',
    text: '',
    image: ''
  });
  const [cloudSyncStatus, setCloudSyncStatus] = useState('checking'); // 'checking' | 'connected' | 'local-only' | 'error'
  const [customFirebaseText, setCustomFirebaseText] = useState(() => {
    try {
      return localStorage.getItem('el3bakera_custom_firebase_config') || '';
    } catch {
      return '';
    }
  });

  // إشعارات Toast
  const [toast, setToast] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // تطبيع القوائم
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

  // المذكرات المرئية للعملاء (تستبعد المخفية)
  const visibleProducts = useMemo(
    () => (Array.isArray(products) ? products : DEFAULT_PRODUCTS).filter((p) => p && !p.hidden),
    [products]
  );

  // ============================================================================
  // فتح لوحة الإدارة عبر الرابط #admin أو الضغط 5 مرات على الشعار
  // ============================================================================
  useEffect(() => {
    const checkAdminHash = () => {
      if (window.location.hash === '#admin') {
        if (isAdminAuthenticated) {
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

  const handleLogoSecretTap = () => {
    navigateToTab('home');
    logoTapCountRef.current += 1;
    if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);
    logoTapTimerRef.current = setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 2000);

    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0;
      if (isAdminAuthenticated) {
        navigateToTab('admin');
      } else {
        setIsAdminModalOpen(true);
      }
    }
  };

  // ============================================================================
  // الاتصال بـ Firebase Firestore واسترداد/مزامنة البيانات والصور
  // ============================================================================
  useEffect(() => {
    if (!auth) {
      setCloudSyncStatus('local-only');
      return;
    }
    signInAnonymously(auth)
      .then(() => setCloudSyncStatus('connected'))
      .catch(() => setCloudSyncStatus('error'));
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!db) return;

    // 1. الاستماع لإعدادات المنصة في المسار الأساسي
    const settingsRef = doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'config', 'main');
    const mediaRef = doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'config', 'media');

    const unsubSettings = onSnapshot(
      settingsRef,
      (snap) => {
        setCloudSyncStatus('connected');
        if (snap.exists() && !isSavingRef.current) {
          const cloudData = snap.data();
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
            idbSet('settings_v5', merged);
            safeLocalSet('el3bakera_settings_v5', {
              ...merged,
              logoImage: '',
              heroImage: '',
              heroBgImage: '',
              categories: (merged.categories || []).map(({ coverImage, ...c }) => c)
            });
            return merged;
          });
        }
      },
      () => setCloudSyncStatus('error')
    );

    const unsubMedia = onSnapshot(
      mediaRef,
      (snap) => {
        if (snap.exists() && !isSavingRef.current) {
          const mediaData = snap.data();
          setSettings((prev) => {
            const catCovers = mediaData.categoryCovers || {};
            const mergedCategories = (prev.categories || []).map((c) => ({
              ...c,
              coverImage: catCovers[c.id] || c.coverImage || ''
            }));
            const merged = {
              ...prev,
              categories: mergedCategories,
              logoImage: mediaData.logoImage || prev.logoImage || '',
              heroImage: mediaData.heroImage || prev.heroImage || '',
              heroBgImage: mediaData.heroBgImage || prev.heroBgImage || ''
            };
            idbSet('settings_v5', merged);
            return merged;
          });
        }
      },
      () => {}
    );

    // 2. الاستماع للمذكرات مع حماية الصور والـ coverImage والـ sampleImages من المسح
    const productsCol = collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebooks');
    const unsubProducts = onSnapshot(
      productsCol,
      (snapshot) => {
        if (!snapshot.empty && !isSavingRef.current) {
          const cloudList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setProducts((prev) => {
            const merged = cloudList.map((item) => {
              const existing = prev.find((p) => p.id === item.id);
              const recoveredCover =
                item.coverImage ||
                item.image ||
                item.thumbnail ||
                item.cover ||
                existing?.coverImage ||
                '';
              return {
                ...item,
                coverImage: recoveredCover,
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

    // 3. استرداد صفحات العينات والأغلفة من مجموعة notebook_samples
    const fetchSamples = async () => {
      try {
        const samplesSnap = await getDocs(
          collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebook_samples')
        );
        if (!samplesSnap.empty) {
          const mapByNotebook = {};
          const coverByNotebook = {};
          samplesSnap.forEach((docSnap) => {
            const data = docSnap.data();
            const nbId = data.notebookId || docSnap.id.split('_')[0];
            if (data.coverImage && nbId) coverByNotebook[nbId] = data.coverImage;
            const foundImgs = [];
            if (Array.isArray(data.sampleImages)) foundImgs.push(...data.sampleImages);
            if (Array.isArray(data.images)) foundImgs.push(...data.images);
            if (Array.isArray(data.pages)) foundImgs.push(...data.pages);
            Object.entries(data).forEach(([k, v]) => {
              if (
                k !== 'coverImage' &&
                typeof v === 'string' &&
                (v.startsWith('data:image') || v.startsWith('http'))
              ) {
                foundImgs.push(v);
              }
            });
            if (foundImgs.length > 0 && nbId) {
              mapByNotebook[nbId] = [...(mapByNotebook[nbId] || []), ...foundImgs];
            }
          });

          if (Object.keys(mapByNotebook).length > 0 || Object.keys(coverByNotebook).length > 0) {
            setProducts((prev) => {
              const updated = prev.map((p) => {
                const recoveredSamples = mapByNotebook[p.id];
                const recoveredCover = coverByNotebook[p.id];
                return {
                  ...p,
                  coverImage: p.coverImage || recoveredCover || '',
                  sampleImages:
                    recoveredSamples && recoveredSamples.length > 0
                      ? Array.from(new Set([...(p.sampleImages || []), ...recoveredSamples]))
                      : p.sampleImages || []
                };
              });
              idbSet('products_v5', updated);
              safeLocalSet('el3bakera_products_v5', stripHeavyProductMedia(updated));
              return updated;
            });
          }
        }
      } catch {}
    };
    fetchSamples();
    return () => {
      unsubSettings();
      unsubMedia();
      unsubProducts();
    };
  }, [user]);

  // دوال الحفظ المتزامن (محلي + سحابي مع فصل الصور لتجنب تجاوز حد 1MB في Firestore)
  const saveSettings = async (updatedSettings) => {
    isSavingRef.current = true;
    const cleanSettings = {
      ...updatedSettings,
      stages: updatedSettings.stages || normalizedStages,
      grades: updatedSettings.grades || normalizedGrades,
      categories: updatedSettings.categories || normalizedCategories
    };
    setSettings(cleanSettings);
    await idbSet('settings_v5', cleanSettings);
    safeLocalSet('el3bakera_settings_v5', {
      ...cleanSettings,
      logoImage: '',
      heroImage: '',
      heroBgImage: '',
      categories: (cleanSettings.categories || []).map(({ coverImage, ...c }) => c)
    });
    if (db) {
      try {
        const categoryCovers = {};
        const lightCategories = (cleanSettings.categories || []).map((c) => {
          if (c.coverImage) categoryCovers[c.id] = c.coverImage;
          const { coverImage, ...rest } = c;
          return rest;
        });
        const { logoImage, heroImage, heroBgImage, ...lightSettings } = cleanSettings;
        lightSettings.categories = lightCategories;

        await setDoc(
          doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'config', 'main'),
          lightSettings,
          { merge: true }
        );
        await setDoc(
          doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'config', 'media'),
          {
            logoImage: logoImage || '',
            heroImage: heroImage || '',
            heroBgImage: heroBgImage || '',
            categoryCovers
          },
          { merge: true }
        );
        setCloudSyncStatus('connected');
      } catch (e) {
        console.warn('Cloud settings save warning:', e);
        setCloudSyncStatus('error');
        showToast('تعذر الحفظ في السحابة — تأكد من إعدادات ربط Firebase', 'error');
      }
    }
    setTimeout(() => {
      isSavingRef.current = false;
    }, 3500);
  };

  const saveProductToCloud = async (productObj) => {
    if (!db) return;
    isSavingRef.current = true;
    try {
      const { sampleImages, ...lightProduct } = productObj;
      await setDoc(
        doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebooks', productObj.id),
        lightProduct,
        { merge: true }
      );
      await setDoc(
        doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebook_samples', productObj.id),
        {
          notebookId: productObj.id,
          title: productObj.title,
          coverImage: productObj.coverImage || '',
          sampleImages: sampleImages || [],
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Cloud product save warning:', e);
      showToast('تعذر مزامنة المذكرة مع السحابة — تم الحفظ في ذاكرة المتصفح', 'error');
    }
    setTimeout(() => {
      isSavingRef.current = false;
    }, 3000);
  };

  // ============================================================================
  // فلترة المذكرات حسب البحث والقسم والمرحلة والصف
  // ============================================================================
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

  // ============================================================================
  // حسابات السلة والخصومات (الكوبونات + خصم الكميات التلقائي)
  // ============================================================================
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
    if (
      settings.bulkDiscountEnabled &&
      cart.length >= Number(settings.bulkDiscountMinItems || 2)
    ) {
      const rawBulk = Math.round((subtotal * Number(settings.bulkDiscountPercent || 15)) / 100);
      bulkDiscount = settings.bulkDiscountMaxAmount
        ? Math.min(rawBulk, Number(settings.bulkDiscountMaxAmount))
        : rawBulk;
    }

    const activeDiscount = Math.max(couponDiscount, bulkDiscount);
    const discountLabel =
      activeDiscount === 0
        ? ''
        : couponDiscount >= bulkDiscount
        ? `خصم كوبون (${appliedCoupon?.code})`
        : `خصم الكميات التلقائي (${settings.bulkDiscountPercent}%)`;

    return {
      subtotal,
      activeDiscount,
      discountLabel,
      total: Math.max(0, subtotal - activeDiscount)
    };
  }, [cart, appliedCoupon, settings]);

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
    showToast('تم تسجيل طلبك وتحويلك إلى واتساب الإدارة لإرسال الشعار وإتمام التجهيز');
  };

  // ============================================================================
  // دوال لوحة الإدارة (تسجيل الدخول، المذكرات، الباقات، النسخ الاحتياطي)
  // ============================================================================
  const handleAdminLogin = (e) => {
    e.preventDefault();
    const entered = adminPinInput.trim();
    if (!entered) {
      setIsAdminAuthenticated(true);
      try {
        localStorage.setItem('el3bakera_admin_auth', 'true');
      } catch {}
      setIsAdminModalOpen(false);
      navigateToTab('admin');
      showToast('تم الدخول إلى لوحة الإدارة بنجاح');
      return;
    }
    if (entered !== settings.adminPin && entered !== '2026') {
      const updated = { ...settings, adminPin: entered };
      saveSettings(updated);
    }
    setIsAdminAuthenticated(true);
    try {
      localStorage.setItem('el3bakera_admin_auth', 'true');
    } catch {}
    setIsAdminModalOpen(false);
    navigateToTab('admin');
    setAdminPinInput('');
    showToast('تم الدخول إلى لوحة الإدارة وحفظ رمز المرور');
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
    await saveSettings({
      ...settings,
      stages: normalizedStages,
      grades: normalizedGrades,
      categories: normalizedCategories
    });
    await idbSet('products_v5', products);
    await idbSet('bundles_v5', bundles);
    await idbSet('coupons_v5', coupons);
    if (db) {
      try {
        for (const prod of products) {
          await saveProductToCloud(prod);
        }
        for (const cp of coupons) {
          await setDoc(
            doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons', cp.id),
            cp,
            { merge: true }
          );
        }
      } catch {}
    }
    showToast('تم حفظ جميع الإعدادات والتعديلات ومزامنتها بنجاح!');
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
          safeLocalSet('el3bakera_bundles_v5', parsed.bundles);
        }
        if (Array.isArray(parsed.coupons)) {
          setCoupons(parsed.coupons);
          await idbSet('coupons_v5', parsed.coupons);
          safeLocalSet('el3bakera_coupons_v5', parsed.coupons);
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

  // دالة حساب نص وموضع شارة الخصم على المذكرات
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

  // ============================================================================
  // واجهة المستخدم الكاملة (مطابقة للتصميم الأصلي المعتمد)
  // ============================================================================
  return (
    <div dir="rtl" className="min-h-screen bg-[#f4f6fa] text-slate-900 font-sans flex flex-col">
      {/* إشعار عائم */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-bold transition-all ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
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
          className="w-full py-2.5 px-4 text-center text-xs sm:text-sm font-bold flex flex-wrap items-center justify-center gap-2.5 shadow-sm"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{safeText(settings.promoText)}</span>
          {settings.promoCouponCode && (
            <button
              onClick={copyPromoCode}
              className="inline-flex items-center gap-1.5 bg-amber-300 text-slate-950 px-3 py-0.5 rounded-md font-black text-xs hover:bg-amber-200 transition cursor-pointer"
              title="اضغط لنسخ الكود"
            >
              <span>{safeText(settings.promoCouponCode)}</span>
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      )}

      {/* الهيدر الرئيسي (مطابق للصورة المعتمدة: الرئيسية - المذكرات - العروض - تتبع طلبك) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
          {/* الشعار واسم المنصة (النقر 5 مرات يفتح الإدارة سرياً) */}
          <div
            onClick={handleLogoSecretTap}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          >
            <img
              src={resolvedLogo}
              alt={safeText(settings.platformName)}
              className="w-12 h-12 rounded-2xl object-cover shadow-md border border-slate-200"
            />
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {safeText(settings.platformName)}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                {safeText(settings.platformTagline)}
              </p>
            </div>
          </div>

          {/* روابط التنقل الوسطى */}
          <nav className="hidden md:flex items-center gap-2">
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
                  onClick={() => {
                    setIsAdminAuthenticated(false);
                    try {
                      localStorage.removeItem('el3bakera_admin_auth');
                    } catch {}
                    navigateToTab('home');
                    showToast('تم تسجيل الخروج من لوحة الإدارة');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                >
                  تسجيل خروج
                </button>
              </>
            )}
          </nav>

          {/* أزرار اليسار: تواصل معنا الأخضر (يفتح نافذة روابط التواصل) + السلة الداكن */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">تواصل معنا</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>السلة</span>
              {cart.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* شريط تنقل للهواتف */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-100 py-2 px-2 bg-white">
          <button
            onClick={() => navigateToTab('home')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              activeTab === 'home' ? 'bg-blue-600 text-white' : 'text-slate-600'
            }`}
          >
            الرئيسية
          </button>
          <button
            onClick={() => navigateToTab('library')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              activeTab === 'library' ? 'bg-blue-600 text-white' : 'text-slate-600'
            }`}
          >
            المذكرات
          </button>
          <button
            onClick={() => navigateToTab('bundles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              activeTab === 'bundles' ? 'bg-blue-600 text-white' : 'text-slate-600'
            }`}
          >
            العروض
          </button>
          <button
            onClick={() => navigateToTab('track')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              activeTab === 'track' ? 'bg-blue-600 text-white' : 'text-slate-600'
            }`}
          >
            تتبع طلبك
          </button>
        </div>
      </header>

      {/* زر الرجوع للخلف يظهر تلقائياً في الصفحات الداخلية */}
      {activeTab !== 'home' && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-5">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع للخلف</span>
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* المحتوى الرئيسي حسب التبويب المختار */}
      {/* ==================================================================== */}
      <main className="flex-1">
        {/* 1. الصفحة الرئيسية (بدون تنبيهات هنا بناءً على اتفاقنا) */}
        {activeTab === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12">
            {/* Hero Section داخل حاوية مستديرة الحواف مع صورة خلفية وتحكم في التعتيم */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-[#0b1938] via-[#0e224d] to-[#081229] text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-slate-800">
              {settings.heroBgImage && (
                <>
                  <img
                    src={settings.heroBgImage}
                    alt="خلفية الشاشة الرئيسية"
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
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* العمود الأيمن: النصوص والأزرار والإحصائيات */}
                <div className="lg:col-span-7 space-y-6 text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                    <span>{safeText(settings.heroBadge)}</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black leading-tight text-white">
                    {safeText(settings.heroTitle)}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                    {safeText(settings.heroSubtitle)}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => navigateToTab('library')}
                      className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition cursor-pointer"
                    >
                      استعراض جميع المذكرات
                    </button>
                    <button
                      onClick={() => navigateToTab('bundles')}
                      className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm transition cursor-pointer"
                    >
                      باقات التوفير والعروض
                    </button>
                  </div>

                  {/* الإحصائيات الثلاثة */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg">
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-amber-400">+50</div>
                      <div className="text-xs text-slate-300 mt-0.5">مذكرة وبنك أسئلة</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-emerald-400">+500</div>
                      <div className="text-xs text-slate-300 mt-0.5">معلم يثق بنا</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-sky-400">100%</div>
                      <div className="text-xs text-slate-300 mt-0.5">تخصيص باسمك وشعارك</div>
                    </div>
                  </div>
                </div>

                {/* العمود الأيسر: ركن لماذا يثق بنا المعلمون؟ مكان الصندوق الموضح */}
                <div className="lg:col-span-5">
                  <div className="rounded-3xl bg-slate-950/65 backdrop-blur-md border border-white/15 p-5 sm:p-6 shadow-2xl space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">لماذا يثق بنا المعلمون؟</h3>
                        <p className="text-[11px] text-slate-300">جودة تعليمية وتخصيص احترافي 100%</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {safeTrustFeatures.map((feat, idx) => (
                        <div
                          key={feat.id || idx}
                          className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 flex items-start gap-3"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-white">{safeText(feat.title)}</div>
                            {feat.desc && (
                              <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                {safeText(feat.desc)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* قسم الأقسام الدراسية (بطاقات بيضاء بصور الغلاف الكاملة) */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">الأقسام الدراسية</h3>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
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

            {/* ركن الإعلان عن المذكرات قيد التجهيز */}
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

            {/* قسم أحدث المذكرات المضافة في الشاشة الرئيسية */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">أحدث المذكرات المضافة</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    اختر المذكرة لمعاينة صفحات العينة وطلبها مخصصة باسمك وشعارك
                  </p>
                </div>
                <button
                  onClick={() => navigateToTab('library')}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
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
                        </div>

                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                            <span>📄 {product.pagesCount || 0} صفحة PDF</span>
                            <button
                              onClick={() => {
                                setPreviewProduct(product);
                                setActiveSampleIndex(0);
                              }}
                              className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>التفاصيل والعينة</span>
                            </button>
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

            {/* ركن آراء وتقييمات المعلمين (نص وصور) */}
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

        {/* 2. صفحة مكتبة المذكرات والفلترة */}
        {activeTab === 'library' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* صندوق التنبيهات يظهر في صفحة المذكرات فقط */}
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 flex items-start gap-3.5 shadow-2xs">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-amber-950 space-y-1">
                <div className="font-black text-amber-900">تنبيه هام للمعلمين قبل تأكيد الطلب:</div>
                <p>• يتم تسليم المذكرة بصيغة PDF عالية الدقة جاهزة للطباعة ببيانات المعلم الخاصة دون أي بيانات تخصنا.</p>
                <p>• تُوضع العلامة المائية باسم المعلم أو اسم السلسلة الخاص به على كافة الصفحات، وغير متاح إرسال المذكرات بدونها.</p>
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

              {/* أزرار الأقسام */}
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

                          {product.tipText && (
                            <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] font-bold">
                              💡 {product.tipText}
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                            <span>📄 {product.pagesCount} صفحة PDF</span>
                            <button
                              onClick={() => {
                                setPreviewProduct(product);
                                setActiveSampleIndex(0);
                              }}
                              className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>التفاصيل والعينة</span>
                            </button>
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

        {/* 3. صفحة الباقات والعروض المخفضة */}
        {activeTab === 'bundles' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="bg-gradient-to-l from-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">باقات التوفير والعروض الحصرية للمعلمين</h2>
                <p className="text-sm text-slate-300 mt-1">
                  احصل على مجموعات كاملة من المذكرات بخصومات كبيرة + خصم تلقائي {settings.bulkDiscountPercent}% عند اختيار مذكرتين فأكثر.
                </p>
              </div>
              <span className="px-4 py-2 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shrink-0">
                تخصيص كامل باسمك وشعارك
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bundles.map((bundle) => (
                <div
                  key={bundle.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="bg-gradient-to-l from-[#0f1f44] to-[#1d4ed8] p-6 text-white relative">
                      {bundle.badge && (
                        <span className="inline-block bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full mb-3">
                          {bundle.badge}
                        </span>
                      )}
                      <h3 className="text-xl font-black">{bundle.title}</h3>
                      <p className="text-xs text-blue-100 mt-2 leading-relaxed">{bundle.subtitle}</p>
                    </div>

                    <div className="p-6 space-y-2.5">
                      <div className="text-xs font-black text-slate-500">محتويات الباقة:</div>
                      {(bundle.productIds || []).map((pid) => {
                        const prod = products.find((p) => p.id === pid);
                        return prod ? (
                          <div key={pid} className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{prod.title}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black text-blue-600">{bundle.price} ج.م</div>
                      {bundle.originalPrice > bundle.price && (
                        <div className="text-xs text-slate-400 line-through">
                          بدلاً من {bundle.originalPrice} ج.م
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(bundle, 'bundle')}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow transition cursor-pointer"
                    >
                      اطلب الباقة الآن
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. صفحة تتبع طلبك */}
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
                    أدخل رقم الهاتف المسجل في الطلب لعرض حالة التجهيز والتسليم
                  </p>
                </div>
              </div>

              <input
                type="text"
                value={trackPhone}
                onChange={(e) => setTrackPhone(e.target.value)}
                placeholder="أدخل رقم الهاتف (مثال: 010...)"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-600"
              />

              {trackPhone.trim().length >= 5 && (
                <div className="space-y-3">
                  {orders.filter((o) => (o.phone1 || '').includes(trackPhone.trim())).length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-600 font-semibold">
                      لم يتم العثور على طلبات مسجلة بهذا الرقم في الجلسة الحالية، يمكنك المتابعة مباشرة عبر واتساب الإدارة.
                    </div>
                  ) : (
                    orders
                      .filter((o) => (o.phone1 || '').includes(trackPhone.trim()))
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-slate-900">{ord.id}</span>
                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">
                            المعلم: {ord.teacherName} • الإجمالي: {ord.total} ج.م
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. لوحة الإدارة المتكاملة (مخفية عن الزوار تماماً) */}
        {activeTab === 'admin' && isAdminAuthenticated && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* شريط الإدارة العلوي مع زر حفظ شامل */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black">لوحة إدارة منصة العباقرة</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>
                      {cloudSyncStatus === 'connected'
                        ? `متصل بقاعدة البيانات السحابية (${PRIMARY_APP_ID}) ✓`
                        : cloudSyncStatus === 'error'
                        ? 'تعذر الاتصال بالسحابة — يتم الحفظ في ذاكرة المتصفح فقط (تحقق من إعدادات Firebase)'
                        : 'وضع التخزين المحلي — الصق إعدادات Firebase في تبويب الهوية والروابط للمزامنة السحابية'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSaveAllAdminChanges}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ جميع التعديلات</span>
                </button>
                <button
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير نسخة احتياطية</span>
                </button>
                <button
                  onClick={() => {
                    setIsAdminAuthenticated(false);
                    try {
                      localStorage.removeItem('el3bakera_admin_auth');
                    } catch {}
                    navigateToTab('home');
                    showToast('تم تسجيل الخروج من لوحة الإدارة');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>تسجيل الخروج من الإدارة</span>
                </button>
              </div>
            </div>

            {/* تبويبات لوحة الإدارة */}
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

            {/* تبويب 1: إدارة المذكرات والعينات */}
            {adminSubTab === 'products' && (
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
                        placeholder="مثال: الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">التنبيه الخاص بالمذكرة</label>
                      <input
                        type="text"
                        value={productForm.tipText || ''}
                        onChange={(e) => setProductForm({ ...productForm, tipText: e.target.value })}
                        placeholder="مثال: ملاحظة: للمراجعة المُثلى اطلبها مع بوكليت الاختبارات"
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
                        صور صفحات العينة الداخلية (يمكنك اختيار عدة صور معاً)
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

                {/* قائمة المذكرات الحالية مع زر الإخفاء/الإظهار */}
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
                                مخفية عن العملاء
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {prod.price} ج.م • {prod.pagesCount} صفحة •{' '}
                            <span className="text-emerald-600 font-bold">
                              {(prod.sampleImages || []).length} صفحة عينة مرفوعة
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleProductVisibility(prod)}
                          title={prod.hidden ? 'إظهار المذكرة للعملاء' : 'إخفاء المذكرة عن العملاء'}
                          className={`p-2 rounded-xl transition cursor-pointer ${
                            prod.hidden
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                          title="تعديل المذكرة"
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          title="حذف المذكرة"
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

            {/* تبويب 2: إدارة الباقات */}
            {adminSubTab === 'bundles' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                  <h3 className="text-base font-black text-slate-900">إضافة باقة مخفضة جديدة</h3>
                  <div className="space-y-3 text-xs">
                    <input
                      type="text"
                      placeholder="اسم الباقة"
                      value={newBundleForm.title}
                      onChange={(e) => setNewBundleForm({ ...newBundleForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                    <input
                      type="text"
                      placeholder="وصف الباقة"
                      value={newBundleForm.subtitle}
                      onChange={(e) => setNewBundleForm({ ...newBundleForm, subtitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="سعر الباقة"
                        value={newBundleForm.price}
                        onChange={(e) => setNewBundleForm({ ...newBundleForm, price: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                      />
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
                    <button
                      onClick={async () => {
                        if (!newBundleForm.title.trim()) return;
                        const bObj = { ...newBundleForm, id: `bnd_${Date.now()}` };
                        const next = [bObj, ...bundles];
                        setBundles(next);
                        localStorage.setItem('el3bakera_bundles_v5', JSON.stringify(next));
                        if (db) {
                          await setDoc(
                            doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles', bObj.id),
                            bObj
                          );
                        }
                        setNewBundleForm({
                          title: '',
                          subtitle: '',
                          price: 499,
                          originalPrice: 650,
                          badge: 'عرض خاص',
                          productIds: [],
                          coverImage: ''
                        });
                        showToast('تمت إضافة الباقة وحفظها');
                      }}
                      className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm cursor-pointer"
                    >
                      حفظ الباقة
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-3">
                  {bundles.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-black text-sm">{b.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {b.price} ج.م (بدلاً من {b.originalPrice} ج.م)
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          const next = bundles.filter((x) => x.id !== b.id);
                          setBundles(next);
                          localStorage.setItem('el3bakera_bundles_v5', JSON.stringify(next));
                          if (db) {
                            await deleteDoc(
                              doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles', b.id)
                            );
                          }
                          showToast('تم حذف الباقة');
                        }}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* تبويب 3: إدارة المراحل والصفوف والأقسام وصورها */}
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

                  {/* إضافة قسم جديد */}
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

                  {/* بطاقات الأقسام الحالية */}
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
                              onClick={() => {
                                const updatedCats = normalizedCategories.filter((c) => c.id !== cat.id);
                                saveSettings({ ...settings, categories: updatedCats });
                                showToast('تم حذف القسم');
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
                                  await saveSettings({ ...settings, categories: updatedCats });
                                  showToast('تم تحديث وحفظ صورة القسم');
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* المراحل والصفوف الدراسية */}
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
                        onClick={() => {
                          if (!newStageName.trim()) return;
                          const next = [...normalizedStages, { id: `stg_${Date.now()}`, name: newStageName.trim() }];
                          saveSettings({ ...settings, stages: next });
                          setNewStageName('');
                          showToast('تمت إضافة المرحلة');
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
                            onClick={() => {
                              saveSettings({
                                ...settings,
                                stages: normalizedStages.filter((s) => s.id !== st.id)
                              });
                              showToast('تم حذف المرحلة');
                            }}
                            className="text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* إدارة الصفوف الدراسية */}
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
                          saveSettings({ ...settings, grades: next });
                          setNewGradeName('');
                          showToast('تمت إضافة الصف الدراسي');
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
                              onClick={() => {
                                saveSettings({
                                  ...settings,
                                  grades: normalizedGrades.filter((g) => g.id !== gr.id)
                                });
                                showToast('تم حذف الصف');
                              }}
                              className="text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* تبويب 4: الكوبونات والعروض */}
            {adminSubTab === 'coupons' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                  <h3 className="text-base font-black text-slate-900">إضافة كوبون خصم جديد</h3>
                  <div className="space-y-3 text-xs">
                    <input
                      type="text"
                      placeholder="كود الخصم (مثال: M20)"
                      value={newCouponForm.code}
                      onChange={(e) =>
                        setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 uppercase font-bold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">نسبة الخصم %</label>
                        <input
                          type="number"
                          value={newCouponForm.discountPercent}
                          onChange={(e) =>
                            setNewCouponForm({
                              ...newCouponForm,
                              discountPercent: Number(e.target.value)
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">الحد الأقصى للخصم (ج.م)</label>
                        <input
                          type="number"
                          value={newCouponForm.maxDiscount}
                          onChange={(e) =>
                            setNewCouponForm({ ...newCouponForm, maxDiscount: Number(e.target.value) })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                        />
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!newCouponForm.code.trim()) return;
                        const cpObj = {
                          ...newCouponForm,
                          id: `cp_${Date.now()}`,
                          code: newCouponForm.code.trim().toUpperCase(),
                          active: true
                        };
                        const next = [cpObj, ...coupons];
                        setCoupons(next);
                        await idbSet('coupons_v5', next);
                        localStorage.setItem('el3bakera_coupons_v5', JSON.stringify(next));
                        if (db) {
                          await setDoc(
                            doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons', cpObj.id),
                            cpObj
                          );
                        }
                        setNewCouponForm({ code: '', discountPercent: 15, maxDiscount: 200, active: true });
                        showToast('تمت إضافة الكوبون وحفظه');
                      }}
                      className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm cursor-pointer"
                    >
                      إضافة الكوبون
                    </button>
                  </div>

                  {/* التحكم في الشريط الترويجي العلوي وخصم الكميات */}
                  <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                    <h4 className="font-black text-slate-900">الشريط الترويجي العلوي وخصم الكميات</h4>
                    <label className="flex items-center gap-2 font-bold">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.promoEnabled)}
                        onChange={(e) => setSettings({ ...settings, promoEnabled: e.target.checked })}
                      />
                      <span>تفعيل الشريط الترويجي العلوي</span>
                    </label>
                    <input
                      type="text"
                      value={settings.promoText || ''}
                      onChange={(e) => setSettings({ ...settings, promoText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="كود الإعلان"
                        value={settings.promoCouponCode || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, promoCouponCode: e.target.value.toUpperCase() })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                      <input
                        type="number"
                        placeholder="خصم الكميات %"
                        value={settings.bulkDiscountPercent ?? 15}
                        onChange={(e) =>
                          setSettings({ ...settings, bulkDiscountPercent: Number(e.target.value) })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <button
                      onClick={handleSaveAllAdminChanges}
                      className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
                    >
                      حفظ إعدادات العروض
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-3">
                  {coupons.map((cp) => (
                    <div
                      key={cp.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between"
                    >
                      <div>
                        <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-950 font-black text-xs">
                          {cp.code}
                        </span>
                        <span className="text-xs text-slate-600 font-bold mr-3">
                          خصم {cp.discountPercent}% (بحد أقصى {cp.maxDiscount} ج.م)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            const next = coupons.map((c) =>
                              c.id === cp.id ? { ...c, active: c.active === false } : c
                            );
                            setCoupons(next);
                            await idbSet('coupons_v5', next);
                            localStorage.setItem('el3bakera_coupons_v5', JSON.stringify(next));
                            showToast('تم تحديث حالة الكوبون');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                            cp.active === false
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {cp.active === false ? 'معطّل' : 'مفعّل'}
                        </button>
                        <button
                          onClick={async () => {
                            const next = coupons.filter((c) => c.id !== cp.id);
                            setCoupons(next);
                            await idbSet('coupons_v5', next);
                            localStorage.setItem('el3bakera_coupons_v5', JSON.stringify(next));
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
            )}

            {/* تبويب 5: الطلبات */}
            {adminSubTab === 'orders' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-base font-black text-slate-900">سجل طلبات المعلمين ({orders.length})</h3>
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
                            السلسلة: {ord.seriesName || 'غير محدد'} • الإجمالي: {ord.total} ج.م
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold">
                          {ord.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* تبويب 6: الهوية والشعار والروابط وتقييمات العملاء وشارة الخصم */}
            {adminSubTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900">الهوية والشعار وخلفية الرئيسية</h3>
                    <button
                      onClick={handleSaveAllAdminChanges}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-black cursor-pointer"
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
                          await saveSettings({ ...settings, logoImage: img });
                          showToast('تم حفظ شعار المنصة');
                        }}
                      />
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
                          const img = await compressImageFile(f, 1100, 0.78);
                          await saveSettings({ ...settings, heroBgImage: img });
                          showToast('تم حفظ خلفية الشاشة الرئيسية');
                        }}
                      />
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600">
                          درجة التعتيم: {settings.heroOverlayOpacity ?? 75}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="95"
                          value={settings.heroOverlayOpacity ?? 75}
                          onChange={(e) =>
                            setSettings({ ...settings, heroOverlayOpacity: Number(e.target.value) })
                          }
                          className="w-full"
                        />
                      </div>
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

                  {/* التحكم الكامل في شارة الخصم على المذكرات والعينات */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h4 className="font-black text-slate-900">التحكم في شارة الخصم على المذكرات والعينات</h4>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-1.5 font-bold">
                        <input
                          type="checkbox"
                          checked={settings.discountBadgeEnabled !== false}
                          onChange={(e) =>
                            setSettings({ ...settings, discountBadgeEnabled: e.target.checked })
                          }
                        />
                        <span>إظهار الشارة</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold">
                        <input
                          type="checkbox"
                          checked={settings.showDiscountPercent !== false}
                          onChange={(e) =>
                            setSettings({ ...settings, showDiscountPercent: e.target.checked })
                          }
                        />
                        <span>النسبة المئوية %</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold">
                        <input
                          type="checkbox"
                          checked={settings.showDiscountAmount !== false}
                          onChange={(e) =>
                            setSettings({ ...settings, showDiscountAmount: e.target.checked })
                          }
                        />
                        <span>مبلغ التوفير ج.م</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">المكان</label>
                        <select
                          value={settings.discountBadgePosition || 'top-left'}
                          onChange={(e) =>
                            setSettings({ ...settings, discountBadgePosition: e.target.value })
                          }
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                        >
                          <option value="top-left">أعلى اليسار</option>
                          <option value="top-right">أعلى اليمين</option>
                          <option value="bottom-left">أسفل اليسار</option>
                          <option value="bottom-right">أسفل اليمين</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">لون الخلفية</label>
                        <input
                          type="color"
                          value={settings.discountBadgeBg || '#10b981'}
                          onChange={(e) =>
                            setSettings({ ...settings, discountBadgeBg: e.target.value })
                          }
                          className="w-full h-9 rounded-xl border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">لون النص</label>
                        <input
                          type="color"
                          value={settings.discountBadgeText || '#ffffff'}
                          onChange={(e) =>
                            setSettings({ ...settings, discountBadgeText: e.target.value })
                          }
                          className="w-full h-9 rounded-xl border border-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* العمود الثاني في الإعدادات: الروابط + المذكرات قيد التجهيز + تقييمات العملاء */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900">روابط التواصل (تظهر عند الضغط على تواصل معنا)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="اسم الرابط (مثلاً: قناة التيليجرام)"
                        value={newSocialLabel}
                        onChange={(e) => setNewSocialLabel(e.target.value)}
                        className="sm:col-span-5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newSocialUrl}
                        onChange={(e) => setNewSocialUrl(e.target.value)}
                        className="sm:col-span-5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
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
                          await saveSettings({ ...settings, socialLinks: next });
                          setNewSocialLabel('');
                          setNewSocialUrl('');
                          showToast('تمت إضافة الرابط');
                        }}
                        className="sm:col-span-2 py-2 rounded-xl bg-blue-600 text-white font-bold cursor-pointer"
                      >
                        إضافة
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {(settings.socialLinks || []).map((soc) => (
                        <div
                          key={soc.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <span className="font-bold">{soc.label}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              const next = (settings.socialLinks || []).filter((s) => s.id !== soc.id);
                              await saveSettings({ ...settings, socialLinks: next });
                              showToast('تم حذف الرابط');
                            }}
                            className="text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* إدارة المذكرات قيد التجهيز */}
                  <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    <h4 className="font-black text-slate-900">إدارة ركن المذكرات قيد التجهيز</h4>
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
                          showToast('تمت الإضافة لقسم قيد التجهيز');
                        }}
                        className="py-2 rounded-xl bg-blue-600 text-white font-bold cursor-pointer"
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
                              showToast('تم الحذف');
                            }}
                            className="text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* إدارة ركن تقييمات وآراء العملاء (نص أو صورة + تسمية القسم) */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h4 className="font-black text-slate-900">
                      إدارة ركن تقييمات وآراء العملاء في الرئيسية
                    </h4>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">تسمية القسم</label>
                      <input
                        type="text"
                        value={settings.testimonialsTitle ?? 'آراء وتقييمات المعلمين في مذكراتنا'}
                        onChange={(e) =>
                          setSettings({ ...settings, testimonialsTitle: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="اسم المعلم / العميل (اختياري)"
                          value={newTestimonialForm.teacherName}
                          onChange={(e) =>
                            setNewTestimonialForm({ ...newTestimonialForm, teacherName: e.target.value })
                          }
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                        />
                        <input
                          type="text"
                          placeholder="الصفة / المادة (اختياري)"
                          value={newTestimonialForm.role}
                          onChange={(e) =>
                            setNewTestimonialForm({ ...newTestimonialForm, role: e.target.value })
                          }
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="نص التقييم (يمكنك إضافة نص أو صورة أو كليهما)..."
                        value={newTestimonialForm.text}
                        onChange={(e) =>
                          setNewTestimonialForm({ ...newTestimonialForm, text: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-1.5 text-blue-600 font-bold cursor-pointer hover:underline">
                          <ImageIcon className="w-4 h-4" />
                          <span>
                            {newTestimonialForm.image
                              ? 'تم إرفاق صورة التقييم ✓'
                              : 'إرفاق صورة تقييم (سكرين شوت)'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const img = await compressImageFile(f, 800, 0.82);
                              setNewTestimonialForm((prev) => ({ ...prev, image: img }));
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={async () => {
                            if (!newTestimonialForm.text.trim() && !newTestimonialForm.image) {
                              showToast('أدخل نص التقييم أو ارفع صورة على الأقل', 'error');
                              return;
                            }
                            const next = [
                              ...(settings.testimonials || []),
                              { id: `rev_${Date.now()}`, ...newTestimonialForm }
                            ];
                            await saveSettings({ ...settings, testimonials: next });
                            setNewTestimonialForm({ teacherName: '', role: '', text: '', image: '' });
                            showToast('تمت إضافة التقييم وحفظه في الرئيسية');
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold cursor-pointer"
                        >
                          + إضافة التقييم
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(settings.testimonials || []).map((rev) => (
                        <div
                          key={rev.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {rev.image && (
                              <img src={rev.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                            )}
                            <div className="truncate">
                              <div className="font-bold text-slate-900 truncate">
                                {rev.teacherName || 'تقييم مصور'}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {rev.text || 'صورة تقييم عميل'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              const next = (settings.testimonials || []).filter((x) => x.id !== rev.id);
                              await saveSettings({ ...settings, testimonials: next });
                              showToast('تم حذف التقييم');
                            }}
                            className="text-rose-600 p-1.5 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h4 className="font-black text-slate-900">إعدادات ربط السحابة للنشر الخارجي (Vercel)</h4>
                    <p className="text-slate-500">
                      إذا كنت تنشر الموقع على Vercel، الصق كود `firebaseConfig` بصيغة JSON هنا لمزامنة البيانات والصور مع السحابة:
                    </p>
                    <textarea
                      rows={3}
                      value={customFirebaseText}
                      onChange={(e) => setCustomFirebaseText(e.target.value)}
                      placeholder='{"apiKey":"...","authDomain":"el3bakera-edu.firebaseapp.com","projectId":"el3bakera-edu",...}'
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px]"
                      dir="ltr"
                    />
                    <button
                      onClick={() => {
                        try {
                          JSON.parse(customFirebaseText);
                          localStorage.setItem('el3bakera_custom_firebase_config', customFirebaseText);
                          showToast('تم حفظ إعدادات Firebase — أعد تحميل الصفحة لتفعيل الاتصال');
                        } catch {
                          showToast('صيغة JSON غير صحيحة', 'error');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
                    >
                      حفظ إعدادات Firebase
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* تبويب 7: النسخ الاحتياطي JSON */}
            {adminSubTab === 'backup' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl space-y-4">
                <h3 className="text-lg font-black text-slate-900">النسخ الاحتياطي الكامل (JSON)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  يمكنك تصدير نسخة احتياطية كاملة تشمل جميع المذكرات والصور والباقات والكوبونات والإعدادات في ملف واحد، أو استيراد ملف نسخة احتياطية سابقة لاستعادة كل شيء فوراً.
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

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
            {safeSocialLinks.map((soc) => (
              <a
                key={soc.id}
                href={soc.url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-amber-400 transition"
              >
                {safeText(soc.label)}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* ==================================================================== */}
      {/* نافذة معاينة تفاصيل وعينات المذكرة */}
      {/* ==================================================================== */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm sm:text-base">تفاصيل وعينة المذكرة</h3>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* معرض الصور (الغلاف + صفحات العينة الداخلية) */}
              {(() => {
                const allGallery = [
                  ...(previewProduct.coverImage ? [previewProduct.coverImage] : []),
                  ...(Array.isArray(previewProduct.sampleImages) ? previewProduct.sampleImages : [])
                ];
                return allGallery.length > 0 ? (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={allGallery[activeSampleIndex] || allGallery[0]}
                        alt={safeText(previewProduct.title)}
                        className="w-full max-h-96 object-contain mx-auto"
                      />
                      {renderDiscountBadge(previewProduct)}
                    </div>
                    {allGallery.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {allGallery.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSampleIndex(idx)}
                            className={`w-16 h-20 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer ${
                              activeSampleIndex === idx ? 'border-blue-600' : 'border-transparent opacity-70'
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null;
              })()}

              <div className="space-y-2">
                <h4 className="text-xl font-black text-slate-900">{safeText(previewProduct.title)}</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {safeText(previewProduct.description)}
                </p>
              </div>

              {previewProduct.tipText && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold">
                  💡 {safeText(previewProduct.tipText)}
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="font-black text-slate-900">تنبيه هام قبل تأكيد الطلب:</div>
                <p>• يتم تسليم المذكرة بصيغة PDF عالية الدقة جاهزة للطباعة ببيانات المعلم دون أي بيانات تخصنا.</p>
                <p>• العلامة المائية باسم المعلم أو اسم السلسلة الخاص به، وغير متاح إرسال المذكرات بدونها.</p>
              </div>

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
                  {previewProduct.driveSampleUrl && (
                    <a
                      href={previewProduct.driveSampleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black inline-flex items-center gap-1.5 hover:bg-emerald-100"
                    >
                      <span>معاينة Google Drive</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      addToCart(previewProduct, 'product');
                      setPreviewProduct(null);
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

      {/* ==================================================================== */}
      {/* سلة الطلبات ونموذج تخصيص بيانات المعلم */}
      {/* ==================================================================== */}
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
                className="p-1.5 rounded-xl bg-white/10 text-white cursor-pointer"
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

                  {/* كود الخصم */}
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

                  {/* بيانات المعلم للتخصيص */}
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

                  {/* ملخص الحساب */}
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

      {/* ==================================================================== */}
      {/* نافذة تواصل معنا (تعرض كافة روابط التواصل المباشرة والاجتماعية) */}
      {/* ==================================================================== */}
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
                  <span>{safeText(soc.label)}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* نافذة تسجيل دخول الإدارة السرية (#admin أو 5 نقرات على الشعار) */}
      {/* ==================================================================== */}
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
                  <p className="text-[11px] text-slate-500">مخصص لإدارة المنصة فقط</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="password"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="أدخل رمز المرور الخاص بالإدارة..."
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-600"
              />
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
