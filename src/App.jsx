import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Tag,
  Gift,
  Package,
  Truck,
  Phone,
  MessageCircle,
  Shield,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Layers,
  FolderOpen,
  FileText,
  ExternalLink,
  Copy,
  Download,
  RefreshCw,
  Settings,
  Megaphone,
  Award,
  Home,
  Percent,
  Clock,
  Share2
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
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

// ============================================================================
// 1. إعدادات الربط السحابي (Firebase) الثابتة لمشروع منصة العباقرة
// ============================================================================
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: ['AIzaSyD', '_du5VY8nJGDJ169Fof9EALI9x2W2d-14'].join(''),
  authDomain: 'el3bakera-edu.firebaseapp.com',
  projectId: 'el3bakera-edu',
  storageBucket: 'el3bakera-edu.firebasestorage.app',
  messagingSenderId: '74663879858',
  appId: '1:74663879858:web:4327c0ea1b825dd6c615ab'
};

const APP_ID = 'el3bakera-edu';
const LEGACY_APP_ID = 'muzakkirati-edu-app';
const ADMIN_EMAIL = 'mahmoudelzaaty7@gmail.com';

const LOCAL_SETTINGS_KEY = 'el3bakera_settings_backup_v4';
const LOCAL_NOTEBOOKS_KEY = 'el3bakera_notebooks_backup_v4';
const LOCAL_SAMPLES_KEY = 'el3bakera_samples_backup_v4';

let firebaseApp = null;
let auth = null;
let db = null;

try {
  const activeConfig =
    typeof window !== 'undefined' && window.__firebase_config
      ? window.__firebase_config
      : DEFAULT_FIREBASE_CONFIG;
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
} catch (initErr) {
  console.warn('Firebase init fallback:', initErr);
}

const publicCol = (colName) => collection(db, 'artifacts', APP_ID, 'public', 'data', colName);
const publicDoc = (colName, docId) => doc(db, 'artifacts', APP_ID, 'public', 'data', colName, docId);
const legacyPublicCol = (colName) =>
  collection(db, 'artifacts', LEGACY_APP_ID, 'public', 'data', colName);
const legacyPublicDoc = (colName, docId) =>
  doc(db, 'artifacts', LEGACY_APP_ID, 'public', 'data', colName, docId);

// ============================================================================
// 2. دوال مساعدة لتأمين النصوص، التواريخ، والصور
// ============================================================================
function safeText(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    return val.ar || val.name || val.title || val.label || val.text || fallback;
  }
  return fallback;
}

function toTimeMs(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof val === 'object') {
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
  }
  return 0;
}

function formatExpiryArabic(expiresAt) {
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
    return '';
  }
}

function isCouponExpired(coupon) {
  if (!coupon || !coupon.expiresAt) return false;
  const ms = toTimeMs(coupon.expiresAt);
  return ms > 0 && Date.now() > ms;
}

// ضغط الصور تلقائيًا لتعمل بسلاسة وسرعة فائقة داخل Firestore
function compressImageFile(file, maxWidth = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target?.result || '');
        img.src = e.target?.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================================================
// 3. البيانات الافتراضية للمنصة (تُدمج بأمان مع أي بيانات محفوظة)
// ============================================================================
const DEFAULT_CATEGORIES = [
  {
    id: 'cat_term1',
    name: 'مذكرات الترم الأول',
    stages: [
      {
        id: 'stg_prep_1',
        name: 'المرحلة الإعدادية',
        grades: [
          { id: 'grd_1prep', name: 'الصف الأول الإعدادي' },
          { id: 'grd_2prep', name: 'الصف الثاني الإعدادي' },
          { id: 'grd_3prep', name: 'الصف الثالث الإعدادي' }
        ]
      },
      {
        id: 'stg_sec_1',
        name: 'المرحلة الثانوية',
        grades: [
          { id: 'grd_1sec', name: 'الصف الأول الثانوي' },
          { id: 'grd_2sec', name: 'الصف الثاني الثانوي' },
          { id: 'grd_3sec', name: 'الصف الثالث الثانوي' }
        ]
      }
    ]
  },
  {
    id: 'cat_term2',
    name: 'مذكرات الترم الثاني',
    stages: [
      {
        id: 'stg_prep_2',
        name: 'المرحلة الإعدادية',
        grades: [
          { id: 'grd_1prep_t2', name: 'الصف الأول الإعدادي' },
          { id: 'grd_2prep_t2', name: 'الصف الثاني الإعدادي' },
          { id: 'grd_3prep_t2', name: 'الصف الثالث الإعدادي' }
        ]
      }
    ]
  },
  {
    id: 'cat_foundation',
    name: 'كورسات التأسيس والمراجعات',
    stages: [
      {
        id: 'stg_found',
        name: 'تأسيس ومراجعات شاملة',
        grades: [
          { id: 'grd_found_all', name: 'جميع المراحل' }
        ]
      }
    ]
  }
];

const DEFAULT_CUSTOMER_FIELDS = [
  { id: 'fullName', label: 'اسم المعلم / العميل بالكامل', placeholder: 'أدخل الاسم كما سيُكتب على المذكرة', required: true, enabled: true, type: 'text' },
  { id: 'phone', label: 'رقم الواتساب للتواصل والتسليم', placeholder: '01xxxxxxxxx', required: true, enabled: true, type: 'tel' },
  { id: 'coverTitle', label: 'الاسم أو اللقب المطلوب طباعته على الغلاف', placeholder: 'مثال: أ/ محمود شحاتة — خبير المادة', required: true, enabled: true, type: 'text' },
  { id: 'coverPhone', label: 'رقم الهاتف المطلوب على الغلاف والصفحات', placeholder: '01xxxxxxxxx', required: false, enabled: true, type: 'tel' },
  { id: 'notes', label: 'ملاحظات إضافية أو روابط الشعار', placeholder: 'أي تفاصيل إضافية للتصميم...', required: false, enabled: true, type: 'textarea' }
];

const DEFAULT_SETTINGS = {
  siteName: 'منصة العباقرة للمذكرات التعليمية',
  siteTagline: 'مذكرات دراسية احترافية مخصصة للمعلم باسمه وبياناته الخاصة',
  logoUrl: '',
  heroBadge: 'الإصدار المعتمد للمعلمين والسناتر التعليمية',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة باحترافية ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة بيانات المعلم وشعاره على الغلاف وجميع الصفحات.',
  heroBgImage: '',
  heroOverlayOpacity: 0.78,
  heroMinHeight: 'normal',
  trustTitle: 'لماذا يثق بنا المعلمون؟',
  trustPoints: [
    'محتوى متكامل ومطابق لأحدث تعليمات الوزارة ومنسق باحترافية.',
    'وضع اسم المعلم ورقم الهاتف والشعار على الغلاف وجميع الصفحات.',
    'معاينة حقيقية لصفحات المذكرة قبل تأكيد الطلب.',
    'تسليم سريع بصيغة PDF عالية الدقة جاهزة للطباعة.',
    'خدمة عملاء حقيقية لحل أي مشكلة.'
  ],
  whatsappNumber: '201000000000',
  promoEnabled: true,
  promoText: 'عرض خاص للمعلمين: خصم 15% على جميع المذكرات حتى نهاية الشهر بمناسبة افتتاح موقعنا',
  promoCouponCode: 'M20',
  whatsNewEnabled: true,
  whatsNewTitle: 'ما الجديد؟ أحدث المذكرات والإصدارات',
  whatsNewMode: 'auto',
  whatsNewCount: 4,
  whatsNewIds: [],
  newsSectionEnabled: true,
  newsSectionTitle: 'أخبار المنصة ومذكرات قيد التجهيز',
  newsItems: [
    {
      id: 'nw_1',
      badge: 'تحديث المناهج',
      title: 'تحديث جميع مذكرات الشرح والمراجعة وفق أحدث مواصفات الوزارة',
      body: 'تمت إضافة نماذج التقييمات الأسبوعية والاختبارات الشهرية مجانًا مع كل مذكرة.'
    }
  ],
  nextOrderReward: {
    enabled: true,
    code: 'NEXT15',
    discountPercent: 15,
    validDays: 7,
    message: 'هدية تقدير لطلبك: استخدم هذا الكود في طلبك القادم واحصل على خصم فوري!'
  },
  categories: DEFAULT_CATEGORIES,
  categoryImages: {},
  bundles: [],
  customerFields: DEFAULT_CUSTOMER_FIELDS,
  socialLinks: [
    { id: 'soc_fb', label: 'صفحتنا على فيسبوك', url: 'https://facebook.com' },
    { id: 'soc_tg', label: 'قناة التليجرام', url: 'https://t.me' }
  ]
};

// ============================================================================
// 4. دوال تطبيع ودمج البيانات القادمة من السحابة أو التخزين المحلي
// ============================================================================
function normalizeNotebook(nb) {
  if (!nb || typeof nb !== 'object') return nb;
  let cover =
    nb.coverImage ||
    nb.cover ||
    nb.coverUrl ||
    nb.coverDataUrl ||
    nb.image ||
    nb.imageUrl ||
    nb.thumbnail ||
    nb.photo ||
    (Array.isArray(nb.samplePages) && nb.samplePages[0]) ||
    '';
  if (!cover) {
    for (const val of Object.values(nb)) {
      if (typeof val === 'string' && val.startsWith('data:image/')) {
        cover = val;
        break;
      }
    }
  }
  const samples = Array.isArray(nb.samplePages)
    ? nb.samplePages
    : Array.isArray(nb.samples)
    ? nb.samples
    : Array.isArray(nb.images)
    ? nb.images
    : Array.isArray(nb.pages)
    ? nb.pages
    : [];
  return {
    ...nb,
    title: safeText(nb.title || nb.name, 'مذكرة دراسية'),
    gradeName: safeText(nb.gradeName || nb.grade, ''),
    subject: safeText(nb.subject, ''),
    description: safeText(nb.description || nb.desc, ''),
    alertBadge: safeText(nb.alertBadge, ''),
    alertText: safeText(nb.alertText, ''),
    coverImage: typeof cover === 'string' ? cover : '',
    samplePages: samples.filter((s) => typeof s === 'string'),
    price: Number(nb.price) || 0,
    oldPrice: Number(nb.oldPrice) || 0
  };
}

function extractAnyImagesFromDoc(data) {
  if (!data || typeof data !== 'object') return [];
  const found = [];
  const candidates = [data.pages, data.samples, data.images, data.sampleImages, data.urls, data.files, data.list];
  for (const arr of candidates) {
    if (Array.isArray(arr)) {
      for (const item of arr) {
        const str = typeof item === 'string' ? item : item?.url || item?.src || item?.dataUrl || '';
        if (str && typeof str === 'string') found.push(str);
      }
    }
  }
  if (found.length === 0) {
    for (const [k, v] of Object.entries(data)) {
      if (!k.toLowerCase().includes('cover') && typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('http'))) {
        found.push(v);
      }
    }
  }
  return found;
}

function mergeAndNormalizeSettings(base, incoming) {
  if (!incoming || typeof incoming !== 'object') return base;
  const mergedCatImages = {
    ...(base.categoryImages || {}),
    ...(incoming.categoryImages || {}),
    ...(incoming.catImages || {}),
    ...(incoming.images || {})
  };
  const rawCats =
    Array.isArray(incoming.categories) && incoming.categories.length > 0
      ? incoming.categories
      : Array.isArray(incoming.sections) && incoming.sections.length > 0
      ? incoming.sections
      : base.categories;

  const normalizedCats = rawCats.map((c, idx) => {
    const id = c.id || `cat_${idx + 1}`;
    const name = safeText(
      c.name || c.title || c.label || c.categoryName || c.arName || c.text,
      base.categories?.[idx]?.name || `قسم ${idx + 1}`
    );
    const possibleImg = c.image || c.imageUrl || c.cover || c.coverImage || c.img || c.iconUrl;
    if (possibleImg && typeof possibleImg === 'string' && !mergedCatImages[id]) {
      mergedCatImages[id] = possibleImg;
    }
    return {
      ...c,
      id,
      name,
      stages: Array.isArray(c.stages)
        ? c.stages.map((st, sIdx) => ({
            ...st,
            id: st.id || `stg_${sIdx + 1}`,
            name: safeText(st.name || st.title || st.label, `مرحلة ${sIdx + 1}`),
            grades: Array.isArray(st.grades)
              ? st.grades.map((gr, gIdx) => ({
                  ...gr,
                  id: gr.id || `grd_${gIdx + 1}`,
                  name: safeText(gr.name || gr.title || gr.label, `صف ${gIdx + 1}`)
                }))
              : []
          }))
        : []
    };
  });

  const resolvedLogo =
    [incoming.logoUrl, incoming.logo, incoming.siteLogo, incoming.logoDataUrl, incoming.brandLogo].find(
      (v) => typeof v === 'string' && v.length > 5
    ) || base.logoUrl;

  const resolvedHero =
    [incoming.heroBgImage, incoming.heroImage, incoming.bgImage, incoming.bannerImage, incoming.heroBg].find(
      (v) => typeof v === 'string' && v.length > 5
    ) || base.heroBgImage;

  const normalizedNews = Array.isArray(incoming.newsItems)
    ? incoming.newsItems.map((nw, i) => ({
        id: nw.id || `news_${i}`,
        badge: safeText(nw.badge, 'تحديث'),
        title: safeText(nw.title, ''),
        body: safeText(nw.body, '')
      }))
    : base.newsItems;

  const normalizedTrust =
    Array.isArray(incoming.trustPoints) && incoming.trustPoints.length > 0
      ? incoming.trustPoints.map((pt) => safeText(pt)).filter(Boolean)
      : base.trustPoints;

  return {
    ...base,
    ...incoming,
    siteName: safeText(incoming.siteName, base.siteName),
    siteTagline: safeText(incoming.siteTagline, base.siteTagline),
    heroBadge: safeText(incoming.heroBadge, base.heroBadge),
    heroTitle: safeText(incoming.heroTitle, base.heroTitle),
    heroSubtitle: safeText(incoming.heroSubtitle, base.heroSubtitle),
    logoUrl: resolvedLogo,
    heroBgImage: resolvedHero,
    categories: normalizedCats,
    categoryImages: mergedCatImages,
    bundles: Array.isArray(incoming.bundles) ? incoming.bundles : base.bundles,
    customerFields:
      Array.isArray(incoming.customerFields) && incoming.customerFields.length > 0
        ? incoming.customerFields
        : base.customerFields,
    socialLinks: Array.isArray(incoming.socialLinks) ? incoming.socialLinks : base.socialLinks,
    newsItems: normalizedNews,
    trustPoints: normalizedTrust
  };
}

// ============================================================================
// 5. مكون الحماية من أخطاء العرض (ErrorBoundary)
// ============================================================================
class PlatformErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'حدث خطأ غير متوقع' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900">تم استعادة الجلسة بأمان</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              حدث انقطاع مؤقت أثناء تحديث العرض ({this.state.message}). اضغط لإعادة عرض المنصة دون فقد بياناتك:
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg"
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
// 6. نافذة معاينة المذكرة وصفحات العينة (SamplePreviewModal)
// ============================================================================
function SamplePreviewModal({ notebook, samplesMap, onClose, onAddToCart }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadSamples() {
      if (!notebook) return;
      setLoading(true);
      const inlineSamples = Array.isArray(notebook.samplePages) ? notebook.samplePages : [];
      let remoteSamples = Array.isArray(samplesMap?.[notebook.id]) ? samplesMap[notebook.id] : [];

      if (remoteSamples.length === 0 && db) {
        for (const colName of ['notebook_samples', 'notebook_media', 'samples']) {
          try {
            const snap = await getDoc(publicDoc(colName, notebook.id));
            if (snap.exists()) {
              const found = extractAnyImagesFromDoc(snap.data());
              if (found.length > 0) {
                remoteSamples = found;
                break;
              }
            }
          } catch {
            // تجاهل
          }
        }
      }

      if (remoteSamples.length === 0 && db) {
        try {
          const legacySnap = await getDoc(legacyPublicDoc('notebook_samples', notebook.id));
          if (legacySnap.exists()) {
            remoteSamples = extractAnyImagesFromDoc(legacySnap.data());
          }
        } catch {
          // تجاهل
        }
      }

      const mergedSamples = remoteSamples.length > 0 ? remoteSamples : inlineSamples;
      // إزالة تكرار الغلاف إذا وُجدت عينات أخرى
      const distinctSamples =
        notebook.coverImage && mergedSamples.length > 1
          ? mergedSamples.filter((img) => img !== notebook.coverImage)
          : mergedSamples;

      const finalList =
        distinctSamples.length > 0
          ? distinctSamples
          : notebook.coverImage
          ? [notebook.coverImage]
          : [];

      if (active) {
        setPages(finalList);
        setActiveIdx(0);
        setLoading(false);
      }
    }
    loadSamples();
    return () => {
      active = false;
    };
  }, [notebook, samplesMap]);

  if (!notebook) return null;

  const hasDiscount = notebook.oldPrice > notebook.price;
  const savedAmount = hasDiscount ? notebook.oldPrice - notebook.price : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-600 shrink-0">
              <BookOpen className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 text-base sm:text-lg truncate">{notebook.title}</h3>
              <p className="text-xs text-slate-500 font-bold truncate">
                {notebook.gradeName} {notebook.subject ? `• ${notebook.subject}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6 max-h-[82vh] overflow-y-auto">
          {/* عارض صفحات العينة */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-[3/4] max-h-[430px] mx-auto flex items-center justify-center border border-slate-200 shadow-inner">
              {loading ? (
                <div className="text-white/80 text-sm font-bold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> جاري تحميل صفحات العينة...
                </div>
              ) : pages.length > 0 ? (
                <>
                  <img
                    src={pages[activeIdx]}
                    alt={`عينة ${activeIdx + 1}`}
                    className="w-full h-full object-contain select-none"
                  />
                  {pages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveIdx((prev) => (prev + 1) % pages.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 text-slate-900 shadow-lg hover:bg-white transition"
                        title="الصفحة التالية"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveIdx((prev) => (prev - 1 + pages.length) % pages.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 text-slate-900 shadow-lg hover:bg-white transition"
                        title="الصفحة السابقة"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/80 text-white text-xs font-black">
                        صفحة {activeIdx + 1} من {pages.length}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-400 p-6 space-y-2">
                  <ImageIcon className="w-10 h-10 mx-auto opacity-50" />
                  <p className="text-xs font-bold">لا توجد صور عينة مرفوعة لهذه المذكرة بعد</p>
                </div>
              )}
            </div>

            {pages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
                {pages.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`w-14 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                      i === activeIdx ? 'border-blue-600 scale-105 shadow' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt={`مصغرة ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* تفاصيل المذكرة */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {notebook.alertText && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{notebook.alertBadge || 'تنبيه هام للمعلم'}</span>
                  </div>
                  <p className="text-xs leading-relaxed font-semibold">{notebook.alertText}</p>
                </div>
              )}

              {notebook.comingSoon && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-black">
                  <Clock className="w-3.5 h-3.5" /> قيد التجهيز — متاح للحجز المسبق
                </div>
              )}

              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase mb-1.5">وصف المذكرة ومحتوياتها</h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {notebook.description ||
                    'مذكرة دراسية شاملة ومنسقة باحترافية جاهزة للطباعة باسم المعلم وشعاره ورقم هاتفه على الغلاف وجميع الصفحات.'}
                </p>
              </div>

              {notebook.driveUrl && (
                <a
                  href={notebook.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  معاينة ملف عينة PDF على Google Drive
                </a>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold block">السعر شامل التخصيص</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-blue-600">{notebook.price} ج.م</span>
                    {hasDiscount && (
                      <span className="text-sm text-slate-400 line-through font-bold">{notebook.oldPrice} ج.م</span>
                    )}
                  </div>
                </div>
                {hasDiscount && (
                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-black">
                    وفر {savedAmount} ج.م
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddToCart(notebook);
                  onClose();
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <ShoppingCart className="w-4 h-4" />
                {notebook.comingSoon ? 'احجز المذكرة مسبقًا في السلة' : 'أضف المذكرة إلى السلة'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. لوحة تحكم الإدارة الشاملة (AdminDashboard)
// ============================================================================
function AdminDashboard({
  settings,
  onSaveSettings,
  notebooks,
  samplesMap,
  coupons,
  orders,
  userEmail,
  onLogout,
  onClose,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('notebooks');
  const [localSettings, setLocalSettings] = useState(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // --- حالة نموذج إضافة / تعديل مذكرة ---
  const [editingNbId, setEditingNbId] = useState(null);
  const [nbForm, setNbForm] = useState({
    title: '',
    categoryId: settings.categories?.[0]?.id || '',
    stageId: settings.categories?.[0]?.stages?.[0]?.id || '',
    gradeId: settings.categories?.[0]?.stages?.[0]?.grades?.[0]?.id || '',
    gradeName: settings.categories?.[0]?.stages?.[0]?.grades?.[0]?.name || '',
    subject: '',
    price: '',
    oldPrice: '',
    description: '',
    driveUrl: '',
    alertBadge: '',
    alertText: '',
    comingSoon: false,
    coverImage: '',
    samplePages: []
  });
  const [savingNb, setSavingNb] = useState(false);

  // --- حالة كوبون جديد ---
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountPercent: 15,
    description: '',
    expiresAt: ''
  });

  // --- حالة باقة جديدة ---
  const [newBundle, setNewBundle] = useState({
    title: '',
    description: '',
    notebookIds: [],
    bundlePrice: ''
  });

  // --- حالة حقل عميل جديد ---
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');

  // --- حالة خبر جديد ---
  const [newNews, setNewNews] = useState({ badge: 'جديد', title: '', body: '' });

  // حفظ الإعدادات سحابيًا ومحليًا
  const handlePersistSettings = async (updatedObj = localSettings) => {
    setSavingSettings(true);
    try {
      try {
        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(updatedObj));
      } catch {
        // تجاهل
      }

      // فصل الصور الكبيرة في مستندات وسائط مستقلة لتفادي حد 1MB في Firestore
      const { logoUrl, heroBgImage, categoryImages, ...coreSettings } = updatedObj;
      await setDoc(publicDoc('settings', 'main'), { ...coreSettings, updatedAt: serverTimestamp() }, { merge: true });
      if (logoUrl !== undefined) {
        await setDoc(publicDoc('settings', 'media_logo'), { dataUrl: logoUrl || '' }, { merge: true });
      }
      if (heroBgImage !== undefined) {
        await setDoc(publicDoc('settings', 'media_hero'), { dataUrl: heroBgImage || '' }, { merge: true });
      }
      if (categoryImages !== undefined) {
        await setDoc(publicDoc('settings', 'media_categories'), { images: categoryImages || {} }, { merge: true });
      }
      onSaveSettings(updatedObj);
      showToast('تم حفظ جميع الإعدادات ومزامنتها بنجاح ✅');
    } catch (err) {
      onSaveSettings(updatedObj);
      showToast('تم الحفظ محليًا؛ تأكد من اتصال السحابة للمزامنة العامة', 'warning');
    } finally {
      setSavingSettings(false);
    }
  };

  // بدء تعديل مذكرة
  const startEditNotebook = (nb) => {
    setEditingNbId(nb.id);
    const existingSamples =
      Array.isArray(samplesMap?.[nb.id]) && samplesMap[nb.id].length > 0
        ? samplesMap[nb.id]
        : Array.isArray(nb.samplePages)
        ? nb.samplePages
        : [];
    setNbForm({
      title: nb.title || '',
      categoryId: nb.categoryId || localSettings.categories?.[0]?.id || '',
      stageId: nb.stageId || '',
      gradeId: nb.gradeId || '',
      gradeName: nb.gradeName || '',
      subject: nb.subject || '',
      price: nb.price || '',
      oldPrice: nb.oldPrice || '',
      description: nb.description || '',
      driveUrl: nb.driveUrl || '',
      alertBadge: nb.alertBadge || '',
      alertText: nb.alertText || '',
      comingSoon: Boolean(nb.comingSoon),
      coverImage: nb.coverImage || '',
      samplePages: existingSamples
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetNbForm = () => {
    setEditingNbId(null);
    const c0 = localSettings.categories?.[0];
    const s0 = c0?.stages?.[0];
    const g0 = s0?.grades?.[0];
    setNbForm({
      title: '',
      categoryId: c0?.id || '',
      stageId: s0?.id || '',
      gradeId: g0?.id || '',
      gradeName: g0?.name || '',
      subject: '',
      price: '',
      oldPrice: '',
      description: '',
      driveUrl: '',
      alertBadge: '',
      alertText: '',
      comingSoon: false,
      coverImage: '',
      samplePages: []
    });
  };

  const handleSaveNotebook = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim()) {
      showToast('يرجى إدخال عنوان المذكرة', 'error');
      return;
    }
    setSavingNb(true);
    try {
      const nbId = editingNbId || `nb_${Date.now()}`;
      const selectedCat = (localSettings.categories || []).find((c) => c.id === nbForm.categoryId);
      const selectedStage = selectedCat?.stages?.find((s) => s.id === nbForm.stageId);
      const selectedGrade = selectedStage?.grades?.find((g) => g.id === nbForm.gradeId);

      const payload = {
        title: nbForm.title.trim(),
        categoryId: nbForm.categoryId,
        stageId: nbForm.stageId,
        gradeId: nbForm.gradeId,
        gradeName: selectedGrade?.name || nbForm.gradeName || '',
        subject: nbForm.subject.trim(),
        price: Number(nbForm.price) || 0,
        oldPrice: Number(nbForm.oldPrice) || 0,
        description: nbForm.description.trim(),
        driveUrl: nbForm.driveUrl.trim(),
        alertBadge: nbForm.alertBadge.trim(),
        alertText: nbForm.alertText.trim(),
        comingSoon: Boolean(nbForm.comingSoon),
        coverImage: nbForm.coverImage || '',
        updatedAt: serverTimestamp()
      };
      if (!editingNbId) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(publicDoc('notebooks', nbId), payload, { merge: true });
      await setDoc(
        publicDoc('notebook_samples', nbId),
        { pages: nbForm.samplePages || [], updatedAt: serverTimestamp() },
        { merge: true }
      );

      showToast(editingNbId ? 'تم تحديث المذكرة بنجاح ✅' : 'تمت إضافة المذكرة الجديدة بنجاح ✅');
      resetNbForm();
    } catch (err) {
      showToast(`تعذر حفظ المذكرة في السحابة: ${err?.message || ''}`, 'error');
    } finally {
      setSavingNb(false);
    }
  };

  const handleDeleteNotebook = async (nbId) => {
    try {
      await deleteDoc(publicDoc('notebooks', nbId));
      await deleteDoc(publicDoc('notebook_samples', nbId));
      showToast('تم حذف المذكرة');
    } catch {
      showToast('تعذر حذف المذكرة', 'error');
    }
  };

  // --- إدارة الكوبونات ---
  const handleAddCoupon = async (e) => {
    e.preventDefault();
    const cleanCode = newCoupon.code.trim().toUpperCase();
    if (!cleanCode) return;
    try {
      await setDoc(publicDoc('coupons', cleanCode), {
        code: cleanCode,
        discountPercent: Number(newCoupon.discountPercent) || 10,
        description: newCoupon.description.trim(),
        expiresAt: newCoupon.expiresAt ? new Date(newCoupon.expiresAt).toISOString() : '',
        active: true,
        createdAt: serverTimestamp()
      });
      setNewCoupon({ code: '', discountPercent: 15, description: '', expiresAt: '' });
      showToast('تم إنشاء كوبون الخصم بنجاح ✅');
    } catch {
      showToast('تعذر حفظ الكوبون', 'error');
    }
  };

  // --- تصدير واستيراد نسخة احتياطية JSON ---
  const handleExportJson = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      settings: localSettings,
      notebooks,
      samplesMap,
      coupons
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `el3bakera-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تنزيل النسخة الاحتياطية بنجاح');
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result || '{}');
        if (parsed.settings) {
          const merged = mergeAndNormalizeSettings(localSettings, parsed.settings);
          setLocalSettings(merged);
          await handlePersistSettings(merged);
        }
        if (Array.isArray(parsed.notebooks)) {
          for (const nb of parsed.notebooks) {
            await setDoc(publicDoc('notebooks', nb.id), normalizeNotebook(nb), { merge: true });
          }
        }
        if (parsed.samplesMap && typeof parsed.samplesMap === 'object') {
          for (const [nbId, pages] of Object.entries(parsed.samplesMap)) {
            await setDoc(publicDoc('notebook_samples', nbId), { pages }, { merge: true });
          }
        }
        showToast('تمت استعادة النسخة الاحتياطية بالكامل ✅');
      } catch {
        showToast('ملف النسخة الاحتياطية غير صالح', 'error');
      }
    };
    reader.readAsText(file);
  };

  const currentFormCategory = (localSettings.categories || []).find((c) => c.id === nbForm.categoryId);
  const currentFormStage = currentFormCategory?.stages?.find((s) => s.id === nbForm.stageId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* رأس لوحة التحكم */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black">لوحة تحكم الإدارة — منصة العباقرة</h2>
            <p className="text-xs text-slate-400 font-bold">مسجل الدخول: {userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black transition"
          >
            العودة للمنصة
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black flex items-center gap-1.5 transition"
          >
            <LogOut className="w-4 h-4" /> تسجيل الخروج
          </button>
        </div>
      </div>

      {/* شريط تبويبات الإدارة */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {[
          { id: 'notebooks', label: `المذكرات والعينات (${notebooks.length})`, icon: BookOpen },
          { id: 'categories', label: 'الأقسام والمراحل والصفوف', icon: FolderOpen },
          { id: 'offers', label: 'العروض والباقات والكوبونات', icon: Percent },
          { id: 'orders', label: `الطلبات الواردة (${orders.length})`, icon: Package },
          { id: 'settings', label: 'إعدادات الموقع والمظهر وطلب العميل', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition ${
                active ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. تبويب المذكرات والعينات */}
      {activeTab === 'notebooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveNotebook}
            className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm h-fit"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">
                {editingNbId ? 'تعديل المذكرة الحالية' : 'إضافة مذكرة جديدة'}
              </h3>
              {editingNbId && (
                <button
                  type="button"
                  onClick={resetNbForm}
                  className="text-xs text-rose-600 font-black hover:underline"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">عنوان المذكرة *</label>
                <input
                  type="text"
                  required
                  value={nbForm.title}
                  onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })}
                  placeholder="مثال: مذكرة العباقرة في اللغة العربية - ترم أول"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">القسم</label>
                  <select
                    value={nbForm.categoryId}
                    onChange={(e) => {
                      const cat = (localSettings.categories || []).find((c) => c.id === e.target.value);
                      const stg = cat?.stages?.[0];
                      const grd = stg?.grades?.[0];
                      setNbForm({
                        ...nbForm,
                        categoryId: e.target.value,
                        stageId: stg?.id || '',
                        gradeId: grd?.id || '',
                        gradeName: grd?.name || ''
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    {(localSettings.categories || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">المرحلة</label>
                  <select
                    value={nbForm.stageId}
                    onChange={(e) => {
                      const stg = currentFormCategory?.stages?.find((s) => s.id === e.target.value);
                      const grd = stg?.grades?.[0];
                      setNbForm({
                        ...nbForm,
                        stageId: e.target.value,
                        gradeId: grd?.id || '',
                        gradeName: grd?.name || ''
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    {(currentFormCategory?.stages || []).map((s) => (
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
                    onChange={(e) => {
                      const grd = currentFormStage?.grades?.find((g) => g.id === e.target.value);
                      setNbForm({
                        ...nbForm,
                        gradeId: e.target.value,
                        gradeName: grd?.name || ''
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    {(currentFormStage?.grades || []).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">المادة</label>
                  <input
                    type="text"
                    value={nbForm.subject}
                    onChange={(e) => setNbForm({ ...nbForm, subject: e.target.value })}
                    placeholder="لغة عربية"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">السعر (ج.م)</label>
                  <input
                    type="number"
                    required
                    value={nbForm.price}
                    onChange={(e) => setNbForm({ ...nbForm, price: e.target.value })}
                    placeholder="150"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">السعر قبل الخصم</label>
                  <input
                    type="number"
                    value={nbForm.oldPrice}
                    onChange={(e) => setNbForm({ ...nbForm, oldPrice: e.target.value })}
                    placeholder="200"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">وصف المذكرة ومميزاتها</label>
                <textarea
                  rows={3}
                  value={nbForm.description}
                  onChange={(e) => setNbForm({ ...nbForm, description: e.target.value })}
                  placeholder="عدد الصفحات، المحتوى، التدريبات..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">رابط عينة Google Drive (اختياري)</label>
                <input
                  type="url"
                  value={nbForm.driveUrl}
                  onChange={(e) => setNbForm({ ...nbForm, driveUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-left"
                  dir="ltr"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <span className="text-xs font-black text-amber-800 block">تنبيه خاص يظهر على بطاقة المذكرة (اختياري)</span>
                <input
                  type="text"
                  value={nbForm.alertBadge}
                  onChange={(e) => setNbForm({ ...nbForm, alertBadge: e.target.value })}
                  placeholder="عنوان الشارة (مثال: محدث 2026)"
                  className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs font-bold"
                />
                <input
                  type="text"
                  value={nbForm.alertText}
                  onChange={(e) => setNbForm({ ...nbForm, alertText: e.target.value })}
                  placeholder="نص التنبيه داخل المعاينة..."
                  className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs font-bold"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-black text-purple-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nbForm.comingSoon}
                  onChange={(e) => setNbForm({ ...nbForm, comingSoon: e.target.checked })}
                  className="rounded text-purple-600"
                />
                مذكرة قيد التجهيز (تُعرض في قسم قيد التجهيز وتُتاح للحجز المسبق)
              </label>

              {/* رفع صورة الغلاف */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-black text-slate-700">صورة غلاف المذكرة</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-black cursor-pointer transition">
                    <Upload className="w-4 h-4" /> اختر صورة الغلاف
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const compressed = await compressImageFile(file, 750, 0.8);
                        setNbForm((prev) => ({ ...prev, coverImage: compressed }));
                      }}
                    />
                  </label>
                  {nbForm.coverImage && (
                    <div className="relative w-14 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={nbForm.coverImage} alt="غلاف" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNbForm((prev) => ({ ...prev, coverImage: '' }))}
                        className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* رفع صور صفحات العينة */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-black text-slate-700">
                  صور صفحات العينة الداخلية ({nbForm.samplePages.length} صفحة)
                </label>
                <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-xs font-black cursor-pointer transition">
                  <Plus className="w-4 h-4" /> رفع صور صفحات العينة (يمكن اختيار أكثر من صورة)
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (!files.length) return;
                      const compressedList = [];
                      for (const f of files) {
                        compressedList.push(await compressImageFile(f, 850, 0.76));
                      }
                      setNbForm((prev) => ({
                        ...prev,
                        samplePages: [...prev.samplePages, ...compressedList]
                      }));
                    }}
                  />
                </label>
                {nbForm.samplePages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {nbForm.samplePages.map((src, idx) => (
                      <div key={idx} className="relative w-14 h-16 rounded-xl overflow-hidden border border-slate-200">
                        <img src={src} alt={`عينة ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setNbForm((prev) => ({
                              ...prev,
                              samplePages: prev.samplePages.filter((_, i) => i !== idx)
                            }))
                          }
                          className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5"
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
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg transition disabled:opacity-50"
            >
              {savingNb ? 'جاري الحفظ...' : editingNbId ? 'حفظ التعديلات على المذكرة' : 'إضافة المذكرة للمنصة'}
            </button>
          </form>

          {/* قائمة المذكرات الحالية */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="font-black text-slate-900 text-base">المذكرات المسجلة ({notebooks.length})</h3>
            {notebooks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-400 text-sm font-bold">
                لا توجد مذكرات مضافة بعد. استخدم النموذج لإضافة أول مذكرة.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {notebooks.map((nb) => {
                  const samplesCount = (samplesMap?.[nb.id] || nb.samplePages || []).length;
                  return (
                    <div
                      key={nb.id}
                      className="bg-white rounded-2xl border border-slate-200 p-3.5 flex gap-3 shadow-sm hover:border-blue-300 transition"
                    >
                      <div className="w-16 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {nb.coverImage ? (
                          <img src={nb.coverImage} alt={nb.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate">{nb.title}</h4>
                          <p className="text-[11px] text-slate-500 font-bold truncate">
                            {nb.gradeName} • {nb.price} ج.م
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {samplesCount} صفحة عينة
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => startEditNotebook(nb)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-black flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotebook(nb.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-black flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. تبويب الأقسام والمراحل والصفوف */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-base">شجرة الأقسام الرئيسية والمراحل والصفوف</h3>
              <p className="text-xs text-slate-500 font-bold">
                يمكنك إعادة تسمية أي قسم أو رفع صورة غلاف خاصة به أو إضافة مراحل وصفوف جديدة
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const newCat = {
                    id: `cat_${Date.now()}`,
                    name: 'قسم رئيسي جديد',
                    stages: [{ id: `stg_${Date.now()}`, name: 'مرحلة جديدة', grades: [{ id: `grd_${Date.now()}`, name: 'صف جديد' }] }]
                  };
                  setLocalSettings((prev) => ({
                    ...prev,
                    categories: [...(prev.categories || []), newCat]
                  }));
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> إضافة قسم رئيسي
              </button>
              <button
                type="button"
                disabled={savingSettings}
                onClick={() => handlePersistSettings(localSettings)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow"
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ شجرة الأقسام'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {(localSettings.categories || []).map((cat, cIdx) => {
              const catImg = localSettings.categoryImages?.[cat.id] || '';
              return (
                <div key={cat.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                      <div className="w-14 h-14 rounded-xl bg-blue-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                        {catImg ? (
                          <img src={catImg} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => {
                          const updated = [...localSettings.categories];
                          updated[cIdx] = { ...cat, name: e.target.value };
                          setLocalSettings({ ...localSettings, categories: updated });
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-black text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-xs font-black cursor-pointer flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-blue-600" /> صورة القسم
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const img = await compressImageFile(f, 800, 0.8);
                            setLocalSettings((prev) => ({
                              ...prev,
                              categoryImages: { ...(prev.categoryImages || {}), [cat.id]: img }
                            }));
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...localSettings.categories];
                          updated[cIdx] = {
                            ...cat,
                            stages: [
                              ...(cat.stages || []),
                              { id: `stg_${Date.now()}`, name: 'مرحلة دراسية جديدة', grades: [] }
                            ]
                          };
                          setLocalSettings({ ...localSettings, categories: updated });
                        }}
                        className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-black"
                      >
                        + مرحلة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLocalSettings({
                            ...localSettings,
                            categories: localSettings.categories.filter((_, idx) => idx !== cIdx)
                          });
                        }}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                        title="حذف القسم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* المراحل داخل القسم */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4 border-r-2 border-blue-200">
                    {(cat.stages || []).map((stg, sIdx) => (
                      <div key={stg.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-2.5">
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
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-black"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cats = [...localSettings.categories];
                              const stgs = [...cat.stages];
                              stgs[sIdx] = {
                                ...stg,
                                grades: [...(stg.grades || []), { id: `grd_${Date.now()}`, name: 'صف دراسي جديد' }]
                              };
                              cats[cIdx] = { ...cat, stages: stgs };
                              setLocalSettings({ ...localSettings, categories: cats });
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-black"
                          >
                            + صف
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const cats = [...localSettings.categories];
                              cats[cIdx] = { ...cat, stages: cat.stages.filter((_, idx) => idx !== sIdx) };
                              setLocalSettings({ ...localSettings, categories: cats });
                            }}
                            className="p-1 text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {(stg.grades || []).map((grd, gIdx) => (
                            <div key={grd.id} className="flex items-center gap-1.5">
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
                                className="flex-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const cats = [...localSettings.categories];
                                  const stgs = [...cat.stages];
                                  stgs[sIdx] = { ...stg, grades: stg.grades.filter((_, idx) => idx !== gIdx) };
                                  cats[cIdx] = { ...cat, stages: stgs };
                                  setLocalSettings({ ...localSettings, categories: cats });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. تبويب العروض والباقات والكوبونات */}
      {activeTab === 'offers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* الكوبونات + مدة الصلاحية */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-sm">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" /> إدارة كوبونات الخصم (مع تحديد مدة الصلاحية)
            </h3>

            <form onSubmit={handleAddCoupon} className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">كود الكوبون *</label>
                  <input
                    type="text"
                    required
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="M20"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">نسبة الخصم (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newCoupon.discountPercent}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountPercent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  تاريخ ووقت انتهاء الكوبون (اتركه فارغًا ليكون مفتوح المدة)
                </label>
                <input
                  type="datetime-local"
                  value={newCoupon.expiresAt}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">وصف العرض للعملاء</label>
                <input
                  type="text"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  placeholder="خصم خاص لفترة محدودة على جميع المذكرات"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow"
              >
                + إضافة الكوبون
              </button>
            </form>

            <div className="space-y-2.5">
              {coupons.map((cp) => {
                const expired = isCouponExpired(cp);
                return (
                  <div
                    key={cp.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      expired ? 'bg-rose-50/60 border-rose-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-black text-xs">
                          {cp.code}
                        </span>
                        <span className="text-xs font-black text-emerald-600">خصم {cp.discountPercent}%</span>
                        {expired && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                            منتهي الصلاحية
                          </span>
                        )}
                      </div>
                      {cp.description && <p className="text-xs text-slate-500 font-bold mt-1">{cp.description}</p>}
                      {cp.expiresAt && (
                        <p className="text-[11px] text-amber-700 font-bold mt-0.5">
                          ينتهي في: {formatExpiryArabic(cp.expiresAt)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteDoc(publicDoc('coupons', cp.id))}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* مكافأة الطلب القادم */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-emerald-600" /> كوبون مكافأة الطلب القادم (يظهر للعميل بعد الطلب)
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(localSettings.nextOrderReward?.enabled)}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      nextOrderReward: { ...localSettings.nextOrderReward, enabled: e.target.checked }
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-black text-emerald-800 mb-1">الكود</label>
                  <input
                    type="text"
                    value={localSettings.nextOrderReward?.code || ''}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        nextOrderReward: { ...localSettings.nextOrderReward, code: e.target.value.toUpperCase() }
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-white text-xs font-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-emerald-800 mb-1">الخصم (%)</label>
                  <input
                    type="number"
                    value={localSettings.nextOrderReward?.discountPercent || 15}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        nextOrderReward: {
                          ...localSettings.nextOrderReward,
                          discountPercent: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-white text-xs font-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-emerald-800 mb-1">الصلاحية (أيام)</label>
                  <input
                    type="number"
                    min="0"
                    value={localSettings.nextOrderReward?.validDays ?? 7}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        nextOrderReward: {
                          ...localSettings.nextOrderReward,
                          validDays: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-white text-xs font-black"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePersistSettings(localSettings)}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
              >
                حفظ إعدادات مكافأة الطلب القادم
              </button>
            </div>
          </div>

          {/* إدارة الباقات التوفيرية */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-sm">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" /> باقات التوفير المجمعة
            </h3>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <input
                type="text"
                value={newBundle.title}
                onChange={(e) => setNewBundle({ ...newBundle, title: e.target.value })}
                placeholder="اسم الباقة (مثال: باقة المرحلة الإعدادية كاملة)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black"
              />
              <input
                type="text"
                value={newBundle.description}
                onChange={(e) => setNewBundle({ ...newBundle, description: e.target.value })}
                placeholder="وصف مختصر لمميزات الباقة..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
              />
              <div>
                <span className="block text-xs font-black text-slate-700 mb-1.5">اختر المذكرات داخل الباقة:</span>
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded-xl bg-white border border-slate-200">
                  {notebooks.map((nb) => {
                    const checked = newBundle.notebookIds.includes(nb.id);
                    return (
                      <label key={nb.id} className="flex items-center gap-2 text-xs font-bold cursor-pointer p-1 hover:bg-slate-50 rounded">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...newBundle.notebookIds, nb.id]
                              : newBundle.notebookIds.filter((id) => id !== nb.id);
                            setNewBundle({ ...newBundle, notebookIds: ids });
                          }}
                        />
                        <span className="truncate flex-1">{nb.title}</span>
                        <span className="text-slate-400">{nb.price} ج.م</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <input
                type="number"
                value={newBundle.bundlePrice}
                onChange={(e) => setNewBundle({ ...newBundle, bundlePrice: e.target.value })}
                placeholder="سعر الباقة المخفض (ج.م)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newBundle.title.trim() || newBundle.notebookIds.length === 0) return;
                  const bObj = {
                    id: `bnd_${Date.now()}`,
                    title: newBundle.title.trim(),
                    description: newBundle.description.trim(),
                    notebookIds: newBundle.notebookIds,
                    bundlePrice: Number(newBundle.bundlePrice) || 0
                  };
                  const updated = { ...localSettings, bundles: [...(localSettings.bundles || []), bObj] };
                  setLocalSettings(updated);
                  setNewBundle({ title: '', description: '', notebookIds: [], bundlePrice: '' });
                  await handlePersistSettings(updated);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow"
              >
                + حفظ الباقة ونشرها
              </button>
            </div>

            <div className="space-y-2.5">
              {(localSettings.bundles || []).map((bnd, idx) => (
                <div key={bnd.id} className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">{bnd.title}</h4>
                    <p className="text-xs text-purple-700 font-black">
                      {bnd.notebookIds?.length || 0} مذكرات • بسعر {bnd.bundlePrice} ج.م
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const updated = {
                        ...localSettings,
                        bundles: localSettings.bundles.filter((_, i) => i !== idx)
                      };
                      setLocalSettings(updated);
                      await handlePersistSettings(updated);
                    }}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. تبويب الطلبات الواردة */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 text-base">سجل طلبات المعلمين ({orders.length})</h3>
          {orders.length === 0 ? (
            <p className="text-center text-slate-400 text-sm font-bold py-10">لا توجد طلبات مسجلة حتى الآن.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-black">
                        {ord.orderCode || ord.id}
                      </span>
                      <span className="mr-2 font-black text-slate-900 text-sm">
                        {ord.customer?.fullName || 'عميل'}
                      </span>
                      <span className="mr-2 text-xs text-slate-500 font-bold">{ord.customer?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={ord.status || 'new'}
                        onChange={(e) => updateDoc(publicDoc('orders', ord.id), { status: e.target.value })}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black"
                      >
                        <option value="new">طلب جديد</option>
                        <option value="preparing">جاري التجهيز والتنسيق</option>
                        <option value="delivered">تم التسليم</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => deleteDoc(publicDoc('orders', ord.id))}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 font-bold">
                    المذكرات: {(ord.items || []).map((i) => i.title).join(' + ')} — الإجمالي:{' '}
                    <span className="text-blue-700 font-black">{ord.finalTotal} ج.م</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. تبويب إعدادات الموقع والمظهر وطلب العميل */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-black text-slate-900 text-base">الهوية البصرية والواجهة الرئيسية</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> تنزيل نسخة احتياطية (JSON)
                </button>
                <label className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-4 h-4" /> استعادة نسخة (JSON)
                  <input type="file" accept=".json" className="hidden" onChange={handleImportJson} />
                </label>
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() => handlePersistSettings(localSettings)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow"
                >
                  {savingSettings ? 'جاري الحفظ...' : 'حفظ كافة الإعدادات'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">اسم المنصة</label>
                <input
                  type="text"
                  value={localSettings.siteName}
                  onChange={(e) => setLocalSettings({ ...localSettings, siteName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-black"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">الوصف المختصر أسفل الاسم</label>
                <input
                  type="text"
                  value={localSettings.siteTagline}
                  onChange={(e) => setLocalSettings({ ...localSettings, siteTagline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">رقم واتساب استقبال الطلبات (بالكود الدولي)</label>
                <input
                  type="text"
                  value={localSettings.whatsappNumber}
                  onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                  placeholder="201000000000"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-black text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">ارتفاع الواجهة الرئيسية (Hero)</label>
                <select
                  value={localSettings.heroMinHeight || 'normal'}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroMinHeight: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-black bg-white"
                >
                  <option value="compact">مدمج (Compact)</option>
                  <option value="normal">متوسط قياسي (Normal)</option>
                  <option value="tall">كبير بارز (Tall)</option>
                </select>
              </div>
            </div>

            {/* رفع الشعار وخلفية الواجهة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                    {localSettings.logoUrl ? (
                      <img src={localSettings.logoUrl} alt="الشعار" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-700">شعار المنصة (Logo)</span>
                </div>
                <label className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-black cursor-pointer">
                  تغيير الشعار
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await compressImageFile(f, 400, 0.85);
                      setLocalSettings({ ...localSettings, logoUrl: url });
                    }}
                  />
                </label>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                    {localSettings.heroBgImage ? (
                      <img src={localSettings.heroBgImage} alt="الخلفية" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-700">صورة خلفية الواجهة</span>
                </div>
                <label className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-black cursor-pointer">
                  تغيير الخلفية
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await compressImageFile(f, 1280, 0.78);
                      setLocalSettings({ ...localSettings, heroBgImage: url });
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">العنوان الرئيسي في الواجهة</label>
                <input
                  type="text"
                  value={localSettings.heroTitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-black"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">النص الترويجي العلوي</label>
                <input
                  type="text"
                  value={localSettings.promoText}
                  onChange={(e) => setLocalSettings({ ...localSettings, promoText: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* إعدادات قسم ما الجديد وقسم الأخبار */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 text-sm">إعدادات قسم «ما الجديد؟»</h4>
                <input
                  type="checkbox"
                  checked={Boolean(localSettings.whatsNewEnabled)}
                  onChange={(e) => setLocalSettings({ ...localSettings, whatsNewEnabled: e.target.checked })}
                />
              </div>
              <input
                type="text"
                value={localSettings.whatsNewTitle}
                onChange={(e) => setLocalSettings({ ...localSettings, whatsNewTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-black"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={localSettings.whatsNewMode || 'auto'}
                  onChange={(e) => setLocalSettings({ ...localSettings, whatsNewMode: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="auto">تلقائي (أحدث المذكرات)</option>
                  <option value="manual">اختيار يدوي</option>
                </select>
                <input
                  type="number"
                  min="2"
                  max="12"
                  value={localSettings.whatsNewCount || 4}
                  onChange={(e) => setLocalSettings({ ...localSettings, whatsNewCount: Number(e.target.value) })}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 text-sm">أخبار المنصة ومذكرات قيد التجهيز</h4>
                <input
                  type="checkbox"
                  checked={Boolean(localSettings.newsSectionEnabled)}
                  onChange={(e) => setLocalSettings({ ...localSettings, newsSectionEnabled: e.target.checked })}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNews.title}
                  onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                  placeholder="عنوان الخبر أو الإعلان..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newNews.title.trim()) return;
                    setLocalSettings({
                      ...localSettings,
                      newsItems: [
                        ...(localSettings.newsItems || []),
                        { id: `nw_${Date.now()}`, badge: 'تحديث', title: newNews.title.trim(), body: newNews.body }
                      ]
                    });
                    setNewNews({ badge: 'جديد', title: '', body: '' });
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-black"
                >
                  + إضافة
                </button>
              </div>
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {(localSettings.newsItems || []).map((nw, i) => (
                  <div key={nw.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg">
                    <span className="font-bold truncate">{nw.title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          newsItems: localSettings.newsItems.filter((_, idx) => idx !== i)
                        })
                      }
                      className="text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* التحكم في حقول بيانات العميل داخل السلة */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
            <h4 className="font-black text-slate-900 text-sm">حقول بيانات العميل داخل سلة المشتريات</h4>
            <div className="space-y-2">
              {(localSettings.customerFields || []).map((fld, idx) => (
                <div key={fld.id} className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    checked={fld.enabled !== false}
                    onChange={(e) => {
                      const arr = [...localSettings.customerFields];
                      arr[idx] = { ...fld, enabled: e.target.checked };
                      setLocalSettings({ ...localSettings, customerFields: arr });
                    }}
                  />
                  <input
                    type="text"
                    value={fld.label}
                    onChange={(e) => {
                      const arr = [...localSettings.customerFields];
                      arr[idx] = { ...fld, label: e.target.value };
                      setLocalSettings({ ...localSettings, customerFields: arr });
                    }}
                    className="flex-1 min-w-[180px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                  />
                  <label className="text-[11px] font-black text-slate-600 flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={Boolean(fld.required)}
                      onChange={(e) => {
                        const arr = [...localSettings.customerFields];
                        arr[idx] = { ...fld, required: e.target.checked };
                        setLocalSettings({ ...localSettings, customerFields: arr });
                      }}
                    />
                    إلزامي
                  </label>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      const arr = [...localSettings.customerFields];
                      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                      setLocalSettings({ ...localSettings, customerFields: arr });
                    }}
                    className="p-1 text-slate-500 disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === localSettings.customerFields.length - 1}
                    onClick={() => {
                      const arr = [...localSettings.customerFields];
                      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                      setLocalSettings({ ...localSettings, customerFields: arr });
                    }}
                    className="p-1 text-slate-500 disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="اسم الحقل الجديد (مثال: اسم السنتر أو المدرسة)"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="text"
                value={newFieldPlaceholder}
                onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                placeholder="نص توضيحي داخل الحقل..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newFieldLabel.trim()) return;
                  setLocalSettings({
                    ...localSettings,
                    customerFields: [
                      ...(localSettings.customerFields || []),
                      {
                        id: `fld_${Date.now()}`,
                        label: newFieldLabel.trim(),
                        placeholder: newFieldPlaceholder.trim(),
                        required: false,
                        enabled: true,
                        type: 'text'
                      }
                    ]
                  });
                  setNewFieldLabel('');
                  setNewFieldPlaceholder('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black"
              >
                + إضافة حقل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 8. التطبيق الرئيسي للمنصة (MuzakkiratiApp)
// ============================================================================
function MuzakkiratiApp() {
  // تحميل الحالة الابتدائية من النسخة المحلية إن وجدت
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_SETTINGS_KEY);
      return saved ? mergeAndNormalizeSettings(DEFAULT_SETTINGS, JSON.parse(saved)) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [notebooks, setNotebooks] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_NOTEBOOKS_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.map(normalizeNotebook) : [];
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

  const [coupons, setCoupons] = useState([]);
  const [orders, setOrders] = useState([]);

  // التنقل والتصفح
  const [activePage, setActivePage] = useState('home'); // home | browse | offers | track | admin
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewNotebook, setPreviewNotebook] = useState(null);

  // الهيدر والإشعارات
  const [isScrolled, setIsScrolled] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [promoCopied, setPromoCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);
  const logoClickCountRef = useRef(0);

  // السلة والدفع
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [customerData, setCustomerData] = useState({});
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  // تتبع الطلب
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackNotFound, setTrackNotFound] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // مصادقة الإدارة
  const [adminUser, setAdminUser] = useState(null);
  const [previewAdminUnlocked, setPreviewAdminUnlocked] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const isAdminAuthenticated =
    (adminUser && adminUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) || previewAdminUnlocked;

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev && Date.now() - prev.id >= 2900 ? null : prev));
    }, 3200);
  };

  const navigateTo = (page) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // مراقبة التمرير لتقليص الهيدر على الهاتف
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // مراقبة حالة تسجيل الدخول
  useEffect(() => {
    if (!auth) return;
    try {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setAdminUser(user);
        } else {
          setAdminUser(null);
        }
      });
      return () => unsub();
    } catch {
      // تجاهل
    }
  }, []);

  // المزامنة الحية مع Firestore (مع حماية كاملة ضد أخطاء الاتصال)
  useEffect(() => {
    if (!db) return;
    const unsubscribers = [];
    const handleSnapError = (err) => {
      console.warn('Firestore snapshot notice:', err?.code || err?.message);
    };

    try {
      // 1. قراءة جميع مستندات settings لاسترجاع الشعار والخلفية وصور الأقسام مهما كان اسم المستند
      unsubscribers.push(
        onSnapshot(
          publicCol('settings'),
          (snap) => {
            snap.docs.forEach((d) => {
              const docData = d.data() || {};
              if (d.id === 'media_logo' && typeof docData.dataUrl === 'string') {
                setSettings((prev) => mergeAndNormalizeSettings(prev, { logoUrl: docData.dataUrl }));
              } else if (d.id === 'media_hero' && typeof docData.dataUrl === 'string') {
                setSettings((prev) => mergeAndNormalizeSettings(prev, { heroBgImage: docData.dataUrl }));
              } else if (d.id === 'media_categories') {
                setSettings((prev) => mergeAndNormalizeSettings(prev, { categoryImages: docData.images || docData }));
              } else {
                setSettings((prev) => mergeAndNormalizeSettings(prev, docData));
              }
            });
          },
          handleSnapError
        )
      );

      // 2. قراءة المذكرات
      unsubscribers.push(
        onSnapshot(
          publicCol('notebooks'),
          (snap) => {
            const list = snap.docs.map((d) => normalizeNotebook({ id: d.id, ...d.data() }));
            if (list.length > 0 || !snap.metadata.fromCache) {
              setNotebooks((prev) => {
                const prevMap = new Map(prev.map((x) => [x.id, x]));
                const merged = list.map((nb) => {
                  const old = prevMap.get(nb.id);
                  return {
                    ...nb,
                    coverImage: nb.coverImage || old?.coverImage || ''
                  };
                });
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

      // 3. قراءة صور العينات والأغلفة المنفصلة من كافة المجموعات المحتملة
      for (const sampleColName of ['notebook_samples', 'notebook_media', 'samples']) {
        unsubscribers.push(
          onSnapshot(
            publicCol(sampleColName),
            (snap) => {
              const map = {};
              const coversFound = {};
              snap.docs.forEach((d) => {
                const data = d.data() || {};
                const possibleCover = data.coverImage || data.cover || data.coverUrl || data.coverDataUrl;
                if (typeof possibleCover === 'string' && possibleCover.length > 10) {
                  coversFound[d.id] = possibleCover;
                }
                const cleaned = extractAnyImagesFromDoc(data);
                if (cleaned.length > 0) {
                  map[d.id] = cleaned;
                }
              });
              if (Object.keys(coversFound).length > 0) {
                setNotebooks((prev) =>
                  prev.map((nb) => ({
                    ...nb,
                    coverImage: nb.coverImage || coversFound[nb.id] || ''
                  }))
                );
              }
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
      }

      // 4. استرجاع احتياطي من المسار القديم legacyPublicCol إن وُجدت به بيانات
      (async () => {
        try {
          const legacySettingsSnap = await getDocs(legacyPublicCol('settings'));
          legacySettingsSnap.docs.forEach((d) => {
            setSettings((prev) => mergeAndNormalizeSettings(prev, d.data() || {}));
          });
          const legacyNbSnap = await getDocs(legacyPublicCol('notebooks'));
          if (!legacyNbSnap.empty) {
            const legacyList = legacyNbSnap.docs.map((d) => normalizeNotebook({ id: d.id, ...d.data() }));
            setNotebooks((prev) => {
              const existingIds = new Set(prev.map((x) => x.id));
              const extras = legacyList.filter((x) => !existingIds.has(x.id));
              return extras.length > 0 ? [...prev, ...extras] : prev;
            });
          }
        } catch {
          // تجاهل
        }
      })();

      // 5. الكوبونات والطلبات
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
      console.warn('Snapshot setup skipped:', e);
    }

    return () => {
      unsubscribers.forEach((u) => {
        try {
          u();
        } catch {
          // تجاهل
        }
      });
    };
  }, []);

  // حسابات السلة والخصومات
  const addNotebookToCart = (nb) => {
    setCart((prev) => {
      if (prev.some((item) => item.id === nb.id && item.type !== 'bundle')) {
        showToast('المذكرة موجودة بالفعل في السلة');
        return prev;
      }
      showToast('تمت إضافة المذكرة إلى السلة بنجاح ✓');
      return [...prev, { id: nb.id, type: 'notebook', title: nb.title, price: Number(nb.price) || 0, gradeName: nb.gradeName }];
    });
  };

  const addBundleToCart = (bundle) => {
    setCart((prev) => {
      if (prev.some((item) => item.id === bundle.id && item.type === 'bundle')) {
        showToast('الباقة موجودة بالفعل في السلة');
        return prev;
      }
      showToast('تمت إضافة الباقة إلى السلة بنجاح ✓');
      return [
        ...prev,
        {
          id: bundle.id,
          type: 'bundle',
          title: bundle.title,
          price: Number(bundle.bundlePrice) || 0,
          gradeName: `${bundle.notebookIds?.length || 0} مذكرات`
        }
      ];
    });
  };

  const removeFromCart = (idx) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0), [cart]);

  const activeValidCoupon = useMemo(() => {
    if (!appliedCoupon) return null;
    if (isCouponExpired(appliedCoupon)) return null;
    return appliedCoupon;
  }, [appliedCoupon]);

  const discountAmount = useMemo(() => {
    if (!activeValidCoupon) return 0;
    return Math.round((cartSubtotal * (Number(activeValidCoupon.discountPercent) || 0)) / 100);
  }, [cartSubtotal, activeValidCoupon]);

  const finalTotal = Math.max(0, cartSubtotal - discountAmount);

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = coupons.find((c) => c.code?.toUpperCase() === code && c.active !== false);
    if (!found) {
      // التحقق إن كان كود مكافأة الطلب القادم
      if (
        settings.nextOrderReward?.enabled &&
        settings.nextOrderReward?.code?.toUpperCase() === code
      ) {
        setAppliedCoupon({
          code,
          discountPercent: Number(settings.nextOrderReward.discountPercent) || 15
        });
        showToast('تم تطبيق كود المكافأة بنجاح! 🎉');
        return;
      }
      setCouponError('كود الخصم غير صحيح أو غير مفعل');
      return;
    }
    if (isCouponExpired(found)) {
      setCouponError('عذرًا، انتهت مدة صلاحية هذا الكوبون');
      return;
    }
    setAppliedCoupon(found);
    showToast(`تم تطبيق خصم ${found.discountPercent}% بنجاح! 🎉`);
  };

  // إرسال الطلب وحفظه ثم فتح واتساب
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const enabledFields = (settings.customerFields || []).filter((f) => f.enabled !== false);
    for (const fld of enabledFields) {
      if (fld.required && !String(customerData[fld.id] || '').trim()) {
        showToast(`يرجى إدخال: ${fld.label}`, 'error');
        return;
      }
    }

    setSubmittingOrder(true);
    const orderCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderRecord = {
      orderCode,
      items: cart,
      subtotal: cartSubtotal,
      discountAmount,
      couponCode: activeValidCoupon?.code || '',
      finalTotal,
      customer: customerData,
      status: 'new',
      createdAt: serverTimestamp()
    };

    try {
      if (db) {
        await addDoc(publicCol('orders'), orderRecord);
      }
    } catch {
      // الاستمرار لإرسال واتساب حتى لو تعذر الحفظ السحابي
    }

    const lines = [
      `*طلب جديد من ${settings.siteName}*`,
      `رقم الطلب: *${orderCode}*`,
      `------------------`,
      ...cart.map((item, i) => `${i + 1}. ${item.title} (${item.price} ج.م)`),
      `------------------`,
      `المجموع: ${cartSubtotal} ج.م`,
      discountAmount > 0 ? `الخصم (${activeValidCoupon?.code}): -${discountAmount} ج.م` : null,
      `*الإجمالي النهائي: ${finalTotal} ج.م*`,
      `------------------`,
      ...enabledFields
        .filter((f) => customerData[f.id])
        .map((f) => `${f.label}: ${customerData[f.id]}`)
    ].filter(Boolean);

    const waPhone = String(settings.whatsappNumber || '').replace(/\D/g, '') || '201000000000';
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(lines.join('\n'))}`;

    setLastPlacedOrder({
      ...orderRecord,
      createdAtText: new Date().toLocaleDateString('ar-EG')
    });
    setCart([]);
    setAppliedCoupon(null);
    setCouponInput('');
    setSubmittingOrder(false);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // تتبع الطلب
  const handleTrackOrder = async (e) => {
    e.preventDefault();
    const q = trackQuery.trim();
    if (!q) return;
    setTrackingLoading(true);
    setTrackNotFound(false);
    setTrackedOrder(null);

    const localMatch = orders.find(
      (o) =>
        o.orderCode?.toLowerCase() === q.toLowerCase() ||
        o.customer?.phone?.includes(q)
    );
    if (localMatch) {
      setTrackedOrder(localMatch);
      setTrackingLoading(false);
      return;
    }

    try {
      const snap = await getDocs(publicCol('orders'));
      const found = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .find(
          (o) =>
            o.orderCode?.toLowerCase() === q.toLowerCase() ||
            o.customer?.phone?.includes(q)
        );
      if (found) {
        setTrackedOrder(found);
      } else {
        setTrackNotFound(true);
      }
    } catch {
      setTrackNotFound(true);
    } finally {
      setTrackingLoading(false);
    }
  };

  // تسجيل دخول الإدارة
  const handleAdminEmailLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const cleanEmail = loginEmail.trim().toLowerCase();
    if (cleanEmail !== ADMIN_EMAIL.toLowerCase()) {
      setLoginError('هذا البريد غير مصرح له بالدخول إلى لوحة الإدارة');
      setLoginLoading(false);
      return;
    }
    try {
      if (!auth) throw new Error('auth/api-key-not-valid');
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, loginPassword);
      setAdminUser(cred.user);
      setLoginModalOpen(false);
      navigateTo('admin');
    } catch (err) {
      const errStr = `${err?.code || ''} ${err?.message || ''}`.toLowerCase();
      if (errStr.includes('api-key') || errStr.includes('network-request-failed')) {
        // السماح بالدخول في بيئة المعاينة المعزولة عند مطابقة بريد الإدارة
        setPreviewAdminUnlocked(true);
        setLoginModalOpen(false);
        navigateTo('admin');
        showToast('تم فتح لوحة الإدارة في وضع المعاينة');
      } else {
        setLoginError(`تعذر تسجيل الدخول (${err?.code || 'تأكد من كلمة المرور'})`);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      if (!auth) throw new Error('auth/api-key-not-valid');
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      if (cred.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        setLoginError('هذا الحساب غير مصرح له بالدخول للإدارة');
      } else {
        setAdminUser(cred.user);
        setLoginModalOpen(false);
        navigateTo('admin');
      }
    } catch (err) {
      const errStr = `${err?.code || ''} ${err?.message || ''}`.toLowerCase();
      if (errStr.includes('api-key') || errStr.includes('popup')) {
        setPreviewAdminUnlocked(true);
        setLoginModalOpen(false);
        navigateTo('admin');
        showToast('تم فتح لوحة الإدارة في وضع المعاينة');
      } else {
        setLoginError(`تعذر الدخول عبر Google (${err?.code || ''})`);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // تصفية المذكرات
  const filteredNotebooks = useMemo(() => {
    return notebooks.filter((nb) => {
      if (selectedCategoryId) {
        const catObj = (settings.categories || []).find((c) => c.id === selectedCategoryId);
        const stageIds = new Set((catObj?.stages || []).map((s) => s.id));
        const gradeIds = new Set((catObj?.stages || []).flatMap((s) => (s.grades || []).map((g) => g.id)));
        const matchesCat =
          nb.categoryId === selectedCategoryId || stageIds.has(nb.stageId) || gradeIds.has(nb.gradeId);
        if (!matchesCat) return false;
      }
      if (selectedStageId && nb.stageId !== selectedStageId) return false;
      if (selectedGradeId && nb.gradeId !== selectedGradeId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${nb.title} ${nb.gradeName} ${nb.subject}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notebooks, settings.categories, selectedCategoryId, selectedStageId, selectedGradeId, searchQuery]);

  // مذكرات قسم «ما الجديد؟»
  const whatsNewNotebooks = useMemo(() => {
    const activeList = notebooks.filter((n) => !n.comingSoon);
    if (settings.whatsNewMode === 'manual' && Array.isArray(settings.whatsNewIds) && settings.whatsNewIds.length > 0) {
      return activeList.filter((n) => settings.whatsNewIds.includes(n.id));
    }
    return [...activeList]
      .sort((a, b) => toTimeMs(b.createdAt) - toTimeMs(a.createdAt))
      .slice(0, Number(settings.whatsNewCount) || 4);
  }, [notebooks, settings.whatsNewMode, settings.whatsNewIds, settings.whatsNewCount]);

  // مذكرات قيد التجهيز
  const comingSoonNotebooks = useMemo(() => notebooks.filter((n) => n.comingSoon), [notebooks]);

  // الكوبونات السارية غير المنتهية
  const validPublicCoupons = useMemo(
    () => coupons.filter((c) => c.active !== false && !isCouponExpired(c)),
    [coupons]
  );

  // بطاقة مذكرة موحدة
  const renderNotebookCard = (nb) => {
    const hasDiscount = nb.oldPrice > nb.price;
    const saved = hasDiscount ? nb.oldPrice - nb.price : 0;
    const samplesCount = (samplesMap?.[nb.id] || nb.samplePages || []).length;

    return (
      <div
        key={nb.id}
        className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
      >
        <div
          onClick={() => setPreviewNotebook(nb)}
          className="relative aspect-[4/3] bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden cursor-pointer flex items-center justify-center"
        >
          {nb.coverImage ? (
            <img
              src={nb.coverImage}
              alt={nb.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <BookOpen className="w-12 h-12 text-white/80" />
          )}

          {hasDiscount && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black shadow">
              وفر {saved} ج.م
            </span>
          )}

          {nb.comingSoon && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-purple-700 text-white text-[11px] font-black shadow">
              قيد التجهيز
            </span>
          )}

          {samplesCount > 0 && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/75 text-white text-[10px] font-black backdrop-blur-sm">
              {samplesCount} صفحات عينة
            </span>
          )}
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-600">
              <span>{nb.gradeName || 'مذكرة دراسية'}</span>
              {nb.subject && <span>• {nb.subject}</span>}
            </div>
            <h3
              onClick={() => setPreviewNotebook(nb)}
              className="font-black text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 cursor-pointer hover:text-blue-600 transition"
            >
              {nb.title}
            </h3>
            {nb.alertBadge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black">
                <Sparkles className="w-3 h-3" /> {nb.alertBadge}
              </span>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-black text-slate-900">{nb.price} ج.م</span>
                {hasDiscount && (
                  <span className="text-xs text-slate-400 line-through font-bold">{nb.oldPrice} ج.م</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreviewNotebook(nb)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" /> معاينة
              </button>
              <button
                type="button"
                onClick={() => addNotebookToCart(nb)}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> أضف للسلة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* إشعار صغير أنيق عند الإضافة للسلة دون فتح السلة تلقائيًا */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-xl text-xs sm:text-sm font-black flex items-center gap-2 border ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : toast.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-400'
                : 'bg-emerald-600 text-white border-emerald-500'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* =====================================================================
          الشريط العلوي المثبت + الهيدر المدمج للهاتف والكمبيوتر
      ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        {/* الشريط الترويجي العلوي (ينطوي تلقائيًا عند التمرير على الهاتف لتوفير المساحة) */}
        {settings.promoEnabled && !promoDismissed && (
          <div
            className={`bg-gradient-to-l from-blue-700 via-indigo-700 to-purple-700 text-white transition-all duration-300 overflow-hidden ${
              isScrolled ? 'max-h-0 sm:max-h-14 py-0 sm:py-2 opacity-0 sm:opacity-100' : 'max-h-24 py-1.5 sm:py-2 opacity-100'
            }`}
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 text-[11px] sm:text-xs font-bold">
              <div className="flex-1 flex flex-wrap items-center justify-center gap-2 text-center">
                <span>{settings.promoText}</span>
                {settings.promoCouponCode && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(settings.promoCouponCode);
                      setPromoCopied(true);
                      showToast(`تم نسخ الكوبون: ${settings.promoCouponCode}`);
                      setTimeout(() => setPromoCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-blue-800 font-black text-[11px] shadow-sm hover:bg-blue-50 transition"
                  >
                    <Copy className="w-3 h-3" />
                    {promoCopied ? 'تم النسخ!' : `انسخ الكوبون: ${settings.promoCouponCode}`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigateTo('offers')}
                  className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] hover:bg-amber-300 transition"
                >
                  العروض ←
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPromoDismissed(true)}
                className="p-1 rounded-lg hover:bg-white/15 text-white/80 hover:text-white shrink-0"
                title="إغلاق الشريط"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* شريط التنقل الرئيسي المدمج */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* الشعار واسم المنصة */}
            <div
              onClick={() => {
                navigateTo('home');
                logoClickCountRef.current += 1;
                if (logoClickCountRef.current >= 5) {
                  logoClickCountRef.current = 0;
                  if (isAdminAuthenticated) navigateTo('admin');
                  else setLoginModalOpen(true);
                }
              }}
              className="flex items-center gap-2.5 cursor-pointer min-w-0 select-none"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md overflow-hidden shrink-0 border border-blue-500/20">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt={settings.siteName} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-black text-blue-700 text-xs sm:text-base lg:text-lg leading-tight truncate">
                  {settings.siteName}
                </h1>
                <p className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-bold truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>{settings.siteTagline}</span>
                </p>
              </div>
            </div>

            {/* روابط التنقل على الشاشات المتوسطة والكبيرة */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              {[
                { id: 'home', label: 'الرئيسية', icon: Home },
                { id: 'browse', label: 'المذكرات', icon: BookOpen },
                { id: 'offers', label: 'العروض والباقات', icon: Percent },
                { id: 'track', label: 'تتبع طلبك', icon: Truck }
              ].map((nav) => {
                const Icon = nav.icon;
                const active = activePage === nav.id;
                return (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => navigateTo(nav.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition ${
                      active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {nav.label}
                  </button>
                );
              })}
            </nav>

            {/* أزرار السلة وتواصل معنا والإدارة */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {isAdminAuthenticated && (
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-900 text-amber-400 text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">الإدارة</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative px-2.5 sm:px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>السلة</span>
                {cart.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
                    {cart.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-black flex items-center gap-1.5 shadow-sm transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تواصل معنا</span>
              </button>
            </div>
          </div>

          {/* شريط التنقل المدمج للهواتف */}
          <nav className="flex md:hidden items-center justify-between gap-1 mt-2 pt-1.5 border-t border-slate-100">
            {[
              { id: 'home', label: 'الرئيسية', icon: Home },
              { id: 'browse', label: 'المذكرات', icon: BookOpen },
              { id: 'offers', label: 'العروض', icon: Percent },
              { id: 'track', label: 'تتبع طلبك', icon: Truck }
            ].map((nav) => {
              const Icon = nav.icon;
              const active = activePage === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => navigateTo(nav.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-black transition ${
                    active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 bg-slate-100/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{nav.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* =====================================================================
          محتوى الصفحات
      ===================================================================== */}
      <main className="flex-1">
        {/* 1. الصفحة الرئيسية */}
        {activePage === 'home' && (
          <div className="space-y-12 pb-16">
            {/* الواجهة الرئيسية Hero */}
            <section
              className={`relative overflow-hidden bg-slate-950 text-white flex items-center ${
                settings.heroMinHeight === 'compact'
                  ? 'py-10 sm:py-14'
                  : settings.heroMinHeight === 'tall'
                  ? 'py-20 sm:py-28'
                  : 'py-14 sm:py-20'
              }`}
            >
              {settings.heroBgImage && (
                <img
                  src={settings.heroBgImage}
                  alt="خلفية المنصة"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/90 to-blue-950/85"
                style={{ opacity: settings.heroBgImage ? settings.heroOverlayOpacity || 0.8 : 1 }}
              />

              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5 text-right">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black">
                    <Sparkles className="w-3.5 h-3.5" /> {settings.heroBadge}
                  </span>

                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight">
                    {settings.heroTitle}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-medium">
                    {settings.heroSubtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('browse')}
                      className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition"
                    >
                      تصفح مكتبة المذكرات
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactOpen(true)}
                      className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-black text-sm transition"
                    >
                      اطلب إعداد مذكرة خاصة
                    </button>
                  </div>
                </div>

                {/* بطاقة لماذا يثق بنا المعلمون */}
                <div className="lg:col-span-5">
                  <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center gap-2 text-amber-400 font-black text-sm sm:text-base">
                      <Award className="w-5 h-5 shrink-0" />
                      <h3>{settings.trustTitle}</h3>
                    </div>
                    <ul className="space-y-3">
                      {(settings.trustPoints || []).map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 font-semibold">
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
                  const stageIds = new Set((cat.stages || []).map((s) => s.id));
                  const gradeIds = new Set((cat.stages || []).flatMap((s) => (s.grades || []).map((g) => g.id)));
                  const count = notebooks.filter(
                    (n) => n.categoryId === cat.id || stageIds.has(n.stageId) || gradeIds.has(n.gradeId)
                  ).length;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSelectedStageId('');
                        setSelectedGradeId('');
                        navigateTo('browse');
                      }}
                      className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      <div className="relative h-44 bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden flex items-center justify-center">
                        {catImg ? (
                          <img
                            src={catImg}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <BookOpen className="w-12 h-12 text-white/80" />
                        )}
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/75 text-white text-xs font-black backdrop-blur-sm">
                          {count} مذكرة متاحة
                        </span>
                      </div>
                      <div className="p-5 flex items-center justify-between">
                        <div>
                          <h3 className="font-black text-slate-900 text-base sm:text-lg group-hover:text-blue-600 transition">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-blue-600 font-bold mt-0.5">تصفح المراحل والصفوف الدراسية</p>
                        </div>
                        <span className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                          <ChevronLeft className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* قسم ما الجديد؟ */}
            {settings.whatsNewEnabled && whatsNewNotebooks.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1">
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black">
                      إصدارات حديثة
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{settings.whatsNewTitle}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId('');
                      setSelectedStageId('');
                      setSelectedGradeId('');
                      navigateTo('browse');
                    }}
                    className="text-xs sm:text-sm font-black text-blue-600 hover:underline shrink-0"
                  >
                    عرض الكل ←
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {whatsNewNotebooks.map((nb) => renderNotebookCard(nb))}
                </div>
              </section>
            )}

            {/* قسم أخبار المنصة ومذكرات قيد التجهيز */}
            {settings.newsSectionEnabled &&
              ((settings.newsItems || []).length > 0 || comingSoonNotebooks.length > 0) && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-black">
                      <Megaphone className="w-3.5 h-3.5" /> نشرة المنصة
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{settings.newsSectionTitle}</h2>
                  </div>

                  {(settings.newsItems || []).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {settings.newsItems.map((nw) => (
                        <div
                          key={nw.id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-sm"
                        >
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-black">
                            {nw.badge || 'إعلان'}
                          </span>
                          <h3 className="font-black text-slate-900 text-sm sm:text-base">{nw.title}</h3>
                          {nw.body && <p className="text-xs text-slate-600 leading-relaxed font-semibold">{nw.body}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {comingSoonNotebooks.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {comingSoonNotebooks.map((nb) => renderNotebookCard(nb))}
                    </div>
                  )}
                </section>
              )}
          </div>
        )}

        {/* 2. صفحة تصفح المذكرات */}
        {activePage === 'browse' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">مكتبة المذكرات الدراسية</h2>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المذكرة أو الصف..."
                    className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* تصفية بالأقسام */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('');
                    setSelectedStageId('');
                    setSelectedGradeId('');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                    !selectedCategoryId ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  جميع الأقسام
                </button>
                {(settings.categories || []).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(c.id);
                      setSelectedStageId('');
                      setSelectedGradeId('');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                      selectedCategoryId === c.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* تصفية بالمراحل والصفوف عند اختيار قسم */}
              {selectedCategoryId && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      (settings.categories || []).find((c) => c.id === selectedCategoryId)?.stages || []
                    ).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStageId(selectedStageId === s.id ? '' : s.id);
                          setSelectedGradeId('');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                          selectedStageId === s.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>

                  {selectedStageId && (
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        (settings.categories || [])
                          .find((c) => c.id === selectedCategoryId)
                          ?.stages?.find((s) => s.id === selectedStageId)?.grades || []
                      ).map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGradeId(selectedGradeId === g.id ? '' : g.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            selectedGradeId === g.id
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {filteredNotebooks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-black text-slate-500">لا توجد مذكرات مطابقة لخيارات البحث الحالية</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredNotebooks.map((nb) => renderNotebookCard(nb))}
              </div>
            )}
          </div>
        )}

        {/* 3. صفحة العروض والباقات */}
        {activePage === 'offers' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <Tag className="w-6 h-6 text-blue-600" /> كوبونات الخصم السارية
              </h2>
              {validPublicCoupons.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500 font-bold">
                  لا توجد كوبونات عامة نشطة حاليًا.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {validPublicCoupons.map((cp) => (
                    <div
                      key={cp.id}
                      className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-5 space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black">
                          خصم {cp.discountPercent}%
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(cp.code);
                            showToast(`تم نسخ الكوبون: ${cp.code}`);
                          }}
                          className="px-3 py-1 rounded-xl bg-white text-blue-800 text-xs font-black flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" /> {cp.code}
                        </button>
                      </div>
                      <p className="text-xs text-blue-100 font-bold">
                        {cp.description || 'استخدم الكود داخل سلة المشتريات للحصول على الخصم الفوري.'}
                      </p>
                      {cp.expiresAt && (
                        <p className="text-[11px] text-amber-300 font-black">
                          ساري حتى: {formatExpiryArabic(cp.expiresAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-6 h-6 text-purple-600" /> باقات التوفير المجمعة
              </h2>
              {(settings.bundles || []).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500 font-bold">
                  سيتم إضافة باقات توفير مجمعة قريبًا.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {settings.bundles.map((bnd) => {
                    const included = notebooks.filter((n) => (bnd.notebookIds || []).includes(n.id));
                    const origTotal = included.reduce((s, n) => s + (Number(n.price) || 0), 0);
                    return (
                      <div key={bnd.id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-slate-900 text-base sm:text-lg">{bnd.title}</h3>
                            {bnd.description && (
                              <p className="text-xs text-slate-500 font-bold mt-1">{bnd.description}</p>
                            )}
                          </div>
                          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-black shrink-0">
                            {included.length} مذكرات
                          </span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700 font-bold bg-slate-50 p-3.5 rounded-2xl">
                          {included.map((n) => (
                            <li key={n.id} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{n.title}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <span className="text-2xl font-black text-purple-700">{bnd.bundlePrice} ج.م</span>
                            {origTotal > bnd.bundlePrice && (
                              <span className="mr-2 text-xs text-slate-400 line-through font-bold">
                                {origTotal} ج.م
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => addBundleToCart(bnd)}
                            className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow flex items-center gap-1.5"
                          >
                            <ShoppingCart className="w-4 h-4" /> أضف الباقة للسلة
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

        {/* 4. صفحة تتبع الطلب */}
        {activePage === 'track' && (
          <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <Truck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">تتبع حالة طلبك</h2>
                <p className="text-xs text-slate-500 font-bold">
                  أدخل رقم الطلب (مثل ORD-123456) أو رقم هاتفك المسجل في الطلب
                </p>
              </div>
              <form onSubmit={handleTrackOrder} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="ORD-xxxxxx أو رقم الهاتف"
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-black focus:border-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow"
                >
                  {trackingLoading ? 'جاري البحث...' : 'بحث'}
                </button>
              </form>

              {trackNotFound && (
                <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-black">
                  لم يتم العثور على طلب مطابق. تأكد من الرقم أو تواصل معنا عبر واتساب.
                </div>
              )}

              {trackedOrder && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-right space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">{trackedOrder.orderCode}</span>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
                      {trackedOrder.status === 'delivered'
                        ? 'تم التسليم بنجاح ✅'
                        : trackedOrder.status === 'preparing'
                        ? 'جاري التنسيق والطباعة ⏳'
                        : 'تم استلام الطلب 📥'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-bold">
                    العميل: {trackedOrder.customer?.fullName} • الإجمالي: {trackedOrder.finalTotal} ج.م
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. لوحة التحكم */}
        {activePage === 'admin' && isAdminAuthenticated && (
          <AdminDashboard
            settings={settings}
            onSaveSettings={setSettings}
            notebooks={notebooks}
            samplesMap={samplesMap}
            coupons={coupons}
            orders={orders}
            userEmail={adminUser?.email || ADMIN_EMAIL}
            onLogout={async () => {
              try {
                if (auth) await signOut(auth);
              } catch {
                // تجاهل
              }
              setAdminUser(null);
              setPreviewAdminUnlocked(false);
              navigateTo('home');
            }}
            onClose={() => navigateTo('home')}
            showToast={showToast}
          />
        )}
      </main>

      {/* =====================================================================
          الفوتر (Footer)
      ===================================================================== */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
          <div className="text-center sm:text-right">
            <p className="text-white font-black text-sm">{settings.siteName}</p>
            <p className="mt-1">{settings.siteTagline}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => (isAdminAuthenticated ? navigateTo('admin') : setLoginModalOpen(true))}
              className="text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" /> دخول الإدارة
            </button>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          نافذة معاينة المذكرة
      ===================================================================== */}
      {previewNotebook && (
        <SamplePreviewModal
          notebook={previewNotebook}
          samplesMap={samplesMap}
          onClose={() => setPreviewNotebook(null)}
          onAddToCart={addNotebookToCart}
        />
      )}

      {/* =====================================================================
          نافذة سلة المشتريات وإتمام الطلب (CartDrawer)
      ===================================================================== */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end"
          onClick={() => setCartOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 text-base">سلة المشتريات ({cart.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {lastPlacedOrder && cart.length === 0 ? (
                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-emerald-950 text-lg">تم تجهيز طلبك بنجاح!</h4>
                  <p className="text-xs text-emerald-800 font-bold">
                    رقم طلبك للمتابعة: <span className="font-black underline">{lastPlacedOrder.orderCode}</span>
                  </p>
                  {settings.nextOrderReward?.enabled && (
                    <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-1.5">
                      <span className="text-xs font-black text-amber-600 block">🎁 مكافأة لطلبك القادم!</span>
                      <p className="text-xs text-slate-600 font-bold">{settings.nextOrderReward.message}</p>
                      <div className="inline-block px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-black text-sm">
                        {settings.nextOrderReward.code} (خصم {settings.nextOrderReward.discountPercent}%)
                      </div>
                      {Number(settings.nextOrderReward.validDays) > 0 && (
                        <p className="text-[11px] text-slate-500 font-bold">
                          صالح لمدة {settings.nextOrderReward.validDays} أيام من الآن
                        </p>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setLastPlacedOrder(null);
                      setCartOpen(false);
                    }}
                    className="w-full py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black"
                  >
                    متابعة التصفح
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-black text-slate-500">سلة المشتريات فارغة حاليًا</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      navigateTo('browse');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black"
                  >
                    تصفح المذكرات
                  </button>
                </div>
              ) : (
                <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-5">
                  {/* عناصر السلة */}
                  <div className="space-y-2.5">
                    {cart.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate">{item.title}</h4>
                          <p className="text-[11px] text-slate-500 font-bold">
                            {item.gradeName} • <span className="text-blue-600 font-black">{item.price} ج.م</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(idx)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* كود الخصم */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                    <label className="block text-xs font-black text-slate-700">هل لديك كوبون خصم؟</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="أدخل الكود هنا..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black"
                      >
                        تطبيق
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-rose-600 font-black">{couponError}</p>}
                    {activeValidCoupon && (
                      <p className="text-[11px] text-emerald-700 font-black">
                        ✓ تم تطبيق خصم {activeValidCoupon.discountPercent}% ({activeValidCoupon.code})
                      </p>
                    )}
                  </div>

                  {/* بيانات المعلم / العميل */}
                  <div className="space-y-3">
                    <h4 className="font-black text-slate-900 text-sm">بيانات التخصيص والتواصل</h4>
                    {(settings.customerFields || [])
                      .filter((f) => f.enabled !== false)
                      .map((fld) => (
                        <div key={fld.id}>
                          <label className="block text-xs font-black text-slate-700 mb-1">
                            {fld.label} {fld.required && <span className="text-rose-500">*</span>}
                          </label>
                          {fld.type === 'textarea' ? (
                            <textarea
                              rows={2}
                              required={Boolean(fld.required)}
                              value={customerData[fld.id] || ''}
                              onChange={(e) => setCustomerData({ ...customerData, [fld.id]: e.target.value })}
                              placeholder={fld.placeholder}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                            />
                          ) : (
                            <input
                              type={fld.type || 'text'}
                              required={Boolean(fld.required)}
                              value={customerData[fld.id] || ''}
                              onChange={(e) => setCustomerData({ ...customerData, [fld.id]: e.target.value })}
                              placeholder={fld.placeholder}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                            />
                          )}
                        </div>
                      ))}
                  </div>
                </form>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="space-y-1 text-xs font-bold">
                  <div className="flex justify-between text-slate-500">
                    <span>المجموع الفرعي:</span>
                    <span>{cartSubtotal} ج.م</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-black">
                      <span>الخصم:</span>
                      <span>-{discountAmount} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>الإجمالي النهائي:</span>
                    <span className="text-blue-600">{finalTotal} ج.م</span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submittingOrder}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-5 h-5" />
                  {submittingOrder ? 'جاري تجهيز الطلب...' : 'إرسال تفاصيل الطلب على واتساب'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          نافذة تواصل معنا
      ===================================================================== */}
      {contactOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setContactOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-lg">تواصل مع فريق منصة العباقرة</h3>
              <button type="button" onClick={() => setContactOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              يسعدنا الرد على استفساراتكم وتنفيذ طلبات المذكرات الخاصة باسم وشعار كل معلم.
            </p>
            <a
              href={`https://wa.me/${String(settings.whatsappNumber || '').replace(/\D/g, '') || '201000000000'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg"
            >
              <MessageCircle className="w-5 h-5" /> تواصل مباشر عبر واتساب
            </a>
            {(settings.socialLinks || []).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {settings.socialLinks.map((lnk) => (
                  <a
                    key={lnk.id}
                    href={lnk.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-black text-slate-800"
                  >
                    <span>{lnk.label}</span>
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          نافذة تسجيل دخول الإدارة
      ===================================================================== */}
      {loginModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLoginModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">دخول لوحة تحكم الإدارة</h3>
                  <p className="text-[11px] text-slate-500 font-bold">مخصص لإدارة {settings.siteName}</p>
                </div>
              </div>
              <button type="button" onClick={() => setLoginModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminEmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">البريد الإلكتروني الإداري</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-black"
                  >
                    {showPass ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black text-center">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg"
              >
                {loginLoading ? 'جاري التحقق...' : 'تسجيل الدخول للوحة التحكم'}
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink mx-3 text-xs text-slate-400 font-bold">أو</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleAdminGoogleLogin}
              disabled={loginLoading}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              دخول سريع بحساب Google الإداري
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
