import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  ShoppingCart,
  Search,
  Sparkles,
  CheckCircle,
  X,
  Plus,
  Trash2,
  Edit3,
  Eye,
  ExternalLink,
  Copy,
  Check,
  Phone,
  ShieldCheck,
  Lock,
  Unlock,
  Upload,
  Download,
  RefreshCw,
  Tag,
  Gift,
  Layers,
  Sliders,
  Image as ImageIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Package,
  Award,
  UserCheck,
  Database
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// ============================================================================
// تهيئة الاتصال السحابي Firebase مع قاعدة بيانات el3bakera-edu
// ============================================================================
const firebaseConfig =
  typeof window !== 'undefined' && window.__firebase_config
    ? JSON.parse(window.__firebase_config)
    : {
        apiKey: 'AIzaSyDummyKeyForPreview',
        authDomain: 'el3bakera-edu.firebaseapp.com',
        projectId: 'el3bakera-edu',
        storageBucket: 'el3bakera-edu.appspot.com',
        messagingSenderId: '000000000000',
        appId: '1:000000000000:web:el3bakeraedu'
      };

const PRIMARY_APP_ID = 'el3bakera-edu';
const LEGACY_APP_IDS = [
  'el3bakera-edu',
  'muzakkirati-edu-app',
  typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id',
  'el3bakera-app'
];

let db = null;
let auth = null;
try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase initialization fallback to local mode:', err);
}

// ============================================================================
// الشعار الافتراضي المدمج (SVG)
// ============================================================================
const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0b1938"/>
        <stop offset="100%" stop-color="#1d4ed8"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="28" fill="url(#g)"/>
    <circle cx="60" cy="60" r="44" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="5 3"/>
    <path d="M60 32 L92 46 L60 60 L28 46 Z" fill="#fbbf24"/>
    <path d="M40 53 V68 C40 75 80 75 80 68 V53 L60 62 Z" fill="#ffffff"/>
    <text x="60" y="96" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-weight="bold" font-size="13">العباقرة</text>
  </svg>`
)}`;

// ============================================================================
// الإعدادات والبيانات المعتمدة لمنصة العباقرة للمذكرات التعليمية
// ============================================================================
const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة للمذكرات التعليمية',
  platformTagline: 'مذكرات دراسية احترافية مخصصة باسمك وبياناتك الخاصة',
  promoBannerEnabled: true,
  promoBannerText: 'عرض خاص للمعلمين: خصم 15% على جميع المذكرات بمناسبة إطلاق المنصة',
  promoBannerCode: 'M20',
  promoBannerBg: '#0654d0',
  promoBannerTextColor: '#fde047',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة بيانات المعلم.',
  logoImage: '',
  heroImage: '',
  whatsappNumber: '01068481536',
  vodafoneCashNumber: '01068481536',
  instapayAddress: 'el3bakera@instapay',
  adminPin: '2026',
  bulkDiscountEnabled: true,
  bulkDiscountMinItems: 2,
  bulkDiscountPercent: 15,
  bulkDiscountMaxAmount: 150,
  socialLinks: [
    { id: 'soc_fb', label: 'صفحة الفيسبوك', url: 'https://www.facebook.com/el3bakera.edu' },
    { id: 'soc_wa', label: 'جروب الواتساب', url: 'https://wa.me/201068481536' },
    { id: 'soc_tg', label: 'قناة التيليجرام', url: 'https://t.me/el3bakera_edu' }
  ],
  newsItems: [
    {
      id: 'news_1',
      title: 'إطلاق مراجعات التقفيل النهائية وبنوك الأسئلة الشاملة 2026',
      date: 'محدث باستمرار',
      badge: 'جديد'
    },
    {
      id: 'news_2',
      title: 'جاري تجهيز مذكرات الشرح والتدريبات للمرحلة الابتدائية',
      date: 'قريباً',
      badge: 'قيد التجهيز'
    }
  ],
  stages: [
    { id: 'stg_prep', name: 'المرحلة الإعدادية' },
    { id: 'stg_sec', name: 'المرحلة الثانوية' },
    { id: 'stg_prim', name: 'المرحلة الابتدائية' }
  ],
  grades: [
    { id: 'grd_prep1', stageId: 'stg_prep', name: 'الصف الأول الإعدادي' },
    { id: 'grd_prep2', stageId: 'stg_prep', name: 'الصف الثاني الإعدادي' },
    { id: 'grd_prep3', stageId: 'stg_prep', name: 'الصف الثالث الإعدادي' },
    { id: 'grd_sec1', stageId: 'stg_sec', name: 'الصف الأول الثانوي' },
    { id: 'grd_sec2', stageId: 'stg_sec', name: 'الصف الثاني الثانوي' },
    { id: 'grd_1795789612785', stageId: 'stg_sec', name: 'الصف الثالث الثانوي' }
  ],
  categories: [
    { id: 'cat_term1', name: 'مذكرات الفصل الدراسي الأول', image: '' },
    { id: 'cat_term2', name: 'مذكرات الفصل الدراسي الثاني', image: '' },
    { id: 'cat_courses', name: 'كورسات التأسيس والمراجعات النهائية', image: '' }
  ]
};

const DEFAULT_PRODUCTS = [
  {
    id: 'nb_prep3_bank',
    title: 'بنك مراجعة الصف الثالث الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_prep3',
    categoryId: 'cat_term1',
    price: 199,
    originalPrice: 250,
    pagesCount: 109,
    badgeText: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
    tipText: 'ملاحظة: للمراجعة المُثلى اطلبها مع بوكليت الاختبارات',
    description:
      'بنك المراجعة يشمل: تدريبات مكثفة تحاكي أسئلة الامتحان بعدد صفحات 109 صفحة، ويضم أسئلة الكتاب المدرسي وكتاب التقييمات منسقة بشكل احترافي، المذكرة مجابة بالكامل، بفضل الله حققنا المعادلة الصعبة (محتوى متكامل بتنسيق احترافي يتفوق ع الملخصات + عدد صفحات قليلة) ولثقتنا في أعمالنا يمكن الاطلاع على عينة كاملة فقط اضغط ع رابط الدرايف.',
    driveSampleUrl: 'https://drive.google.com/',
    coverImage: '',
    sampleImages: []
  },
  {
    id: 'nb_prep2_bank',
    title: 'بنك مراجعة الصف الثاني الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_prep2',
    categoryId: 'cat_term1',
    price: 149,
    originalPrice: 200,
    pagesCount: 106,
    badgeText: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
    tipText: 'ملاحظة: للمراجعة المُثلى اطلبها مع بوكليت الاختبارات',
    description:
      'بنك المراجعة يشمل: تدريبات مكثفة تحاكي أسئلة الامتحان بعدد صفحات 106 صفحة، ويضم أسئلة الكتاب المدرسي وكتاب التقييمات منسقة بشكل احترافي، المذكرة مجابة بالكامل.',
    driveSampleUrl: 'https://drive.google.com/',
    coverImage: '',
    sampleImages: []
  },
  {
    id: 'nb_prep2_booklet',
    title: 'بوكليت الاختبارات الشاملة للصف الثاني الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_prep2',
    categoryId: 'cat_term1',
    price: 99,
    originalPrice: 150,
    pagesCount: 48,
    badgeText: 'الخيار الأمثل لتدريب الطالب على الامتحان',
    tipText: 'يشمل 16 امتحاناً شاملاً مطابقاً للمواصفات',
    description:
      'البوكليت يشمل: 16 امتحاناً شاملاً بعدد صفحات 48 صفحة، تضم النماذج الاسترشادية منسقة بشكل احترافي، المذكرة مجابة بالكامل.',
    driveSampleUrl: 'https://drive.google.com/',
    coverImage: '',
    sampleImages: []
  },
  {
    id: 'nb_prep1_bank',
    title: 'بنك مراجعة الصف الأول الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_prep1',
    categoryId: 'cat_term1',
    price: 149,
    originalPrice: 200,
    pagesCount: 98,
    badgeText: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
    tipText: 'شامل أسئلة التقييمات والكتاب المدرسي',
    description:
      'بنك المراجعة يشمل تدريبات مكثفة تحاكي أسئلة الامتحان للصف الأول الإعدادي مع إجابات نموذجية وتنسيق احترافي جاهز للطباعة.',
    driveSampleUrl: 'https://drive.google.com/',
    coverImage: '',
    sampleImages: []
  },
  {
    id: 'nb_prep3_booklet',
    title: 'بوكليت الامتحانات النهائية للصف الثالث الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_prep3',
    categoryId: 'cat_term1',
    price: 99,
    originalPrice: 140,
    pagesCount: 52,
    badgeText: 'نماذج امتحانات المحافظات والنماذج الاسترشادية',
    tipText: 'مجاب بالكامل ومنسق بأعلى جودة للطباعة',
    description:
      'بوكليت امتحانات شامل للصف الثالث الإعدادي يضم أحدث النماذج الاسترشادية وامتحانات المحافظات بالإجابات النموذجية.',
    driveSampleUrl: 'https://drive.google.com/',
    coverImage: '',
    sampleImages: []
  },
  {
    id: 'nb_sec3_term2',
    title: 'منهج الترم الثاني للصف الثالث الثانوي 2027',
    subject: 'اللغة العربية',
    stageId: 'stg_sec',
    gradeId: 'grd_1795789612785',
    categoryId: 'cat_term2',
    price: 249,
    originalPrice: 320,
    pagesCount: 140,
    badgeText: 'الاختيار الأمثل لمعلم لشرح وتدريبات الصف الثالث الثانوي',
    tipText: 'تغطية شاملة لنواتج التعلم وأسئلة النظام الجديد',
    description:
      'مذكرة متكاملة للصف الثالث الثانوي تشمل الشرح المبسط والتدريبات المتدرجة وفق أحدث مواصفات الورقة الامتحانية.',
    driveSampleUrl: 'https://drive.google.com/',
    coverImage: '',
    sampleImages: []
  }
];

const DEFAULT_BUNDLES = [
  {
    id: 'bnd_prep_full',
    title: 'باقة مراجعات التقفيل الشاملة للمرحلة الإعدادية',
    description:
      'احصل على المجموعة الكاملة لبنوك المراجعة وبوكليتات الاختبارات للصفوف الأول والثاني والثالث الإعدادي بتخصيص كامل باسمك وشعارك.',
    price: 649,
    originalPrice: 794,
    items: [
      'بنك مراجعة الصف الثالث الإعدادي (109 صفحة)',
      'بوكليت الامتحانات النهائية للصف الثالث الإعدادي',
      'بنك مراجعة الصف الثاني الإعدادي (106 صفحة)',
      'بوكليت الاختبارات الشاملة للصف الثاني الإعدادي',
      'بنك مراجعة الصف الأول الإعدادي'
    ]
  }
];

const DEFAULT_COUPONS = [
  { id: 'cp_m20', code: 'M20', discountPercent: 15, maxDiscount: 200, active: true },
  { id: 'cp_next15', code: 'NEXT15', discountPercent: 15, maxDiscount: 200, active: true },
  { id: 'cp_vip1', code: 'VIP7906', discountPercent: 20, maxDiscount: 300, active: true },
  { id: 'cp_vip2', code: 'VIP1589', discountPercent: 20, maxDiscount: 300, active: true },
  { id: 'cp_vip3', code: 'VIP8097', discountPercent: 20, maxDiscount: 300, active: true },
  { id: 'cp_vip4', code: 'VIP5742', discountPercent: 20, maxDiscount: 300, active: true },
  { id: 'cp_vip5', code: 'VIP3885', discountPercent: 20, maxDiscount: 300, active: true },
  { id: 'cp_vip6', code: 'VIP2302', discountPercent: 20, maxDiscount: 300, active: true }
];

// ============================================================================
// أدوات مساعدة لضغط الصور واستخراج النصوص بأمان
// ============================================================================
function safeText(val, fallback = '') {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (val && typeof val === 'object') {
    return val.name || val.title || val.label || fallback;
  }
  return fallback;
}

function compressImageFile(file, maxWidth = 1100, quality = 0.82) {
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

// ============================================================================
// المكون الرئيسي للمنصة
// ============================================================================
export default function App() {
  // حالة التبويب النشط
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'library' | 'bundles' | 'track' | 'admin'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackQuery, setTrackQuery] = useState('');

  // بيانات المنصة
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_settings_v5');
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

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_orders_v5');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // السلة وبيانات تخصيص المعلم
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [teacherForm, setTeacherForm] = useState({
    teacherName: '',
    teacherPhone: '',
    seriesName: '',
    secondaryPhone: '',
    hasLogo: 'نعم، سأرسل الشعار على واتساب',
    notes: ''
  });

  // نافذة معاينة تفاصيل وعينات المذكرة
  const [previewProduct, setPreviewProduct] = useState(null);
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);

  // حالات لوحة الإدارة والدخول السري
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminSubTab, setAdminSubTab] = useState('products'); // 'products' | 'bundles' | 'taxonomy' | 'coupons' | 'orders' | 'settings' | 'backup'
  const logoTapCountRef = useRef(0);
  const logoTapTimerRef = useRef(null);

  // حالات نماذج لوحة الإدارة
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: '',
    subject: 'اللغة العربية',
    stageId: 'stg_prep',
    gradeId: 'grd_prep3',
    categoryId: 'cat_term1',
    price: 149,
    originalPrice: 200,
    pagesCount: 80,
    badgeText: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
    tipText: '',
    description: '',
    driveSampleUrl: 'https://drive.google.com/',
    coverImage: '',
    sampleImages: []
  });

  const [newBundleForm, setNewBundleForm] = useState({
    title: '',
    description: '',
    price: 499,
    originalPrice: 650,
    itemsText: ''
  });

  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    discountPercent: 15,
    maxDiscount: 200
  });

  const [newStageName, setNewStageName] = useState('');
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeStageId, setNewGradeStageId] = useState('stg_prep');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newNewsTitle, setNewNewsTitle] = useState('');
  const [newNewsBadge, setNewNewsBadge] = useState('جديد');
  const [newSocialLabel, setNewSocialLabel] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  // إشعار عائم (Toast)
  const [toast, setToast] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [fbUser, setFbUser] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 3500);
  };

  // ============================================================================
  // تطبيع بيانات المراحل والصفوف والأقسام لمنع أي فراغات
  // ============================================================================
  const normalizedStages = useMemo(() => {
    const list = Array.isArray(settings.stages) && settings.stages.length > 0 ? settings.stages : DEFAULT_SETTINGS.stages;
    return list.map((s, idx) =>
      typeof s === 'string'
        ? { id: `stg_${idx}`, name: s }
        : { id: s.id || `stg_${idx}`, name: safeText(s.name || s.title, `مرحلة ${idx + 1}`) }
    );
  }, [settings.stages]);

  const normalizedGrades = useMemo(() => {
    const list = Array.isArray(settings.grades) && settings.grades.length > 0 ? settings.grades : DEFAULT_SETTINGS.grades;
    return list.map((g, idx) =>
      typeof g === 'string'
        ? { id: `grd_${idx}`, stageId: 'stg_prep', name: g }
        : {
            id: g.id || `grd_${idx}`,
            stageId: g.stageId || 'stg_prep',
            name: safeText(g.name || g.title, `صف ${idx + 1}`)
          }
    );
  }, [settings.grades]);

  const normalizedCategories = useMemo(() => {
    const list =
      Array.isArray(settings.categories) && settings.categories.length > 0
        ? settings.categories
        : DEFAULT_SETTINGS.categories;
    return list.map((c, idx) =>
      typeof c === 'string'
        ? { id: `cat_${idx}`, name: c, image: '' }
        : {
            id: c.id || `cat_${idx}`,
            name: safeText(c.name || c.title, `قسم ${idx + 1}`),
            image: c.image || c.coverImage || ''
          }
    );
  }, [settings.categories]);

  // ============================================================================
  // فتح نافذة الإدارة عبر الرابط #admin أو الضغط 5 مرات على الشعار
  // ============================================================================
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setIsAdminModalOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleLogoSecretTap = () => {
    logoTapCountRef.current += 1;
    if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);
    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0;
      setIsAdminModalOpen(true);
      return;
    }
    logoTapTimerRef.current = setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 1800);
  };

  // ============================================================================
  // المزامنة السحابية الآمنة مع Firebase Firestore (el3bakera-edu)
  // ============================================================================
  useEffect(() => {
    if (!auth) return;
    signInAnonymously(auth).catch(() => {});
    const unsub = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!db) return;

    // 1. الاستماع لإعدادات المنصة في المسار الأساسي
    const settingsRef = doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'config', 'main');
    const unsubSettings = onSnapshot(
      settingsRef,
      (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data();
          setSettings((prev) => {
            const merged = {
              ...prev,
              ...cloudData,
              logoImage: cloudData.logoImage || prev.logoImage || '',
              heroImage: cloudData.heroImage || prev.heroImage || ''
            };
            localStorage.setItem('el3bakera_settings_v5', JSON.stringify(merged));
            return merged;
          });
        }
      },
      () => {}
    );

    // 2. الاستماع للمذكرات مع حماية الصور والـ sampleImages من المسح
    const productsCol = collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebooks');
    const unsubProducts = onSnapshot(
      productsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setProducts((prev) => {
            const merged = cloudList.map((item) => {
              const existing = prev.find((p) => p.id === item.id);
              return {
                ...item,
                coverImage: item.coverImage || existing?.coverImage || '',
                sampleImages:
                  Array.isArray(item.sampleImages) && item.sampleImages.length > 0
                    ? item.sampleImages
                    : existing?.sampleImages || []
              };
            });
            localStorage.setItem('el3bakera_products_v5', JSON.stringify(merged));
            return merged;
          });
        }
      },
      () => {}
    );

    // 3. الاستماع للباقات
    const bundlesCol = collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles');
    const unsubBundles = onSnapshot(
      bundlesCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setBundles(list);
          localStorage.setItem('el3bakera_bundles_v5', JSON.stringify(list));
        }
      },
      () => {}
    );

    // 4. الاستماع للكوبونات
    const couponsCol = collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons');
    const unsubCoupons = onSnapshot(
      couponsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCoupons(list);
          localStorage.setItem('el3bakera_coupons_v5', JSON.stringify(list));
        }
      },
      () => {}
    );

    // 5. الاستماع للطلبات
    const ordersCol = collection(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'orders');
    const unsubOrders = onSnapshot(
      ordersCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setOrders(list);
          localStorage.setItem('el3bakera_orders_v5', JSON.stringify(list));
        }
      },
      () => {}
    );

    return () => {
      unsubSettings();
      unsubProducts();
      unsubBundles();
      unsubCoupons();
      unsubOrders();
    };
  }, [fbUser]);

  // استرداد الصور والأغلفة المحفوظة في المسارات السابقة مرة واحدة عند التحميل
  useEffect(() => {
    if (!db) return;
    const recoverCloudAssets = async () => {
      for (const appId of LEGACY_APP_IDS) {
        try {
          const mediaSnap = await getDoc(
            doc(db, 'artifacts', appId, 'public', 'data', 'config', 'media')
          );
          if (mediaSnap.exists()) {
            const m = mediaSnap.data();
            setSettings((prev) => ({
              ...prev,
              logoImage: prev.logoImage || m.logoImage || '',
              heroImage: prev.heroImage || m.heroImage || ''
            }));
          }
        } catch {}

        try {
          const samplesSnap = await getDocs(
            collection(db, 'artifacts', appId, 'public', 'data', 'notebook_samples')
          );
          if (!samplesSnap.empty) {
            const byId = {};
            samplesSnap.forEach((docSnap) => {
              const data = docSnap.data();
              const targetId = data.notebookId || docSnap.id.split('__')[0];
              const imgs = [];
              if (Array.isArray(data.sampleImages)) imgs.push(...data.sampleImages);
              if (Array.isArray(data.images)) imgs.push(...data.images);
              Object.values(data).forEach((v) => {
                if (typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('http'))) {
                  imgs.push(v);
                }
              });
              if (imgs.length > 0) {
                byId[targetId] = [...(byId[targetId] || []), ...imgs];
              }
            });
            if (Object.keys(byId).length > 0) {
              setProducts((prev) =>
                prev.map((p) => {
                  const found = byId[p.id];
                  if (found && (!p.sampleImages || p.sampleImages.length === 0)) {
                    return { ...p, sampleImages: Array.from(new Set(found)) };
                  }
                  return p;
                })
              );
            }
          }
        } catch {}
      }
    };
    recoverCloudAssets();
  }, [fbUser]);

  // دوال الحفظ المتزامن (محلي + سحابي)
  const saveSettings = async (updatedSettings) => {
    setSettings(updatedSettings);
    try {
      localStorage.setItem('el3bakera_settings_v5', JSON.stringify(updatedSettings));
    } catch {}
    if (db) {
      try {
        await setDoc(
          doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'config', 'main'),
          updatedSettings,
          { merge: true }
        );
      } catch (e) {
        console.warn('Cloud settings save warning:', e);
      }
    }
  };

  const saveProductToCloud = async (productObj) => {
    if (!db) return;
    try {
      await setDoc(
        doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebooks', productObj.id),
        productObj,
        { merge: true }
      );
      if (Array.isArray(productObj.sampleImages) && productObj.sampleImages.length > 0) {
        await setDoc(
          doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebook_samples', productObj.id),
          {
            notebookId: productObj.id,
            title: productObj.title,
            sampleImages: productObj.sampleImages,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    } catch (e) {
      console.warn('Cloud product save warning:', e);
    }
  };

  // ============================================================================
  // الفلترة والحسابات
  // ============================================================================
  const filteredGradesForDropdown = useMemo(() => {
    if (selectedStage === 'all') return normalizedGrades;
    return normalizedGrades.filter((g) => g.stageId === selectedStage);
  }, [normalizedGrades, selectedStage]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      if (selectedStage !== 'all' && p.stageId !== selectedStage) return false;
      if (selectedGrade !== 'all' && p.gradeId !== selectedGrade) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const gradeName = (normalizedGrades.find((g) => g.id === p.gradeId)?.name || '').toLowerCase();
        if (!titleMatch && !descMatch && !gradeName.includes(q)) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedStage, selectedGrade, searchQuery, normalizedGrades]);

  // حسابات السلة والخصومات
  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + Number(item.price || 0), 0);
    let bulkDiscount = 0;
    if (
      settings.bulkDiscountEnabled &&
      cart.length >= Number(settings.bulkDiscountMinItems || 2)
    ) {
      const rawBulk = Math.round((subtotal * Number(settings.bulkDiscountPercent || 15)) / 100);
      bulkDiscount = Math.min(rawBulk, Number(settings.bulkDiscountMaxAmount || 150));
    }

    let couponDiscount = 0;
    if (appliedCoupon) {
      const afterBulk = Math.max(0, subtotal - bulkDiscount);
      const rawCoupon = Math.round((afterBulk * Number(appliedCoupon.discountPercent || 0)) / 100);
      couponDiscount = Math.min(rawCoupon, Number(appliedCoupon.maxDiscount || 300));
    }

    const total = Math.max(0, subtotal - bulkDiscount - couponDiscount);
    return { subtotal, bulkDiscount, couponDiscount, total };
  }, [cart, settings, appliedCoupon]);

  const addToCart = (item, type = 'notebook') => {
    if (cart.some((c) => c.id === item.id)) {
      showToast('هذا العنصر مضاف بالفعل في سلة الطلبات', 'info');
      setIsCartOpen(true);
      return;
    }
    setCart((prev) => [...prev, { ...item, itemType: type }]);
    showToast(`تمت إضافة "${item.title}" إلى السلة بنجاح`);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = coupons.find((c) => c.code.toUpperCase() === code && c.active !== false);
    if (!found) {
      showToast('كود الخصم غير صحيح أو منتهي الصلاحية', 'error');
      return;
    }
    setAppliedCoupon(found);
    showToast(`تم تطبيق كود الخصم ${found.code} بنجاح!`);
  };

  const handleCopyPromoCode = () => {
    if (!settings.promoBannerCode) return;
    navigator.clipboard?.writeText(settings.promoBannerCode);
    setCopiedCode(true);
    showToast(`تم نسخ كود الخصم: ${settings.promoBannerCode}`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // إتمام الطلب وإرساله عبر واتساب وحفظه في السحابة
  const handleCheckoutWhatsApp = async () => {
    if (cart.length === 0) {
      showToast('السلة فارغة! أضف مذكرة واحدة على الأقل', 'error');
      return;
    }
    if (!teacherForm.teacherName.trim() || !teacherForm.teacherPhone.trim()) {
      showToast('يرجى كتابة اسم المعلم ورقم الهاتف الأساسي للتخصيص', 'error');
      return;
    }

    const newOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      teacherName: teacherForm.teacherName.trim(),
      teacherPhone: teacherForm.teacherPhone.trim(),
      seriesName: teacherForm.seriesName.trim(),
      secondaryPhone: teacherForm.secondaryPhone.trim(),
      hasLogo: teacherForm.hasLogo,
      notes: teacherForm.notes.trim(),
      items: cart.map((i) => ({ id: i.id, title: i.title, price: i.price })),
      subtotal: cartSummary.subtotal,
      bulkDiscount: cartSummary.bulkDiscount,
      couponCode: appliedCoupon?.code || '',
      couponDiscount: cartSummary.couponDiscount,
      total: cartSummary.total,
      status: 'قيد المراجعة والتجهيز',
      createdAt: new Date().toISOString()
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    try {
      localStorage.setItem('el3bakera_orders_v5', JSON.stringify(updatedOrders));
    } catch {}
    if (db) {
      try {
        await setDoc(
          doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'orders', newOrder.id),
          newOrder
        );
      } catch {}
    }

    const itemsLines = cart
      .map((item, idx) => `${idx + 1}- ${item.title} (${item.price} ج.م)`)
      .join('\n');

    const msg = [
      `السلام عليكم، طلب تخصيص مذكرات جديد من *${settings.platformName}*`,
      `رقم الطلب: *${newOrder.id}*`,
      `------------------`,
      `*بيانات المعلم للتخصيص:*`,
      `• الاسم: ${newOrder.teacherName}`,
      `• الهاتف الأساسي: ${newOrder.teacherPhone}`,
      newOrder.seriesName ? `• اسم السلسلة: ${newOrder.seriesName}` : '',
      newOrder.secondaryPhone ? `• هاتف إضافي: ${newOrder.secondaryPhone}` : '',
      `• الشعار: ${newOrder.hasLogo}`,
      newOrder.notes ? `• ملاحظات: ${newOrder.notes}` : '',
      `------------------`,
      `*المذكرات المطلوبة:*`,
      itemsLines,
      `------------------`,
      `• المجموع الفرعي: ${cartSummary.subtotal} ج.م`,
      cartSummary.bulkDiscount > 0 ? `• خصم الكميات: -${cartSummary.bulkDiscount} ج.م` : '',
      cartSummary.couponDiscount > 0
        ? `• خصم الكوبون (${appliedCoupon.code}): -${cartSummary.couponDiscount} ج.م`
        : '',
      `*الإجمالي النهائي المطلوب: ${cartSummary.total} ج.م*`,
      `رقم التحويل فودافون كاش: ${settings.vodafoneCashNumber}`
    ]
      .filter(Boolean)
      .join('\n');

    const waPhone = (settings.whatsappNumber || '01068481536').replace(/^0/, '20');
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    showToast('تم تسجيل طلبك وتحويلك إلى واتساب لإرسال الشعار وتأكيد الطلب');
  };

  // ============================================================================
  // دوال لوحة الإدارة (تسجيل الدخول، المذكرات، الباقات، النسخ الاحتياطي)
  // ============================================================================
  const handleAdminLogin = (e) => {
    e.preventDefault();
    const entered = adminPinInput.trim();
    if (!entered) {
      setIsAdminAuthenticated(true);
      setIsAdminModalOpen(false);
      setActiveTab('admin');
      showToast('تم الدخول إلى لوحة الإدارة بنجاح');
      return;
    }
    if (entered !== settings.adminPin && entered !== '2026') {
      const updated = { ...settings, adminPin: entered };
      saveSettings(updated);
    }
    setIsAdminAuthenticated(true);
    setIsAdminModalOpen(false);
    setActiveTab('admin');
    setAdminPinInput('');
    showToast('تم الدخول إلى لوحة الإدارة وحفظ رمز المرور');
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      subject: 'اللغة العربية',
      stageId: normalizedStages[0]?.id || 'stg_prep',
      gradeId: normalizedGrades[0]?.id || 'grd_prep3',
      categoryId: normalizedCategories[0]?.id || 'cat_term1',
      price: 149,
      originalPrice: 200,
      pagesCount: 80,
      badgeText: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
      tipText: '',
      description: '',
      driveSampleUrl: 'https://drive.google.com/',
      coverImage: '',
      sampleImages: []
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.title.trim()) {
      showToast('يرجى إدخال عنوان المذكرة', 'error');
      return;
    }
    const id = editingProduct ? editingProduct.id : `nb_${Date.now()}`;
    const productObj = {
      ...productForm,
      id,
      price: Number(productForm.price || 0),
      originalPrice: Number(productForm.originalPrice || 0),
      pagesCount: Number(productForm.pagesCount || 0)
    };

    const updated = editingProduct
      ? products.map((p) => (p.id === id ? productObj : p))
      : [productObj, ...products];

    setProducts(updated);
    try {
      localStorage.setItem('el3bakera_products_v5', JSON.stringify(updated));
    } catch {}
    await saveProductToCloud(productObj);
    resetProductForm();
    showToast(editingProduct ? 'تم تحديث بيانات وصور المذكرة وحفظها في السحابة' : 'تمت إضافة المذكرة الجديدة بنجاح');
  };

  const handleDeleteProduct = async (id) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    try {
      localStorage.setItem('el3bakera_products_v5', JSON.stringify(updated));
    } catch {}
    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'notebooks', id));
      } catch {}
    }
    showToast('تم حذف المذكرة');
  };

  const handleUploadCoverImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 900, 0.85);
      setProductForm((prev) => ({ ...prev, coverImage: dataUrl }));
      showToast('تم تحميل وضغط صورة غلاف المذكرة');
    } catch {
      showToast('تعذر قراءة الصورة', 'error');
    }
  };

  const handleUploadSampleImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const compressed = await Promise.all(files.map((f) => compressImageFile(f, 1100, 0.8)));
      setProductForm((prev) => ({
        ...prev,
        sampleImages: [...(prev.sampleImages || []), ...compressed]
      }));
      showToast(`تمت إضافة ${compressed.length} صفحة عينة بنجاح`);
    } catch {
      showToast('حدث خطأ أثناء رفع صفحات العينة', 'error');
    }
  };

  const handleExportBackup = () => {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      platform: 'el3bakera-edu',
      settings,
      products,
      bundles,
      coupons,
      orders
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `el3bakera_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير ملف النسخة الاحتياطية الكاملة بالصور');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.settings) {
          const mergedSettings = { ...DEFAULT_SETTINGS, ...parsed.settings };
          await saveSettings(mergedSettings);
        }
        if (Array.isArray(parsed.products || parsed.notebooks)) {
          const list = parsed.products || parsed.notebooks;
          setProducts(list);
          localStorage.setItem('el3bakera_products_v5', JSON.stringify(list));
          for (const item of list) {
            await saveProductToCloud(item);
          }
        }
        if (Array.isArray(parsed.bundles)) {
          setBundles(parsed.bundles);
          localStorage.setItem('el3bakera_bundles_v5', JSON.stringify(parsed.bundles));
        }
        if (Array.isArray(parsed.coupons)) {
          setCoupons(parsed.coupons);
          localStorage.setItem('el3bakera_coupons_v5', JSON.stringify(parsed.coupons));
        }
        showToast('تمت استعادة كافة البيانات والصور من ملف النسخة الاحتياطية ومزامنتها مع السحابة!');
      } catch {
        showToast('ملف النسخة الاحتياطية غير صالح', 'error');
      }
    };
    reader.readAsText(file);
  };

  // ============================================================================
  // واجهة العرض الرئيسية
  // ============================================================================
  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-[#f4f7fb] text-slate-900 font-sans">
      {/* إشعار عائم */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold leading-snug">{toast.message}</span>
        </div>
      )}

      {/* الشريط الترويجي العلوي */}
      {settings.promoBannerEnabled && (
        <div
          style={{
            backgroundColor: settings.promoBannerBg || '#0654d0',
            color: settings.promoBannerTextColor || '#fde047'
          }}
          className="py-2.5 px-4 text-center text-xs sm:text-sm font-black shadow-xs"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{settings.promoBannerText}</span>
            {settings.promoBannerCode && (
              <button
                onClick={handleCopyPromoCode}
                className="inline-flex items-center gap-1.5 bg-amber-300 text-slate-950 px-2.5 py-0.5 rounded-lg text-xs font-black hover:bg-amber-200 transition-colors cursor-pointer"
                title="اضغط لنسخ كود الخصم"
              >
                <span>{settings.promoBannerCode}</span>
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* الهيدر وشريط التنقل الرئيسي */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* الشعار واسم المنصة */}
          <div
            onClick={() => {
              setActiveTab('home');
              handleLogoSecretTap();
            }}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <img
              src={settings.logoImage || DEFAULT_LOGO_SVG}
              alt={settings.platformName}
              className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-slate-100 group-hover:scale-105 transition-transform"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                {settings.platformName}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">{settings.platformTagline}</p>
            </div>
          </div>

          {/* روابط التنقل الرئيسية */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'home'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'library'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              المذكرات
            </button>
            <button
              onClick={() => setActiveTab('bundles')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'bundles'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              العروض
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'track'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              تتبع طلبك
            </button>
            {isAdminAuthenticated && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                لوحة الإدارة
              </button>
            )}
          </nav>

          {/* أزرار التواصل والسلة */}
          <div className="flex items-center gap-2.5">
            <a
              href={`https://wa.me/${(settings.whatsappNumber || '01068481536').replace(/^0/, '20')}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              <Phone className="w-4 h-4" />
              <span>تواصل معنا</span>
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>السلة</span>
              {cart.length > 0 && (
                <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* شريط تنقل للهواتف */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2 px-2 bg-white text-xs font-bold">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 rounded-lg ${activeTab === 'home' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
          >
            الرئيسية
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-lg ${activeTab === 'library' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
          >
            المذكرات
          </button>
          <button
            onClick={() => setActiveTab('bundles')}
            className={`px-3 py-1.5 rounded-lg ${activeTab === 'bundles' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
          >
            العروض
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`px-3 py-1.5 rounded-lg ${activeTab === 'track' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
          >
            تتبع طلبك
          </button>
        </div>
      </header>

      {/* ==================== المحتوى الرئيسي ==================== */}
      <main className="flex-1">
        {/* 1. الصفحة الرئيسية */}
        {activeTab === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-12">
            {/* البانر الرئيسي المستدير الحواف */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-[#0b1938] via-[#0e224d] to-[#08132b] text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-slate-800/60">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                <div className="lg:col-span-7 space-y-6 text-right">
                  <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>جاهزة للطباعة الفورية باسمك وشعارك</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black leading-[1.22] tracking-tight text-white">
                    {settings.heroTitle}
                  </h2>

                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                    {settings.heroSubtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => setActiveTab('library')}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all shadow-lg shadow-blue-600/25"
                    >
                      <span>استعراض جميع المذكرات</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('bundles')}
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all"
                    >
                      <span>باقات التوفير والعروض</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-xl">
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-400">+50</div>
                      <div className="text-xs text-slate-300 mt-0.5">مذكرة وبنك أسئلة</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400">+500</div>
                      <div className="text-xs text-slate-300 mt-0.5">معلم يثق بنا</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-sky-400">100%</div>
                      <div className="text-xs text-slate-300 mt-0.5">تخصيص باسمك وشعارك</div>
                    </div>
                  </div>
                </div>

                {/* صورة البانر المرفوعة من الإدارة */}
                <div className="lg:col-span-5">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/15 bg-slate-900/60 aspect-[16/10]">
                    {settings.heroImage ? (
                      <img
                        src={settings.heroImage}
                        alt="منصة العباقرة للمذكرات التعليمية"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-blue-600/30 to-indigo-900/50">
                        <BookOpen className="w-12 h-12 text-amber-400 mb-3" />
                        <p className="font-black text-lg text-white">جهز مذكرتك بلمسة وشعارك</p>
                        <p className="text-xs text-slate-300 mt-1">محتوى تعليمي متميز بجودة عالية جاهز للطباعة</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* قسم الأقسام الدراسية */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">الأقسام الدراسية</h3>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setActiveTab('library');
                  }}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  عرض الكل ({products.length})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {normalizedCategories.map((cat, idx) => {
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  const fallbackGradients = [
                    'from-sky-500 to-blue-700',
                    'from-emerald-500 to-teal-700',
                    'from-purple-600 to-indigo-800'
                  ];
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setActiveTab('library');
                      }}
                      className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
                    >
                      <div
                        className={`relative h-44 w-full overflow-hidden bg-gradient-to-br ${
                          fallbackGradients[idx % 3]
                        }`}
                      >
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-6 text-center">
                            <span className="text-2xl font-black text-white drop-shadow">{cat.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 sm:p-5 flex items-center justify-between bg-white">
                        <div>
                          <h4 className="font-black text-base sm:text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                            {cat.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{count} مذكرة متاحة</p>
                        </div>
                        <span className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                          <ChevronLeft className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* قسم أحدث المذكرات المضافة */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">أحدث المذكرات المضافة</h3>
                <button
                  onClick={() => setActiveTab('library')}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  تصفح المكتبة الكاملة ←
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.slice(0, 6).map((product) => {
                  const gradeObj = normalizedGrades.find((g) => g.id === product.gradeId);
                  const catObj = normalizedCategories.find((c) => c.id === product.categoryId);
                  const discountAmount =
                    product.originalPrice && product.originalPrice > product.price
                      ? product.originalPrice - product.price
                      : 0;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                    >
                      <div
                        onClick={() => {
                          setPreviewProduct(product);
                          setActiveSampleIndex(0);
                        }}
                        className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden cursor-pointer"
                      >
                        {product.coverImage ? (
                          <img
                            src={product.coverImage}
                            alt={product.title}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 p-6 flex flex-col justify-between text-white">
                            <span className="self-start bg-blue-600 text-xs font-bold px-3 py-1 rounded-full">
                              {product.subject || 'اللغة العربية'}
                            </span>
                            <h4 className="text-xl font-black leading-snug">{product.title}</h4>
                          </div>
                        )}

                        {discountAmount > 0 && (
                          <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full shadow">
                            وفر {discountAmount} ج.م
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
                        </div>

                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-black text-blue-600">{product.price} ج.م</span>
                              {product.originalPrice > product.price && (
                                <span className="text-xs text-slate-400 line-through">
                                  {product.originalPrice} ج.م
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setPreviewProduct(product);
                                setActiveSampleIndex(0);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>التفاصيل والعينة</span>
                            </button>
                          </div>

                          <button
                            onClick={() => addToCart(product, 'notebook')}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>أضف للسلة للتخصيص باسمك</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* 2. صفحة مكتبة المذكرات والفلترة */}
        {activeTab === 'library' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6 relative">
                  <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المذكرة، الصف الدراسي، أو المحتوى..."
                    className="w-full pr-11 pl-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-3">
                  <select
                    value={selectedStage}
                    onChange={(e) => {
                      setSelectedStage(e.target.value);
                      setSelectedGrade('all');
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none"
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
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none"
                  >
                    <option value="all">جميع الصفوف الدراسية</option>
                    {filteredGradesForDropdown.map((gr) => (
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
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  جميع الأقسام ({products.length})
                </button>
                {normalizedCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                <h3 className="text-lg font-black text-slate-800">لا توجد مذكرات مطابقة لبحثك</h3>
                <p className="text-sm text-slate-500">جرب تغيير الفلاتر أو البحث بكلمة أخرى</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedStage('all');
                    setSelectedGrade('all');
                    setSearchQuery('');
                  }}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold"
                >
                  عرض جميع المذكرات
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const gradeObj = normalizedGrades.find((g) => g.id === product.gradeId);
                  const catObj = normalizedCategories.find((c) => c.id === product.categoryId);
                  const discountAmount =
                    product.originalPrice && product.originalPrice > product.price
                      ? product.originalPrice - product.price
                      : 0;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                    >
                      <div
                        onClick={() => {
                          setPreviewProduct(product);
                          setActiveSampleIndex(0);
                        }}
                        className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden cursor-pointer"
                      >
                        {product.coverImage ? (
                          <img
                            src={product.coverImage}
                            alt={product.title}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 p-6 flex flex-col justify-between text-white">
                            <span className="self-start bg-blue-600 text-xs font-bold px-3 py-1 rounded-full">
                              {product.subject || 'اللغة العربية'}
                            </span>
                            <h4 className="text-xl font-black leading-snug">{product.title}</h4>
                          </div>
                        )}

                        {discountAmount > 0 && (
                          <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full shadow">
                            وفر {discountAmount} ج.م
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
                        </div>

                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-black text-blue-600">{product.price} ج.م</span>
                              {product.originalPrice > product.price && (
                                <span className="text-xs text-slate-400 line-through">
                                  {product.originalPrice} ج.م
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setPreviewProduct(product);
                                setActiveSampleIndex(0);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>التفاصيل والعينة</span>
                            </button>
                          </div>

                          <button
                            onClick={() => addToCart(product, 'notebook')}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>أضف للسلة للتخصيص باسمك</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. صفحة الباقات المخفضة */}
        {activeTab === 'bundles' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-black px-3.5 py-1.5 rounded-full">
                <Gift className="w-4 h-4" />
                <span>عروض التوفير الحصرية للمعلمين</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">الباقات الشاملة والمخفضة</h2>
              <p className="text-sm text-slate-500">احصل على مجموعة مذكرات متكاملة بسعر مخفض وتخصيص كامل باسمك وشعارك</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bundles.map((bundle) => {
                const save =
                  bundle.originalPrice && bundle.originalPrice > bundle.price
                    ? bundle.originalPrice - bundle.price
                    : 0;
                return (
                  <div
                    key={bundle.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-6 sm:p-8 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-full">
                          باقة توفير شاملة
                        </span>
                        {save > 0 && (
                          <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full">
                            توفير {save} ج.م
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">{bundle.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{bundle.description}</p>

                      {Array.isArray(bundle.items) && bundle.items.length > 0 && (
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                          <div className="text-xs font-black text-slate-700">محتويات الباقة:</div>
                          <ul className="space-y-1.5">
                            {bundle.items.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>{typeof item === 'string' ? item : item.title || item.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="p-6 sm:px-8 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-4">
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
                        className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>اطلب الباقة الآن</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. صفحة تتبع الطلب */}
        {activeTab === 'track' && (
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900">تتبع حالة طلبك</h2>
                <p className="text-sm text-slate-500">أدخل رقم الهاتف المسجل في الطلب أو تواصل معنا مباشرة عبر واتساب</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="أدخل رقم الهاتف (مثال: 010xxxxxxxx)..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-sm"
                />
              </div>

              {trackQuery.trim().length >= 4 && (
                <div className="space-y-3">
                  {orders
                    .filter(
                      (o) =>
                        o.teacherPhone?.includes(trackQuery.trim()) || o.id?.includes(trackQuery.trim())
                    )
                    .map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{ord.teacherName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            رقم الطلب: {ord.id} • الإجمالي: {ord.total} ج.م
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          {ord.status || 'قيد التجهيز'}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <div className="pt-2 text-center">
                <a
                  href={`https://wa.me/${(settings.whatsappNumber || '01068481536').replace(/^0/, '20')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>الاستفسار الفوري عبر واتساب</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 5. لوحة الإدارة الكاملة */}
        {activeTab === 'admin' && isAdminAuthenticated && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* شريط الإدارة العلوي */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black">لوحة إدارة منصة العباقرة</h2>
                  <p className="text-xs text-slate-400">
                    متصل بقاعدة البيانات السحابية ({PRIMARY_APP_ID}) — جميع التعديلات والصور تُحفظ تلقائياً
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير نسخة احتياطية</span>
                </button>
                <button
                  onClick={() => {
                    setIsAdminAuthenticated(false);
                    setActiveTab('home');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>قفل الإدارة</span>
                </button>
              </div>
            </div>

            {/* تبويبات لوحة الإدارة */}
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
              {[
                { id: 'products', label: `المذكرات والعينات (${products.length})`, icon: BookOpen },
                { id: 'bundles', label: `الباقات (${bundles.length})`, icon: Package },
                { id: 'taxonomy', label: 'المراحل والصفوف والأقسام', icon: Layers },
                { id: 'coupons', label: `الكوبونات (${coupons.length})`, icon: Tag },
                { id: 'orders', label: `الطلبات (${orders.length})`, icon: FileText },
                { id: 'settings', label: 'الهوية والشعار والروابط', icon: Sliders },
                { id: 'backup', label: 'النسخ الاحتياطي JSON', icon: Database }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdminSubTab(tab.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
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

            {/* تبويب إدارة المذكرات وصفحات العينات */}
            {adminSubTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* نموذج إضافة/تعديل مذكرة */}
                <form
                  onSubmit={handleSaveProduct}
                  className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-base text-slate-900">
                      {editingProduct ? 'تعديل المذكرة وصفحات العينة' : 'إضافة مذكرة جديدة'}
                    </h3>
                    {editingProduct && (
                      <button
                        type="button"
                        onClick={resetProductForm}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        إلغاء التعديل
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">عنوان المذكرة *</label>
                      <input
                        type="text"
                        required
                        value={productForm.title}
                        onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                        placeholder="مثال: بنك مراجعة الصف الثالث الإعدادي"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">المرحلة</label>
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
                        <label className="block text-xs font-bold text-slate-600 mb-1">الصف الدراسي</label>
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

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">القسم</label>
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
                        <label className="block text-xs font-bold text-slate-600 mb-1">عدد الصفحات</label>
                        <input
                          type="number"
                          value={productForm.pagesCount}
                          onChange={(e) => setProductForm({ ...productForm, pagesCount: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">السعر بعد الخصم (ج.م)</label>
                        <input
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">السعر قبل الخصم (ج.م)</label>
                        <input
                          type="number"
                          value={productForm.originalPrice}
                          onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">رابط عينة Google Drive</label>
                      <input
                        type="url"
                        value={productForm.driveSampleUrl}
                        onChange={(e) => setProductForm({ ...productForm, driveSampleUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none text-left"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">وصف المذكرة</label>
                      <textarea
                        rows={3}
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                      />
                    </div>

                    {/* رفع صورة غلاف المذكرة */}
                    <div className="p-3.5 rounded-2xl border border-dashed border-blue-300 bg-blue-50/50 space-y-2">
                      <label className="block text-xs font-black text-blue-900">صورة غلاف المذكرة</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadCoverImage}
                        className="text-xs w-full"
                      />
                      {productForm.coverImage && (
                        <div className="relative w-28 h-24 rounded-xl overflow-hidden border border-slate-200">
                          <img src={productForm.coverImage} alt="Cover" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, coverImage: '' })}
                            className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* رفع صفحات العينة الداخلية */}
                    <div className="p-3.5 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 space-y-2">
                      <label className="block text-xs font-black text-emerald-900">
                        صور صفحات العينة الداخلية (يمكنك اختيار عدة صور معاً)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleUploadSampleImages}
                        className="text-xs w-full"
                      />
                      {Array.isArray(productForm.sampleImages) && productForm.sampleImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          {productForm.sampleImages.map((img, i) => (
                            <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-slate-200">
                              <img src={img} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() =>
                                  setProductForm({
                                    ...productForm,
                                    sampleImages: productForm.sampleImages.filter((_, idx) => idx !== i)
                                  })
                                }
                                className="absolute top-1 right-1 bg-rose-600 text-white p-0.5 rounded-full"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm"
                    >
                      {editingProduct ? 'حفظ التعديلات في السحابة' : 'إضافة المذكرة وحفظها'}
                    </button>
                  </div>
                </form>

                {/* قائمة المذكرات الحالية */}
                <div className="lg:col-span-7 space-y-3">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={p.coverImage || DEFAULT_LOGO_SVG}
                          alt={p.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
                        />
                        <div>
                          <h4 className="font-black text-sm sm:text-base text-slate-900">{p.title}</h4>
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="font-bold text-blue-600">{p.price} ج.م</span>
                            <span>•</span>
                            <span>{p.pagesCount} صفحة</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold">
                              {Array.isArray(p.sampleImages) ? p.sampleImages.length : 0} صفحة عينة مرفوعة
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setProductForm({
                              ...p,
                              sampleImages: Array.isArray(p.sampleImages) ? p.sampleImages : []
                            });
                          }}
                          className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="تعديل المذكرة ورفع صور العينات"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* تبويب إدارة الباقات */}
            {adminSubTab === 'bundles' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newBundleForm.title.trim()) return;
                    const bObj = {
                      id: `bnd_${Date.now()}`,
                      title: newBundleForm.title.trim(),
                      description: newBundleForm.description.trim(),
                      price: Number(newBundleForm.price || 0),
                      originalPrice: Number(newBundleForm.originalPrice || 0),
                      items: newBundleForm.itemsText
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    };
                    const updated = [bObj, ...bundles];
                    setBundles(updated);
                    localStorage.setItem('el3bakera_bundles_v5', JSON.stringify(updated));
                    if (db) {
                      try {
                        await setDoc(
                          doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles', bObj.id),
                          bObj
                        );
                      } catch {}
                    }
                    setNewBundleForm({ title: '', description: '', price: 499, originalPrice: 650, itemsText: '' });
                    showToast('تمت إضافة الباقة بنجاح');
                  }}
                  className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-3 h-fit"
                >
                  <h3 className="font-black text-base text-slate-900">إضافة باقة مخفضة جديدة</h3>
                  <input
                    type="text"
                    required
                    placeholder="اسم الباقة"
                    value={newBundleForm.title}
                    onChange={(e) => setNewBundleForm({ ...newBundleForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                  <textarea
                    rows={2}
                    placeholder="وصف الباقة"
                    value={newBundleForm.description}
                    onChange={(e) => setNewBundleForm({ ...newBundleForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="سعر الباقة"
                      value={newBundleForm.price}
                      onChange={(e) => setNewBundleForm({ ...newBundleForm, price: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="السعر الأصلي"
                      value={newBundleForm.originalPrice}
                      onChange={(e) => setNewBundleForm({ ...newBundleForm, originalPrice: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                    />
                  </div>
                  <textarea
                    rows={4}
                    placeholder="محتويات الباقة (كل مذكرة في سطر منفصل)"
                    value={newBundleForm.itemsText}
                    onChange={(e) => setNewBundleForm({ ...newBundleForm, itemsText: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                  <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm">
                    حفظ الباقة
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-3">
                  {bundles.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-black text-slate-900">{b.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          السعر: <strong className="text-blue-600">{b.price} ج.م</strong> بدلاً من {b.originalPrice} ج.م
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          const updated = bundles.filter((item) => item.id !== b.id);
                          setBundles(updated);
                          localStorage.setItem('el3bakera_bundles_v5', JSON.stringify(updated));
                          if (db) {
                            try {
                              await deleteDoc(
                                doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'bundles', b.id)
                              );
                            } catch {}
                          }
                          showToast('تم حذف الباقة');
                        }}
                        className="p-2.5 rounded-xl bg-rose-50 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* تبويب المراحل والصفوف والأقسام وصور الأقسام */}
            {adminSubTab === 'taxonomy' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* الأقسام وصورها */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
                  <h3 className="font-black text-base text-slate-900">الأقسام الدراسية وصورها</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="اسم القسم الجديد..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                    <button
                      onClick={() => {
                        if (!newCategoryName.trim()) return;
                        const updatedCats = [
                          ...normalizedCategories,
                          { id: `cat_${Date.now()}`, name: newCategoryName.trim(), image: '' }
                        ];
                        saveSettings({ ...settings, categories: updatedCats });
                        setNewCategoryName('');
                        showToast('تمت إضافة القسم');
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                    >
                      إضافة
                    </button>
                  </div>

                  <div className="space-y-3">
                    {normalizedCategories.map((cat) => (
                      <div key={cat.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{cat.name}</span>
                          <button
                            onClick={() => {
                              const updatedCats = normalizedCategories.filter((c) => c.id !== cat.id);
                              saveSettings({ ...settings, categories: updatedCats });
                            }}
                            className="text-rose-600 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{cat.image ? 'تغيير صورة القسم' : 'رفع صورة غلاف للقسم'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const url = await compressImageFile(f, 800, 0.82);
                              const updatedCats = normalizedCategories.map((c) =>
                                c.id === cat.id ? { ...c, image: url } : c
                              );
                              saveSettings({ ...settings, categories: updatedCats });
                              showToast(`تم تحديث صورة قسم "${cat.name}"`);
                            }}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* المراحل الدراسية */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
                  <h3 className="font-black text-base text-slate-900">المراحل الدراسية</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      placeholder="اسم المرحلة..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                    <button
                      onClick={() => {
                        if (!newStageName.trim()) return;
                        const updated = [...normalizedStages, { id: `stg_${Date.now()}`, name: newStageName.trim() }];
                        saveSettings({ ...settings, stages: updated });
                        setNewStageName('');
                        showToast('تمت إضافة المرحلة');
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                    >
                      إضافة
                    </button>
                  </div>

                  <div className="space-y-2">
                    {normalizedStages.map((st) => (
                      <div
                        key={st.id}
                        className="p-3 rounded-xl bg-slate-50 flex items-center justify-between text-xs font-bold"
                      >
                        <span>{st.name}</span>
                        <button
                          onClick={() =>
                            saveSettings({
                              ...settings,
                              stages: normalizedStages.filter((s) => s.id !== st.id)
                            })
                          }
                          className="text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* الصفوف الدراسية */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
                  <h3 className="font-black text-base text-slate-900">الصفوف الدراسية</h3>
                  <div className="space-y-2">
                    <select
                      value={newGradeStageId}
                      onChange={(e) => setNewGradeStageId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    >
                      {normalizedStages.map((s) => (
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
                        placeholder="اسم الصف الدراسي..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                      <button
                        onClick={() => {
                          if (!newGradeName.trim()) return;
                          const updated = [
                            ...normalizedGrades,
                            { id: `grd_${Date.now()}`, stageId: newGradeStageId, name: newGradeName.trim() }
                          ];
                          saveSettings({ ...settings, grades: updated });
                          setNewGradeName('');
                          showToast('تمت إضافة الصف');
                        }}
                        className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {normalizedGrades.map((gr) => (
                      <div
                        key={gr.id}
                        className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs font-bold"
                      >
                        <span>{gr.name}</span>
                        <button
                          onClick={() =>
                            saveSettings({
                              ...settings,
                              grades: normalizedGrades.filter((g) => g.id !== gr.id)
                            })
                          }
                          className="text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* تبويب الكوبونات */}
            {adminSubTab === 'coupons' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newCouponForm.code.trim()) return;
                    const cp = {
                      id: `cp_${Date.now()}`,
                      code: newCouponForm.code.trim().toUpperCase(),
                      discountPercent: Number(newCouponForm.discountPercent || 15),
                      maxDiscount: Number(newCouponForm.maxDiscount || 200),
                      active: true
                    };
                    const updated = [cp, ...coupons];
                    setCoupons(updated);
                    localStorage.setItem('el3bakera_coupons_v5', JSON.stringify(updated));
                    if (db) {
                      try {
                        await setDoc(
                          doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons', cp.id),
                          cp
                        );
                      } catch {}
                    }
                    setNewCouponForm({ code: '', discountPercent: 15, maxDiscount: 200 });
                    showToast('تمت إضافة الكوبون');
                  }}
                  className="md:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 space-y-3 h-fit"
                >
                  <h3 className="font-black text-base">إضافة كوبون خصم جديد</h3>
                  <input
                    type="text"
                    required
                    placeholder="كود الخصم (مثال: VIP2026)"
                    value={newCouponForm.code}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm uppercase"
                  />
                  <input
                    type="number"
                    placeholder="نسبة الخصم %"
                    value={newCouponForm.discountPercent}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discountPercent: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="الحد الأقصى للخصم (ج.م)"
                    value={newCouponForm.maxDiscount}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, maxDiscount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                  <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm">
                    إضافة الكوبون
                  </button>
                </form>

                <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 h-fit">
                  {coupons.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between"
                    >
                      <div>
                        <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 font-black text-sm">
                          {c.code}
                        </span>
                        <div className="text-xs text-slate-500 mt-1.5">
                          خصم {c.discountPercent}% (بحد أقصى {c.maxDiscount} ج.م)
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const updated = coupons.filter((item) => item.id !== c.id);
                          setCoupons(updated);
                          localStorage.setItem('el3bakera_coupons_v5', JSON.stringify(updated));
                          if (db) {
                            try {
                              await deleteDoc(
                                doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'coupons', c.id)
                              );
                            } catch {}
                          }
                        }}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* تبويب الطلبات */}
            {adminSubTab === 'orders' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                <h3 className="font-black text-base">سجل طلبات المعلمين ({orders.length})</h3>
                {orders.length === 0 ? (
                  <p className="text-sm text-slate-500">لا توجد طلبات مسجلة حتى الآن.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o) => (
                      <div
                        key={o.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-black text-slate-900">
                            {o.teacherName} ({o.teacherPhone})
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            رقم الطلب: {o.id} • الإجمالي: <strong>{o.total} ج.م</strong>
                          </div>
                        </div>
                        <select
                          value={o.status || 'قيد المراجعة والتجهيز'}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            const updated = orders.map((ord) =>
                              ord.id === o.id ? { ...ord, status: newStatus } : ord
                            );
                            setOrders(updated);
                            localStorage.setItem('el3bakera_orders_v5', JSON.stringify(updated));
                            if (db) {
                              try {
                                await setDoc(
                                  doc(db, 'artifacts', PRIMARY_APP_ID, 'public', 'data', 'orders', o.id),
                                  { status: newStatus },
                                  { merge: true }
                                );
                              } catch {}
                            }
                            showToast('تم تحديث حالة الطلب');
                          }}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                        >
                          <option value="قيد المراجعة والتجهيز">قيد المراجعة والتجهيز</option>
                          <option value="جاري وضع العلامة المائية">جاري وضع العلامة المائية</option>
                          <option value="تم التسليم عبر واتساب">تم التسليم عبر واتساب</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* تبويب الإعدادات والشعار والبانر والروابط */}
            {adminSubTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                  <h3 className="font-black text-base">الهوية البصرية والشعار وصورة البانر</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="text-xs font-black">شعار المنصة</div>
                      <img
                        src={settings.logoImage || DEFAULT_LOGO_SVG}
                        alt="Logo"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        className="text-xs w-full"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const url = await compressImageFile(f, 400, 0.85);
                          saveSettings({ ...settings, logoImage: url });
                          showToast('تم تحديث شعار المنصة');
                        }}
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="text-xs font-black">صورة البانر الرئيسي (Hero)</div>
                      {settings.heroImage ? (
                        <img
                          src={settings.heroImage}
                          alt="Hero"
                          className="w-full h-16 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-16 rounded-xl bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                          لا توجد صورة
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="text-xs w-full"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const url = await compressImageFile(f, 1100, 0.82);
                          saveSettings({ ...settings, heroImage: url });
                          showToast('تم تحديث صورة البانر الرئيسي');
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">اسم المنصة</label>
                      <input
                        type="text"
                        value={settings.platformName}
                        onChange={(e) => saveSettings({ ...settings, platformName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">رقم الواتساب</label>
                        <input
                          type="text"
                          value={settings.whatsappNumber}
                          onChange={(e) => saveSettings({ ...settings, whatsappNumber: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">رقم فودافون كاش</label>
                        <input
                          type="text"
                          value={settings.vodafoneCashNumber}
                          onChange={(e) => saveSettings({ ...settings, vodafoneCashNumber: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">رمز دخول الإدارة</label>
                      <input
                        type="text"
                        value={settings.adminPin}
                        onChange={(e) => saveSettings({ ...settings, adminPin: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* إدارة روابط الفوتر والأخبار */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                  <div className="space-y-3">
                    <h3 className="font-black text-base">روابط التواصل في الفوتر</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="اسم الرابط (مثال: قناة التيليجرام)"
                        value={newSocialLabel}
                        onChange={(e) => setNewSocialLabel(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newSocialUrl}
                        onChange={(e) => setNewSocialUrl(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newSocialLabel.trim() || !newSocialUrl.trim()) return;
                        const updated = [
                          ...(settings.socialLinks || []),
                          { id: `soc_${Date.now()}`, label: newSocialLabel.trim(), url: newSocialUrl.trim() }
                        ];
                        saveSettings({ ...settings, socialLinks: updated });
                        setNewSocialLabel('');
                        setNewSocialUrl('');
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                    >
                      إضافة رابط
                    </button>

                    <div className="space-y-2">
                      {(settings.socialLinks || []).map((link) => (
                        <div
                          key={link.id}
                          className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold">{link.label}</span>
                          <button
                            onClick={() =>
                              saveSettings({
                                ...settings,
                                socialLinks: settings.socialLinks.filter((l) => l.id !== link.id)
                              })
                            }
                            className="text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* تبويب النسخ الاحتياطي JSON */}
            {adminSubTab === 'backup' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-2xl mx-auto text-center space-y-5">
                <Database className="w-12 h-12 text-blue-600 mx-auto" />
                <h3 className="text-xl font-black text-slate-900">النسخ الاحتياطي واستعادة البيانات والصور</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  احتفظ بنسخة احتياطية كاملة بصيغة JSON تضم جميع المذكرات، صور الأغلفة، صفحات العينات، الشعار،
                  والباقات لاستعادتها في أي وقت بضغطة واحدة.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                  <button
                    onClick={handleExportBackup}
                    className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير نسخة احتياطية كاملة</span>
                  </button>

                  <label className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>استيراد ملف JSON</span>
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================== الفوتر ==================== */}
      <footer className="bg-[#081226] text-slate-300 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src={settings.logoImage || DEFAULT_LOGO_SVG}
              alt={settings.platformName}
              className="w-11 h-11 rounded-xl object-cover"
            />
            <div>
              <div className="font-black text-white text-base">{settings.platformName}</div>
              <div className="text-xs text-slate-400">
                جميع المذكرات منسقة بأعلى جودة وجاهزة للطباعة والتسليم الفوري بصيغة PDF.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
            {(settings.socialLinks || []).map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-amber-400 transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* ==================== نافذة معاينة تفاصيل وعينات المذكرة ==================== */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-base">
                <Eye className="w-5 h-5 text-amber-400" />
                <span>تفاصيل وعينة المذكرة</span>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* معرض الصور (الغلاف + صفحات العينة الداخلية) */}
              {(() => {
                const gallery = [
                  ...(previewProduct.coverImage ? [previewProduct.coverImage] : []),
                  ...(Array.isArray(previewProduct.sampleImages) ? previewProduct.sampleImages : [])
                ];
                if (gallery.length === 0) return null;
                const currentImg = gallery[activeSampleIndex] || gallery[0];
                return (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 max-h-96 flex items-center justify-center">
                      <img
                        src={currentImg}
                        alt={previewProduct.title}
                        className="max-h-96 w-auto object-contain"
                      />
                      {gallery.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setActiveSampleIndex((prev) => (prev - 1 + gallery.length) % gallery.length)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 text-white flex items-center justify-center"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setActiveSampleIndex((prev) => (prev + 1) % gallery.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 text-white flex items-center justify-center"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>

                    {gallery.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {gallery.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSampleIndex(idx)}
                            className={`w-14 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                              activeSampleIndex === idx ? 'border-blue-600' : 'border-transparent opacity-60'
                            }`}
                          >
                            <img src={img} alt={`صفحة ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-2">
                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-full">
                  {previewProduct.subject || 'اللغة العربية'} • {previewProduct.pagesCount || 0} صفحة
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">{previewProduct.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{previewProduct.description}</p>
              </div>

              {previewProduct.tipText && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                  💡 {previewProduct.tipText}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <div className="font-black text-slate-800">تنبيه هام قبل تأكيد الطلب:</div>
                <p>- يتم تسليم المذكرة بصيغة PDF عالية الدقة جاهزة للطباعة ببيانات المعلم دون أي بيانات تخصنا.</p>
                <p>- العلامة المائية باسم المعلم أو اسم السلسلة الخاص به، وغير متاح إرسال المذكرات بدونها.</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-600">{previewProduct.price} ج.م</span>
                  {previewProduct.originalPrice > previewProduct.price && (
                    <span className="text-sm text-slate-400 line-through">
                      {previewProduct.originalPrice} ج.م
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {previewProduct.driveSampleUrl && (
                    <a
                      href={previewProduct.driveSampleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-xs sm:text-sm hover:bg-emerald-100"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>معاينة Google Drive</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      addToCart(previewProduct, 'notebook');
                      setPreviewProduct(null);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>اطلبها مخصصة باسمك</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== سلة الطلبات الجانبية ==================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-base">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <span>سلة الطلبات والتخصيص ({cart.length})</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-black text-slate-800">سلة الطلبات فارغة</h4>
                  <p className="text-xs text-slate-500">اختر المذكرات أو الباقات لتخصيصها باسمك وشعارك</p>
                </div>
              ) : (
                <>
                  {/* عناصر السلة */}
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-sm text-slate-900">{item.title}</div>
                          <div className="text-xs font-black text-blue-600 mt-0.5">{item.price} ج.م</div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
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
                      placeholder="هل لديك كود خصم؟ (مثال: M20)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs uppercase"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                    >
                      تطبيق
                    </button>
                  </div>

                  {/* ملخص الحساب */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>المجموع الفرعي:</span>
                      <span className="font-bold">{cartSummary.subtotal} ج.م</span>
                    </div>
                    {cartSummary.bulkDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>خصم الكميات التلقائي ({settings.bulkDiscountPercent}%):</span>
                        <span>-{cartSummary.bulkDiscount} ج.م</span>
                      </div>
                    )}
                    {cartSummary.couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>خصم الكوبون ({appliedCoupon?.code}):</span>
                        <span>-{cartSummary.couponDiscount} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-blue-200">
                      <span>الإجمالي النهائي:</span>
                      <span className="text-blue-600">{cartSummary.total} ج.م</span>
                    </div>
                  </div>

                  {/* بيانات المعلم للتخصيص */}
                  <div className="space-y-3">
                    <h4 className="font-black text-sm text-slate-900">بيانات المعلم لوضعها على الغلاف والصفحات</h4>
                    <input
                      type="text"
                      placeholder="اسم المعلم (مثال: أ/ محمد أحمد) *"
                      value={teacherForm.teacherName}
                      onChange={(e) => setTeacherForm({ ...teacherForm, teacherName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="tel"
                      placeholder="رقم الهاتف الأساسي (واتساب) *"
                      value={teacherForm.teacherPhone}
                      onChange={(e) => setTeacherForm({ ...teacherForm, teacherPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="اسم السلسلة أو السنتر (اختياري)"
                      value={teacherForm.seriesName}
                      onChange={(e) => setTeacherForm({ ...teacherForm, seriesName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="tel"
                      placeholder="رقم هاتف إضافي للغلاف (اختياري)"
                      value={teacherForm.secondaryPhone}
                      onChange={(e) => setTeacherForm({ ...teacherForm, secondaryPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <select
                      value={teacherForm.hasLogo}
                      onChange={(e) => setTeacherForm({ ...teacherForm, hasLogo: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      <option value="نعم، سأرسل الشعار على واتساب">نعم، سأرسل الشعار على واتساب</option>
                      <option value="لا يوجد شعار (الاسم والهاتف فقط)">لا يوجد شعار (الاسم والهاتف فقط)</option>
                    </select>
                    <textarea
                      rows={2}
                      placeholder="ملاحظات إضافية للتصميم..."
                      value={teacherForm.notes}
                      onChange={(e) => setTeacherForm({ ...teacherForm, notes: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={handleCheckoutWhatsApp}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  <Phone className="w-4 h-4" />
                  <span>إتمام الطلب وإرسال البيانات عبر واتساب</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== نافذة تسجيل دخول الإدارة السرية ==================== */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAdminLogin}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative"
          >
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute top-4 left-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto shadow">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900">دخول إدارة المنصة</h3>
              <p className="text-xs text-slate-500">أدخل كلمة مرور الإدارة الخاصة بك للمتابعة</p>
            </div>

            <input
              type="password"
              value={adminPinInput}
              onChange={(e) => setAdminPinInput(e.target.value)}
              placeholder="كلمة مرور الإدارة..."
              autoFocus
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center font-bold text-sm focus:bg-white focus:border-blue-600 outline-none"
            />

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg"
            >
              دخول لوحة الإدارة
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
