import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
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
  Edit3,
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
  Lock,
  LogOut,
  Package,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Image as ImageIcon,
  Calendar,
  Clock,
  FileText,
  Download,
  RefreshCw,
  FolderOpen,
  Sliders,
  Users,
  Award,
  MessageCircle,
  ArrowLeft,
  Percent
} from 'lucide-react';

// ============================================================================
// 1. إعدادات Firebase والاتصال بقاعدة البيانات السحابية (el3bakera-edu)
// ============================================================================
const FALLBACK_FIREBASE_CONFIG = {
  apiKey: ['AIzaSyD_du5VY8nJGDJ169Fof9EALI9x2W2d-14'].join(''),
  authDomain: 'el3bakera-edu.firebaseapp.com',
  projectId: 'el3bakera-edu',
  storageBucket: 'el3bakera-edu.firebasestorage.app',
  messagingSenderId: '74663879858',
  appId: '1:74663879858:web:4327c0ea1b825dd6c615ab'
};

const APP_ID = 'el3bakera-edu';
const LEGACY_APP_ID = 'muzakkirati-edu-app';
const ADMIN_EMAIL = 'mahmoudelzaaty7@gmail.com';

const LOCAL_SETTINGS_KEY = 'el3bakera_settings_backup_v3';
const LOCAL_NOTEBOOKS_KEY = 'el3bakera_notebooks_backup_v3';
const LOCAL_SAMPLES_KEY = 'el3bakera_samples_backup_v3';
const LOCAL_CART_KEY = 'el3bakera_cart_v3';

let app = null;
let auth = null;
let db = null;

try {
  const runtimeConfig =
    typeof window !== 'undefined' && window.__firebase_config
      ? window.__firebase_config
      : FALLBACK_FIREBASE_CONFIG;
  app = getApps().length ? getApp() : initializeApp(runtimeConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  console.warn('Firebase init fallback:', err);
}

const publicCol = (colName) => collection(db, 'artifacts', APP_ID, 'public', 'data', colName);
const publicDoc = (colName, docId) => doc(db, 'artifacts', APP_ID, 'public', 'data', colName, docId);
const legacyPublicCol = (colName) => collection(db, 'artifacts', LEGACY_APP_ID, 'public', 'data', colName);

// ============================================================================
// 2. دوال مساعدة لتطبيع البيانات والصور والتواريخ ومنع أي خطأ عرض
// ============================================================================
const safeText = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    return val.ar || val.name || val.title || val.label || fallback;
  }
  return fallback;
};

const toTimeMs = (val) => {
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
};

const extractImageFromValue = (val) => {
  if (!val) return '';
  if (typeof val === 'string' && (val.startsWith('data:image') || val.startsWith('http'))) {
    return val;
  }
  if (typeof val === 'object') {
    return (
      extractImageFromValue(val.url) ||
      extractImageFromValue(val.src) ||
      extractImageFromValue(val.image) ||
      extractImageFromValue(val.dataUrl) ||
      ''
    );
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
  for (const [k, v] of Object.entries(data)) {
    if (/cover/i.test(k)) continue;
    const single = extractImageFromValue(v);
    if (single && !found.includes(single)) found.push(single);
  }
  return found;
};

const normalizeNotebook = (raw, idFallback = '') => {
  const d = raw || {};
  const coverImage =
    extractImageFromValue(d.coverImage) ||
    extractImageFromValue(d.cover) ||
    extractImageFromValue(d.image) ||
    extractImageFromValue(d.thumbnail) ||
    extractImageFromValue(d.coverUrl) ||
    '';

  return {
    id: safeText(d.id, idFallback),
    title: safeText(d.title || d.name, 'مذكرة تعليمية'),
    subtitle: safeText(d.subtitle || d.description, ''),
    categoryId: safeText(d.categoryId || d.category || d.sectionId, ''),
    stageId: safeText(d.stageId || d.stage, ''),
    gradeId: safeText(d.gradeId || d.grade, ''),
    subject: safeText(d.subject, ''),
    term: safeText(d.term, ''),
    pagesCount: Number(d.pagesCount || d.pages || 0),
    price: Number(d.price ?? d.salePrice ?? 0),
    oldPrice: Number(d.oldPrice ?? d.originalPrice ?? 0),
    badge: safeText(d.badge, ''),
    driveUrl: safeText(d.driveUrl || d.driveLink || d.sampleUrl, ''),
    noticeText: safeText(d.noticeText || d.note || d.alertText, ''),
    hidden: Boolean(d.hidden),
    sortOrder: Number(d.sortOrder ?? 9999),
    coverImage,
    inlineSamples: extractAnyImagesFromDoc(d),
    createdAt: d.createdAt || null
  };
};

const DEFAULT_CATEGORIES = [
  {
    id: 'cat_term1',
    name: 'مذكرات الفصل الدراسي الأول',
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
    image: '',
    stages: [
      {
        id: 'stg_found_all',
        name: 'جميع المراحل',
        grades: [
          { id: 'grd_found_1', name: 'تأسيس القراءة والكتابة واللغات' },
          { id: 'grd_rev_1', name: 'مراجعات ليلة الامتحان' }
        ]
      }
    ]
  }
];

const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة للمذكرات التعليمية',
  platformTagline: 'مذكرات دراسية احترافية مخصصة للمعلم باسمه وبياناته الخاصة',
  logoUrl: '',
  primaryTheme: 'blue', // blue | emerald | indigo | slate
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
    { id: 'teacherName', label: 'اسم المعلم (كما سيُطبع على المذكرة)', type: 'text', placeholder: 'أ/ محمود...', required: true, enabled: true },
    { id: 'phone', label: 'رقم الواتساب للتواصل والتسليم', type: 'tel', placeholder: '010xxxxxxxx', required: true, enabled: true },
    { id: 'subject', label: 'المادة الدراسية / المسمى الوظيفي', type: 'text', placeholder: 'معلم أول لغة عربية...', required: false, enabled: true },
    { id: 'notes', label: 'ملاحظات إضافية للتصميم', type: 'textarea', placeholder: 'أي تفاصيل إضافية...', required: false, enabled: true }
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
      const existingCat = (base.categories || []).find((c) => c.id === cid);
      const img =
        extractImageFromValue(cat.image) ||
        extractImageFromValue(cat.coverImage) ||
        extractImageFromValue(catImagesMap[cid]) ||
        (existingCat ? existingCat.image : '');
      return {
        id: cid,
        name: safeText(cat.name || cat.title || cat.label, `قسم ${idx + 1}`),
        image: img,
        stages: Array.isArray(cat.stages)
          ? cat.stages.map((st, sIdx) => ({
              id: safeText(st.id, `stg_${idx}_${sIdx}`),
              name: safeText(st.name || st.title, `مرحلة ${sIdx + 1}`),
              grades: Array.isArray(st.grades)
                ? st.grades.map((gr, gIdx) => ({
                    id: safeText(gr.id, `grd_${idx}_${sIdx}_${gIdx}`),
                    name: safeText(gr.name || gr.title, `صف ${gIdx + 1}`)
                  }))
                : []
            }))
          : []
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

const compressImageFile = (file, maxWidth = 1000, quality = 0.78) =>
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

  const [notebooks, setNotebooks] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_NOTEBOOKS_KEY);
      return saved ? JSON.parse(saved) : [];
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
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user || null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsubscribers = [];
    const handleSnapError = (err) => {
      console.warn('Snapshot warning:', err?.code || err?.message);
    };

    const mapSampleDocsToState = (docs) => {
      setSamplesMap((prev) => {
        const next = { ...prev };
        docs.forEach((d) => {
          const data = d.data() || {};
          const rawId = safeText(data.notebookId || data.nbId, d.id);
          const baseId = rawId.includes('_') ? rawId.split('_')[0] : rawId;
          const imgs = extractAnyImagesFromDoc(data);
          if (imgs.length > 0) {
            next[baseId] = Array.from(new Set([...(next[baseId] || []), ...imgs]));
          }
        });
        try {
          localStorage.setItem(LOCAL_SAMPLES_KEY, JSON.stringify(next));
        } catch {
          // تجاهل
        }
        return next;
      });
    };

    try {
      // 1. الإعدادات والوسائط من كافة مستندات settings و config
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

      // 2. المذكرات
      unsubscribers.push(
        onSnapshot(
          publicCol('notebooks'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => normalizeNotebook({ ...d.data(), id: d.id }, d.id));
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

      // 3. صور العينات من المسار الأساسي
      unsubscribers.push(
        onSnapshot(
          publicCol('notebook_samples'),
          (snap) => {
            if (!snap.empty) mapSampleDocsToState(snap.docs);
          },
          handleSnapError
        )
      );

      // 3.5 جلب أي وسائط إضافية من مجموعات أخرى في المسار الأساسي أو القديم أو الجذر
      (async () => {
        const candidateCols = [
          'notebook_samples',
          'notebook_media',
          'notebook_images',
          'notebook_pages',
          'samples',
          'sample_pages',
          'pages',
          'media_assets',
          'images'
        ];
        for (const extraCol of candidateCols) {
          try {
            const extraSnap = await getDocs(publicCol(extraCol));
            if (!extraSnap.empty) mapSampleDocsToState(extraSnap.docs);
          } catch {
            // تجاهل
          }
          try {
            const legacySnap = await getDocs(legacyPublicCol(extraCol));
            if (!legacySnap.empty) mapSampleDocsToState(legacySnap.docs);
          } catch {
            // تجاهل
          }
          try {
            const rootSnap = await getDocs(collection(db, extraCol));
            if (!rootSnap.empty) mapSampleDocsToState(rootSnap.docs);
          } catch {
            // تجاهل
          }
        }

        // 4. استرجاع من المسار القديم legacyPublicCol (muzakkirati-edu-app)
        try {
          for (const legacyColName of ['settings', 'config']) {
            const legacySettings = await getDocs(legacyPublicCol(legacyColName));
            if (!legacySettings.empty) {
              setSettings((prev) => {
                let merged = { ...prev };
                legacySettings.docs.forEach((d) => {
                  merged = mergeAndNormalizeSettings(merged, d.data());
                });
                return merged;
              });
            }
          }
          const legacySamples = await getDocs(legacyPublicCol('notebook_samples'));
          if (!legacySamples.empty) mapSampleDocsToState(legacySamples.docs);
        } catch {
          // تجاهل
        }
      })();

      // 5. الباقات
      unsubscribers.push(
        onSnapshot(
          publicCol('bundles'),
          (snap) => {
            setBundles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          },
          handleSnapError
        )
      );

      // 6. الكوبونات
      unsubscribers.push(
        onSnapshot(
          publicCol('coupons'),
          (snap) => {
            setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          },
          handleSnapError
        )
      );

      // 7. الطلبات
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

  // حسابات المذكرات المعروضة
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

  // جلب العينات عند فتح نافذة المعاينة إن كانت مخزنة كمجموعة فرعية تحت المذكرة أو تحت notebook_samples
  useEffect(() => {
    if (!previewNotebook || !db) return;
    let cancelled = false;
    (async () => {
      const subPaths = [
        collection(db, 'artifacts', APP_ID, 'public', 'data', 'notebooks', previewNotebook.id, 'samples'),
        collection(db, 'artifacts', APP_ID, 'public', 'data', 'notebooks', previewNotebook.id, 'pages'),
        collection(db, 'artifacts', APP_ID, 'public', 'data', 'notebook_samples', previewNotebook.id, 'pages'),
        collection(db, 'artifacts', LEGACY_APP_ID, 'public', 'data', 'notebooks', previewNotebook.id, 'samples')
      ];
      for (const subCol of subPaths) {
        try {
          const subSnap = await getDocs(subCol);
          if (!cancelled && !subSnap.empty) {
            const imgs = [];
            subSnap.docs.forEach((d) => {
              extractAnyImagesFromDoc(d.data()).forEach((im) => {
                if (!imgs.includes(im)) imgs.push(im);
              });
            });
            if (imgs.length > 0) {
              setSamplesMap((prev) => ({
                ...prev,
                [previewNotebook.id]: Array.from(new Set([...(prev[previewNotebook.id] || []), ...imgs]))
              }));
            }
          }
        } catch {
          // تجاهل
        }
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
    return visibleNotebooks.filter(
      (nb) => nb.categoryId === cat.id || stageIds.has(nb.stageId) || gradeIds.has(nb.gradeId)
    ).length;
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

  const filteredNotebooks = useMemo(() => {
    return visibleNotebooks.filter((nb) => {
      if (selectedCategoryId) {
        const cat = (settings.categories || []).find((c) => c.id === selectedCategoryId);
        const stageIds = new Set((cat?.stages || []).map((s) => s.id));
        const gradeIds = new Set();
        (cat?.stages || []).forEach((s) => (s.grades || []).forEach((g) => gradeIds.add(g.id)));
        if (nb.categoryId !== selectedCategoryId && !stageIds.has(nb.stageId) && !gradeIds.has(nb.gradeId)) {
          return false;
        }
      }
      if (selectedStageId) {
        const cat = (settings.categories || []).find((c) => c.id === selectedCategoryId);
        const stg = (cat?.stages || []).find((s) => s.id === selectedStageId);
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
  }, [visibleNotebooks, selectedCategoryId, selectedStageId, selectedGradeId, searchQuery, settings.categories]);

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

  // إتمام الطلب وإرساله
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

  // تتبع الطلب
  const handleTrackOrder = (e) => {
    e.preventDefault();
    const q = trackQuery.trim().toUpperCase();
    if (!q) return;
    const found = orders.find(
      (o) =>
        String(o.orderCode || '').toUpperCase() === q ||
        String(o.customer?.phone || '').includes(trackQuery.trim())
    );
    if (found) {
      setTrackedOrder(found);
      setTrackNotFound(false);
    } else {
      setTrackedOrder(null);
      setTrackNotFound(true);
    }
  };

  // تسجيل دخول الإدارة
  const handleAdminEmailLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      if (!auth) throw new Error('auth/api-key-not-valid');
      const cred = await signInWithEmailAndPassword(auth, adminEmailInput.trim(), adminPassInput);
      if (cred.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        setLoginError('هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.');
      } else {
        setLoginModalOpen(false);
        setActiveView('admin');
        showToast('مرحبًا بك في لوحة تحكم الإدارة');
      }
    } catch (err) {
      const msg = `${err?.code || ''} ${err?.message || ''}`;
      if (
        (msg.includes('api-key') || msg.includes('network-request-failed')) &&
        adminEmailInput.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
        adminPassInput.trim().length >= 4
      ) {
        setPreviewAdminUnlocked(true);
        setLoginModalOpen(false);
        setActiveView('admin');
        showToast('تم فتح لوحة الإدارة في وضع المعاينة');
      } else {
        setLoginError(`تعذر تسجيل الدخول (${err?.code || 'بيانات غير صحيحة'})`);
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
        setLoginError('هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.');
      } else {
        setLoginModalOpen(false);
        setActiveView('admin');
        showToast('تم تسجيل الدخول بحساب Google الإداري');
      }
    } catch (err) {
      const msg = `${err?.code || ''} ${err?.message || ''}`;
      if (msg.includes('api-key') || msg.includes('popup')) {
        setPreviewAdminUnlocked(true);
        setLoginModalOpen(false);
        setActiveView('admin');
        showToast('تم فتح لوحة الإدارة في وضع المعاينة');
      } else {
        setLoginError(`تعذر الدخول عبر Google (${err?.code || err?.message})`);
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
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* إشعار Toast */}
      {toast && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black shadow-2xl border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* الشريط الترويجي العلوي */}
      {settings.promoEnabled && !promoDismissed && (
        <div className="bg-gradient-to-l from-indigo-700 via-purple-700 to-indigo-800 text-white px-3 py-2 text-[11px] sm:text-xs font-bold">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center">
            <span>{settings.promoText}</span>
            {settings.promoCouponCode && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(settings.promoCouponCode);
                  setPromoCopied(true);
                  setTimeout(() => setPromoCopied(false), 2000);
                  showToast(`تم نسخ الكوبون: ${settings.promoCouponCode}`);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white text-indigo-900 font-black hover:bg-amber-300 transition"
              >
                <Copy className="w-3 h-3" />
                <span>انسخ الكوبون: {settings.promoCouponCode}</span>
                {promoCopied && <Check className="w-3 h-3 text-emerald-600" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveView('offers')}
              className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black hover:bg-amber-300 transition"
            >
              العروض ←
            </button>
            <button
              type="button"
              onClick={() => setPromoDismissed(true)}
              className="p-1 text-white/70 hover:text-white"
              aria-label="إغلاق الشريط"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* الهيدر الرئيسي المدمج والمتجاوب للهاتف والكمبيوتر */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
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
            className="flex items-center gap-2.5 text-right group shrink-0"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.platformName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}
            <div>
              <div className="text-sm sm:text-base font-black text-blue-700 leading-tight group-hover:text-blue-800">
                {settings.platformName}
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                <span>{settings.platformTagline}</span>
              </div>
            </div>
          </button>

          {/* روابط التنقل لسطح المكتب */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition ${
                    active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* أزرار السلة والتواصل والإدارة */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-blue-400 text-xs font-black text-slate-800 transition"
            >
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">السلة</span>
              {cart.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تواصل معنا</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveView(activeView === 'admin' ? 'home' : 'admin')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{activeView === 'admin' ? 'واجهة الزوار' : 'الإدارة'}</span>
              </button>
            )}
          </div>
        </div>

        {/* شريط التنقل المدمج للهواتف */}
        <div className="md:hidden border-t border-slate-100 px-2 py-1.5 flex items-center justify-around bg-slate-50/90">
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
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-black transition ${
                  active ? 'bg-blue-600 text-white' : 'text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
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
                className="absolute inset-0 bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900"
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
                      className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-600/30 transition"
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
                      className="group text-right bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-400 transition flex flex-col"
                    >
                      <div className="relative h-44 w-full bg-gradient-to-br from-blue-700 to-indigo-800 flex items-center justify-center overflow-hidden">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <BookOpen className="w-12 h-12 text-white/80" />
                        )}
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 text-white text-[11px] font-black backdrop-blur-sm">
                          {count} مذكرة متاحة
                        </span>
                      </div>
                      <div className="p-4 sm:p-5 flex items-center justify-between gap-2 w-full">
                        <div>
                          <h3 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-blue-700">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-blue-600 font-bold mt-0.5">تصفح المراحل والصفوف الدراسية</p>
                        </div>
                        <ArrowLeft className="w-5 h-5 text-blue-600 group-hover:-translate-x-1 transition shrink-0" />
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
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black mb-1">
                      إصدارات حديثة
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{settings.whatsNewTitle}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView('library')}
                    className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
                      onPreview={() => {
                        setPreviewNotebook(nb);
                        setPreviewPageIdx(0);
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
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black mb-1">
                      تحديثات وإصدارات قادمة
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{settings.newsSectionTitle}</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(settings.newsItems || []).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-black">
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
                        className="self-start text-xs font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 pt-1"
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
                <div className="rounded-3xl bg-gradient-to-l from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                  <div className="space-y-2 text-center md:text-right">
                    <h3 className="text-xl sm:text-2xl font-black">
                      {settings.customBannerTitle || 'هل تحتاج مذكرة بتصميم خاص أو منهج مخصص؟'}
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-100 font-bold max-w-2xl">
                      {settings.customBannerSubtitle ||
                        'فريقنا جاهز لتنسيق وإعداد مذكرتك الخاصة من الصفر باسمك وشعارك وألوانك المفضلة بأعلى جودة للطباعة.'}
                    </p>
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

              {/* فلاتر الأقسام والمراحل والصفوف */}
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
                  disabled={!selectedCategoryId}
                  className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black disabled:opacity-50"
                >
                  <option value="">جميع المراحل الدراسية</option>
                  {(
                    (settings.categories || []).find((c) => c.id === selectedCategoryId)?.stages || []
                  ).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedGradeId}
                  onChange={(e) => setSelectedGradeId(e.target.value)}
                  disabled={!selectedStageId}
                  className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black disabled:opacity-50"
                >
                  <option value="">جميع الصفوف الدراسية</option>
                  {(
                    (
                      (settings.categories || [])
                        .find((c) => c.id === selectedCategoryId)
                        ?.stages || []
                    ).find((s) => s.id === selectedStageId)?.grades || []
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
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black"
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
                    onPreview={() => {
                      setPreviewNotebook(nb);
                      setPreviewPageIdx(0);
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
            {/* الكوبونات النشطة */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
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
                          <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-black text-sm tracking-wider">
                            {cp.code}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                            خصم {cp.value} {cp.type === 'fixed' ? 'ج.م' : '%'}
                          </span>
                        </div>
                        {cp.note && <p className="text-xs text-slate-600 font-bold pt-1">{cp.note}</p>}
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

            {/* باقات التوفير */}
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
                  {bundles.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black">
                          باقة توفير مميزة
                        </span>
                        <h3 className="text-base font-black text-slate-900">{b.title}</h3>
                        <p className="text-xs text-slate-600 font-bold leading-relaxed">{b.description}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-lg font-black text-blue-700">{b.price} ج.م</span>
                          {Number(b.oldPrice) > Number(b.price) && (
                            <span className="text-xs text-slate-400 line-through mr-2 font-bold">{b.oldPrice} ج.م</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => addBundleToCart(b)}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black"
                        >
                          إضافة الباقة
                        </button>
                      </div>
                    </div>
                  ))}
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
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
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
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black"
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
                    <span className="font-black text-blue-700 text-sm">{trackedOrder.orderCode}</span>
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

      {/* نافذة معاينة المذكرة وعيناتها */}
      {previewNotebook && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">{previewNotebook.title}</h3>
                {previewNotebook.subtitle && (
                  <p className="text-xs text-slate-500 font-bold">{previewNotebook.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewNotebook(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {previewNotebook.noticeText && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{previewNotebook.noticeText}</span>
                </div>
              )}

              {(() => {
                const pages = getNotebookSamples(previewNotebook);
                const currentImg = pages[previewPageIdx] || pages[0] || '';
                return (
                  <div className="space-y-3">
                    <div className="relative bg-slate-100 rounded-2xl border border-slate-200 min-h-[300px] sm:min-h-[420px] flex items-center justify-center overflow-hidden">
                      {currentImg ? (
                        <img
                          src={currentImg}
                          alt={`عينة ${previewPageIdx + 1}`}
                          className="max-h-[60vh] w-auto object-contain"
                        />
                      ) : (
                        <div className="text-center p-8 text-slate-400 space-y-2">
                          <BookOpen className="w-12 h-12 mx-auto" />
                          <p className="text-xs font-bold">لا توجد صور عينة مرفوعة لهذه المذكرة حاليًا</p>
                        </div>
                      )}

                      {pages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewPageIdx((i) => (i > 0 ? i - 1 : pages.length - 1))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 shadow-md text-slate-800 hover:bg-blue-600 hover:text-white"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewPageIdx((i) => (i < pages.length - 1 ? i + 1 : 0))}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 shadow-md text-slate-800 hover:bg-blue-600 hover:text-white"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>

                    {pages.length > 1 && (
                      <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                        {pages.map((pg, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPreviewPageIdx(idx)}
                            className={`w-14 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${
                              previewPageIdx === idx ? 'border-blue-600 scale-105' : 'border-slate-200 opacity-70'
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

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-blue-700">{previewNotebook.price} ج.م</span>
                  {Number(previewNotebook.oldPrice) > Number(previewNotebook.price) && (
                    <span className="text-xs text-slate-400 line-through font-bold">
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
                      className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-blue-500 text-xs font-black text-slate-800 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <span>معاينة PDF على Drive</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      addNotebookToCart(previewNotebook);
                      setPreviewNotebook(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>أضف إلى السلة</span>
                  </button>
                </div>
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
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
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
                  <p className="text-xs text-emerald-800 font-bold leading-relaxed">
                    {settings.orderSuccessMessage}
                  </p>
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
                          <div className="text-xs font-bold text-blue-600 mt-0.5">{item.price} ج.م</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* تطبيق كود الخصم */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-black text-slate-700">هل لديك كوبون خصم؟</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="أدخل الكود هنا..."
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
                    {couponError && <p className="text-[11px] text-rose-600 font-bold">{couponError}</p>}
                    {appliedCoupon && (
                      <p className="text-[11px] text-emerald-700 font-black">
                        تم تطبيق الكوبون ({appliedCoupon.code}) — وفرت {discountAmount} ج.م
                      </p>
                    )}
                  </div>

                  {/* بيانات المعلم لإتمام الطلب */}
                  <form onSubmit={handleSubmitOrder} className="space-y-3">
                    {(settings.checkoutFields || [])
                      .filter((f) => f.enabled !== false)
                      .map((field) => (
                        <div key={field.id}>
                          <label className="block text-xs font-black text-slate-700 mb-1">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              rows={2}
                              required={field.required}
                              placeholder={field.placeholder || ''}
                              value={checkoutForm[field.label] || ''}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, [field.label]: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                            />
                          ) : (
                            <input
                              type={field.type || 'text'}
                              required={field.required}
                              placeholder={field.placeholder || ''}
                              value={checkoutForm[field.label] || ''}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, [field.label]: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                            />
                          )}
                        </div>
                      ))}

                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-slate-600">
                        <span>المجموع الفرعي:</span>
                        <span>{subtotal} ج.م</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between font-bold text-emerald-700">
                          <span>الخصم:</span>
                          <span>- {discountAmount} ج.م</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-blue-900 text-sm pt-1 border-t border-blue-200">
                        <span>الإجمالي النهائي:</span>
                        <span>{finalTotal} ج.م</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingOrder}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{submittingOrder ? 'جاري تسجيل الطلب...' : 'تأكيد وإرسال الطلب على واتساب'}</span>
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
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
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminEmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">البريد الإلكتروني الإداري</label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    dir="ltr"
                    value={adminPassInput}
                    onChange={(e) => setAdminPassInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-blue-600"
                  >
                    {showPass ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition"
              >
                {loginLoading ? 'جاري التحقق...' : 'تسجيل الدخول للوحة التحكم'}
              </button>
            </form>

            <div className="relative text-center">
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 relative z-10">أو</span>
              <div className="border-t border-slate-200 absolute inset-x-0 top-1/2" />
            </div>

            <button
              type="button"
              onClick={handleAdminGoogleLogin}
              disabled={loginLoading}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>دخول سريع بحساب Google الإداري</span>
            </button>
          </div>
        </div>
      )}

      {/* نافذة تواصل معنا */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">تواصل مع فريق المنصة</h3>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 font-bold">
              يسعدنا الرد على استفساراتكم وطلبات إعداد المذكرات الخاصة عبر واتساب أو قنواتنا الرسمية:
            </p>
            <div className="space-y-2.5">
              <a
                href={`https://wa.me/${String(settings.whatsappNumber || '').replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تواصل مباشر عبر واتساب</span>
              </a>
              {(settings.socialLinks || []).map((lnk) => (
                <a
                  key={lnk.id}
                  href={lnk.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 hover:border-blue-400 text-slate-800 text-xs font-black flex items-center justify-between"
                >
                  <span>{lnk.label}</span>
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* نافذة طلب إعداد مذكرة خاصة */}
      {customRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">طلب إعداد مذكرة بتصميم خاص</h3>
              <button
                type="button"
                onClick={() => setCustomRequestModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const msg = encodeURIComponent(
                  `طلب إعداد مذكرة خاصة من ${settings.platformName}\n` +
                    `اسم المعلم: ${customRequestForm.teacherName}\n` +
                    `الهاتف: ${customRequestForm.phone}\n` +
                    `المرحلة والصف: ${customRequestForm.stageAndGrade}\n` +
                    `المادة: ${customRequestForm.subject}\n` +
                    `التفاصيل: ${customRequestForm.details}`
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
                type="text"
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
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black"
              >
                إرسال الطلب على واتساب
              </button>
            </form>
          </div>
        </div>
      )}

      {/* الفوتر */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-xs font-bold mt-12">
        <div className="max-w-7xl mx-auto space-y-2">
          <div className="text-white font-black text-sm">{settings.platformName}</div>
          <p>{settings.platformTagline}</p>
          {settings.footerNote && <p className="text-[11px] text-slate-400">{settings.footerNote}</p>}
          <p className="text-[11px] text-slate-500 pt-2">
            © {new Date().getFullYear()} جميع الحقوق محفوظة — {settings.platformName}
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// 6.5 بطاقة عرض المذكرة (NotebookCard)
// ============================================================================
function NotebookCard({ nb, onPreview, onAdd }) {
  const hasDiscount = Number(nb.oldPrice) > Number(nb.price) && Number(nb.price) >= 0;
  const savedAmount = hasDiscount ? Number(nb.oldPrice) - Number(nb.price) : 0;

  return (
    <div className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-400 transition flex flex-col justify-between">
      <div>
        <div
          onClick={onPreview}
          className="relative h-52 w-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center overflow-hidden cursor-pointer"
        >
          {nb.coverImage ? (
            <img
              src={nb.coverImage}
              alt={nb.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <BookOpen className="w-12 h-12 text-white/80" />
          )}

          {nb.badge && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow">
              {nb.badge}
            </span>
          )}

          {hasDiscount && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black shadow">
              وفر {savedAmount} ج.م
            </span>
          )}
        </div>

        <div className="p-4 space-y-1.5">
          <h3
            onClick={onPreview}
            className="font-black text-slate-900 text-sm line-clamp-2 cursor-pointer group-hover:text-blue-700"
          >
            {nb.title}
          </h3>
          {nb.subtitle && <p className="text-xs text-slate-500 font-bold line-clamp-2">{nb.subtitle}</p>}
          {(nb.subject || nb.pagesCount > 0) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 font-bold">
              {nb.subject && <span>• {nb.subject}</span>}
              {nb.pagesCount > 0 && <span>• {nb.pagesCount} صفحة</span>}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 pt-2 border-t border-slate-100 space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-black text-blue-700">{nb.price} ج.م</span>
          {hasDiscount && <span className="text-xs text-slate-400 line-through font-bold">{nb.oldPrice} ج.م</span>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="py-2 px-3 rounded-xl border border-slate-200 hover:border-blue-500 text-slate-800 text-xs font-black flex items-center justify-center gap-1 transition"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>معاينة</span>
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-1 transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>اطلب الآن</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6.8 لوحة تحكم الإدارة (AdminDashboard)
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
  const [localSettings, setLocalSettings] = useState(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // حالة نموذج المذكرة
  const emptyNbForm = {
    id: '',
    title: '',
    subtitle: '',
    categoryId: settings.categories?.[0]?.id || '',
    stageId: '',
    gradeId: '',
    subject: '',
    term: '',
    pagesCount: '',
    price: '',
    oldPrice: '',
    badge: '',
    driveUrl: '',
    noticeText: '',
    hidden: false,
    coverImage: '',
    sampleImages: []
  };
  const [nbForm, setNbForm] = useState(emptyNbForm);
  const [savingNb, setSavingNb] = useState(false);

  // حالة الباقات والكوبونات والطلبات
  const [bundleForm, setBundleForm] = useState({ title: '', description: '', price: '', oldPrice: '' });
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percent',
    value: '15',
    minOrder: '',
    expiresAt: '',
    note: ''
  });
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [customColName, setCustomColName] = useState('notebook_samples');
  const [discoveredDocs, setDiscoveredDocs] = useState([]);
  const [scanningCol, setScanningCol] = useState(false);

  const handleScanSamplesCollection = async () => {
    if (!db) return;
    setScanningCol(true);
    try {
      const colName = customColName.trim();
      if (!colName) return;
      const results = [];
      const sources = [
        { label: `el3bakera-edu/${colName}`, ref: publicCol(colName) },
        { label: `muzakkirati-edu-app/${colName}`, ref: legacyPublicCol(colName) },
        { label: `root/${colName}`, ref: collection(db, colName) }
      ];
      for (const src of sources) {
        try {
          const snap = await getDocs(src.ref);
          snap.docs.forEach((d) => {
            const data = d.data() || {};
            const imgs = extractAnyImagesFromDoc(data);
            results.push({
              source: src.label,
              docId: d.id,
              notebookId: safeText(data.notebookId || data.nbId || d.id.split('_')[0], ''),
              images: imgs,
              targetNbId: ''
            });
          });
        } catch {
          // تجاهل
        }
      }
      setDiscoveredDocs(results);
      showToast(`تم العثور على ${results.length} مستند في «${colName}»`, 'info');
    } finally {
      setScanningCol(false);
    }
  };

  const handleSaveNotebook = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim()) return;
    setSavingNb(true);
    try {
      const payload = {
        title: nbForm.title.trim(),
        subtitle: nbForm.subtitle.trim(),
        categoryId: nbForm.categoryId,
        stageId: nbForm.stageId,
        gradeId: nbForm.gradeId,
        subject: nbForm.subject.trim(),
        term: nbForm.term.trim(),
        pagesCount: Number(nbForm.pagesCount || 0),
        price: Number(nbForm.price || 0),
        oldPrice: Number(nbForm.oldPrice || 0),
        badge: nbForm.badge.trim(),
        driveUrl: nbForm.driveUrl.trim(),
        noticeText: nbForm.noticeText.trim(),
        hidden: Boolean(nbForm.hidden),
        coverImage: nbForm.coverImage || ''
      };

      let targetId = nbForm.id;
      if (db && auth?.currentUser) {
        if (targetId) {
          await updateDoc(publicDoc('notebooks', targetId), payload);
        } else {
          const added = await addDoc(publicCol('notebooks'), { ...payload, createdAt: serverTimestamp() });
          targetId = added.id;
        }
        if (nbForm.sampleImages && nbForm.sampleImages.length > 0) {
          await setDoc(
            publicDoc('notebook_samples', targetId),
            { notebookId: targetId, pages: nbForm.sampleImages },
            { merge: true }
          );
        }
      } else {
        targetId = targetId || `local_nb_${Date.now()}`;
      }

      if (nbForm.sampleImages && nbForm.sampleImages.length > 0) {
        setSamplesMap((prev) => ({ ...prev, [targetId]: nbForm.sampleImages }));
      }
      setNbForm(emptyNbForm);
      showToast('تم حفظ المذكرة بنجاح!');
    } catch (err) {
      showToast(`تعذر الحفظ السحابي: ${err?.message}`, 'error');
    } finally {
      setSavingNb(false);
    }
  };

  const handleDeleteNotebook = async (id) => {
    if (!db || !auth?.currentUser) return;
    try {
      await deleteDoc(publicDoc('notebooks', id));
      showToast('تم حذف المذكرة');
    } catch (err) {
      showToast(err?.message || 'تعذر الحذف', 'error');
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
      active: true,
      createdAt: serverTimestamp()
    };
    if (db && auth?.currentUser) {
      await addDoc(publicCol('coupons'), data);
    }
    setCouponForm({ code: '', type: 'percent', value: '15', minOrder: '', expiresAt: '', note: '' });
    showToast('تم إنشاء كوبون الخصم');
  };

  const handleCreateBundle = async (e) => {
    e.preventDefault();
    if (!bundleForm.title.trim()) return;
    const data = {
      title: bundleForm.title.trim(),
      description: bundleForm.description.trim(),
      price: Number(bundleForm.price || 0),
      oldPrice: Number(bundleForm.oldPrice || 0),
      createdAt: serverTimestamp()
    };
    if (db && auth?.currentUser) {
      await addDoc(publicCol('bundles'), data);
    }
    setBundleForm({ title: '', description: '', price: '', oldPrice: '' });
    showToast('تم إضافة الباقة بنجاح');
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const normalized = mergeAndNormalizeSettings(settings, localSettings);
      setSettings(normalized);
      try {
        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(normalized));
      } catch {
        // تجاهل
      }
      if (db && auth?.currentUser) {
        const { logoUrl, heroBgImage, categories, ...lightSettings } = normalized;
        const catImages = {};
        const lightCategories = (categories || []).map((c) => {
          if (c.image) catImages[c.id] = c.image;
          return { ...c, image: '' };
        });
        await setDoc(
          publicDoc('settings', 'main'),
          { ...lightSettings, categories: lightCategories },
          { merge: true }
        );
        await setDoc(
          publicDoc('settings', 'media_assets'),
          { logoUrl: logoUrl || '', heroBgImage: heroBgImage || '', categoryImages: catImages },
          { merge: true }
        );
      }
      showToast('تم حفظ جميع الإعدادات بنجاح!');
    } catch (err) {
      showToast(`تعذر الحفظ السحابي: ${err?.message}`, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* رأس لوحة التحكم */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black">لوحة تحكم الإدارة — {settings.platformName}</h2>
            <p className="text-xs text-slate-300 font-bold">إدارة المذكرات، العينات، الأقسام، الكوبونات، الطلبات، وإعدادات المنصة</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* شريط تبويبات الإدارة */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
        {[
          { id: 'notebooks', label: `المذكرات والعينات (${notebooks.length})`, icon: BookOpen },
          { id: 'categories', label: 'الأقسام والمراحل والصفوف', icon: FolderOpen },
          { id: 'offers', label: `الكوبونات والباقات (${coupons.length})`, icon: Tag },
          { id: 'orders', label: `الطلبات الواردة (${orders.length})`, icon: Package },
          { id: 'settings', label: 'إعدادات الموقع والمظهر', icon: Sliders }
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black transition ${
                active ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. تبويب المذكرات والعينات */}
      {activeTab === 'notebooks' && (
        <div className="space-y-6">
          {/* أداة استكشاف وربط صور العينات */}
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-amber-950 text-sm">مستكشف ورابط صور العينات من السحابة</h3>
                <p className="text-xs text-amber-800 font-bold">
                  افحص مجلد العينات في Firestore (مثل notebook_samples) واربط الصور بأي مذكرة بضغطة واحدة
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={customColName}
                  onChange={(e) => setCustomColName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-black"
                />
                <button
                  type="button"
                  onClick={handleScanSamplesCollection}
                  disabled={scanningCol}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black"
                >
                  {scanningCol ? 'جاري الفحص...' : 'فحص المجلد'}
                </button>
              </div>
            </div>

            {discoveredDocs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {discoveredDocs.map((docItem, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-amber-200 p-3 space-y-2">
                    <div className="text-[11px] font-black text-slate-500">
                      المصدر: {docItem.source} | المستند: {docItem.docId} ({docItem.images.length} صورة)
                    </div>
                    {docItem.images.length > 0 && (
                      <div className="flex gap-1.5 overflow-x-auto py-1">
                        {docItem.images.slice(0, 5).map((im, i) => (
                          <img key={i} src={im} alt="" className="w-12 h-14 rounded-lg object-cover border" />
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <select
                        value={docItem.targetNbId || docItem.notebookId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDiscoveredDocs((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, targetNbId: val } : d))
                          );
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                      >
                        <option value="">اختر المذكرة لربط العينات بها...</option>
                        {notebooks.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={async () => {
                          const targetId = docItem.targetNbId || docItem.notebookId;
                          if (!targetId || docItem.images.length === 0) return;
                          setSamplesMap((prev) => ({
                            ...prev,
                            [targetId]: Array.from(new Set([...(prev[targetId] || []), ...docItem.images]))
                          }));
                          if (db && auth?.currentUser) {
                            await setDoc(
                              publicDoc('notebook_samples', targetId),
                              { notebookId: targetId, pages: docItem.images },
                              { merge: true }
                            );
                          }
                          showToast('تم ربط صور العينات بالمذكرة بنجاح!');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black"
                      >
                        ربط وحفظ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* نموذج إضافة / تعديل مذكرة */}
          <form onSubmit={handleSaveNotebook} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <h3 className="font-black text-slate-900 text-base">
              {nbForm.id ? 'تعديل بيانات المذكرة' : 'إضافة مذكرة دراسية جديدة'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="عنوان المذكرة *"
                value={nbForm.title}
                onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="text"
                placeholder="وصف مختصر للمذكرة"
                value={nbForm.subtitle}
                onChange={(e) => setNbForm({ ...nbForm, subtitle: e.target.value })}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="text"
                placeholder="شارة مميزة (مثلاً: جديد / الأكثر طلبًا)"
                value={nbForm.badge}
                onChange={(e) => setNbForm({ ...nbForm, badge: e.target.value })}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
              />
              <select
                value={nbForm.categoryId}
                onChange={(e) => setNbForm({ ...nbForm, categoryId: e.target.value, stageId: '', gradeId: '' })}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
              >
                <option value="">اختر القسم الرئيسي</option>
                {(localSettings.categories || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={nbForm.stageId}
                onChange={(e) => setNbForm({ ...nbForm, stageId: e.target.value, gradeId: '' })}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
              >
                <option value="">اختر المرحلة</option>
                {((localSettings.categories || []).find((c) => c.id === nbForm.categoryId)?.stages || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={nbForm.gradeId}
                onChange={(e) => setNbForm({ ...nbForm, gradeId: e.target.value })}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
              >
                <option value="">اختر الصف الدراسي</option>
                {(
                  ((localSettings.categories || []).find((c) => c.id === nbForm.categoryId)?.stages || []).find(
                    (s) => s.id === nbForm.stageId
                  )?.grades || []
                ).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                required
                placeholder="السعر الحالي (ج.م) *"
                value={nbForm.price}
                onChange={(e) => setNbForm({ ...nbForm, price: e.target.value })}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="number"
                placeholder="السعر قبل الخصم (اختياري)"
                value={nbForm.oldPrice}
                onChange={(e) => setNbForm({ ...nbForm, oldPrice: e.target.value })}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="url"
                dir="ltr"
                placeholder="رابط عينة Google Drive (اختياري)"
                value={nbForm.driveUrl}
                onChange={(e) => setNbForm({ ...nbForm, driveUrl: e.target.value })}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-left"
              />
              <input
                type="text"
                placeholder="المادة الدراسية (اختياري)"
                value={nbForm.subject}
                onChange={(e) => setNbForm({ ...nbForm, subject: e.target.value })}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="number"
                placeholder="عدد صفحات المذكرة (اختياري)"
                value={nbForm.pagesCount}
                onChange={(e) => setNbForm({ ...nbForm, pagesCount: e.target.value })}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
              />
              <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!nbForm.hidden}
                  onChange={(e) => setNbForm({ ...nbForm, hidden: e.target.checked })}
                />
                <span>إخفاء المذكرة مؤقتًا عن الزوار</span>
              </label>
            </div>

            <input
              type="text"
              placeholder="تنبيه يظهر داخل نافذة معاينة المذكرة (اختياري)"
              value={nbForm.noticeText}
              onChange={(e) => setNbForm({ ...nbForm, noticeText: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <label className="block text-xs font-black text-slate-700">صورة غلاف المذكرة</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const dataUrl = await compressImageFile(file, 900, 0.8);
                    setNbForm((prev) => ({ ...prev, coverImage: dataUrl }));
                  }}
                  className="text-xs"
                />
                {nbForm.coverImage && (
                  <img src={nbForm.coverImage} alt="غلاف" className="h-24 rounded-xl object-cover border" />
                )}
              </div>

              <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <label className="block text-xs font-black text-slate-700">
                  صور صفحات العينة ({nbForm.sampleImages.length} صفحة)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    const compressed = await Promise.all(files.map((f) => compressImageFile(f, 1000, 0.76)));
                    setNbForm((prev) => ({
                      ...prev,
                      sampleImages: [...prev.sampleImages, ...compressed]
                    }));
                  }}
                  className="text-xs"
                />
                {nbForm.sampleImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {nbForm.sampleImages.map((img, i) => (
                      <div key={i} className="relative shrink-0">
                        <img src={img} alt="" className="h-16 w-14 rounded-lg object-cover border" />
                        <button
                          type="button"
                          onClick={() =>
                            setNbForm((prev) => ({
                              ...prev,
                              sampleImages: prev.sampleImages.filter((_, idx) => idx !== i)
                            }))
                          }
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={savingNb}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black"
              >
                {savingNb ? 'جاري الحفظ...' : nbForm.id ? 'حفظ التعديلات' : 'إضافة المذكرة الآن'}
              </button>
              {nbForm.id && (
                <button
                  type="button"
                  onClick={() => setNbForm(emptyNbForm)}
                  className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-black"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>
          </form>

          {/* قائمة المذكرات الحالية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notebooks.map((nb) => {
              const sCount = (samplesMap[nb.id] || nb.inlineSamples || []).length;
              return (
                <div key={nb.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3 items-center">
                  {nb.coverImage ? (
                    <img src={nb.coverImage} alt="" className="w-16 h-20 rounded-xl object-cover border shrink-0" />
                  ) : (
                    <div className="w-16 h-20 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="font-black text-slate-900 text-xs truncate">{nb.title}</div>
                    <div className="text-[11px] text-blue-600 font-bold">
                      {nb.price} ج.م • {sCount} صورة عينة {nb.hidden ? '• (مخفية)' : ''}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setNbForm({
                            id: nb.id,
                            title: nb.title,
                            subtitle: nb.subtitle,
                            categoryId: nb.categoryId,
                            stageId: nb.stageId,
                            gradeId: nb.gradeId,
                            subject: nb.subject || '',
                            term: nb.term || '',
                            pagesCount: nb.pagesCount ? String(nb.pagesCount) : '',
                            price: String(nb.price),
                            oldPrice: nb.oldPrice ? String(nb.oldPrice) : '',
                            badge: nb.badge,
                            driveUrl: nb.driveUrl,
                            noticeText: nb.noticeText,
                            hidden: Boolean(nb.hidden),
                            coverImage: nb.coverImage,
                            sampleImages: samplesMap[nb.id] || nb.inlineSamples || []
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-black"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNbForm({
                            id: '',
                            title: `${nb.title} (نسخة)`,
                            subtitle: nb.subtitle,
                            categoryId: nb.categoryId,
                            stageId: nb.stageId,
                            gradeId: nb.gradeId,
                            subject: nb.subject || '',
                            term: nb.term || '',
                            pagesCount: nb.pagesCount ? String(nb.pagesCount) : '',
                            price: String(nb.price),
                            oldPrice: nb.oldPrice ? String(nb.oldPrice) : '',
                            badge: nb.badge,
                            driveUrl: nb.driveUrl,
                            noticeText: nb.noticeText,
                            hidden: false,
                            coverImage: nb.coverImage,
                            sampleImages: samplesMap[nb.id] || nb.inlineSamples || []
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-black"
                      >
                        نسخ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNotebook(nb.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-black"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              );

                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setNbForm({
                            id: nb.id,
                            title: nb.title,
                            subtitle: nb.subtitle,
                            categoryId: nb.categoryId,
                            stageId: nb.stageId,
                            gradeId: nb.gradeId,
                            price: String(nb.price),
                            oldPrice: nb.oldPrice ? String(nb.oldPrice) : '',
                            badge: nb.badge,
                            driveUrl: nb.driveUrl,
                            noticeText: nb.noticeText,
                            coverImage: nb.coverImage,
                            sampleImages: samplesMap[nb.id] || nb.inlineSamples || []
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-black"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNotebook(nb.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-black"
                      >
                        حذف
                      </button>
                    </div>
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
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base">إدارة الأقسام الرئيسية والمراحل والصفوف</h3>
            <button
              type="button"
              onClick={() =>
                setLocalSettings((prev) => ({
                  ...prev,
                  categories: [
                    ...(prev.categories || []),
                    { id: `cat_${Date.now()}`, name: 'قسم جديد', image: '', stages: [] }
                  ]
                }))
              }
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسم</span>
            </button>
          </div>

          <div className="space-y-4">
            {(localSettings.categories || []).map((cat, cIdx) => (
              <div key={cat.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
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
                      className="p-1 rounded bg-white border disabled:opacity-30"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={cIdx === (localSettings.categories || []).length - 1}
                      onClick={() => {
                        const arr = [...localSettings.categories];
                        [arr[cIdx + 1], arr[cIdx]] = [arr[cIdx], arr[cIdx + 1]];
                        setLocalSettings({ ...localSettings, categories: arr });
                      }}
                      className="p-1 rounded bg-white border disabled:opacity-30"
                    >
                      <ChevronDown className="w-3 h-3" />
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
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black"
                  />
                  <label className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-black cursor-pointer">
                    <span>صورة القسم</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const dataUrl = await compressImageFile(file, 900, 0.8);
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
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black"
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
                    className="p-2 rounded-xl bg-rose-100 text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {cat.image && <img src={cat.image} alt="" className="h-20 rounded-xl object-cover border" />}

                {/* المراحل داخل القسم */}
                <div className="space-y-2 pr-4 border-r-2 border-blue-200">
                  {(cat.stages || []).map((st, sIdx) => (
                    <div key={st.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={st.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocalSettings((prev) => ({
                              ...prev,
                              categories: prev.categories.map((c, i) =>
                                i === cIdx
                                  ? {
                                      ...c,
                                      stages: c.stages.map((s, j) => (j === sIdx ? { ...s, name: val } : s))
                                    }
                                  : c
                              )
                            }));
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
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
                                      stages: c.stages.map((s, j) =>
                                        j === sIdx
                                          ? {
                                              ...s,
                                              grades: [
                                                ...(s.grades || []),
                                                { id: `grd_${Date.now()}`, name: 'صف جديد' }
                                              ]
                                            }
                                          : s
                                      )
                                    }
                                  : c
                              )
                            }))
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-black"
                        >
                          + صف
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLocalSettings((prev) => ({
                              ...prev,
                              categories: prev.categories.map((c, i) =>
                                i === cIdx ? { ...c, stages: c.stages.filter((_, j) => j !== sIdx) } : c
                              )
                            }))
                          }
                          className="p-1.5 text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(st.grades || []).map((gr, gIdx) => (
                          <div key={gr.id} className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border">
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
                                          stages: c.stages.map((s, j) =>
                                            j === sIdx
                                              ? {
                                                  ...s,
                                                  grades: s.grades.map((g, k) =>
                                                    k === gIdx ? { ...g, name: val } : g
                                                  )
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
                                          stages: c.stages.map((s, j) =>
                                            j === sIdx
                                              ? { ...s, grades: s.grades.filter((_, k) => k !== gIdx) }
                                              : s
                                          )
                                        }
                                      : c
                                  )
                                }))
                              }
                              className="text-rose-500 text-xs font-black"
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
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black"
          >
            {savingSettings ? 'جاري الحفظ...' : 'حفظ هيكل الأقسام والصور'}
          </button>
        </div>
      )}

      {/* 3. تبويب الكوبونات والباقات */}
      {activeTab === 'offers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* إدارة الكوبونات */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-900 text-base">إنشاء كوبون خصم بمدة صلاحية</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="كود الخصم (مثلاً M20)"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
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
                <input
                  type="number"
                  required
                  placeholder="قيمة الخصم"
                  value={couponForm.value}
                  onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
                <input
                  type="number"
                  placeholder="الحد الأدنى للطلب (ج.م)"
                  value={couponForm.minOrder}
                  onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
                <div>
                  <input
                    type="datetime-local"
                    value={couponForm.expiresAt}
                    onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="ملاحظة توضيحية للكوبون (اختياري)"
                value={couponForm.note}
                onChange={(e) => setCouponForm({ ...couponForm, note: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black"
              >
                إضافة الكوبون
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {coupons.map((cp) => {
                const expired = isCouponExpired(cp);
                return (
                  <div
                    key={cp.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900">{cp.code}</span>
                        <span className="text-[11px] font-bold text-blue-600">
                          ({cp.value} {cp.type === 'fixed' ? 'ج.م' : '%'})
                        </span>
                        {cp.active === false && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
                            متوقف
                          </span>
                        )}
                        {expired && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">
                            منتهي
                          </span>
                        )}
                      </div>
                      {cp.expiresAt && (
                        <div className="text-[10px] text-slate-500 font-bold">
                          ينتهي: {formatExpiryAr(cp.expiresAt)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          if (db && auth?.currentUser) {
                            await updateDoc(publicDoc('coupons', cp.id), { active: cp.active === false });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border text-[11px] font-black"
                      >
                        {cp.active === false ? 'تفعيل' : 'إيقاف'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (db && auth?.currentUser) await deleteDoc(publicDoc('coupons', cp.id));
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

          {/* إدارة الباقات */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-900 text-base">إضافة باقة توفير</h3>
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
                placeholder="محتويات الباقة"
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
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black"
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
                    <div className="text-[11px] font-bold text-blue-600">{b.price} ج.م</div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (db && auth?.currentUser) await deleteDoc(publicDoc('bundles', b.id));
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
      )}

      {/* 4. تبويب الطلبات الواردة */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
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
              .map((ord) => (
                <div key={ord.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black text-blue-700 text-sm">{ord.orderCode}</span>
                    <div className="flex items-center gap-2">
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
              ))
          )}
        </div>
      )}

      {/* 5. تبويب إعدادات الموقع والمظهر */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* أزرار النسخ الاحتياطي والاستعادة */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-3">
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

          {/* 1. الهوية والشريط الترويجي */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5">
            <h3 className="font-black text-slate-900 text-base">1. الهوية والشعار والشريط الترويجي</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">اسم المنصة</label>
                <input
                  type="text"
                  value={localSettings.platformName}
                  onChange={(e) => setLocalSettings({ ...localSettings, platformName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">الوصف المختصر تحت الاسم</label>
                <input
                  type="text"
                  value={localSettings.platformTagline}
                  onChange={(e) => setLocalSettings({ ...localSettings, platformTagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">رقم واتساب استقبال الطلبات</label>
                <input
                  type="text"
                  dir="ltr"
                  value={localSettings.whatsappNumber}
                  onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-left"
                />
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-black text-slate-800">تفعيل الشريط الترويجي العلوي</span>
                <input
                  type="checkbox"
                  checked={!!localSettings.promoEnabled}
                  onChange={(e) => setLocalSettings({ ...localSettings, promoEnabled: e.target.checked })}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">نص الشريط الترويجي العلوي</label>
                <input
                  type="text"
                  value={localSettings.promoText}
                  onChange={(e) => setLocalSettings({ ...localSettings, promoText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">كود الكوبون في الشريط العلوي</label>
                <input
                  type="text"
                  value={localSettings.promoCouponCode}
                  onChange={(e) => setLocalSettings({ ...localSettings, promoCouponCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-700">شعار المنصة (Logo)</label>
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
                  <img src={localSettings.logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border" />
                )}
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-700">صورة خلفية الواجهة الرئيسية (Hero)</label>
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
                  <img src={localSettings.heroBgImage} alt="Hero" className="h-20 rounded-xl object-cover border" />
                )}
              </div>
            </div>
          </div>

          {/* 2. إعدادات الواجهة الرئيسية (Hero) وبطاقة الثقة */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <h3 className="font-black text-slate-900 text-base">2. الواجهة الرئيسية وبطاقة «لماذا يثق بنا المعلمون؟»</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">الشارة العلوية (Badge)</label>
                <input
                  type="text"
                  value={localSettings.heroBadge}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroBadge: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  شفافية التعتيم فوق الخلفية ({localSettings.heroOverlayOpacity ?? 78}%)
                </label>
                <input
                  type="range"
                  min={20}
                  max={95}
                  value={localSettings.heroOverlayOpacity ?? 78}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroOverlayOpacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  ارتفاع الواجهة ({localSettings.heroMinHeight ?? 460}px)
                </label>
                <input
                  type="number"
                  min={320}
                  max={800}
                  value={localSettings.heroMinHeight ?? 460}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroMinHeight: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">العنوان الرئيسي في الواجهة</label>
              <input
                type="text"
                value={localSettings.heroTitle}
                onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">النص التعريفي في الواجهة</label>
              <textarea
                rows={2}
                value={localSettings.heroSubtitle}
                onChange={(e) => setLocalSettings({ ...localSettings, heroSubtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">نص الزر الرئيسي الأول</label>
                <input
                  type="text"
                  value={localSettings.heroPrimaryBtnText || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroPrimaryBtnText: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">نص زر الباقات الثاني</label>
                <input
                  type="text"
                  value={localSettings.heroSecondaryBtnText || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroSecondaryBtnText: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">نص زر المذكرة الخاصة</label>
                <input
                  type="text"
                  value={localSettings.heroCustomBtnText || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroCustomBtnText: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={localSettings.trustTitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, trustTitle: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      trustPoints: [...(localSettings.trustPoints || []), 'ميزة جديدة للمعلمين']
                    })
                  }
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-black"
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
                      className="p-2 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. إعدادات قسم «ما الجديد؟» وقسم «الأخبار ومذكرات قيد التجهيز» */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5">
            <h3 className="font-black text-slate-900 text-base">3. قسم «ما الجديد؟» وقسم «الأخبار ومذكرات قيد التجهيز»</h3>

            {/* ما الجديد */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">تفعيل قسم «ما الجديد؟» في الرئيسية</span>
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
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                />
                <select
                  value={localSettings.whatsNewMode || 'auto'}
                  onChange={(e) => setLocalSettings({ ...localSettings, whatsNewMode: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
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
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
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

            {/* الأخبار ومذكرات قيد التجهيز */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">تفعيل قسم «أخبار المنصة ومذكرات قيد التجهيز»</span>
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
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
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

          {/* 4. حقول بيانات العميل في السلة وروابط التواصل */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* حقول بيانات العميل */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-sm">4. حقول نموذج طلب المعلم في السلة</h3>
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      checkoutFields: [
                        ...(localSettings.checkoutFields || []),
                        { id: `fld_${Date.now()}`, label: 'حقل إضافي', type: 'text', placeholder: '', required: false, enabled: true }
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
                  <div key={f.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2">
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
                      className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold"
                    >
                      <option value="text">نص</option>
                      <option value="tel">رقم هاتف</option>
                      <option value="textarea">ملاحظات طويلة</option>
                    </select>
                    <label className="text-[11px] font-bold flex items-center gap-1">
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
                ))}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">رسالة تأكيد الطلب بعد الإرسال</label>
                <input
                  type="text"
                  value={localSettings.orderSuccessMessage || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, orderSuccessMessage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                />
              </div>
            </div>

            {/* روابط التواصل الاجتماعي */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-sm">5. روابط التواصل الاجتماعي</h3>
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

          {/* 6. كوبون مكافأة الطلب القادم */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900">6. كوبون مكافأة الطلب القادم التلقائي</span>
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">نسبة الخصم (%)</label>
                <input
                  type="number"
                  value={localSettings.nextOrderReward?.discountPercent ?? 15}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      nextOrderReward: { ...localSettings.nextOrderReward, discountPercent: Number(e.target.value) }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">مدة الصلاحية بالأيام (0 = مفتوح)</label>
                <input
                  type="number"
                  value={localSettings.nextOrderReward?.validDays ?? 7}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      nextOrderReward: { ...localSettings.nextOrderReward, validDays: Number(e.target.value) }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">بادئة الكود</label>
                <input
                  type="text"
                  value={localSettings.nextOrderReward?.prefix ?? 'VIP'}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      nextOrderReward: { ...localSettings.nextOrderReward, prefix: e.target.value.toUpperCase() }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black uppercase"
                />
              </div>
            </div>
          </div>

          {/* 7. بنر المذكرة الخاصة ونص الفوتر */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900">7. بنر «طلب مذكرة بتصميم خاص» والفوتر</span>
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
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
              />
              <input
                type="text"
                placeholder="نص زر البنر"
                value={localSettings.customBannerBtnText || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, customBannerBtnText: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
              />
            </div>
            <input
              type="text"
              placeholder="وصف البنر"
              value={localSettings.customBannerSubtitle || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, customBannerSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
            />
            <input
              type="text"
              placeholder="ملاحظة تذييل الصفحة (Footer)"
              value={localSettings.footerNote || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, footerNote: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg"
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
