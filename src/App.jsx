import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  BookOpen,
  ShoppingCart,
  Search,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  Shield,
  Lock,
  Plus,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Folder,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  MessageCircle,
  Phone,
  Sparkles,
  Tag,
  Copy,
  Download,
  Upload,
  LogOut,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Layers,
  Award,
  Clock
} from 'lucide-react';

// ==========================================
// 1. Firebase Initialization (Project: el3bakera-edu)
// ==========================================
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD_du5VY8nJGDJ169Fof9EAlI9x2W2d-14',
  authDomain: 'el3bakera-edu.firebaseapp.com',
  projectId: 'el3bakera-edu',
  storageBucket: 'el3bakera-edu.firebasestorage.app',
  messagingSenderId: '74663879858',
  appId: '1:74663879858:web:4327c0ea1b825dd6c615ab'
};

let firebaseApp = null;
let auth = null;
let db = null;

try {
  const existingApps = getApps();
  firebaseApp = existingApps.length > 0 ? existingApps[0] : initializeApp(DEFAULT_FIREBASE_CONFIG);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
} catch (err) {
  console.error('Firebase initialization warning:', err);
}

const APP_ID = 'el3bakera-edu';
const publicDoc = (colName, docId) =>
  doc(db, 'artifacts', APP_ID, 'public', 'data', colName, docId);
const publicCol = (colName) =>
  collection(db, 'artifacts', APP_ID, 'public', 'data', colName);

// ==========================================
// 2. LocalStorage Keys & Default Data
// ==========================================
const LS_KEYS = {
  SETTINGS: 'mz_platform_settings_v3',
  NOTEBOOKS: 'mz_platform_notebooks_v3',
  ORDERS: 'mz_platform_orders_v3',
  COUPONS: 'mz_platform_coupons_v3'
};

const DEFAULT_SOCIAL_LINKS = [
  {
    id: 'soc-fb',
    label: 'صفحة الفيسبوك',
    url: 'https://www.facebook.com',
    color: '#1877F2'
  },
  {
    id: 'soc-wa-group',
    label: 'جروب الواتساب',
    url: 'https://chat.whatsapp.com',
    color: '#16A34A'
  }
];

const DEFAULT_STAGE_GRADES = {
  'المرحلة الابتدائية': [
    'الصف الرابع الابتدائي',
    'الصف الخامس الابتدائي',
    'الصف السادس الابتدائي'
  ],
  'المرحلة الإعدادية': [
    'الصف الأول الإعدادي',
    'الصف الثاني الإعدادي',
    'الصف الثالث الإعدادي'
  ],
  'المرحلة الثانوية': [
    'الصف الأول الثانوي',
    'الصف الثاني الثانوي',
    'الصف الثالث الثانوي'
  ]
};

const DEFAULT_ORDER_FIELDS = [
  {
    id: 'teacherName',
    label: 'اسم المعلم أو السنتر (كما سيُطبع على الغلاف)',
    placeholder: 'مثال: أ/ محمود شحاتة — سنتر العباقرة',
    type: 'text',
    required: true,
    enabled: true
  },
  {
    id: 'phone',
    label: 'رقم الهاتف / الواتساب (ليُطبع على المذكرة وللتواصل)',
    placeholder: '010xxxxxxxx',
    type: 'tel',
    required: true,
    enabled: true
  },
  {
    id: 'notes',
    label: 'ملاحظات إضافية للتصميم أو الألوان (اختياري)',
    placeholder: 'أي تفاصيل إضافية ترغب في إضافتها...',
    type: 'textarea',
    required: false,
    enabled: true
  }
];

const DEFAULT_SETTINGS = {
  brandName: 'منصة العباقرة للمذكرات التعليمية',
  brandTagline: 'مذكرات دراسية احترافية مخصصة باسمك وبياناتك الخاصة',
  logoUrl: '',
  logoSize: 56,
  heroBgImage: '',
  heroBgOpacity: 45,
  heroBgFit: 'cover',
  heroHeight: 520,
  heroBadge: 'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة اسم المعلم، رقم الهاتف، والشعار الخاص به على الغلاف وجميع الصفحات.',
  promoBannerText:
    '🎉 عرض خاص للمعلمين: خصم 15% على جميع مذكرات الترم الأول + إضافة الشعار مجانًا لفترة محدودة!',
  whatsappNumber: '201068481536',
  paymentInstructions: 'فودافون كاش / إنستاباي: 01068481536',
  socialLinks: DEFAULT_SOCIAL_LINKS,
  enableNextOrderReward: true,
  nextOrderDiscountPercent: 15,
  categories: [
    'مذكرات الترم الأول',
    'مذكرات الترم الثاني',
    'كورسات التأسيس',
    'مراجعات نهائية'
  ],
  stages: ['المرحلة الابتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية'],
  stageGrades: DEFAULT_STAGE_GRADES,
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
  subjects: [
    'اللغة العربية',
    'اللغة الإنجليزية',
    'الرياضيات',
    'العلوم',
    'الدراسات الاجتماعية',
    'الفيزياء',
    'الكيمياء',
    'الأحياء'
  ],
  orderFormFields: DEFAULT_ORDER_FIELDS,
  showLogoUploadField: true,
  logoFieldPosition: 'bottom',
  emptySectionTitle: 'جاري تجهيز أحدث المذكرات لهذا القسم قريبًا!',
  emptySectionText:
    'نعمل حاليًا على تنسيق ومراجعة مذكرات هذا القسم بأعلى جودة. يمكنك حجز مذكرتك مسبقًا أو التواصل معنا.',
  emptySectionButtonText: 'اطلب تجهيز مذكرتك الآن',
  emptySectionImage: ''
};

// ==========================================
// 3. Utility & Normalization Functions
// ==========================================
function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage write warning:', err);
  }
}

function extractStringList(arr, fallback) {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  const cleaned = arr
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && typeof item.name === 'string') {
        return item.name.trim();
      }
      return '';
    })
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeSettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const detectedLogo =
    src.logoUrl ||
    src.brandLogo ||
    src.logoData ||
    src.logo ||
    DEFAULT_SETTINGS.logoUrl;
  const detectedHeroBg =
    src.heroBgImage ||
    src.heroBgUrl ||
    src.heroBg ||
    src.heroImage ||
    DEFAULT_SETTINGS.heroBgImage;

  const stages = extractStringList(src.stages, DEFAULT_SETTINGS.stages);
  const grades = extractStringList(src.grades, DEFAULT_SETTINGS.grades);
  const rawStageGrades =
    src.stageGrades && typeof src.stageGrades === 'object' ? src.stageGrades : {};
  const normalizedStageGrades = {};
  stages.forEach((st) => {
    if (Array.isArray(rawStageGrades[st]) && rawStageGrades[st].length > 0) {
      normalizedStageGrades[st] = extractStringList(rawStageGrades[st], grades);
    } else if (DEFAULT_STAGE_GRADES[st]) {
      normalizedStageGrades[st] = DEFAULT_STAGE_GRADES[st];
    } else {
      normalizedStageGrades[st] = grades;
    }
  });

  return {
    ...DEFAULT_SETTINGS,
    ...src,
    logoUrl: detectedLogo,
    heroBgImage: detectedHeroBg,
    categories: extractStringList(src.categories, DEFAULT_SETTINGS.categories),
    stages,
    stageGrades: normalizedStageGrades,
    grades,
    subjects: extractStringList(src.subjects, DEFAULT_SETTINGS.subjects),
    socialLinks: Array.isArray(src.socialLinks) ? src.socialLinks : DEFAULT_SOCIAL_LINKS,
    orderFormFields:
      Array.isArray(src.orderFormFields) && src.orderFormFields.length > 0
        ? src.orderFormFields
        : DEFAULT_ORDER_FIELDS
  };
}

function normalizeNotebook(nb) {
  if (!nb || typeof nb !== 'object') return null;
  return {
    id: String(nb.id || 'nb-' + Date.now()),
    title: String(nb.title || 'مذكرة دراسية'),
    category:
      typeof nb.category === 'object'
        ? String(nb.category?.name || 'مذكرات الترم الأول')
        : String(nb.category || 'مذكرات الترم الأول'),
    stage:
      typeof nb.stage === 'object'
        ? String(nb.stage?.name || 'المرحلة الإعدادية')
        : String(nb.stage || 'المرحلة الإعدادية'),
    grade:
      typeof nb.grade === 'object'
        ? String(nb.grade?.name || 'الصف الأول الإعدادي')
        : String(nb.grade || 'الصف الأول الإعدادي'),
    subject:
      typeof nb.subject === 'object'
        ? String(nb.subject?.name || 'اللغة العربية')
        : String(nb.subject || 'اللغة العربية'),
    price: Number(nb.price) || 0,
    oldPrice: Number(nb.oldPrice) || 0,
    pages: Number(nb.pages) || 0,
    badge: String(nb.badge || ''),
    description: String(nb.description || ''),
    coverImage: String(nb.coverImage || ''),
    samplePages: Array.isArray(nb.samplePages) ? nb.samplePages.filter(Boolean) : [],
    driveUrl: String(nb.driveUrl || ''),
    isComingSoon: Boolean(nb.isComingSoon),
    isHidden: Boolean(nb.isHidden),
    createdAt: nb.createdAt || new Date().toISOString()
  };
}

function formatWhatsAppNumber(num) {
  const digits = String(num || '').replace(/\D/g, '');
  if (!digits) return '201068481536';
  if (digits.startsWith('01')) return '2' + digits;
  return digits;
}

function normalizePhone(num) {
  return String(num || '').replace(/\D/g, '');
}

function isValidEgyptPhone(num) {
  const clean = normalizePhone(num);
  return /^(010|011|012|015)\d{8}$/.test(clean) || /^201(0|1|2|5)\d{8}$/.test(clean);
}

function compressImageFile(file, maxWidth = 1280, quality = 0.84) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==========================================
// 4. Social Brand Icon Component
// ==========================================
function SocialBrandIcon({ url = '', label = '', className = 'w-5 h-5' }) {
  const target = `${url} ${label}`.toLowerCase();
  if (target.includes('whatsapp') || target.includes('واتس')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.41 1.3-1.96 1.38-.52.08-1.18.11-1.9-.12-.44-.14-1-.33-1.72-.64-3.03-1.31-5-4.36-5.15-4.56-.15-.2-1.23-1.64-1.23-3.13 0-1.49.78-2.22 1.06-2.52.28-.3.61-.38.81-.38.2 0 .41 0 .58.01.19.01.44-.07.69.53.25.61.86 2.1.94 2.25.08.15.13.33.03.53-.1.2-.15.33-.3.5-.15.18-.32.39-.45.53-.15.15-.31.31-.13.61.18.3.79 1.3 1.7 2.11 1.17 1.04 2.15 1.36 2.45 1.51.3.15.48.13.66-.08.18-.2.76-.88.96-1.18.2-.3.41-.25.68-.15.28.1 1.77.83 2.07.98.3.15.51.23.58.35.08.13.08.73-.16 1.41z" />
      </svg>
    );
  }
  if (target.includes('facebook') || target.includes('fb.com') || target.includes('فيس')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
      </svg>
    );
  }
  if (target.includes('t.me') || target.includes('telegram') || target.includes('تليجرام')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    );
  }
  if (target.includes('youtube') || target.includes('youtu.be') || target.includes('يوتيوب')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  return <ExternalLink className={className} />;
}

// ==========================================
// 5. Protected Sample Preview Modal (Mobile Touch-Friendly + Fullscreen Lightbox)
// ==========================================
function ProtectedPreviewModal({ notebook, settings, onClose, onOrder }) {
  const images = [notebook.coverImage, ...(notebook.samplePages || [])].filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const touchStartX = useRef(0);

  const goNext = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goPrev = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches.length === 1) {
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diff) > 55) {
        if (diff > 0) goPrev();
        else goNext();
      }
    }
  };

  if (isFullscreen && images.length > 0) {
    return (
      <div
        className="fixed inset-0 z-[60] bg-slate-950 flex flex-col select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 text-white border-b border-slate-800">
          <div className="text-xs font-bold">
            {notebook.title} ({currentIndex + 1} / {images.length})
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
            <span>تصغير</span>
          </button>
        </div>

        <div
          className="flex-1 relative flex items-center justify-center overflow-auto p-2"
          style={{ touchAction: 'pinch-zoom pan-x pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[currentIndex]}
            alt={notebook.title}
            draggable={false}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-15 -rotate-12">
            <span className="text-white text-2xl sm:text-4xl font-black tracking-widest">
              {settings.brandName} • نسخة معاينة
            </span>
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="fixed right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="fixed left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">{notebook.title}</h3>
            <p className="text-xs text-slate-500">
              تفاصيل ومعاينة المذكرة {notebook.pages ? `• ${notebook.pages} صفحة` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer"
                title="ملء الشاشة والتكبير"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Previewer with pan-y enabled so mobile vertical scroll always works */}
        <div className="p-4 sm:p-6 space-y-4">
          {images.length > 0 ? (
            <div
              className="relative rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center select-none"
              style={{ touchAction: 'pan-y pinch-zoom' }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={images[currentIndex]}
                alt={notebook.title}
                draggable={false}
                onClick={() => setIsFullscreen(true)}
                className="max-h-[52vh] w-auto object-contain cursor-zoom-in"
              />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20 -rotate-12">
                <span className="text-slate-900 text-lg sm:text-2xl font-black text-center px-4">
                  {settings.brandName} • نسخة معاينة
                </span>
              </div>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/75 text-white hover:bg-slate-900 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/75 text-white hover:bg-slate-900 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/75 text-white text-[11px] font-bold">
                    صفحة {currentIndex + 1} من {images.length} (اضغط للتكبير)
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
              لا توجد صور معاينة مرفوعة لهذه المذكرة بعد
            </div>
          )}

          {/* Description & Drive Link */}
          {notebook.description && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {notebook.description}
            </div>
          )}

          {notebook.driveUrl && (
            <a
              href={notebook.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-black transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>مطالعة عينة كاملة عبر Google Drive</span>
            </a>
          )}
        </div>

        {/* Sticky Footer CTA */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white sticky bottom-0 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onOrder}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg cursor-pointer transition"
          >
            اطلب هذه المذكرة باسمك الآن
          </button>
          <div className="text-left shrink-0">
            <div className="text-lg sm:text-xl font-black text-blue-700">{notebook.price} ج.م</div>
            {Number(notebook.oldPrice) > Number(notebook.price) && (
              <div className="text-xs text-slate-400 line-through">{notebook.oldPrice} ج.م</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. Social Hub Modal (Header Contact Popup)
// ==========================================
function SocialHubModal({ settings, onClose }) {
  const waNum = formatWhatsAppNumber(settings.whatsappNumber);
  const links = Array.isArray(settings.socialLinks) ? settings.socialLinks : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">تواصل مع {settings.brandName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">اختر وسيلة التواصل المناسبة لك</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <a
            href={`https://wa.me/${waNum}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <SocialBrandIcon url="whatsapp" className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">مراسلة مباشرة عبر واتساب</div>
                <div className="text-xs text-emerald-700 font-bold" dir="ltr">
                  +{waNum}
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-700" />
          </a>

          <a
            href={`tel:${settings.whatsappNumber}`}
            className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">اتصال هاتفي مباشر</div>
                <div className="text-xs text-blue-700 font-bold" dir="ltr">
                  {settings.whatsappNumber}
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-700" />
          </a>

          {links.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.color || '#2563EB' }}
                >
                  <SocialBrandIcon url={item.url} label={item.label} className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900">{item.label}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[210px]" dir="ltr">
                    {item.url}
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. Notebook Card Component
// ==========================================
function NotebookCard({ notebook, onPreview, onOrder }) {
  const hasDiscount = Number(notebook.oldPrice) > Number(notebook.price);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group">
      <div
        onClick={onPreview}
        className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer"
      >
        {notebook.coverImage ? (
          <img
            src={notebook.coverImage}
            alt={notebook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <BookOpen className="w-10 h-10" />
            <span className="text-xs font-bold">معاينة المذكرة</span>
          </div>
        )}

        {notebook.badge && (
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-black shadow-md">
            {notebook.badge}
          </span>
        )}

        {notebook.isComingSoon && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black shadow-md">
            قريبًا • حجز مسبق
          </span>
        )}

        {Number(notebook.pages) > 0 && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-slate-900/80 text-white text-[11px] font-bold">
            {notebook.pages} صفحة
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-500">
            {notebook.category} • {notebook.grade}
          </div>
          <h3
            onClick={onPreview}
            className="text-base font-black text-slate-900 group-hover:text-blue-700 transition cursor-pointer line-clamp-2"
          >
            {notebook.title}
          </h3>
          {notebook.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {notebook.description}
            </p>
          )}
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-blue-700">{notebook.price} ج.م</span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">{notebook.oldPrice} ج.م</span>
              )}
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-extrabold">
              {notebook.subject}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPreview}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>معاينة</span>
            </button>
            <button
              type="button"
              onClick={onOrder}
              className={`py-2.5 px-3 rounded-xl text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                notebook.isComingSoon
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{notebook.isComingSoon ? 'أضف للحجز' : 'أضف للسلة'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. Multi-Notebook Cart & Order Modal + Single-Use Personal Coupons
// ==========================================
function OrderModal({
  cartItems = [],
  allNotebooks = [],
  settings,
  coupons,
  onAddMoreNotebook,
  onRemoveCartItem,
  onClearCart,
  onClose,
  onSubmitOrder,
  showToast
}) {
  const [formValues, setFormValues] = useState({});
  const [logoPreview, setLogoPreview] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [generatedRewardCode, setGeneratedRewardCode] = useState('');

  const enabledFields = (settings.orderFormFields || DEFAULT_ORDER_FIELDS).filter((f) => f.enabled);
  const isCustomOnly = cartItems.length === 0;
  const basePrice = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const discountAmount = appliedCoupon
    ? Math.round((basePrice * Number(appliedCoupon.discountPercent || 0)) / 100)
    : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const availableToAdd = allNotebooks.filter(
    (nb) => !nb.isHidden && !cartItems.some((c) => c.id === nb.id)
  );

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = coupons.find((c) => String(c.code).toUpperCase() === code);
    if (!found || !found.active) {
      showToast('كود الخصم غير صحيح أو منتهي الصلاحية', 'error');
      setAppliedCoupon(null);
      return;
    }
    if (found.singleUse && found.used) {
      showToast('عذرًا، هذا الكود الشخصي تم استخدامه من قبل ولم يعد صالحًا', 'error');
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(found);
    showToast(`تم تطبيق خصم ${found.discountPercent}% بنجاح!`);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 450, 0.8);
      setLogoPreview(compressed);
      showToast('تم إرفاق الشعار بنجاح');
    } catch {
      showToast('تعذر قراءة ملف الشعار', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const field of enabledFields) {
      const val = String(formValues[field.id] || '').trim();
      if (field.required && !val) {
        showToast(`يرجى ملء حقل: ${field.label}`, 'error');
        return;
      }
      if (field.type === 'tel' && val && !isValidEgyptPhone(val)) {
        showToast(`يرجى إدخال رقم هاتف مصري صحيح في: ${field.label}`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const orderCode = 'MZ-' + Math.floor(100000 + Math.random() * 900000);
      const teacherPhone = normalizePhone(formValues.phone || '');
      const titlesSummary = isCustomOnly
        ? 'طلب إعداد مذكرة خاصة'
        : cartItems.map((i) => `${i.title} (${i.price} ج.م)`).join(' + ');

      let nextCoupon = null;
      if (settings.enableNextOrderReward !== false && !isCustomOnly) {
        const rewardPct = Number(settings.nextOrderDiscountPercent) || 15;
        const uniqueCode = 'NEXT-' + Math.floor(10000 + Math.random() * 90000);
        nextCoupon = {
          id: 'cp-reward-' + Date.now(),
          code: uniqueCode,
          discountPercent: rewardPct,
          description: `هدية الطلب التالي (${rewardPct}%) للعميل ${formValues.teacherName || teacherPhone}`,
          active: true,
          singleUse: true,
          used: false,
          assignedPhone: teacherPhone,
          issuedFromOrder: orderCode,
          isPrivate: true
        };
      }

      const orderRecord = {
        id: orderCode,
        orderCode,
        notebookId: isCustomOnly ? 'custom' : cartItems.map((i) => i.id).join(','),
        notebookTitle: titlesSummary,
        items: cartItems.map((i) => ({ id: i.id, title: i.title, price: i.price })),
        teacherName: formValues.teacherName || Object.values(formValues)[0] || 'معلم',
        phone: teacherPhone,
        fields: formValues,
        hasLogo: Boolean(logoPreview),
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        finalPrice,
        rewardCouponCode: nextCoupon ? nextCoupon.code : '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await onSubmitOrder(orderRecord, appliedCoupon, nextCoupon);

      const waNum = formatWhatsAppNumber(settings.whatsappNumber);
      const detailsLines = enabledFields
        .map((f) => `• ${f.label}: ${formValues[f.id] || '—'}`)
        .join('\n');
      const itemsLines = isCustomOnly
        ? '• طلب إعداد مذكرة خاصة'
        : cartItems.map((item, idx) => `${idx + 1}. ${item.title} — ${item.price} ج.م`).join('\n');

      const msg = [
        `السلام عليكم، أرغب في طلب تخصيص مذكرات من *${settings.brandName}*`,
        `رقم الطلب: *${orderCode}*`,
        `المذكرات المطلوبة (${cartItems.length || 1}):`,
        itemsLines,
        !isCustomOnly ? `الإجمالي النهائي: *${finalPrice} ج.م*` : '',
        appliedCoupon
          ? `كود الخصم المستخدم: *${appliedCoupon.code}* (-${appliedCoupon.discountPercent}%)`
          : '',
        detailsLines,
        logoPreview ? '• الشعار: مرفق (سأرسله هنا في المحادثة)' : '',
        nextCoupon
          ? `🎁 كود هديتي للطلب القادم (خصم ${nextCoupon.discountPercent}% لمرة واحدة): *${nextCoupon.code}*`
          : ''
      ]
        .filter(Boolean)
        .join('\n');

      window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');

      if (nextCoupon) {
        setGeneratedRewardCode(nextCoupon.code);
        onClearCart?.();
      } else {
        onClearCart?.();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderLogoBlock = () => {
    if (settings.showLogoUploadField === false) return null;
    return (
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
        <label className="block text-xs font-black text-blue-950">
          شعار المعلم أو السنتر (اختياري — لوضعه على الغلاف والصفحات)
        </label>
        <div className="flex items-center gap-3">
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo"
              className="w-12 h-12 rounded-xl object-contain bg-white border border-blue-200 p-1"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="text-xs text-slate-600 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-bold cursor-pointer"
          />
        </div>
      </div>
    );
  };

  if (generatedRewardCode) {
    return (
      <div
        className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl max-w-md w-full p-7 border border-slate-200 shadow-2xl text-center space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-slate-900">تم تأكيد طلبك بنجاح!</h3>
            <p className="text-xs text-slate-500">
              تقديرًا لتعاملك معنا، حصلت على كود خصم خاص بك فقط لمرة واحدة في طلبك القادم:
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-400 space-y-1">
            <div className="text-[11px] font-bold text-amber-800">
              كود الخصم الشخصي ({settings.nextOrderDiscountPercent || 15}% — صالح لمرة واحدة)
            </div>
            <div className="font-mono text-2xl font-black text-slate-900 tracking-wider">
              {generatedRewardCode}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(generatedRewardCode);
                showToast('تم نسخ كود الخصم الشخصي');
              }}
              className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>نسخ الكود</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {isCustomOnly ? 'طلب إعداد مذكرة خاصة' : `سلة طلباتك (${cartItems.length} مذكرة)`}
            </h3>
            <p className="text-xs text-blue-700 font-bold mt-0.5">
              يمكنك إضافة أكثر من مذكرة في نفس الطلب وتخصيصها جميعًا باسمك
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCustomOnly && (
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800">المذكرات المضافة للطلب:</span>
              {availableToAdd.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddPicker((v) => !v)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مذكرة أخرى للطلب</span>
                </button>
              )}
            </div>

            {showAddPicker && availableToAdd.length > 0 && (
              <div className="p-3 rounded-xl bg-white border border-blue-200 space-y-2 max-h-44 overflow-y-auto">
                <div className="text-[11px] font-bold text-blue-800">اختر مذكرة لإضافتها للسلة:</div>
                {availableToAdd.map((nb) => (
                  <div
                    key={nb.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50 border border-slate-100"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{nb.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {nb.grade} • {nb.subject} • {nb.price} ج.م
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onAddMoreNotebook?.(nb);
                        setShowAddPicker(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-black shrink-0 cursor-pointer"
                    >
                      + إضافة
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">{item.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {item.grade} • <span className="text-blue-700 font-bold">{item.price} ج.م</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveCartItem?.(item.id)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer shrink-0"
                    title="إزالة من السلة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {settings.logoFieldPosition === 'top' && renderLogoBlock()}

          {enabledFields.map((field, index) => (
            <React.Fragment key={field.id}>
              {settings.logoFieldPosition === 'middle' &&
                index === Math.floor(enabledFields.length / 2) &&
                renderLogoBlock()}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  {field.label} {field.required && <span className="text-rose-600">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    placeholder={field.placeholder}
                    value={formValues[field.id] || ''}
                    onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-hidden"
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={formValues[field.id] || ''}
                    onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-hidden"
                  />
                )}
              </div>
            </React.Fragment>
          ))}

          {(settings.logoFieldPosition === 'bottom' || !settings.logoFieldPosition) &&
            renderLogoBlock()}

          {!isCustomOnly && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="لديك كود خصم أو كود مكافأة؟ أدخله هنا..."
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer"
                >
                  تطبيق
                </button>
              </div>
              {appliedCoupon && (
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  ✓ تم تفعيل كود {appliedCoupon.code} (خصم {appliedCoupon.discountPercent}%)
                  {appliedCoupon.singleUse ? ' • كود شخصي لمرة واحدة' : ''}
                </div>
              )}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-600">
                  الإجمالي المطلوب ({cartItems.length} مذكرة):
                </span>
                <div className="flex items-baseline gap-2">
                  {discountAmount > 0 && (
                    <span className="text-xs text-slate-400 line-through">{basePrice} ج.م</span>
                  )}
                  <span className="text-lg font-black text-blue-700">{finalPrice} ج.م</span>
                </div>
              </div>
              {settings.paymentInstructions && (
                <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                  💳 <strong>بيانات الدفع:</strong> {settings.paymentInstructions}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{submitting ? 'جاري تسجيل الطلب...' : 'تأكيد الطلب والمتابعة عبر واتساب'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 9. Public Pages (Home, Hierarchical Folder Catalog, Offers, Track, Contact)
// ==========================================
function HomePage({
  settings,
  notebooks,
  onBrowseCatalog,
  onSelectCategory,
  onOrderCustom,
  onPreviewNotebook,
  onOrderNotebook
}) {
  const visibleNotebooks = notebooks.filter((n) => !n.isHidden);
  const featured = visibleNotebooks.slice(0, 6);
  const overlayOpacity = Math.min(95, Math.max(10, Number(settings.heroBgOpacity ?? 45))) / 100;

  return (
    <div className="space-y-14 pb-16">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden bg-slate-950 text-white flex items-center"
        style={{ minHeight: `${Number(settings.heroHeight) || 520}px` }}
      >
        {settings.heroBgImage && (
          <img
            src={settings.heroBgImage}
            alt="Hero Background"
            className={`absolute inset-0 w-full h-full ${
              settings.heroBgFit === 'contain' ? 'object-contain' : 'object-cover'
            }`}
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/90 to-blue-950/85"
          style={{ opacity: settings.heroBgImage ? 1 - overlayOpacity * 0.45 : 1 }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 text-right">
            {settings.heroBadge && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-extrabold">
                <Sparkles className="w-4 h-4" />
                <span>{settings.heroBadge}</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
              {settings.heroTitle}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              {settings.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onBrowseCatalog}
                className="px-7 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-600/25 transition cursor-pointer"
              >
                تصفح مكتبة المذكرات
              </button>
              <button
                type="button"
                onClick={onOrderCustom}
                className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-extrabold text-sm transition cursor-pointer"
              >
                اطلب إعداد مذكرة خاصة
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                <Shield className="w-5 h-5" />
                <span>لماذا يثق بنا المعلمون؟</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>محتوى علمي منقح ومطابق لأحدث مواصفات الوزارة</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>وضع اسم المعلم ورقم الهاتف والشعار على جميع الصفحات</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>معاينة حقيقية لصفحات المذكرة قبل تأكيد الطلب</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تسليم سريع بصيغة PDF عالية الدقة جاهزة للطباعة</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Main Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            الأقسام الرئيسية للمذكرات والكورسات
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            اختر القسم المناسب لتصفح مجلدات المراحل والصفوف الدراسية
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(settings.categories || []).map((cat, idx) => {
            const count = visibleNotebooks.filter((n) => n.category === cat).length;
            return (
              <button
                key={cat + idx}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className="group p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-xl transition-all text-right flex flex-col justify-between gap-6 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-extrabold">
                    {count > 0 ? `${count} مذكرة` : 'تصفح القسم'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition">
                    {cat}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    افتح المجلدات الدراسية الخاصة بـ {cat}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Notebooks */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">أحدث المذكرات المضافة</h2>
              <p className="text-xs text-slate-500 mt-1">
                يمكنك معاينة الصفحات وإضافة أكثر من مذكرة إلى سلة الطلبات
              </p>
            </div>
            <button
              type="button"
              onClick={onBrowseCatalog}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer"
            >
              عرض الكل
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                onPreview={() => onPreviewNotebook(nb)}
                onOrder={() => onOrderNotebook(nb)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CatalogPage({
  notebooks,
  settings,
  navState,
  onUpdateNavState,
  onPreviewNotebook,
  onOrderNotebook,
  onOrderCustom
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const visibleNotebooks = notebooks.filter((n) => !n.isHidden);

  const selectedCategory = navState.category || 'all';
  const selectedStage = navState.stage || 'all';
  const selectedGrade = navState.grade || 'all';
  const selectedSubject = navState.subject || 'all';

  const isSearching = searchQuery.trim().length > 0;

  // Filtered notebooks when inside a specific grade folder or searching
  const filteredNotebooks = visibleNotebooks.filter((nb) => {
    if (selectedCategory !== 'all' && nb.category !== selectedCategory) return false;
    if (selectedStage !== 'all' && nb.stage !== selectedStage) return false;
    if (selectedGrade !== 'all' && nb.grade !== selectedGrade) return false;
    if (selectedSubject !== 'all' && nb.subject !== selectedSubject) return false;
    if (isSearching) {
      const q = searchQuery.trim().toLowerCase();
      return (
        nb.title.toLowerCase().includes(q) ||
        nb.grade.toLowerCase().includes(q) ||
        nb.subject.toLowerCase().includes(q) ||
        nb.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Determine hierarchical folder level
  // Level 0: All Categories (when category === 'all')
  // Level 1: Stages inside selected Category (when category !== 'all' && stage === 'all')
  // Level 2: Grades inside selected Stage (when stage !== 'all' && grade === 'all')
  // Level 3: Notebooks inside selected Grade (when grade !== 'all')
  const stageGradesList =
    selectedStage !== 'all'
      ? settings.stageGrades?.[selectedStage] || settings.grades || []
      : [];

  const handleStepBack = () => {
    if (selectedGrade !== 'all') {
      onUpdateNavState({
        category: selectedCategory,
        stage: selectedStage,
        grade: 'all',
        subject: 'all'
      });
    } else if (selectedStage !== 'all') {
      onUpdateNavState({
        category: selectedCategory,
        stage: 'all',
        grade: 'all',
        subject: 'all'
      });
    } else if (selectedCategory !== 'all') {
      onUpdateNavState({
        category: 'all',
        stage: 'all',
        grade: 'all',
        subject: 'all'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Bar & Breadcrumbs */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث مباشرة باسم المذكرة، المادة، أو الصف الدراسي..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:border-blue-600 focus:bg-white outline-hidden"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-slate-200 text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hierarchical Breadcrumb Path */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
            <button
              type="button"
              onClick={() =>
                onUpdateNavState({ category: 'all', stage: 'all', grade: 'all', subject: 'all' })
              }
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              جميع الأقسام
            </button>

            {selectedCategory !== 'all' && (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNavState({
                      category: selectedCategory,
                      stage: 'all',
                      grade: 'all',
                      subject: 'all'
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition ${
                    selectedStage === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {selectedCategory}
                </button>
              </>
            )}

            {selectedStage !== 'all' && (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNavState({
                      category: selectedCategory,
                      stage: selectedStage,
                      grade: 'all',
                      subject: 'all'
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition ${
                    selectedGrade === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {selectedStage}
                </button>
              </>
            )}

            {selectedGrade !== 'all' && (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white">
                  {selectedGrade}
                </span>
              </>
            )}
          </div>

          {selectedCategory !== 'all' && !isSearching && (
            <button
              type="button"
              onClick={handleStepBack}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>رجوع خطوة</span>
            </button>
          )}
        </div>
      </div>

      {/* Direct Search Results */}
      {isSearching ? (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500">
            نتائج البحث عن «{searchQuery}» ({filteredNotebooks.length} مذكرة)
          </div>
          {filteredNotebooks.length > 0 ? (
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
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
              <p className="text-base font-black text-slate-800">لا توجد مذكرات مطابقة لبحثك</p>
              <button
                type="button"
                onClick={onOrderCustom}
                className="px-6 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black cursor-pointer"
              >
                اطلب تجهيزها الآن
              </button>
            </div>
          )}
        </div>
      ) : selectedCategory === 'all' ? (
        /* LEVEL 0: Category Folders */
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900">اختر القسم الرئيسي:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(settings.categories || []).map((cat) => {
              const count = visibleNotebooks.filter((n) => n.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    onUpdateNavState({ category: cat, stage: 'all', grade: 'all', subject: 'all' })
                  }
                  className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-lg transition text-right flex flex-col justify-between gap-5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition">
                      <Folder className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black">
                      {count} مذكرة
                    </span>
                  </div>
                  <div>
                    <div className="text-base font-black text-slate-900">{cat}</div>
                    <div className="text-xs text-slate-500 mt-1">اضغط لفتح مجلدات المراحل</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : selectedStage === 'all' ? (
        /* LEVEL 1: Stage Folders inside Category */
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900">
            مجلدات المراحل الدراسية داخل «{selectedCategory}»:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(settings.stages || []).map((stage) => {
              const count = visibleNotebooks.filter(
                (n) => n.category === selectedCategory && n.stage === stage
              ).length;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() =>
                    onUpdateNavState({
                      category: selectedCategory,
                      stage,
                      grade: 'all',
                      subject: 'all'
                    })
                  }
                  className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-amber-500 shadow-xs hover:shadow-lg transition text-right flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 group-hover:bg-amber-500 text-amber-600 group-hover:text-white flex items-center justify-center transition shrink-0">
                      <FolderOpen className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900">{stage}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {count > 0 ? `${count} مذكرة متاحة` : 'افتح مجلدات الصفوف'}
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-amber-600" />
                </button>
              );
            })}
          </div>
        </div>
      ) : selectedGrade === 'all' ? (
        /* LEVEL 2: Grade Folders inside Stage */
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900">
            صفوف «{selectedStage}» في «{selectedCategory}»:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {stageGradesList.map((grade) => {
              const count = visibleNotebooks.filter(
                (n) =>
                  n.category === selectedCategory &&
                  n.stage === selectedStage &&
                  n.grade === grade
              ).length;
              return (
                <button
                  key={grade}
                  type="button"
                  onClick={() =>
                    onUpdateNavState({
                      category: selectedCategory,
                      stage: selectedStage,
                      grade,
                      subject: 'all'
                    })
                  }
                  className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-lg transition text-right flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center transition shrink-0">
                      <Folder className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900">{grade}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {count > 0 ? `${count} مذكرة داخل الملف` : 'اضغط لفتح الملف'}
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* LEVEL 3: Notebooks inside selected Grade */
        <div className="space-y-6">
          {/* Optional Subject Filter inside Grade */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdateNavState({
                  category: selectedCategory,
                  stage: selectedStage,
                  grade: selectedGrade,
                  subject: 'all'
                })
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer ${
                selectedSubject === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              كل المواد
            </button>
            {(settings.subjects || []).map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() =>
                  onUpdateNavState({
                    category: selectedCategory,
                    stage: selectedStage,
                    grade: selectedGrade,
                    subject: subj
                  })
                }
                className={`px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {filteredNotebooks.length > 0 ? (
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
          ) : (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center max-w-2xl mx-auto space-y-4">
              {settings.emptySectionImage && (
                <img
                  src={settings.emptySectionImage}
                  alt="Empty section"
                  className="max-h-52 mx-auto rounded-2xl object-contain"
                />
              )}
              <h3 className="text-xl font-black text-slate-900">
                {settings.emptySectionTitle || 'جاري تجهيز أحدث المذكرات لهذا الصف قريبًا!'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {settings.emptySectionText}
              </p>
              <button
                type="button"
                onClick={onOrderCustom}
                className="px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer"
              >
                {settings.emptySectionButtonText || 'اطلب تجهيز مذكرتك الآن'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OffersPage({ coupons, notebooks, onPreviewNotebook, onOrderNotebook, showToast }) {
  const [copiedId, setCopiedId] = useState('');
  const activeCoupons = coupons.filter((c) => c.active && !c.isPrivate && !c.singleUse);
  const discountedNotebooks = notebooks.filter(
    (n) => !n.isHidden && Number(n.oldPrice) > Number(n.price)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          العروض الحصرية وكوبونات الخصم
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          استفد من أكواد الخصم النشطة والعروض المخفضة على المذكرات
        </p>
      </div>

      {activeCoupons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeCoupons.map((cp) => (
            <div
              key={cp.id}
              className="bg-white rounded-3xl p-6 border-2 border-dashed border-blue-300 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  خصم {cp.discountPercent}%
                </span>
                <h3 className="text-base font-black text-slate-900">{cp.description}</h3>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-mono text-base font-black text-blue-700">{cp.code}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(cp.code);
                    setCopiedId(cp.id);
                    showToast(`تم نسخ الكود: ${cp.code}`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold cursor-pointer"
                >
                  {copiedId === cp.id ? 'تم النسخ ✓' : 'نسخ الكود'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {discountedNotebooks.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900">مذكرات عليها خصومات حاليًا</h2>
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
      ) : (
        activeCoupons.length === 0 && (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-500 text-sm">
            ترقبوا أقوى العروض والباقات المخفضة قريبًا!
          </div>
        )
      )}
    </div>
  );
}

function TrackOrderPage({ orders }) {
  const [query, setQuery] = useState('');
  const cleanQ = query.trim().toLowerCase();

  const matches = cleanQ
    ? orders.filter(
        (o) =>
          String(o.orderCode || '')
            .toLowerCase()
            .includes(cleanQ) ||
          normalizePhone(o.phone).includes(normalizePhone(cleanQ))
      )
    : [];

  const statusMap = {
    pending: { label: 'قيد المراجعة والتجهيز', cls: 'bg-amber-100 text-amber-800' },
    in_progress: { label: 'جاري التصميم ووضع بياناتك', cls: 'bg-blue-100 text-blue-800' },
    completed: { label: 'تم التسليم بنجاح', cls: 'bg-emerald-100 text-emerald-800' }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-5 text-center">
        <h1 className="text-2xl font-black text-slate-900">تتبع حالة طلبك</h1>
        <p className="text-xs text-slate-500">
          أدخل رقم الطلب (مثال: MZ-123456) أو رقم الهاتف المسجل في الطلب
        </p>
        <input
          type="text"
          placeholder="رقم الطلب أو رقم الهاتف..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-center font-bold focus:border-blue-600 focus:bg-white outline-hidden"
        />
      </div>

      {cleanQ && (
        <div className="space-y-4">
          {matches.length > 0 ? (
            matches.map((ord) => {
              const st = statusMap[ord.status] || statusMap.pending;
              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-base font-black text-blue-700">
                      {ord.orderCode}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{ord.notebookTitle}</div>
                  <div className="text-xs text-slate-500">
                    باسم: {ord.teacherName} • الإجمالي: {ord.finalPrice} ج.م
                  </div>
                  {ord.rewardCouponCode && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                      🎁 كود هديتك للطلب التالي: <span className="font-mono">{ord.rewardCouponCode}</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-xs text-slate-500">
              لم يتم العثور على طلبات مطابقة لهذا الرقم
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContactPage({ settings }) {
  const waNum = formatWhatsAppNumber(settings.whatsappNumber);
  const links = Array.isArray(settings.socialLinks) ? settings.socialLinks : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            تواصل مع فريق {settings.brandName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            نسعد بالرد على جميع استفسارات المعلمين وطلبات التخصيص الخاصة على مدار اليوم
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href={`https://wa.me/${waNum}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
          >
            <div>
              <div className="text-sm font-black text-slate-900">مراسلة مباشرة عبر واتساب</div>
              <div className="text-xs text-emerald-700 font-bold mt-1" dir="ltr">
                +{waNum}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
              <SocialBrandIcon url="whatsapp" className="w-6 h-6" />
            </div>
          </a>

          <a
            href={`tel:${settings.whatsappNumber}`}
            className="flex items-center justify-between p-5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
          >
            <div>
              <div className="text-sm font-black text-slate-900">الاتصال الهاتفي بخدمة العملاء</div>
              <div className="text-xs text-blue-700 font-bold mt-1" dir="ltr">
                {settings.whatsappNumber}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
          </a>

          {links.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
            >
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900">{item.label}</div>
                <div className="text-xs text-slate-500 truncate max-w-[220px] mt-1" dir="ltr">
                  {item.url}
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0"
                style={{ backgroundColor: item.color || '#2563EB' }}
              >
                <SocialBrandIcon url={item.url} label={item.label} className="w-6 h-6" />
              </div>
            </a>
          ))}
        </div>

        {settings.paymentInstructions && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="font-black text-slate-900">بيانات الدفع والتحويل المعتمدة:</div>
            <div>{settings.paymentInstructions}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 10. Admin Portal (Full Controls + Taxonomy + Stage-Grades + Single-Use Coupons)
// ==========================================
function AdminPortal({
  adminUser,
  settings,
  notebooks,
  orders,
  coupons,
  onSaveSettings,
  onSaveNotebook,
  onDeleteNotebook,
  onToggleNotebookVisibility,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSaveCoupon,
  onDeleteCoupon,
  onImportBackup,
  onCloseAdmin,
  showToast
}) {
  const [email, setEmail] = useState('mahmoudelzaaty7@gmail.com');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notebooks');
  const [draftSettings, setDraftSettings] = useState(() => normalizeSettings(settings));

  useEffect(() => {
    setDraftSettings(normalizeSettings(settings));
  }, [settings]);

  // Notebook Form State
  const [editingNbId, setEditingNbId] = useState(null);
  const [nbForm, setNbForm] = useState({
    title: '',
    category: draftSettings.categories[0] || 'مذكرات الترم الأول',
    stage: draftSettings.stages[0] || 'المرحلة الابتدائية',
    grade:
      (draftSettings.stageGrades?.[draftSettings.stages[0]] || draftSettings.grades)[0] ||
      'الصف الرابع الابتدائي',
    subject: draftSettings.subjects[0] || 'اللغة العربية',
    price: 150,
    oldPrice: 200,
    pages: 80,
    badge: '',
    description: '',
    coverImage: '',
    samplePages: [],
    driveUrl: '',
    isComingSoon: false,
    isHidden: false
  });

  // Coupon Form State
  const [cpForm, setCpForm] = useState({
    code: '',
    discountPercent: 15,
    description: '',
    singleUse: false
  });

  // Taxonomy & Stage-Grades Controls State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [selectedStageForGrades, setSelectedStageForGrades] = useState(
    draftSettings.stages[0] || 'المرحلة الابتدائية'
  );
  const [newGradeForStage, setNewGradeForStage] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  // Social Link Form State
  const [newSocialLabel, setNewSocialLabel] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialColor, setNewSocialColor] = useState('#1877F2');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!auth) {
      showToast('خدمة المصادقة غير متوفرة حاليًا', 'error');
      return;
    }
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast('تم تسجيل الدخول إلى لوحة التحكم بنجاح');
    } catch (err) {
      showToast(`تعذر تسجيل الدخول: تأكد من البريد وكلمة المرور (${err.code || ''})`, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showToast('اكتب بريدك الإلكتروني أولًا', 'error');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      showToast('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
    } catch (err) {
      showToast(`تعذر إرسال الرابط: ${err.message}`, 'error');
    }
  };

  const moveItem = (arr, index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= arr.length) return arr;
    const copy = [...arr];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
  };

  // Login Modal if not authenticated
  if (!adminUser) {
    return (
      <div
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={onCloseAdmin}
      >
        <div
          className="bg-white rounded-3xl max-w-md w-full p-7 border border-slate-200 shadow-2xl space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">بوابة إدارة المنصة</h2>
                <p className="text-[11px] text-slate-500">تسجيل دخول المدير المعتمد</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseAdmin}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800">
                البريد الإلكتروني للإدارة
              </label>
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-left"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800">كلمة المرور</label>
              <input
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-left"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm cursor-pointer transition"
            >
              {authLoading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}
            </button>

            <button
              type="button"
              onClick={handleResetPassword}
              className="w-full text-center text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              نسيت كلمة المرور؟ إرسال رابط الاستعادة لبريدي
            </button>
          </form>
        </div>
      </div>
    );
  }

  const availableGradesForNbForm =
    draftSettings.stageGrades?.[nbForm.stage] || draftSettings.grades || [];
  const currentStageGradesList = draftSettings.stageGrades?.[selectedStageForGrades] || [];

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Admin Top Header */}
      <div className="bg-slate-950 text-white px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-black">
              لوحة تحكم {settings.brandName}
            </div>
            <div className="text-[11px] text-slate-400">{adminUser.email}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            متصل بالسحابة
          </span>
          <button
            type="button"
            onClick={onCloseAdmin}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-black cursor-pointer"
          >
            معاينة الموقع
          </button>
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 w-fit">
          {[
            { id: 'orders', label: `الطلبات (${orders.length})` },
            { id: 'notebooks', label: `المذكرات (${notebooks.length})` },
            { id: 'coupons', label: 'العروض والكوبونات' },
            { id: 'taxonomy', label: 'الأقسام والمراحل والصفوف' },
            { id: 'settings', label: 'إعدادات الموقع' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-500 text-sm">
                لا توجد طلبات مسجلة حتى الآن
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-black text-blue-700">
                        {ord.orderCode}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        • {ord.teacherName} ({ord.phone})
                      </span>
                      {ord.rewardCouponCode && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                          هدية الطلب التالي: {ord.rewardCouponCode}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-black text-slate-900">{ord.notebookTitle}</div>
                    <div className="text-xs text-slate-600">
                      الإجمالي: <strong>{ord.finalPrice} ج.م</strong>
                      {ord.couponCode ? ` • كوبون مستخدم: ${ord.couponCode}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={ord.status || 'pending'}
                      onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                    >
                      <option value="pending">قيد المراجعة</option>
                      <option value="in_progress">جاري التصميم</option>
                      <option value="completed">تم التسليم</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => onDeleteOrder(ord.id)}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: NOTEBOOKS */}
        {activeTab === 'notebooks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">
                  {editingNbId ? 'تعديل بيانات المذكرة' : 'إضافة مذكرة جديدة'}
                </h3>
                {editingNbId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNbId(null);
                      setNbForm({
                        ...nbForm,
                        title: '',
                        badge: '',
                        description: '',
                        coverImage: '',
                        samplePages: [],
                        driveUrl: ''
                      });
                    }}
                    className="text-xs font-bold text-rose-600 cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!nbForm.title.trim()) return;
                  const payload = {
                    ...nbForm,
                    id: editingNbId || 'nb-' + Date.now(),
                    price: Number(nbForm.price) || 0,
                    oldPrice: Number(nbForm.oldPrice) || 0,
                    pages: Number(nbForm.pages) || 0,
                    createdAt: new Date().toISOString()
                  };
                  await onSaveNotebook(payload);
                  setEditingNbId(null);
                  setNbForm({
                    ...nbForm,
                    title: '',
                    badge: '',
                    description: '',
                    coverImage: '',
                    samplePages: [],
                    driveUrl: ''
                  });
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  required
                  placeholder="عنوان المذكرة..."
                  value={nbForm.title}
                  onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={nbForm.category}
                    onChange={(e) => setNbForm({ ...nbForm, category: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    {draftSettings.categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={nbForm.stage}
                    onChange={(e) => {
                      const nextStage = e.target.value;
                      const stageGrd =
                        draftSettings.stageGrades?.[nextStage] || draftSettings.grades || [];
                      setNbForm({
                        ...nbForm,
                        stage: nextStage,
                        grade: stageGrd[0] || ''
                      });
                    }}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    {draftSettings.stages.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={nbForm.grade}
                    onChange={(e) => setNbForm({ ...nbForm, grade: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    {availableGradesForNbForm.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>

                  <select
                    value={nbForm.subject}
                    onChange={(e) => setNbForm({ ...nbForm, subject: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    {draftSettings.subjects.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      السعر الحالي
                    </label>
                    <input
                      type="number"
                      value={nbForm.price}
                      onChange={(e) => setNbForm({ ...nbForm, price: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      قبل الخصم
                    </label>
                    <input
                      type="number"
                      value={nbForm.oldPrice}
                      onChange={(e) => setNbForm({ ...nbForm, oldPrice: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      الصفحات
                    </label>
                    <input
                      type="number"
                      value={nbForm.pages}
                      onChange={(e) => setNbForm({ ...nbForm, pages: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="شارة التميز (مثال: الأكثر طلبًا / عرض خاص)"
                  value={nbForm.badge}
                  onChange={(e) => setNbForm({ ...nbForm, badge: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                />

                <textarea
                  rows={3}
                  placeholder="وصف المذكرة ومميزاتها..."
                  value={nbForm.description}
                  onChange={(e) => setNbForm({ ...nbForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                />

                <label className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(nbForm.isComingSoon)}
                    onChange={(e) => setNbForm({ ...nbForm, isComingSoon: e.target.checked })}
                  />
                  <span>المذكرة لم تكتمل بعد (وضع إعلان «قريبًا / حجز مسبق»)</span>
                </label>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    رابط Google Drive لمطالعة نسخة المذكرة (اختياري)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://drive.google.com/..."
                    value={nbForm.driveUrl}
                    onChange={(e) => setNbForm({ ...nbForm, driveUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-left"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      صورة غلاف المذكرة
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const dataUrl = await compressImageFile(file, 900, 0.85);
                          setNbForm((prev) => ({ ...prev, coverImage: dataUrl }));
                          showToast('تم تجهيز صورة الغلاف');
                        } catch {
                          showToast('تعذر معالجة صورة الغلاف', 'error');
                        }
                      }}
                      className="text-[11px] text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      صور صفحات عينة المعاينة (حتى 15 صفحة HD)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []).slice(0, 15);
                        if (!files.length) return;
                        try {
                          const processed = [];
                          for (const f of files) {
                            const dataUrl = await compressImageFile(f, 1300, 0.86);
                            processed.push(dataUrl);
                          }
                          setNbForm((prev) => ({ ...prev, samplePages: processed }));
                          showToast(`تم تجهيز ${processed.length} صفحة معاينة عالية الدقة`);
                        } catch {
                          showToast('تعذر معالجة صور العينات', 'error');
                        }
                      }}
                      className="text-[11px] text-slate-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer transition"
                >
                  {editingNbId ? 'حفظ التعديلات' : '+ إضافة المذكرة'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {notebooks.map((nb) => (
                <div
                  key={nb.id}
                  className={`bg-white rounded-2xl p-4 border flex items-center justify-between gap-3 ${
                    nb.isHidden ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-900 truncate">{nb.title}</span>
                      {nb.isHidden && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">
                          مخفية عن الزوار
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {nb.category} • {nb.stage} • {nb.grade} •{' '}
                      <strong className="text-blue-700">{nb.price} ج.م</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleNotebookVisibility(nb)}
                      className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer ${
                        nb.isHidden
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      title={nb.isHidden ? 'إظهار المذكرة للزوار' : 'إخفاء المذكرة مؤقتًا'}
                    >
                      {nb.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      <span>{nb.isHidden ? 'إظهار' : 'إخفاء'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingNbId(nb.id);
                        setNbForm({ ...nb });
                      }}
                      className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer"
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteNotebook(nb.id)}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                      title="حذف نهائي"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: COUPONS & NEXT-ORDER REWARD CONTROLS */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-l from-amber-50 to-white rounded-3xl p-6 border-2 border-amber-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    نظام مكافأة الطلب التالي التلقائي (كود مختلف لكل عميل × مرة واحدة فقط)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    عند تفعيله، يحصل كل عميل بعد إتمام طلبه على كود خصم فريد خاص به، ويُغلق الكود
                    تلقائيًا بعد استخدامه مرة واحدة.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-amber-300 text-xs font-black text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftSettings.enableNextOrderReward !== false}
                    onChange={(e) => {
                      const updated = { ...draftSettings, enableNextOrderReward: e.target.checked };
                      setDraftSettings(updated);
                      onSaveSettings(updated);
                    }}
                  />
                  <span>
                    {draftSettings.enableNextOrderReward !== false ? 'مُفعّل حاليًا' : 'متوقف حاليًا'}
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    نسبة الخصم التلقائية للطلب التالي (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={draftSettings.nextOrderDiscountPercent ?? 15}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        nextOrderDiscountPercent: Number(e.target.value) || 15
                      })
                    }
                    className="w-40 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onSaveSettings(draftSettings)}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black cursor-pointer"
                >
                  حفظ إعدادات المكافأة
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <h3 className="text-base font-black text-slate-900">
                  إنشاء كوبون خصم (عام أو شخصي لمرة واحدة)
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!cpForm.code.trim()) return;
                    await onSaveCoupon({
                      id: 'cp-' + Date.now(),
                      code: cpForm.code.trim().toUpperCase(),
                      discountPercent: Number(cpForm.discountPercent) || 10,
                      description: cpForm.description || `خصم ${cpForm.discountPercent}%`,
                      active: true,
                      singleUse: Boolean(cpForm.singleUse),
                      used: false,
                      isPrivate: Boolean(cpForm.singleUse)
                    });
                    setCpForm({ code: '', discountPercent: 15, description: '', singleUse: false });
                  }}
                  className="space-y-3"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="كود الخصم (مثال: VIP20)"
                      value={cpForm.code}
                      onChange={(e) => setCpForm({ ...cpForm, code: e.target.value })}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCpForm({
                          ...cpForm,
                          code: 'VIP-' + Math.floor(10000 + Math.random() * 90000),
                          singleUse: true
                        })
                      }
                      className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-black cursor-pointer"
                    >
                      توليد كود فريد
                    </button>
                  </div>

                  <input
                    type="number"
                    min={1}
                    max={95}
                    required
                    placeholder="نسبة الخصم %"
                    value={cpForm.discountPercent}
                    onChange={(e) => setCpForm({ ...cpForm, discountPercent: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="وصف العرض أو اسم العميل المخصص له..."
                    value={cpForm.description}
                    onChange={(e) => setCpForm({ ...cpForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(cpForm.singleUse)}
                      onChange={(e) => setCpForm({ ...cpForm, singleUse: e.target.checked })}
                    />
                    <span>كوبون شخصي يُستخدم مرة واحدة فقط (يُبطل تلقائيًا بعد أول استخدام)</span>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer"
                  >
                    + حفظ الكوبون
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-3">
                {coupons.map((cp) => (
                  <div
                    key={cp.id}
                    className={`bg-white rounded-2xl p-4 border flex items-center justify-between gap-3 ${
                      cp.used ? 'border-slate-200 bg-slate-50 opacity-75' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black text-blue-700">{cp.code}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                          خصم {cp.discountPercent}%
                        </span>
                        {cp.singleUse && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              cp.used
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {cp.used
                              ? `تم استخدامه (${cp.usedByOrder || ''})`
                              : 'شخصي • متاح لمرة واحدة'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{cp.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteCoupon(cp.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TAXONOMY & STAGE-SPECIFIC GRADES */}
        {activeTab === 'taxonomy' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Categories */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <h3 className="text-base font-black text-slate-900">
                  1. الأقسام الرئيسية للمنصة (الترتيب والإضافة والحذف)
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اسم قسم جديد (مثال: مراجعات ليلة الامتحان)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const name = newCategoryName.trim();
                      if (!name || draftSettings.categories.includes(name)) return;
                      setDraftSettings({
                        ...draftSettings,
                        categories: [...draftSettings.categories, name]
                      });
                      setNewCategoryName('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer"
                  >
                    + إضافة
                  </button>
                </div>

                <div className="space-y-2">
                  {draftSettings.categories.map((cat, idx) => (
                    <div
                      key={cat + idx}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <input
                        type="text"
                        value={cat}
                        onChange={(e) => {
                          const copy = [...draftSettings.categories];
                          copy[idx] = e.target.value;
                          setDraftSettings({ ...draftSettings, categories: copy });
                        }}
                        className="flex-1 bg-transparent text-xs font-black text-slate-900 outline-hidden"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSettings({
                              ...draftSettings,
                              categories: moveItem(draftSettings.categories, idx, -1)
                            })
                          }
                          className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSettings({
                              ...draftSettings,
                              categories: moveItem(draftSettings.categories, idx, 1)
                            })
                          }
                          className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSettings({
                              ...draftSettings,
                              categories: draftSettings.categories.filter((_, i) => i !== idx)
                            })
                          }
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stages */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <h3 className="text-base font-black text-slate-900">
                  2. المراحل الدراسية (الترتيب والإضافة والحذف)
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اسم مرحلة جديدة (مثال: مرحلة رياض الأطفال)"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const name = newStageName.trim();
                      if (!name || draftSettings.stages.includes(name)) return;
                      setDraftSettings({
                        ...draftSettings,
                        stages: [...draftSettings.stages, name],
                        stageGrades: {
                          ...draftSettings.stageGrades,
                          [name]: []
                        }
                      });
                      setSelectedStageForGrades(name);
                      setNewStageName('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-black cursor-pointer"
                  >
                    + إضافة
                  </button>
                </div>

                <div className="space-y-2">
                  {draftSettings.stages.map((stg, idx) => (
                    <div
                      key={stg + idx}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <span className="flex-1 text-xs font-black text-slate-900">{stg}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSettings({
                              ...draftSettings,
                              stages: moveItem(draftSettings.stages, idx, -1)
                            })
                          }
                          className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSettings({
                              ...draftSettings,
                              stages: moveItem(draftSettings.stages, idx, 1)
                            })
                          }
                          className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedStages = draftSettings.stages.filter((_, i) => i !== idx);
                            setDraftSettings({ ...draftSettings, stages: updatedStages });
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage-Specific Grades Customization */}
              <div className="bg-white rounded-3xl p-6 border-2 border-emerald-200 space-y-4">
                <h3 className="text-base font-black text-slate-900">
                  3. تخصيص الصفوف الدراسية لكل مرحلة على حدة
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    اختر المرحلة الدراسية لتعديل صفوفها:
                  </label>
                  <select
                    value={selectedStageForGrades}
                    onChange={(e) => setSelectedStageForGrades(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-emerald-50/50 text-xs font-black text-slate-900"
                  >
                    {draftSettings.stages.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`إضافة صف داخل ${selectedStageForGrades}...`}
                    value={newGradeForStage}
                    onChange={(e) => setNewGradeForStage(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const gName = newGradeForStage.trim();
                      if (!gName || currentStageGradesList.includes(gName)) return;
                      const updatedForStage = [...currentStageGradesList, gName];
                      const allUniqueGrades = Array.from(
                        new Set([...draftSettings.grades, gName])
                      );
                      setDraftSettings({
                        ...draftSettings,
                        grades: allUniqueGrades,
                        stageGrades: {
                          ...draftSettings.stageGrades,
                          [selectedStageForGrades]: updatedForStage
                        }
                      });
                      setNewGradeForStage('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer"
                  >
                    + إضافة صف
                  </button>
                </div>

                <div className="space-y-2">
                  {currentStageGradesList.map((grd, idx) => (
                    <div
                      key={grd + idx}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <input
                        type="text"
                        value={grd}
                        onChange={(e) => {
                          const copy = [...currentStageGradesList];
                          copy[idx] = e.target.value;
                          setDraftSettings({
                            ...draftSettings,
                            stageGrades: {
                              ...draftSettings.stageGrades,
                              [selectedStageForGrades]: copy
                            }
                          });
                        }}
                        className="flex-1 bg-transparent text-xs font-black text-slate-900 outline-hidden"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSettings({
                              ...draftSettings,
                              stageGrades: {
                                ...draftSettings.stageGrades,
                                [selectedStageForGrades]: moveItem(
                                  currentStageGradesList,
                                  idx,
                                  -1
                                )
                              }
                            })
                          }
                          className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSettings({
                              ...draftSettings,
                              stageGrades: {
                                ...draftSettings.stageGrades,
                                [selectedStageForGrades]: moveItem(
                                  currentStageGradesList,
                                  idx,
                                  1
                                )
                              }
                            })
                          }
                          className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSettings({
                              ...draftSettings,
                              stageGrades: {
                                ...draftSettings.stageGrades,
                                [selectedStageForGrades]: currentStageGradesList.filter(
                                  (_, i) => i !== idx
                                )
                              }
                            })
                          }
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <h3 className="text-base font-black text-slate-900">4. المواد الدراسية</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="إضافة مادة دراسية جديدة..."
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const sName = newSubjectName.trim();
                      if (!sName || draftSettings.subjects.includes(sName)) return;
                      setDraftSettings({
                        ...draftSettings,
                        subjects: [...draftSettings.subjects, sName]
                      });
                      setNewSubjectName('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black cursor-pointer"
                  >
                    + إضافة
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {draftSettings.subjects.map((subj, idx) => (
                    <span
                      key={subj + idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold"
                    >
                      <span>{subj}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftSettings({
                            ...draftSettings,
                            subjects: draftSettings.subjects.filter((_, i) => i !== idx)
                          })
                        }
                        className="text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSaveSettings(draftSettings)}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg cursor-pointer"
            >
              حفظ ترتيب وتخصيص الأقسام والمراحل والصفوف
            </button>
          </div>
        )}

        {/* TAB 5: SITE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-8">
            {/* Brand & Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  اسم المنصة
                </label>
                <input
                  type="text"
                  value={draftSettings.brandName}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, brandName: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  الوصف المختصر بجانب الشعار
                </label>
                <input
                  type="text"
                  value={draftSettings.brandTagline}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, brandTagline: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-800">
                  صورة الشعار (Logo)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const dataUrl = await compressImageFile(file, 450, 0.85);
                    setDraftSettings({ ...draftSettings, logoUrl: dataUrl });
                  }}
                  className="text-xs"
                />
                {draftSettings.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setDraftSettings({ ...draftSettings, logoUrl: '' })}
                    className="text-[11px] font-bold text-rose-600 cursor-pointer"
                  >
                    إزالة الشعار
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-800">
                  صورة خلفية الواجهة الرئيسية
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const dataUrl = await compressImageFile(file, 1400, 0.82);
                    setDraftSettings({ ...draftSettings, heroBgImage: dataUrl });
                  }}
                  className="text-xs"
                />
                {draftSettings.heroBgImage && (
                  <button
                    type="button"
                    onClick={() => setDraftSettings({ ...draftSettings, heroBgImage: '' })}
                    className="text-[11px] font-bold text-rose-600 cursor-pointer"
                  >
                    إزالة صورة الخلفية
                  </button>
                )}
              </div>
            </div>

            {/* Hero Texts & WhatsApp */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  العنوان الرئيسي في الواجهة
                </label>
                <input
                  type="text"
                  value={draftSettings.heroTitle}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, heroTitle: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  النص الفرعي للواجهة
                </label>
                <textarea
                  rows={2}
                  value={draftSettings.heroSubtitle}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, heroSubtitle: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    رقم الواتساب (مع كود الدولة مثل 2010...)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={draftSettings.whatsappNumber}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, whatsappNumber: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-left"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    تعليمات الدفع والتحويل
                  </label>
                  <input
                    type="text"
                    value={draftSettings.paymentInstructions}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, paymentInstructions: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  نص الشريط الترويجي العلوي
                </label>
                <input
                  type="text"
                  value={draftSettings.promoBannerText}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, promoBannerText: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>

            {/* Social Media Links Management */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  إدارة روابط التواصل الاجتماعي (تظهر في نافذة «تواصل معنا» وأسفل الموقع)
                </h4>
                <p className="text-[11px] text-slate-500">
                  أضف أي رابط (فيسبوك، جروب واتساب، تليجرام، يوتيوب...) وسيتعرف النظام على أيقونته تلقائيًا
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="اسم الزر (مثال: قناة التليجرام)"
                  value={newSocialLabel}
                  onChange={(e) => setNewSocialLabel(e.target.value)}
                  className="sm:col-span-4 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                />
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://..."
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  className="sm:col-span-5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-left"
                />
                <div className="sm:col-span-3 flex gap-2">
                  <input
                    type="color"
                    value={newSocialColor}
                    onChange={(e) => setNewSocialColor(e.target.value)}
                    className="w-11 h-10 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSocialLabel.trim() || !newSocialUrl.trim()) return;
                      const nextLinks = [
                        ...(draftSettings.socialLinks || []),
                        {
                          id: 'soc-' + Date.now(),
                          label: newSocialLabel.trim(),
                          url: newSocialUrl.trim(),
                          color: newSocialColor
                        }
                      ];
                      setDraftSettings({ ...draftSettings, socialLinks: nextLinks });
                      setNewSocialLabel('');
                      setNewSocialUrl('');
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer"
                  >
                    + إضافة
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {(draftSettings.socialLinks || []).map((soc) => (
                  <div
                    key={soc.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0"
                        style={{ backgroundColor: soc.color || '#2563EB' }}
                      >
                        <SocialBrandIcon url={soc.url} label={soc.label} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900">{soc.label}</div>
                        <div className="text-[11px] text-slate-500 truncate" dir="ltr">
                          {soc.url}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftSettings({
                          ...draftSettings,
                          socialLinks: draftSettings.socialLinks.filter((s) => s.id !== soc.id)
                        })
                      }
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save & Backup Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onSaveSettings(draftSettings)}
                className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg cursor-pointer"
              >
                حفظ جميع الإعدادات ومزامنتها
              </button>

              <button
                type="button"
                onClick={() => {
                  const backup = {
                    exportedAt: new Date().toISOString(),
                    settings: draftSettings,
                    notebooks,
                    orders,
                    coupons
                  };
                  const blob = new Blob([JSON.stringify(backup, null, 2)], {
                    type: 'application/json'
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `el3bakera-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل نسخة احتياطية</span>
              </button>

              <label className="py-4 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>استعادة نسخة</span>
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
                        onImportBackup(parsed);
                      } catch {
                        showToast('ملف النسخة الاحتياطية غير صالح', 'error');
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 11. Error Boundary & Main App Component
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'خطأ غير متوقع' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-slate-100 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
            <h2 className="text-lg font-black text-slate-900">حدث خطأ مؤقت في عرض الصفحة</h2>
            <p className="text-xs text-slate-500">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-2xl bg-blue-600 text-white text-xs font-black cursor-pointer"
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

function MuzakkiratiApp() {
  const [settings, setSettings] = useState(() =>
    normalizeSettings(readLS(LS_KEYS.SETTINGS, DEFAULT_SETTINGS))
  );
  const [notebooks, setNotebooks] = useState(() =>
    (readLS(LS_KEYS.NOTEBOOKS, []) || []).map(normalizeNotebook).filter(Boolean)
  );
  const [orders, setOrders] = useState(() => readLS(LS_KEYS.ORDERS, []));
  const [coupons, setCoupons] = useState(() => readLS(LS_KEYS.COUPONS, []));

  const [navState, setNavState] = useState({
    page: 'home',
    category: 'all',
    stage: 'all',
    grade: 'all',
    subject: 'all'
  });

  const [adminUser, setAdminUser] = useState(null);
  const [showAdmin, setShowAdmin] = useState(() => window.location.hash === '#admin');
  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [toast, setToast] = useState(null);

  const logoClickCount = useRef(0);
  const logoClickTimer = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Navigate helper synchronized with browser/mobile back button
  const navigateTo = (nextState) => {
    setNavState(nextState);
    try {
      window.history.pushState({ mzNav: nextState }, '', window.location.pathname);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    try {
      window.history.replaceState({ mzNav: navState }, '');
    } catch {}

    const handlePopState = (e) => {
      if (previewNotebook) {
        setPreviewNotebook(null);
        return;
      }
      if (orderModalOpen) {
        setOrderModalOpen(false);
        return;
      }
      if (showSocialModal) {
        setShowSocialModal(false);
        return;
      }
      if (e.state?.mzNav) {
        setNavState(e.state.mzNav);
      } else {
        setNavState({ page: 'home', category: 'all', stage: 'all', grade: 'all', subject: 'all' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [previewNotebook, orderModalOpen, showSocialModal]);

  // Secret Admin Shortcuts (#admin hash or Alt + Shift + A)
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === '#admin') setShowAdmin(true);
    };
    const onKeyDown = (e) => {
      if (e.altKey && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.code === 'KeyA')) {
        setShowAdmin((prev) => !prev);
      }
    };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Firebase Auth & Real-Time Firestore Listeners
  useEffect(() => {
    if (!auth || !db) return;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
    });

    const handleListenerError = (err) => {
      console.warn('Firestore snapshot notice:', err?.code || err?.message);
    };

    const unsubSettings = onSnapshot(
      publicDoc('config', 'settings'),
      (snap) => {
        if (snap.exists()) {
          const norm = normalizeSettings(snap.data());
          setSettings(norm);
          writeLS(LS_KEYS.SETTINGS, norm);
        }
      },
      handleListenerError
    );

    const unsubNotebooks = onSnapshot(
      publicCol('notebooks'),
      (snap) => {
        const list = snap.docs
          .map((d) => normalizeNotebook({ id: d.id, ...d.data() }))
          .filter(Boolean);
        setNotebooks(list);
        writeLS(LS_KEYS.NOTEBOOKS, list);
      },
      handleListenerError
    );

    const unsubOrders = onSnapshot(
      publicCol('orders'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        setOrders(list);
        writeLS(LS_KEYS.ORDERS, list);
      },
      handleListenerError
    );

    const unsubCoupons = onSnapshot(
      publicCol('coupons'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCoupons(list);
        writeLS(LS_KEYS.COUPONS, list);
      },
      handleListenerError
    );

    return () => {
      unsubAuth();
      unsubSettings();
      unsubNotebooks();
      unsubOrders();
      unsubCoupons();
    };
  }, []);

  const handleSaveSettings = async (nextSettings) => {
    const clean = normalizeSettings(nextSettings);
    setSettings(clean);
    writeLS(LS_KEYS.SETTINGS, clean);
    try {
      await setDoc(publicDoc('config', 'settings'), clean);
      showToast('تم حفظ ومزامنة الإعدادات بنجاح');
    } catch {
      showToast('تم الحفظ محليًا', 'error');
    }
  };

  const handleSaveNotebook = async (nb) => {
    const clean = normalizeNotebook(nb);
    const exists = notebooks.some((item) => item.id === clean.id);
    const nextList = exists
      ? notebooks.map((item) => (item.id === clean.id ? clean : item))
      : [clean, ...notebooks];
    setNotebooks(nextList);
    writeLS(LS_KEYS.NOTEBOOKS, nextList);
    try {
      await setDoc(publicDoc('notebooks', clean.id), clean);
      showToast(exists ? 'تم تحديث المذكرة بنجاح' : 'تمت إضافة المذكرة بنجاح');
    } catch {
      showToast('تم الحفظ محليًا', 'error');
    }
  };

  const handleToggleNotebookVisibility = async (nb) => {
    const updated = { ...nb, isHidden: !nb.isHidden };
    await handleSaveNotebook(updated);
  };

  const handleDeleteNotebook = async (id) => {
    const nextList = notebooks.filter((item) => item.id !== id);
    setNotebooks(nextList);
    writeLS(LS_KEYS.NOTEBOOKS, nextList);
    try {
      await deleteDoc(publicDoc('notebooks', id));
      showToast('تم حذف المذكرة');
    } catch {}
  };

  const handleAddToCartAndOpen = (nb) => {
    if (!nb) {
      setCartItems([]);
      setOrderModalOpen(true);
      return;
    }
    setCartItems((prev) => (prev.some((item) => item.id === nb.id) ? prev : [...prev, nb]));
    setOrderModalOpen(true);
  };

  const handleSubmitOrder = async (orderRecord, usedCoupon = null, nextRewardCoupon = null) => {
    const nextList = [orderRecord, ...orders];
    setOrders(nextList);
    writeLS(LS_KEYS.ORDERS, nextList);

    let updatedCoupons = [...coupons];
    if (usedCoupon && usedCoupon.singleUse) {
      const burned = {
        ...usedCoupon,
        used: true,
        active: false,
        usedAt: new Date().toISOString(),
        usedByOrder: orderRecord.orderCode
      };
      updatedCoupons = updatedCoupons.map((c) => (c.id === burned.id ? burned : c));
      try {
        await setDoc(publicDoc('coupons', burned.id), burned);
      } catch {}
    }
    if (nextRewardCoupon) {
      updatedCoupons = [nextRewardCoupon, ...updatedCoupons];
      try {
        await setDoc(publicDoc('coupons', nextRewardCoupon.id), nextRewardCoupon);
      } catch {}
    }
    setCoupons(updatedCoupons);
    writeLS(LS_KEYS.COUPONS, updatedCoupons);

    try {
      await setDoc(publicDoc('orders', orderRecord.id), orderRecord);
      showToast(`تم تسجيل طلبك برقم ${orderRecord.orderCode}`);
    } catch {
      showToast('تم تسجيل الطلب محليًا وجاري التحويل للواتساب');
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    const nextList = orders.map((o) => (o.id === id ? { ...o, status } : o));
    setOrders(nextList);
    writeLS(LS_KEYS.ORDERS, nextList);
    const target = nextList.find((o) => o.id === id);
    if (target) {
      try {
        await setDoc(publicDoc('orders', id), target);
        showToast('تم تحديث حالة الطلب');
      } catch {}
    }
  };

  const handleDeleteOrder = async (id) => {
    const nextList = orders.filter((o) => o.id !== id);
    setOrders(nextList);
    writeLS(LS_KEYS.ORDERS, nextList);
    try {
      await deleteDoc(publicDoc('orders', id));
      showToast('تم حذف الطلب');
    } catch {}
  };

  const handleSaveCoupon = async (cp) => {
    const nextList = [cp, ...coupons];
    setCoupons(nextList);
    writeLS(LS_KEYS.COUPONS, nextList);
    try {
      await setDoc(publicDoc('coupons', cp.id), cp);
      showToast('تم حفظ الكوبون بنجاح');
    } catch {}
  };

  const handleDeleteCoupon = async (id) => {
    const nextList = coupons.filter((c) => c.id !== id);
    setCoupons(nextList);
    writeLS(LS_KEYS.COUPONS, nextList);
    try {
      await deleteDoc(publicDoc('coupons', id));
      showToast('تم حذف الكوبون');
    } catch {}
  };

  const handleImportBackup = async (data) => {
    if (data?.settings) await handleSaveSettings(data.settings);
    if (Array.isArray(data?.notebooks)) {
      for (const nb of data.notebooks) {
        await handleSaveNotebook(nb);
      }
    }
    if (Array.isArray(data?.coupons)) {
      for (const cp of data.coupons) {
        await handleSaveCoupon(cp);
      }
    }
    showToast('تمت استعادة النسخة الاحتياطية بنجاح');
  };

  const handleBrandSecretTap = () => {
    logoClickCount.current += 1;
    clearTimeout(logoClickTimer.current);
    if (logoClickCount.current >= 5) {
      logoClickCount.current = 0;
      setShowAdmin(true);
    } else {
      logoClickTimer.current = setTimeout(() => {
        logoClickCount.current = 0;
      }, 1800);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-[70] px-5 py-3.5 rounded-2xl shadow-2xl text-white text-xs font-black flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-rose-700' : 'bg-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {showAdmin ? (
        <AdminPortal
          adminUser={adminUser}
          settings={settings}
          notebooks={notebooks}
          orders={orders}
          coupons={coupons}
          onSaveSettings={handleSaveSettings}
          onSaveNotebook={handleSaveNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          onToggleNotebookVisibility={handleToggleNotebookVisibility}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onDeleteOrder={handleDeleteOrder}
          onSaveCoupon={handleSaveCoupon}
          onDeleteCoupon={handleDeleteCoupon}
          onImportBackup={handleImportBackup}
          onCloseAdmin={() => {
            setShowAdmin(false);
            if (window.location.hash === '#admin') {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }}
          showToast={showToast}
        />
      ) : (
        <>
          {/* Promo Top Bar */}
          {settings.promoBannerText && (
            <div className="bg-slate-950 text-amber-300 px-4 py-2 text-center text-[11px] sm:text-xs font-extrabold flex flex-wrap items-center justify-center gap-3">
              <span>{settings.promoBannerText}</span>
              <button
                type="button"
                onClick={() =>
                  navigateTo({ page: 'offers', category: 'all', stage: 'all', grade: 'all', subject: 'all' })
                }
                className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
              >
                استفد من العرض ←
              </button>
            </div>
          )}

          {/* Main Header */}
          <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
              {/* Brand Logo & Name (5 taps opens Admin Login) */}
              <div
                onClick={() => {
                  handleBrandSecretTap();
                  navigateTo({
                    page: 'home',
                    category: 'all',
                    stage: 'all',
                    grade: 'all',
                    subject: 'all'
                  });
                }}
                className="flex items-center gap-3 cursor-pointer select-none"
              >
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.brandName}
                    className="h-12 w-12 rounded-2xl object-contain bg-slate-900 p-1"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <BookOpen className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="text-base sm:text-lg font-black text-slate-900">
                    {settings.brandName}
                  </div>
                  <div className="text-[11px] text-slate-500 hidden sm:block">
                    {settings.brandTagline}
                  </div>
                </div>
              </div>

              {/* Navigation Pill */}
              <nav className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl order-3 md:order-2 w-full md:w-auto justify-center">
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
                    onClick={() =>
                      navigateTo({
                        page: item.id,
                        category: 'all',
                        stage: 'all',
                        grade: 'all',
                        subject: 'all'
                      })
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                      navState.page === item.id
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Cart & Social Hub Trigger Buttons */}
              <div className="flex items-center gap-2 order-2 md:order-3">
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOrderModalOpen(true)}
                    className="relative px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>السلة ({cartItems.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSocialModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تواصل معنا</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {navState.page === 'home' && (
              <HomePage
                settings={settings}
                notebooks={notebooks}
                onBrowseCatalog={() =>
                  navigateTo({
                    page: 'catalog',
                    category: 'all',
                    stage: 'all',
                    grade: 'all',
                    subject: 'all'
                  })
                }
                onSelectCategory={(cat) =>
                  navigateTo({
                    page: 'catalog',
                    category: cat,
                    stage: 'all',
                    grade: 'all',
                    subject: 'all'
                  })
                }
                onOrderCustom={() => handleAddToCartAndOpen(null)}
                onPreviewNotebook={(nb) => setPreviewNotebook(nb)}
                onOrderNotebook={(nb) => handleAddToCartAndOpen(nb)}
              />
            )}

            {navState.page === 'catalog' && (
              <CatalogPage
                notebooks={notebooks}
                settings={settings}
                navState={navState}
                onUpdateNavState={(partial) => navigateTo({ page: 'catalog', ...partial })}
                onPreviewNotebook={(nb) => setPreviewNotebook(nb)}
                onOrderNotebook={(nb) => handleAddToCartAndOpen(nb)}
                onOrderCustom={() => handleAddToCartAndOpen(null)}
              />
            )}

            {navState.page === 'offers' && (
              <OffersPage
                coupons={coupons}
                notebooks={notebooks}
                onPreviewNotebook={(nb) => setPreviewNotebook(nb)}
                onOrderNotebook={(nb) => handleAddToCartAndOpen(nb)}
                showToast={showToast}
              />
            )}

            {navState.page === 'track' && <TrackOrderPage orders={orders} />}
            {navState.page === 'contact' && <ContactPage settings={settings} />}
          </main>

          {/* Footer (Clean without Admin Icon) */}
          <footer className="bg-slate-950 text-slate-300 border-t border-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-base font-black text-white">{settings.brandName}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{settings.brandTagline}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black text-white">روابط سريعة</h4>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  <li>
                    <button
                      type="button"
                      onClick={() =>
                        navigateTo({
                          page: 'catalog',
                          category: 'all',
                          stage: 'all',
                          grade: 'all',
                          subject: 'all'
                        })
                      }
                      className="hover:text-white cursor-pointer"
                    >
                      تصفح جميع المذكرات
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() =>
                        navigateTo({
                          page: 'offers',
                          category: 'all',
                          stage: 'all',
                          grade: 'all',
                          subject: 'all'
                        })
                      }
                      className="hover:text-white cursor-pointer"
                    >
                      العروض وكوبونات الخصم
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() =>
                        navigateTo({
                          page: 'track',
                          category: 'all',
                          stage: 'all',
                          grade: 'all',
                          subject: 'all'
                        })
                      }
                      className="hover:text-white cursor-pointer"
                    >
                      متابعة حالة الطلب
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-white">تواصل معنا</h4>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/${formatWhatsAppNumber(settings.whatsappNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition"
                  >
                    <SocialBrandIcon url="whatsapp" className="w-4 h-4" />
                    <span>واتساب</span>
                  </a>

                  {(settings.socialLinks || []).map((soc) => (
                    <a
                      key={soc.id}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition"
                    >
                      <SocialBrandIcon url={soc.url} label={soc.label} className="w-4 h-4" />
                      <span>{soc.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-900 py-4 text-center text-[11px] text-slate-500">
              جميع الحقوق محفوظة © {new Date().getFullYear()} {settings.brandName}
            </div>
          </footer>

          {/* Modals */}
          {previewNotebook && (
            <ProtectedPreviewModal
              notebook={previewNotebook}
              settings={settings}
              onClose={() => setPreviewNotebook(null)}
              onOrder={() => {
                const targetNb = previewNotebook;
                setPreviewNotebook(null);
                handleAddToCartAndOpen(targetNb);
              }}
            />
          )}

          {orderModalOpen && (
            <OrderModal
              cartItems={cartItems}
              allNotebooks={notebooks}
              settings={settings}
              coupons={coupons}
              onAddMoreNotebook={(nb) =>
                setCartItems((prev) => (prev.some((i) => i.id === nb.id) ? prev : [...prev, nb]))
              }
              onRemoveCartItem={(id) =>
                setCartItems((prev) => prev.filter((item) => item.id !== id))
              }
              onClearCart={() => setCartItems([])}
              onClose={() => setOrderModalOpen(false)}
              onSubmitOrder={handleSubmitOrder}
              showToast={showToast}
            />
          )}

          {showSocialModal && (
            <SocialHubModal settings={settings} onClose={() => setShowSocialModal(false)} />
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MuzakkiratiApp />
    </ErrorBoundary>
  );
}
