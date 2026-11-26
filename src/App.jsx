import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Shield,
  CheckCircle2,
  Sparkles,
  Trash2,
  Plus,
  Edit3,
  Copy,
  Check,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  Package,
  Tag,
  Percent,
  Layers,
  Settings,
  LogOut,
  MessageCircle,
  AlertCircle,
  Clock,
  Folder,
  FileText,
  Upload,
  Download,
  Image as ImageIcon,
  ArrowRight,
  Home,
  Gift,
  Users
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
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
  onSnapshot
} from 'firebase/firestore';

// ==========================================
// 1. إعدادات Firebase والتهيئة الأساسية
// ==========================================
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_du5VY8nJGDJ169Fof9EALI9x2W2d-14",
  authDomain: "el3bakera-edu.firebaseapp.com",
  projectId: "el3bakera-edu",
  storageBucket: "el3bakera-edu.firebasestorage.app",
  messagingSenderId: "74663879858",
  appId: "1:74663879858:web:4327c0ea1b825dd6c615ab"
};

let firebaseApp = null;
let auth = null;
let db = null;

try {
  firebaseApp = getApps().length ? getApp() : initializeApp(DEFAULT_FIREBASE_CONFIG);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
} catch (initErr) {
  console.warn('Firebase init fallback:', initErr);
}

const APP_ID = 'el3bakera-edu';
const LEGACY_APP_ID = 'muzakkirati-edu-app';
const ADMIN_EMAIL = 'mahmoudelzaaty7@gmail.com';
const LOCAL_SETTINGS_KEY = 'el3bakera_settings_cache_v3';
const LOCAL_NOTEBOOKS_KEY = 'el3bakera_notebooks_cache_v1';
const LOCAL_SAMPLES_KEY = 'el3bakera_samples_cache_v1';

const publicCol = (colName) => (db ? collection(db, 'artifacts', APP_ID, 'public', 'data', colName) : null);
const publicDoc = (colName, docId) => (db ? doc(db, 'artifacts', APP_ID, 'public', 'data', colName, docId) : null);
const legacyPublicCol = (colName) => (db ? collection(db, 'artifacts', LEGACY_APP_ID, 'public', 'data', colName) : null);
const legacyPublicDoc = (colName, docId) => (db ? doc(db, 'artifacts', LEGACY_APP_ID, 'public', 'data', colName, docId) : null);

// ==========================================
// حاجز حماية لمنع الشاشة البيضاء عند أي خطأ
// ==========================================
class PlatformErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'حدث خطأ غير متوقع' };
  }
  componentDidCatch(error) {
    console.warn('Recovered UI Error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="font-black text-lg text-slate-900">تم استعادة الجلسة بأمان</h2>
            <p className="text-xs text-slate-600 font-bold">
              حدث انقطاع مؤقت في الاتصال بالسحابة ({this.state.errorMsg}). اضغط لإعادة تحميل الواجهة دون فقد بياناتك:
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMsg: '' })}
              className="w-full py-3 rounded-2xl bg-blue-600 text-white text-xs font-black"
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

// ==========================================
// 2. البيانات الافتراضية والهياكل الأساسية
// ==========================================
const DEFAULT_CATEGORIES = [
  {
    id: 'term1',
    name: 'مذكرات الترم الأول',
    description: 'تصفح المراحل والصفوف الدراسية',
    order: 1,
    stages: [
      {
        id: 'prep',
        name: 'المرحلة الإعدادية',
        grades: [
          { id: 'prep1', name: 'الصف الأول الإعدادي', subjects: ['اللغة العربية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'اللغة الإنجليزية'] },
          { id: 'prep2', name: 'الصف الثاني الإعدادي', subjects: ['اللغة العربية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'اللغة الإنجليزية'] },
          { id: 'prep3', name: 'الصف الثالث الإعدادي', subjects: ['اللغة العربية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'اللغة الإنجليزية'] }
        ]
      },
      {
        id: 'sec',
        name: 'المرحلة الثانوية',
        grades: [
          { id: 'sec1', name: 'الصف الأول الثانوي', subjects: ['اللغة العربية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'التاريخ', 'الجغرافيا'] },
          { id: 'sec2', name: 'الصف الثاني الثانوي', subjects: ['اللغة العربية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء'] },
          { id: 'sec3', name: 'الصف الثالث الثانوي', subjects: ['اللغة العربية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء'] }
        ]
      }
    ]
  },
  {
    id: 'term2',
    name: 'مذكرات الترم الثاني',
    description: 'تصفح المراحل والصفوف الدراسية',
    order: 2,
    stages: [
      {
        id: 'prep_t2',
        name: 'المرحلة الإعدادية',
        grades: [
          { id: 'prep1_t2', name: 'الصف الأول الإعدادي', subjects: ['اللغة العربية', 'الرياضيات', 'العلوم'] },
          { id: 'prep2_t2', name: 'الصف الثاني الإعدادي', subjects: ['اللغة العربية', 'الرياضيات', 'العلوم'] },
          { id: 'prep3_t2', name: 'الصف الثالث الإعدادي', subjects: ['اللغة العربية', 'الرياضيات', 'العلوم'] }
        ]
      }
    ]
  },
  {
    id: 'foundation',
    name: 'كورسات التأسيس',
    description: 'تصفح المراحل والصفوف الدراسية',
    order: 3,
    stages: [
      {
        id: 'found_stage',
        name: 'برامج التأسيس الشاملة',
        grades: [
          { id: 'found_ar', name: 'تأسيس القراءة والكتابة والنحو', subjects: ['اللغة العربية'] },
          { id: 'found_en', name: 'تأسيس الصوتيات والقواعد', subjects: ['اللغة الإنجليزية'] },
          { id: 'found_math', name: 'تأسيس الحساب والمهارات الرياضية', subjects: ['الرياضيات'] }
        ]
      }
    ]
  }
];

const DEFAULT_CUSTOMER_FIELDS = [
  { id: 'teacherName', label: 'اسم المعلم (كما سيُكتب على المذكرة)', placeholder: 'مثال: أ/ محمود شحاتة', type: 'text', required: true, enabled: true, order: 1 },
  { id: 'whatsapp', label: 'رقم الواتساب للتواصل وإرسال الملفات', placeholder: '010xxxxxxxx', type: 'tel', required: true, enabled: true, order: 2 },
  { id: 'centerName', label: 'اسم السلسلة أو السنتر (اختياري)', placeholder: 'مثال: سلسلة العباقرة في اللغة العربية', type: 'text', required: false, enabled: true, order: 3 },
  { id: 'governorate', label: 'المحافظة / الإدارة التعليمية', placeholder: 'مثال: الغربية - المحلة الكبرى', type: 'text', required: false, enabled: true, order: 4 },
  { id: 'notes', label: 'ملاحظات إضافية للتصميم', placeholder: 'اكتب أي تفاصيل أو ألوان مفضلة...', type: 'textarea', required: false, enabled: true, order: 5 }
];

const DEFAULT_SETTINGS = {
  siteName: 'منصة العباقرة للمذكرات التعليمية',
  siteTagline: 'مذكرات دراسية احترافية مخصصة للمعلم باسمه وبياناته الخاصة',
  logoUrl: '',
  logoSize: 48,
  whatsappNumber: '201000000000',
  heroBadge: 'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle: 'نوفر للمعلمين مذكرات دراسية منسقة باحترافية ومحدّثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة بيانات المعلم وشعاره على الغلاف وجميع الصفحات.',
  heroBgImage: '',
  heroBgOpacity: 0.28,
  heroMinHeight: 440,
  trustTitle: 'لماذا يثق بنا المعلمون؟',
  trustPoints: [
    'محتوى متكامل ومطابق لأحدث تعليمات الوزارة منسق باحترافية.',
    'وضع اسم المعلم ورقم الهاتف والشعار على جميع الصفحات.',
    'معاينة حقيقية لصفحات المذكرة قبل تأكيد الطلب.',
    'تسليم سريع بصيغة PDF عالية الدقة جاهزة للطباعة.',
    'خدمة عملاء حقيقية لحل أي مشكلة.'
  ],
  promoBannerEnabled: true,
  promoBannerText: 'عرض خاص للمعلمين: خصم 15% على جميع مذكرات الترم الأول + إضافة الشعار مجانًا لفترة محدودة!',
  promoBannerColor: 'blue',
  promoBannerCoupon: 'M20',
  promoBannerCopyLabel: 'انسخ الكوبون:',
  nextOrderRewardEnabled: true,
  nextOrderRewardMode: 'auto',
  nextOrderRewardCustomCode: 'VIP15',
  nextOrderRewardType: 'percent',
  nextOrderRewardValue: 15,
  nextOrderRewardValidDays: 7,
  nextOrderRewardTitle: 'هدية خاصة لطلبك القادم!',
  nextOrderRewardMessage: 'استخدم هذا الكوبون في طلبك القادم للحصول على خصم إضافي حصري:',
  whatsNewEnabled: true,
  whatsNewTitle: 'ما الجديد؟ أحدث المذكرات والإصدارات',
  whatsNewMode: 'auto',
  whatsNewManualIds: [],
  whatsNewCount: 4,
  newsSectionEnabled: true,
  newsSectionTitle: 'أخبار المنصة ومذكرات قيد التجهيز',
  newsItems: [
    {
      id: 'news_1',
      badge: 'تحديث المناهج',
      title: 'جاري تجهيز مراجعات ليلة الامتحان النهائية لجميع المراحل',
      body: 'يمكنك حجز نسختك المخصصة مسبقًا الآن وسيتم تسليمها فور الاعتماد النهائي.'
    }
  ],
  driveButtonLabel: 'معاينة وتحميل عينة PDF كاملة عبر Google Drive',
  categories: DEFAULT_CATEGORIES,
  categoryImages: {},
  bundles: [],
  customerFields: DEFAULT_CUSTOMER_FIELDS,
  socialLinks: [
    { id: 'soc_wa', label: 'تواصل مباشر عبر واتساب', url: 'https://wa.me/201000000000' }
  ]
};

// ==========================================
// 3. دوال مساعدة للتطبيع وضغط الصور
// ==========================================
function normalizeNotebook(nb) {
  if (!nb || typeof nb !== 'object') return nb;
  const cover =
    nb.coverImage ||
    nb.cover ||
    nb.image ||
    nb.thumbnail ||
    (Array.isArray(nb.samplePages) && nb.samplePages[0]) ||
    '';
  const samples = Array.isArray(nb.samplePages)
    ? nb.samplePages
    : Array.isArray(nb.samples)
    ? nb.samples
    : Array.isArray(nb.images)
    ? nb.images
    : [];
  return {
    ...nb,
    coverImage: cover,
    samplePages: samples,
    price: Number(nb.price) || 0,
    oldPrice: Number(nb.oldPrice) || 0
  };
}

function mergeAndNormalizeSettings(base, incoming) {
  if (!incoming || typeof incoming !== 'object') return base;
  const mergedCatImages = {
    ...(base.categoryImages || {}),
    ...(incoming.categoryImages || {})
  };
  const rawCats = Array.isArray(incoming.categories) && incoming.categories.length > 0
    ? incoming.categories
    : base.categories;

  const normalizedCats = rawCats.map((c, idx) => {
    const id = c.id || `cat_${idx + 1}`;
    const name = c.name || c.title || c.label || `قسم ${idx + 1}`;
    if (c.image && !mergedCatImages[id]) {
      mergedCatImages[id] = c.image;
    }
    return {
      ...c,
      id,
      name,
      stages: Array.isArray(c.stages) ? c.stages : []
    };
  });

  return {
    ...base,
    ...incoming,
    logoUrl: incoming.logoUrl ? incoming.logoUrl : base.logoUrl,
    heroBgImage: incoming.heroBgImage ? incoming.heroBgImage : base.heroBgImage,
    categories: normalizedCats,
    categoryImages: mergedCatImages,
    bundles: Array.isArray(incoming.bundles) ? incoming.bundles : base.bundles,
    customerFields:
      Array.isArray(incoming.customerFields) && incoming.customerFields.length > 0
        ? incoming.customerFields
        : base.customerFields,
    socialLinks: Array.isArray(incoming.socialLinks) ? incoming.socialLinks : base.socialLinks,
    newsItems: Array.isArray(incoming.newsItems) ? incoming.newsItems : base.newsItems,
    trustPoints:
      Array.isArray(incoming.trustPoints) && incoming.trustPoints.length > 0
        ? incoming.trustPoints
        : base.trustPoints
  };
}

function compressImageFile(file, maxWidth = 1100, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
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

function isCouponExpired(coupon) {
  if (!coupon || !coupon.expiresAt) return false;
  const ts = new Date(coupon.expiresAt).getTime();
  return !Number.isNaN(ts) && ts < Date.now();
}

function formatExpiryArabic(expiresAt) {
  if (!expiresAt) return '';
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ==========================================
// 4. مكون معاينة المذكرة المحمية
// ==========================================
function ProtectedPreviewModal({ notebook, settings, samplesMap, onClose, onAddToCart, isInCart }) {
  const [samples, setSamples] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loadingSamples, setLoadingSamples] = useState(true);

  useEffect(() => {
    if (!notebook) return;
    let active = true;
    const extractPages = (data) => {
      if (!data || typeof data !== 'object') return [];
      const arr =
        (Array.isArray(data.pages) && data.pages) ||
        (Array.isArray(data.samples) && data.samples) ||
        (Array.isArray(data.images) && data.images) ||
        (Array.isArray(data.sampleImages) && data.sampleImages) ||
        (Array.isArray(data.urls) && data.urls) ||
        [];
      return arr
        .map((item) => (typeof item === 'string' ? item : item?.url || item?.src || ''))
        .filter(Boolean);
    };

    const loadSamples = async () => {
      setLoadingSamples(true);
      try {
        const inlineSamples = Array.isArray(notebook.samplePages) ? notebook.samplePages : [];
        let remoteSamples = Array.isArray(samplesMap?.[notebook.id]) ? samplesMap[notebook.id] : [];
        if (remoteSamples.length === 0) {
          try {
            const snap = await getDoc(publicDoc('notebook_samples', notebook.id));
            if (snap.exists()) {
              remoteSamples = extractPages(snap.data());
            }
          } catch {
            // تجاهل
          }
        }
        if (remoteSamples.length === 0) {
          try {
            const legacySnap = await getDoc(legacyPublicDoc('notebook_samples', notebook.id));
            if (legacySnap.exists()) {
              remoteSamples = extractPages(legacySnap.data());
            }
          } catch {
            // تجاهل
          }
        }
        const mergedSamples = remoteSamples.length > 0 ? remoteSamples : inlineSamples;
        const allPages = [
          ...(notebook.coverImage ? [notebook.coverImage] : []),
          ...mergedSamples.filter((p) => p && p !== notebook.coverImage)
        ];
        if (active) {
          setSamples(allPages);
          setCurrentIdx(0);
        }
      } catch {
        const fallback = [
          ...(notebook.coverImage ? [notebook.coverImage] : []),
          ...(Array.isArray(notebook.samplePages) ? notebook.samplePages : [])
        ];
        if (active) {
          setSamples(fallback);
          setCurrentIdx(0);
        }
      } finally {
        if (active) setLoadingSamples(false);
      }
    };

    loadSamples();
    return () => {
      active = false;
    };
  }, [notebook, samplesMap]);

  if (!notebook) return null;

  const currentImg = samples[currentIdx] || '';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس نافذة المعاينة */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
              <Eye className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">{notebook.title}</h3>
              <p className="text-xs text-slate-500 font-bold truncate">
                {notebook.gradeName} {notebook.subject ? `• ${notebook.subject}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* عارض الصفحات المحمي */}
          <div className="lg:col-span-7 bg-slate-900 p-4 flex flex-col items-center justify-center relative select-none">
            {loadingSamples ? (
              <div className="h-72 sm:h-96 flex items-center justify-center text-white/80 text-sm font-bold">
                جاري تحميل صفحات العينة...
              </div>
            ) : currentImg ? (
              <div
                className="relative w-full flex items-center justify-center overflow-hidden rounded-2xl bg-slate-800"
                onContextMenu={(e) => e.preventDefault()}
              >
                <img
                  src={currentImg}
                  alt={`صفحة ${currentIdx + 1}`}
                  draggable={false}
                  className="max-h-[420px] w-auto object-contain pointer-events-none"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 rotate-[-22deg]">
                  <span className="text-white font-black text-xl sm:text-2xl tracking-wider border-2 border-white/60 px-4 py-1 rounded-xl">
                    {settings.siteName}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-72 sm:h-96 flex flex-col items-center justify-center text-slate-400 gap-2">
                <BookOpen className="w-12 h-12 opacity-40" />
                <p className="text-sm font-bold">لا توجد صور عينة مرفوعة لهذه المذكرة بعد</p>
              </div>
            )}

            {/* أزرار التقليب والمصغرات */}
            {samples.length > 1 && (
              <div className="w-full mt-3 space-y-2">
                <div className="flex items-center justify-between text-white text-xs font-bold px-1">
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((p) => (p > 0 ? p - 1 : samples.length - 1))}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>
                  <span>
                    صفحة {currentIdx + 1} من {samples.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((p) => (p < samples.length - 1 ? p + 1 : 0))}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 flex items-center gap-1"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {samples.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentIdx(i)}
                      className={`w-12 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                        i === currentIdx ? 'border-blue-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* تفاصيل المذكرة */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between space-y-4 max-h-[82vh] overflow-y-auto">
            <div className="space-y-3">
              {notebook.comingSoon && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                  <Clock className="w-3.5 h-3.5" />
                  <span>قيد التجهيز — متاح للحجز المسبق</span>
                </span>
              )}

              {notebook.alertText && (
                <div
                  className={`p-3 rounded-2xl border text-xs font-bold leading-relaxed ${
                    notebook.alertColor === 'red'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : notebook.alertColor === 'green'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : notebook.alertColor === 'blue'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {notebook.alertBadge && (
                    <span className="inline-block px-2 py-0.5 rounded-md bg-white/80 font-black ml-1.5 mb-1">
                      {notebook.alertBadge}
                    </span>
                  )}
                  <p>{notebook.alertText}</p>
                </div>
              )}

              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-black text-blue-700">{notebook.price} ج.م</span>
                {notebook.oldPrice > notebook.price && (
                  <span className="text-sm text-slate-400 line-through font-bold">{notebook.oldPrice} ج.م</span>
                )}
              </div>

              {notebook.pagesCount && (
                <p className="text-xs font-bold text-slate-600">
                  عدد الصفحات: <span className="text-slate-900 font-black">{notebook.pagesCount} صفحة</span>
                </p>
              )}

              {notebook.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {notebook.description}
                </p>
              )}

              {notebook.driveUrl && (
                <a
                  href={notebook.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center gap-2 transition"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span>{settings.driveButtonLabel || 'معاينة عينة PDF عبر Google Drive'}</span>
                </a>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => onAddToCart(notebook)}
                className={`w-full py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition ${
                  isInCart
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isInCart ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>مضافة في سلة الطلبات</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>إضافة المذكرة إلى السلة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. مكون بطاقة المذكرة
// ==========================================
function NotebookCard({ notebook, onPreview, onAddToCart, isInCart }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      <div
        onClick={() => onPreview(notebook)}
        className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer"
      >
        {notebook.coverImage ? (
          <img
            src={notebook.coverImage}
            alt={notebook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-4 text-center">
            <BookOpen className="w-10 h-10 mb-2 opacity-80" />
            <span className="text-xs font-black line-clamp-2">{notebook.title}</span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
          {notebook.comingSoon && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-black shadow">
              قيد التجهيز
            </span>
          )}
          {notebook.oldPrice > notebook.price && (
            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black shadow">
              وفر {notebook.oldPrice - notebook.price} ج.م
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(notebook);
          }}
          className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-black flex items-center gap-1.5 backdrop-blur-sm shadow"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>معاينة</span>
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600">
            <span>{notebook.gradeName}</span>
            {notebook.subject && <span>• {notebook.subject}</span>}
          </div>
          <h3
            onClick={() => onPreview(notebook)}
            className="font-black text-slate-900 text-sm sm:text-base line-clamp-2 cursor-pointer hover:text-blue-700 transition"
          >
            {notebook.title}
          </h3>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-lg font-black text-slate-900">{notebook.price} ج.م</span>
            {notebook.oldPrice > notebook.price && (
              <span className="block text-xs text-slate-400 line-through font-bold">{notebook.oldPrice} ج.م</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(notebook)}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition shadow-sm ${
              isInCart
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isInCart ? (
              <>
                <Check className="w-4 h-4" />
                <span>بالسلة</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>أضف للسلة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. مكون سلة الطلبات وإتمام الطلب
// ==========================================
function OrderCheckoutModal({
  isOpen,
  onClose,
  cart,
  setCart,
  settings,
  coupons,
  showToast
}) {
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [expandedBundles, setExpandedBundles] = useState({});
  const [formValues, setFormValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedRewardCode, setCopiedRewardCode] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
      return Math.round((subtotal * (Number(appliedCoupon.value) || 0)) / 100);
    }
    return Math.min(subtotal, Number(appliedCoupon.value) || 0);
  }, [appliedCoupon, subtotal]);

  const finalTotal = Math.max(0, subtotal - couponDiscount);

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('يرجى إدخال كود الكوبون أولاً');
      return;
    }
    const found = coupons.find((c) => (c.code || '').toUpperCase() === code);
    if (!found) {
      setCouponError('كود الكوبون غير صحيح');
      return;
    }
    if (found.active === false) {
      setCouponError('هذا الكوبون غير مفعل حاليًا');
      return;
    }
    if (isCouponExpired(found)) {
      setCouponError('عذرًا، انتهت مدة صلاحية هذا الكوبون');
      return;
    }
    if (found.singleUse && found.used) {
      setCouponError('تم استخدام هذا الكوبون مسبقًا');
      return;
    }
    setAppliedCoupon(found);
    showToast(`تم تطبيق الكوبون (${found.code}) بنجاح!`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
    showToast('تم إلغاء كوبون الخصم');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const activeFields = (settings.customerFields || DEFAULT_CUSTOMER_FIELDS)
      .filter((f) => f.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const fld of activeFields) {
      if (fld.required && !(formValues[fld.id] || '').trim()) {
        showToast(`يرجى إدخال: ${fld.label}`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const orderCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      let generatedRewardCoupon = null;

      if (settings.nextOrderRewardEnabled) {
        const validDays = Number(settings.nextOrderRewardValidDays) || 0;
        const expiresAt =
          validDays > 0 ? new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString() : '';

        if (settings.nextOrderRewardMode === 'fixed' && settings.nextOrderRewardCustomCode) {
          generatedRewardCoupon = {
            code: settings.nextOrderRewardCustomCode.trim().toUpperCase(),
            type: settings.nextOrderRewardType || 'percent',
            value: Number(settings.nextOrderRewardValue) || 15,
            expiresAt
          };
        } else {
          const autoCode = `VIP${Math.floor(1000 + Math.random() * 9000)}`;
          generatedRewardCoupon = {
            code: autoCode,
            type: settings.nextOrderRewardType || 'percent',
            value: Number(settings.nextOrderRewardValue) || 15,
            singleUse: true,
            used: false,
            active: true,
            expiresAt,
            createdAt: new Date().toISOString()
          };
          try {
            await addDoc(publicCol('coupons'), generatedRewardCoupon);
          } catch {
            // تجاهل في وضع المعاينة
          }
        }
      }

      if (appliedCoupon?.id && appliedCoupon.singleUse) {
        try {
          await updateDoc(publicDoc('coupons', appliedCoupon.id), { used: true });
        } catch {
          // تجاهل
        }
      }

      const orderPayload = {
        orderCode,
        items: cart.map((item) => ({
          id: item.id,
          title: item.title,
          gradeName: item.gradeName || '',
          price: Number(item.price) || 0,
          isBundle: Boolean(item.isBundle),
          bundleItems: item.bundleItems || []
        })),
        subtotal,
        couponCode: appliedCoupon?.code || '',
        couponDiscount,
        total: finalTotal,
        customerData: formValues,
        teacherName: formValues.teacherName || 'معلم',
        whatsapp: formValues.whatsapp || '',
        status: 'تم الاستلام',
        rewardCoupon: generatedRewardCoupon,
        createdAt: new Date().toISOString()
      };

      try {
        await addDoc(publicCol('orders'), orderPayload);
      } catch {
        // تجاهل في وضع المعاينة
      }

      setCompletedOrder(orderPayload);
      setCart([]);
      setAppliedCoupon(null);
      setCouponInput('');
    } finally {
      setSubmitting(false);
    }
  };

  const buildWhatsappUrl = (order) => {
    const cleanPhone = (settings.whatsappNumber || '201000000000').replace(/\D/g, '');
    const itemsLines = order.items
      .map((it, idx) =>
        it.isBundle
          ? `${idx + 1}. [باقة] ${it.title} (${it.price} ج.م)`
          : `${idx + 1}. ${it.title} - ${it.gradeName} (${it.price} ج.م)`
      )
      .join('\n');

    const customerLines = (settings.customerFields || DEFAULT_CUSTOMER_FIELDS)
      .filter((f) => f.enabled !== false && order.customerData?.[f.id])
      .map((f) => `• ${f.label}: ${order.customerData[f.id]}`)
      .join('\n');

    const text = `السلام عليكم، أرغب في تأكيد طلبي من *${settings.siteName}*:\n\nرقم الطلب: *${order.orderCode}*\n\n*المطلوب:*\n${itemsLines}\n\nالإجمالي النهائي: *${order.total} ج.م*${
      order.couponCode ? ` (بعد كوبون ${order.couponCode})` : ''
    }\n\n*بيانات التخصيص:*\n${customerLines}`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const activeFields = (settings.customerFields || DEFAULT_CUSTOMER_FIELDS)
    .filter((f) => f.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={() => {
        setCompletedOrder(null);
        onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-600 text-white">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                {completedOrder ? 'تم تسجيل طلبك بنجاح!' : `سلة الطلبات (${cart.length})`}
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                {completedOrder ? 'احتفظ برقم الطلب لمتابعة حالة التجهيز' : 'راجع المذكرات وأكمل بيانات التخصيص'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCompletedOrder(null);
              onClose();
            }}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {completedOrder ? (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">شكرًا لك يا {completedOrder.teacherName}!</h4>
                <p className="text-xs sm:text-sm text-slate-600">
                  تم حفظ طلبك برقم المتابعة التالي، اضغط على زر واتساب لإرسال التفاصيل والبدء في التجهيز فورًا:
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center gap-3">
                <span className="font-black text-lg text-slate-900 tracking-wider">{completedOrder.orderCode}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(completedOrder.orderCode);
                    setCopiedOrderId(true);
                    setTimeout(() => setCopiedOrderId(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border text-xs font-black flex items-center gap-1"
                >
                  {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedOrderId ? 'تم النسخ' : 'نسخ الرقم'}</span>
                </button>
              </div>

              {completedOrder.rewardCoupon && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-right space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-black text-sm">
                    <Gift className="w-5 h-5 text-amber-600" />
                    <span>{settings.nextOrderRewardTitle || 'هدية خاصة لطلبك القادم!'}</span>
                  </div>
                  <p className="text-xs text-amber-900/80 font-bold">
                    {settings.nextOrderRewardMessage || 'استخدم هذا الكوبون في طلبك القادم:'}
                  </p>
                  <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-amber-200">
                    <div>
                      <span className="font-black text-base text-blue-700">{completedOrder.rewardCoupon.code}</span>
                      <span className="block text-[11px] font-bold text-slate-500">
                        خصم {completedOrder.rewardCoupon.value}
                        {completedOrder.rewardCoupon.type === 'percent' ? '%' : ' ج.م'}
                        {completedOrder.rewardCoupon.expiresAt
                          ? ` • صالح حتى ${formatExpiryArabic(completedOrder.rewardCoupon.expiresAt)}`
                          : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(completedOrder.rewardCoupon.code);
                        setCopiedRewardCode(true);
                        setTimeout(() => setCopiedRewardCode(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-1"
                    >
                      {copiedRewardCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRewardCode ? 'تم النسخ' : 'انسخ الكوبون'}</span>
                    </button>
                  </div>
                </div>
              )}

              <a
                href={buildWhatsappUrl(completedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                <span>إرسال تفاصيل الطلب على واتساب الآن</span>
              </a>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-black text-slate-700">سلة الطلبات فارغة حاليًا</p>
              <p className="text-xs text-slate-500">تصفح المذكرات أو باقات التوفير وأضف ما يناسبك للسلة</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-5">
              {/* قائمة العناصر المختارة */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-slate-700">المذكرات والباقات المختارة ({cart.length}):</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pl-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border ${
                        item.isBundle ? 'bg-indigo-50/60 border-indigo-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.isBundle && (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black">
                                باقة مجمعة
                              </span>
                            )}
                            <p className="font-black text-slate-900 text-xs sm:text-sm truncate">{item.title}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs font-bold text-slate-500">
                            {item.gradeName && <span>{item.gradeName} •</span>}
                            <span className="text-blue-700 font-black">{item.price} ج.م</span>
                            {item.isBundle && Array.isArray(item.bundleItems) && item.bundleItems.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedBundles((p) => ({ ...p, [item.id]: !p[item.id] }))
                                }
                                className="text-indigo-700 underline text-[11px] font-black"
                              >
                                {expandedBundles[item.id]
                                  ? 'إخفاء المحتويات'
                                  : `عرض المحتويات (${item.bundleItems.length} مذكرات)`}
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCart((prev) => prev.filter((x) => x.id !== item.id))}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 shrink-0"
                          title="حذف من السلة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.isBundle && expandedBundles[item.id] && Array.isArray(item.bundleItems) && (
                        <ul className="mt-2 pt-2 border-t border-indigo-200/70 space-y-1 text-[11px] font-bold text-slate-700 pr-3 list-disc">
                          {item.bundleItems.map((sub, i) => (
                            <li key={i}>{sub.title}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* صندوق كوبون الخصم */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-800">هل لديك كوبون خصم؟</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="أدخل كود الكوبون هنا..."
                    disabled={Boolean(appliedCoupon)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold uppercase disabled:bg-slate-100"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>حذف الكوبون</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black"
                    >
                      تطبيق
                    </button>
                  )}
                </div>
                {couponError && <p className="text-xs font-bold text-rose-600">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-xs font-black text-emerald-700">
                    تم تطبيق الكوبون ({appliedCoupon.code}) بنجاح!
                  </p>
                )}
              </div>

              {/* ملخص الحساب */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5 text-xs font-bold">
                <div className="flex items-center justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span>{subtotal} ج.م</span>
                </div>
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <span>خصم الكوبون ({appliedCoupon.code}):</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[11px] text-rose-600 underline font-black"
                      >
                        إلغاء
                      </button>
                    </div>
                    <span>- {couponDiscount} ج.م</span>
                  </div>
                )}
                <div className="pt-2 border-t border-blue-200 flex items-center justify-between text-base font-black text-blue-900">
                  <span>الإجمالي النهائي المطلوب:</span>
                  <span>{finalTotal} ج.م</span>
                </div>
              </div>

              {/* حقول بيانات التخصيص */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-900">بيانات التخصيص والتواصل:</h4>
                {activeFields.map((fld) => (
                  <div key={fld.id} className="space-y-1">
                    <label className="block text-xs font-black text-slate-700">
                      {fld.label} {fld.required && <span className="text-rose-600">*</span>}
                    </label>
                    {fld.type === 'textarea' ? (
                      <textarea
                        rows={2}
                        required={fld.required}
                        placeholder={fld.placeholder}
                        value={formValues[fld.id] || ''}
                        onChange={(e) => setFormValues((p) => ({ ...p, [fld.id]: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                      />
                    ) : (
                      <input
                        type={fld.type || 'text'}
                        required={fld.required}
                        placeholder={fld.placeholder}
                        value={formValues[fld.id] || ''}
                        onChange={(e) => setFormValues((p) => ({ ...p, [fld.id]: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg disabled:opacity-60"
              >
                {submitting ? 'جاري تسجيل الطلب...' : 'تأكيد الطلب والمتابعة إلى واتساب'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. لوحة تحكم الإدارة الكاملة
// ==========================================
function AdminDashboard({
  settings,
  setSettings,
  notebooks,
  samplesMap,
  coupons,
  orders,
  onLogout,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('notebooks');
  const [localSettings, setLocalSettings] = useState(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  // حالات إدارة المذكرات
  const [editingNotebookId, setEditingNotebookId] = useState(null);
  const [nbForm, setNbForm] = useState({
    title: '',
    categoryId: settings.categories?.[0]?.id || 'term1',
    stageId: '',
    gradeId: '',
    gradeName: '',
    subject: '',
    price: '',
    oldPrice: '',
    pagesCount: '',
    description: '',
    driveUrl: '',
    coverImage: '',
    samplePages: [],
    alertBadge: '',
    alertText: '',
    alertColor: 'amber',
    comingSoon: false
  });
  const [savingNb, setSavingNb] = useState(false);
  const [quickEdits, setQuickEdits] = useState({});

  // حالات إدارة الأقسام والمراحل
  const [newCatName, setNewCatName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(settings.categories?.[0]?.id || '');
  const [newStageName, setNewStageName] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [newGradeName, setNewGradeName] = useState('');

  // حالات إدارة الكوبونات والباقات
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percent',
    value: 15,
    expiresAt: '',
    singleUse: false
  });
  const [bundleForm, setBundleForm] = useState({
    title: '',
    description: '',
    price: '',
    notebookIds: []
  });

  useEffect(() => {
    setLocalSettings((prev) => mergeAndNormalizeSettings(prev, settings));
  }, [settings]);

  const handleSaveAllSettings = async (overrideObj = null) => {
    setSavingSettings(true);
    try {
      const target = mergeAndNormalizeSettings(settings, overrideObj || localSettings);
      const { logoUrl, heroBgImage, categoryImages, ...lightMain } = target;

      if (auth.currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        await setDoc(publicDoc('settings', 'main'), lightMain, { merge: true });
        await setDoc(
          publicDoc('settings', 'media_assets'),
          {
            logoUrl: logoUrl || '',
            heroBgImage: heroBgImage || '',
            categoryImages: categoryImages || {}
          },
          { merge: true }
        );
      }

      setSettings(target);
      try {
        localStorage.setItem(
          LOCAL_SETTINGS_KEY,
          JSON.stringify({ ...lightMain, logoUrl: '', heroBgImage: '', categoryImages: {} })
        );
      } catch {
        // تجاهل امتلاء التخزين المحلي
      }
      showToast(
        auth.currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
          ? 'تم حفظ جميع الإعدادات في السحابة بنجاح!'
          : 'تم الحفظ في المعاينة المحلية (ارفع الكود لـ Vercel للحفظ السحابي المباشر)'
      );
    } catch (err) {
      showToast(`تعذر الحفظ في السحابة: ${err?.message || 'تحقق من صلاحيات Firestore'}`, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // دوال المذكرات
  const selectedCatObj = (localSettings.categories || []).find((c) => c.id === nbForm.categoryId);
  const selectedStageObj = (selectedCatObj?.stages || []).find((s) => s.id === nbForm.stageId);

  const handleSaveNotebook = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim()) {
      showToast('يرجى إدخال عنوان المذكرة', 'error');
      return;
    }
    setSavingNb(true);
    try {
      const gradeObj = (selectedStageObj?.grades || []).find((g) => g.id === nbForm.gradeId);
      const payload = {
        title: nbForm.title.trim(),
        categoryId: nbForm.categoryId,
        stageId: nbForm.stageId,
        gradeId: nbForm.gradeId,
        gradeName: gradeObj?.name || nbForm.gradeName || '',
        subject: nbForm.subject.trim(),
        price: Number(nbForm.price) || 0,
        oldPrice: Number(nbForm.oldPrice) || 0,
        pagesCount: nbForm.pagesCount,
        description: nbForm.description,
        driveUrl: nbForm.driveUrl.trim(),
        coverImage: nbForm.coverImage || '',
        alertBadge: nbForm.alertBadge,
        alertText: nbForm.alertText,
        alertColor: nbForm.alertColor || 'amber',
        comingSoon: Boolean(nbForm.comingSoon),
        updatedAt: new Date().toISOString()
      };

      let targetId = editingNotebookId;
      if (editingNotebookId) {
        await setDoc(publicDoc('notebooks', editingNotebookId), payload, { merge: true });
      } else {
        payload.createdAt = new Date().toISOString();
        const ref = await addDoc(publicCol('notebooks'), payload);
        targetId = ref.id;
      }

      if (targetId) {
        await setDoc(
          publicDoc('notebook_samples', targetId),
          { pages: nbForm.samplePages || [] },
          { merge: true }
        );
      }

      // تحديث النسخة الاحتياطية المحلية للمذكرات والعينات فورًا
      try {
        const updatedList = editingNotebookId
          ? notebooks.map((item) => (item.id === editingNotebookId ? normalizeNotebook({ id: targetId, ...payload }) : item))
          : [normalizeNotebook({ id: targetId || `local_${Date.now()}`, ...payload }), ...notebooks];
        localStorage.setItem(LOCAL_NOTEBOOKS_KEY, JSON.stringify(updatedList));
        if (targetId) {
          const cachedSamples = JSON.parse(localStorage.getItem(LOCAL_SAMPLES_KEY) || '{}');
          cachedSamples[targetId] = nbForm.samplePages || [];
          localStorage.setItem(LOCAL_SAMPLES_KEY, JSON.stringify(cachedSamples));
        }
      } catch {
        // تجاهل امتلاء التخزين المحلي
      }

      showToast(editingNotebookId ? 'تم تحديث المذكرة بنجاح!' : 'تمت إضافة المذكرة بنجاح!');
      setEditingNotebookId(null);
      setNbForm({
        title: '',
        categoryId: localSettings.categories?.[0]?.id || 'term1',
        stageId: '',
        gradeId: '',
        gradeName: '',
        subject: '',
        price: '',
        oldPrice: '',
        pagesCount: '',
        description: '',
        driveUrl: '',
        coverImage: '',
        samplePages: [],
        alertBadge: '',
        alertText: '',
        alertColor: 'amber',
        comingSoon: false
      });
    } catch (err) {
      showToast(`خطأ أثناء حفظ المذكرة: ${err?.message || ''}`, 'error');
    } finally {
      setSavingNb(false);
    }
  };

  const handleSaveQuickEdits = async () => {
    const ids = Object.keys(quickEdits);
    if (ids.length === 0) return;
    try {
      for (const id of ids) {
        await updateDoc(publicDoc('notebooks', id), {
          ...quickEdits[id],
          price: Number(quickEdits[id].price) || 0,
          oldPrice: Number(quickEdits[id].oldPrice) || 0
        });
      }
      setQuickEdits({});
      showToast('تم حفظ التعديلات السريعة لجميع المذكرات!');
    } catch (err) {
      showToast(`تعذر الحفظ الجماعي: ${err?.message || ''}`, 'error');
    }
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;
    try {
      await addDoc(publicCol('coupons'), {
        code: couponForm.code.trim().toUpperCase(),
        type: couponForm.type,
        value: Number(couponForm.value) || 10,
        expiresAt: couponForm.expiresAt || '',
        singleUse: Boolean(couponForm.singleUse),
        used: false,
        active: true,
        createdAt: new Date().toISOString()
      });
      setCouponForm({ code: '', type: 'percent', value: 15, expiresAt: '', singleUse: false });
      showToast('تمت إضافة كوبون الخصم بنجاح!');
    } catch (err) {
      showToast(`خطأ: ${err?.message || ''}`, 'error');
    }
  };

  const handleAddBundle = async () => {
    if (!bundleForm.title.trim() || bundleForm.notebookIds.length === 0) {
      showToast('أدخل اسم الباقة واختر مذكرة واحدة على الأقل', 'error');
      return;
    }
    const newBundle = {
      id: `bnd_${Date.now()}`,
      title: bundleForm.title.trim(),
      description: bundleForm.description.trim(),
      price: Number(bundleForm.price) || 0,
      notebookIds: bundleForm.notebookIds
    };
    const updated = {
      ...localSettings,
      bundles: [...(localSettings.bundles || []), newBundle]
    };
    setLocalSettings(updated);
    await handleSaveAllSettings(updated);
    setBundleForm({ title: '', description: '', price: '', notebookIds: [] });
  };

  const manageCat = (localSettings.categories || []).find((c) => c.id === selectedCatId) || localSettings.categories?.[0];
  const manageStage = (manageCat?.stages || []).find((s) => s.id === selectedStageId) || manageCat?.stages?.[0];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* شريط الإدارة العلوي */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-base sm:text-lg">لوحة تحكم الإدارة — منصة العباقرة</h1>
            <p className="text-xs text-slate-300">تحكم كامل في المذكرات، الأقسام، الخصومات، والطلبات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={savingSettings}
            onClick={() => handleSaveAllSettings()}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow"
          >
            <Check className="w-4 h-4" />
            <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ كافة التغييرات'}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* أزرار التبويبات */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'notebooks', label: `المذكرات (${notebooks.length})`, icon: BookOpen },
          { id: 'categories', label: 'الأقسام والمراحل والصفوف', icon: Folder },
          { id: 'offers', label: 'الخصومات والعروض', icon: Percent },
          { id: 'orders', label: `الطلبات (${orders.length})`, icon: Package },
          { id: 'settings', label: 'إعدادات الموقع والمظهر', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shrink-0 transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* 1. تبويب المذكرات */}
      {/* ========================================== */}
      {activeTab === 'notebooks' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveNotebook} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {editingNotebookId ? 'تعديل بيانات المذكرة' : 'إضافة مذكرة جديدة للمنصة'}
              </h2>
              {editingNotebookId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingNotebookId(null);
                    setNbForm({
                      title: '',
                      categoryId: localSettings.categories?.[0]?.id || 'term1',
                      stageId: '',
                      gradeId: '',
                      gradeName: '',
                      subject: '',
                      price: '',
                      oldPrice: '',
                      pagesCount: '',
                      description: '',
                      driveUrl: '',
                      coverImage: '',
                      samplePages: [],
                      alertBadge: '',
                      alertText: '',
                      alertColor: 'amber',
                      comingSoon: false
                    });
                  }}
                  className="text-xs font-black text-rose-600 underline"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-black text-slate-700">عنوان المذكرة *</label>
                <input
                  type="text"
                  required
                  value={nbForm.title}
                  onChange={(e) => setNbForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="مثال: مذكرة العباقرة في اللغة العربية"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">القسم الرئيسي</label>
                <select
                  value={nbForm.categoryId}
                  onChange={(e) => setNbForm((p) => ({ ...p, categoryId: e.target.value, stageId: '', gradeId: '' }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                >
                  {(localSettings.categories || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">المرحلة الدراسية</label>
                <select
                  value={nbForm.stageId}
                  onChange={(e) => setNbForm((p) => ({ ...p, stageId: e.target.value, gradeId: '' }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                >
                  <option value="">اختر المرحلة...</option>
                  {(selectedCatObj?.stages || []).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">الصف الدراسي</label>
                <select
                  value={nbForm.gradeId}
                  onChange={(e) => {
                    const g = (selectedStageObj?.grades || []).find((x) => x.id === e.target.value);
                    setNbForm((p) => ({ ...p, gradeId: e.target.value, gradeName: g?.name || '' }));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                >
                  <option value="">اختر الصف...</option>
                  {(selectedStageObj?.grades || []).map((gr) => (
                    <option key={gr.id} value={gr.id}>
                      {gr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">المادة الدراسية</label>
                <input
                  type="text"
                  value={nbForm.subject}
                  onChange={(e) => setNbForm((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="مثال: اللغة العربية"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">السعر الحالي (ج.م) *</label>
                <input
                  type="number"
                  required
                  value={nbForm.price}
                  onChange={(e) => setNbForm((p) => ({ ...p, price: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">السعر قبل الخصم (اختياري)</label>
                <input
                  type="number"
                  value={nbForm.oldPrice}
                  onChange={(e) => setNbForm((p) => ({ ...p, oldPrice: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>
            </div>

            {/* الغلاف وصور العينات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="block text-xs font-black text-slate-800">صورة غلاف المذكرة</span>
                <div className="flex items-center gap-3">
                  {nbForm.coverImage && (
                    <img src={nbForm.coverImage} alt="" className="w-16 h-20 object-cover rounded-xl border" />
                  )}
                  <label className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer">
                    <span>اختيار صورة الغلاف</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const compressed = await compressImageFile(file, 900, 0.8);
                        setNbForm((p) => ({ ...p, coverImage: compressed }));
                      }}
                    />
                  </label>
                  {nbForm.coverImage && (
                    <button
                      type="button"
                      onClick={() => setNbForm((p) => ({ ...p, coverImage: '' }))}
                      className="text-xs text-rose-600 font-bold"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    صفحات العينة ({nbForm.samplePages.length} / 15)
                  </span>
                  <label className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black cursor-pointer">
                    <span>+ إضافة صفحات عينة</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []).slice(0, 15 - nbForm.samplePages.length);
                        const compressedList = await Promise.all(
                          files.map((f) => compressImageFile(f, 950, 0.75))
                        );
                        setNbForm((p) => ({
                          ...p,
                          samplePages: [...p.samplePages, ...compressedList].slice(0, 15)
                        }));
                      }}
                    />
                  </label>
                </div>
                {nbForm.samplePages.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pt-1">
                    {nbForm.samplePages.map((src, idx) => (
                      <div key={idx} className="relative w-12 h-14 shrink-0 rounded-lg overflow-hidden border">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setNbForm((p) => ({
                              ...p,
                              samplePages: p.samplePages.filter((_, i) => i !== idx)
                            }))
                          }
                          className="absolute top-0 right-0 bg-rose-600 text-white p-0.5 rounded-bl"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* التنبيه الخاص بالمذكرة ورابط Drive */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={nbForm.driveUrl}
                onChange={(e) => setNbForm((p) => ({ ...p, driveUrl: e.target.value }))}
                placeholder="رابط Google Drive للعينة (اختياري)"
                dir="ltr"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-left"
              />
              <input
                type="text"
                value={nbForm.alertBadge}
                onChange={(e) => setNbForm((p) => ({ ...p, alertBadge: e.target.value }))}
                placeholder="شارة التنبيه (مثال: تنويه هام)"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
              />
              <input
                type="text"
                value={nbForm.alertText}
                onChange={(e) => setNbForm((p) => ({ ...p, alertText: e.target.value }))}
                placeholder="نص التنبيه الخاص داخل المذكرة (اختياري)"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nbForm.comingSoon}
                  onChange={(e) => setNbForm((p) => ({ ...p, comingSoon: e.target.checked }))}
                />
                <span>وضع المذكرة كـ «قيد التجهيز / متاح للحجز المسبق»</span>
              </label>

              <button
                type="submit"
                disabled={savingNb}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow"
              >
                {savingNb ? 'جاري الحفظ...' : editingNotebookId ? 'حفظ تعديلات المذكرة' : 'نشر المذكرة الآن'}
              </button>
            </div>
          </form>

          {/* قائمة المذكرات والتعديل السريع */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-black text-slate-900">قائمة المذكرات المنشورة ({notebooks.length})</h3>
              {Object.keys(quickEdits).length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveQuickEdits}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black shadow"
                >
                  حفظ التعديلات السريعة ({Object.keys(quickEdits).length})
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {notebooks.map((nb) => {
                const q = quickEdits[nb.id] || {};
                return (
                  <div
                    key={nb.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {nb.coverImage ? (
                        <img src={nb.coverImage} alt="" className="w-11 h-14 object-cover rounded-xl border shrink-0" />
                      ) : (
                        <div className="w-11 h-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <input
                          type="text"
                          value={q.title !== undefined ? q.title : nb.title}
                          onChange={(e) =>
                            setQuickEdits((p) => ({
                              ...p,
                              [nb.id]: { ...nb, ...p[nb.id], title: e.target.value }
                            }))
                          }
                          className="w-full px-2.5 py-1 rounded-lg border bg-white text-xs font-black"
                        />
                        <p className="text-[11px] font-bold text-slate-500">
                          {nb.gradeName} {nb.subject ? `• ${nb.subject}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={q.price !== undefined ? q.price : nb.price}
                        onChange={(e) =>
                          setQuickEdits((p) => ({
                            ...p,
                            [nb.id]: { ...nb, ...p[nb.id], price: e.target.value }
                          }))
                        }
                        className="w-20 px-2.5 py-1.5 rounded-lg border bg-white text-xs font-black text-center"
                        title="السعر"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          setEditingNotebookId(nb.id);
                          let pages = (samplesMap?.[nb.id]?.length ? samplesMap[nb.id] : nb.samplePages) || [];
                          if (pages.length === 0) {
                            try {
                              const s = await getDoc(publicDoc('notebook_samples', nb.id));
                              if (s.exists()) {
                                const d = s.data();
                                pages = d.pages || d.samples || d.images || [];
                              }
                            } catch {
                              // تجاهل
                            }
                          }
                          setNbForm({
                            title: nb.title || '',
                            categoryId: nb.categoryId || 'term1',
                            stageId: nb.stageId || '',
                            gradeId: nb.gradeId || '',
                            gradeName: nb.gradeName || '',
                            subject: nb.subject || '',
                            price: nb.price || '',
                            oldPrice: nb.oldPrice || '',
                            pagesCount: nb.pagesCount || '',
                            description: nb.description || '',
                            driveUrl: nb.driveUrl || '',
                            coverImage: nb.coverImage || '',
                            samplePages: pages,
                            alertBadge: nb.alertBadge || '',
                            alertText: nb.alertText || '',
                            alertColor: nb.alertColor || 'amber',
                            comingSoon: Boolean(nb.comingSoon)
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700"
                        title="تعديل كامل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteDoc(publicDoc('notebooks', nb.id));
                          showToast('تم حذف المذكرة');
                        }}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
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

      {/* ========================================== */}
      {/* 2. تبويب الأقسام والمراحل والصفوف */}
      {/* ========================================== */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-lg font-black text-slate-900">إدارة الأقسام الرئيسية وصورها والمراحل الدراسية</h2>

          {/* إضافة قسم رئيسي */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="اسم القسم الجديد (مثال: مراجعات نهائية)"
              className="flex-1 min-w-[220px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
            />
            <button
              type="button"
              onClick={() => {
                if (!newCatName.trim()) return;
                const newId = `cat_${Date.now()}`;
                setLocalSettings((p) => ({
                  ...p,
                  categories: [
                    ...(p.categories || []),
                    { id: newId, name: newCatName.trim(), description: 'تصفح المراحل والصفوف الدراسية', stages: [] }
                  ]
                }));
                setSelectedCatId(newId);
                setNewCatName('');
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black"
            >
              + إضافة قسم
            </button>
          </div>

          {/* بطاقات الأقسام وصورها */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(localSettings.categories || []).map((cat) => {
              const catImg = localSettings.categoryImages?.[cat.id] || '';
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition space-y-3 ${
                    manageCat?.id === cat.id ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={cat.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setLocalSettings((p) => ({
                          ...p,
                          categories: p.categories.map((c) => (c.id === cat.id ? { ...c, name: e.target.value } : c))
                        }))
                      }
                      className="font-black text-xs sm:text-sm bg-white px-2.5 py-1.5 rounded-lg border flex-1"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocalSettings((p) => ({
                          ...p,
                          categories: p.categories.filter((c) => c.id !== cat.id)
                        }));
                      }}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {catImg && <img src={catImg} alt="" className="w-full h-24 object-cover rounded-xl border" />}

                  <div className="flex items-center justify-between">
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-black cursor-pointer"
                    >
                      <span>{catImg ? 'تغيير صورة القسم' : 'رفع صورة للقسم'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const compressed = await compressImageFile(file, 800, 0.78);
                          setLocalSettings((p) => ({
                            ...p,
                            categoryImages: { ...(p.categoryImages || {}), [cat.id]: compressed }
                          }));
                        }}
                      />
                    </label>
                    {catImg && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalSettings((p) => {
                            const copy = { ...(p.categoryImages || {}) };
                            delete copy[cat.id];
                            return { ...p, categoryImages: copy };
                          });
                        }}
                        className="text-[11px] font-bold text-rose-600"
                      >
                        حذف الصورة
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* إدارة المراحل والصفوف داخل القسم المحدد */}
          {manageCat && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="font-black text-sm text-blue-800">المراحل والصفوف داخل: {manageCat.name}</h3>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="اسم المرحلة (مثال: المرحلة الابتدائية)"
                  className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border bg-white text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newStageName.trim()) return;
                    const stId = `stg_${Date.now()}`;
                    setLocalSettings((p) => ({
                      ...p,
                      categories: p.categories.map((c) =>
                        c.id === manageCat.id
                          ? { ...c, stages: [...(c.stages || []), { id: stId, name: newStageName.trim(), grades: [] }] }
                          : c
                      )
                    }));
                    setSelectedStageId(stId);
                    setNewStageName('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black"
                >
                  + إضافة مرحلة
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(manageCat.stages || []).map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStageId(st.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer flex items-center gap-2 border ${
                      manageStage?.id === st.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{st.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocalSettings((p) => ({
                          ...p,
                          categories: p.categories.map((c) =>
                            c.id === manageCat.id
                              ? { ...c, stages: c.stages.filter((x) => x.id !== st.id) }
                              : c
                          )
                        }));
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {manageStage && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newGradeName}
                      onChange={(e) => setNewGradeName(e.target.value)}
                      placeholder={`أضف صفًا دراسيًا داخل ${manageStage.name}...`}
                      className="flex-1 px-3 py-2 rounded-xl border bg-white text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newGradeName.trim()) return;
                        setLocalSettings((p) => ({
                          ...p,
                          categories: p.categories.map((c) =>
                            c.id === manageCat.id
                              ? {
                                  ...c,
                                  stages: c.stages.map((st) =>
                                    st.id === manageStage.id
                                      ? {
                                          ...st,
                                          grades: [
                                            ...(st.grades || []),
                                            { id: `grd_${Date.now()}`, name: newGradeName.trim(), subjects: [] }
                                          ]
                                        }
                                      : st
                                  )
                                }
                              : c
                          )
                        }));
                        setNewGradeName('');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black"
                    >
                      + إضافة صف
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(manageStage.grades || []).map((gr) => (
                      <span
                        key={gr.id}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold flex items-center gap-2"
                      >
                        <span>{gr.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setLocalSettings((p) => ({
                              ...p,
                              categories: p.categories.map((c) =>
                                c.id === manageCat.id
                                  ? {
                                      ...c,
                                      stages: c.stages.map((st) =>
                                        st.id === manageStage.id
                                          ? { ...st, grades: st.grades.filter((g) => g.id !== gr.id) }
                                          : st
                                      )
                                    }
                                  : c
                              )
                            }))
                          }
                          className="text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSaveAllSettings()}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow"
          >
            حفظ الأقسام والمراحل والصفوف
          </button>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. تبويب الخصومات والعروض */}
      {/* ========================================== */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          {/* الشريط الترويجي العلوي */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">1. الشريط الترويجي العلوي وكود النسخ</h2>
              <label className="flex items-center gap-2 text-xs font-black">
                <input
                  type="checkbox"
                  checked={localSettings.promoBannerEnabled !== false}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, promoBannerEnabled: e.target.checked }))}
                />
                <span>تفعيل الشريط</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={localSettings.promoBannerText || ''}
                onChange={(e) => setLocalSettings((p) => ({ ...p, promoBannerText: e.target.value }))}
                placeholder="نص الإعلان الترويجي..."
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold"
              />
              <select
                value={localSettings.promoBannerColor || 'blue'}
                onChange={(e) => setLocalSettings((p) => ({ ...p, promoBannerColor: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border text-xs font-bold"
              >
                <option value="blue">أزرق ملكي</option>
                <option value="navy">كحلي داكن</option>
                <option value="emerald">أخضر زمردي</option>
                <option value="crimson">أحمر ياقوتي</option>
                <option value="purple">بنفسجي ملكي</option>
              </select>
              <input
                type="text"
                value={localSettings.promoBannerCoupon || ''}
                onChange={(e) => setLocalSettings((p) => ({ ...p, promoBannerCoupon: e.target.value.toUpperCase() }))}
                placeholder="كود الكوبون في الشريط (مثال: M20)"
                className="px-3.5 py-2.5 rounded-xl border text-xs font-black uppercase"
              />
              <input
                type="text"
                value={localSettings.promoBannerCopyLabel || ''}
                onChange={(e) => setLocalSettings((p) => ({ ...p, promoBannerCopyLabel: e.target.value }))}
                placeholder="نص زر النسخ (مثال: انسخ الكوبون:)"
                className="px-3.5 py-2.5 rounded-xl border text-xs font-bold"
              />
            </div>
          </div>

          {/* كوبون مكافأة الطلب القادم */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">2. كوبون مكافأة الطلب القادم (يظهر بعد إتمام الطلب)</h2>
              <label className="flex items-center gap-2 text-xs font-black">
                <input
                  type="checkbox"
                  checked={localSettings.nextOrderRewardEnabled !== false}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardEnabled: e.target.checked }))}
                />
                <span>تفعيل المكافأة</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={localSettings.nextOrderRewardMode || 'auto'}
                onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardMode: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border text-xs font-bold"
              >
                <option value="auto">كود تلقائي فريد لمرة واحدة</option>
                <option value="fixed">كود ثابت من اختيارك</option>
              </select>
              {localSettings.nextOrderRewardMode === 'fixed' && (
                <input
                  type="text"
                  value={localSettings.nextOrderRewardCustomCode || ''}
                  onChange={(e) =>
                    setLocalSettings((p) => ({ ...p, nextOrderRewardCustomCode: e.target.value.toUpperCase() }))
                  }
                  placeholder="الكود الثابت (مثال: VIP15)"
                  className="px-3 py-2.5 rounded-xl border text-xs font-black uppercase"
                />
              )}
              <select
                value={localSettings.nextOrderRewardType || 'percent'}
                onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardType: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border text-xs font-bold"
              >
                <option value="percent">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (ج.م)</option>
              </select>
              <input
                type="number"
                value={localSettings.nextOrderRewardValue || 15}
                onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardValue: Number(e.target.value) }))}
                placeholder="قيمة الخصم"
                className="px-3 py-2.5 rounded-xl border text-xs font-black"
              />
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">مدة الصلاحية بالأيام (0 = مفتوح)</label>
                <input
                  type="number"
                  min={0}
                  value={localSettings.nextOrderRewardValidDays ?? 7}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardValidDays: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-black"
                />
              </div>
              <input
                type="text"
                value={localSettings.nextOrderRewardTitle || ''}
                onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardTitle: e.target.value }))}
                placeholder="عنوان المكافأة"
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold"
              />
              <input
                type="text"
                value={localSettings.nextOrderRewardMessage || ''}
                onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardMessage: e.target.value }))}
                placeholder="رسالة المكافأة للعميل"
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSaveAllSettings()}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow"
            >
              حفظ إعدادات الشريط الترويجي ومكافأة الطلب القادم
            </button>
          </div>

          {/* باقات التوفير المجمعة */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-900">3. باقات التوفير ومجموعات المذكرات</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={bundleForm.title}
                onChange={(e) => setBundleForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="اسم الباقة (مثال: باقة المرحلة الإعدادية كاملة)"
                className="px-3.5 py-2.5 rounded-xl border text-xs font-bold"
              />
              <input
                type="number"
                value={bundleForm.price}
                onChange={(e) => setBundleForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="سعر الباقة النهائي (ج.م)"
                className="px-3.5 py-2.5 rounded-xl border text-xs font-black"
              />
              <input
                type="text"
                value={bundleForm.description}
                onChange={(e) => setBundleForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف مختصر للباقة"
                className="px-3.5 py-2.5 rounded-xl border text-xs font-bold"
              />
            </div>

            <div className="max-h-40 overflow-y-auto p-3 rounded-2xl bg-slate-50 border grid grid-cols-1 sm:grid-cols-2 gap-2">
              {notebooks.map((nb) => {
                const checked = bundleForm.notebookIds.includes(nb.id);
                return (
                  <label key={nb.id} className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setBundleForm((p) => ({
                          ...p,
                          notebookIds: e.target.checked
                            ? [...p.notebookIds, nb.id]
                            : p.notebookIds.filter((id) => id !== nb.id)
                        }))
                      }
                    />
                    <span className="truncate">
                      {nb.title} ({nb.price} ج.م)
                    </span>
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddBundle}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black"
            >
              + إضافة الباقة وحفظها
            </button>

            <div className="space-y-2">
              {(localSettings.bundles || []).map((bnd) => (
                <div key={bnd.id} className="p-3 rounded-2xl bg-slate-50 border flex items-center justify-between">
                  <div>
                    <p className="font-black text-xs sm:text-sm">{bnd.title}</p>
                    <p className="text-xs font-bold text-indigo-700">
                      السعر: {bnd.price} ج.م • عدد المذكرات: {bnd.notebookIds?.length || 0}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const updated = {
                        ...localSettings,
                        bundles: localSettings.bundles.filter((x) => x.id !== bnd.id)
                      };
                      setLocalSettings(updated);
                      await handleSaveAllSettings(updated);
                    }}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* كوبونات الخصم الترويجية */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-900">4. كوبونات الخصم الترويجية (مع تحديد المدة)</h2>
            <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">كود الكوبون</label>
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="مثال: OPEN20"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-black uppercase"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">نوع الخصم</label>
                <select
                  value={couponForm.type}
                  onChange={(e) => setCouponForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
                >
                  <option value="percent">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (ج.م)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">القيمة</label>
                <input
                  type="number"
                  required
                  value={couponForm.value}
                  onChange={(e) => setCouponForm((p) => ({ ...p, value: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-black"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">تاريخ الانتهاء (اختياري)</label>
                <input
                  type="datetime-local"
                  value={couponForm.expiresAt}
                  onChange={(e) => setCouponForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black"
              >
                + إضافة الكوبون
              </button>
            </form>

            <div className="space-y-2">
              {coupons.map((cp) => {
                const expired = isCouponExpired(cp);
                return (
                  <div key={cp.id} className="p-3 rounded-2xl bg-slate-50 border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-800 font-black text-xs">{cp.code}</span>
                      <span className="text-xs font-bold text-slate-700">
                        خصم {cp.value}
                        {cp.type === 'percent' ? '%' : ' ج.م'}
                      </span>
                      {cp.expiresAt && (
                        <span className="text-[11px] font-bold text-slate-500">
                          • ينتهي: {formatExpiryArabic(cp.expiresAt)}
                        </span>
                      )}
                      {expired && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black">
                          منتهي
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteDoc(publicDoc('coupons', cp.id));
                        showToast('تم حذف الكوبون');
                      }}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. تبويب الطلبات */}
      {/* ========================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900">طلبات العملاء الواردة ({orders.length})</h2>
          {orders.length === 0 ? (
            <p className="text-xs font-bold text-slate-500 py-8 text-center">لا توجد طلبات مسجلة بعد</p>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-black">
                        {ord.orderCode}
                      </span>
                      <span className="font-black text-sm text-slate-900">{ord.teacherName}</span>
                      {ord.whatsapp && (
                        <span className="text-xs font-bold text-emerald-700" dir="ltr">
                          {ord.whatsapp}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={ord.status || 'تم الاستلام'}
                        onChange={async (e) => {
                          await updateDoc(publicDoc('orders', ord.id), { status: e.target.value });
                          showToast('تم تحديث حالة الطلب');
                        }}
                        className="px-3 py-1.5 rounded-xl border bg-white text-xs font-black"
                      >
                        <option value="تم الاستلام">تم الاستلام</option>
                        <option value="جاري التجهيز">جاري التجهيز</option>
                        <option value="مكتمل">مكتمل</option>
                      </select>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteDoc(publicDoc('orders', ord.id));
                          showToast('تم حذف الطلب');
                        }}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-600">
                    المطلوب: {(ord.items || []).map((i) => i.title).join(' • ')} — الإجمالي:{' '}
                    <span className="text-blue-700 font-black">{ord.total} ج.م</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 5. تبويب إعدادات الموقع والمظهر */}
      {/* ========================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* الهوية والشعار والخلفية */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-slate-900">الهوية والشعار والواجهة الرئيسية</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(localSettings, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `el3bakera-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير نسخة JSON</span>
                </button>
                <label className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>استعادة JSON</span>
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async (ev) => {
                        try {
                          const parsed = JSON.parse(ev.target.result);
                          const restored = mergeAndNormalizeSettings(localSettings, parsed);
                          setLocalSettings(restored);
                          await handleSaveAllSettings(restored);
                          showToast('تمت استعادة النسخة الاحتياطية بنجاح!');
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={localSettings.siteName || ''}
                onChange={(e) => setLocalSettings((p) => ({ ...p, siteName: e.target.value }))}
                placeholder="اسم المنصة"
                className="px-3.5 py-2.5 rounded-xl border text-xs font-bold"
              />
              <input
                type="text"
                value={localSettings.siteTagline || ''}
                onChange={(e) => setLocalSettings((p) => ({ ...p, siteTagline: e.target.value }))}
                placeholder="الوصف المختصر أسفل الاسم"
                className="px-3.5 py-2.5 rounded-xl border text-xs font-bold"
              />
              <input
                type="text"
                value={localSettings.whatsappNumber || ''}
                onChange={(e) => setLocalSettings((p) => ({ ...p, whatsappNumber: e.target.value }))}
                placeholder="رقم واتساب استقبال الطلبات (مثال: 2010xxxxxxxx)"
                dir="ltr"
                className="px-3.5 py-2.5 rounded-xl border text-xs font-bold text-left"
              />
              <input
                type="text"
                value={localSettings.heroBadge || ''}
                onChange={(e) => setLocalSettings((p) => ({ ...p, heroBadge: e.target.value }))}
                placeholder="الشارة الذهبية أعلى العنوان"
                className="px-3.5 py-2.5 rounded-xl border text-xs font-bold"
              />
              <input
                type="text"
                value={localSettings.heroTitle || ''}
                onChange={(e) => setLocalSettings((p) => ({ ...p, heroTitle: e.target.value }))}
                placeholder="العنوان الرئيسي في الواجهة"
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold"
              />
              <textarea
                rows={2}
                value={localSettings.heroSubtitle || ''}
                onChange={(e) => setLocalSettings((p) => ({ ...p, heroSubtitle: e.target.value }))}
                placeholder="النص التعريفي في الواجهة الرئيسية"
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* الشعار */}
              <div className="p-4 rounded-2xl bg-slate-50 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">شعار المنصة (Logo)</span>
                  <span className="text-xs font-bold text-slate-500">الحجم: {localSettings.logoSize || 48}px</span>
                </div>
                <input
                  type="range"
                  min={32}
                  max={84}
                  value={localSettings.logoSize || 48}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, logoSize: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex items-center gap-3">
                  {localSettings.logoUrl && (
                    <img src={localSettings.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border" />
                  )}
                  <label className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer">
                    <span>رفع شعار</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const compressed = await compressImageFile(file, 400, 0.85);
                        setLocalSettings((p) => ({ ...p, logoUrl: compressed }));
                      }}
                    />
                  </label>
                  {localSettings.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLocalSettings((p) => ({ ...p, logoUrl: '' }))}
                      className="text-xs text-rose-600 font-bold"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>

              {/* خلفية الواجهة */}
              <div className="p-4 rounded-2xl bg-slate-50 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">صورة خلفية الواجهة الرئيسية</span>
                  <span className="text-xs font-bold text-slate-500">
                    الشفافية: {Math.round((localSettings.heroBgOpacity ?? 0.28) * 100)}% • الارتفاع:{' '}
                    {localSettings.heroMinHeight || 440}px
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.85}
                  step={0.05}
                  value={localSettings.heroBgOpacity ?? 0.28}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, heroBgOpacity: Number(e.target.value) }))}
                  className="w-full"
                />
                <input
                  type="range"
                  min={320}
                  max={680}
                  step={20}
                  value={localSettings.heroMinHeight || 440}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, heroMinHeight: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex items-center gap-3">
                  <label className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black cursor-pointer">
                    <span>رفع صورة خلفية</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const compressed = await compressImageFile(file, 1400, 0.78);
                        setLocalSettings((p) => ({ ...p, heroBgImage: compressed }));
                      }}
                    />
                  </label>
                  {localSettings.heroBgImage && (
                    <button
                      type="button"
                      onClick={() => setLocalSettings((p) => ({ ...p, heroBgImage: '' }))}
                      className="text-xs text-rose-600 font-bold"
                    >
                      حذف الخلفية
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* قسم ما الجديد؟ */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">قسم «ما الجديد؟»</h3>
              <label className="flex items-center gap-2 text-xs font-black">
                <input
                  type="checkbox"
                  checked={localSettings.whatsNewEnabled !== false}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, whatsNewEnabled: e.target.checked }))}
                />
                <span>إظهار القسم</span>
              </label>
            </div>
            <input
              type="text"
              value={localSettings.whatsNewTitle || ''}
              onChange={(e) => setLocalSettings((p) => ({ ...p, whatsNewTitle: e.target.value }))}
              className="w-full px-3.5 py-2 rounded-xl border text-xs font-bold"
            />
            <select
              value={localSettings.whatsNewMode || 'auto'}
              onChange={(e) => setLocalSettings((p) => ({ ...p, whatsNewMode: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
            >
              <option value="auto">تلقائي (أحدث المذكرات المضافة)</option>
              <option value="manual">اختيار يدوي للمذكرات</option>
            </select>
            {localSettings.whatsNewMode === 'manual' ? (
              <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-50 border">
                {notebooks.map((nb) => {
                  const checked = (localSettings.whatsNewManualIds || []).includes(nb.id);
                  return (
                    <label key={nb.id} className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...(localSettings.whatsNewManualIds || []), nb.id]
                            : (localSettings.whatsNewManualIds || []).filter((id) => id !== nb.id);
                          setLocalSettings((p) => ({ ...p, whatsNewManualIds: next }));
                        }}
                      />
                      <span className="truncate">{nb.title}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>عدد المذكرات المعروضة:</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={localSettings.whatsNewCount || 4}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, whatsNewCount: Number(e.target.value) }))}
                  className="w-20 px-2 py-1 rounded-lg border text-center font-black"
                />
              </div>
            )}
          </div>

          {/* قسم الأخبار والمذكرات قيد التجهيز */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">قسم الأخبار والإعلانات والمذكرات قيد التجهيز</h3>
              <button
                type="button"
                onClick={() =>
                  setLocalSettings((p) => ({
                    ...p,
                    newsItems: [
                      ...(p.newsItems || []),
                      { id: `news_${Date.now()}`, badge: 'إعلان جديد', title: 'عنوان الخبر', body: 'تفاصيل الخبر...' }
                    ]
                  }))
                }
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black"
              >
                + إضافة خبر
              </button>
            </div>
            <div className="space-y-2">
              {(localSettings.newsItems || []).map((nw, idx) => (
                <div key={nw.id || idx} className="p-3 rounded-2xl bg-slate-50 border space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nw.badge}
                      onChange={(e) =>
                        setLocalSettings((p) => ({
                          ...p,
                          newsItems: p.newsItems.map((it, i) => (i === idx ? { ...it, badge: e.target.value } : it))
                        }))
                      }
                      className="w-32 px-2.5 py-1 rounded-lg border bg-white text-xs font-black"
                    />
                    <input
                      type="text"
                      value={nw.title}
                      onChange={(e) =>
                        setLocalSettings((p) => ({
                          ...p,
                          newsItems: p.newsItems.map((it, i) => (i === idx ? { ...it, title: e.target.value } : it))
                        }))
                      }
                      className="flex-1 px-2.5 py-1 rounded-lg border bg-white text-xs font-black"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings((p) => ({
                          ...p,
                          newsItems: p.newsItems.filter((_, i) => i !== idx)
                        }))
                      }
                      className="text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={nw.body}
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        newsItems: p.newsItems.map((it, i) => (i === idx ? { ...it, body: e.target.value } : it))
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border bg-white text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* حقول نموذج طلب العميل */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-black text-base">حقول بيانات العميل داخل سلة الطلبات</h3>
            <div className="space-y-2">
              {(localSettings.customerFields || DEFAULT_CUSTOMER_FIELDS).map((fld, idx) => (
                <div
                  key={fld.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border text-xs font-bold"
                >
                  <span>{fld.label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() =>
                        setLocalSettings((p) => {
                          const arr = [...p.customerFields];
                          [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                          return { ...p, customerFields: arr.map((item, i) => ({ ...item, order: i + 1 })) };
                        })
                      }
                      className="p-1 rounded bg-white border disabled:opacity-40"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (localSettings.customerFields || DEFAULT_CUSTOMER_FIELDS).length - 1}
                      onClick={() =>
                        setLocalSettings((p) => {
                          const arr = [...p.customerFields];
                          [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                          return { ...p, customerFields: arr.map((item, i) => ({ ...item, order: i + 1 })) };
                        })
                      }
                      className="p-1 rounded bg-white border disabled:opacity-40"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={fld.enabled !== false}
                        onChange={(e) =>
                          setLocalSettings((p) => ({
                            ...p,
                            customerFields: p.customerFields.map((it, i) =>
                              i === idx ? { ...it, enabled: e.target.checked } : it
                            )
                          }))
                        }
                      />
                      <span>مفعّل</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={Boolean(fld.required)}
                        onChange={(e) =>
                          setLocalSettings((p) => ({
                            ...p,
                            customerFields: p.customerFields.map((it, i) =>
                              i === idx ? { ...it, required: e.target.checked } : it
                            )
                          }))
                        }
                      />
                      <span>إلزامي</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSaveAllSettings()}
            className="px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg"
          >
            حفظ جميع إعدادات الموقع والمظهر
          </button>

          {/* روابط التواصل الاجتماعي */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">قنوات التواصل الاجتماعي (نافذة تواصل معنا)</h3>
              <button
                type="button"
                onClick={() =>
                  setLocalSettings((p) => ({
                    ...p,
                    socialLinks: [...(p.socialLinks || []), { id: `soc_${Date.now()}`, label: 'رابط تواصل جديد', url: 'https://' }]
                  }))
                }
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black"
              >
                + إضافة رابط
              </button>
            </div>
            <div className="space-y-2">
              {(localSettings.socialLinks || []).map((lk, idx) => (
                <div
                  key={lk.id || idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border"
                >
                  <input
                    type="text"
                    value={lk.label}
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        socialLinks: p.socialLinks.map((item, i) => (i === idx ? { ...item, label: e.target.value } : item))
                      }))
                    }
                    className="sm:col-span-5 px-3 py-1.5 rounded-lg border text-xs font-bold bg-white"
                  />
                  <input
                    type="text"
                    value={lk.url}
                    dir="ltr"
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        socialLinks: p.socialLinks.map((item, i) => (i === idx ? { ...item, url: e.target.value } : item))
                      }))
                    }
                    className="sm:col-span-6 px-3 py-1.5 rounded-lg border text-xs bg-white text-left"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings((p) => ({
                        ...p,
                        socialLinks: p.socialLinks.filter((_, i) => i !== idx)
                      }))
                    }
                    className="sm:col-span-1 text-red-600 flex justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 8. التطبيق الرئيسي للمنصة
// ==========================================
function MuzakkiratiApp() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [notebooks, setNotebooks] = useState([]);
  const [samplesMap, setSamplesMap] = useState({});
  const [coupons, setCoupons] = useState([]);
  const [orders, setOrders] = useState([]);

  const [activePage, setActivePage] = useState('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [selectedGradeId, setSelectedGradeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState(ADMIN_EMAIL);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);

  const [toast, setToast] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [promoCopied, setPromoCopied] = useState(false);
  const logoClickCountRef = useRef(0);

  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackNotFound, setTrackNotFound] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // الاستماع لبيانات Firebase
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (cached) {
        setSettings((prev) => mergeAndNormalizeSettings(prev, JSON.parse(cached)));
      }
      const cachedNbs = localStorage.getItem(LOCAL_NOTEBOOKS_KEY);
      if (cachedNbs) {
        const parsedNbs = JSON.parse(cachedNbs);
        if (Array.isArray(parsedNbs) && parsedNbs.length > 0) {
          setNotebooks(parsedNbs.map(normalizeNotebook));
        }
      }
      const cachedSmp = localStorage.getItem(LOCAL_SAMPLES_KEY);
      if (cachedSmp) {
        const parsedSmp = JSON.parse(cachedSmp);
        if (parsedSmp && typeof parsedSmp === 'object') {
          setSamplesMap(parsedSmp);
        }
      }
    } catch {
      // تجاهل
    }

    if (!db || !auth) return undefined;

    const handleSnapError = (err) => {
      console.warn('Firestore listener notice:', err?.code || err?.message);
    };

    const unsubscribers = [];

    try {
      unsubscribers.push(
        onSnapshot(
          publicDoc('settings', 'main'),
          (snap) => {
            if (snap.exists()) {
              setSettings((prev) => mergeAndNormalizeSettings(prev, snap.data()));
            }
          },
          handleSnapError
        )
      );

      unsubscribers.push(
        onSnapshot(
          publicDoc('settings', 'media_assets'),
          (snap) => {
            if (snap.exists()) {
              setSettings((prev) => mergeAndNormalizeSettings(prev, snap.data()));
            }
          },
          handleSnapError
        )
      );

      unsubscribers.push(
        onSnapshot(
          publicCol('notebooks'),
          (snap) => {
            const list = snap.docs.map((d) => normalizeNotebook({ id: d.id, ...d.data() }));
            if (list.length > 0 || !snap.metadata.fromCache) {
              setNotebooks(list);
              try {
                localStorage.setItem(LOCAL_NOTEBOOKS_KEY, JSON.stringify(list));
              } catch {
                // تجاهل
              }
            }
          },
          handleSnapError
        )
      );

      unsubscribers.push(
        onSnapshot(
          publicCol('notebook_samples'),
          (snap) => {
            const map = {};
            snap.docs.forEach((d) => {
              const data = d.data() || {};
              const arr =
                (Array.isArray(data.pages) && data.pages) ||
                (Array.isArray(data.samples) && data.samples) ||
                (Array.isArray(data.images) && data.images) ||
                [];
              const cleaned = arr.map((it) => (typeof it === 'string' ? it : it?.url || it?.src || '')).filter(Boolean);
              if (cleaned.length > 0) {
                map[d.id] = cleaned;
              }
            });
            if (Object.keys(map).length > 0) {
              setSamplesMap((prev) => {
                const merged = { ...prev, ...map };
                try {
                  localStorage.setItem(LOCAL_SAMPLES_KEY, JSON.stringify(merged));
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
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
            setOrders(list);
          },
          handleSnapError
        )
      );

      unsubscribers.push(
        onAuthStateChanged(
          auth,
          (user) => {
            if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
              setIsAdmin(true);
            }
          },
          handleSnapError
        )
      );
    } catch (subErr) {
      console.warn('Firestore subscription setup skipped:', subErr);
    }

    return () => {
      unsubscribers.forEach((unsub) => {
        try {
          if (typeof unsub === 'function') unsub();
        } catch {
          // تجاهل
        }
      });
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigateTo = (page, catId = null, stageId = null, gradeId = null) => {
    setActivePage(page);
    setSelectedCategoryId(catId);
    setSelectedStageId(stageId);
    setSelectedGradeId(gradeId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (nb) => {
    setCart((prev) => {
      if (prev.some((item) => item.id === nb.id)) {
        showToast('المذكرة موجودة بالفعل في السلة');
        return prev;
      }
      showToast('تمت إضافة المذكرة إلى السلة بنجاح');
      return [...prev, { id: nb.id, title: nb.title, gradeName: nb.gradeName, price: nb.price, isBundle: false }];
    });
  };

  const handleAddBundleToCart = (bnd) => {
    setCart((prev) => {
      if (prev.some((item) => item.id === bnd.id)) {
        showToast('الباقة موجودة بالفعل في السلة');
        return prev;
      }
      const included = (bnd.notebookIds || [])
        .map((id) => notebooks.find((n) => n.id === id))
        .filter(Boolean)
        .map((n) => ({ id: n.id, title: n.title }));
      showToast('تمت إضافة الباقة المجمعة إلى السلة');
      return [
        ...prev,
        {
          id: bnd.id,
          title: bnd.title,
          price: Number(bnd.price) || 0,
          isBundle: true,
          bundleItems: included
        }
      ];
    });
  };

  const handleAdminEmailLogin = async (e) => {
    e.preventDefault();
    setAdminLoginError('');
    setAdminLoggingIn(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, adminEmailInput.trim(), adminPasswordInput);
      if (cred.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setActivePage('admin');
        showToast('مرحبًا بك في لوحة التحكم!');
      } else {
        setAdminLoginError('هذا الحساب غير مصرح له بالدخول للإدارة');
      }
    } catch (err) {
      const msg = `${err?.code || ''} ${err?.message || ''}`;
      if (
        (msg.includes('api-key') || msg.includes('network-request-failed')) &&
        adminEmailInput.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
      ) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setActivePage('admin');
        showToast('تم فتح لوحة التحكم في وضع المعاينة!');
      } else {
        setAdminLoginError(`تعذر تسجيل الدخول (${err?.code || 'تحقق من البيانات'})`);
      }
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setAdminLoginError('');
    setAdminLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      if (cred.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setActivePage('admin');
        showToast('تم تسجيل الدخول بحساب Google بنجاح!');
      } else {
        setAdminLoginError('يرجى اختيار البريد الإداري المصرح له');
      }
    } catch (err) {
      const msg = `${err?.code || ''} ${err?.message || ''}`;
      if (msg.includes('api-key') || msg.includes('popup')) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setActivePage('admin');
        showToast('تم فتح لوحة التحكم في وضع المعاينة!');
      } else {
        setAdminLoginError(`تعذر الدخول عبر Google (${err?.code || ''})`);
      }
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const cartIds = useMemo(() => new Set(cart.map((c) => c.id)), [cart]);

  const whatsNewList = useMemo(() => {
    if (settings.whatsNewMode === 'manual' && Array.isArray(settings.whatsNewManualIds)) {
      return settings.whatsNewManualIds.map((id) => notebooks.find((n) => n.id === id)).filter(Boolean);
    }
    return [...notebooks]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, Number(settings.whatsNewCount) || 4);
  }, [notebooks, settings]);

  const promoColors = {
    blue: 'bg-blue-700',
    navy: 'bg-slate-900',
    emerald: 'bg-emerald-700',
    crimson: 'bg-rose-700',
    purple: 'bg-purple-700'
  };

  const activeCategory = (settings.categories || []).find((c) => c.id === selectedCategoryId);
  const activeStage = (activeCategory?.stages || []).find((s) => s.id === selectedStageId);
  const activeGrade = (activeStage?.grades || []).find((g) => g.id === selectedGradeId);

  const filteredNotebooks = useMemo(() => {
    return notebooks.filter((nb) => {
      if (selectedCategoryId && nb.categoryId !== selectedCategoryId) return false;
      if (selectedStageId && nb.stageId !== selectedStageId) return false;
      if (selectedGradeId && nb.gradeId !== selectedGradeId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${nb.title} ${nb.gradeName} ${nb.subject}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notebooks, selectedCategoryId, selectedStageId, selectedGradeId, searchQuery]);

  const visibleCoupons = useMemo(() => {
    return coupons.filter((c) => c.active !== false && !c.singleUse && !isCouponExpired(c));
  }, [coupons]);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* إشعار عائم */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-xs sm:text-sm font-black flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* الشريط العلوي المثبت (الشريط الترويجي + الهيدر) */}
      <header className="sticky top-0 z-40 shadow-sm">
        {settings.promoBannerEnabled !== false && !promoDismissed && (!isScrolled || window.innerWidth >= 640) && (
          <div
            className={`${
              promoColors[settings.promoBannerColor] || 'bg-blue-700'
            } text-white px-3 py-1.5 text-[11px] sm:text-xs font-bold`}
          >
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 text-center relative">
              <span>{settings.promoBannerText}</span>
              {settings.promoBannerCoupon && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(settings.promoBannerCoupon);
                    setPromoCopied(true);
                    showToast(`تم نسخ الكوبون (${settings.promoBannerCoupon})`);
                    setTimeout(() => setPromoCopied(false), 2000);
                  }}
                  className="px-2.5 py-0.5 rounded-lg bg-white text-slate-900 font-black flex items-center gap-1 hover:bg-slate-100"
                >
                  {promoCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>
                    {settings.promoBannerCopyLabel || 'انسخ الكوبون:'} {settings.promoBannerCoupon}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => navigateTo('offers')}
                className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black hover:bg-amber-300"
              >
                العروض ←
              </button>
              <button
                type="button"
                onClick={() => setPromoDismissed(true)}
                className="sm:hidden p-1 text-white/80 hover:text-white"
                aria-label="إغلاق"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
            {/* الشعار واسم المنصة */}
            <div
              onClick={() => {
                logoClickCountRef.current += 1;
                if (logoClickCountRef.current >= 5) {
                  logoClickCountRef.current = 0;
                  if (isAdmin) {
                    navigateTo('admin');
                  } else {
                    setShowAdminLogin(true);
                  }
                } else {
                  navigateTo('home');
                }
              }}
              className="flex items-center gap-2.5 cursor-pointer select-none min-w-0"
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  style={{ width: settings.logoSize || 46, height: settings.logoSize || 46 }}
                  className="rounded-2xl object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <span className="block font-black text-blue-700 text-sm sm:text-base truncate">
                  {settings.siteName}
                </span>
                <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-500 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>{settings.siteTagline}</span>
                </span>
              </div>
            </div>

            {/* روابط التنقل على الكمبيوتر */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              {[
                { id: 'home', label: 'الرئيسية', icon: Home },
                { id: 'library', label: 'المذكرات', icon: BookOpen },
                { id: 'offers', label: 'العروض والباقات', icon: Percent },
                { id: 'track', label: 'تتبع طلبك', icon: Package }
              ].map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => navigateTo(nav.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                      activePage === nav.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{nav.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* أزرار الإجراءات */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">الإدارة</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-black flex items-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>السلة</span>
                {cart.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                    {cart.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تواصل معنا</span>
              </button>
            </div>
          </div>

          {/* شريط التنقل المدمج للهواتف */}
          <div className="lg:hidden border-t border-slate-100 px-2 py-1.5 flex items-center justify-around gap-1 bg-slate-50/90 overflow-x-auto">
            {[
              { id: 'home', label: 'الرئيسية', icon: Home },
              { id: 'library', label: 'المذكرات', icon: BookOpen },
              { id: 'offers', label: 'العروض', icon: Percent },
              { id: 'track', label: 'تتبع طلبك', icon: Package }
            ].map((nav) => {
              const Icon = nav.icon;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => navigateTo(nav.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 shrink-0 ${
                    activePage === nav.id ? 'bg-blue-600 text-white' : 'text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{nav.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1">
        {activePage === 'admin' && isAdmin ? (
          <AdminDashboard
            settings={settings}
            setSettings={setSettings}
            notebooks={notebooks}
            samplesMap={samplesMap}
            coupons={coupons}
            orders={orders}
            onLogout={async () => {
              try {
                await signOut(auth);
              } catch {
                // تجاهل
              }
              setIsAdmin(false);
              navigateTo('home');
            }}
            showToast={showToast}
          />
        ) : activePage === 'home' ? (
          <div className="space-y-12 pb-16">
            {/* الواجهة الرئيسية (Hero) */}
            <section
              style={{ minHeight: `${settings.heroMinHeight || 440}px` }}
              className="relative bg-slate-950 text-white flex items-center overflow-hidden"
            >
              {settings.heroBgImage && (
                <img
                  src={settings.heroBgImage}
                  alt=""
                  style={{ opacity: settings.heroBgOpacity ?? 0.28 }}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-l from-slate-950/90 via-slate-950/75 to-slate-900/80" />

              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
                <div className="lg:col-span-7 space-y-5">
                  {settings.heroBadge && (
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{settings.heroBadge}</span>
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight">
                    {settings.heroTitle}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                    {settings.heroSubtitle}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('library')}
                      className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-lg"
                    >
                      تصفح مكتبة المذكرات
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsContactOpen(true)}
                      className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-black text-sm"
                    >
                      اطلب إعداد مذكرة خاصة
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3.5">
                    <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                      <Shield className="w-5 h-5" />
                      <span>{settings.trustTitle}</span>
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200 font-bold">
                      {(settings.trustPoints || []).map((pt, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* الأقسام الرئيسية */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="text-center space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">الأقسام الرئيسية للمذكرات والكورسات</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-bold">
                  اختر القسم المناسب لتصفح مجلدات المراحل والصفوف الدراسية
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(settings.categories || []).map((cat) => {
                  const catImg = settings.categoryImages?.[cat.id] || '';
                  const count = notebooks.filter((n) => n.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => navigateTo('library', cat.id)}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition cursor-pointer group"
                    >
                      <div className="relative h-44 bg-gradient-to-br from-blue-600 to-indigo-800 overflow-hidden">
                        {catImg ? (
                          <img
                            src={catImg}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/90">
                            <BookOpen className="w-12 h-12" />
                          </div>
                        )}
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-black">
                          {count} مذكرة متاحة
                        </span>
                      </div>
                      <div className="p-5 flex items-center justify-between">
                        <div>
                          <h3 className="font-black text-base text-slate-900">{cat.name}</h3>
                          <p className="text-xs text-blue-600 font-bold mt-0.5">تصفح المراحل والصفوف الدراسية</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-blue-600 rotate-180 group-hover:-translate-x-1 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* قسم ما الجديد */}
            {settings.whatsNewEnabled !== false && whatsNewList.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black mb-1">
                      إصدارات حديثة
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{settings.whatsNewTitle}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('library')}
                    className="text-xs font-black text-blue-600 hover:underline"
                  >
                    عرض الكل ←
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {whatsNewList.map((nb) => (
                    <NotebookCard
                      key={nb.id}
                      notebook={nb}
                      onPreview={setPreviewNotebook}
                      onAddToCart={handleAddToCart}
                      isInCart={cartIds.has(nb.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* قسم الأخبار والإعلانات */}
            {settings.newsSectionEnabled !== false && (settings.newsItems || []).length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
                <h2 className="text-xl font-black text-slate-900">{settings.newsSectionTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(settings.newsItems || []).map((nw, i) => (
                    <div key={nw.id || i} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black">
                        {nw.badge}
                      </span>
                      <h3 className="font-black text-base text-slate-900">{nw.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{nw.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : activePage === 'library' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            {/* مسار التصفح وشريط البحث */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-black">
                <button
                  type="button"
                  onClick={() => navigateTo('library', null, null, null)}
                  className="px-3 py-1.5 rounded-xl bg-white border hover:bg-slate-50"
                >
                  كل الأقسام
                </button>
                {activeCategory && (
                  <>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => navigateTo('library', activeCategory.id, null, null)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {activeCategory.name}
                    </button>
                  </>
                )}
                {activeStage && (
                  <>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => navigateTo('library', activeCategory.id, activeStage.id, null)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {activeStage.name}
                    </button>
                  </>
                )}
                {activeGrade && (
                  <>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                    <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white">{activeGrade.name}</span>
                  </>
                )}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم المذكرة أو الصف..."
                  className="w-full pr-10 pl-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold"
                />
              </div>
            </div>

            {/* مجلدات الأقسام / المراحل / الصفوف */}
            {!selectedCategoryId && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(settings.categories || []).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 flex items-center gap-3 text-right shadow-sm"
                  >
                    <Folder className="w-7 h-7 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-black text-sm text-slate-900">{cat.name}</p>
                      <p className="text-xs text-slate-500 font-bold">
                        {notebooks.filter((n) => n.categoryId === cat.id).length} مذكرة
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeCategory && !selectedStageId && (activeCategory.stages || []).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activeCategory.stages.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStageId(st.id)}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 flex items-center gap-3 text-right shadow-sm"
                  >
                    <Folder className="w-6 h-6 text-indigo-600 shrink-0" />
                    <span className="font-black text-sm text-slate-900">{st.name}</span>
                  </button>
                ))}
              </div>
            )}

            {activeStage && !selectedGradeId && (activeStage.grades || []).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activeStage.grades.map((gr) => (
                  <button
                    key={gr.id}
                    type="button"
                    onClick={() => setSelectedGradeId(gr.id)}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 flex items-center gap-3 text-right shadow-sm"
                  >
                    <FileText className="w-6 h-6 text-emerald-600 shrink-0" />
                    <span className="font-black text-sm text-slate-900">{gr.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* شبكة المذكرات */}
            {filteredNotebooks.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-black text-slate-700">لا توجد مذكرات مطابقة في هذا القسم حاليًا</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredNotebooks.map((nb) => (
                  <NotebookCard
                    key={nb.id}
                    notebook={nb}
                    onPreview={setPreviewNotebook}
                    onAddToCart={handleAddToCart}
                    isInCart={cartIds.has(nb.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activePage === 'offers' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
            <div className="space-y-4">
              <h1 className="text-2xl font-black text-slate-900">باقات التوفير ومجموعات المذكرات</h1>
              {(settings.bundles || []).length === 0 ? (
                <p className="text-xs font-bold text-slate-500">لا توجد باقات مجمعة متاحة حاليًا</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(settings.bundles || []).map((bnd) => {
                    const included = (bnd.notebookIds || [])
                      .map((id) => notebooks.find((n) => n.id === id))
                      .filter(Boolean);
                    const origTotal = included.reduce((s, n) => s + (Number(n.price) || 0), 0);
                    return (
                      <div key={bnd.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black">
                            باقة توفير ({included.length} مذكرات)
                          </span>
                          <h3 className="font-black text-lg text-slate-900">{bnd.title}</h3>
                          {bnd.description && <p className="text-xs text-slate-600">{bnd.description}</p>}
                          <ul className="text-xs font-bold text-slate-700 space-y-1 pr-4 list-disc">
                            {included.map((n) => (
                              <li key={n.id}>{n.title}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-xl font-black text-indigo-700">{bnd.price} ج.م</span>
                            {origTotal > bnd.price && (
                              <span className="block text-xs text-slate-400 line-through font-bold">{origTotal} ج.م</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddBundleToCart(bnd)}
                            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5"
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

            {visibleCoupons.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-900">كوبونات الخصم المتاحة حاليًا</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleCoupons.map((cp) => (
                    <div key={cp.id} className="p-4 rounded-3xl bg-white border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-black text-base text-blue-700">{cp.code}</span>
                        <p className="text-xs font-bold text-slate-600">
                          خصم {cp.value}
                          {cp.type === 'percent' ? '%' : ' ج.م'}
                        </p>
                        {cp.expiresAt && (
                          <p className="text-[11px] font-bold text-amber-700">
                            ينتهي في: {formatExpiryArabic(cp.expiresAt)}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(cp.code);
                          showToast(`تم نسخ الكوبون (${cp.code})`);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* صفحة تتبع الطلب */
          <div className="max-w-xl mx-auto px-4 py-12 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-center">
              <Package className="w-12 h-12 text-blue-600 mx-auto" />
              <h1 className="text-xl font-black text-slate-900">تتبع حالة طلبك</h1>
              <p className="text-xs text-slate-500 font-bold">أدخل رقم الطلب (مثال: ORD-123456) لمعرفة حالة التجهيز</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="ORD-xxxxxx"
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-sm font-black uppercase text-center"
                />
                <button
                  type="button"
                  onClick={() => {
                    const q = trackQuery.trim().toUpperCase();
                    const found = orders.find((o) => (o.orderCode || '').toUpperCase() === q);
                    setTrackedOrder(found || null);
                    setTrackNotFound(!found);
                  }}
                  className="px-5 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black"
                >
                  بحث
                </button>
              </div>

              {trackNotFound && (
                <p className="text-xs font-bold text-rose-600">لم يتم العثور على طلب بهذا الرقم، تأكد من كتابته بشكل صحيح</p>
              )}

              {trackedOrder && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-right space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm">{trackedOrder.orderCode}</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                      {trackedOrder.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700">الاسم: {trackedOrder.teacherName}</p>
                  <p className="text-xs font-bold text-slate-600">
                    المحتويات: {(trackedOrder.items || []).map((i) => i.title).join(' • ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* شريط السلة العائم أسفل الشاشة */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-md">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-2xl flex items-center justify-between font-black text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              <span>سلة الطلبات ({cart.length})</span>
            </div>
            <span className="px-3 py-1 rounded-xl bg-blue-600 text-white">إتمام الطلب ←</span>
          </button>
        </div>
      )}

      {/* التذييل */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-xs font-bold space-y-2">
        <p className="text-white font-black text-sm">{settings.siteName}</p>
        <p>{settings.siteTagline}</p>
        <p className="text-slate-500 pt-2">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
      </footer>

      {/* نافذة المعاينة */}
      <ProtectedPreviewModal
        notebook={previewNotebook}
        settings={settings}
        samplesMap={samplesMap}
        onClose={() => setPreviewNotebook(null)}
        onAddToCart={handleAddToCart}
        isInCart={previewNotebook ? cartIds.has(previewNotebook.id) : false}
      />

      {/* نافذة السلة */}
      <OrderCheckoutModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        setCart={setCart}
        settings={settings}
        coupons={coupons}
        showToast={showToast}
      />

      {/* نافذة تواصل معنا */}
      {isContactOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsContactOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-900">تواصل معنا</h3>
              <button
                type="button"
                onClick={() => setIsContactOpen(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {(settings.socialLinks || []).map((lk, idx) => (
                <a
                  key={lk.id || idx}
                  href={lk.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 flex items-center justify-between text-xs font-black text-slate-800"
                >
                  <span>{lk.label}</span>
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل دخول الإدارة */}
      {showAdminLogin && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAdminLogin(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">دخول لوحة تحكم الإدارة</h3>
                  <p className="text-[11px] text-slate-500 font-bold">مخصص لإدارة {settings.siteName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminLogin(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminEmailLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">البريد الإلكتروني الإداري</label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-left"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    dir="ltr"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-500"
                  >
                    {showAdminPass ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>
              </div>

              {adminLoginError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                  {adminLoginError}
                </div>
              )}

              <button
                type="submit"
                disabled={adminLoggingIn}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow"
              >
                {adminLoggingIn ? 'جاري التحقق...' : 'تسجيل الدخول للوحة التحكم'}
              </button>
            </form>

            <div className="text-center text-[11px] text-slate-400 font-bold">أو</div>

            <button
              type="button"
              onClick={handleAdminGoogleLogin}
              disabled={adminLoggingIn}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>دخول سريع بحساب Google الإداري</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <PlatformErrorBoundary>
      <MuzakkiratiApp />
    </PlatformErrorBoundary>
  );
}
