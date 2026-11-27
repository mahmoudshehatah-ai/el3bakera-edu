import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  ShoppingCart,
  Search,
  Sparkles,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  ShieldCheck,
  Phone,
  MessageCircle,
  Tag,
  Layers,
  GraduationCap,
  Award,
  FileText,
  Eye,
  CreditCard,
  Copy,
  Check,
  Filter,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
  Star,
  Gift,
  Package,
  Settings,
  LogOut,
  Lock,
  Image as ImageIcon,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  RefreshCw,
  Home,
  LayoutGrid,
  Ticket
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
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';

// ============================================================================
// 1. تهيئة Firebase والبيانات الافتراضية المعتمدة (el3bakera_backup_2026-11-27)
// ============================================================================

const firebaseConfig =
  typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : {
        apiKey: 'demo-key',
        authDomain: 'demo.firebaseapp.com',
        projectId: 'el3bakera-platform'
      };

const appId = typeof __app_id !== 'undefined' ? __app_id : 'el3bakera-app';

let db = null;
let auth = null;
try {
  const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);
} catch (err) {
  console.warn('Firebase fallback to local storage mode:', err);
}

// دوال مساعدة للتحقق من النصوص والصور
const safeText = (val, fallback = '') => {
  if (typeof val === 'string' && val.trim().length > 0) return val.trim();
  if (typeof val === 'number') return String(val);
  return fallback;
};

const isValidImageSrc = (src) => {
  if (typeof src !== 'string') return false;
  const trimmed = src.trim();
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  );
};

// الشعار الافتراضي الاحترافي SVG مدمج لضمان الظهور الفوري حتى قبل تحميل أي صورة خارجية
const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#bgGrad)"/>
  <circle cx="60" cy="60" r="48" fill="none" stroke="url(#goldGrad)" stroke-width="2.5" stroke-dasharray="6 4"/>
  <path d="M60 24 L94 40 L60 56 L26 40 Z" fill="url(#goldGrad)"/>
  <path d="M38 47 V65 C38 73 48 79 60 79 C72 79 82 73 82 65 V47 L60 58 Z" fill="#ffffff" opacity="0.95"/>
  <path d="M90 42 V64" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
  <circle cx="90" cy="67" r="3.5" fill="#fbbf24"/>
  <text x="60" y="101" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-weight="bold" font-size="14">العباقرة</text>
</svg>
`)}`;

const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة التعليمية',
  platformTagline: 'مذكرات ومراجعات نهائية شاملة لجميع المراحل الدراسية',
  heroBadge: 'الإصدار المحدّث للعام الدراسي الجديد ✨',
  heroTitle: 'طريقك الأضمن للتفوق والدرجة النهائية مع مذكرات العباقرة',
  heroSubtitle:
    'مذكرات منسقة بأعلى جودة، شروحات مبسطة، بنك أسئلة شامل، ونماذج امتحانات بالإجابات النموذجية جاهزة للطباعة أو التحميل الفوري.',
  whatsappNumber: '201000000000',
  vodafoneCashNumber: '01000000000',
  instapayAddress: 'el3bakera@instapay',
  paymentInstructions:
    '1. اختر المذكرات أو الباقات المناسبة وأضفها للسلة.\n2. قم بتحويل إجمالي المبلغ عبر فودافون كاش أو إنستاباي.\n3. اضغط على زر إرسال الطلب عبر واتساب وأرفق صورة إيصال التحويل لاستلام روابط التحميل الفورية.',
  facebookUrl: 'https://facebook.com',
  telegramUrl: 'https://t.me',
  topBannerText: 'خصم خاص 20% على جميع الباقات الشاملة لفترة محدودة! استخدم الكود:',
  topBannerCoupon: 'GENIUS20',
  logoImage: DEFAULT_LOGO_SVG,
  heroImage: '',
  adminPin: '2026',
  categories: [
    { id: 'cat-notes', name: 'مذكرات الشرح', icon: 'BookOpen', color: 'emerald' },
    { id: 'cat-rev', name: 'المراجعات النهائية', icon: 'Award', color: 'amber' },
    { id: 'cat-exams', name: 'بنوك الأسئلة والامتحانات', icon: 'FileText', color: 'blue' },
    { id: 'cat-summary', name: 'خرائط ذهنية وملخصات', icon: 'Layers', color: 'purple' }
  ],
  stages: [
    { id: 'stage-prep', name: 'المرحلة الإعدادية' },
    { id: 'stage-sec', name: 'المرحلة الثانوية' }
  ],
  grades: [
    { id: 'g-prep-1', stageId: 'stage-prep', name: 'الصف الأول الإعدادي' },
    { id: 'g-prep-2', stageId: 'stage-prep', name: 'الصف الثاني الإعدادي' },
    { id: 'g-prep-3', stageId: 'stage-prep', name: 'الصف الثالث الإعدادي' },
    { id: 'g-sec-1', stageId: 'stage-sec', name: 'الصف الأول الثانوي' },
    { id: 'g-sec-2', stageId: 'stage-sec', name: 'الصف الثاني الثانوي' },
    { id: 'g-sec-3', stageId: 'stage-sec', name: 'الصف الثالث الثانوي' }
  ]
};

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'مذكرة العباقرة في اللغة العربية - شرح وتدريبات شاملة',
    subject: 'اللغة العربية',
    stageId: 'stage-sec',
    gradeId: 'g-sec-3',
    categoryId: 'cat-notes',
    price: 85,
    oldPrice: 120,
    pagesCount: 145,
    term: 'العام الكامل',
    featured: true,
    badge: 'الأكثر مبيعاً',
    description:
      'شرح وافٍ لجميع فروع اللغة العربية (النحو، البلاغة، الأدب، النصوص، القراءة المتحررة) مع تدريبات متدرجة وإجابات نموذجية.',
    features: ['تنسيق PDF عالي الجودة جاهز للطباعة', 'إجابات نموذجية لجميع التدريبات', 'تحديثات مجانية طوال العام'],
    samplePagesText: 'نموذج معاينة: قواعد النحو الأساسية + تدريبات البلاغة المتحررة للصف الثالث الثانوي.'
  },
  {
    id: 'prod-2',
    title: 'المراجعة النهائية في الفيزياء - 1000 سؤال بالنظام الحديث',
    subject: 'الفيزياء',
    stageId: 'stage-sec',
    gradeId: 'g-sec-3',
    categoryId: 'cat-rev',
    price: 95,
    oldPrice: 140,
    pagesCount: 160,
    term: 'مراجعة نهائية',
    featured: true,
    badge: 'مراجعة ليلة الامتحان',
    description:
      'تغطية شاملة لجميع أفكار مسائل الفيزياء الحديثة والكهربية مع شرح خطوات الحل التفصيلية لكل مسألة.',
    features: ['قوانين وملخصات كل فصل في صفحة واحدة', 'أفكار امتحانات الأعوام السابقة', 'حلول تفصيلية بالخطوات'],
    samplePagesText: 'نموذج معاينة: ملخص قوانين التيار الكهربي وقانون أوم للدوائر المغلقة.'
  },
  {
    id: 'prod-3',
    title: 'مذكرة القمة في الرياضيات (الجبر والهندسة)',
    subject: 'الرياضيات',
    stageId: 'stage-prep',
    gradeId: 'g-prep-3',
    categoryId: 'cat-notes',
    price: 60,
    oldPrice: 85,
    pagesCount: 110,
    term: 'الترم الأول والثاني',
    featured: true,
    badge: 'مميز',
    description:
      'شرح مبسط لكل نظريات الهندسة وقوانين الجبر والإحصاء للشهادة الإعدادية مع أمثلة محلولة وتمارين المحافظات.',
    features: ['شرح مبسط بالرسومات التوضيحية', 'أهم مسائل امتحانات المحافظات', 'مراجعة ليلة الامتحان مرفقة'],
    samplePagesText: 'نموذج معاينة: حل معادلتين من الدرجة الأولى في متغيرين جبرياً وبيانياً.'
  },
  {
    id: 'prod-4',
    title: 'بنك أسئلة الكيمياء العضوية وغير العضوية',
    subject: 'الكيمياء',
    stageId: 'stage-sec',
    gradeId: 'g-sec-3',
    categoryId: 'cat-exams',
    price: 80,
    oldPrice: 110,
    pagesCount: 130,
    term: 'العام الكامل',
    featured: false,
    badge: 'بنك أسئلة',
    description:
      'أقوى بنك أسئلة في الكيمياء يغطي كافة نواتج التعلم والمعادلات والتحويلات الكيميائية بطريقة منظمة.',
    features: ['مخططات التفاعلات الكيميائية', 'أسئلة مستويات التفكير العليا', 'نموذج إجابة معتمد'],
    samplePagesText: 'نموذج معاينة: مخطط تفاعلات الحديد وأكاسيده + الهيدروكربونات الأليفاتية.'
  },
  {
    id: 'prod-5',
    title: 'مذكرة العباقرة في اللغة الإنجليزية - Grammar & Skills',
    subject: 'اللغة الإنجليزية',
    stageId: 'stage-sec',
    gradeId: 'g-sec-2',
    categoryId: 'cat-notes',
    price: 70,
    oldPrice: 95,
    pagesCount: 120,
    term: 'العام الكامل',
    featured: false,
    badge: 'جديد',
    description:
      'شرح القواعد والكلمات والترجمة وكتابة المقال بأسلوب شيق ومبسط يناسب جميع مستويات الطلاب.',
    features: ['أهم مفردات المنهج ومشتقاتها', 'تدريبات ترجمة وقطع فهم حديثة', 'امتحانات شاملة على كل وحدة'],
    samplePagesText: 'نموذج معاينة: Unit 1 Vocabulary & Grammar Exercises.'
  },
  {
    id: 'prod-6',
    title: 'ملخص العلوم المتكامل والخرائط الذهنية - الشهادة الإعدادية',
    subject: 'العلوم',
    stageId: 'stage-prep',
    gradeId: 'g-prep-3',
    categoryId: 'cat-summary',
    price: 55,
    oldPrice: 75,
    pagesCount: 75,
    term: 'الترم الأول والثاني',
    featured: false,
    badge: 'خرائط ذهنية',
    description:
      'تلخيص كامل لمنهج العلوم في شكل خرائط ذهنية ومقارنات وتعليلات هامة تضمن تثبيت المعلومة بسرعة.',
    features: ['تجميع أهم أسئلة علل وما النتائج', 'رسومات التجارب العملية', 'مراجعة سريعة قبل الامتحان'],
    samplePagesText: 'نموذج معاينة: التفاعلات الكيميائية وسرعة التفاعل الكيميائي.'
  }
];

const DEFAULT_BUNDLES = [
  {
    id: 'bundle-sec-3',
    title: 'باقة التفوق الشاملة - الصف الثالث الثانوي',
    description: 'تشمل جميع مذكرات الشرح والمراجعات النهائية وبنوك الأسئلة لجميع المواد بتوفير كبير.',
    gradeId: 'g-sec-3',
    price: 350,
    oldPrice: 520,
    itemsIncluded: [
      'مذكرة اللغة العربية الشاملة',
      'المراجعة النهائية في الفيزياء',
      'بنك أسئلة الكيمياء',
      'مذكرة اللغة الإنجليزية والمهارات',
      'هدية: كتيب الخرائط الذهنية'
    ],
    badge: 'وفر 170 ج.م'
  },
  {
    id: 'bundle-prep-3',
    title: 'باقة الأوائل - الصف الثالث الإعدادي',
    description: 'كل ما يحتاجه طالب الشهادة الإعدادية في جميع المواد الأساسية مع نماذج امتحانات المحافظات.',
    gradeId: 'g-prep-3',
    price: 210,
    oldPrice: 320,
    itemsIncluded: [
      'مذكرة الرياضيات (جبر وهندسة)',
      'ملخص العلوم والخرائط الذهنية',
      'مذكرة اللغة العربية والنحو',
      'مذكرة الدراسات الاجتماعية واللغة الإنجليزية'
    ],
    badge: 'الأكثر طلباً للإعدادي'
  }
];

const DEFAULT_COUPONS = [
  { id: 'cp-1', code: 'GENIUS20', discountPercent: 20, active: true, description: 'خصم 20% على إجمالي الطلب' },
  { id: 'cp-2', code: 'EL3BAKERA15', discountPercent: 15, active: true, description: 'خصم 15% لطلاب المنصة' }
];

// ============================================================================
// 2. المكون الرئيسي للتطبيق (App)
// ============================================================================

export default function App() {
  // حالة التنقل والصفحات
  const [activeTab, setActiveTab] = useState('store'); // 'store' | 'bundles' | 'admin'
  const [user, setUser] = useState(null);

  // البيانات الأساسية مع التحميل الفوري من LocalStorage لضمان عدم فقدان أي تعديل
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_settings_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          logoImage: isValidImageSrc(parsed.logoImage) ? parsed.logoImage : DEFAULT_SETTINGS.logoImage,
          stages: Array.isArray(parsed.stages) && parsed.stages.length > 0 ? parsed.stages : DEFAULT_SETTINGS.stages,
          grades: Array.isArray(parsed.grades) && parsed.grades.length > 0 ? parsed.grades : DEFAULT_SETTINGS.grades,
          categories:
            Array.isArray(parsed.categories) && parsed.categories.length > 0
              ? parsed.categories
              : DEFAULT_SETTINGS.categories
        };
      }
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_products_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PRODUCTS;
  });

  const [bundles, setBundles] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_bundles_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_BUNDLES;
  });

  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_coupons_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_COUPONS;
  });

  // حالة السلة والطلبات
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('el3bakera_cart_v3');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [copiedField, setCopiedField] = useState('');

  // الفلاتر والبحث
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewProduct, setPreviewProduct] = useState(null);

  // الإشعارات المخصصة (بديل alert/confirm)
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // حالة لوحة الإدارة
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [adminSection, setAdminSection] = useState('settings'); // 'settings' | 'products' | 'bundles' | 'coupons' | 'backup'
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  // نموذج إضافة/تعديل مذكرة
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    title: '',
    subject: '',
    stageId: 'stage-sec',
    gradeId: 'g-sec-3',
    categoryId: 'cat-notes',
    price: 75,
    oldPrice: 100,
    pagesCount: 100,
    term: 'العام الكامل',
    featured: false,
    badge: 'جديد',
    description: '',
    samplePagesText: ''
  });

  // نموذج إضافة باقة
  const [newBundle, setNewBundle] = useState({
    title: '',
    description: '',
    gradeId: 'g-sec-3',
    price: 250,
    oldPrice: 380,
    badge: 'باقة التوفير',
    itemsText: ''
  });

  // نموذج إضافة كوبون
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountPercent: 15,
    description: ''
  });

  const fileImportRef = useRef(null);
  const logoUploadRef = useRef(null);

  // ============================================================================
  // 3. المزامنة الآمنة مع LocalStorage و Firebase Firestore
  // ============================================================================

  useEffect(() => {
    try {
      localStorage.setItem('el3bakera_settings_v3', JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('el3bakera_products_v3', JSON.stringify(products));
    } catch (e) {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('el3bakera_bundles_v3', JSON.stringify(bundles));
    } catch (e) {}
  }, [bundles]);

  useEffect(() => {
    try {
      localStorage.setItem('el3bakera_coupons_v3', JSON.stringify(coupons));
    } catch (e) {}
  }, [coupons]);

  useEffect(() => {
    try {
      localStorage.setItem('el3bakera_cart_v3', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // تسجيل الدخول في Firebase والاستماع للإعدادات بأمان تام
  useEffect(() => {
    if (!auth || !db) return;

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn('Auth skipped:', err);
      }
    };
    initAuth();

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'platform_settings', 'main');
    const logoMediaRef = doc(db, 'artifacts', appId, 'public', 'data', 'platform_media', 'media_logo');

    const unsubSettings = onSnapshot(
      settingsDocRef,
      (snap) => {
        if (!snap || !snap.exists()) return;
        const data = snap.data() || {};

        setSettings((prev) => {
          const mergedStages = (() => {
            const map = new Map(DEFAULT_SETTINGS.stages.map((s) => [s.id, s]));
            if (Array.isArray(data.stages)) {
              data.stages.forEach((s) => {
                if (s?.id) map.set(s.id, { ...s, name: safeText(s.name, 'مرحلة دراسية') });
              });
            }
            return Array.from(map.values());
          })();

          const mergedGrades = (() => {
            const map = new Map(DEFAULT_SETTINGS.grades.map((g) => [g.id, g]));
            if (Array.isArray(data.grades)) {
              data.grades.forEach((g) => {
                if (g?.id) map.set(g.id, { ...g, name: safeText(g.name, 'صف دراسي') });
              });
            }
            return Array.from(map.values());
          })();

          return {
            ...prev,
            ...data,
            platformName: safeText(data.platformName, prev.platformName),
            platformTagline: safeText(data.platformTagline, prev.platformTagline),
            heroBadge: safeText(data.heroBadge, prev.heroBadge),
            heroTitle: safeText(data.heroTitle, prev.heroTitle),
            heroSubtitle: safeText(data.heroSubtitle, prev.heroSubtitle),
            whatsappNumber: safeText(data.whatsappNumber, prev.whatsappNumber),
            vodafoneCashNumber: safeText(data.vodafoneCashNumber, prev.vodafoneCashNumber),
            instapayAddress: safeText(data.instapayAddress, prev.instapayAddress),
            paymentInstructions: safeText(data.paymentInstructions, prev.paymentInstructions),
            facebookUrl: safeText(data.facebookUrl, prev.facebookUrl),
            telegramUrl: safeText(data.telegramUrl, prev.telegramUrl),
            topBannerText: safeText(data.topBannerText, prev.topBannerText),
            topBannerCoupon: safeText(data.topBannerCoupon, prev.topBannerCoupon),
            logoImage: isValidImageSrc(data.logoImage) ? data.logoImage : prev.logoImage,
            heroImage: isValidImageSrc(data.heroImage) ? data.heroImage : prev.heroImage,
            stages: mergedStages,
            grades: mergedGrades
          };
        });
      },
      (err) => console.warn('Settings listener warning:', err)
    );

    // استرجاع الشعار المنفصل من السحابة إن وجد (لتجاوز حد 1MB في المستند الرئيسي)
    getDoc(logoMediaRef)
      .then((mSnap) => {
        if (mSnap && mSnap.exists()) {
          const mData = mSnap.data() || {};
          if (isValidImageSrc(mData.imageData)) {
            setSettings((prev) => ({ ...prev, logoImage: mData.imageData }));
          }
        }
      })
      .catch(() => {});

    return () => unsubSettings();
  }, [user]);

  // حفظ الإعدادات في السحابة مع فصل الشعار في وثيقة مستقلة لضمان عدم ضياعه أبداً
  const saveSettingsToCloud = async (updatedSettings = settings) => {
    setIsSavingCloud(true);
    try {
      localStorage.setItem('el3bakera_settings_v3', JSON.stringify(updatedSettings));
      if (user && db) {
        const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'platform_settings', 'main');
        const logoMediaRef = doc(db, 'artifacts', appId, 'public', 'data', 'platform_media', 'media_logo');

        const { logoImage, ...restSettings } = updatedSettings;
        const isLargeBase64 = typeof logoImage === 'string' && logoImage.length > 200000;

        await setDoc(
          settingsDocRef,
          {
            ...restSettings,
            logoImage: isLargeBase64 ? '' : logoImage || DEFAULT_LOGO_SVG,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );

        if (isValidImageSrc(logoImage)) {
          await setDoc(
            logoMediaRef,
            {
              imageData: logoImage,
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );
        }
      }
      showToast('تم حفظ الإعدادات والشعار وتثبيتها بنجاح!');
    } catch (err) {
      console.error('Save settings error:', err);
      showToast('تم الحفظ محلياً (تعذر الوصول للسحابة حالياً)', 'warning');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // ============================================================================
  // 4. منطق الفلترة والسلة والدفع
  // ============================================================================

  const availableGrades = useMemo(() => {
    if (selectedStage === 'all') return settings.grades;
    return settings.grades.filter((g) => g.stageId === selectedStage);
  }, [settings.grades, selectedStage]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = selectedStage === 'all' || item.stageId === selectedStage;
      const matchesGrade = selectedGrade === 'all' || item.gradeId === selectedGrade;
      const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;

      return matchesSearch && matchesStage && matchesGrade && matchesCategory;
    });
  }, [products, searchQuery, selectedStage, selectedGrade, selectedCategory]);

  const addToCart = (item, type = 'product') => {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists) {
        showToast('هذا العنصر موجود بالفعل في سلة المشتريات', 'info');
        return prev;
      }
      showToast(`تمت إضافة "${item.title}" إلى السلة`);
      return [
        ...prev,
        {
          id: item.id,
          title: item.title,
          price: Number(item.price) || 0,
          type,
          subtitle:
            type === 'bundle'
              ? 'باقة شاملة'
              : `${item.subject} - ${settings.grades.find((g) => g.id === item.gradeId)?.name || ''}`
        }
      ];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      showToast('يرجى إدخال كود الخصم أولاً', 'warning');
      return;
    }
    const found = coupons.find((c) => c.active && c.code.toUpperCase() === code);
    if (found) {
      setAppliedCoupon(found);
      showToast(`تم تفعيل كود الخصم (${found.code}) بنسبة ${found.discountPercent}%!`);
    } else {
      setAppliedCoupon(null);
      showToast('كود الخصم غير صحيح أو منتهي الصلاحية', 'error');
    }
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return Math.round((subtotal * appliedCoupon.discountPercent) / 100);
  }, [subtotal, appliedCoupon]);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    showToast(`تم نسخ ${label}`);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) {
      showToast('السلة فارغة! أضف مذكرة واحدة على الأقل', 'warning');
      return;
    }
    if (!studentName.trim()) {
      showToast('يرجى كتابة اسم الطالب قبل إرسال الطلب', 'warning');
      return;
    }

    const itemsLines = cart
      .map((item, idx) => `${idx + 1}. ${item.title} (${item.price} ج.م)`)
      .join('\n');

    const message = [
      `السلام عليكم، طلب جديد من *${settings.platformName}* 📚`,
      `👤 *اسم الطالب:* ${studentName.trim()}`,
      studentPhone.trim() ? `📱 *رقم الهاتف:* ${studentPhone.trim()}` : '',
      `\n🛒 *المذكرات المطلوبة:*`,
      itemsLines,
      `\n💰 *الإجمالي قبل الخصم:* ${subtotal} ج.م`,
      appliedCoupon ? `🎟️ *كوبون الخصم (${appliedCoupon.code}):* -${discountAmount} ج.م` : '',
      `✅ *المبلغ النهائي المطلوب:* ${finalTotal} ج.م`,
      `\n📎 سأقوم بإرفاق صورة إيصال التحويل الآن.`
    ]
      .filter(Boolean)
      .join('\n');

    const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // ============================================================================
  // 5. دوال إدارة الشعار والنسخ الاحتياطي والمنتجات
  // ============================================================================

  // ضغط وتصغير الشعار تلقائياً عند رفعه لضمان سرعة التحميل وحفظه في السحابة بدون أخطاء
  const handleLogoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/png', 0.9);
        const updated = { ...settings, logoImage: compressedDataUrl };
        setSettings(updated);
        saveSettingsToCloud(updated);
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleExportBackup = () => {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      platform: 'el3bakera',
      settings,
      products,
      bundles,
      coupons
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `el3bakera_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تحميل ملف النسخة الاحتياطية بنجاح');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result);
        if (parsed.settings) {
          const mergedSettings = {
            ...DEFAULT_SETTINGS,
            ...parsed.settings,
            logoImage: isValidImageSrc(parsed.settings.logoImage)
              ? parsed.settings.logoImage
              : settings.logoImage
          };
          setSettings(mergedSettings);
          saveSettingsToCloud(mergedSettings);
        }
        if (Array.isArray(parsed.products)) setProducts(parsed.products);
        if (Array.isArray(parsed.bundles)) setBundles(parsed.bundles);
        if (Array.isArray(parsed.coupons)) setCoupons(parsed.coupons);
        showToast('تم استيراد النسخة الاحتياطية وتطبيق الإعدادات بنجاح!');
      } catch (err) {
        showToast('ملف النسخة الاحتياطية غير صالح', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleAddOrUpdateProduct = (e) => {
    e.preventDefault();
    if (!newProduct.title.trim() || !newProduct.subject.trim()) {
      showToast('يرجى إدخال عنوان المذكرة واسم المادة', 'warning');
      return;
    }

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                ...newProduct,
                price: Number(newProduct.price) || 0,
                oldPrice: Number(newProduct.oldPrice) || 0,
                pagesCount: Number(newProduct.pagesCount) || 50
              }
            : p
        )
      );
      setEditingProduct(null);
      showToast('تم تحديث بيانات المذكرة بنجاح');
    } else {
      const created = {
        ...newProduct,
        id: `prod-${Date.now()}`,
        price: Number(newProduct.price) || 0,
        oldPrice: Number(newProduct.oldPrice) || 0,
        pagesCount: Number(newProduct.pagesCount) || 50,
        features: ['ملف PDF عالي الجودة', 'منسق وجاهز للطباعة', 'يشمل الإجابات النموذجية']
      };
      setProducts((prev) => [created, ...prev]);
      showToast('تمت إضافة المذكرة الجديدة للمتجر');
    }

    setNewProduct({
      title: '',
      subject: '',
      stageId: 'stage-sec',
      gradeId: 'g-sec-3',
      categoryId: 'cat-notes',
      price: 75,
      oldPrice: 100,
      pagesCount: 100,
      term: 'العام الكامل',
      featured: false,
      badge: 'جديد',
      description: '',
      samplePagesText: ''
    });
  };

  const handleAddBundle = (e) => {
    e.preventDefault();
    if (!newBundle.title.trim()) {
      showToast('يرجى إدخال عنوان الباقة', 'warning');
      return;
    }
    const itemsList = newBundle.itemsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const created = {
      id: `bundle-${Date.now()}`,
      title: newBundle.title.trim(),
      description: newBundle.description.trim(),
      gradeId: newBundle.gradeId,
      price: Number(newBundle.price) || 0,
      oldPrice: Number(newBundle.oldPrice) || 0,
      badge: newBundle.badge || 'باقة مميزة',
      itemsIncluded: itemsList.length > 0 ? itemsList : ['جميع مذكرات الصف الدراسي']
    };
    setBundles((prev) => [created, ...prev]);
    setNewBundle({
      title: '',
      description: '',
      gradeId: 'g-sec-3',
      price: 250,
      oldPrice: 380,
      badge: 'باقة التوفير',
      itemsText: ''
    });
    showToast('تمت إضافة الباقة بنجاح');
  };

  const handleAddCoupon = (e) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) return;
    const created = {
      id: `cp-${Date.now()}`,
      code: newCoupon.code.trim().toUpperCase(),
      discountPercent: Math.min(90, Math.max(1, Number(newCoupon.discountPercent) || 10)),
      active: true,
      description: newCoupon.description.trim() || `خصم ${newCoupon.discountPercent}%`
    };
    setCoupons((prev) => [created, ...prev]);
    setNewCoupon({ code: '', discountPercent: 15, description: '' });
    showToast('تم إنشاء كوبون الخصم بنجاح');
  };

  // ============================================================================
  // 6. واجهة المستخدم (JSX)
  // ============================================================================

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* إشعار عائم */}
      {toast && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all bg-slate-900/95 text-white border-slate-700">
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : toast.type === 'warning' ? (
            <Info className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* الشريط العلوي للإعلانات والكوبونات */}
      {settings.topBannerText && (
        <div className="bg-gradient-to-l from-emerald-800 via-teal-800 to-slate-900 text-white text-xs sm:text-sm py-2.5 px-4 text-center">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{settings.topBannerText}</span>
            {settings.topBannerCoupon && (
              <button
                onClick={() => copyToClipboard(settings.topBannerCoupon, 'كود الخصم')}
                className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-bold px-2.5 py-0.5 rounded-lg hover:bg-amber-300 transition cursor-pointer"
                title="اضغط لنسخ الكود"
              >
                <span>{settings.topBannerCoupon}</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* الهيدر الرئيسي */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* الشعار واسم المنصة */}
          <button
            onClick={() => setActiveTab('store')}
            className="flex items-center gap-3 text-right group cursor-pointer focus:outline-none"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img
                src={isValidImageSrc(settings.logoImage) ? settings.logoImage : DEFAULT_LOGO_SVG}
                alt={settings.platformName}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_LOGO_SVG;
                }}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {settings.platformName}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block line-clamp-1">
                {settings.platformTagline}
              </p>
            </div>
          </button>

          {/* روابط التنقل */}
          <nav className="hidden md:flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('store')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                activeTab === 'store'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>المذكرات</span>
            </button>
            <button
              onClick={() => setActiveTab('bundles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                activeTab === 'bundles'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>الباقات المخفضة</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>لوحة الإدارة</span>
            </button>
          </nav>

          {/* أزرار السلة والإدارة للموبايل */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab(activeTab === 'admin' ? 'store' : 'admin')}
              className="md:hidden p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              title="لوحة الإدارة"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">السلة</span>
              {cart.length > 0 && (
                <span className="bg-amber-400 text-slate-950 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* شريط تنقل سفلي للهواتف */}
        <div className="flex md:hidden border-t border-slate-100 bg-white px-4 py-2 gap-2">
          <button
            onClick={() => setActiveTab('store')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
              activeTab === 'store' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>المذكرات</span>
          </button>
          <button
            onClick={() => setActiveTab('bundles')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
              activeTab === 'bundles' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>الباقات الشاملة</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          صفحة المتجر الرئيسية (المذكرات)
         ==================================================================== */}
      {activeTab === 'store' && (
        <main>
          {/* قسم الواجهة الترحيبية (Hero Section) */}
          <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-slate-800 to-emerald-950 text-white py-12 sm:py-16 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-xs sm:text-sm text-amber-300 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>{settings.heroBadge}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight">
                  {settings.heroTitle}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                  {settings.heroSubtitle}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#catalog"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-2xl text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>تصفح المذكرات الآن</span>
                  </a>
                  <button
                    onClick={() => setActiveTab('bundles')}
                    className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold px-6 py-3.5 rounded-2xl text-sm sm:text-base transition flex items-center gap-2 cursor-pointer"
                  >
                    <Gift className="w-5 h-5 text-amber-400" />
                    <span>باقات التوفير الشاملة</span>
                  </button>
                </div>
              </div>

              {/* بطاقة مميزات سريعة */}
              <div className="lg:col-span-5">
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-300">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">لماذا يختار الطلاب {settings.platformName}؟</h3>
                      <p className="text-xs text-slate-300">جودة تعليمية معتمدة وتنسيق احترافي</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-white/5 flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">جاهزة للطباعة PDF</p>
                        <p className="text-xs text-slate-400">خطوط واضحة وتصميم مريح للعين</p>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-white/5 flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">إجابات نموذجية</p>
                        <p className="text-xs text-slate-400">حلول تفصيلية لجميع التدريبات</p>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-white/5 flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">استلام فوري</p>
                        <p className="text-xs text-slate-400">روابط مباشرة فور تأكيد الدفع</p>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-white/5 flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">أحدث مواصفات الوزارة</p>
                        <p className="text-xs text-slate-400">محدثة بالكامل وفق النظام الجديد</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* شريط البحث والفلترة المتقدم */}
          <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 mb-8 space-y-5">
              <div className="flex flex-col md:flex-row gap-4">
                {/* مربع البحث */}
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المادة، اسم المذكرة، أو موضوع الدرس..."
                    className="w-full pr-12 pl-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none text-sm transition"
                  />
                </div>

                {/* فلتر المرحلة الدراسية */}
                <select
                  value={selectedStage}
                  onChange={(e) => {
                    setSelectedStage(e.target.value);
                    setSelectedGrade('all');
                  }}
                  className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">جميع المراحل الدراسية</option>
                  {settings.stages.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>

                {/* فلتر الصف الدراسي */}
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">جميع الصفوف الدراسية</option>
                  {availableGrades.map((gr) => (
                    <option key={gr.id} value={gr.id}>
                      {gr.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* أزرار الأقسام */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الكل ({products.length})
                </button>
                {settings.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* شبكة عرض المذكرات */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <Search className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-800">لا توجد مذكرات مطابقة لبحثك</h3>
                <p className="text-sm text-slate-500">جرب تغيير المرحلة أو الصف الدراسي أو مسح نص البحث.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStage('all');
                    setSelectedGrade('all');
                    setSelectedCategory('all');
                  }}
                  className="mt-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition cursor-pointer"
                >
                  إعادة ضبط الفلاتر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const gradeName =
                    settings.grades.find((g) => g.id === product.gradeId)?.name || 'صف دراسي';
                  const categoryName =
                    settings.categories.find((c) => c.id === product.categoryId)?.name || 'مذكرة';
                  const inCart = cart.some((c) => c.id === product.id);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                    >
                      {/* رأس البطاقة */}
                      <div className="bg-gradient-to-l from-slate-800 to-slate-900 p-5 text-white relative">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full">
                            {product.subject}
                          </span>
                          {product.badge && (
                            <span className="text-xs font-extrabold bg-amber-400 text-slate-950 px-3 py-1 rounded-full">
                              {product.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-lg leading-snug line-clamp-2 min-h-[3.25rem]">
                          {product.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                            {gradeName}
                          </span>
                          <span>•</span>
                          <span>{categoryName}</span>
                        </div>
                      </div>

                      {/* محتوى البطاقة */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
                        <div className="space-y-3">
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                            {product.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                            <span className="flex items-center gap-1 font-semibold">
                              <FileText className="w-4 h-4 text-emerald-600" />
                              {product.pagesCount} صفحة
                            </span>
                            <span>•</span>
                            <span className="font-semibold">{product.term}</span>
                          </div>
                        </div>

                        {/* السعر والأزرار */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-emerald-700">
                                {product.price} ج.م
                              </span>
                              {product.oldPrice > product.price && (
                                <span className="text-sm text-slate-400 line-through">
                                  {product.oldPrice} ج.م
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => setPreviewProduct(product)}
                              className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>معاينة</span>
                            </button>
                          </div>

                          <button
                            onClick={() => (inCart ? setIsCartOpen(true) : addToCart(product, 'product'))}
                            className={`w-full py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                              inCart
                                ? 'bg-slate-900 text-white hover:bg-slate-800'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20'
                            }`}
                          >
                            {inCart ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>في السلة (عرض السلة)</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-4 h-4" />
                                <span>أضف إلى السلة</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      )}

      {/* ====================================================================
          صفحة الباقات الشاملة المخفضة
         ==================================================================== */}
      {activeTab === 'bundles' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-slate-950 text-amber-300 text-xs font-bold px-3 py-1 rounded-full">
                <Gift className="w-3.5 h-3.5" />
                <span>عروض التوفير الكبرى</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black">باقات التفوق الشاملة لجميع المواد</h2>
              <p className="text-sm sm:text-base font-medium text-slate-900/90 max-w-2xl">
                احصل على جميع مذكرات الشرح والمراجعات النهائية وبنوك الأسئلة لصفك الدراسي في باقة واحدة بخصم يصل إلى 35%.
              </p>
            </div>
            <Package className="w-20 h-20 text-slate-950/20 hidden md:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bundles.map((bundle) => {
              const gradeName =
                settings.grades.find((g) => g.id === bundle.gradeId)?.name || 'جميع الصفوف';
              const inCart = cart.some((c) => c.id === bundle.id);

              return (
                <div
                  key={bundle.id}
                  className="bg-white rounded-3xl border-2 border-amber-400/50 p-6 sm:p-8 shadow-md flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                        {gradeName}
                      </span>
                      {bundle.badge && (
                        <span className="text-xs font-black bg-amber-400 text-slate-950 px-3 py-1 rounded-full">
                          {bundle.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">{bundle.title}</h3>
                    <p className="text-sm text-slate-600">{bundle.description}</p>

                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5">
                      <p className="text-xs font-bold text-slate-500">محتويات الباقة:</p>
                      {bundle.itemsIncluded.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-3xl font-black text-emerald-700">{bundle.price} ج.م</span>
                      {bundle.oldPrice > bundle.price && (
                        <span className="text-sm text-slate-400 line-through mr-2">
                          {bundle.oldPrice} ج.م
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => (inCart ? setIsCartOpen(true) : addToCart(bundle, 'bundle'))}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4 text-amber-400" />
                      <span>{inCart ? 'مضافة للسلة (عرض)' : 'اشترك في الباقة الآن'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ====================================================================
          لوحة الإدارة المتكاملة (Admin Dashboard)
         ==================================================================== */}
      {activeTab === 'admin' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {!isAdminAuthenticated ? (
            <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-lg border border-slate-200 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">دخول لوحة الإدارة</h2>
                <p className="text-xs text-slate-500 mt-1">
                  أدخل رمز المرور الخاص بالإدارة (الافتراضي: 2026)
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pinInput === (settings.adminPin || '2026')) {
                    setIsAdminAuthenticated(true);
                    showToast('تم تسجيل الدخول إلى لوحة الإدارة');
                  } else {
                    showToast('رمز المرور غير صحيح', 'error');
                  }
                }}
                className="space-y-4"
              >
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="أدخل رمز PIN..."
                  className="w-full text-center tracking-widest text-lg font-bold px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition cursor-pointer"
                >
                  دخول لوحة التحكم
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* شريط علوي للإدارة */}
              <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-black">لوحة إدارة {settings.platformName}</h2>
                    <p className="text-xs text-slate-400">
                      تحكم كامل في الشعار، الإعدادات، المذكرات، الباقات، والنسخ الاحتياطي
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveSettingsToCloud(settings)}
                    disabled={isSavingCloud}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSavingCloud ? 'animate-spin' : ''}`} />
                    <span>{isSavingCloud ? 'جاري الحفظ...' : 'حفظ وتثبيت الإعدادات'}</span>
                  </button>
                  <button
                    onClick={() => setIsAdminAuthenticated(false)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    title="تسجيل خروج"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* تبويبات الإدارة */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'settings', label: 'الإعدادات والشعار', icon: Settings },
                  { id: 'products', label: `المذكرات (${products.length})`, icon: BookOpen },
                  { id: 'bundles', label: `الباقات (${bundles.length})`, icon: Package },
                  { id: 'coupons', label: `الكوبونات (${coupons.length})`, icon: Ticket },
                  { id: 'backup', label: 'النسخ الاحتياطي JSON', icon: Download }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAdminSection(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                        adminSection === tab.id
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 1. قسم الإعدادات والشعار */}
              {adminSection === 'settings' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-8">
                  {/* إدارة الشعار */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={isValidImageSrc(settings.logoImage) ? settings.logoImage : DEFAULT_LOGO_SVG}
                        alt="شعار المنصة"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_LOGO_SVG;
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-3 text-center sm:text-right">
                      <h3 className="font-extrabold text-base text-slate-900">شعار المنصة (Logo)</h3>
                      <p className="text-xs text-slate-500">
                        يتم ضغط الشعار تلقائياً وحفظه في السحابة والذاكرة المحلية لضمان ظهوره الدائم دون اختفاء.
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        <input
                          ref={logoUploadRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => logoUploadRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-2 transition cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4 text-amber-400" />
                          <span>رفع صورة شعار جديدة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...settings, logoImage: DEFAULT_LOGO_SVG };
                            setSettings(updated);
                            saveSettingsToCloud(updated);
                          }}
                          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                        >
                          استعادة الشعار الافتراضي
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* حقول النصوص وأرقام التواصل */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المنصة</label>
                      <input
                        type="text"
                        value={settings.platformName}
                        onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">الوصف المختصر</label>
                      <input
                        type="text"
                        value={settings.platformTagline}
                        onChange={(e) => setSettings({ ...settings, platformTagline: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        العنوان الرئيسي في الواجهة (Hero Title)
                      </label>
                      <input
                        type="text"
                        value={settings.heroTitle}
                        onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        رقم واتساب لاستقبال الطلبات (بالكود الدولي مثل 2010...)
                      </label>
                      <input
                        type="text"
                        value={settings.whatsappNumber}
                        onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        رقم فودافون كاش للتحويل
                      </label>
                      <input
                        type="text"
                        value={settings.vodafoneCashNumber}
                        onChange={(e) =>
                          setSettings({ ...settings, vodafoneCashNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        عنوان إنستاباي (InstaPay)
                      </label>
                      <input
                        type="text"
                        value={settings.instapayAddress}
                        onChange={(e) => setSettings({ ...settings, instapayAddress: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        رمز PIN لدخول الإدارة
                      </label>
                      <input
                        type="text"
                        value={settings.adminPin}
                        onChange={(e) => setSettings({ ...settings, adminPin: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        نص الشريط الإعلاني العلوي
                      </label>
                      <input
                        type="text"
                        value={settings.topBannerText}
                        onChange={(e) => setSettings({ ...settings, topBannerText: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        كود الخصم المعروض في الشريط العلوي
                      </label>
                      <input
                        type="text"
                        value={settings.topBannerCoupon}
                        onChange={(e) => setSettings({ ...settings, topBannerCoupon: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm uppercase"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        تعليمات الدفع داخل السلة
                      </label>
                      <textarea
                        rows={3}
                        value={settings.paymentInstructions}
                        onChange={(e) =>
                          setSettings({ ...settings, paymentInstructions: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => saveSettingsToCloud(settings)}
                      className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition cursor-pointer"
                    >
                      حفظ جميع الإعدادات الآن
                    </button>
                  </div>
                </div>
              )}

              {/* 2. قسم إدارة المذكرات */}
              {adminSection === 'products' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleAddOrUpdateProduct}
                    className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4"
                  >
                    <h3 className="font-black text-base text-slate-900">
                      {editingProduct ? 'تعديل المذكرة' : 'إضافة مذكرة جديدة'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="عنوان المذكرة *"
                        value={newProduct.title}
                        onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm md:col-span-2"
                        required
                      />
                      <input
                        type="text"
                        placeholder="اسم المادة (مثال: الفيزياء) *"
                        value={newProduct.subject}
                        onChange={(e) => setNewProduct({ ...newProduct, subject: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                        required
                      />
                      <select
                        value={newProduct.stageId}
                        onChange={(e) => setNewProduct({ ...newProduct, stageId: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      >
                        {settings.stages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newProduct.gradeId}
                        onChange={(e) => setNewProduct({ ...newProduct, gradeId: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      >
                        {settings.grades.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newProduct.categoryId}
                        onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      >
                        {settings.categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="السعر الحالي (ج.م)"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="السعر قبل الخصم (ج.م)"
                        value={newProduct.oldPrice}
                        onChange={(e) => setNewProduct({ ...newProduct, oldPrice: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="عدد الصفحات"
                        value={newProduct.pagesCount}
                        onChange={(e) => setNewProduct({ ...newProduct, pagesCount: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <textarea
                        rows={2}
                        placeholder="وصف المذكرة ومحتوياتها..."
                        value={newProduct.description}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, description: e.target.value })
                        }
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm md:col-span-3"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition cursor-pointer"
                      >
                        {editingProduct ? 'حفظ التعديلات' : 'إضافة المذكرة'}
                      </button>
                      {editingProduct && (
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                        >
                          إلغاء
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-3">
                    <h3 className="font-black text-base text-slate-900 mb-4">
                      المذكرات الحالية ({products.length})
                    </h3>
                    {products.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100"
                      >
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{prod.title}</h4>
                          <p className="text-xs text-slate-500">
                            {prod.subject} • {prod.price} ج.م
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setNewProduct(prod);
                            }}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 cursor-pointer"
                            title="تعديل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setProducts((prev) => prev.filter((p) => p.id !== prod.id));
                              showToast('تم حذف المذكرة');
                            }}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
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

              {/* 3. قسم إدارة الباقات */}
              {adminSection === 'bundles' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleAddBundle}
                    className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4"
                  >
                    <h3 className="font-black text-base text-slate-900">إضافة باقة مخفضة جديدة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="عنوان الباقة *"
                        value={newBundle.title}
                        onChange={(e) => setNewBundle({ ...newBundle, title: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm md:col-span-2"
                        required
                      />
                      <select
                        value={newBundle.gradeId}
                        onChange={(e) => setNewBundle({ ...newBundle, gradeId: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      >
                        {settings.grades.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="سعر الباقة (ج.م)"
                        value={newBundle.price}
                        onChange={(e) => setNewBundle({ ...newBundle, price: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="السعر الأصلي قبل الخصم"
                        value={newBundle.oldPrice}
                        onChange={(e) => setNewBundle({ ...newBundle, oldPrice: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="شارة الباقة (مثال: وفر 150 ج.م)"
                        value={newBundle.badge}
                        onChange={(e) => setNewBundle({ ...newBundle, badge: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <textarea
                        rows={3}
                        placeholder="اكتب محتويات الباقة (كل مادة في سطر منفصل)..."
                        value={newBundle.itemsText}
                        onChange={(e) => setNewBundle({ ...newBundle, itemsText: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm md:col-span-3"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 cursor-pointer"
                    >
                      إضافة الباقة
                    </button>
                  </form>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-3">
                    {bundles.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-slate-50"
                      >
                        <div>
                          <h4 className="font-bold text-sm">{b.title}</h4>
                          <p className="text-xs text-slate-500">{b.price} ج.م</p>
                        </div>
                        <button
                          onClick={() => {
                            setBundles((prev) => prev.filter((item) => item.id !== b.id));
                            showToast('تم حذف الباقة');
                          }}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. قسم الكوبونات */}
              {adminSection === 'coupons' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6">
                  <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="كود الكوبون (مثال: SAVE25)"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                      className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm uppercase"
                      required
                    />
                    <input
                      type="number"
                      placeholder="نسبة الخصم %"
                      value={newCoupon.discountPercent}
                      onChange={(e) =>
                        setNewCoupon({ ...newCoupon, discountPercent: e.target.value })
                      }
                      className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="وصف الكوبون"
                      value={newCoupon.description}
                      onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                      className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                    />
                    <button
                      type="submit"
                      className="px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 cursor-pointer"
                    >
                      إضافة كوبون
                    </button>
                  </form>

                  <div className="space-y-2.5">
                    {coupons.map((cp) => (
                      <div
                        key={cp.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs">
                            {cp.code}
                          </span>
                          <span className="text-sm font-bold text-emerald-700">
                            خصم {cp.discountPercent}%
                          </span>
                          <span className="text-xs text-slate-500">{cp.description}</span>
                        </div>
                        <button
                          onClick={() => setCoupons((prev) => prev.filter((c) => c.id !== cp.id))}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. قسم النسخ الاحتياطي JSON */}
              {adminSection === 'backup' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-5">
                  <h3 className="font-black text-lg text-slate-900">
                    إدارة النسخ الاحتياطي واستعادة البيانات (JSON)
                  </h3>
                  <p className="text-sm text-slate-600">
                    يمكنك تصدير نسخة احتياطية كاملة تشمل الإعدادات، الشعار، المذكرات، الباقات، والكوبونات في ملف JSON، أو استعادة نسخة سابقة في أي وقت.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleExportBackup}
                      className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center gap-2 hover:bg-slate-800 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>تحميل نسخة احتياطية الآن</span>
                    </button>

                    <input
                      ref={fileImportRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileImportRef.current?.click()}
                      className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>استيراد ملف نسخة احتياطية</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* ====================================================================
          نافذة معاينة المذكرة (Preview Modal)
         ==================================================================== */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">معاينة تفاصيل المذكرة</h3>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  {previewProduct.subject}
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-2">{previewProduct.title}</h4>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {previewProduct.description}
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                <p className="text-xs font-extrabold text-amber-900">مقتطف من محتوى المذكرة:</p>
                <p className="text-xs sm:text-sm text-slate-700">
                  {previewProduct.samplePagesText ||
                    'تحتوي المذكرة على شرح تفصيلي لجميع دروس المنهج مع تدريبات متدرجة وإجابات نموذجية.'}
                </p>
              </div>

              {Array.isArray(previewProduct.features) && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500">مميزات الإصدار:</p>
                  {previewProduct.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <span className="text-2xl font-black text-emerald-700">
                    {previewProduct.price} ج.م
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {previewProduct.pagesCount} صفحة PDF
                  </span>
                </div>
                <button
                  onClick={() => {
                    addToCart(previewProduct, 'product');
                    setPreviewProduct(null);
                    setIsCartOpen(true);
                  }}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>أضف للسلة وأكمل الطلب</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          الدرج الجانبي لسلة المشتريات والدفع عبر واتساب
         ==================================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            {/* رأس السلة */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-lg">سلة المشتريات ({cart.length})</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* محتوى السلة */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingCart className="w-14 h-14 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">سلة المشتريات فارغة حالياً</p>
                  <p className="text-xs text-slate-500">
                    اختر المذكرات أو الباقات المناسبة لك وأضفها للسلة
                  </p>
                </div>
              ) : (
                <>
                  {/* قائمة العناصر */}
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80"
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500">{item.subtitle}</p>
                          <p className="text-sm font-black text-emerald-700 mt-1">
                            {item.price} ج.م
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                          title="إزالة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* كود الخصم */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>هل لديك كوبون خصم؟</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="أدخل الكود هنا..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm uppercase focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                      >
                        تطبيق
                      </button>
                    </div>
                  </div>

                  {/* بيانات الطالب */}
                  <div className="space-y-3">
                    <p className="text-xs font-extrabold text-slate-800">بيانات الطالب لاستلام المذكرات:</p>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="اسم الطالب ثلاثي *"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <input
                      type="tel"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="رقم واتساب الطالب (اختياري)"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* بيانات التحويل */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span>بيانات التحويل والدفع السريع:</span>
                    </p>

                    {settings.vodafoneCashNumber && (
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-100 text-xs">
                        <span className="font-bold text-slate-700">
                          فودافون كاش: <strong dir="ltr">{settings.vodafoneCashNumber}</strong>
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(settings.vodafoneCashNumber, 'رقم فودافون كاش')
                          }
                          className="text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ</span>
                        </button>
                      </div>
                    )}

                    {settings.instapayAddress && (
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-100 text-xs">
                        <span className="font-bold text-slate-700">
                          إنستاباي: <strong dir="ltr">{settings.instapayAddress}</strong>
                        </span>
                        <button
                          onClick={() => copyToClipboard(settings.instapayAddress, 'عنوان إنستاباي')}
                          className="text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ</span>
                        </button>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
                      {settings.paymentInstructions}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* ملخص السلة وزر واتساب */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي:</span>
                    <span>{subtotal} ج.م</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>الخصم ({appliedCoupon.code}):</span>
                      <span>-{discountAmount} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>الإجمالي النهائي:</span>
                    <span className="text-emerald-700">{finalTotal} ج.م</span>
                  </div>
                </div>

                <button
                  onClick={handleWhatsAppCheckout}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>إرسال الطلب عبر واتساب الآن</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* الفوتر */}
      <footer className="bg-slate-950 text-slate-400 py-10 px-4 mt-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src={isValidImageSrc(settings.logoImage) ? settings.logoImage : DEFAULT_LOGO_SVG}
              alt={settings.platformName}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_LOGO_SVG;
              }}
              className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1"
            />
            <div>
              <p className="text-white font-bold text-sm">{settings.platformName}</p>
              <p className="text-xs text-slate-500">{settings.platformTagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition"
              >
                فيسبوك
              </a>
            )}
            {settings.telegramUrl && (
              <a
                href={settings.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition"
              >
                تيليجرام
              </a>
            )}
            <a
              href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-bold transition"
            >
              تواصل واتساب
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
