import React, { useState, useEffect, useMemo, useRef, Component } from 'react';
import {
  BookOpen,
  Search,
  ShoppingCart,
  ShieldCheck,
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  Upload,
  Eye,
  X,
  Plus,
  Trash2,
  Edit3,
  Tag,
  Lock,
  Unlock,
  LogOut,
  Save,
  Layers,
  Award,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Cloud,
  CloudOff,
  Mail,
  KeyRound,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Layout,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
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
  onSnapshot,
  getDoc
} from 'firebase/firestore';

// ============================================================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ============================================================================
const firebaseConfig =
  typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : {
        apiKey: 'AIzaSyBs5uL3J0mQ2p7W9nX4vR8tY6kL1cM0dE9',
        authDomain: 'el3bakera-edu.firebaseapp.com',
        projectId: 'el3bakera-edu',
        storageBucket: 'el3bakera-edu.firebasestorage.app',
        messagingSenderId: '1049283746512',
        appId: '1:1049283746512:web:8f9a0b1c2d3e4f5a6b7c8d'
      };

const appId = typeof __app_id !== 'undefined' ? __app_id : 'muzakkirati-edu-app';

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  console.error('Firebase Init Error:', err);
}

const getPublicCollectionRef = (colName) =>
  collection(db, 'artifacts', appId, 'public', 'data', colName);

const getPublicDocRef = (colName, docId) =>
  doc(db, 'artifacts', appId, 'public', 'data', colName, docId);

// ============================================================================
// ERROR BOUNDARY (PREVENTS WHITE SCREEN CRASHES)
// ============================================================================
class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'حدث خطأ غير متوقع في الواجهة' };
  }

  componentDidCatch(error, info) {
    console.error('UI Boundary Caught Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center"
        >
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">حدث خطأ مؤقت في عرض الصفحة</h2>
            <p className="text-xs text-slate-500 leading-relaxed">{this.state.errorMsg}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMsg: '' });
                if (this.props.onReset) this.props.onReset();
              }}
              className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-sm cursor-pointer"
            >
              إعادة تحميل الواجهة بأمان
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// DEFAULT DATA & CONFIGURATION
// ============================================================================
const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة للمذكرات التعليمية',
  tagline: 'مذكرات دراسية احترافية مخصصة باسمك وبياناتك الخاصة.',
  logoImage: '',
  logoSize: 56,
  heroBgImage: '',
  heroBgOpacity: 45,
  heroBgFit: 'cover',
  heroOverlayColor: '#020617',
  heroOverlayOpacity: 75,
  heroMinHeight: 540,
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة اسم المعلم، رقم الهاتف، والشعار الخاص به على الغلاف وجميع الصفحات.',
  whatsappNumber: '201068481536',
  supportPhone: '01068481536',
  email: 'info@el3bakera-edu.com',
  socialLinks: [
    {
      id: 'soc-fb',
      label: 'صفحة الفيسبوك',
      url: 'https://www.facebook.com/profile.php?id=100095504234877',
      color: 'blue'
    },
    {
      id: 'soc-wa-group',
      label: 'جروب الواتساب',
      url: 'https://chat.whatsapp.com/G4Un9TF4oSz0P2z32iNw6a',
      color: 'emerald'
    }
  ],
  paymentInstructions: 'فودافون كاش / إنستاباي: 01068481536',
  promoBannerText: '🎉 عرض خاص للمعلمين: خصم 15% على جميع مذكرات الترم الأول + إضافة الشعار مجانًا لفترة محدودة!',
  showNotices: true,
  notices: [
    'التسليم بصيغة PDF جاهزة للطباعة الفورية بأعلى جودة ودقة (300 DPI).',
    'يتم تخصيص الغلاف والفريم الداخلي لجميع الصفحات باسم المعلم ورقم هاتفه وشعاره الخاص.',
    'يرجى مراجعة عينة الصفحات قبل تأكيد الطلب لضمان مطابقة التنسيق لرغبتك.'
  ],
  showLogoUploadField: true,
  logoFieldPosition: 'top',
  emptyCatalogTitle: 'جاري تجهيز أحدث المذكرات لهذا القسم قريبًا!',
  emptyCatalogSubtitle:
    'نعمل حاليًا على تنسيق ومراجعة مذكرات هذا القسم بأعلى جودة. يمكنك حجز مذكرتك مسبقًا أو التواصل معنا.',
  emptyCatalogImage: '',
  emptyCatalogBtnText: 'اطلب تجهيز مذكرتك الآن',
  showHeroSection: true,
  showHeroTrustCard: true,
  showHeroCustomBtn: true,
  showHomeSectionsBlock: true,
  showAboutSection: true,
  showFeaturedSection: true,
  featuredCount: 6,
  homeLayoutOrder: ['hero', 'sections', 'about', 'featured'],
  homeSections: [
    {
      id: 'sec-term1',
      title: 'مذكرات الترم الأول',
      subtitle: 'مذكرات شرح وتدريبات شاملة لجميع المواد والمراحل الدراسية للفصل الدراسي الأول.',
      badge: 'متاح الآن',
      filterCategory: 'مذكرات الترم الأول',
      accent: 'blue',
      btnText: 'تصفح مذكرات الترم الأول',
      coverImage: ''
    },
    {
      id: 'sec-term2',
      title: 'مذكرات الترم الثاني',
      subtitle: 'مذكرات محدثة ومنسقة للفصل الدراسي الثاني جاهزة للطباعة باسمك وشعارك الخاص.',
      badge: 'محدّث',
      filterCategory: 'مذكرات الترم الثاني',
      accent: 'emerald',
      btnText: 'تصفح مذكرات الترم الثاني',
      coverImage: ''
    },
    {
      id: 'sec-foundation',
      title: 'كورسات التأسيس',
      subtitle: 'سلاسل تأسيس احترافية لبناء مهارات الطلاب في القراءة والكتابة والقواعد والرياضيات.',
      badge: 'تأسيس شامل',
      filterCategory: 'كورسات التأسيس',
      accent: 'amber',
      btnText: 'استعرض كورسات التأسيس',
      coverImage: ''
    }
  ],
  orderFormFields: [
    {
      id: 'teacherName',
      label: 'اسم المعلم كما سيُكتب على المذكرة',
      placeholder: 'مثال: أ/ محمود شحاته',
      type: 'text',
      required: true,
      enabled: true,
      isCore: true
    },
    {
      id: 'centerOrNotebookTitle',
      label: 'اسم السنتر أو عنوان المذكرة في الفريم',
      placeholder: 'مثال: سنتر النور التعليمي - المحلة الكبرى',
      type: 'text',
      required: true,
      enabled: true,
      isCore: true
    },
    {
      id: 'phonePrimary',
      label: 'رقم الهاتف الأساسي (واتساب)',
      placeholder: '010XXXXXXXX',
      type: 'tel',
      required: true,
      enabled: true,
      isCore: true
    },
    {
      id: 'phoneSecondary',
      label: 'رقم الهاتف الثاني كما سيُكتب في الفريم (إن وُجد)',
      placeholder: '010XXXXXXXX',
      type: 'tel',
      required: false,
      enabled: true,
      isCore: true
    },
    {
      id: 'notes',
      label: 'ملاحظات إضافية للتخصيص',
      placeholder: 'أي تفاصيل إضافية حول الألوان أو العناوين...',
      type: 'textarea',
      required: false,
      enabled: true,
      isCore: true
    }
  ]
};

const DEFAULT_STRUCTURE = {
  categories: ['مذكرات الترم الأول', 'مذكرات الترم الثاني', 'كورسات التأسيس', 'مراجعات نهائية'],
  stages: ['المرحلة الابتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية', 'التأسيس العام'],
  grades: [
    'الصف الرابع الابتدائي',
    'الصف الخامس الابتدائي',
    'الصف السادس الابتدائي',
    'الصف الأول الإعدادي',
    'الصف الثاني الإعدادي',
    'الصف الثالث الإعدادي',
    'الصف الأول الثانوي',
    'الصف الثاني الثانوي',
    'الصف الثالث الثانوي'
  ],
  subjects: ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'الفيزياء', 'الكيمياء']
};

const SAMPLE_NOTEBOOKS = [
  {
    id: 'nb-sample-1',
    title: 'سلسلة العباقرة في اللغة العربية - الترم الأول',
    category: 'مذكرات الترم الأول',
    stage: 'المرحلة الإعدادية',
    grade: 'الصف الثالث الإعدادي',
    subject: 'اللغة العربية',
    price: 150,
    oldPrice: 200,
    pagesCount: 112,
    badge: 'الأكثر طلبًا',
    description:
      'مذكرة شرح وتدريبات متكاملة تشمل النحو والقراءة والنصوص والقصة مع بنك أسئلة شامل وامتحانات المحافظات، جاهزة لإضافة اسمك ورقم هاتفك وشعارك على الغلاف وجميع الصفحات.',
    coverImage: '',
    sampleImages: [],
    sampleCount: 0,
    drivePreviewUrl: '',
    isComingSoon: false,
    comingSoonText: '',
    createdAt: Date.now()
  }
];

const DEFAULT_COUPONS = [
  {
    id: 'cp-welcome',
    code: 'WELCOME15',
    discountPercent: 15,
    description: 'خصم 15% ترحيبي للمعلمين الجدد',
    active: true
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function normalizeExternalUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getYoutubeEmbedUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(normalizeExternalUrl(url));
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${u.pathname.replace('/', '')}`;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
  } catch {
    return '';
  }
  return '';
}

function compressImageFile(file, maxWidth = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
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
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl, maxWidth = 900, quality = 0.75) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl || '');
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
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function getUtf8ByteSize(obj) {
  try {
    return new TextEncoder().encode(JSON.stringify(obj)).length;
  } catch {
    return JSON.stringify(obj).length * 2;
  }
}

async function fitDocumentToCloudLimit(obj, maxBytes = 860000) {
  const clone = JSON.parse(JSON.stringify(obj));
  if (getUtf8ByteSize(clone) <= maxBytes) return clone;

  if (clone.coverImage && clone.coverImage.startsWith('data:image')) {
    clone.coverImage = await compressDataUrl(clone.coverImage, 850, 0.72);
  }
  if (clone.heroBgImage && clone.heroBgImage.startsWith('data:image')) {
    clone.heroBgImage = await compressDataUrl(clone.heroBgImage, 1100, 0.72);
  }
  if (clone.emptyCatalogImage && clone.emptyCatalogImage.startsWith('data:image')) {
    clone.emptyCatalogImage = await compressDataUrl(clone.emptyCatalogImage, 850, 0.72);
  }
  if (Array.isArray(clone.homeSections)) {
    for (let i = 0; i < clone.homeSections.length; i += 1) {
      if (clone.homeSections[i]?.coverImage?.startsWith('data:image')) {
        clone.homeSections[i].coverImage = await compressDataUrl(clone.homeSections[i].coverImage, 750, 0.7);
      }
    }
  }
  return clone;
}

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [catalogFilters, setCatalogFilters] = useState({
    search: '',
    category: 'all',
    stage: 'all',
    grade: 'all',
    subject: 'all'
  });

  // Persistent States (Local + Cloud Sync)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_settings_v4');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [structure, setStructure] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_structure_v4');
      if (saved) return { ...DEFAULT_STRUCTURE, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_STRUCTURE;
  });

  const [notebooks, setNotebooks] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_notebooks_v4');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SAMPLE_NOTEBOOKS;
  });

  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_coupons_v4');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_COUPONS;
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_orders_v4');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Cloud & Admin Auth States
  const [cloudStatus, setCloudStatus] = useState('connecting');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);

  // Modals State
  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [orderNotebook, setOrderNotebook] = useState(null);
  const [isCustomOrderModal, setIsCustomOrderModal] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const isAdminAuthenticated = Boolean(firebaseUser && !firebaseUser.isAnonymous);

  // Secret Access Triggers (#admin, ?admin=1, Ctrl+Shift+L, 5 Logo Clicks)
  useEffect(() => {
    const checkUrlAdmin = () => {
      if (
        window.location.hash === '#admin' ||
        new URLSearchParams(window.location.search).get('admin') === '1'
      ) {
        setShowAdminPortal(true);
      }
    };
    checkUrlAdmin();
    window.addEventListener('hashchange', checkUrlAdmin);

    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        setShowAdminPortal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkUrlAdmin);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSecretLogoClick = () => {
    const next = logoTapCount + 1;
    if (next >= 5) {
      setLogoTapCount(0);
      setShowAdminPortal(true);
      showToast('تم فتح بوابة الإدارة السرية');
    } else {
      setLogoTapCount(next);
      setTimeout(() => setLogoTapCount(0), 2500);
    }
  };

  // Firebase Auth & Real-Time Firestore Listeners
  useEffect(() => {
    if (!auth || !db) {
      setCloudStatus('offline');
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });

    const unsubSettings = onSnapshot(
      getPublicDocRef('config', 'settings'),
      (snap) => {
        setCloudStatus('connected');
        if (snap.exists()) {
          const merged = { ...DEFAULT_SETTINGS, ...snap.data() };
          setSettings(merged);
          try {
            localStorage.setItem('muzakkirati_settings_v4', JSON.stringify(merged));
          } catch {}
        }
      },
      () => setCloudStatus('offline')
    );

    const unsubStructure = onSnapshot(
      getPublicDocRef('config', 'structure'),
      (snap) => {
        if (snap.exists()) {
          const merged = { ...DEFAULT_STRUCTURE, ...snap.data() };
          setStructure(merged);
          try {
            localStorage.setItem('muzakkirati_structure_v4', JSON.stringify(merged));
          } catch {}
        }
      },
      () => {}
    );

    const unsubNotebooks = onSnapshot(
      getPublicCollectionRef('notebooks'),
      (snap) => {
        setCloudStatus('connected');
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setNotebooks(list);
          try {
            localStorage.setItem('muzakkirati_notebooks_v4', JSON.stringify(list));
          } catch {}
        }
      },
      () => setCloudStatus('offline')
    );

    const unsubCoupons = onSnapshot(
      getPublicCollectionRef('coupons'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCoupons(list);
          try {
            localStorage.setItem('muzakkirati_coupons_v4', JSON.stringify(list));
          } catch {}
        }
      },
      () => {}
    );

    const unsubOrders = onSnapshot(
      getPublicCollectionRef('orders'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOrders(list);
        try {
          localStorage.setItem('muzakkirati_orders_v4', JSON.stringify(list));
        } catch {}
      },
      () => {}
    );

    return () => {
      unsubAuth();
      unsubSettings();
      unsubStructure();
      unsubNotebooks();
      unsubCoupons();
      unsubOrders();
    };
  }, []);

  // Cloud Save Helpers
  const saveSettings = async (newSettings) => {
    const fitted = await fitDocumentToCloudLimit(newSettings, 860000);
    setSettings(fitted);
    try {
      localStorage.setItem('muzakkirati_settings_v4', JSON.stringify(fitted));
    } catch {}
    if (db) {
      try {
        await setDoc(getPublicDocRef('config', 'settings'), fitted);
        showToast('تم حفظ الإعدادات ومزامنتها مع السحابة بنجاح ✅');
      } catch (err) {
        showToast(`تم الحفظ محليًا — تعذرت المزامنة للسحابة: ${err.code || err.message}`, 'error');
      }
    }
  };

  const saveStructure = async (newStructure) => {
    setStructure(newStructure);
    try {
      localStorage.setItem('muzakkirati_structure_v4', JSON.stringify(newStructure));
    } catch {}
    if (db) {
      try {
        await setDoc(getPublicDocRef('config', 'structure'), newStructure);
        showToast('تم تحديث الأقسام والمراحل بنجاح ✅');
      } catch (err) {
        showToast(`تعذرت المزامنة للسحابة: ${err.code || err.message}`, 'error');
      }
    }
  };

  const handleSaveNotebook = async (nbData, hdSampleImages = null) => {
    // Store HD sample images in separate cloud docs so each page stays crisp HD without hitting 1MB doc limit
    const sampleCount = Array.isArray(hdSampleImages)
      ? hdSampleImages.length
      : Array.isArray(nbData.sampleImages)
      ? nbData.sampleImages.length
      : nbData.sampleCount || 0;

    const cleanNotebookDoc = {
      ...nbData,
      sampleImages: [], // Keep lightweight thumbnails/empty in main doc; HD pages live in notebook_samples
      sampleCount
    };

    const fittedDoc = await fitDocumentToCloudLimit(cleanNotebookDoc, 840000);

    // Update local state (with previewable samples in memory)
    const localWithSamples = {
      ...fittedDoc,
      sampleImages: Array.isArray(hdSampleImages) ? hdSampleImages : nbData.sampleImages || []
    };

    setNotebooks((prev) => {
      const exists = prev.some((n) => n.id === fittedDoc.id);
      const next = exists
        ? prev.map((n) => (n.id === fittedDoc.id ? localWithSamples : n))
        : [localWithSamples, ...prev];
      try {
        localStorage.setItem(
          'muzakkirati_notebooks_v4',
          JSON.stringify(next.map((item) => ({ ...item, sampleImages: [] })))
        );
      } catch {}
      return next;
    });

    if (db) {
      try {
        await setDoc(getPublicDocRef('notebooks', fittedDoc.id), fittedDoc);

        if (Array.isArray(hdSampleImages)) {
          for (let i = 0; i < hdSampleImages.length; i += 1) {
            const pageData = await compressDataUrl(hdSampleImages[i], 1280, 0.85);
            await setDoc(getPublicDocRef('notebook_samples', `${fittedDoc.id}_page_${i}`), {
              notebookId: fittedDoc.id,
              pageIndex: i,
              imageData: pageData
            });
          }
          // Clean up any extra old pages if count decreased
          for (let j = hdSampleImages.length; j < 20; j += 1) {
            try {
              await deleteDoc(getPublicDocRef('notebook_samples', `${fittedDoc.id}_page_${j}`));
            } catch {}
          }
        }

        showToast('تم حفظ المذكرة وصور العينات عالية الدقة في السحابة بنجاح ✅');
      } catch (err) {
        showToast(`تعذر رفع المذكرة للسحابة: ${err.code || err.message}`, 'error');
      }
    }
  };

  const handleDeleteNotebook = async (id) => {
    setNotebooks((prev) => {
      const next = prev.filter((n) => n.id !== id);
      try {
        localStorage.setItem('muzakkirati_notebooks_v4', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (db) {
      try {
        await deleteDoc(getPublicDocRef('notebooks', id));
        for (let i = 0; i < 20; i += 1) {
          try {
            await deleteDoc(getPublicDocRef('notebook_samples', `${id}_page_${i}`));
          } catch {}
        }
        showToast('تم حذف المذكرة نهائيًا');
      } catch (err) {
        showToast(`تعذر الحذف من السحابة: ${err.code || err.message}`, 'error');
      }
    }
  };

  const handleSaveCoupon = async (cp) => {
    setCoupons((prev) => {
      const exists = prev.some((c) => c.id === cp.id);
      const next = exists ? prev.map((c) => (c.id === cp.id ? cp : c)) : [cp, ...prev];
      try {
        localStorage.setItem('muzakkirati_coupons_v4', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (db) {
      try {
        await setDoc(getPublicDocRef('coupons', cp.id), cp);
        showToast('تم حفظ كود الخصم في السحابة ✅');
      } catch (err) {
        showToast(`خطأ في حفظ الكوبون: ${err.code || err.message}`, 'error');
      }
    }
  };

  const handleDeleteCoupon = async (id) => {
    setCoupons((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem('muzakkirati_coupons_v4', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (db) {
      try {
        await deleteDoc(getPublicDocRef('coupons', id));
        showToast('تم حذف كود الخصم');
      } catch {}
    }
  };

  const handleCreateOrder = async (orderObj) => {
    setOrders((prev) => {
      const next = [orderObj, ...prev];
      try {
        localStorage.setItem('muzakkirati_orders_v4', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (db) {
      try {
        const fittedOrder = await fitDocumentToCloudLimit(orderObj, 820000);
        await setDoc(getPublicDocRef('orders', orderObj.id), fittedOrder);
      } catch (err) {
        console.error('Order cloud save error:', err);
      }
    }
  };

  const handleUpdateOrder = async (orderId, patch) => {
    setOrders((prev) => {
      const next = prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o));
      try {
        localStorage.setItem('muzakkirati_orders_v4', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (db) {
      try {
        const target = orders.find((o) => o.id === orderId);
        if (target) {
          await setDoc(getPublicDocRef('orders', orderId), { ...target, ...patch });
          showToast('تم تحديث حالة الطلب ✅');
        }
      } catch (err) {
        showToast(`تعذر تحديث الطلب: ${err.code || err.message}`, 'error');
      }
    }
  };

  const handleDeleteOrder = async (orderId) => {
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== orderId);
      try {
        localStorage.setItem('muzakkirati_orders_v4', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (db) {
      try {
        await deleteDoc(getPublicDocRef('orders', orderId));
        showToast('تم حذف الطلب بنجاح');
      } catch (err) {
        showToast(`تعذر حذف الطلب: ${err.code || err.message}`, 'error');
      }
    }
  };

  const handleSyncAllToCloud = async () => {
    if (!db) {
      showToast('الاتصال بالسحابة غير متاح حاليًا', 'error');
      return;
    }
    try {
      const fittedSettings = await fitDocumentToCloudLimit(settings, 860000);
      await setDoc(getPublicDocRef('config', 'settings'), fittedSettings);
      await setDoc(getPublicDocRef('config', 'structure'), structure);
      for (const nb of notebooks) {
        const fittedNb = await fitDocumentToCloudLimit(
          { ...nb, sampleImages: [], sampleCount: nb.sampleCount || (nb.sampleImages || []).length },
          840000
        );
        await setDoc(getPublicDocRef('notebooks', nb.id), fittedNb);
      }
      for (const cp of coupons) {
        await setDoc(getPublicDocRef('coupons', cp.id), cp);
      }
      showToast('تمت مزامنة جميع البيانات والإعدادات للسحابة بنجاح ✅');
    } catch (err) {
      showToast(`خطأ أثناء المزامنة: ${err.code || err.message}`, 'error');
    }
  };

  const navigateToCatalogWithCategory = (categoryName) => {
    setCatalogFilters({
      search: '',
      category: categoryName || 'all',
      stage: 'all',
      grade: 'all',
      subject: 'all'
    });
    setActiveTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const whatsappDirectUrl = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`
    : '#';

  return (
    <AppErrorBoundary onReset={() => setActiveTab('home')}>
      <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
        {/* Global Toast */}
        {toast && (
          <div className="fixed bottom-5 left-5 z-[120] max-w-sm animate-bounce">
            <div
              className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-extrabold flex items-center gap-2.5 ${
                toast.type === 'error'
                  ? 'bg-rose-950 text-white border-rose-700'
                  : 'bg-slate-900 text-white border-slate-700'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${toast.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}
              />
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Top Promo Banner */}
        {settings.promoBannerText && (
          <div className="bg-slate-950 text-white text-xs py-2.5 px-4 text-center border-b border-slate-800">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3">
              <span className="font-bold text-amber-300">{settings.promoBannerText}</span>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] transition cursor-pointer"
              >
                استفد من العرض ←
              </button>
            </div>
          </div>
        )}

        {/* Main Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
            {/* Brand & Secret Admin Trigger */}
            <div
              onClick={handleSecretLogoClick}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              {settings.logoImage ? (
                <img
                  src={settings.logoImage}
                  alt={settings.platformName}
                  style={{
                    width: `${Math.min(Math.max(Number(settings.logoSize) || 56, 40), 115)}px`,
                    height: `${Math.min(Math.max(Number(settings.logoSize) || 56, 40), 115)}px`
                  }}
                  className="rounded-2xl object-contain bg-white border border-slate-200 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center shadow-md shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight group-hover:text-blue-700 transition">
                  {settings.platformName}
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">{settings.tagline}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70">
              {[
                { id: 'home', label: 'الرئيسية' },
                { id: 'catalog', label: 'المذكرات' },
                { id: 'offers', label: 'العروض والباقات' },
                { id: 'track', label: 'تتبع طلبك' },
                { id: 'contact', label: 'اتصل بنا' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2">
              {settings.whatsappNumber && (
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>واتساب</span>
                </a>
              )}

              {/* Admin Button ONLY visible when admin is logged in */}
              {isAdminAuthenticated && (
                <button
                  type="button"
                  onClick={() => setShowAdminPortal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>لوحة التحكم</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation Bar */}
          <div className="flex md:hidden items-center justify-around border-t border-slate-100 bg-white px-2 py-1.5 overflow-x-auto">
            {[
              { id: 'home', label: 'الرئيسية' },
              { id: 'catalog', label: 'المذكرات' },
              { id: 'offers', label: 'العروض' },
              { id: 'track', label: 'تتبع طلبك' },
              { id: 'contact', label: 'اتصل بنا' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                  activeTab === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        {/* Main Content Switcher */}
        <main className="flex-1">
          {activeTab === 'home' && (
            <HomePage
              settings={settings}
              notebooks={notebooks}
              onBrowseCatalog={() => setActiveTab('catalog')}
              onSelectCategory={navigateToCatalogWithCategory}
              onPreviewNotebook={(nb) => setPreviewNotebook(nb)}
              onOrderNotebook={(nb) => setOrderNotebook(nb)}
              onOpenCustomOrder={() => setIsCustomOrderModal(true)}
              onContact={() => setActiveTab('contact')}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogPage
              settings={settings}
              structure={structure}
              notebooks={notebooks}
              filters={catalogFilters}
              setFilters={setCatalogFilters}
              onPreviewNotebook={(nb) => setPreviewNotebook(nb)}
              onOrderNotebook={(nb) => setOrderNotebook(nb)}
              onOpenCustomOrder={() => setIsCustomOrderModal(true)}
            />
          )}

          {activeTab === 'offers' && (
            <OffersPage
              coupons={coupons}
              notebooks={notebooks}
              onOrderNotebook={(nb) => setOrderNotebook(nb)}
              onPreviewNotebook={(nb) => setPreviewNotebook(nb)}
              onCopyCode={(code) => {
                navigator.clipboard?.writeText(code);
                showToast(`تم نسخ كود الخصم: ${code}`);
              }}
            />
          )}

          {activeTab === 'track' && <TrackOrderPage orders={orders} settings={settings} />}

          {activeTab === 'contact' && <ContactPage settings={settings} />}
        </main>

        {/* Footer */}
        <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="font-black text-base">{settings.platformName}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{settings.tagline}</p>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-sm font-black text-white">روابط سريعة</h4>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab('catalog')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    تصفح جميع المذكرات
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab('offers')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    العروض وكوبونات الخصم
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab('track')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    متابعة حالة الطلب
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsCustomOrderModal(true)}
                    className="hover:text-white transition cursor-pointer"
                  >
                    طلب إعداد مذكرة خاصة
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-sm font-black text-white">تواصل معنا</h4>
              <div className="space-y-1.5 text-xs">
                {settings.supportPhone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span dir="ltr">{settings.supportPhone}</span>
                  </p>
                )}
                {settings.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span dir="ltr">{settings.email}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {(Array.isArray(settings.socialLinks) ? settings.socialLinks : []).map((soc, idx) => {
                  const href = normalizeExternalUrl(soc.url);
                  if (!href || !soc.label) return null;
                  const hoverClass =
                    {
                      blue: 'hover:bg-blue-600',
                      emerald: 'hover:bg-emerald-600',
                      sky: 'hover:bg-sky-600',
                      rose: 'hover:bg-rose-600',
                      slate: 'hover:bg-slate-700'
                    }[soc.color] || 'hover:bg-blue-600';
                  return (
                    <a
                      key={soc.id || idx}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3 py-1.5 rounded-lg bg-slate-900 ${hoverClass} text-xs font-bold text-white transition`}
                    >
                      {soc.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 py-4 px-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
            <span>© {new Date().getFullYear()} {settings.platformName}. جميع الحقوق محفوظة.</span>
            <button
              type="button"
              onClick={() => setShowAdminPortal(true)}
              title="دخول الإدارة"
              className="text-slate-700 hover:text-slate-400 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>

        {/* Protected Notebook Details & HD Sample Preview Modal */}
        {previewNotebook && (
          <ProtectedPreviewModal
            notebook={previewNotebook}
            settings={settings}
            onClose={() => setPreviewNotebook(null)}
            onOrder={() => {
              const nb = previewNotebook;
              setPreviewNotebook(null);
              setOrderNotebook(nb);
            }}
          />
        )}

        {/* Order / Pre-order Modal */}
        {(orderNotebook || isCustomOrderModal) && (
          <OrderModal
            notebook={orderNotebook}
            isCustom={isCustomOrderModal}
            settings={settings}
            coupons={coupons}
            onClose={() => {
              setOrderNotebook(null);
              setIsCustomOrderModal(false);
            }}
            onSubmitOrder={handleCreateOrder}
            showToast={showToast}
          />
        )}

        {/* Admin Portal Modal (Login + Dashboard) */}
        {showAdminPortal && (
          <AdminPortal
            firebaseUser={firebaseUser}
            isAdminAuthenticated={isAdminAuthenticated}
            cloudStatus={cloudStatus}
            settings={settings}
            structure={structure}
            notebooks={notebooks}
            coupons={coupons}
            orders={orders}
            onClose={() => setShowAdminPortal(false)}
            onSaveSettings={saveSettings}
            onSaveStructure={saveStructure}
            onSaveNotebook={handleSaveNotebook}
            onDeleteNotebook={handleDeleteNotebook}
            onSaveCoupon={handleSaveCoupon}
            onDeleteCoupon={handleDeleteCoupon}
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDeleteOrder}
            onSyncAll={handleSyncAllToCloud}
            showToast={showToast}
          />
        )}
      </div>
    </AppErrorBoundary>
  );
}

// ============================================================================
// HOME PAGE COMPONENT (CUSTOMIZABLE LAYOUT & SECTIONS)
// ============================================================================
function HomePage({
  settings,
  notebooks,
  onBrowseCatalog,
  onSelectCategory,
  onPreviewNotebook,
  onOrderNotebook,
  onOpenCustomOrder,
  onContact
}) {
  const layoutOrder = useMemo(() => {
    const allowed = ['hero', 'sections', 'about', 'featured'];
    if (Array.isArray(settings.homeLayoutOrder) && settings.homeLayoutOrder.length > 0) {
      const valid = settings.homeLayoutOrder.filter((k) => allowed.includes(k));
      allowed.forEach((k) => {
        if (!valid.includes(k)) valid.push(k);
      });
      return valid;
    }
    return allowed;
  }, [settings.homeLayoutOrder]);

  const homeSections = Array.isArray(settings.homeSections) ? settings.homeSections : DEFAULT_SETTINGS.homeSections;
  const featuredLimit = Math.min(Math.max(Number(settings.featuredCount) || 6, 1), 18);

  const renderSectionBlock = (key) => {
    if (key === 'hero') {
      if (settings.showHeroSection === false) return null;
      return (
        <section
          key="hero"
          style={{ minHeight: `${Number(settings.heroMinHeight) || 540}px` }}
          className="relative overflow-hidden bg-slate-950 text-white flex items-center"
        >
          {/* Optional Custom Background Image */}
          {settings.heroBgImage && (
            <img
              src={settings.heroBgImage}
              alt="خلفية المنصة"
              style={{
                opacity: (Number(settings.heroBgOpacity ?? 45) / 100),
                objectFit: settings.heroBgFit || 'cover'
              }}
              className="absolute inset-0 w-full h-full pointer-events-none select-none"
            />
          )}

          {/* Customizable Overlay */}
          <div
            style={{
              backgroundColor: settings.heroOverlayColor || '#020617',
              opacity: (Number(settings.heroOverlayOpacity ?? 75) / 100)
            }}
            className="absolute inset-0 pointer-events-none"
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className={settings.showHeroTrustCard !== false ? 'lg:col-span-7 space-y-6' : 'lg:col-span-10 mx-auto text-center space-y-6'}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-extrabold">
                  <Sparkles className="w-4 h-4" />
                  <span>مذكرات منسقة وجاهزة للطباعة باسمك وشعارك الخاص</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
                  {settings.heroTitle}
                </h2>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                  {settings.heroSubtitle}
                </p>

                <div
                  className={`flex flex-wrap items-center gap-3 pt-2 ${
                    settings.showHeroTrustCard === false ? 'justify-center' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={onBrowseCatalog}
                    className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 transition cursor-pointer"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>استعرض المذكرات المتاحة</span>
                  </button>

                  {settings.showHeroCustomBtn !== false && (
                    <button
                      type="button"
                      onClick={onOpenCustomOrder}
                      className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-sm flex items-center gap-2 backdrop-blur-sm transition cursor-pointer"
                    >
                      <FileText className="w-5 h-5" />
                      <span>اطلب مذكرة خاصة</span>
                    </button>
                  )}
                </div>
              </div>

              {settings.showHeroTrustCard !== false && (
                <div className="lg:col-span-5">
                  <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-6 sm:p-7 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-amber-300">لماذا يثق بنا المعلمون؟</h3>
                      <Award className="w-5 h-5 text-amber-300" />
                    </div>
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-100">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>إضافة اسمك ورقم هاتفك وشعارك على الغلاف وجميع الصفحات</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>ملفات PDF فائقة الجودة جاهزة للطباعة الفورية</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>معاينة عينات حقيقية من المذكرة قبل تأكيد الطلب</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>تسليم سريع ومتابعة مباشرة لحالة طلبك خطوة بخطوة</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (key === 'sections') {
      if (settings.showHomeSectionsBlock === false || homeSections.length === 0) return null;
      const accentStyles = {
        blue: {
          iconBg: 'bg-blue-700 text-white',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          link: 'text-blue-700 hover:text-blue-800'
        },
        emerald: {
          iconBg: 'bg-emerald-700 text-white',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          link: 'text-emerald-700 hover:text-emerald-800'
        },
        amber: {
          iconBg: 'bg-orange-600 text-white',
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
          link: 'text-blue-700 hover:text-blue-800'
        },
        purple: {
          iconBg: 'bg-purple-700 text-white',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          link: 'text-purple-700 hover:text-purple-800'
        }
      };

      return (
        <section key="sections" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold">
              <Layers className="w-3.5 h-3.5" />
              <span>الأقسام الرئيسية</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              أقسام المذكرات والكورسات الرئيسية
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              اختر القسم المناسب لبدء تصفح المذكرات المنسقة والجاهزة باسمك وشعارك
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homeSections.map((sec, idx) => {
              const style = accentStyles[sec.accent] || accentStyles.blue;
              return (
                <div
                  key={sec.id || idx}
                  onClick={() => onSelectCategory(sec.filterCategory || sec.title)}
                  className="group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col cursor-pointer"
                >
                  {sec.coverImage ? (
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                      <img
                        src={sec.coverImage}
                        alt={sec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {sec.badge && (
                        <span
                          className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-sm ${style.badge}`}
                        >
                          {sec.badge}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 pb-0 flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${style.iconBg}`}>
                        <BookOpen className="w-6 h-6" />
                      </div>
                      {sec.badge && (
                        <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${style.badge}`}>
                          {sec.badge}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition">
                        {sec.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{sec.subtitle}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold">استعرض القسم</span>
                      <span className={`text-xs sm:text-sm font-black flex items-center gap-1 ${style.link}`}>
                        <span>{sec.btnText || `تصفح ${sec.title}`}</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (key === 'about') {
      if (settings.showAboutSection === false) return null;
      return (
        <section key="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>تعرف على منصتنا</span>
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
                لماذا يختار المعلمون {settings.platformName}؟
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                نحن منصة متخصصة في إعداد وتصميم المذكرات التعليمية الاحترافية للمعلمين في جميع المراحل الدراسية. نوفر لك محتوى علميًا منقحًا، وتنسيقًا عصريًا مريحًا للعين، مع تخصيص الغلاف والصفحات الداخلية باسمك ورقم هاتفك وشعارك الخاص لتكون جاهزة للطباعة الفورية بأعلى جودة.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBrowseCatalog}
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold transition cursor-pointer"
                >
                  تصفح أحدث المذكرات المتاحة
                </button>
                <button
                  type="button"
                  onClick={onContact}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold transition cursor-pointer"
                >
                  تواصل معنا
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Award,
                  color: 'text-blue-600 bg-blue-50',
                  title: 'محتوى علمي منقح',
                  desc: 'مذكرات محدثة ومطابقة لأحدث مواصفات المناهج والامتحانات.'
                },
                {
                  icon: Sparkles,
                  color: 'text-purple-600 bg-purple-50',
                  title: 'تخصيص باسمك وشعارك',
                  desc: 'إضافة اسم المعلم ورقم هاتفه وشعاره على الغلاف وجميع الصفحات.'
                },
                {
                  icon: Clock,
                  color: 'text-emerald-600 bg-emerald-50',
                  title: 'سرعة في التنفيذ',
                  desc: 'تجهيز وتسليم نسخة PDF عالية الدقة جاهزة للطباعة بأعلى جودة.'
                },
                {
                  icon: Eye,
                  color: 'text-amber-600 bg-amber-50',
                  title: 'معاينة قبل الطلب',
                  desc: 'اطلع على عينات حقيقية من صفحات المذكرة وتنسيقها قبل الشراء.'
                }
              ].map((feat, i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feat.color}`}>
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">{feat.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (key === 'featured') {
      if (settings.showFeaturedSection === false || notebooks.length === 0) return null;
      return (
        <section key="featured" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900">أحدث المذكرات المتاحة</h3>
              <p className="text-xs text-slate-500 mt-1">اختر المذكرة المناسبة لمعاينة صفحاتها وطلب تخصيصها باسمك</p>
            </div>
            <button
              type="button"
              onClick={onBrowseCatalog}
              className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold transition cursor-pointer"
            >
              عرض الكل ({notebooks.length}) ←
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {notebooks.slice(0, featuredLimit).map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                onPreview={() => onPreviewNotebook(nb)}
                onOrder={() => onOrderNotebook(nb)}
              />
            ))}
          </div>
        </section>
      );
    }

    return null;
  };

  return <div>{layoutOrder.map((secKey) => renderSectionBlock(secKey))}</div>;
}

// ============================================================================
// NOTEBOOK CARD COMPONENT
// ============================================================================
function NotebookCard({ notebook, onPreview, onOrder }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group">
      {/* Cover Image (Clickable to open details) */}
      <div
        onClick={onPreview}
        className="relative h-56 bg-gradient-to-br from-slate-100 to-blue-50 overflow-hidden cursor-pointer border-b border-slate-100"
      >
        {notebook.coverImage ? (
          <img
            src={notebook.coverImage}
            alt={notebook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <BookOpen className="w-12 h-12 text-blue-300 mb-2" />
            <span className="text-xs font-extrabold text-slate-500">{notebook.subject}</span>
            <span className="text-[11px] text-slate-400">{notebook.grade}</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
          {notebook.isComingSoon ? (
            <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black shadow">
              ⏳ قريبًا / حجز مسبق
            </span>
          ) : (
            notebook.badge && (
              <span className="px-3 py-1 rounded-full bg-blue-700 text-white text-[11px] font-extrabold shadow">
                {notebook.badge}
              </span>
            )
          )}
        </div>

        {notebook.pagesCount > 0 && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold">
            {notebook.pagesCount} صفحة
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">{notebook.category}</span>
            <span>•</span>
            <span>{notebook.grade}</span>
          </div>

          <h4
            onClick={onPreview}
            className="text-base font-black text-slate-900 leading-snug hover:text-blue-700 transition cursor-pointer"
          >
            {notebook.title}
          </h4>

          {notebook.isComingSoon && notebook.comingSoonText ? (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold leading-relaxed">
              {notebook.comingSoonText}
            </div>
          ) : (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notebook.description}</p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-blue-700">{notebook.price} ج.م</span>
              {notebook.oldPrice > notebook.price && (
                <span className="text-xs text-slate-400 line-through font-bold">{notebook.oldPrice} ج.م</span>
              )}
            </div>
            <span className="text-[11px] text-emerald-700 font-extrabold">شامل التخصيص</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPreview}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>التفاصيل والعينة</span>
            </button>

            <button
              type="button"
              onClick={onOrder}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                notebook.isComingSoon
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{notebook.isComingSoon ? 'احجز مسبقًا' : 'اطلب الآن'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CATALOG PAGE COMPONENT (WITH CUSTOMIZABLE EMPTY STATE)
// ============================================================================
function CatalogPage({
  settings,
  structure,
  notebooks,
  filters,
  setFilters,
  onPreviewNotebook,
  onOrderNotebook,
  onOpenCustomOrder
}) {
  const filteredNotebooks = useMemo(() => {
    return notebooks.filter((nb) => {
      if (filters.category !== 'all' && nb.category !== filters.category) return false;
      if (filters.stage !== 'all' && nb.stage !== filters.stage) return false;
      if (filters.grade !== 'all' && nb.grade !== filters.grade) return false;
      if (filters.subject !== 'all' && nb.subject !== filters.subject) return false;
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        const haystack = `${nb.title} ${nb.description} ${nb.subject} ${nb.grade} ${nb.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [notebooks, filters]);

  const resetFilters = () =>
    setFilters({ search: '', category: 'all', stage: 'all', grade: 'all', subject: 'all' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">مكتبة المذكرات التعليمية</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              استخدم خيارات التصفية للوصول السريع للمرحلة والصف والمادة المطلوبة
            </p>
          </div>
          {(filters.search ||
            filters.category !== 'all' ||
            filters.stage !== 'all' ||
            filters.grade !== 'all' ||
            filters.subject !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="ابحث باسم المذكرة..."
              className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-600"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            <option value="all">كل الأقسام</option>
            {(structure.categories || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filters.stage}
            onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            <option value="all">كل المراحل الدراسية</option>
            {(structure.stages || []).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filters.grade}
            onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            <option value="all">كل الصفوف الدراسية</option>
            {(structure.grades || []).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            <option value="all">كل المواد</option>
            {(structure.subjects || []).map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results or Customizable Empty Announcement */}
      {filteredNotebooks.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200 text-center space-y-5 shadow-sm">
          {settings.emptyCatalogImage ? (
            <img
              src={settings.emptyCatalogImage}
              alt={settings.emptyCatalogTitle || 'إعلان القسم'}
              className="max-h-72 mx-auto rounded-2xl object-contain border border-slate-100 shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
          )}

          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-xl font-black text-slate-900">
              {settings.emptyCatalogTitle || 'جاري تجهيز أحدث المذكرات لهذا القسم قريبًا!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {settings.emptyCatalogSubtitle ||
                'نعمل حاليًا على تنسيق ومراجعة مذكرات هذا القسم بأعلى جودة. يمكنك حجز مذكرتك مسبقًا أو التواصل معنا.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenCustomOrder}
              className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
            >
              {settings.emptyCatalogBtnText || 'اطلب تجهيز مذكرتك الآن'}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition cursor-pointer"
            >
              عرض جميع المذكرات المتاحة
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotebooks.map((nb) => (
            <NotebookCard
              key={nb.id}
              notebook={nb}
              onPreview={() => onPreviewNotebook(nb)}
              onOrder={() => onOrderNotebook(nb)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROTECTED NOTEBOOK DETAILS & HD SAMPLE PREVIEW MODAL
// ============================================================================
function ProtectedPreviewModal({ notebook, settings, onClose, onOrder }) {
  const [cloudSamples, setCloudSamples] = useState([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const touchStartRef = useRef({ x: 0, y: 0, dist: 0, zoom: 1, panX: 0, panY: 0, mode: 'none' });

  // Fetch HD samples from notebook_samples collection
  useEffect(() => {
    let active = true;
    const loadHdSamples = async () => {
      if (Array.isArray(notebook.sampleImages) && notebook.sampleImages.length > 0) {
        setCloudSamples(notebook.sampleImages);
        return;
      }
      const count = Number(notebook.sampleCount) || 0;
      if (!db || count <= 0) return;

      setLoadingSamples(true);
      try {
        const loaded = [];
        for (let i = 0; i < count; i += 1) {
          const snap = await getDoc(getPublicDocRef('notebook_samples', `${notebook.id}_page_${i}`));
          if (snap.exists() && snap.data()?.imageData) {
            loaded.push(snap.data().imageData);
          }
        }
        if (active && loaded.length > 0) {
          setCloudSamples(loaded);
        }
      } catch (err) {
        console.error('Error loading HD sample pages:', err);
      } finally {
        if (active) setLoadingSamples(false);
      }
    };
    loadHdSamples();
    return () => {
      active = false;
    };
  }, [notebook]);

  const allPages = useMemo(() => {
    const pages = [];
    if (notebook.coverImage) {
      pages.push({ label: 'الغلاف', src: notebook.coverImage });
    }
    cloudSamples.forEach((src, i) => {
      pages.push({ label: `صفحة ${i + 1}`, src });
    });
    return pages;
  }, [notebook.coverImage, cloudSamples]);

  const safeIndex = Math.min(currentIndex, Math.max(allPages.length - 1, 0));
  const currentPage = allPages[safeIndex] || null;

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const goNext = () => {
    if (allPages.length <= 1) return;
    resetZoom();
    setCurrentIndex((prev) => (prev + 1) % allPages.length);
  };

  const goPrev = () => {
    if (allPages.length <= 1) return;
    resetZoom();
    setCurrentIndex((prev) => (prev - 1 + allPages.length) % allPages.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      } else if (e.key === 'ArrowLeft') {
        goNext();
      } else if (e.key === 'ArrowRight') {
        goPrev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Touch handlers: allow vertical scroll in normal view + horizontal swipe + pinch-to-zoom
  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchStartRef.current = {
        ...touchStartRef.current,
        dist: getTouchDistance(e.touches),
        zoom,
        mode: 'pinch'
      };
    } else if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        dist: 0,
        zoom,
        panX: pan.x,
        panY: pan.y,
        mode: zoom > 1 ? 'pan' : 'swipe'
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartRef.current.mode === 'pinch') {
      const newDist = getTouchDistance(e.touches);
      if (touchStartRef.current.dist > 0) {
        const scale = newDist / touchStartRef.current.dist;
        const nextZoom = Math.min(Math.max(touchStartRef.current.zoom * scale, 1), 3.5);
        setZoom(nextZoom);
        if (nextZoom === 1) setPan({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && touchStartRef.current.mode === 'pan' && zoom > 1) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      setPan({ x: touchStartRef.current.panX + dx, y: touchStartRef.current.panY + dy });
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartRef.current.mode === 'swipe' && zoom === 1 && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx > 0) goPrev();
        else goNext();
      }
    }
    touchStartRef.current.mode = 'none';
  };

  const driveUrl = normalizeExternalUrl(notebook.drivePreviewUrl);

  // Fullscreen Lightbox View
  if (isFullscreen && currentPage) {
    return (
      <div
        dir="rtl"
        onContextMenu={(e) => e.preventDefault()}
        className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col select-none"
      >
        {/* Top Bar */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetZoom();
                setIsFullscreen(false);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              title="إغلاق ملء الشاشة"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <span className="text-xs font-extrabold text-slate-200">
              {currentPage.label} ({safeIndex + 1} / {allPages.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.35).toFixed(2)))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3.5, +(z + 0.35).toFixed(2)))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoom > 1 && (
              <button
                type="button"
                onClick={resetZoom}
                className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Fullscreen Image Viewport */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={() => (zoom > 1 ? resetZoom() : setZoom(2))}
          style={{ touchAction: 'none' }}
          className="relative flex-1 overflow-hidden flex items-center justify-center p-2"
        >
          <img
            src={currentPage.src}
            alt={currentPage.label}
            draggable={false}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: touchStartRef.current.mode === 'none' ? 'transform 0.15s ease-out' : 'none'
            }}
            className="max-w-full max-h-full object-contain pointer-events-none"
          />

          {/* Diagonal Watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-20">
            <span className="text-2xl sm:text-4xl font-black text-white -rotate-30 whitespace-nowrap">
              {settings.platformName} • نسخة معاينة محمية
            </span>
          </div>

          {allPages.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        <div className="py-2 px-4 bg-slate-900 text-center text-[11px] text-slate-400">
          استخدم إصبعين للتكبير والتصغير أو اسحب يمينًا ويسارًا للتنقل بين الصفحات
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">{notebook.title}</h3>
            <p className="text-xs text-slate-500">
              {notebook.category} • {notebook.grade} {notebook.pagesCount ? `• ${notebook.pagesCount} صفحة` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {currentPage && (
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                title="فتح في كامل الشاشة للتكبير بالأصابع"
                className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body (Smooth vertical scrolling on mobile) */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Interactive Sample Image Viewer */}
          {loadingSamples ? (
            <div className="h-56 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-bold">جاري تحميل صفحات العينة عالية الدقة...</span>
            </div>
          ) : currentPage ? (
            <div className="space-y-3">
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => setIsFullscreen(true)}
                style={{ touchAction: 'pan-y pinch-zoom' }}
                className="relative rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center cursor-zoom-in select-none"
              >
                <img
                  src={currentPage.src}
                  alt={currentPage.label}
                  draggable={false}
                  className="w-full max-h-[52vh] object-contain pointer-events-none"
                />

                {/* Watermark */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-20">
                  <span className="text-xl sm:text-3xl font-black text-slate-900 -rotate-25 whitespace-nowrap">
                    {settings.platformName} • نسخة معاينة
                  </span>
                </div>

                {/* Fullscreen Hint Pill */}
                <span className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-bold flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>اضغط للتكبير في كامل الشاشة</span>
                </span>

                {allPages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Page Counter & Quick Dots */}
              {allPages.length > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <span className="text-xs font-extrabold text-slate-600">
                    {currentPage.label} من {allPages.length} (اسحب يمينًا أو يسارًا للتنقل)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {allPages.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                          safeIndex === idx
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {idx === 0 && notebook.coverImage ? 'الغلاف' : idx}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Notebook Description */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h4 className="text-xs font-black text-slate-900">تفاصيل ومحتوى المذكرة:</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {notebook.description || 'مذكرة دراسية منسقة ومحدثة وفق أحدث المناهج وجاهزة للتخصيص باسمك وشعارك.'}
            </p>
          </div>

          {/* Google Drive Full Preview Link (If provided by Admin) */}
          {driveUrl && (
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition"
            >
              <ExternalLink className="w-4 h-4 text-emerald-700" />
              <span>مطالعة نسخة العينة الكاملة على Google Drive</span>
            </a>
          )}

          {/* Important Notices (Displayed inside each notebook modal as requested) */}
          {settings.showNotices !== false && Array.isArray(settings.notices) && settings.notices.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>تنبيهات هامة قبل تأكيد الطلب:</span>
              </h4>
              <ul className="space-y-1 text-xs text-amber-950 list-disc list-inside">
                {settings.notices.map((notice, idx) => (
                  <li key={idx}>{notice}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom Sticky CTA Footer */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[11px] text-slate-500 block">التكلفة شاملة التخصيص</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-blue-700">{notebook.price} ج.م</span>
              {notebook.oldPrice > notebook.price && (
                <span className="text-xs text-slate-400 line-through">{notebook.oldPrice} ج.م</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onOrder}
            className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg transition cursor-pointer ${
              notebook.isComingSoon
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-blue-700 hover:bg-blue-800 text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{notebook.isComingSoon ? 'احجز نسختك مسبقًا الآن' : 'اطلب هذه المذكرة باسمك الآن'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ORDER MODAL (WITH DYNAMIC FIELDS & LOGO UPLOAD CONTROL)
// ============================================================================
function OrderModal({ notebook, isCustom, settings, coupons, onClose, onSubmitOrder, showToast }) {
  const fields = useMemo(() => {
    const raw = Array.isArray(settings.orderFormFields)
      ? settings.orderFormFields
      : DEFAULT_SETTINGS.orderFormFields;
    return raw.filter((f) => f && f.enabled !== false);
  }, [settings.orderFormFields]);

  const [values, setValues] = useState({});
  const [customNotebookDesc, setCustomNotebookDesc] = useState('');
  const [teacherLogo, setTeacherLogo] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  const basePrice = notebook ? Number(notebook.price) || 0 : 0;
  const discountAmount = appliedCoupon
    ? Math.round((basePrice * (Number(appliedCoupon.discountPercent) || 0)) / 100)
    : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = (coupons || []).find((c) => c.active && (c.code || '').toUpperCase() === code);
    if (found) {
      setAppliedCoupon(found);
      showToast(`تم تطبيق خصم ${found.discountPercent}% بنجاح!`);
    } else {
      showToast('كود الخصم غير صحيح أو منتهي الصلاحية', 'error');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 500, 0.8);
      setTeacherLogo(compressed);
    } catch {
      showToast('تعذر قراءة ملف الشعار', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !(values[f.id] || '').trim()) {
        showToast(`يرجى إدخال: ${f.label}`, 'error');
        return;
      }
    }
    if (isCustom && !customNotebookDesc.trim()) {
      showToast('يرجى كتابة تفاصيل المذكرة المطلوبة', 'error');
      return;
    }

    setSubmitting(true);
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      id: orderNumber,
      orderNumber,
      notebookId: notebook?.id || 'custom',
      notebookTitle: notebook?.title || `طلب مذكرة خاصة: ${customNotebookDesc.slice(0, 45)}`,
      isCustom: Boolean(isCustom),
      customDetails: customNotebookDesc,
      customerFields: values,
      teacherName: values.teacherName || Object.values(values)[0] || 'معلم',
      phonePrimary: values.phonePrimary || '',
      teacherLogo,
      price: finalPrice,
      couponCode: appliedCoupon?.code || '',
      status: 'pending',
      deliveryUrl: '',
      createdAt: Date.now()
    };

    await onSubmitOrder(newOrder);
    setSubmitting(false);
    setSubmittedOrder(newOrder);
  };

  const renderLogoUploadBox = () => {
    if (settings.showLogoUploadField === false) return null;
    return (
      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
        <label className="block text-xs font-black text-slate-800">
          شعار المعلم أو السنتر (اختياري — لإضافته على الغلاف والصفحات)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="text-xs text-slate-600 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-blue-700 file:text-white hover:file:bg-blue-800 cursor-pointer"
          />
          {teacherLogo && (
            <img
              src={teacherLogo}
              alt="شعار المعلم"
              className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200"
            />
          )}
        </div>
      </div>
    );
  };

  if (submittedOrder) {
    const waText = encodeURIComponent(
      `مرحبًا ${settings.platformName}، قمت بتسجيل طلب جديد برقم (${submittedOrder.orderNumber}):\n- المذكرة: ${submittedOrder.notebookTitle}\n- الاسم: ${submittedOrder.teacherName}\n- الهاتف: ${submittedOrder.phonePrimary}\n- الإجمالي: ${submittedOrder.price} ج.م`
    );
    const waUrl = settings.whatsappNumber
      ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${waText}`
      : '#';

    return (
      <div dir="rtl" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl p-7 text-center space-y-5 shadow-2xl border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-slate-900">تم استلام طلبك بنجاح!</h3>
            <p className="text-xs text-slate-500">احتفظ برقم الطلب لمتابعة حالة التجهيز والاستلام</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block">رقم تتبع الطلب:</span>
            <span className="text-xl font-black text-blue-700 tracking-wider">{submittedOrder.orderNumber}</span>
          </div>
          {settings.paymentInstructions && (
            <p className="text-xs text-slate-600 bg-amber-50 border border-amber-200 p-3 rounded-xl font-bold">
              بيانات التحويل: {settings.paymentInstructions}
            </p>
          )}
          <div className="space-y-2">
            {settings.whatsappNumber && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تأكيد الطلب وإرسال البيانات عبر واتساب</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    );
  }

  const logoPos = settings.logoFieldPosition || 'top';

  return (
    <div dir="rtl" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {isCustom ? 'طلب إعداد مذكرة خاصة' : `تخصيص وطلب: ${notebook?.title}`}
            </h3>
            <p className="text-xs text-slate-500">أدخل البيانات التي ترغب في طباعتها على الغلاف وجميع الصفحات</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {logoPos === 'top' && renderLogoUploadBox()}

          {isCustom && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                تفاصيل المذكرة المطلوبة (المرحلة، الصف، المادة، الترم) *
              </label>
              <textarea
                rows={3}
                required
                value={customNotebookDesc}
                onChange={(e) => setCustomNotebookDesc(e.target.value)}
                placeholder="اكتب مواصفات المذكرة التي تريد تجهيزها..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>
          )}

          {fields.map((f, idx) => (
            <React.Fragment key={f.id || idx}>
              {logoPos === 'middle' && idx === Math.floor(fields.length / 2) && renderLogoUploadBox()}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  {f.label} {f.required && <span className="text-rose-600">*</span>}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={2}
                    required={f.required}
                    value={values[f.id] || ''}
                    onChange={(e) => setValues({ ...values, [f.id]: e.target.value })}
                    placeholder={f.placeholder || ''}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                ) : (
                  <input
                    type={f.type || 'text'}
                    dir={f.type === 'tel' ? 'ltr' : 'rtl'}
                    required={f.required}
                    value={values[f.id] || ''}
                    onChange={(e) => setValues({ ...values, [f.id]: e.target.value })}
                    placeholder={f.placeholder || ''}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                )}
              </div>
            </React.Fragment>
          ))}

          {logoPos === 'bottom' && renderLogoUploadBox()}

          {/* Coupon Code Box */}
          {!isCustom && basePrice > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="لديك كود خصم؟ أدخله هنا..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer"
                >
                  تطبيق
                </button>
              </div>
              <div className="flex items-center justify-between text-xs font-black pt-1">
                <span className="text-slate-600">الإجمالي النهائي:</span>
                <span className="text-lg text-blue-700">{finalPrice} ج.م</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-black shadow-lg transition cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'جاري تسجيل الطلب...' : 'تأكيد وإرسال الطلب الآن'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// OFFERS, TRACK ORDER & CONTACT PAGES
// ============================================================================
function OffersPage({ coupons, notebooks, onOrderNotebook, onPreviewNotebook, onCopyCode }) {
  const discountedNotebooks = notebooks.filter((n) => Number(n.oldPrice) > Number(n.price));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">العروض وكوبونات الخصم</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          استفد من أكواد الخصم الحصرية والعروض المخفضة على المذكرات التعليمية
        </p>
      </div>

      {coupons.filter((c) => c.active).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons
            .filter((c) => c.active)
            .map((cp) => (
              <div
                key={cp.id}
                className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 border border-slate-800 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                    خصم {cp.discountPercent}%
                  </span>
                  <h3 className="text-lg font-black pt-1">{cp.description}</h3>
                </div>
                <div className="flex items-center justify-between bg-white/10 p-3 rounded-2xl border border-white/15">
                  <span className="font-mono font-black text-amber-300 tracking-wider">{cp.code}</span>
                  <button
                    type="button"
                    onClick={() => onCopyCode(cp.code)}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-extrabold hover:bg-amber-300 transition cursor-pointer"
                  >
                    نسخ الكود
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {discountedNotebooks.length > 0 && (
        <div className="space-y-5">
          <h3 className="text-xl font-black text-slate-900">مذكرات مشمولة بتخفيضات مباشرة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {discountedNotebooks.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                onPreview={() => onPreviewNotebook(nb)}
                onOrder={() => onOrderNotebook(nb)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrackOrderPage({ orders, settings }) {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const matchedOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return orders.filter(
      (o) =>
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.phonePrimary || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );
  }, [orders, query]);

  const statusLabels = {
    pending: { text: 'قيد المراجعة والتجهيز', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    in_progress: { text: 'جاري تصميم وتنسيق نسختك', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    completed: { text: 'مكتمل وجاهز للتحميل', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 text-center">
        <h2 className="text-2xl font-black text-slate-900">تتبع حالة طلبك</h2>
        <p className="text-xs text-slate-500">أدخل رقم الطلب (مثال: ORD-123456) أو رقم الهاتف المسجل في الطلب</p>
        <div className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearched(true);
            }}
            placeholder="رقم الطلب أو رقم الهاتف..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold"
          />
          <button
            type="button"
            onClick={() => setSearched(true)}
            className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold cursor-pointer"
          >
            بحث
          </button>
        </div>
      </div>

      {searched && query.trim() && (
        <div className="space-y-4">
          {matchedOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-xs text-slate-500 font-bold">
              لم يتم العثور على طلبات مطابقة. تأكد من الرقم أو تواصل معنا عبر واتساب: {settings.supportPhone}
            </div>
          ) : (
            matchedOrders.map((ord) => {
              const st = statusLabels[ord.status] || statusLabels.pending;
              const dl = normalizeExternalUrl(ord.deliveryUrl);
              return (
                <div key={ord.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-black text-blue-700">{ord.orderNumber}</span>
                      <h4 className="text-base font-black text-slate-900">{ord.notebookTitle}</h4>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${st.color}`}>
                      {st.text}
                    </span>
                  </div>
                  {dl && (
                    <a
                      href={dl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل نسختك الجاهزة الآن</span>
                    </a>
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

function ContactPage({ settings }) {
  const socialLinks = Array.isArray(settings.socialLinks) ? settings.socialLinks : [];
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-950',
    emerald: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-950',
    sky: 'bg-sky-50 border-sky-200 hover:bg-sky-100 text-sky-950',
    rose: 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-950',
    slate: 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-900'
  };

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

          {socialLinks.map((soc, idx) => {
            const href = normalizeExternalUrl(soc.url);
            if (!href || !soc.label) return null;
            return (
              <a
                key={soc.id || idx}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-5 rounded-2xl border transition flex items-center gap-4 ${
                  colorMap[soc.color] || colorMap.blue
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-sm truncate">{soc.label}</h4>
                  <p className="text-xs opacity-75 truncate mt-0.5" dir="ltr">{soc.url}</p>
                </div>
              </a>
            );
          })}
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

// ============================================================================
// ADMIN PORTAL (FIREBASE AUTH + FULL CONTROL DASHBOARD)
// ============================================================================
function AdminPortal({
  firebaseUser,
  isAdminAuthenticated,
  cloudStatus,
  settings,
  structure,
  notebooks,
  coupons,
  orders,
  onClose,
  onSaveSettings,
  onSaveStructure,
  onSaveNotebook,
  onDeleteNotebook,
  onSaveCoupon,
  onDeleteCoupon,
  onUpdateOrder,
  onDeleteOrder,
  onSyncAll,
  showToast
}) {
  const [adminTab, setAdminTab] = useState('orders');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!auth) {
      showToast('خدمة المصادقة غير مهيأة', 'error');
      return;
    }
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast('مرحبًا بك في لوحة تحكم الإدارة ✅');
    } catch (err) {
      showToast(`تعذر تسجيل الدخول: تأكد من البريد وكلمة المرور (${err.code || ''})`, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showToast('اكتب بريدك الإلكتروني في خانة البريد أولًا ثم اضغط استعادة كلمة المرور', 'error');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      showToast('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني ✅');
    } catch (err) {
      showToast(`تعذر إرسال رابط الاستعادة: ${err.code || err.message}`, 'error');
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    showToast('تم تسجيل الخروج من الإدارة');
    onClose();
  };

  // Login Screen if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div dir="rtl" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl p-7 shadow-2xl border border-slate-200 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">بوابة إدارة المنصة</h3>
                <p className="text-[11px] text-slate-500">تسجيل دخول المدير المعتمد</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">البريد الإلكتروني للإدارة</label>
              <input
                type="email"
                dir="ltr"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">كلمة المرور</label>
              <input
                type="password"
                dir="ltr"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black transition cursor-pointer disabled:opacity-60"
            >
              {authLoading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}
            </button>

            <button
              type="button"
              onClick={handleResetPassword}
              className="w-full text-center text-xs font-bold text-blue-700 hover:underline cursor-pointer"
            >
              نسيت كلمة المرور؟ إرسال رابط الاستعادة لبريدي
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden">
      {/* Top Admin Bar */}
      <div className="bg-slate-950 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black">لوحة تحكم {settings.platformName}</h2>
            <p className="text-[11px] text-slate-400" dir="ltr">{firebaseUser?.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
              cloudStatus === 'connected'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            {cloudStatus === 'connected' ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
            <span>{cloudStatus === 'connected' ? 'متصل بالسحابة' : 'وضع محلي'}</span>
          </span>

          <button
            type="button"
            onClick={onSyncAll}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>مزامنة للسحابة</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold cursor-pointer"
          >
            معاينة الموقع
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Admin Sub-Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0">
        {[
          { id: 'orders', label: `الطلبات (${orders.length})` },
          { id: 'notebooks', label: `المذكرات (${notebooks.length})` },
          { id: 'coupons', label: 'العروض والكوبونات' },
          { id: 'structure', label: 'المراحل والمواد' },
          { id: 'settings', label: 'إعدادات الموقع' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setAdminTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
              adminTab === t.id
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Admin Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {adminTab === 'orders' && (
            <AdminOrdersTab orders={orders} onUpdateOrder={onUpdateOrder} onDeleteOrder={onDeleteOrder} />
          )}
          {adminTab === 'notebooks' && (
            <AdminNotebooksTab
              notebooks={notebooks}
              structure={structure}
              onSaveNotebook={onSaveNotebook}
              onDeleteNotebook={onDeleteNotebook}
              showToast={showToast}
            />
          )}
          {adminTab === 'coupons' && (
            <AdminCouponsTab
              coupons={coupons}
              onSaveCoupon={onSaveCoupon}
              onDeleteCoupon={onDeleteCoupon}
            />
          )}
          {adminTab === 'structure' && (
            <AdminStructureTab structure={structure} onSaveStructure={onSaveStructure} />
          )}
          {adminTab === 'settings' && (
            <AdminSettingsTab
              settings={settings}
              structure={structure}
              notebooks={notebooks}
              coupons={coupons}
              orders={orders}
              onSaveSettings={onSaveSettings}
              onImportBackup={async (backup) => {
                if (backup.settings) await onSaveSettings({ ...DEFAULT_SETTINGS, ...backup.settings });
                if (backup.structure) await onSaveStructure({ ...DEFAULT_STRUCTURE, ...backup.structure });
                if (Array.isArray(backup.notebooks)) {
                  for (const nb of backup.notebooks) {
                    await onSaveNotebook(nb, nb.sampleImages || null);
                  }
                }
                if (Array.isArray(backup.coupons)) {
                  for (const cp of backup.coupons) {
                    await onSaveCoupon(cp);
                  }
                }
                showToast('تمت استعادة النسخة الاحتياطية بنجاح ✅');
              }}
              showToast={showToast}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN TAB 1: ORDERS MANAGEMENT (WITH DELETE CONFIRMATION)
// ============================================================================
function AdminOrdersTab({ orders, onUpdateOrder, onDeleteOrder }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-sm text-slate-500 font-bold">
        لا توجد طلبات مسجلة حتى الآن.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((ord) => (
        <div key={ord.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-black">
                  {ord.orderNumber}
                </span>
                <span className="text-xs text-slate-400">
                  {ord.createdAt ? new Date(ord.createdAt).toLocaleString('ar-EG') : ''}
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900">{ord.notebookTitle}</h4>
              <p className="text-xs text-slate-600 font-bold">
                المعلم: {ord.teacherName} • الهاتف: <span dir="ltr">{ord.phonePrimary}</span> • الإجمالي:{' '}
                <span className="text-blue-700">{ord.price} ج.م</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={ord.status || 'pending'}
                onChange={(e) => onUpdateOrder(ord.id, { status: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold bg-slate-50"
              >
                <option value="pending">قيد المراجعة</option>
                <option value="in_progress">جاري التنفيذ</option>
                <option value="completed">مكتمل وجاهز</option>
              </select>

              {confirmDeleteId === ord.id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteOrder(ord.id);
                      setConfirmDeleteId(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer"
                  >
                    تأكيد الحذف
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(ord.id)}
                  title="حذف الطلب"
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {ord.customerFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
              {Object.entries(ord.customerFields).map(([k, v]) =>
                v ? (
                  <div key={k}>
                    <span className="text-slate-400 font-bold">{k}: </span>
                    <span className="text-slate-800 font-extrabold">{String(v)}</span>
                  </div>
                ) : null
              )}
            </div>
          )}

          {ord.teacherLogo && (
            <div className="flex items-center gap-3">
              <img src={ord.teacherLogo} alt="شعار المعلم" className="w-12 h-12 rounded-xl object-contain border" />
              <a
                href={ord.teacherLogo}
                download={`logo-${ord.orderNumber}.jpg`}
                className="text-xs font-extrabold text-blue-700 hover:underline"
              >
                تحميل شعار المعلم
              </a>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
            <input
              type="url"
              dir="ltr"
              defaultValue={ord.deliveryUrl || ''}
              onBlur={(e) => onUpdateOrder(ord.id, { deliveryUrl: e.target.value })}
              placeholder="ضع رابط تسليم المذكرة النهائية (Google Drive) هنا..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ADMIN TAB 2: NOTEBOOKS MANAGEMENT (HD SAMPLES + DRIVE + COMING SOON)
// ============================================================================
function AdminNotebooksTab({ notebooks, structure, onSaveNotebook, onDeleteNotebook, showToast }) {
  const emptyForm = {
    id: '',
    title: '',
    category: structure.categories?.[0] || 'مذكرات الترم الأول',
    stage: structure.stages?.[0] || 'المرحلة الإعدادية',
    grade: structure.grades?.[0] || 'الصف الأول الإعدادي',
    subject: structure.subjects?.[0] || 'اللغة العربية',
    price: 150,
    oldPrice: 200,
    pagesCount: 80,
    badge: '',
    description: '',
    coverImage: '',
    drivePreviewUrl: '',
    isComingSoon: false,
    comingSoonText: ''
  };

  const [form, setForm] = useState(emptyForm);
  const [newSampleFiles, setNewSampleFiles] = useState(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (nb) => {
    setForm({
      ...emptyForm,
      ...nb
    });
    setNewSampleFiles(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1100, 0.82);
      setForm((prev) => ({ ...prev, coverImage: compressed }));
    } catch {
      showToast('تعذر معالجة صورة الغلاف', 'error');
    }
  };

  const handleSamplesUpload = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 15);
    if (files.length === 0) return;
    try {
      const compressedList = [];
      for (const f of files) {
        const hd = await compressImageFile(f, 1280, 0.85);
        compressedList.push(hd);
      }
      setNewSampleFiles(compressedList);
      showToast(`تم تجهيز ${compressedList.length} صفحة عينة بجودة HD`);
    } catch {
      showToast('تعذر معالجة صور العينات', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('يرجى إدخال عنوان المذكرة', 'error');
      return;
    }
    setSaving(true);
    const nbPayload = {
      ...form,
      id: form.id || `nb-${Date.now()}`,
      price: Number(form.price) || 0,
      oldPrice: Number(form.oldPrice) || 0,
      pagesCount: Number(form.pagesCount) || 0,
      createdAt: form.createdAt || Date.now()
    };
    await onSaveNotebook(nbPayload, newSampleFiles);
    setSaving(false);
    setForm(emptyForm);
    setNewSampleFiles(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 h-fit"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">
            {form.id ? 'تعديل بيانات المذكرة' : 'إضافة مذكرة جديدة'}
          </h3>
          {form.id && (
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setNewSampleFiles(null);
              }}
              className="text-xs font-extrabold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="عنوان المذكرة..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
        />

        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            {(structure.categories || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            {(structure.stages || []).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            {(structure.grades || []).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            {(structure.subjects || []).map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">السعر الحالي</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">قبل الخصم</label>
            <input
              type="number"
              value={form.oldPrice}
              onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">الصفحات</label>
            <input
              type="number"
              value={form.pagesCount}
              onChange={(e) => setForm({ ...form, pagesCount: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
            />
          </div>
        </div>

        <input
          type="text"
          value={form.badge}
          onChange={(e) => setForm({ ...form, badge: e.target.value })}
          placeholder="شارة التميز (مثال: الأكثر طلبًا / عرض خاص)"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
        />

        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="وصف المذكرة..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
        />

        {/* Coming Soon / Pre-order Toggle */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
          <label className="flex items-center gap-2 text-xs font-black text-amber-950 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.isComingSoon)}
              onChange={(e) => setForm({ ...form, isComingSoon: e.target.checked })}
            />
            <span>المذكرة لم تكتمل بعد (وضع إعلان «قريبًا / حجز مسبق»)</span>
          </label>
          {form.isComingSoon && (
            <input
              type="text"
              value={form.comingSoonText || ''}
              onChange={(e) => setForm({ ...form, comingSoonText: e.target.value })}
              placeholder="اكتب نص الإعلان الذي يظهر في البطاقة (مثال: تصدر خلال أيام — احجز نسختك الآن)"
              className="w-full px-3.5 py-2 rounded-xl border border-amber-300 text-xs font-bold bg-white"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            رابط Google Drive لمطالعة نسخة المذكرة (اختياري)
          </label>
          <input
            type="url"
            dir="ltr"
            value={form.drivePreviewUrl || ''}
            onChange={(e) => setForm({ ...form, drivePreviewUrl: e.target.value })}
            placeholder="https://drive.google.com/file/d/..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">صورة غلاف المذكرة</label>
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="text-xs w-full" />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              صور صفحات عينة المعاينة (حتى 15 صفحة HD)
            </label>
            <input type="file" accept="image/*" multiple onChange={handleSamplesUpload} className="text-xs w-full" />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black transition cursor-pointer disabled:opacity-60"
        >
          {saving ? 'جاري الحفظ والرفع للسحابة...' : form.id ? 'حفظ التعديلات' : '+ إضافة المذكرة'}
        </button>
      </form>

      {/* Notebooks List */}
      <div className="lg:col-span-6 space-y-3">
        {notebooks.map((nb) => (
          <div
            key={nb.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <h4 className="text-sm font-black text-slate-900 truncate">{nb.title}</h4>
              <p className="text-xs text-slate-500">
                {nb.category} • {nb.grade} • <span className="text-blue-700 font-bold">{nb.price} ج.م</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => startEdit(nb)}
                className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteNotebook(nb.id)}
                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
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

// ============================================================================
// ADMIN TAB 3 & 4: COUPONS & STRUCTURE
// ============================================================================
function AdminCouponsTab({ coupons, onSaveCoupon, onDeleteCoupon }) {
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [description, setDescription] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    await onSaveCoupon({
      id: `cp-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountPercent: Number(discountPercent) || 10,
      description: description || `خصم ${discountPercent}%`,
      active: true
    });
    setCode('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="bg-white rounded-3xl p-6 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          type="text"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="كود الخصم (مثال: SAVE20)"
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase"
        />
        <input
          type="number"
          min={1}
          max={90}
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          placeholder="نسبة الخصم %"
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="وصف العرض..."
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
        />
        <button
          type="submit"
          className="py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black cursor-pointer"
        >
          + إضافة كود خصم
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((cp) => (
          <div key={cp.id} className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-mono font-black text-blue-700 text-sm">{cp.code}</span>
              <p className="text-xs text-slate-600">{cp.description} ({cp.discountPercent}%)</p>
            </div>
            <button
              type="button"
              onClick={() => onDeleteCoupon(cp.id)}
              className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminStructureTab({ structure, onSaveStructure }) {
  const [inputs, setInputs] = useState({ categories: '', stages: '', grades: '', subjects: '' });

  const addItem = (key) => {
    const val = (inputs[key] || '').trim();
    if (!val) return;
    const list = Array.isArray(structure[key]) ? structure[key] : [];
    if (!list.includes(val)) {
      onSaveStructure({ ...structure, [key]: [...list, val] });
    }
    setInputs({ ...inputs, [key]: '' });
  };

  const removeItem = (key, idx) => {
    const list = Array.isArray(structure[key]) ? structure[key] : [];
    onSaveStructure({ ...structure, [key]: list.filter((_, i) => i !== idx) });
  };

  const blocks = [
    { key: 'categories', title: 'الأقسام الرئيسية (الترم الأول، الترم الثاني، التأسيس...)' },
    { key: 'stages', title: 'المراحل الدراسية' },
    { key: 'grades', title: 'الصفوف الدراسية' },
    { key: 'subjects', title: 'المواد الدراسية' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {blocks.map((b) => (
        <div key={b.key} className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4">
          <h4 className="font-black text-sm text-slate-900">{b.title}</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputs[b.key]}
              onChange={(e) => setInputs({ ...inputs, [b.key]: e.target.value })}
              placeholder="اكتب الاسم للإضافة..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
            />
            <button
              type="button"
              onClick={() => addItem(b.key)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold cursor-pointer"
            >
              إضافة
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(structure[b.key] || []).map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-800"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => removeItem(b.key, idx)}
                  className="text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ADMIN TAB 5: FULL SITE SETTINGS, LAYOUT CONTROL, SOCIAL LINKS & BACKUP
// ============================================================================
function AdminSettingsTab({
  settings,
  structure,
  notebooks,
  coupons,
  orders,
  onSaveSettings,
  onImportBackup,
  showToast
}) {
  const safeOrderFields = useMemo(() => {
    if (Array.isArray(settings?.orderFormFields) && settings.orderFormFields.length > 0) {
      return settings.orderFormFields.filter((f) => f && typeof f === 'object');
    }
    return DEFAULT_SETTINGS.orderFormFields;
  }, [settings]);

  const safeHomeSections = useMemo(() => {
    if (Array.isArray(settings?.homeSections)) {
      return settings.homeSections.filter((s) => s && typeof s === 'object');
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

  const safeSocialLinks = useMemo(() => {
    if (Array.isArray(settings?.socialLinks)) {
      return settings.socialLinks
        .filter((s) => s && typeof s === 'object')
        .map((s, i) => ({
          id: s.id || `soc_${i}`,
          label: s.label || '',
          url: s.url || '',
          color: s.color || 'blue'
        }));
    }
    return DEFAULT_SETTINGS.socialLinks;
  }, [settings]);

  const [form, setForm] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
    orderFormFields: safeOrderFields,
    homeSections: safeHomeSections,
    homeLayoutOrder: safeLayoutOrder,
    socialLinks: safeSocialLinks
  }));

  const [newNotice, setNewNotice] = useState('');

  useEffect(() => {
    setForm((prev) => ({
      ...DEFAULT_SETTINGS,
      ...prev,
      ...(settings || {}),
      orderFormFields: safeOrderFields,
      homeSections: safeHomeSections,
      homeLayoutOrder: safeLayoutOrder,
      socialLinks: safeSocialLinks
    }));
  }, [settings, safeOrderFields, safeHomeSections, safeLayoutOrder, safeSocialLinks]);

  const handleImageUpload = async (e, fieldName, maxW = 1000) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, maxW, 0.8);
      setForm((prev) => ({ ...prev, [fieldName]: compressed }));
    } catch {
      showToast('تعذر معالجة الصورة', 'error');
    }
  };

  // Layout Reordering
  const moveLayoutSection = (idx, dir) => {
    const current = [...(form.homeLayoutOrder || safeLayoutOrder)];
    const target = idx + dir;
    if (target < 0 || target >= current.length) return;
    [current[idx], current[target]] = [current[target], current[idx]];
    setForm((prev) => ({ ...prev, homeLayoutOrder: current }));
  };

  // Home Section Cards Management
  const addHomeSection = () => {
    setForm((prev) => ({
      ...prev,
      homeSections: [
        ...(prev.homeSections || []),
        {
          id: `sec_${Date.now()}`,
          title: 'قسم جديد',
          subtitle: 'وصف مختصر للقسم...',
          badge: 'جديد',
          filterCategory: structure.categories?.[0] || 'مذكرات الترم الأول',
          accent: 'blue',
          btnText: 'تصفح القسم',
          coverImage: ''
        }
      ]
    }));
  };

  const updateHomeSection = (idx, patch) => {
    setForm((prev) => {
      const updated = [...(prev.homeSections || [])];
      updated[idx] = { ...updated[idx], ...patch };
      return { ...prev, homeSections: updated };
    });
  };

  const moveHomeSection = (idx, dir) => {
    setForm((prev) => {
      const updated = [...(prev.homeSections || [])];
      const target = idx + dir;
      if (target < 0 || target >= updated.length) return prev;
      [updated[idx], updated[target]] = [updated[target], updated[idx]];
      return { ...prev, homeSections: updated };
    });
  };

  const removeHomeSection = (idx) => {
    setForm((prev) => ({
      ...prev,
      homeSections: (prev.homeSections || []).filter((_, i) => i !== idx)
    }));
  };

  // Social Media Links Management
  const addSocialLink = () => {
    setForm((prev) => {
      const current = Array.isArray(prev.socialLinks) ? prev.socialLinks : safeSocialLinks;
      return {
        ...prev,
        socialLinks: [
          ...current,
          {
            id: `soc_${Date.now()}`,
            label: 'فيسبوك / تليجرام / يوتيوب',
            url: '',
            color: 'blue'
          }
        ]
      };
    });
  };

  const updateSocialLink = (idx, patch) => {
    setForm((prev) => {
      const current = Array.isArray(prev.socialLinks) ? prev.socialLinks : safeSocialLinks;
      const updated = [...current];
      updated[idx] = { ...updated[idx], ...patch };
      return { ...prev, socialLinks: updated };
    });
  };

  const removeSocialLink = (idx) => {
    setForm((prev) => {
      const current = Array.isArray(prev.socialLinks) ? prev.socialLinks : safeSocialLinks;
      return {
        ...prev,
        socialLinks: current.filter((_, i) => i !== idx)
      };
    });
  };

  // Order Form Fields Management
  const addOrderField = () => {
    setForm((prev) => ({
      ...prev,
      orderFormFields: [
        ...(prev.orderFormFields || []),
        {
          id: `field_${Date.now()}`,
          label: 'حقل جديد',
          placeholder: '',
          type: 'text',
          required: false,
          enabled: true,
          isCore: false
        }
      ]
    }));
  };

  const updateOrderField = (idx, patch) => {
    setForm((prev) => {
      const updated = [...(prev.orderFormFields || [])];
      updated[idx] = { ...updated[idx], ...patch };
      return { ...prev, orderFormFields: updated };
    });
  };

  const moveOrderField = (idx, dir) => {
    setForm((prev) => {
      const updated = [...(prev.orderFormFields || [])];
      const target = idx + dir;
      if (target < 0 || target >= updated.length) return prev;
      [updated[idx], updated[target]] = [updated[target], updated[idx]];
      return { ...prev, orderFormFields: updated };
    });
  };

  const removeOrderField = (idx) => {
    setForm((prev) => ({
      ...prev,
      orderFormFields: (prev.orderFormFields || []).filter((_, i) => i !== idx)
    }));
  };

  // Backup Export & Import
  const handleExportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      settings: form,
      structure,
      notebooks,
      coupons,
      orders
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `el3bakera-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تحميل ملف النسخة الاحتياطية على جهازك ✅');
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        await onImportBackup(parsed);
      } catch {
        showToast('ملف النسخة الاحتياطية غير صالح', 'error');
      }
    };
    reader.readAsText(file);
  };

  const layoutLabels = {
    hero: '1. الواجهة الترحيبية الرئيسية (Hero)',
    sections: '2. بطاقات الأقسام الرئيسية (الترم الأول / الثاني / التأسيس)',
    about: '3. قسم التعريف بالمنصة والمميزات',
    featured: '4. قسم أحدث المذكرات المتاحة'
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSaveSettings(form);
      }}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8"
    >
      {/* Basic Identity & Visual Hero Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-900">الهوية البصرية وإعدادات الواجهة الرئيسية</h3>

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
              value={form.tagline || ''}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          {/* Logo Upload & Size Slider */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700">شعار المنصة (Logo — 500×500)</label>
              {form.logoImage && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logoImage: '' })}
                  className="text-[11px] font-bold text-rose-600 cursor-pointer"
                >
                  حذف الشعار
                </button>
              )}
            </div>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoImage', 500)} className="text-xs" />
            <div className="pt-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>حجم الشعار في الهيدر:</span>
                <span>{form.logoSize || 56}px</span>
              </div>
              <input
                type="range"
                min={40}
                max={115}
                value={form.logoSize || 56}
                onChange={(e) => setForm({ ...form, logoSize: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Hero Background Image & Overlay Controls */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700">صورة خلفية الصفحة الرئيسية</label>
              {form.heroBgImage && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, heroBgImage: '' })}
                  className="text-[11px] font-bold text-rose-600 cursor-pointer"
                >
                  حذف الخلفية
                </button>
              )}
            </div>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'heroBgImage', 1400)} className="text-xs" />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">
                  وضوح الخلفية ({form.heroBgOpacity ?? 45}%)
                </span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={form.heroBgOpacity ?? 45}
                  onChange={(e) => setForm({ ...form, heroBgOpacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">
                  عتامة الطبقة المغطية ({form.heroOverlayOpacity ?? 75}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={95}
                  value={form.heroOverlayOpacity ?? 75}
                  onChange={(e) => setForm({ ...form, heroOverlayOpacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <span>لون الطبقة:</span>
                <input
                  type="color"
                  value={form.heroOverlayColor || '#020617'}
                  onChange={(e) => setForm({ ...form, heroOverlayColor: e.target.value })}
                />
              </label>
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <span>الارتفاع:</span>
                <input
                  type="number"
                  min={360}
                  max={800}
                  value={form.heroMinHeight || 540}
                  onChange={(e) => setForm({ ...form, heroMinHeight: Number(e.target.value) })}
                  className="w-20 px-2 py-1 rounded-lg border border-slate-200 bg-white"
                />
              </label>
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
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
            <label className="block text-xs font-extrabold text-slate-700 mb-1">رقم هاتف خدمة العملاء</label>
            <input
              type="text"
              dir="ltr"
              value={form.supportPhone || ''}
              onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">البريد الإلكتروني للمنصة</label>
            <input
              type="email"
              dir="ltr"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
      </div>

      {/* Dynamic Social Media Links Manager */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-slate-900">إدارة روابط التواصل الاجتماعي</h4>
            <p className="text-[11px] text-slate-500">
              أضف أي رابط تواصل اجتماعي (فيسبوك، جروب واتساب، تليجرام، يوتيوب، تيك توك...) أو عدّله أو احذفه بحرية تامة
            </p>
          </div>
          <button
            type="button"
            onClick={addSocialLink}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
          >
            + إضافة رابط تواصل جديد
          </button>
        </div>

        {(Array.isArray(form.socialLinks) ? form.socialLinks : safeSocialLinks).length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-bold">
            لا توجد روابط تواصل مضافة حاليًا — اضغط «+ إضافة رابط تواصل جديد» لإضافة أول رابط.
          </div>
        ) : (
          <div className="space-y-2.5">
            {(Array.isArray(form.socialLinks) ? form.socialLinks : safeSocialLinks).map((soc, idx) => (
              <div
                key={soc.id || idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
              >
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={soc.label || ''}
                    onChange={(e) => updateSocialLink(idx, { label: e.target.value })}
                    placeholder="اسم المنصة (مثال: فيسبوك / تليجرام)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  />
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="url"
                    dir="ltr"
                    value={soc.url || ''}
                    onChange={(e) => updateSocialLink(idx, { url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-left bg-white"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center justify-end gap-2">
                  <select
                    value={soc.color || 'blue'}
                    onChange={(e) => updateSocialLink(idx, { color: e.target.value })}
                    className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="blue">لون أزرق</option>
                    <option value="emerald">لون أخضر</option>
                    <option value="sky">لون سماوي</option>
                    <option value="rose">لون أحمر</option>
                    <option value="slate">لون داكن</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeSocialLink(idx)}
                    title="حذف الرابط"
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty Catalog / Section Announcement Customization */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div>
          <h4 className="font-black text-slate-900">تخصيص رسالة وصورة القسم الفارغ (عند عدم وجود مذكرات في القسم بعد)</h4>
          <p className="text-[11px] text-slate-500">
            تحكم فيما يظهر للزائر من عنوان ونص وصورة إعلانية عندما يفتح قسمًا لم تُضَف فيه مذكرات بعد
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">العنوان الرئيسي عند خلو القسم</label>
            <input
              type="text"
              value={form.emptyCatalogTitle || ''}
              onChange={(e) => setForm({ ...form, emptyCatalogTitle: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">نص زر الحجز أو الطلب المسبق</label>
            <input
              type="text"
              value={form.emptyCatalogBtnText || ''}
              onChange={(e) => setForm({ ...form, emptyCatalogBtnText: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold text-slate-700 mb-1">النص التوضيحي أو الإعلاني</label>
            <textarea
              rows={2}
              value={form.emptyCatalogSubtitle || ''}
              onChange={(e) => setForm({ ...form, emptyCatalogSubtitle: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">صورة أو بانر يظهر عند خلو القسم (اختياري)</label>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'emptyCatalogImage', 900)} className="text-xs" />
            </div>
            {form.emptyCatalogImage && (
              <div className="flex items-center gap-2">
                <img src={form.emptyCatalogImage} alt="معاينة" className="h-14 rounded-xl border" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, emptyCatalogImage: '' })}
                  className="text-xs font-bold text-rose-600 cursor-pointer"
                >
                  حذف الصورة
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Home Page Layout Visibility & Reordering */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div>
          <h4 className="font-black text-slate-900">التحكم الكامل في تخطيط الصفحة الرئيسية وترتيب أقسامها</h4>
          <p className="text-[11px] text-slate-500">أظهر أو أخفِ أي قسم في الصفحة الرئيسية، وغيّر ترتيب ظهور الأقسام</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'showHeroSection', label: 'إظهار الواجهة الترحيبية (Hero)' },
            { key: 'showHeroTrustCard', label: 'إظهار بطاقة «لماذا يثق بنا المعلمون؟»' },
            { key: 'showHeroCustomBtn', label: 'إظهار زر «اطلب مذكرة خاصة»' },
            { key: 'showHomeSectionsBlock', label: 'إظهار بطاقات الأقسام الرئيسية' },
            { key: 'showAboutSection', label: 'إظهار قسم التعريف بالمنصة' },
            { key: 'showFeaturedSection', label: 'إظهار قسم أحدث المذكرات' }
          ].map((chk) => (
            <label
              key={chk.key}
              className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-800 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={form[chk.key] !== false}
                onChange={(e) => setForm({ ...form, [chk.key]: e.target.checked })}
              />
              <span>{chk.label}</span>
            </label>
          ))}
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-extrabold text-slate-700">ترتيب ظهور الأقسام في الصفحة الرئيسية:</span>
          {(form.homeLayoutOrder || safeLayoutOrder).map((secKey, idx) => (
            <div
              key={secKey}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
            >
              <span className="text-xs font-black text-slate-800">{layoutLabels[secKey] || secKey}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveLayoutSection(idx, -1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveLayoutSection(idx, 1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Home Section Cards & Cover Images (800x450) */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-slate-900">إدارة بطاقات الأقسام الرئيسية وصور أغلفتها (800×450)</h4>
            <p className="text-[11px] text-slate-500">تحكم في بطاقات (الترم الأول، الترم الثاني، التأسيس...) وصور أغلفتها</p>
          </div>
          <button
            type="button"
            onClick={addHomeSection}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold cursor-pointer"
          >
            + إضافة بطاقة قسم جديدة
          </button>
        </div>

        <div className="space-y-3">
          {(form.homeSections || []).map((sec, idx) => (
            <div key={sec.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={sec.title || ''}
                  onChange={(e) => updateHomeSection(idx, { title: e.target.value })}
                  placeholder="عنوان البطاقة"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                />
                <input
                  type="text"
                  value={sec.badge || ''}
                  onChange={(e) => updateHomeSection(idx, { badge: e.target.value })}
                  placeholder="الشارة (مثال: متاح الآن)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                />
                <select
                  value={sec.filterCategory || ''}
                  onChange={(e) => updateHomeSection(idx, { filterCategory: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {(structure.categories || []).map((c) => (
                    <option key={c} value={c}>
                      ربط بقسم: {c}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={sec.subtitle || ''}
                onChange={(e) => updateHomeSection(idx, { subtitle: e.target.value })}
                placeholder="وصف البطاقة..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const img = await compressImageFile(f, 800, 0.78);
                      updateHomeSection(idx, { coverImage: img });
                    }}
                    className="text-xs"
                  />
                  {sec.coverImage && (
                    <button
                      type="button"
                      onClick={() => updateHomeSection(idx, { coverImage: '' })}
                      className="text-xs font-bold text-rose-600 cursor-pointer"
                    >
                      إزالة الغلاف
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveHomeSection(idx, -1)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveHomeSection(idx, 1)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeHomeSection(idx)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notebook Notices Management */}
      <div className="border-t border-slate-200 pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-slate-900">التنبيهات الهامة داخل صفحة كل مذكرة</h4>
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showNotices !== false}
              onChange={(e) => setForm({ ...form, showNotices: e.target.checked })}
            />
            <span>إظهار التنبيهات</span>
          </label>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newNotice}
            onChange={(e) => setNewNotice(e.target.value)}
            placeholder="أضف تنبيهًا جديدًا..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
          />
          <button
            type="button"
            onClick={() => {
              if (!newNotice.trim()) return;
              setForm((prev) => ({ ...prev, notices: [...(prev.notices || []), newNotice.trim()] }));
              setNewNotice('');
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold cursor-pointer"
          >
            إضافة
          </button>
        </div>

        <div className="space-y-1.5">
          {(form.notices || []).map((nt, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs font-bold">
              <span>{nt}</span>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    notices: (prev.notices || []).filter((_, i) => i !== idx)
                  }))
                }
                className="text-rose-600 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Order Form Fields & Logo Upload Field Control */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-slate-900">تخصيص وترتيب حقول نموذج الطلب</h4>
            <p className="text-[11px] text-slate-500">تحكم في إظهار أو إخفاء خانة الشعار وترتيب جميع حقول البيانات</p>
          </div>
          <button
            type="button"
            onClick={addOrderField}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold cursor-pointer"
          >
            + إضافة حقل جديد
          </button>
        </div>

        {/* Logo Field Visibility & Position */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-black text-blue-950 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showLogoUploadField !== false}
              onChange={(e) => setForm({ ...form, showLogoUploadField: e.target.checked })}
            />
            <span>إظهار حقل رفع شعار المعلم أو السنتر في نموذج الطلب</span>
          </label>
          <select
            value={form.logoFieldPosition || 'top'}
            onChange={(e) => setForm({ ...form, logoFieldPosition: e.target.value })}
            className="px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-bold bg-white"
          >
            <option value="top">مكانه: أعلى النموذج</option>
            <option value="middle">مكانه: منتصف النموذج</option>
            <option value="bottom">مكانه: أسفل النموذج</option>
          </select>
        </div>

        <div className="space-y-2.5">
          {(form.orderFormFields || []).map((f, idx) => (
            <div
              key={f.id || idx}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center"
            >
              <div className="md:col-span-4">
                <input
                  type="text"
                  value={f.label || ''}
                  onChange={(e) => updateOrderField(idx, { label: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                />
              </div>
              <div className="md:col-span-4">
                <input
                  type="text"
                  value={f.placeholder || ''}
                  onChange={(e) => updateOrderField(idx, { placeholder: e.target.value })}
                  placeholder="نص توضيحي..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
              <div className="md:col-span-4 flex flex-wrap items-center justify-end gap-2">
                <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={f.enabled !== false}
                    onChange={(e) => updateOrderField(idx, { enabled: e.target.checked })}
                  />
                  <span>إظهار</span>
                </label>
                <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(f.required)}
                    onChange={(e) => updateOrderField(idx, { required: e.target.checked })}
                  />
                  <span>إلزامي</span>
                </label>
                <button
                  type="button"
                  onClick={() => moveOrderField(idx, -1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveOrderField(idx, 1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                {!f.isCore && (
                  <button
                    type="button"
                    onClick={() => removeOrderField(idx)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Local Backup Export & Restore */}
      <div className="border-t border-slate-200 pt-6 space-y-3">
        <h4 className="font-black text-slate-900">النسخ الاحتياطي والاستعادة على جهازك (JSON)</h4>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل نسخة احتياطية كاملة على جهازي</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>استعادة نسخة احتياطية من جهازي</span>
            <input type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Save All Settings Button */}
      <div className="pt-4 border-t border-slate-200">
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-black shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Save className="w-5 h-5" />
          <span>حفظ جميع إعدادات المنصة ومزامنتها للسحابة</span>
        </button>
      </div>
    </form>
  );
}
