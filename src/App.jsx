import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Phone,
  MessageCircle,
  Sparkles,
  FileText,
  Eye,
  X,
  Plus,
  Trash2,
  Edit3,
  Lock,
  LogOut,
  BarChart3,
  Tag,
  Layers,
  Settings,
  Download,
  Upload,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
  Filter,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Cloud,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

/**
 * ============================================================================
 * FIREBASE CONFIGURATION & INITIALIZATION
 * ============================================================================
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_du5VY8nJGDJ169Fof9EAlI9x2W2d-14",
  authDomain: "el3bakera-edu.firebaseapp.com",
  projectId: "el3bakera-edu",
  storageBucket: "el3bakera-edu.firebasestorage.app",
  messagingSenderId: "74663879858",
  appId: "1:74663879858:web:4327c0ea1b825dd6c615ab"
};

const APP_ID = 'muzakkirati-edu-app';

let firebaseApp = null;
let auth = null;
let db = null;

try {
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
} catch (err) {
  console.error('Firebase initialization error:', err);
}

/**
 * ============================================================================
 * DEFAULT SEED DATA & HELPERS
 * ============================================================================
 */
const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة للمذكرات التعليمية',
  platformTagline: 'مذكرات دراسية احترافية مُخصّصة باسمك وشعارك الخاص',
  logoUrl: '',
  logoSize: 48,
  heroBgUrl: '',
  heroBgOpacity: 65,
  heroBgFit: 'cover',
  heroOverlayColor: '#020617',
  heroOverlayOpacity: 55,
  heroMinHeight: 540,
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة اسم المعلم، رقم الهاتف، والشعار الخاص به على الغلاف وجميع الصفحات.',
  aboutTitle: 'لماذا يختار المعلمون منصة العباقرة للمذكرات التعليمية؟',
  aboutBody:
    'نحن منصة متخصصة في إعداد وتصميم المذكرات التعليمية الاحترافية للمعلمين في جميع المراحل الدراسية. نوفر لك محتوى علميًا منقحًا، وتنسيقًا عصريًا مريحًا للعين، مع تخصيص الغلاف والصفحات الداخلية باسمك ورقم هاتفك وشعارك الخاص، لتكون جاهزة للطباعة الفورية بأعلى جودة.',
  whatsappNumber: '201068481536',
  supportPhone: '01068481536',
  email: 'info@el3bakera-edu.com',
  whatsappGroupUrl: 'https://chat.whatsapp.com/G4Un9TF4oSz0P2z32iNw6a',
  facebookUrl: 'https://www.facebook.com/profile.php?id=100095504234877',
  telegramUrl: '',
  youtubeUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  paymentInstructions: 'فودافون كاش / إنستاباي: 01068481536',
  promoBannerText: '🎉 عرض خاص للمعلمين: خصم 15% على جميع مذكرات الترم الأول + إضافة الشعار مجانًا لفترة محدودة!',
  emptyCatalogTitle: 'جاري تجهيز أحدث المذكرات لهذا القسم قريبًا!',
  emptyCatalogSubtitle: 'نعمل حاليًا على تنسيق ومراجعة مذكرات هذا القسم بأعلى جودة، يمكنك حجز مذكرتك مسبقًا أو التواصل معنا.',
  emptyCatalogImage: '',
  emptyCatalogButtonText: 'اطلب تجهيز مذكرتك الآن',
  showNotices: true,
  allowTeacherLogo: true,
  teacherLogoPosition: 'bottom',
  showHomeSections: true,
  showHeroSection: true,
  showHeroTrustBox: true,
  showAboutSection: true,
  showFeaturedSection: true,
  featuredCount: 6,
  homeLayoutOrder: ['hero', 'sections', 'about', 'featured'],
  homeSectionsTitle: 'أقسام المذكرات والكورسات الرئيسية',
  homeSectionsSubtitle: 'اختر القسم المناسب لبدء تصفح المذكرات المنسقة والجاهزة باسمك وشعارك',
  homeSections: [
    {
      id: 'sec-term-1',
      title: 'مذكرات الترم الأول',
      description: 'مذكرات شرح وتدريبات شاملة لجميع المواد والمراحل الدراسية للفصل الدراسي الأول.',
      categoryId: 'cat-1',
      badge: 'متاح الآن',
      buttonText: 'تصفح مذكرات الترم الأول',
      coverImage: ''
    },
    {
      id: 'sec-term-2',
      title: 'مذكرات الترم الثاني',
      description: 'مذكرات محدثة ومنسقة للفصل الدراسي الثاني جاهزة للطباعة باسمك وشعارك الخاص.',
      categoryId: 'cat-2',
      badge: 'محدّث',
      buttonText: 'تصفح مذكرات الترم الثاني',
      coverImage: ''
    },
    {
      id: 'sec-foundation',
      title: 'كورسات التأسيس',
      description: 'سلاسل تأسيس احترافية لبناء مهارات الطلاب في القراءة والكتابة والقواعد والرياضيات.',
      categoryId: 'cat-3',
      badge: 'تأسيس شامل',
      buttonText: 'استعرض كورسات التأسيس',
      coverImage: ''
    }
  ],
  notices: [
    'جميع المذكرات تُسلّم بصيغة إلكترونية PDF عالية الدقة جاهزة للطباعة (لا يوجد شحن ورقي).',
    'يتم تخصيص الغلاف والصفحات الداخلية باسم المعلم ورقم هاتفه وشعاره الخاص خلال 24 ساعة.'
  ],
  orderFormFields: [
    {
      id: 'teacherName',
      label: 'اسم المعلم كما سيُكتب على المذكرة',
      placeholder: 'مثال: أ/ محمود شحاتة',
      type: 'text',
      visible: true,
      required: true
    },
    {
      id: 'centerAddress',
      label: 'العنوان / اسم السنتر أو الأكاديمية',
      placeholder: 'مثال: سنتر النور التعليمي - المحلة الكبرى',
      type: 'text',
      visible: true,
      required: false
    },
    {
      id: 'contactNumber',
      label: 'رقم الواتساب للتواصل وإرسال المذكرة',
      placeholder: '010XXXXXXXX',
      type: 'tel',
      visible: true,
      required: true
    },
    {
      id: 'notes',
      label: 'ملاحظات إضافية للتخصيص',
      placeholder: 'أي تفاصيل إضافية عن الغلاف أو الألوان أو البيانات المطلوبة...',
      type: 'textarea',
      visible: true,
      required: false
    }
  ]
};

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'مذكرات الترم الأول' },
  { id: 'cat-2', name: 'مذكرات الترم الثاني' },
  { id: 'cat-3', name: 'كورسات التأسيس' },
  { id: 'cat-4', name: 'مراجعات نهائية وبوكليت' }
];

const DEFAULT_STAGES = [
  { id: 'stg-1', name: 'المرحلة الابتدائية' },
  { id: 'stg-2', name: 'المرحلة الإعدادية' },
  { id: 'stg-3', name: 'المرحلة الثانوية' }
];

const DEFAULT_GRADES = [
  { id: 'grd-1', stageId: 'stg-1', name: 'الصف الرابع الابتدائي' },
  { id: 'grd-2', stageId: 'stg-1', name: 'الصف الخامس الابتدائي' },
  { id: 'grd-3', stageId: 'stg-1', name: 'الصف السادس الابتدائي' },
  { id: 'grd-4', stageId: 'stg-2', name: 'الصف الأول الإعدادي' },
  { id: 'grd-5', stageId: 'stg-2', name: 'الصف الثاني الإعدادي' },
  { id: 'grd-6', stageId: 'stg-2', name: 'الصف الثالث الإعدادي' },
  { id: 'grd-7', stageId: 'stg-3', name: 'الصف الأول الثانوي' },
  { id: 'grd-8', stageId: 'stg-3', name: 'الصف الثاني الثانوي' },
  { id: 'grd-9', stageId: 'stg-3', name: 'الصف الثالث الثانوي' }
];

const DEFAULT_SUBJECTS = [
  { id: 'sub-1', name: 'اللغة العربية' },
  { id: 'sub-2', name: 'اللغة الإنجليزية' },
  { id: 'sub-3', name: 'الرياضيات' },
  { id: 'sub-4', name: 'العلوم' },
  { id: 'sub-5', name: 'الدراسات الاجتماعية' }
];

const DEFAULT_NOTEBOOKS = [
  {
    id: 'nb-demo-1',
    title: 'مذكرة العباقرة في اللغة العربية - الصف الأول الإعدادي',
    categoryId: 'cat-1',
    stageId: 'stg-2',
    gradeId: 'grd-4',
    subjectId: 'sub-1',
    price: 150,
    oldPrice: 200,
    pagesCount: 85,
    badge: 'الأكثر طلبًا',
    description:
      'شرح مبسط وشامل لجميع دروس النحو والقراءة والنصوص وفق أحدث تعديلات الوزارة، مع تدريبات متدرجة وامتحانات شاملة على كل وحدة.',
    driveUrl: '',
    coverImage: '',
    sampleImages: [],
    isComingSoon: false,
    comingSoonText: '',
    hidden: false,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_COUPONS = [
  {
    id: 'cpn-1',
    code: 'WELCOME15',
    discountPercent: 15,
    active: true
  }
];

const ORDER_STATUSES = [
  { value: 'new', label: 'طلب جديد', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'reviewing', label: 'قيد المراجعة والتأكيد', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'customizing', label: 'جاري كتابة البيانات والتخصيص', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'ready', label: 'جاهز للتسليم', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'delivered', label: 'تم التسليم بنجاح', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-rose-100 text-rose-800 border-rose-200' }
];

function normalizeExternalUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function compressImageDataUrl(dataUrl, maxWidth = 900, quality = 0.72) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function fileToCompressedDataUrl(file, maxWidth = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const compressed = await compressImageDataUrl(e.target.result, maxWidth, quality);
      resolve(compressed);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function fitNotebookPayloadToCloud(nb) {
  const MAX_BYTES = 820 * 1024;
  let result = { ...nb };
  const estimateSize = (obj) => new Blob([JSON.stringify(obj)]).size;

  if (estimateSize(result) <= MAX_BYTES) return result;

  const presets = [
    { coverW: 680, sampleW: 620, q: 0.56 },
    { coverW: 580, sampleW: 520, q: 0.48 },
    { coverW: 500, sampleW: 440, q: 0.42 },
    { coverW: 440, sampleW: 380, q: 0.36 }
  ];

  for (const preset of presets) {
    if (result.coverImage?.startsWith('data:image')) {
      result.coverImage = await compressImageDataUrl(result.coverImage, preset.coverW, preset.q);
    }
    if (Array.isArray(result.sampleImages) && result.sampleImages.length > 0) {
      result.sampleImages = await Promise.all(
        result.sampleImages.map((img) =>
          img?.startsWith('data:image') ? compressImageDataUrl(img, preset.sampleW, preset.q) : img
        )
      );
    }
    if (estimateSize(result) <= MAX_BYTES) break;
  }

  return result;
}

/**
 * ============================================================================
 * MAIN APPLICATION COMPONENT
 * ============================================================================
 */
export default function App() {
  // Navigation & UI States
  const [activePage, setActivePage] = useState('home'); // home | catalog | offers | track | contact
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [adminView, setAdminView] = useState('dashboard'); // dashboard | orders | notebooks | coupons | structure | settings
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const logoClickCountRef = useRef(0);
  const logoClickTimerRef = useRef(null);

  // Cloud & Persistence State
  const [cloudConnected, setCloudConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Platform Data States
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const [stages, setStages] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_stages');
      return saved ? JSON.parse(saved) : DEFAULT_STAGES;
    } catch {
      return DEFAULT_STAGES;
    }
  });

  const [grades, setGrades] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_grades');
      return saved ? JSON.parse(saved) : DEFAULT_GRADES;
    } catch {
      return DEFAULT_GRADES;
    }
  });

  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_subjects');
      return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
    } catch {
      return DEFAULT_SUBJECTS;
    }
  });

  const [notebooks, setNotebooks] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_notebooks');
      return saved ? JSON.parse(saved) : DEFAULT_NOTEBOOKS;
    } catch {
      return DEFAULT_NOTEBOOKS;
    }
  });

  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_coupons');
      return saved ? JSON.parse(saved) : DEFAULT_COUPONS;
    } catch {
      return DEFAULT_COUPONS;
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & Interactive States
  const [selectedNotebookForOrder, setSelectedNotebookForOrder] = useState(null);
  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [customOrderModalOpen, setCustomOrderModalOpen] = useState(false);
  const [initialCatalogCategory, setInitialCatalogCategory] = useState('all');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 4500);
  };

  // Monitor Firebase Admin Authentication State
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setIsAdminAuthenticated(true);
        setAdminUser(user);
      } else {
        setIsAdminAuthenticated(false);
        setAdminUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore Real-Time Collections immediately on load
  useEffect(() => {
    if (!db) return;
    const basePath = ['artifacts', APP_ID, 'public', 'data'];

    const unsubSettings = onSnapshot(
      doc(db, ...basePath, 'config', 'settings'),
      (snap) => {
        setCloudConnected(true);
        if (snap.exists()) {
          const cloudData = snap.data();
          setSettings((prev) => {
            const merged = { ...prev, ...cloudData };
            try {
              localStorage.setItem('muzakkirati_settings', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      },
      (err) => {
        console.warn('Settings snapshot error:', err?.code);
      }
    );

    const unsubCategories = onSnapshot(
      doc(db, ...basePath, 'config', 'categories'),
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().items)) {
          setCategories(snap.data().items);
          try {
            localStorage.setItem('muzakkirati_categories', JSON.stringify(snap.data().items));
          } catch {}
        }
      }
    );

    const unsubStages = onSnapshot(
      doc(db, ...basePath, 'config', 'stages'),
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().items)) {
          setStages(snap.data().items);
          try {
            localStorage.setItem('muzakkirati_stages', JSON.stringify(snap.data().items));
          } catch {}
        }
      }
    );

    const unsubGrades = onSnapshot(
      doc(db, ...basePath, 'config', 'grades'),
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().items)) {
          setGrades(snap.data().items);
          try {
            localStorage.setItem('muzakkirati_grades', JSON.stringify(snap.data().items));
          } catch {}
        }
      }
    );

    const unsubSubjects = onSnapshot(
      doc(db, ...basePath, 'config', 'subjects'),
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().items)) {
          setSubjects(snap.data().items);
          try {
            localStorage.setItem('muzakkirati_subjects', JSON.stringify(snap.data().items));
          } catch {}
        }
      }
    );

    const unsubNotebooks = onSnapshot(
      collection(db, ...basePath, 'notebooks'),
      (snapshot) => {
        setCloudConnected(true);
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setNotebooks(list);
          try {
            localStorage.setItem('muzakkirati_notebooks', JSON.stringify(list));
          } catch {}
        }
      },
      (err) => {
        console.warn('Notebooks snapshot error:', err?.code);
      }
    );

    const unsubCoupons = onSnapshot(
      collection(db, ...basePath, 'coupons'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCoupons(list);
          try {
            localStorage.setItem('muzakkirati_coupons', JSON.stringify(list));
          } catch {}
        }
      }
    );

    const unsubOrders = onSnapshot(
      collection(db, ...basePath, 'orders'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setOrders(list);
        try {
          localStorage.setItem('muzakkirati_orders', JSON.stringify(list));
        } catch {}
      },
      () => {
        // Non-admin users cannot read all orders due to Firestore Security Rules (expected)
      }
    );

    return () => {
      unsubSettings();
      unsubCategories();
      unsubStages();
      unsubGrades();
      unsubSubjects();
      unsubNotebooks();
      unsubCoupons();
      unsubOrders();
    };
  }, [isAdminAuthenticated]);

  // Hidden Admin Access Listeners: URL (?admin=1 or #admin) & Keyboard Shortcut (Ctrl + Shift + L)
  useEffect(() => {
    const checkAdminTrigger = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1' || window.location.hash === '#admin') {
        setShowAdminPortal(true);
      }
    };
    checkAdminTrigger();
    window.addEventListener('hashchange', checkAdminTrigger);

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowAdminPortal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkAdminTrigger);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSecretLogoClick = () => {
    setActivePage('home');
    logoClickCountRef.current += 1;
    if (logoClickTimerRef.current) clearTimeout(logoClickTimerRef.current);
    if (logoClickCountRef.current >= 5) {
      logoClickCountRef.current = 0;
      setShowAdminPortal(true);
      return;
    }
    logoClickTimerRef.current = setTimeout(() => {
      logoClickCountRef.current = 0;
    }, 1500);
  };

  // Save Helpers (Cloud + LocalStorage)
  const saveCloudDoc = async (docSegments, data) => {
    if (!db) throw new Error('قاعدة البيانات غير متصلة');
    const ref = doc(db, 'artifacts', APP_ID, 'public', 'data', ...docSegments);
    await setDoc(ref, data, { merge: true });
  };

  const handleSaveSettings = async (updatedSettings) => {
    setSettings(updatedSettings);
    try {
      localStorage.setItem('muzakkirati_settings', JSON.stringify(updatedSettings));
    } catch {}
    try {
      await saveCloudDoc(['config', 'settings'], updatedSettings);
      showToast('تم حفظ إعدادات المنصة ومزامنتها مع السحابة بنجاح');
    } catch (err) {
      showToast(`تم الحفظ محليًا، تعذر الحفظ السحابي: ${err?.code || err?.message}`);
    }
  };

  const handleSaveStructure = async (type, items) => {
    if (type === 'categories') setCategories(items);
    if (type === 'stages') setStages(items);
    if (type === 'grades') setGrades(items);
    if (type === 'subjects') setSubjects(items);
    try {
      localStorage.setItem(`muzakkirati_${type}`, JSON.stringify(items));
    } catch {}
    try {
      await saveCloudDoc(['config', type], { items });
      showToast('تم حفظ التعديلات بنجاح');
    } catch (err) {
      showToast(`خطأ أثناء الحفظ السحابي: ${err?.code || err?.message}`);
    }
  };

  const handleSaveNotebook = async (nb) => {
    const optimizedNb = await fitNotebookPayloadToCloud(nb);
    const updatedList = notebooks.some((item) => item.id === optimizedNb.id)
      ? notebooks.map((item) => (item.id === optimizedNb.id ? optimizedNb : item))
      : [optimizedNb, ...notebooks];
    setNotebooks(updatedList);
    try {
      localStorage.setItem('muzakkirati_notebooks', JSON.stringify(updatedList));
    } catch {}
    try {
      await saveCloudDoc(['notebooks', optimizedNb.id], optimizedNb);
      showToast('تم حفظ المذكرة ومزامنتها بنجاح');
    } catch (err) {
      showToast(`تعذر رفع المذكرة للسحابة: ${err?.code || err?.message}`);
    }
  };

  const handleDeleteNotebook = async (id) => {
    const updatedList = notebooks.filter((item) => item.id !== id);
    setNotebooks(updatedList);
    try {
      localStorage.setItem('muzakkirati_notebooks', JSON.stringify(updatedList));
    } catch {}
    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'notebooks', id));
        showToast('تم حذف المذكرة بنجاح');
      } catch (err) {
        showToast(`خطأ أثناء الحذف: ${err?.code || err?.message}`);
      }
    }
  };

  const handleSaveCoupon = async (coupon) => {
    const updatedList = coupons.some((c) => c.id === coupon.id)
      ? coupons.map((c) => (c.id === coupon.id ? coupon : c))
      : [coupon, ...coupons];
    setCoupons(updatedList);
    try {
      localStorage.setItem('muzakkirati_coupons', JSON.stringify(updatedList));
    } catch {}
    try {
      await saveCloudDoc(['coupons', coupon.id], coupon);
      showToast('تم حفظ الكوبون بنجاح');
    } catch (err) {
      showToast(`خطأ أثناء حفظ الكوبون: ${err?.code || err?.message}`);
    }
  };

  const handleDeleteCoupon = async (id) => {
    const updatedList = coupons.filter((c) => c.id !== id);
    setCoupons(updatedList);
    try {
      localStorage.setItem('muzakkirati_coupons', JSON.stringify(updatedList));
    } catch {}
    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'coupons', id));
        showToast('تم حذف الكوبون');
      } catch (err) {
        showToast(`خطأ أثناء الحذف: ${err?.code || err?.message}`);
      }
    }
  };

  const handleSubmitOrder = async (newOrder) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    try {
      localStorage.setItem('muzakkirati_orders', JSON.stringify(updatedOrders));
    } catch {}
    try {
      await saveCloudDoc(['orders', newOrder.id], newOrder);
    } catch (err) {
      console.error('Order cloud save error:', err);
    }
  };

  const handleUpdateOrder = async (updatedOrder) => {
    const updatedOrders = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    setOrders(updatedOrders);
    try {
      localStorage.setItem('muzakkirati_orders', JSON.stringify(updatedOrders));
    } catch {}
    try {
      await saveCloudDoc(['orders', updatedOrder.id], updatedOrder);
      showToast('تم تحديث حالة الطلب بنجاح');
    } catch (err) {
      showToast(`خطأ أثناء التحديث: ${err?.code || err?.message}`);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const updatedOrders = orders.filter((o) => o.id !== orderId);
    setOrders(updatedOrders);
    try {
      localStorage.setItem('muzakkirati_orders', JSON.stringify(updatedOrders));
    } catch {}
    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'orders', orderId));
        showToast('تم حذف الطلب بنجاح');
      } catch (err) {
        showToast(`خطأ أثناء حذف الطلب: ${err?.code || err?.message}`);
      }
    }
  };

  const handleSyncAllToCloud = async () => {
    if (!db) {
      showToast('قاعدة البيانات غير متصلة');
      return;
    }
    try {
      const cleanSettings = { ...settings };
      if (cleanSettings.logoUrl?.startsWith('data:image')) {
        cleanSettings.logoUrl = await compressImageDataUrl(cleanSettings.logoUrl, 400, 0.75);
      }
      if (cleanSettings.heroBgUrl?.startsWith('data:image')) {
        cleanSettings.heroBgUrl = await compressImageDataUrl(cleanSettings.heroBgUrl, 1200, 0.72);
      }
      if (cleanSettings.emptyCatalogImage?.startsWith('data:image')) {
        cleanSettings.emptyCatalogImage = await compressImageDataUrl(cleanSettings.emptyCatalogImage, 850, 0.72);
      }
      if (Array.isArray(cleanSettings.homeSections)) {
        cleanSettings.homeSections = await Promise.all(
          cleanSettings.homeSections.map(async (sec) => ({
            ...sec,
            coverImage: sec.coverImage?.startsWith('data:image')
              ? await compressImageDataUrl(sec.coverImage, 760, 0.7)
              : sec.coverImage || ''
          }))
        );
      }
      await saveCloudDoc(['config', 'settings'], cleanSettings);
      await saveCloudDoc(['config', 'categories'], { items: categories });
      await saveCloudDoc(['config', 'stages'], { items: stages });
      await saveCloudDoc(['config', 'grades'], { items: grades });
      await saveCloudDoc(['config', 'subjects'], { items: subjects });

      for (const nb of notebooks) {
        const cleanNb = await fitNotebookPayloadToCloud(nb);
        await saveCloudDoc(['notebooks', cleanNb.id], cleanNb);
      }

      for (const cpn of coupons) {
        await saveCloudDoc(['coupons', cpn.id], cpn);
      }

      for (const ord of orders) {
        await saveCloudDoc(['orders', ord.id], ord);
      }

      showToast('تمت مزامنة جميع الإعدادات والمذكرات والطلبات إلى السحابة بنجاح!');
    } catch (err) {
      showToast(`خطأ أثناء المزامنة: ${err?.code || err?.message}`);
    }
  };

  const handleAdminLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch {}
    }
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    setShowAdminPortal(false);
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    showToast('تم تسجيل الخروج من لوحة التحكم بأمان');
  };

  const visibleNotebooks = useMemo(
    () => notebooks.filter((n) => !n.hidden),
    [notebooks]
  );

  // If Admin Portal is open
  if (showAdminPortal) {
    return (
      <>
        <AdminPortal
          isAdminAuthenticated={isAdminAuthenticated}
          adminUser={adminUser}
          auth={auth}
          adminView={adminView}
          setAdminView={setAdminView}
          onClose={() => {
            setShowAdminPortal(false);
            if (window.location.hash === '#admin') {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }}
          onLogout={handleAdminLogout}
          cloudConnected={cloudConnected}
          onSyncAll={handleSyncAllToCloud}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          categories={categories}
          stages={stages}
          grades={grades}
          subjects={subjects}
          onSaveStructure={handleSaveStructure}
          notebooks={notebooks}
          onSaveNotebook={handleSaveNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          coupons={coupons}
          onSaveCoupon={handleSaveCoupon}
          onDeleteCoupon={handleDeleteCoupon}
          orders={orders}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
          showToast={showToast}
        />
        {toastMessage && (
          <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 text-sm font-bold flex items-center gap-2.5 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900" dir="rtl">
      {/* Top Promo Banner */}
      {settings.promoBannerText && (
        <div className="bg-slate-950 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-bold flex flex-wrap items-center justify-center gap-3">
          <span>{settings.promoBannerText}</span>
          <button
            type="button"
            onClick={() => setActivePage('offers')}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1 rounded-full text-xs font-black transition cursor-pointer"
          >
            استفد من العرض ←
          </button>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 min-h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Name (5 rapid clicks opens hidden Admin Login) */}
          <div
            onClick={handleSecretLogoClick}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.platformName}
                style={{
                  width: `${Number(settings.logoSize) || 48}px`,
                  height: `${Number(settings.logoSize) || 48}px`
                }}
                className="rounded-2xl object-contain bg-white border border-slate-200 shadow-sm group-hover:scale-105 transition shrink-0"
              />
            ) : (
              <div
                style={{
                  width: `${Number(settings.logoSize) || 48}px`,
                  height: `${Number(settings.logoSize) || 48}px`
                }}
                className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-blue-700/20 group-hover:scale-105 transition shrink-0"
              >
                <BookOpen className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {settings.platformName}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold hidden sm:block">
                {settings.platformTagline}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
            {[
              { id: 'home', label: 'الرئيسية' },
              { id: 'catalog', label: 'المذكرات' },
              { id: 'offers', label: 'العروض والباقات' },
              { id: 'track', label: 'تتبع طلبك' },
              { id: 'contact', label: 'اتصل بنا' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`px-4 py-2 rounded-xl text-sm font-extrabold transition cursor-pointer ${
                  activePage === item.id
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Action Buttons (Admin button is hidden for regular visitors; shown only if Admin is logged in) */}
          <div className="flex items-center gap-2.5">
            {isAdminAuthenticated && (
              <button
                onClick={() => setShowAdminPortal(true)}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition shadow-sm cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>لوحة التحكم</span>
              </button>
            )}

            {settings.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition shadow-md shadow-emerald-600/20"
              >
                <MessageCircle className="w-4 h-4" />
                <span>واتساب</span>
              </a>
            )}
          </div>
        </div>

        {/* Mobile Bottom-Header Navigation */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-100 bg-white px-2 py-2 overflow-x-auto">
          {[
            { id: 'home', label: 'الرئيسية' },
            { id: 'catalog', label: 'المذكرات' },
            { id: 'offers', label: 'العروض' },
            { id: 'track', label: 'تتبع طلبك' },
            { id: 'contact', label: 'تواصل' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition ${
                activePage === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Pages */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            settings={settings}
            notebooks={visibleNotebooks}
            stages={stages}
            grades={grades}
            subjects={subjects}
            onExploreCatalog={(catId = 'all') => {
              setInitialCatalogCategory(catId || 'all');
              setActivePage('catalog');
            }}
            onOpenCustomOrder={() => setCustomOrderModalOpen(true)}
            onOrderNotebook={(nb) => setSelectedNotebookForOrder(nb)}
            onPreviewNotebook={(nb) => setPreviewNotebook(nb)}
            onGoContact={() => setActivePage('contact')}
          />
        )}

        {activePage === 'catalog' && (
          <CatalogPage
            settings={settings}
            notebooks={visibleNotebooks}
            categories={categories}
            stages={stages}
            grades={grades}
            subjects={subjects}
            initialCategory={initialCatalogCategory}
            onOrderNotebook={(nb) => setSelectedNotebookForOrder(nb)}
            onPreviewNotebook={(nb) => setPreviewNotebook(nb)}
            onOpenCustomOrder={() => setCustomOrderModalOpen(true)}
          />
        )}

        {activePage === 'offers' && (
          <OffersPage
            coupons={coupons.filter((c) => c.active)}
            notebooks={visibleNotebooks.filter((n) => n.oldPrice && n.oldPrice > n.price)}
            stages={stages}
            grades={grades}
            subjects={subjects}
            onOrderNotebook={(nb) => setSelectedNotebookForOrder(nb)}
            onPreviewNotebook={(nb) => setPreviewNotebook(nb)}
            showToast={showToast}
          />
        )}

        {activePage === 'track' && (
          <TrackOrderPage orders={orders} settings={settings} />
        )}

        {activePage === 'contact' && (
          <ContactPage settings={settings} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-white">{settings.platformName}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {settings.platformTagline} — نساعد المعلمين على تقديم محتوى تعليمي يليق باسمهم وخبراتهم بأعلى جودة طباعة وتنسيق.
            </p>
          </div>

          <div>
            <h4 className="text-white font-extrabold mb-4">روابط سريعة</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => setActivePage('catalog')} className="hover:text-white transition cursor-pointer">
                  تصفح جميع المذكرات
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('offers')} className="hover:text-white transition cursor-pointer">
                  العروض وكوبونات الخصم
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('track')} className="hover:text-white transition cursor-pointer">
                  متابعة حالة الطلب
                </button>
              </li>
              <li>
                <button onClick={() => setCustomOrderModalOpen(true)} className="hover:text-white transition cursor-pointer">
                  طلب إعداد مذكرة خاصة
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-extrabold mb-4">تواصل معنا</h4>
            <div className="space-y-2.5 text-sm text-slate-400">
              {settings.supportPhone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span dir="ltr">{settings.supportPhone}</span>
                </p>
              )}
              {settings.email && (
                <p className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span dir="ltr">{settings.email}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {settings.facebookUrl && (
                  <a
                    href={normalizeExternalUrl(settings.facebookUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-600 text-xs font-bold text-white transition"
                  >
                    فيسبوك
                  </a>
                )}
                {settings.whatsappGroupUrl && (
                  <a
                    href={normalizeExternalUrl(settings.whatsappGroupUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-600 text-xs font-bold text-white transition"
                  >
                    جروب الواتساب
                  </a>
                )}
                {settings.telegramUrl && (
                  <a
                    href={normalizeExternalUrl(settings.telegramUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 text-xs font-bold text-white transition"
                  >
                    تليجرام
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 py-5 px-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <span>© {new Date().getFullYear()} {settings.platformName}. جميع الحقوق محفوظة.</span>
          <button
            type="button"
            onClick={() => setShowAdminPortal(true)}
            title="بوابة الإدارة"
            className="text-slate-700 hover:text-slate-400 transition p-1 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

      {/* Order Modal for Specific Notebook */}
      {selectedNotebookForOrder && (
        <OrderModal
          notebook={selectedNotebookForOrder}
          settings={settings}
          coupons={coupons.filter((c) => c.active)}
          onClose={() => setSelectedNotebookForOrder(null)}
          onSubmitOrder={handleSubmitOrder}
          showToast={showToast}
        />
      )}

      {/* Custom Notebook Request Modal */}
      {customOrderModalOpen && (
        <OrderModal
          notebook={{
            id: 'custom-request',
            title: 'طلب إعداد وتنسيق مذكرة خاصة حسب الطلب',
            price: 0,
            isCustom: true
          }}
          settings={settings}
          coupons={[]}
          onClose={() => setCustomOrderModalOpen(false)}
          onSubmitOrder={handleSubmitOrder}
          showToast={showToast}
        />
      )}

      {/* Protected Sample Previewer */}
      {previewNotebook && (
        <ProtectedPreviewModal
          notebook={previewNotebook}
          settings={settings}
          onClose={() => setPreviewNotebook(null)}
          onOrderNow={() => {
            const nb = previewNotebook;
            setPreviewNotebook(null);
            setSelectedNotebookForOrder(nb);
          }}
        />
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 text-sm font-bold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * HOME PAGE COMPONENT
 * ============================================================================
 */
function HomePage({
  settings,
  notebooks,
  stages,
  grades,
  subjects,
  onExploreCatalog,
  onOpenCustomOrder,
  onOrderNotebook,
  onPreviewNotebook,
  onGoContact
}) {
  const featuredLimit = Math.max(1, Number(settings.featuredCount) || 6);
  const featuredNotebooks = notebooks.slice(0, featuredLimit);
  const bgOpacity = Math.min(100, Math.max(0, Number(settings.heroBgOpacity ?? 65))) / 100;
  const overlayOpacity = Math.min(100, Math.max(0, Number(settings.heroOverlayOpacity ?? 55))) / 100;
  const overlayColor = settings.heroOverlayColor || '#020617';
  const heroMinHeight = Number(settings.heroMinHeight) || 540;
  const heroBgFit = settings.heroBgFit === 'contain' ? 'object-contain' : 'object-cover';
  const homeSections = Array.isArray(settings.homeSections)
    ? settings.homeSections
    : DEFAULT_SETTINGS.homeSections;

  const layoutOrder = Array.isArray(settings.homeLayoutOrder) && settings.homeLayoutOrder.length > 0
    ? settings.homeLayoutOrder
    : ['hero', 'sections', 'about', 'featured'];

  const renderHeroBlock = () => {
    if (settings.showHeroSection === false) return null;
    const showTrustBox = settings.showHeroTrustBox !== false;
    return (
      <section
        key="hero"
        style={{ minHeight: `${heroMinHeight}px` }}
        className="relative overflow-hidden bg-slate-950 text-white py-16 sm:py-24 flex items-center"
      >
        {settings.heroBgUrl && (
          <img
            src={settings.heroBgUrl}
            alt=""
            style={{ opacity: bgOpacity }}
            className={`absolute inset-0 w-full h-full ${heroBgFit} object-center transition-opacity duration-300`}
          />
        )}
        <div
          style={{
            backgroundColor: overlayColor,
            opacity: settings.heroBgUrl ? overlayOpacity : 0.92
          }}
          className="absolute inset-0 transition-all duration-300"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
          <div className={`${showTrustBox ? 'lg:col-span-7' : 'lg:col-span-10 mx-auto text-center'} space-y-6`}>
            <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 px-4 py-1.5 rounded-full text-xs font-extrabold">
              <Sparkles className="w-4 h-4" />
              <span>مذكرات منسقة وجاهزة للطباعة باسمك وشعارك الخاص</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black leading-tight text-white">
              {settings.heroTitle}
            </h2>

            <p className={`text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl ${!showTrustBox ? 'mx-auto' : ''}`}>
              {settings.heroSubtitle}
            </p>

            <div className={`flex flex-wrap items-center gap-4 pt-2 ${!showTrustBox ? 'justify-center' : ''}`}>
              <button
                onClick={() => onExploreCatalog('all')}
                className="flex items-center gap-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-7 py-4 rounded-2xl text-sm sm:text-base font-black transition shadow-xl shadow-amber-400/20 cursor-pointer"
              >
                <BookOpen className="w-5 h-5" />
                <span>استعرض المذكرات المتاحة</span>
              </button>

              <button
                onClick={onOpenCustomOrder}
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-4 rounded-2xl text-sm sm:text-base font-extrabold transition backdrop-blur-sm cursor-pointer"
              >
                <FileText className="w-5 h-5" />
                <span>اطلب مذكرة خاصة</span>
              </button>
            </div>
          </div>

          {showTrustBox && (
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-amber-300 font-black text-sm">لماذا يثق بنا المعلمون؟</span>
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                </div>
                <ul className="space-y-4 text-sm text-slate-100 font-semibold">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>إضافة اسمك ورقم هاتفك وشعارك على الغلاف وجميع الصفحات</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>ملفات PDF فائقة الجودة جاهزة للطباعة الفورية</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>معاينة عينات حقيقية من المذكرة قبل تأكيد الطلب</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>تسليم سريع ومتابعة مباشرة لحالة طلبك خطوة بخطوة</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderSectionsBlock = () => {
    if (settings.showHomeSections === false || homeSections.length === 0) return null;
    return (
      <section key="sections" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center max-w-2xl mx-auto mb-9">
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3.5 py-1 rounded-full text-xs font-black mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>الأقسام الرئيسية</span>
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
            {settings.homeSectionsTitle || 'أقسام المذكرات والكورسات الرئيسية'}
          </h3>
          {settings.homeSectionsSubtitle && (
            <p className="text-sm text-slate-500 mt-1.5">{settings.homeSectionsSubtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {homeSections.map((sec, idx) => {
            const sectionCount = sec.categoryId
              ? notebooks.filter((n) => n.categoryId === sec.categoryId).length
              : notebooks.length;
            const accentStyles = [
              'from-blue-700 to-indigo-800 shadow-blue-700/20',
              'from-emerald-600 to-teal-800 shadow-emerald-700/20',
              'from-amber-500 to-orange-600 shadow-amber-600/20'
            ];
            const badgeStyles = [
              'bg-blue-50 text-blue-700',
              'bg-emerald-50 text-emerald-700',
              'bg-amber-50 text-amber-800'
            ];
            return (
              <div
                key={sec.id || idx}
                onClick={() => onExploreCatalog(sec.categoryId || 'all')}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {sec.coverImage ? (
                    <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                      <img
                        src={sec.coverImage}
                        alt={sec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                      {sec.badge && (
                        <span
                          className={`absolute top-3 right-3 text-xs font-black px-3 py-1 rounded-full shadow ${
                            badgeStyles[idx % badgeStyles.length]
                          }`}
                        >
                          {sec.badge}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="px-7 pt-7 flex items-center justify-between gap-2 mb-4">
                      <div
                        className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${
                          accentStyles[idx % accentStyles.length]
                        } text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition`}
                      >
                        <BookOpen className="w-6 h-6" />
                      </div>
                      {sec.badge && (
                        <span
                          className={`text-xs font-black px-3 py-1 rounded-full ${
                            badgeStyles[idx % badgeStyles.length]
                          }`}
                        >
                          {sec.badge}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={`px-7 ${sec.coverImage ? 'pt-5' : ''}`}>
                    <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition mb-2">
                      {sec.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                      {sec.description}
                    </p>
                  </div>
                </div>

                <div className="px-7 pb-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500">
                    {sectionCount > 0 ? `${sectionCount} مذكرة متاحة` : 'استعرض القسم'}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-blue-700 group-hover:translate-x-[-4px] transition-transform">
                    {sec.buttonText || 'تصفح القسم'} ←
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderAboutBlock = () => {
    if (settings.showAboutSection === false) return null;
    return (
      <section key="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-extrabold">
              <BookOpen className="w-4 h-4" />
              <span>تعرّف على منصتنا</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
              {settings.aboutTitle}
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {settings.aboutBody}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onExploreCatalog('all')}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl text-sm font-extrabold transition cursor-pointer"
              >
                تصفح أحدث المذكرات المتاحة
              </button>
              <button
                onClick={onGoContact}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3 rounded-xl text-sm font-extrabold transition cursor-pointer"
              >
                تواصل معنا
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: ShieldCheck,
                title: 'محتوى علمي منقح',
                desc: 'مذكرات محدثة ومطابقة لأحدث مواصفات المناهج والامتحانات.'
              },
              {
                icon: Sparkles,
                title: 'تخصيص باسمك وشعارك',
                desc: 'إضافة اسم المعلم ورقم هاتفه وشعاره على الغلاف وجميع الصفحات.'
              },
              {
                icon: Clock,
                title: 'سرعة في التنفيذ',
                desc: 'تجهيز وتسليم نسخة PDF عالية الدقة جاهزة للطباعة بأعلى جودة.'
              },
              {
                icon: Eye,
                title: 'معاينة قبل الطلب',
                desc: 'اطلع على عينات حقيقية من صفحات المذكرة وتنسيقها قبل الشراء.'
              }
            ].map((feat, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-blue-200 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                  <feat.icon className="w-5 h-5" />
                </div>
                <h4 className="font-black text-slate-900 text-sm mb-1">{feat.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderFeaturedBlock = () => {
    if (settings.showFeaturedSection === false) return null;
    return (
      <section key="featured" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900">أحدث المذكرات المتاحة</h3>
            <p className="text-sm text-slate-500 mt-1">اختر المذكرة المناسبة لمرحلتك واطلبها باسمك وشعارك الآن</p>
          </div>
          <button
            onClick={() => onExploreCatalog('all')}
            className="text-blue-700 hover:text-blue-800 font-extrabold text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>عرض الكل ({notebooks.length})</span>
            <span>←</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredNotebooks.map((nb) => (
            <NotebookCard
              key={nb.id}
              notebook={nb}
              stages={stages}
              grades={grades}
              subjects={subjects}
              onOrder={() => onOrderNotebook(nb)}
              onPreview={() => onPreviewNotebook(nb)}
            />
          ))}
        </div>
      </section>
    );
  };

  const sectionRenderers = {
    hero: renderHeroBlock,
    sections: renderSectionsBlock,
    about: renderAboutBlock,
    featured: renderFeaturedBlock
  };

  return (
    <div>
      {layoutOrder.map((blockKey) =>
        sectionRenderers[blockKey] ? sectionRenderers[blockKey]() : null
      )}
    </div>
  );
}

/**
 * ============================================================================
 * CATALOG PAGE COMPONENT
 * ============================================================================
 */
function CatalogPage({
  settings,
  notebooks,
  categories,
  stages,
  grades,
  subjects,
  initialCategory = 'all',
  onOrderNotebook,
  onPreviewNotebook,
  onOpenCustomOrder
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  useEffect(() => {
    setSelectedCategory(initialCategory || 'all');
  }, [initialCategory]);

  const availableGrades = useMemo(() => {
    if (selectedStage === 'all') return grades;
    return grades.filter((g) => g.stageId === selectedStage);
  }, [grades, selectedStage]);

  const filteredNotebooks = useMemo(() => {
    return notebooks.filter((nb) => {
      if (selectedCategory !== 'all' && nb.categoryId !== selectedCategory) return false;
      if (selectedStage !== 'all' && nb.stageId !== selectedStage) return false;
      if (selectedGrade !== 'all' && nb.gradeId !== selectedGrade) return false;
      if (selectedSubject !== 'all' && nb.subjectId !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = (nb.title || '').toLowerCase().includes(q);
        const matchDesc = (nb.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [notebooks, selectedCategory, selectedStage, selectedGrade, selectedSubject, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">مكتبة المذكرات التعليمية</h2>
          <p className="text-sm text-slate-500 mt-1">ابحث وصفِّ المذكرات حسب المرحلة الدراسية والصف والمادة</p>
        </div>
        <button
          onClick={onOpenCustomOrder}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-sm font-extrabold flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>لم تجد مذكرتك؟ اطلبها الآن</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm mb-8 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المذكرة أو المادة أو الصف..."
            className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="all">كل التصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedStage}
            onChange={(e) => {
              setSelectedStage(e.target.value);
              setSelectedGrade('all');
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="all">كل المراحل الدراسية</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="all">كل الصفوف الدراسية</option>
            {availableGrades.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="all">كل المواد</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Grid */}
      {filteredNotebooks.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 max-w-2xl mx-auto shadow-sm">
          {settings?.emptyCatalogImage ? (
            <img
              src={settings.emptyCatalogImage}
              alt={settings.emptyCatalogTitle || 'قريبًا'}
              className="max-h-64 w-auto mx-auto rounded-2xl object-contain mb-5 shadow-sm border border-slate-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
          )}

          <h3 className="text-lg sm:text-xl font-black text-slate-900">
            {settings?.emptyCatalogTitle || DEFAULT_SETTINGS.emptyCatalogTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 mb-6 leading-relaxed max-w-lg mx-auto">
            {settings?.emptyCatalogSubtitle || DEFAULT_SETTINGS.emptyCatalogSubtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenCustomOrder}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-6 py-3 rounded-xl text-xs sm:text-sm font-black transition shadow-md cursor-pointer"
            >
              {settings?.emptyCatalogButtonText || DEFAULT_SETTINGS.emptyCatalogButtonText}
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStage('all');
                setSelectedGrade('all');
                setSelectedSubject('all');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer"
            >
              عرض جميع الأقسام
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotebooks.map((nb) => (
            <NotebookCard
              key={nb.id}
              notebook={nb}
              stages={stages}
              grades={grades}
              subjects={subjects}
              onOrder={() => onOrderNotebook(nb)}
              onPreview={() => onPreviewNotebook(nb)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * NOTEBOOK CARD COMPONENT
 * ============================================================================
 */
function NotebookCard({ notebook, stages, grades, subjects, onOrder, onPreview }) {
  const stageName = stages.find((s) => s.id === notebook.stageId)?.name;
  const gradeName = grades.find((g) => g.id === notebook.gradeId)?.name;
  const subjectName = subjects.find((s) => s.id === notebook.subjectId)?.name;
  const hasSamples = Array.isArray(notebook.sampleImages) && notebook.sampleImages.length > 0;
  const isComingSoon = Boolean(notebook.isComingSoon);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition overflow-hidden flex flex-col">
      {/* Cover Image */}
      <div
        onClick={onPreview}
        className="relative h-56 bg-gradient-to-br from-slate-800 to-blue-950 flex items-center justify-center overflow-hidden cursor-pointer group"
      >
        {notebook.coverImage ? (
          <img
            src={notebook.coverImage}
            alt={notebook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="text-center p-6 text-white">
            <BookOpen className="w-12 h-12 mx-auto mb-2 text-amber-400 opacity-90" />
            <p className="text-xs font-bold text-slate-300">{subjectName || 'مذكرة تعليمية'}</p>
          </div>
        )}

        {isComingSoon ? (
          <span className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{notebook.badge || 'قريبًا • قيد الإعداد'}</span>
          </span>
        ) : (
          notebook.badge && (
            <span className="absolute top-3 right-3 bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow">
              {notebook.badge}
            </span>
          )
        )}

        {notebook.pagesCount > 0 && (
          <span className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-lg">
            {notebook.pagesCount} صفحة
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {stageName && (
            <span className="text-[11px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md">
              {stageName}
            </span>
          )}
          {gradeName && (
            <span className="text-[11px] font-extrabold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
              {gradeName}
            </span>
          )}
          {subjectName && (
            <span className="text-[11px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md">
              {subjectName}
            </span>
          )}
        </div>

        <h3
          onClick={onPreview}
          className="text-base font-black text-slate-900 hover:text-blue-700 transition mb-2 leading-snug cursor-pointer"
        >
          {notebook.title}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1 leading-relaxed">
          {notebook.description}
        </p>

        {isComingSoon && (
          <div className="mb-4 p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-xs font-bold leading-relaxed">
            {notebook.comingSoonText || 'جاري العمل على المراجعة النهائية لهذه المذكرة — يمكنك حجز نسختك مسبقًا الآن!'}
          </div>
        )}

        {/* Price Row */}
        <div className="flex items-baseline justify-between pt-3 border-t border-slate-100 mb-4">
          <div>
            {Number(notebook.price) > 0 ? (
              <>
                <span className="text-xl font-black text-blue-700">{notebook.price} ج.م</span>
                {notebook.oldPrice > notebook.price && (
                  <span className="text-xs text-slate-400 line-through mr-2 font-bold">
                    {notebook.oldPrice} ج.م
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-black text-purple-700">حجز مسبق</span>
            )}
          </div>
          <span className="text-[11px] font-bold text-emerald-600">شامل التخصيص باسمك</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onPreview}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-extrabold transition cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>{hasSamples ? `معاينة (${notebook.sampleImages.length})` : 'التفاصيل'}</span>
          </button>

          <button
            onClick={onOrder}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-white text-xs font-extrabold transition shadow-md cursor-pointer ${
              isComingSoon
                ? 'bg-purple-700 hover:bg-purple-800 shadow-purple-700/20'
                : 'bg-blue-700 hover:bg-blue-800 shadow-blue-700/20'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isComingSoon ? 'احجز نسختك' : 'اطلب الآن'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * OFFERS & COUPONS PAGE
 * ============================================================================
 */
function OffersPage({
  coupons,
  notebooks,
  stages,
  grades,
  subjects,
  onOrderNotebook,
  onPreviewNotebook,
  showToast
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">العروض وكوبونات الخصم</h2>
        <p className="text-sm text-slate-500 mt-1">انسخ كود الخصم واستخدمه عند إتمام طلب أي مذكرة</p>
      </div>

      {coupons.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons.map((cpn) => (
            <div
              key={cpn.id}
              className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white rounded-3xl p-6 shadow-lg flex flex-col justify-between"
            >
              <div>
                <span className="inline-block bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full mb-3">
                  خصم {cpn.discountPercent}%
                </span>
                <h3 className="text-lg font-black mb-1">كوبون خصم حصري للمعلمين</h3>
                <p className="text-xs text-blue-100">صالح على جميع المذكرات المتاحة في المنصة</p>
              </div>

              <div className="mt-6 flex items-center justify-between bg-white/15 border border-white/20 rounded-2xl px-4 py-3">
                <span className="font-mono font-black tracking-wider text-base" dir="ltr">
                  {cpn.code}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(cpn.code);
                    showToast(`تم نسخ الكوبون: ${cpn.code}`);
                  }}
                  className="bg-white text-blue-900 hover:bg-amber-300 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer"
                >
                  نسخ الكود
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {notebooks.length > 0 && (
        <div>
          <h3 className="text-xl font-black text-slate-900 mb-6">مذكرات عليها خصم مباشر</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {notebooks.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                stages={stages}
                grades={grades}
                subjects={subjects}
                onOrder={() => onOrderNotebook(nb)}
                onPreview={() => onPreviewNotebook(nb)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * TRACK ORDER PAGE
 * ============================================================================
 */
function TrackOrderPage({ orders, settings }) {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const matchedOrders = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];
    return orders.filter((o) => {
      const idMatch = (o.id || '').toLowerCase().includes(clean);
      const phoneMatch = (o.contactNumber || '').replace(/\s+/g, '').includes(clean.replace(/\s+/g, ''));
      return idMatch || phoneMatch;
    });
  }, [orders, query]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4">
          <Search className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">تتبع حالة طلبك</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          أدخل رقم الطلب أو رقم الواتساب المسجل لمتابعة حالة تجهيز مذكرتك
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearched(true);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="مثال: ORD-1234 أو 010XXXXXXXX"
            className="flex-1 px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-bold"
          />
          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white px-7 py-3.5 rounded-xl text-sm font-extrabold transition cursor-pointer"
          >
            بحث عن الطلب
          </button>
        </form>
      </div>

      {searched && (
        <div className="mt-8 space-y-4">
          {matchedOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <p className="font-bold text-slate-700">لم يتم العثور على طلبات مطابقة على هذا الجهاز.</p>
              <p className="text-xs text-slate-500 mt-1">
                يمكنك التواصل مباشرة مع خدمة العملاء عبر الواتساب للاستفسار عن طلبك في أي وقت.
              </p>
              {settings.whatsappNumber && (
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `مرحبًا، أود الاستفسار عن حالة طلبي رقم/هاتف: ${query}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تواصل عبر واتساب</span>
                </a>
              )}
            </div>
          ) : (
            matchedOrders.map((ord) => {
              const st = ORDER_STATUSES.find((s) => s.value === ord.status) || ORDER_STATUSES[0];
              return (
                <div key={ord.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-black text-blue-700 text-sm">{ord.id}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900">{ord.notebookTitle}</h4>
                  <p className="text-xs text-slate-500">
                    الاسم على المذكرة: <strong className="text-slate-800">{ord.teacherName}</strong>
                  </p>
                  {ord.deliveryUrl && (
                    <div className="pt-2">
                      <a
                        href={normalizeExternalUrl(ord.deliveryUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition"
                      >
                        <Download className="w-4 h-4" />
                        <span>تحميل المذكرة الجاهزة (PDF)</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * CONTACT PAGE
 * ============================================================================
 */
function ContactPage({ settings }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">تواصل مع فريق {settings.platformName}</h2>
          <p className="text-sm text-slate-500 mt-2">
            نسعد بالرد على جميع استفسارات المعلمين وطلبات التخصيص الخاصة على مدار اليوم
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {settings.whatsappNumber && (
            <a
              href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-emerald-950 text-sm">مراسلة مباشرة عبر واتساب</h4>
                <p className="text-xs text-emerald-700 mt-0.5" dir="ltr">+{settings.whatsappNumber}</p>
              </div>
            </a>
          )}

          {settings.supportPhone && (
            <a
              href={`tel:${settings.supportPhone}`}
              className="p-5 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-blue-950 text-sm">الاتصال الهاتفي بخدمة العملاء</h4>
                <p className="text-xs text-blue-700 mt-0.5" dir="ltr">{settings.supportPhone}</p>
              </div>
            </a>
          )}
        </div>

        {settings.paymentInstructions && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="text-sm font-black text-slate-900 mb-1">بيانات الدفع والتحويل المعتمدة:</h4>
            <p className="text-sm text-slate-700 font-bold">{settings.paymentInstructions}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * ORDER MODAL COMPONENT (DYNAMIC CUSTOMIZABLE FIELDS)
 * ============================================================================
 */
function OrderModal({ notebook, settings, coupons, onClose, onSubmitOrder, showToast }) {
  const fields = Array.isArray(settings.orderFormFields)
    ? settings.orderFormFields.filter((f) => f.visible)
    : DEFAULT_SETTINGS.orderFormFields;

  const [formValues, setFormValues] = useState({});
  const [logoPreview, setLogoPreview] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const basePrice = Number(notebook.price) || 0;
  const discountAmount = appliedCoupon
    ? Math.round((basePrice * appliedCoupon.discountPercent) / 100)
    : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyCoupon = () => {
    const clean = couponCode.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === clean && c.active);
    if (found) {
      setAppliedCoupon(found);
      showToast(`تم تطبيق خصم ${found.discountPercent}% بنجاح!`);
    } else {
      showToast('كود الخصم غير صحيح أو منتهي الصلاحية');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await fileToCompressedDataUrl(file, 450, 0.75);
    setLogoPreview(compressed);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      id: orderId,
      notebookId: notebook.id,
      notebookTitle: notebook.title,
      teacherName: formValues.teacherName || Object.values(formValues)[0] || 'معلم',
      centerAddress: formValues.centerAddress || '',
      contactNumber: formValues.contactNumber || '',
      notes: formValues.notes || '',
      customFieldsData: formValues,
      teacherLogo: logoPreview,
      originalPrice: basePrice,
      finalPrice,
      couponUsed: appliedCoupon ? appliedCoupon.code : '',
      status: 'new',
      deliveryUrl: '',
      createdAt: new Date().toISOString()
    };

    await onSubmitOrder(newOrder);
    setSubmitting(false);
    setSubmittedOrder(newOrder);
    showToast('تم تسجيل طلبك بنجاح!');
  };

  if (submittedOrder) {
    const whatsappMsg = `مرحبًا، قمت بطلب مذكرة من ${settings.platformName}:
• رقم الطلب: ${submittedOrder.id}
• المذكرة: ${submittedOrder.notebookTitle}
• الاسم للتخصيص: ${submittedOrder.teacherName}
• رقم التواصل: ${submittedOrder.contactNumber}
• الإجمالي: ${submittedOrder.finalPrice} ج.م`;

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white w-full max-w-md rounded-3xl p-7 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="text-xl font-black text-slate-900">تم استلام طلبك بنجاح!</h3>
          <p className="text-xs text-slate-500">احتفظ برقم الطلب لمتابعة حالة التجهيز في أي وقت</p>

          <div className="bg-slate-100 rounded-2xl p-4 font-mono font-black text-lg text-blue-700">
            {submittedOrder.id}
          </div>

          {settings.paymentInstructions && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 font-bold">
              {settings.paymentInstructions}
            </div>
          )}

          {settings.whatsappNumber && (
            <a
              href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl text-sm font-black transition shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              <span>إرسال تفاصيل الطلب على واتساب الآن</span>
            </a>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-slate-900 pr-1">إتمام طلب التخصيص</h3>
        <p className="text-xs text-blue-700 font-bold mt-1 mb-5">{notebook.title}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.id}>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                {field.label} {field.required && <span className="text-rose-600">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  required={field.required}
                  value={formValues[field.id] || ''}
                  onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm"
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  required={field.required}
                  value={formValues[field.id] || ''}
                  onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm"
                />
              )}
            </div>
          ))}

          {settings.allowTeacherLogo !== false && (
            <div style={{ order: settings.teacherLogoPosition === 'top' ? -1 : 0 }}>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                رفع شعار المعلم أو السنتر (اختياري)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="w-full text-xs text-slate-600 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          )}

          {!notebook.isCustom && coupons.length > 0 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="لديك كود خصم؟ اكتبه هنا"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                تطبيق
              </button>
            </div>
          )}

          {!notebook.isCustom && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-600">الإجمالي المطلوب:</span>
              <span className="text-lg font-black text-blue-700">{finalPrice} ج.م</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-sm transition shadow-lg shadow-blue-700/20 cursor-pointer"
          >
            {submitting ? 'جاري تسجيل الطلب...' : 'تأكيد وإرسال الطلب الآن'}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * PROTECTED SAMPLE PREVIEWER MODAL (FULLSCREEN LIGHTBOX + PINCH-TO-ZOOM + SWIPE)
 * ============================================================================
 */
function ProtectedPreviewModal({ notebook, settings, onClose, onOrderNow }) {
  const platformName = settings?.platformName || 'منصة العباقرة للمذكرات التعليمية';
  const showNotices = settings?.showNotices !== false && Array.isArray(settings?.notices) && settings.notices.length > 0;
  const images = useMemo(() => {
    const list = [];
    if (notebook?.coverImage) list.push(notebook.coverImage);
    if (Array.isArray(notebook?.sampleImages)) {
      notebook.sampleImages.forEach((img) => {
        if (img && img !== notebook.coverImage) list.push(img);
      });
    }
    return list;
  }, [notebook]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pointerStartXRef = useRef(null);
  const pinchStartDistRef = useRef(null);
  const pinchStartZoomRef = useRef(1);

  const getTouchDistance = (touches) => {
    if (!touches || touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const changePage = (newIdx) => {
    setCurrentIndex(newIdx);
    setZoomLevel(1);
    pinchStartDistRef.current = null;
  };

  const goNext = () => {
    if (images.length <= 1) return;
    changePage((currentIndex + 1) % images.length);
  };

  const goPrev = () => {
    if (images.length <= 1) return;
    changePage((currentIndex - 1 + images.length) % images.length);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3.5, Number((z + 0.4).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(1, Number((z - 0.4).toFixed(2))));
  const handleResetZoom = () => setZoomLevel(1);
  const handleToggleDoubleClickZoom = () => {
    setZoomLevel((z) => (z > 1 ? 1 : 2));
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 2) {
      pointerStartXRef.current = null;
      pinchStartDistRef.current = getTouchDistance(e.touches);
      pinchStartZoomRef.current = zoomLevel;
      return;
    }
    if (zoomLevel > 1) return;
    if (e.touches && e.touches.length === 1) {
      pointerStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length === 2 && pinchStartDistRef.current) {
      e.preventDefault();
      const currentDist = getTouchDistance(e.touches);
      if (currentDist > 0) {
        const scaleRatio = currentDist / pinchStartDistRef.current;
        const nextZoom = Math.min(3.5, Math.max(1, Number((pinchStartZoomRef.current * scaleRatio).toFixed(2))));
        setZoomLevel(nextZoom);
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (pinchStartDistRef.current !== null && (!e.touches || e.touches.length < 2)) {
      pinchStartDistRef.current = null;
      return;
    }
    if (zoomLevel > 1 || pointerStartXRef.current === null) return;
    const endX = e.changedTouches?.[0]?.clientX;
    if (typeof endX === 'number') {
      const diffX = endX - pointerStartXRef.current;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) {
          goNext();
        } else {
          goPrev();
        }
      }
    }
    pointerStartXRef.current = null;
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) return;
    pointerStartXRef.current = e.clientX;
  };

  const handleMouseUp = (e) => {
    if (zoomLevel > 1 || pointerStartXRef.current === null) return;
    const diffX = e.clientX - pointerStartXRef.current;
    if (Math.abs(diffX) > 45) {
      if (diffX > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    pointerStartXRef.current = null;
  };

  const driveLink = normalizeExternalUrl(notebook?.driveUrl);

  // True Full-Screen Image Lightbox Mode (Edge-to-Edge with Pinch-to-Zoom)
  if (isFullscreen && images.length > 0) {
    return (
      <div
        className="fixed inset-0 z-[60] bg-slate-950 text-white flex flex-col select-none"
        onContextMenu={(e) => e.preventDefault()}
        dir="rtl"
      >
        {/* Top Floating Controls */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 bg-slate-900/95 border-b border-slate-800 z-10">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3.5}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-black cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
              <span>تكبير</span>
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-black cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
              <span>تصغير</span>
            </button>
            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{Math.round(zoomLevel * 100)}%</span>
              </button>
            )}
          </div>

          <span className="text-xs font-black text-slate-200">
            {currentIndex === 0 && notebook.coverImage
              ? `الغلاف (1 / ${images.length})`
              : `${currentIndex + 1} / ${images.length}`}
          </span>

          <button
            type="button"
            onClick={() => {
              setIsFullscreen(false);
              setZoomLevel(1);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
            <span>إغلاق ملء الشاشة</span>
          </button>
        </div>

        {/* Fullscreen Pinch-Zoomable Viewport */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleToggleDoubleClickZoom}
          style={{ touchAction: zoomLevel > 1 ? 'pan-x pan-y' : 'pinch-zoom' }}
          className="flex-1 w-full h-full overflow-auto flex items-center justify-center relative bg-black"
        >
          <div
            style={{
              width: `${zoomLevel * 100}%`,
              maxWidth: zoomLevel === 1 ? '900px' : 'none',
              transition: pinchStartDistRef.current ? 'none' : 'width 0.18s ease-out'
            }}
            className="relative mx-auto"
          >
            <img
              src={images[currentIndex] || images[0]}
              alt="عينة ملء الشاشة"
              draggable={false}
              className="w-full h-auto pointer-events-none select-none block"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <span className="text-slate-900/15 font-black text-2xl sm:text-4xl -rotate-30 whitespace-nowrap">
                {platformName} • نسخة معاينة
              </span>
            </div>
          </div>

          {images.length > 1 && zoomLevel === 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="fixed right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md text-white flex items-center justify-center shadow-xl cursor-pointer z-10"
              >
                <span className="text-2xl font-black leading-none">›</span>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="fixed left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md text-white flex items-center justify-center shadow-xl cursor-pointer z-10"
              >
                <span className="text-2xl font-black leading-none">‹</span>
              </button>
            </>
          )}
        </div>

        {/* Bottom Hint & Dots */}
        <div className="py-2.5 px-4 bg-slate-900/95 border-t border-slate-800 flex flex-col items-center gap-1.5">
          <p className="text-[11px] text-slate-400 font-bold">
            قرّب وباعد بإصبعيك للتكبير والتصغير • اسحب للتنقل بين الصفحات
          </p>
          {images.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => changePage(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx ? 'w-6 bg-amber-400' : 'w-2 bg-slate-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClose}
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all"
      >
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base">{notebook.title}</h3>
            <p className="text-xs text-slate-500">
              تفاصيل ومعاينة المذكرة {notebook.pagesCount > 0 ? `• ${notebook.pagesCount} صفحة` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                title="عرض الصور في كامل الشاشة"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">ملء الشاشة</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-5">
          {/* Coming Soon Announcement Banner Inside Notebook Details */}
          {notebook.isComingSoon && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-purple-950">إعلان: هذه المذكرة قيد الإعداد والتجهيز</h4>
                <p className="text-xs text-purple-900 font-semibold leading-relaxed">
                  {notebook.comingSoonText || 'نعمل حاليًا على اللمسات النهائية لهذه المذكرة، ويمكنك تسجيل حجزك المسبق الآن لتستلمها فور صدورها.'}
                </p>
              </div>
            </div>
          )}

          {/* Notebook Description & Details Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                وصف ومحتوى المذكرة
              </span>
              {notebook.pagesCount > 0 && (
                <span className="text-xs font-extrabold text-slate-600">
                  عدد الصفحات: {notebook.pagesCount} صفحة
                </span>
              )}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {notebook.description || 'مذكرة دراسية منسقة ومحدثة بالكامل وجاهزة للطباعة باسم المعلم وشعاره الخاص.'}
            </p>

            {driveLink && (
              <div className="pt-2">
                <a
                  href={driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>مطالعة النسخة الكاملة على Google Drive</span>
                </a>
              </div>
            )}
          </div>

          {/* Important Notices Inside Each Notebook's Detail Page */}
          {showNotices && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/25 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-amber-950">تنبيهات هامة قبل الطلب:</h4>
                <ul className="text-xs text-amber-900 space-y-1 font-semibold">
                  {settings.notices.map((notice, idx) => (
                    <li key={idx}>• {notice}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Interactive Pinch-Zoomable & Swipeable Sample Pages Viewer */}
          {images.length > 0 && (
            <div className="flex flex-col items-center">
              {/* Zoom & Fullscreen Toolbar */}
              <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>كامل الشاشة</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3.5}
                    title="تكبير الصفحة"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-700 text-xs font-black transition cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                    <span>تكبير</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    title="تصغير الصفحة"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-black transition cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                    <span>تصغير</span>
                  </button>
                  {zoomLevel > 1 && (
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      title="إعادة الحجم الطبيعي"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-black transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{Math.round(zoomLevel * 100)}%</span>
                    </button>
                  )}
                </div>

                <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  {currentIndex === 0 && notebook.coverImage
                    ? `الغلاف (1 / ${images.length})`
                    : `صفحة ${currentIndex + 1} من ${images.length}`}
                </span>
              </div>

              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onDoubleClick={handleToggleDoubleClickZoom}
                style={{ touchAction: zoomLevel > 1 ? 'pan-x pan-y' : 'pinch-zoom' }}
                className={`relative max-w-xl w-full rounded-2xl shadow-xl border border-slate-300 bg-white ${
                  zoomLevel > 1
                    ? 'overflow-auto max-h-[65vh] cursor-zoom-out'
                    : 'overflow-hidden cursor-zoom-in'
                }`}
              >
                <div
                  style={{
                    width: `${zoomLevel * 100}%`,
                    transition: pinchStartDistRef.current ? 'none' : 'width 0.18s ease-out'
                  }}
                  className="relative"
                >
                  <img
                    src={images[currentIndex] || images[0]}
                    alt="عينة معاينة"
                    draggable={false}
                    className="w-full h-auto pointer-events-none select-none block"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <span className="text-slate-900/15 font-black text-2xl sm:text-3xl -rotate-30 whitespace-nowrap">
                      {platformName} • نسخة معاينة
                    </span>
                  </div>
                </div>

                {images.length > 1 && zoomLevel === 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                      title="الصفحة السابقة"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg transition cursor-pointer"
                    >
                      <span className="text-lg font-black leading-none">›</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                      }}
                      title="الصفحة التالية"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg transition cursor-pointer"
                    >
                      <span className="text-lg font-black leading-none">‹</span>
                    </button>
                  </>
                )}
              </div>

              <p className="text-[11px] font-bold text-slate-500 mt-2.5 text-center">
                اضغط «كامل الشاشة» للمطالعة بحجم الشاشة الكامل • قرّب بإصبعيك للتكبير أو اسحب للتنقل
              </p>

              {images.length > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => changePage(idx)}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${
                        currentIndex === idx
                          ? 'w-7 bg-blue-700'
                          : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                      }`}
                      title={idx === 0 && notebook.coverImage ? 'الغلاف' : `صفحة ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-4">
          <div>
            {Number(notebook.price) > 0 ? (
              <>
                <span className="font-black text-blue-700 text-lg">{notebook.price} ج.م</span>
                {notebook.oldPrice > notebook.price && (
                  <span className="text-xs text-slate-400 line-through mr-2 font-bold">
                    {notebook.oldPrice} ج.م
                  </span>
                )}
              </>
            ) : (
              <span className="font-black text-purple-700 text-base">حجز مسبق</span>
            )}
          </div>
          <button
            type="button"
            onClick={onOrderNow}
            className={`text-white px-6 py-3 rounded-xl text-sm font-black transition cursor-pointer ${
              notebook.isComingSoon
                ? 'bg-purple-700 hover:bg-purple-800'
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {notebook.isComingSoon ? 'احجز هذه المذكرة مسبقًا الآن' : 'اطلب هذه المذكرة باسمك الآن'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * ADMIN PORTAL COMPONENT
 * ============================================================================
 */
function AdminPortal({
  isAdminAuthenticated,
  adminUser,
  auth,
  adminView,
  setAdminView,
  onClose,
  onLogout,
  cloudConnected,
  onSyncAll,
  settings,
  onSaveSettings,
  categories,
  stages,
  grades,
  subjects,
  onSaveStructure,
  notebooks,
  onSaveNotebook,
  onDeleteNotebook,
  coupons,
  onSaveCoupon,
  onDeleteCoupon,
  orders,
  onUpdateOrder,
  onDeleteOrder,
  showToast
}) {
  if (!isAdminAuthenticated) {
    return (
      <AdminAuthGate
        auth={auth}
        onBack={onClose}
        showToast={showToast}
      />
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + (Number(o.finalPrice) || 0), 0);
  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const completedCount = orders.filter((o) => o.status === 'ready' || o.status === 'delivered').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900" dir="rtl">
      {/* Top Admin Header */}
      <header className="bg-slate-950 text-white px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black">لوحة التحكم الإدارية</h1>
            <p className="text-[11px] text-slate-400">{adminUser?.email || settings.platformName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
              cloudConnected
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${cloudConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{cloudConnected ? 'متصل بالسحابة' : 'جاري الاتصال...'}</span>
          </span>

          <button
            onClick={onSyncAll}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>مزامنة للسحابة</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>معاينة الموقع</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </header>

      {/* Admin Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {[
            { id: 'dashboard', label: 'الإحصائيات', icon: BarChart3 },
            { id: 'orders', label: `الطلبات (${orders.length})`, icon: ShoppingBag },
            { id: 'notebooks', label: `المذكرات (${notebooks.length})`, icon: BookOpen },
            { id: 'coupons', label: 'العروض والكوبونات', icon: Tag },
            { id: 'structure', label: 'المراحل والمواد', icon: Layers },
            { id: 'settings', label: 'إعدادات الموقع', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAdminView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                adminView === tab.id
                  ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Views */}
        {adminView === 'dashboard' && (
          <div className="space-y-6 pb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500">إجمالي الطلبات</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{orders.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-blue-600">طلبات جديدة بانتظار المراجعة</p>
                <p className="text-3xl font-black text-blue-700 mt-2">{newOrdersCount}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-emerald-600">طلبات جاهزة / مسلّمة</p>
                <p className="text-3xl font-black text-emerald-600 mt-2">{completedCount}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-amber-600">إجمالي الإيرادات</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{totalRevenue} ج.م</p>
              </div>
            </div>
          </div>
        )}

        {adminView === 'orders' && (
          <AdminOrdersTab
            orders={orders}
            onUpdateOrder={onUpdateOrder}
            onDeleteOrder={onDeleteOrder}
          />
        )}

        {adminView === 'notebooks' && (
          <AdminNotebooksTab
            notebooks={notebooks}
            categories={categories}
            stages={stages}
            grades={grades}
            subjects={subjects}
            onSaveNotebook={onSaveNotebook}
            onDeleteNotebook={onDeleteNotebook}
          />
        )}

        {adminView === 'coupons' && (
          <AdminCouponsTab
            coupons={coupons}
            onSaveCoupon={onSaveCoupon}
            onDeleteCoupon={onDeleteCoupon}
          />
        )}

        {adminView === 'structure' && (
          <AdminStructureTab
            categories={categories}
            stages={stages}
            grades={grades}
            subjects={subjects}
            onSaveStructure={onSaveStructure}
          />
        )}

        {adminView === 'settings' && (
          <AdminSettingsTab
            settings={settings}
            categories={categories}
            onSaveSettings={onSaveSettings}
            onExportBackup={() => {
              const payload = {
                exportedAt: new Date().toISOString(),
                settings,
                categories,
                stages,
                grades,
                subjects,
                notebooks,
                coupons,
                orders
              };
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `el3bakera-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              showToast('تم تحميل النسخة الاحتياطية الكاملة على جهازك بنجاح!');
            }}
            onImportBackup={async (backupData) => {
              try {
                if (backupData.settings) await onSaveSettings({ ...DEFAULT_SETTINGS, ...backupData.settings });
                if (Array.isArray(backupData.categories)) await onSaveStructure('categories', backupData.categories);
                if (Array.isArray(backupData.stages)) await onSaveStructure('stages', backupData.stages);
                if (Array.isArray(backupData.grades)) await onSaveStructure('grades', backupData.grades);
                if (Array.isArray(backupData.subjects)) await onSaveStructure('subjects', backupData.subjects);
                if (Array.isArray(backupData.notebooks)) {
                  for (const nb of backupData.notebooks) {
                    await onSaveNotebook(nb);
                  }
                }
                if (Array.isArray(backupData.coupons)) {
                  for (const cpn of backupData.coupons) {
                    await onSaveCoupon(cpn);
                  }
                }
                showToast('تمت استعادة النسخة الاحتياطية ومزامنتها بنجاح!');
              } catch (err) {
                showToast(`تعذر استعادة الملف: ${err?.message || 'صيغة غير صالحة'}`);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function AdminOrdersTab({ orders, onUpdateOrder, onDeleteOrder }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  return (
    <div className="space-y-4 pb-12">
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <p className="font-bold text-slate-600">لا توجد طلبات مسجلة حتى الآن.</p>
        </div>
      ) : (
        orders.map((ord) => (
          <div key={ord.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono font-black text-blue-700 text-sm">{ord.id}</span>
                <h4 className="font-black text-slate-900 text-base mt-0.5">{ord.notebookTitle}</h4>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={ord.status}
                  onChange={(e) => onUpdateOrder({ ...ord, status: e.target.value })}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-extrabold bg-slate-50"
                >
                  {ORDER_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>

                {confirmDeleteId === ord.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteOrder(ord.id);
                        setConfirmDeleteId(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer"
                    >
                      تأكيد الحذف
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(ord.id)}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                    title="حذف الطلب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl">
              <p><span className="text-slate-500">الاسم:</span> <strong>{ord.teacherName}</strong></p>
              <p><span className="text-slate-500">التواصل:</span> <strong dir="ltr">{ord.contactNumber}</strong></p>
              <p><span className="text-slate-500">المبلغ:</span> <strong>{ord.finalPrice} ج.م</strong></p>
              {ord.centerAddress && <p><span className="text-slate-500">العنوان:</span> <strong>{ord.centerAddress}</strong></p>}
              {ord.notes && <p className="sm:col-span-2"><span className="text-slate-500">ملاحظات:</span> <strong>{ord.notes}</strong></p>}
            </div>

            {ord.teacherLogo && (
              <div className="flex items-center gap-3 bg-blue-50/60 border border-blue-100 p-3 rounded-2xl">
                <img src={ord.teacherLogo} alt="شعار المعلم" className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200" />
                <div className="text-xs">
                  <p className="font-extrabold text-slate-800">شعار المعلم المرفق مع الطلب</p>
                  <a
                    href={ord.teacherLogo}
                    download={`logo-${ord.id}.png`}
                    className="text-blue-700 font-bold hover:underline"
                  >
                    تحميل الشعار
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                dir="ltr"
                defaultValue={ord.deliveryUrl || ''}
                onBlur={(e) => {
                  if (e.target.value !== (ord.deliveryUrl || '')) {
                    onUpdateOrder({ ...ord, deliveryUrl: e.target.value });
                  }
                }}
                placeholder="ضع رابط تحميل المذكرة الجاهزة (Google Drive) هنا..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AdminNotebooksTab({
  notebooks,
  categories,
  stages,
  grades,
  subjects,
  onSaveNotebook,
  onDeleteNotebook
}) {
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [stageId, setStageId] = useState(stages[0]?.id || '');
  const [gradeId, setGradeId] = useState(grades[0]?.id || '');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [price, setPrice] = useState(150);
  const [oldPrice, setOldPrice] = useState(180);
  const [pagesCount, setPagesCount] = useState(80);
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [sampleImages, setSampleImages] = useState([]);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [comingSoonText, setComingSoonText] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setPrice(150);
    setOldPrice(180);
    setPagesCount(80);
    setBadge('');
    setDescription('');
    setDriveUrl('');
    setCoverImage('');
    setSampleImages([]);
    setIsComingSoon(false);
    setComingSoonText('');
  };

  const startEdit = (nb) => {
    setEditingId(nb.id);
    setTitle(nb.title || '');
    setCategoryId(nb.categoryId || categories[0]?.id || '');
    setStageId(nb.stageId || stages[0]?.id || '');
    setGradeId(nb.gradeId || grades[0]?.id || '');
    setSubjectId(nb.subjectId || subjects[0]?.id || '');
    setPrice(nb.price || 0);
    setOldPrice(nb.oldPrice || 0);
    setPagesCount(nb.pagesCount || 0);
    setBadge(nb.badge || '');
    setDescription(nb.description || '');
    setDriveUrl(nb.driveUrl || '');
    setCoverImage(nb.coverImage || '');
    setSampleImages(nb.sampleImages || []);
    setIsComingSoon(Boolean(nb.isComingSoon));
    setComingSoonText(nb.comingSoonText || '');
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await fileToCompressedDataUrl(file, 760, 0.68);
    setCoverImage(compressed);
  };

  const handleSamplesChange = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 15);
    if (files.length === 0) return;
    const compressedList = await Promise.all(
      files.map((f) => fileToCompressedDataUrl(f, 720, 0.62))
    );
    setSampleImages(compressedList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const nbObj = {
      id: editingId || `nb-${Date.now()}`,
      title: title.trim(),
      categoryId,
      stageId,
      gradeId,
      subjectId,
      price: Number(price) || 0,
      oldPrice: Number(oldPrice) || 0,
      pagesCount: Number(pagesCount) || 0,
      badge: badge.trim(),
      description: description.trim(),
      driveUrl: driveUrl.trim(),
      coverImage,
      sampleImages,
      isComingSoon,
      comingSoonText: comingSoonText.trim(),
      hidden: false,
      createdAt: new Date().toISOString()
    };
    await onSaveNotebook(nbObj);
    resetForm();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      {/* Add / Edit Form */}
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
        <h3 className="text-lg font-black text-slate-900 mb-4">
          {editingId ? 'تعديل المذكرة' : 'إضافة مذكرة جديدة'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان المذكرة..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">السعر الحالي</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">قبل الخصم</label>
              <input
                type="number"
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">الصفحات</label>
              <input
                type="number"
                value={pagesCount}
                onChange={(e) => setPagesCount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>
          </div>

          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="شارة التميز (مثال: الأكثر طلبًا / عرض خاص)"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
          />

          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف المذكرة..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
          />

          {/* Coming Soon / Under Preparation Announcement Control */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-black text-purple-950 cursor-pointer">
              <input
                type="checkbox"
                checked={isComingSoon}
                onChange={(e) => setIsComingSoon(e.target.checked)}
                className="w-4 h-4 accent-purple-700"
              />
              <span>المذكرة لم تكتمل بعد (وضع إعلان «قريبًا / حجز مسبق»)</span>
            </label>
            {isComingSoon && (
              <textarea
                rows={2}
                value={comingSoonText}
                onChange={(e) => setComingSoonText(e.target.value)}
                placeholder="اكتب نص الإعلان أو موعد الصدور الذي سيظهر للزوار على هذه المذكرة..."
                className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رابط Google Drive لمطالعة نسخة المذكرة (اختياري)
            </label>
            <input
              type="url"
              dir="ltr"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-left"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">صورة غلاف المذكرة</label>
            <input type="file" accept="image/*" onChange={handleCoverChange} className="text-xs" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              صور صفحات عينة المعاينة (حتى 15 صفحة) {sampleImages.length > 0 && `— مختار (${sampleImages.length})`}
            </label>
            <input type="file" accept="image/*" multiple onChange={handleSamplesChange} className="text-xs" />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl text-xs font-black cursor-pointer"
            >
              {editingId ? 'حفظ التعديلات' : '+ إضافة المذكرة'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Existing Notebooks List */}
      <div className="lg:col-span-7 space-y-3">
        {notebooks.map((nb) => (
          <div key={nb.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-black text-slate-900 text-sm">{nb.title}</h4>
                {nb.isComingSoon && (
                  <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    قريبًا / إعلان
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                السعر: <strong className="text-blue-700">{nb.price} ج.م</strong> • {nb.pagesCount} صفحة
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(nb)}
                className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                title="تعديل"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSaveNotebook({ ...nb, hidden: !nb.hidden })}
                className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
                title={nb.hidden ? 'إظهار' : 'إخفاء'}
              >
                {nb.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onDeleteNotebook(nb.id)}
                className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCouponsTab({ coupons, onSaveCoupon, onDeleteCoupon }) {
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(15);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    await onSaveCoupon({
      id: `cpn-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountPercent: Number(discountPercent) || 10,
      active: true
    });
    setCode('');
  };

  return (
    <div className="max-w-2xl space-y-6 pb-12">
      <form onSubmit={handleAdd} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-wrap gap-3">
        <input
          type="text"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="كود الكوبون (مثال: SAVE20)"
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm uppercase font-bold"
        />
        <input
          type="number"
          min={1}
          max={90}
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          className="w-28 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
        />
        <button type="submit" className="bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-black cursor-pointer">
          + إضافة كوبون
        </button>
      </form>

      <div className="space-y-3">
        {coupons.map((cpn) => (
          <div key={cpn.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-mono font-black text-blue-700">{cpn.code}</span>
              <span className="mr-3 text-xs font-bold text-emerald-600">خصم {cpn.discountPercent}%</span>
            </div>
            <button
              onClick={() => onDeleteCoupon(cpn.id)}
              className="p-2 rounded-xl bg-rose-50 text-rose-700 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminStructureTab({ categories, stages, grades, subjects, onSaveStructure }) {
  const [newCat, setNewCat] = useState('');
  const [newStage, setNewStage] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [gradeStageId, setGradeStageId] = useState(stages[0]?.id || '');
  const [newSubject, setNewSubject] = useState('');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
      {/* Categories */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
        <h3 className="font-black text-slate-900">التصنيفات</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="اسم التصنيف..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
          />
          <button
            onClick={() => {
              if (!newCat.trim()) return;
              onSaveStructure('categories', [...categories, { id: `cat-${Date.now()}`, name: newCat.trim() }]);
              setNewCat('');
            }}
            className="bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
          >
            إضافة
          </button>
        </div>
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold">
              <span>{c.name}</span>
              <button
                onClick={() => onSaveStructure('categories', categories.filter((x) => x.id !== c.id))}
                className="text-rose-600 cursor-pointer"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stages */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
        <h3 className="font-black text-slate-900">المراحل الدراسية</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newStage}
            onChange={(e) => setNewStage(e.target.value)}
            placeholder="اسم المرحلة..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
          />
          <button
            onClick={() => {
              if (!newStage.trim()) return;
              onSaveStructure('stages', [...stages, { id: `stg-${Date.now()}`, name: newStage.trim() }]);
              setNewStage('');
            }}
            className="bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
          >
            إضافة
          </button>
        </div>
        <div className="space-y-2">
          {stages.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold">
              <span>{s.name}</span>
              <button
                onClick={() => onSaveStructure('stages', stages.filter((x) => x.id !== s.id))}
                className="text-rose-600 cursor-pointer"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Grades */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
        <h3 className="font-black text-slate-900">الصفوف الدراسية</h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={gradeStageId}
            onChange={(e) => setGradeStageId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={newGrade}
            onChange={(e) => setNewGrade(e.target.value)}
            placeholder="اسم الصف..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
          />
          <button
            onClick={() => {
              if (!newGrade.trim()) return;
              onSaveStructure('grades', [...grades, { id: `grd-${Date.now()}`, stageId: gradeStageId, name: newGrade.trim() }]);
              setNewGrade('');
            }}
            className="bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
          >
            إضافة
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {grades.map((g) => (
            <div key={g.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold">
              <span>{g.name}</span>
              <button
                onClick={() => onSaveStructure('grades', grades.filter((x) => x.id !== g.id))}
                className="text-rose-600 cursor-pointer"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
        <h3 className="font-black text-slate-900">المواد الدراسية</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="اسم المادة..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
          />
          <button
            onClick={() => {
              if (!newSubject.trim()) return;
              onSaveStructure('subjects', [...subjects, { id: `sub-${Date.now()}`, name: newSubject.trim() }]);
              setNewSubject('');
            }}
            className="bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
          >
            إضافة
          </button>
        </div>
        <div className="space-y-2">
          {subjects.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold">
              <span>{s.name}</span>
              <button
                onClick={() => onSaveStructure('subjects', subjects.filter((x) => x.id !== s.id))}
                className="text-rose-600 cursor-pointer"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminSettingsTab({ settings, categories = [], onSaveSettings, onExportBackup, onImportBackup }) {
  const safeOrderFields = useMemo(() => {
    if (Array.isArray(settings?.orderFormFields) && settings.orderFormFields.length > 0) {
      return settings.orderFormFields.filter((f) => f && typeof f === 'object').map((f, i) => ({
        id: f.id || `field_${i}`,
        label: f.label || '',
        placeholder: f.placeholder || '',
        type: f.type || 'text',
        visible: f.visible !== false,
        required: Boolean(f.required)
      }));
    }
    return DEFAULT_SETTINGS.orderFormFields;
  }, [settings]);

  const safeHomeSections = useMemo(() => {
    if (Array.isArray(settings?.homeSections)) {
      return settings.homeSections.filter((s) => s && typeof s === 'object').map((s, i) => ({
        id: s.id || `sec_${i}`,
        title: s.title || '',
        description: s.description || '',
        categoryId: s.categoryId || '',
        badge: s.badge || '',
        buttonText: s.buttonText || 'تصفح القسم',
        coverImage: s.coverImage || ''
      }));
    }
    return DEFAULT_SETTINGS.homeSections;
  }, [settings]);

  const safeLayoutOrder = useMemo(() => {
    const base = ['hero', 'sections', 'about', 'featured'];
    if (Array.isArray(settings?.homeLayoutOrder) && settings.homeLayoutOrder.length > 0) {
      const valid = settings.homeLayoutOrder.filter((k) => base.includes(k));
      base.forEach((k) => {
        if (!valid.includes(k)) valid.push(k);
      });
      return valid;
    }
    return base;
  }, [settings]);

  const [form, setForm] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
    orderFormFields: safeOrderFields,
    homeSections: safeHomeSections,
    homeLayoutOrder: safeLayoutOrder
  }));

  useEffect(() => {
    setForm((prev) => ({
      ...DEFAULT_SETTINGS,
      ...prev,
      ...(settings || {}),
      orderFormFields: safeOrderFields,
      homeSections: safeHomeSections,
      homeLayoutOrder: safeLayoutOrder
    }));
  }, [settings, safeOrderFields, safeHomeSections, safeLayoutOrder]);

  const handleImageUpload = async (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxW = field === 'logoUrl' ? 400 : field === 'emptyCatalogImage' ? 850 : 1200;
    const compressed = await fileToCompressedDataUrl(file, maxW, 0.75);
    setForm((prev) => ({ ...prev, [field]: compressed }));
  };

  const handleSectionCoverUpload = async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await fileToCompressedDataUrl(file, 760, 0.72);
    updateHomeSection(idx, { coverImage: compressed });
  };

  const moveHomeSection = (idx, direction) => {
    setForm((prev) => {
      const current = [...(Array.isArray(prev.homeSections) ? prev.homeSections : safeHomeSections)];
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= current.length) return prev;
      const temp = current[idx];
      current[idx] = current[targetIdx];
      current[targetIdx] = temp;
      return { ...prev, homeSections: current };
    });
  };

  const moveLayoutBlock = (idx, direction) => {
    setForm((prev) => {
      const current = [...(Array.isArray(prev.homeLayoutOrder) ? prev.homeLayoutOrder : safeLayoutOrder)];
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= current.length) return prev;
      const temp = current[idx];
      current[idx] = current[targetIdx];
      current[targetIdx] = temp;
      return { ...prev, homeLayoutOrder: current };
    });
  };

  const updateOrderField = (idx, patch) => {
    setForm((prev) => {
      const current = Array.isArray(prev.orderFormFields) ? prev.orderFormFields : safeOrderFields;
      const updated = [...current];
      updated[idx] = { ...updated[idx], ...patch };
      return { ...prev, orderFormFields: updated };
    });
  };

  const addOrderField = () => {
    setForm((prev) => {
      const current = Array.isArray(prev.orderFormFields) ? prev.orderFormFields : safeOrderFields;
      return {
        ...prev,
        orderFormFields: [
          ...current,
          {
            id: `custom_${Date.now()}`,
            label: 'حقل إضافي جديد',
            placeholder: 'اكتب هنا...',
            type: 'text',
            visible: true,
            required: false
          }
        ]
      };
    });
  };

  const removeOrderField = (idx) => {
    setForm((prev) => {
      const current = Array.isArray(prev.orderFormFields) ? prev.orderFormFields : safeOrderFields;
      return {
        ...prev,
        orderFormFields: current.filter((_, i) => i !== idx)
      };
    });
  };

  const moveOrderField = (idx, direction) => {
    setForm((prev) => {
      const current = [...(Array.isArray(prev.orderFormFields) ? prev.orderFormFields : safeOrderFields)];
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= current.length) return prev;
      const temp = current[idx];
      current[idx] = current[targetIdx];
      current[targetIdx] = temp;
      return { ...prev, orderFormFields: current };
    });
  };

  const updateHomeSection = (idx, patch) => {
    setForm((prev) => {
      const current = Array.isArray(prev.homeSections) ? prev.homeSections : safeHomeSections;
      const updated = [...current];
      updated[idx] = { ...updated[idx], ...patch };
      return { ...prev, homeSections: updated };
    });
  };

  const addHomeSection = () => {
    setForm((prev) => {
      const current = Array.isArray(prev.homeSections) ? prev.homeSections : safeHomeSections;
      return {
        ...prev,
        homeSections: [
          ...current,
          {
            id: `sec_${Date.now()}`,
            title: 'قسم جديد في الصفحة الرئيسية',
            description: 'وصف مختصر لمحتوى هذا القسم...',
            categoryId: categories[0]?.id || '',
            badge: 'جديد',
            buttonText: 'استعرض القسم',
            coverImage: ''
          }
        ]
      };
    });
  };

  const removeHomeSection = (idx) => {
    setForm((prev) => {
      const current = Array.isArray(prev.homeSections) ? prev.homeSections : safeHomeSections;
      return {
        ...prev,
        homeSections: current.filter((_, i) => i !== idx)
      };
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSaveSettings(form);
      }}
      className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 pb-12"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">اسم المنصة</label>
          <input
            type="text"
            value={form.platformName || ''}
            onChange={(e) => setForm({ ...form, platformName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">الوصف المختصر أسفل الاسم</label>
          <input
            type="text"
            value={form.platformTagline || ''}
            onChange={(e) => setForm({ ...form, platformTagline: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">شعار المنصة (Logo)</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload('logoUrl', e)} className="text-xs" />
        </div>
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">صورة خلفية الواجهة الترحيبية</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload('heroBgUrl', e)} className="text-xs" />
        </div>

        {/* Visual Controls for Logo Size, Hero Background Clarity & Overlay Color */}
        <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              التحكم في حجم الشعار وصورة الخلفية واللون المغطي لها
            </h4>
            {form.heroBgUrl && (
              <button
                type="button"
                onClick={() => setForm({ ...form, heroBgUrl: '' })}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                حذف صورة الخلفية
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Logo Size */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-1.5">
                <span>حجم الشعار (Logo)</span>
                <span className="text-blue-700">{form.logoSize || 48}px</span>
              </div>
              <input
                type="range"
                min={36}
                max={120}
                value={form.logoSize || 48}
                onChange={(e) => setForm({ ...form, logoSize: Number(e.target.value) })}
                className="w-full accent-blue-700 cursor-pointer"
              />
            </div>

            {/* Hero Image Clarity */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-1.5">
                <span>وضوح صورة الخلفية</span>
                <span className="text-blue-700">{form.heroBgOpacity ?? 65}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={form.heroBgOpacity ?? 65}
                onChange={(e) => setForm({ ...form, heroBgOpacity: Number(e.target.value) })}
                className="w-full accent-blue-700 cursor-pointer"
              />
            </div>

            {/* Hero Overlay Color & Opacity */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 mb-1.5">
                <span>لون التغطية ودرجته</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.heroOverlayColor || '#020617'}
                    onChange={(e) => setForm({ ...form, heroOverlayColor: e.target.value })}
                    className="w-6 h-6 rounded border-0 cursor-pointer"
                    title="اختر لون الطبقة المغطية"
                  />
                  <span className="text-blue-700">{form.heroOverlayOpacity ?? 55}%</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={95}
                value={form.heroOverlayOpacity ?? 55}
                onChange={(e) => setForm({ ...form, heroOverlayOpacity: Number(e.target.value) })}
                className="w-full accent-blue-700 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-extrabold text-slate-700 mb-1.5">
                <span>ارتفاع الواجهة الترحيبية</span>
                <span className="text-blue-700">{form.heroMinHeight || 540}px</span>
              </div>
              <input
                type="range"
                min={360}
                max={780}
                step={10}
                value={form.heroMinHeight || 540}
                onChange={(e) => setForm({ ...form, heroMinHeight: Number(e.target.value) })}
                className="w-full accent-blue-700 cursor-pointer"
              />
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700">طريقة احتواء صورة الخلفية</span>
              <select
                value={form.heroBgFit || 'cover'}
                onChange={(e) => setForm({ ...form, heroBgFit: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50"
              >
                <option value="cover">ملء الإطار بالكامل (Cover)</option>
                <option value="contain">إظهار الصورة كاملة بدون قص (Contain)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-1">العنوان الرئيسي في الواجهة</label>
          <input
            type="text"
            value={form.heroTitle || ''}
            onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-1">النص الفرعي للواجهة</label>
          <textarea
            rows={2}
            value={form.heroSubtitle || ''}
            onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">رقم الواتساب (مع كود الدولة مثل 2010...)</label>
          <input
            type="text"
            dir="ltr"
            value={form.whatsappNumber || ''}
            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">تعليمات الدفع والتحويل</label>
          <input
            type="text"
            value={form.paymentInstructions || ''}
            onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-1">نص الشريط الترويجي العلوي</label>
          <input
            type="text"
            value={form.promoBannerText || ''}
            onChange={(e) => setForm({ ...form, promoBannerText: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
        </div>
      </div>

      {/* Empty Catalog / Section Announcement Customization */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div>
          <h4 className="font-black text-slate-900">تخصيص رسالة وصورة القسم الفارغ (عند عدم وجود مذكرات في القسم بعد)</h4>
          <p className="text-[11px] text-slate-500">
            تحكم فيما يظهر للزائر من عنوان ونص وصورة إعلانية عندما يفتح قسمًا لم تُضف فيه مذكرات بعد
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">العنوان الرئيسي عند خلو القسم</label>
              <input
                type="text"
                value={form.emptyCatalogTitle ?? ''}
                onChange={(e) => setForm({ ...form, emptyCatalogTitle: e.target.value })}
                placeholder="مثال: جاري تجهيز مذكرات هذا القسم قريبًا!"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">نص زر الحجز أو الطلب المسبق</label>
              <input
                type="text"
                value={form.emptyCatalogButtonText ?? ''}
                onChange={(e) => setForm({ ...form, emptyCatalogButtonText: e.target.value })}
                placeholder="مثال: احجز مذكرتك مسبقًا الآن"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">النص التوضيحي أو الإعلاني</label>
            <textarea
              rows={2}
              value={form.emptyCatalogSubtitle ?? ''}
              onChange={(e) => setForm({ ...form, emptyCatalogSubtitle: e.target.value })}
              placeholder="اكتب الرسالة التي تريدها للزوار عندما يكون القسم فارغًا..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            />
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {form.emptyCatalogImage ? (
                <img
                  src={form.emptyCatalogImage}
                  alt="صورة القسم الفارغ"
                  className="w-16 h-12 rounded-lg object-cover border border-slate-200"
                />
              ) : (
                <div className="w-16 h-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                  بدون صورة
                </div>
              )}
              <div>
                <p className="text-xs font-extrabold text-slate-800">صورة أو بانر يظهر عند خلو القسم (اختياري)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload('emptyCatalogImage', e)}
                  className="text-[11px] text-slate-600 mt-1"
                />
              </div>
            </div>
            {form.emptyCatalogImage && (
              <button
                type="button"
                onClick={() => setForm({ ...form, emptyCatalogImage: '' })}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                حذف الصورة
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full Home Page Layout & Visibility Controller */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div>
          <h4 className="font-black text-slate-900">التحكم الكامل في تخطيط الصفحة الرئيسية وترتيب أقسامها</h4>
          <p className="text-[11px] text-slate-500">
            تحكم في إظهار أو إخفاء أي قسم في الصفحة الرئيسية، وأعد ترتيب أماكن ظهورها للأعلى أو للأسفل كما تشاء
          </p>
        </div>

        <div className="space-y-2.5">
          {(Array.isArray(form.homeLayoutOrder) ? form.homeLayoutOrder : safeLayoutOrder).map((blockKey, idx, arr) => {
            const blockMeta = {
              hero: {
                title: '1. الواجهة الترحيبية الرئيسية (Hero Banner)',
                desc: 'القسم العلوي الكبير الذي يحتوي على العنوان الرئيسي وصورة الخلفية',
                toggleKey: 'showHeroSection'
              },
              sections: {
                title: '2. بطاقات الأقسام والمراحل الرئيسية',
                desc: 'بطاقات مذكرات الترم الأول والترم الثاني وكورسات التأسيس',
                toggleKey: 'showHomeSections'
              },
              about: {
                title: '3. قسم التعريف بالمنصة ومميزاتها',
                desc: 'بطاقة لماذا يختار المعلمون المنصة والمميزات الأربع',
                toggleKey: 'showAboutSection'
              },
              featured: {
                title: '4. قسم أحدث المذكرات المتاحة',
                desc: 'شبكة عرض أحدث المذكرات في الصفحة الرئيسية',
                toggleKey: 'showFeaturedSection'
              }
            }[blockKey];

            if (!blockMeta) return null;
            const isVisible = form[blockMeta.toggleKey] !== false;

            return (
              <div
                key={blockKey}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs sm:text-sm font-black text-slate-900">{blockMeta.title}</p>
                  <p className="text-[11px] text-slate-500">{blockMeta.desc}</p>
                </div>

                <div className="flex items-center gap-2">
                  {blockKey === 'hero' && (
                    <label className="flex items-center gap-1.5 text-[11px] font-bold bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showHeroTrustBox !== false}
                        onChange={(e) => setForm({ ...form, showHeroTrustBox: e.target.checked })}
                        className="accent-blue-700"
                      />
                      <span>بطاقة «لماذا يثق بنا المعلمون»</span>
                    </label>
                  )}

                  {blockKey === 'featured' && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-xl">
                      <span>العدد:</span>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={form.featuredCount || 6}
                        onChange={(e) => setForm({ ...form, featuredCount: Number(e.target.value) })}
                        className="w-12 text-center font-black text-blue-700 outline-none"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-1.5 text-xs font-extrabold bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => setForm({ ...form, [blockMeta.toggleKey]: e.target.checked })}
                      className="w-4 h-4 accent-blue-700"
                    />
                    <span className={isVisible ? 'text-emerald-700' : 'text-rose-600'}>
                      {isVisible ? 'ظاهر' : 'مخفي'}
                    </span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveLayoutBlock(idx, -1)}
                      title="نقل للأعلى"
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 disabled:opacity-35 text-slate-700 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === arr.length - 1}
                      onClick={() => moveLayoutBlock(idx, 1)}
                      title="نقل للأسفل"
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 disabled:opacity-35 text-slate-700 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manage Home Page Main Sections (Term 1, Term 2, Foundation Courses, etc.) */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-slate-900">إدارة بطاقات الأقسام الرئيسية وصور أغلفتها</h4>
            <p className="text-[11px] text-slate-500">
              ضع صورة غلاف لكل مرحلة/قسم، وعدّل النصوص، أو غيّر ترتيب البطاقات بالحذف والإضافة
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addHomeSection}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
            >
              + إضافة بطاقة قسم
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">عنوان قسم البطاقات في الرئيسية</label>
            <input
              type="text"
              value={form.homeSectionsTitle || ''}
              onChange={(e) => setForm({ ...form, homeSectionsTitle: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">الوصف الفرعي أسفل العنوان</label>
            <input
              type="text"
              value={form.homeSectionsSubtitle || ''}
              onChange={(e) => setForm({ ...form, homeSectionsSubtitle: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>
        </div>

        <div className="space-y-3">
          {(Array.isArray(form.homeSections) ? form.homeSections : safeHomeSections).map((sec, idx, arr) => (
            <div key={sec.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-blue-700">بطاقة رقم #{idx + 1}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveHomeSection(idx, -1)}
                    title="تقديم البطاقة"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === arr.length - 1}
                    onClick={() => moveHomeSection(idx, 1)}
                    title="تأخير البطاقة"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeHomeSection(idx)}
                    className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer mr-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>

              {/* Cover Image Upload & Preview for this Card */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {sec.coverImage ? (
                    <img
                      src={sec.coverImage}
                      alt={sec.title}
                      className="w-16 h-12 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                      بدون غلاف
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">صورة غلاف البطاقة / المرحلة</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSectionCoverUpload(idx, e)}
                      className="text-[11px] text-slate-600 mt-1"
                    />
                  </div>
                </div>
                {sec.coverImage && (
                  <button
                    type="button"
                    onClick={() => updateHomeSection(idx, { coverImage: '' })}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    إزالة الصورة
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={sec.title || ''}
                  onChange={(e) => updateHomeSection(idx, { title: e.target.value })}
                  placeholder="عنوان البطاقة (مثال: مذكرات الترم الأول)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                />
                <input
                  type="text"
                  value={sec.badge || ''}
                  onChange={(e) => updateHomeSection(idx, { badge: e.target.value })}
                  placeholder="شارة صغيرة (مثال: متاح الآن)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
                <select
                  value={sec.categoryId || ''}
                  onChange={(e) => updateHomeSection(idx, { categoryId: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="">عرض كل المذكرات عند الضغط</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>ربط بتصنيف: {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={sec.description || ''}
                  onChange={(e) => updateHomeSection(idx, { description: e.target.value })}
                  placeholder="وصف البطاقة..."
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
                <input
                  type="text"
                  value={sec.buttonText || ''}
                  onChange={(e) => updateHomeSection(idx, { buttonText: e.target.value })}
                  placeholder="نص الرابط (مثال: تصفح القسم)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notices Control in Notebook Details Page */}
      <div className="border-t border-slate-200 pt-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-slate-900">التنبيهات الهامة داخل صفحة كل مذكرة</h4>
            <p className="text-[11px] text-slate-500">تظهر هذه التنبيهات للزائر عند فتح صفحة تفاصيل ومعاينة أي مذكرة (كل سطر يمثل تنبيهًا)</p>
          </div>
          <label className="flex items-center gap-2 text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={form.showNotices !== false}
              onChange={(e) => setForm({ ...form, showNotices: e.target.checked })}
              className="w-4 h-4 accent-amber-600"
            />
            <span>{form.showNotices !== false ? 'إظهار التنبيهات' : 'إخفاء التنبيهات'}</span>
          </label>
        </div>

        <textarea
          rows={3}
          value={Array.isArray(form.notices) ? form.notices.join('\n') : ''}
          onChange={(e) =>
            setForm({
              ...form,
              notices: e.target.value.split('\n').filter((line) => line.trim() !== '')
            })
          }
          placeholder="اكتب كل تنبيه في سطر مستقل..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
        />
      </div>

      {/* Customizable Order Form Fields */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-slate-900">تخصيص حقول نموذج الطلب وترتيب أماكنها</h4>
            <p className="text-[11px] text-slate-500">استخدم أسهم الأعلى والأسفل لتغيير ترتيب ظهور الحقول للعميل</p>
          </div>
          <button
            type="button"
            onClick={addOrderField}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
          >
            + إضافة حقل جديد
          </button>
        </div>

        {/* Toggle & Position for Teacher Logo Upload Field */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-slate-900">حقل رفع شعار المعلم أو السنتر</p>
            <p className="text-[11px] text-slate-600">التحكم في إظهار أو إخفاء خانة رفع الشعار ومكان ظهورها في النموذج</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {form.allowTeacherLogo !== false && (
              <select
                value={form.teacherLogoPosition || 'bottom'}
                onChange={(e) => setForm({ ...form, teacherLogoPosition: e.target.value })}
                className="px-3 py-1.5 rounded-xl border border-blue-200 bg-white text-xs font-bold text-slate-700"
              >
                <option value="bottom">المكان: أسفل الحقول</option>
                <option value="top">المكان: أعلى النموذج</option>
              </select>
            )}
            <label className="flex items-center gap-2 text-xs font-extrabold text-blue-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.allowTeacherLogo !== false}
                onChange={(e) => setForm({ ...form, allowTeacherLogo: e.target.checked })}
                className="w-4 h-4 accent-blue-700"
              />
              <span>{form.allowTeacherLogo !== false ? 'ظاهر في النموذج' : 'مخفي'}</span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {(Array.isArray(form.orderFormFields) ? form.orderFormFields : safeOrderFields).map((field, idx, arr) => (
            <div key={field.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={field.label || ''}
                  onChange={(e) => updateOrderField(idx, { label: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                />
              </div>
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={field.placeholder || ''}
                  onChange={(e) => updateOrderField(idx, { placeholder: e.target.value })}
                  placeholder="النص التوضيحي..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
              <div className="sm:col-span-4 flex flex-wrap items-center justify-end gap-2.5 text-xs font-bold">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveOrderField(idx, -1)}
                    title="نقل الحقل للأعلى"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 disabled:opacity-35 text-slate-700 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === arr.length - 1}
                    onClick={() => moveOrderField(idx, 1)}
                    title="نقل الحقل للأسفل"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 disabled:opacity-35 text-slate-700 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(field.visible)}
                    onChange={(e) => updateOrderField(idx, { visible: e.target.checked })}
                  />
                  <span>إظهار</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(field.required)}
                    onChange={(e) => updateOrderField(idx, { required: e.target.checked })}
                  />
                  <span>إلزامي</span>
                </label>
                {String(field.id || '').startsWith('custom_') && (
                  <button
                    type="button"
                    onClick={() => removeOrderField(idx)}
                    className="text-rose-600 hover:text-rose-700 cursor-pointer"
                    title="حذف الحقل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-4 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black text-sm shadow-lg cursor-pointer"
      >
        حفظ جميع الإعدادات ومزامنتها مع السحابة
      </button>

      {/* Local Backup & Restore on Admin Device */}
      <div className="border-t border-slate-200 pt-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900">النسخ الاحتياطي والاستعادة على جهازك (JSON)</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              احفظ نسخة كاملة من جميع مذكراتك وإعداداتك وطلباتك في ملف واحد على جهازك للرجوع إليه في أي وقت
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onExportBackup}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>تنزيل نسخة احتياطية على جهازي</span>
            </button>

            <label className="flex items-center gap-1.5 bg-white hover:bg-blue-50 border border-slate-300 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer">
              <Upload className="w-4 h-4 text-blue-700" />
              <span>استعادة نسخة من جهازي</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || !onImportBackup) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const parsed = JSON.parse(ev.target.result);
                      onImportBackup(parsed);
                    } catch {
                      alert('ملف النسخة الاحتياطية غير صالح');
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}

/**
 * ============================================================================
 * ADMIN AUTH GATE COMPONENT (FIREBASE EMAIL / PASSWORD + PASSWORD RESET)
 * ============================================================================
 */
function AdminAuthGate({ auth, onBack, showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      showToast('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    if (!auth) {
      showToast('خطأ في الاتصال بخدمة المصادقة');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      showToast('تم تسجيل الدخول إلى لوحة التحكم بنجاح');
    } catch (error) {
      const code = error?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        showToast('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (code === 'auth/too-many-requests') {
        showToast('تم حظر المحاولات مؤقتًا لكثرة المحاولات الخاطئة، حاول لاحقًا');
      } else {
        showToast(`تعذر تسجيل الدخول: ${code || 'يرجى المحاولة مرة أخرى'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      showToast('اكتب بريدك الإلكتروني أولًا في الخانة بالأعلى ثم اضغط نسيت كلمة المرور');
      return;
    }
    if (!auth) {
      showToast('خطأ في الاتصال بخدمة المصادقة');
      return;
    }
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      showToast('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح');
    } catch (error) {
      const code = error?.code || '';
      if (code === 'auth/user-not-found') {
        showToast('هذا البريد غير مسجل كمدير في النظام');
      } else {
        showToast(`تعذر إرسال رابط الاستعادة: ${code || 'تأكد من صحة البريد'}`);
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-700/20">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 text-center">تسجيل دخول الإدارة</h2>
        <p className="text-sm text-slate-500 text-center mt-1 mb-6">
          أدخل البريد الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">البريد الإلكتروني للمدير</label>
            <input
              type="email"
              dir="ltr"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none text-left"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold text-slate-700">كلمة المرور</label>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetPassword}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline disabled:opacity-50 cursor-pointer"
              >
                {isResetting ? 'جاري الإرسال...' : 'نسيت كلمة المرور؟'}
              </button>
            </div>
            <input
              type="password"
              dir="ltr"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none text-left"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-extrabold transition shadow-lg shadow-blue-700/25 cursor-pointer"
          >
            {isLoading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          className="w-full mt-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          ← العودة إلى واجهة الموقع
        </button>
      </div>
    </div>
  );
}
