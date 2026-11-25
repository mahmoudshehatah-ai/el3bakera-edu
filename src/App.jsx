import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  FolderTree,
  Gift,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  KeyRound,
  Layers,
  LayoutDashboard,
  Link2,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Package,
  Percent,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  Wallet,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

/**
 * ============================================================================
 * FIREBASE INITIALIZATION & CLOUD SYNC LAYER
 * ============================================================================
 */
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD_du5VY8nJGDJ169Fof9EALi9x2W2d-14',
  authDomain: 'el3bakera-edu.firebaseapp.com',
  projectId: 'el3bakera-edu',
  storageBucket: 'el3bakera-edu.firebasestorage.app',
  messagingSenderId: '74663879858',
  appId: '1:74663879858:web:4327c0ea1b825dd6c615ab'
};

let firebaseConfig = DEFAULT_FIREBASE_CONFIG;
try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig =
      typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
  }
} catch (_) {
  firebaseConfig = DEFAULT_FIREBASE_CONFIG;
}

const appId = typeof __app_id !== 'undefined' && __app_id ? __app_id : 'muzakkirati-edu-app';

let db = null;
let auth = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase init fallback to local mode:', err);
}

/**
 * ============================================================================
 * SECURITY & CRYPTO UTILITIES (SHA-256 + RANDOM SALT)
 * ============================================================================
 */
function generateSalt(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const arr = new Uint8Array(length);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(arr);
    for (let i = 0; i < length; i++) {
      result += chars[arr[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}

async function hashPasswordWithSalt(password, salt) {
  const text = `${salt}:${password}`;
  if (window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `fallback_${Math.abs(hash)}`;
}

function validateEgyptianPhone(phone) {
  const cleaned = String(phone || '').replace(/[\s\-()]/g, '');
  return /^(010|011|012|015)\d{8}$/.test(cleaned);
}

function generateOrderNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MZ-${yy}${mm}${dd}-${rand}`;
}

function normalizeExternalUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function compressImageFile(file, maxWidth = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }
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

/**
 * ============================================================================
 * DEFAULT SEED DATA & INITIAL SETTINGS
 * ============================================================================
 */
const DEFAULT_CATEGORIES = [
  {
    id: 'term1',
    name: 'مذكرات الترم الأول',
    description: 'مذكرات شرح وتدريبات ومراجعات شاملة للفصل الدراسي الأول لجميع المراحل.',
    color: 'from-blue-700 to-indigo-800',
    badge: 'الترم الأول'
  },
  {
    id: 'term2',
    name: 'مذكرات الترم الثاني',
    description: 'مذكرات منسقة ومحدثة للفصل الدراسي الثاني مع بنوك أسئلة وامتحانات.',
    color: 'from-teal-600 to-emerald-800',
    badge: 'الترم الثاني'
  },
  {
    id: 'foundation',
    name: 'كورسات التأسيس',
    description: 'مذكرات تأسيس مهارات القراءة والكتابة والقواعد والحساب قبل بدء العام الدراسي.',
    color: 'from-amber-600 to-orange-700',
    badge: 'تأسيس شامل'
  }
];

const DEFAULT_STAGES = [
  { id: 'primary', name: 'المرحلة الابتدائية', order: 1 },
  { id: 'prep', name: 'المرحلة الإعدادية', order: 2 },
  { id: 'secondary', name: 'المرحلة الثانوية', order: 3 }
];

const DEFAULT_GRADES = [
  { id: 'g_p4', stageId: 'primary', name: 'الصف الرابع الابتدائي' },
  { id: 'g_p5', stageId: 'primary', name: 'الصف الخامس الابتدائي' },
  { id: 'g_p6', stageId: 'primary', name: 'الصف السادس الابتدائي' },
  { id: 'g_m1', stageId: 'prep', name: 'الصف الأول الإعدادي' },
  { id: 'g_m2', stageId: 'prep', name: 'الصف الثاني الإعدادي' },
  { id: 'g_m3', stageId: 'prep', name: 'الصف الثالث الإعدادي' },
  { id: 'g_s1', stageId: 'secondary', name: 'الصف الأول الثانوي' },
  { id: 'g_s2', stageId: 'secondary', name: 'الصف الثاني الثانوي' },
  { id: 'g_s3', stageId: 'secondary', name: 'الصف الثالث الثانوي' }
];

const DEFAULT_SUBJECTS = [
  { id: 'sub_ar', name: 'اللغة العربية', visible: true },
  { id: 'sub_en', name: 'اللغة الإنجليزية', visible: true },
  { id: 'sub_math', name: 'الرياضيات', visible: true },
  { id: 'sub_sci', name: 'العلوم', visible: true },
  { id: 'sub_soc', name: 'الدراسات الاجتماعية', visible: true }
];

const DEFAULT_NOTEBOOKS = [
  {
    id: 'nb_demo_1',
    title: 'سلسلة البيان في اللغة العربية — الصف الثالث الإعدادي',
    categoryId: 'term1',
    stageId: 'prep',
    gradeId: 'g_m3',
    subjectId: 'sub_ar',
    price: 150,
    oldPrice: 210,
    pagesCount: 112,
    badge: 'الأكثر طلبًا',
    description:
      'مذكرة شرح وتدريبات متكاملة تشمل النحو والقراءة والنصوص والقصة، منسقة بأحدث خطوط الطباعة مع أماكن مخصصة لاسم المعلم وشعاره ورقم هاتفه على الغلاف وجميع الصفحات.',
    features: [
      'إضافة اسم المعلم ورقم الهاتف والشعار على الغلاف وجميع الصفحات',
      'ملف PDF عالي الدقة جاهز للطباعة الفورية (A4)',
      'تدريبات شاملة بنظام الامتحانات الحديثة',
      'تعديل الألوان الأساسية للغلاف حسب رغبة المعلم'
    ],
    coverUrl: '',
    sampleType: 'images',
    sampleImages: [],
    samplePdfUrl: '',
    previewPagesLimit: 4,
    isActive: true,
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'nb_demo_2',
    title: 'المتفوق في الرياضيات — الصف الأول الثانوي',
    categoryId: 'term1',
    stageId: 'secondary',
    gradeId: 'g_s1',
    subjectId: 'sub_math',
    price: 180,
    oldPrice: 240,
    pagesCount: 136,
    badge: 'عرض خاص',
    description:
      'مذكرة الجبر وحساب المثلثات والهندسة التحليلية مع أمثلة محلولة ومسائل مهارات التفكير العليا، قابلة للتخصيص الكامل باسمك وشعارك.',
    features: [
      'تخصيص كامل للغلاف والترويسة الداخلية باسم المعلم',
      'رسومات هندسية واضحة ومرتبة بدقة عالية',
      'اختبارات تراكمية بعد كل وحدة دراسية'
    ],
    coverUrl: '',
    sampleType: 'images',
    sampleImages: [],
    samplePdfUrl: '',
    previewPagesLimit: 4,
    isActive: true,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'nb_demo_3',
    title: 'كورس التأسيس الشامل في القواعد الإنجليزية',
    categoryId: 'foundation',
    stageId: 'primary',
    gradeId: 'g_p6',
    subjectId: 'sub_en',
    price: 120,
    oldPrice: 160,
    pagesCount: 74,
    badge: 'تأسيس',
    description:
      'كورس تأسيس متدرج من الصفر لتقوية الطلاب في القراءة وتكوين الجمل والأزمنة الأساسية قبل بدء العام الدراسي.',
    features: [
      'تصميم جذاب مناسب لطلاب المرحلة الابتدائية والإعدادية',
      'إضافة اسم المعلم والسنتر على الغلاف والصفحات',
      'جاهز للطباعة أبيض وأسود أو ألوان'
    ],
    coverUrl: '',
    sampleType: 'images',
    sampleImages: [],
    samplePdfUrl: '',
    previewPagesLimit: 4,
    isActive: true,
    createdAt: Date.now() - 86400000
  }
];

const DEFAULT_COUPONS = [
  {
    id: 'cpn_welcome',
    code: 'TEACHER20',
    type: 'percent',
    value: 20,
    description: 'خصم 20% بمناسبة بداية الفصل الدراسي للمعلمين',
    minOrderAmount: 100,
    maxUses: null,
    usedCount: 0,
    expiresAt: '',
    isPublic: true,
    isActive: true
  }
];

const DEFAULT_BUNDLES = [
  {
    id: 'bnd_prep_all',
    title: 'باقة المرحلة الإعدادية الكاملة (3 صفوف)',
    description:
      'احصل على مذكرات الصف الأول والثاني والثالث الإعدادي لمادتك مخصصة باسمك وشعارك بخصم خاص.',
    price: 380,
    oldPrice: 480,
    itemsSummary: '3 مذكرات كاملة + تصميم غلاف خاص لكل صف مجانًا',
    isActive: true
  }
];

const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة للمذكرات التعليمية',
  platformTagline: 'مذكرات دراسية احترافية مُخصّصة باسمك وشعارك الخاص',
  logoUrl: '',
  heroBannerUrl: '',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة اسم المعلم، رقم الهاتف، والشعار الخاص به على الغلاف وجميع الصفحات.',
  aboutTitle: 'لماذا يختار المعلمون منصة العباقرة للمذكرات التعليمية؟',
  aboutDescription:
    'نحن منصة متخصصة في إعداد وتصميم المذكرات التعليمية الاحترافية للمعلمين في جميع المراحل الدراسية. نوفر لك محتوى علميًا منقحًا، وتنسيقًا عصريًا مريحًا للعين، مع تخصيص الغلاف والصفحات الداخلية باسمك ورقم هاتفك وشعارك الخاص لتكون جاهزة للطباعة الفورية بأعلى جودة.',
  currency: 'ج.م',
  whatsappNumber: '201000000000',
  customerServicePhone: '01000000000',
  contactEmail: 'info@el3bakera-edu.com',
  whatsappGroupUrl: '',
  facebookUrl: '',
  telegramUrl: '',
  youtubeUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  paymentDetails: 'فودافون كاش / إنستاباي: 01000000000',
  announcementEnabled: true,
  announcementText:
    '🎉 عرض خاص للمعلمين: خصم 20% على جميع مذكرات الترم الأول + إضافة الشعار مجانًا لفترة محدودة!',
  showHomeOffersSection: true,
  bulkDiscountEnabled: true,
  bulkDiscountMinItems: 2,
  bulkDiscountPercent: 15,
  autoNextOrderCouponEnabled: true,
  autoNextOrderCouponPercent: 15,
  autoNextOrderCouponDays: 30,
  importantNoticesEnabled: true,
  importantNoticesTitle: 'تنبيهات هامة قبل تأكيد الطلب',
  importantNoticesList: [
    'جميع المذكرات تُسلّم بصيغة إلكترونية PDF عالية الدقة جاهزة للطباعة (لا يوجد شحن ورقي).',
    'يتم إضافة اسم المعلم، رقم الهاتف، والشعار الخاص بك على الغلاف وجميع الصفحات الداخلية.',
    'مدة التجهيز والتسليم تتراوح بين 12 إلى 24 ساعة من تأكيد البيانات.'
  ],
  allowLogoUpload: true,
  requirePaymentProof: false,
  maintenanceMode: false,
  orderSuccessMessage:
    'تم استلام طلبك بنجاح! سيقوم فريق التنسيق بإضافة بياناتك وشعارك على المذكرة وإرسالها لك في أقرب وقت.',
  orderFormFields: {
    teacherNameLabel: 'اسم المعلم (كما سيُكتب على المذكرة)',
    teacherNamePlaceholder: 'مثال: أ/ محمد أحمد عبد الله',
    showTeacherNameField: true,
    requireTeacherNameField: true,
    customTitleLabel: 'اسم المذكرة المطلوب طباعته على الغلاف',
    customTitlePlaceholder: 'مثال: سلسلة الإبداع في اللغة العربية',
    showCustomTitleField: true,
    requireCustomTitleField: true,
    phoneLabel: 'رقم الهاتف / الواتساب للتواصل',
    phonePlaceholder: '010XXXXXXXX',
    showPhoneField: true,
    requirePhoneField: true,
    logoLabel: 'شعار المعلم أو السنتر التعليمي (اختياري — PNG, JPG, SVG)',
    notesLabel: 'ملاحظات إضافية (الألوان المفضلة، إضافة أرقام أخرى، إلخ)',
    notesPlaceholder: 'اكتب أي تعليمات خاصة ترغب في إضافتها على المذكرة...',
    showNotesField: true,
    requireNotesField: false,
    paymentSectionLabel: 'تأكيد الدفع وإرفاق صورة التحويل',
    paymentReceiptPlaceholder: 'ارفع صورة إيصال التحويل (فودافون كاش / إنستاباي)',
    showPaymentSection: true,
    customFields: []
  }
};

const ORDER_STATUSES = [
  { id: 'new', label: 'طلب جديد', color: 'bg-blue-100 text-blue-800 border-blue-200', step: 1 },
  {
    id: 'reviewing',
    label: 'قيد المراجعة والتأكيد',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    step: 2
  },
  {
    id: 'customizing',
    label: 'جاري كتابة البيانات والتخصيص',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    step: 3
  },
  {
    id: 'ready',
    label: 'جاهز للتسليم',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    step: 4
  },
  {
    id: 'delivered',
    label: 'تم التسليم بنجاح',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    step: 5
  },
  {
    id: 'cancelled',
    label: 'ملغي',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    step: 0
  }
];

/**
 * ============================================================================
 * PROTECTED SAMPLE PREVIEWER COMPONENT
 * ============================================================================
 */
function ProtectedPreviewer({ notebook, platformName }) {
  const images =
    Array.isArray(notebook?.sampleImages) && notebook.sampleImages.length > 0
      ? notebook.sampleImages
      : [];
  const limit = Number(notebook?.previewPagesLimit) || 4;
  const displayImages = images.slice(0, limit);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    setCurrentIndex(0);
    setZoom(100);
  }, [notebook?.id]);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="select-none rounded-3xl bg-slate-900 text-white overflow-hidden border border-slate-800 shadow-xl"
    >
      {/* Top Toolbar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-400" />
          <span className="text-xs sm:text-sm font-extrabold">
            معاينة محمية من المذكرة ({displayImages.length > 0 ? `${displayImages.length} صفحات` : 'نموذج عرض'})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(70, z - 15))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-2 text-slate-300">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(160, z + 15))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewer Canvas */}
      <div className="relative min-h-[360px] sm:min-h-[460px] flex items-center justify-center p-4 sm:p-6 bg-slate-900 overflow-auto">
        {notebook?.sampleType === 'pdf' && notebook?.samplePdfUrl ? (
          <div className="w-full space-y-3 text-center">
            <iframe
              src={`${notebook.samplePdfUrl}#toolbar=0&navpanes=0`}
              title="عينة PDF"
              className="w-full h-[440px] rounded-2xl border border-slate-700 bg-white"
            />
            <p className="text-[11px] text-slate-400">
              عينة PDF محمية — تُرسل النسخة الكاملة بدون علامة مائية وباسمك وشعارك بعد الطلب
            </p>
          </div>
        ) : displayImages.length > 0 ? (
          <div className="relative inline-block overflow-hidden rounded-2xl shadow-2xl border border-slate-700 bg-white">
            <img
              src={displayImages[currentIndex]}
              alt={`صفحة معاينة ${currentIndex + 1}`}
              draggable={false}
              style={{ width: `${zoom}%`, maxWidth: '100%' }}
              className="block mx-auto pointer-events-none"
            />
            {/* Repeating Diagonal Watermark */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center opacity-25 rotate-[-24deg]">
              <span className="text-xl sm:text-3xl font-black text-slate-900 tracking-wider whitespace-nowrap">
                {platformName} • عينة للمعاينة فقط
              </span>
            </div>
          </div>
        ) : (
          /* Built-in Illustrative Sample Page when no sample images uploaded yet */
          <div
            style={{ transform: `scale(${zoom / 100})` }}
            className="relative w-full max-w-md rounded-2xl bg-white text-slate-900 p-6 sm:p-8 shadow-2xl border-4 border-blue-800 transition-transform"
          >
            <div className="border-b-2 border-blue-800 pb-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-700">{platformName}</p>
                <h4 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  {notebook?.title}
                </h4>
              </div>
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-amber-500 bg-amber-50 flex items-center justify-center text-[10px] font-extrabold text-amber-800 text-center leading-tight">
                مكان شعارك
              </div>
            </div>
            <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 font-bold text-blue-950">
                إعداد الأستاذ / [يُكتب اسمك ورقم هاتفك هنا على الغلاف وجميع الصفحات]
              </div>
              <p className="font-bold text-slate-800">نموذج تنسيق المحتوى الداخلي:</p>
              <ul className="list-disc pr-5 space-y-1 text-slate-600">
                <li>شرح مبسط ومنظم بأحدث خطوط الطباعة التعليمية الواضحة.</li>
                <li>أمثلة محلولة وتدريبات متدرجة مطابقة لمواصفات الورقة الامتحانية.</li>
                <li>تذييل مخصص في أسفل كل صفحة باسم المعلم ورقم التواصل.</li>
              </ul>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>تليفون المعلم: 010XXXXXXXX</span>
              <span>صفحة (1)</span>
            </div>
          </div>
        )}
      </div>

      {/* Pagination & Thumbnails */}
      {displayImages.length > 1 && (
        <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابقة</span>
          </button>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-11 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                  idx === currentIndex ? 'border-amber-400 scale-105' : 'border-slate-700 opacity-60'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(displayImages.length - 1, i + 1))}
            disabled={currentIndex === displayImages.length - 1}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold flex items-center gap-1"
          >
            <span>التالية</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * ORDER MODAL COMPONENT (DYNAMIC FIELDS + MULTI-NOTEBOOK + COUPONS)
 * ============================================================================
 */
function OrderModal({
  isOpen,
  onClose,
  notebook,
  initialItems,
  initialCouponCode,
  allNotebooks,
  coupons,
  settings,
  lookUp,
  onSubmitOrder,
  showToast
}) {
  const formFieldsCfg = settings.orderFormFields || DEFAULT_SETTINGS.orderFormFields;

  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddMorePicker, setShowAddMorePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const [teacherName, setTeacherName] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState({});

  const [logoData, setLogoData] = useState('');
  const [logoName, setLogoName] = useState('');
  const [paymentReceiptData, setPaymentReceiptData] = useState('');
  const [paymentReceiptName, setPaymentReceiptName] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setSubmittedOrder(null);
    setShowAddMorePicker(false);
    setPickerSearch('');
    setCustomFieldValues({});
    setLogoData('');
    setLogoName('');
    setPaymentReceiptData('');
    setPaymentReceiptName('');

    if (Array.isArray(initialItems) && initialItems.length > 0) {
      setSelectedItems(initialItems);
      setCustomTitle(initialItems.map((i) => i.title).join(' + '));
    } else if (notebook) {
      setSelectedItems([notebook]);
      setCustomTitle(notebook.title || '');
    } else {
      setSelectedItems([]);
      setCustomTitle('');
    }

    if (initialCouponCode) {
      setCouponInput(initialCouponCode);
      const found = (coupons || []).find(
        (c) => c.isActive && c.code.toUpperCase() === initialCouponCode.trim().toUpperCase()
      );
      setAppliedCoupon(found || null);
    } else {
      setCouponInput('');
      setAppliedCoupon(null);
    }
  }, [isOpen, notebook, initialItems, initialCouponCode]);

  const pricing = useMemo(() => {
    const subtotal = selectedItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
    let bulkDiscount = 0;
    if (
      settings.bulkDiscountEnabled &&
      selectedItems.length >= Number(settings.bulkDiscountMinItems || 2)
    ) {
      bulkDiscount = Math.round((subtotal * Number(settings.bulkDiscountPercent || 0)) / 100);
    }
    const afterBulk = Math.max(0, subtotal - bulkDiscount);
    let couponDiscount = 0;
    if (appliedCoupon && afterBulk >= Number(appliedCoupon.minOrderAmount || 0)) {
      if (appliedCoupon.type === 'percent') {
        couponDiscount = Math.round((afterBulk * Number(appliedCoupon.value || 0)) / 100);
      } else {
        couponDiscount = Math.min(afterBulk, Number(appliedCoupon.value || 0));
      }
    }
    const finalTotal = Math.max(0, afterBulk - couponDiscount);
    return { subtotal, bulkDiscount, couponDiscount, finalTotal };
  }, [selectedItems, settings, appliedCoupon]);

  if (!isOpen) return null;

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = (coupons || []).find((c) => c.isActive && c.code.toUpperCase() === code);
    if (!found) {
      return showToast('كود الخصم غير صحيح أو منتهي الصلاحية', 'error');
    }
    if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
      return showToast('عذرًا، انتهت صلاحية هذا الكوبون', 'error');
    }
    if (found.maxUses && Number(found.usedCount || 0) >= Number(found.maxUses)) {
      return showToast('تم استهلاك الحد الأقصى لاستخدام هذا الكوبون', 'error');
    }
    if (pricing.subtotal < Number(found.minOrderAmount || 0)) {
      return showToast(
        `الحد الأدنى لتفعيل هذا الكوبون هو ${found.minOrderAmount} ${settings.currency}`,
        'error'
      );
    }
    setAppliedCoupon(found);
    showToast(`تم تطبيق كوبون (${found.code}) بنجاح!`, 'success');
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      return showToast('حجم ملف الشعار يجب ألا يتعدى 4 ميجابايت', 'error');
    }
    try {
      const compressed = await compressImageFile(file, 600, 0.85);
      setLogoData(compressed);
      setLogoName(file.name);
    } catch (_) {
      showToast('تعذر قراءة ملف الشعار، يرجى اختيار صورة صالحة', 'error');
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return showToast('حجم صورة الإيصال يجب ألا يتعدى 5 ميجابايت', 'error');
    }
    try {
      const compressed = await compressImageFile(file, 900, 0.8);
      setPaymentReceiptData(compressed);
      setPaymentReceiptName(file.name);
    } catch (_) {
      showToast('تعذر قراءة صورة الإيصال', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const showTeacher = formFieldsCfg.showTeacherNameField !== false;
    const reqTeacher = showTeacher && formFieldsCfg.requireTeacherNameField !== false;
    const showCustomTitle = formFieldsCfg.showCustomTitleField !== false;
    const reqCustomTitle = showCustomTitle && formFieldsCfg.requireCustomTitleField !== false;
    const showPhone = formFieldsCfg.showPhoneField !== false;
    const reqPhone = showPhone && formFieldsCfg.requirePhoneField !== false;
    const showNotes = formFieldsCfg.showNotesField !== false;
    const reqNotes = showNotes && Boolean(formFieldsCfg.requireNotesField);
    const showPayment = formFieldsCfg.showPaymentSection !== false;

    if (reqTeacher && !teacherName.trim()) {
      return showToast(`يرجى إدخال "${formFieldsCfg.teacherNameLabel}"`, 'error');
    }
    if (reqCustomTitle && !customTitle.trim()) {
      return showToast(`يرجى إدخال "${formFieldsCfg.customTitleLabel}"`, 'error');
    }
    if (showPhone && phone.trim() && !validateEgyptianPhone(phone)) {
      return showToast(
        'يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقمًا (يبدأ بـ 010/011/012/015)',
        'error'
      );
    }
    if (reqPhone && !phone.trim()) {
      return showToast(`يرجى إدخال "${formFieldsCfg.phoneLabel}"`, 'error');
    }
    if (reqNotes && !notes.trim()) {
      return showToast(`يرجى إدخال "${formFieldsCfg.notesLabel}"`, 'error');
    }
    if (showPayment && settings.requirePaymentProof && !paymentReceiptData) {
      return showToast('يرجى إرفاق صورة إيصال الدفع لتأكيد الطلب', 'error');
    }
    for (const cf of formFieldsCfg.customFields || []) {
      if (cf.visible !== false && cf.required && !String(customFieldValues[cf.id] || '').trim()) {
        return showToast(`يرجى إدخال حقل "${cf.label}"`, 'error');
      }
    }

    setSubmitting(true);
    try {
      const primaryItem = selectedItems[0] || notebook;
      const customFieldEntries = (formFieldsCfg.customFields || [])
        .filter((cf) => cf.visible !== false)
        .map((cf) => ({
          id: cf.id,
          label: cf.label,
          value: String(customFieldValues[cf.id] || '').trim()
        }))
        .filter((entry) => entry.value);

      const orderObj = {
        id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        orderNumber: generateOrderNumber(),
        teacherName: showTeacher ? teacherName.trim() : 'عميل',
        customNotebookTitle: showCustomTitle
          ? customTitle.trim()
          : primaryItem?.title || 'طلب جديد',
        phone: showPhone ? phone.replace(/[\s\-()]/g, '') : '',
        notes: showNotes ? notes.trim() : '',
        customFieldEntries,
        logoUrl: settings.allowLogoUpload ? logoData : '',
        paymentReceiptUrl: showPayment ? paymentReceiptData : '',
        paymentStatus: showPayment && paymentReceiptData ? 'pending_review' : 'unpaid',
        notebookId: primaryItem?.id || 'custom',
        notebookTitle:
          selectedItems.length > 1
            ? `${primaryItem?.title || 'مذكرة'} (+${selectedItems.length - 1} أخرى)`
            : primaryItem?.title || customTitle.trim() || 'مذكرة مخصصة',
        items: selectedItems.map((it) => ({
          id: it.id,
          title: it.title,
          price: Number(it.price || 0)
        })),
        subtotal: pricing.subtotal,
        bulkDiscount: pricing.bulkDiscount,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        couponDiscount: pricing.couponDiscount,
        totalAmount: pricing.finalTotal,
        status: 'new',
        adminNotes: '',
        deliveryUrl: '',
        nextOrderCoupon: null,
        createdAt: Date.now()
      };

      await onSubmitOrder(orderObj, appliedCoupon?.id);
      setSubmittedOrder(orderObj);
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappConfirmUrl = submittedOrder
    ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
        `السلام عليكم، قمت بتسجيل طلب جديد على ${settings.platformName}\n` +
          `رقم الطلب: ${submittedOrder.orderNumber}\n` +
          `الاسم: ${submittedOrder.teacherName}\n` +
          `المطلوب: ${submittedOrder.customNotebookTitle}\n` +
          `الإجمالي: ${submittedOrder.totalAmount} ${settings.currency}`
      )}`
    : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-l from-blue-900 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-black">
              {submittedOrder ? 'تم استلام طلبك بنجاح!' : 'نموذج طلب تجهيز مذكرة'}
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">
              {submittedOrder
                ? 'احتفظ برقم الطلب لمتابعة حالة التجهيز والتحميل'
                : 'بدون الحاجة لإنشاء حساب — أدخل بيانات التخصيص وسنتواصل معك فورًا'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {submittedOrder ? (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  {settings.orderSuccessMessage}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto space-y-2">
                <span className="text-xs font-bold text-slate-500">رقم متابعة الطلب</span>
                <div className="flex items-center justify-center gap-2">
                  <span dir="ltr" className="text-xl font-black font-mono text-blue-900">
                    {submittedOrder.orderNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(submittedOrder.orderNumber);
                      showToast('تم نسخ رقم الطلب', 'success');
                    }}
                    className="p-1.5 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200"
                    title="نسخ رقم الطلب"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-600 pt-1">
                  الإجمالي المطلوب:{' '}
                  <strong className="text-emerald-700">
                    {submittedOrder.totalAmount} {settings.currency}
                  </strong>
                </div>
              </div>

              {settings.paymentDetails && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-right max-w-md mx-auto">
                  <p className="text-xs font-extrabold text-amber-900 mb-1">
                    بيانات الدفع المتاحة لتأكيد التجهيز:
                  </p>
                  <p className="text-xs text-amber-800 whitespace-pre-line">
                    {settings.paymentDetails}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={whatsappConfirmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال تفاصيل الطلب عبر واتساب</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Important Notices */}
              {settings.importantNoticesEnabled &&
                Array.isArray(settings.importantNoticesList) &&
                settings.importantNoticesList.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{settings.importantNoticesTitle}</span>
                    </div>
                    <ul className="list-disc pr-5 space-y-0.5 text-amber-900/90">
                      {settings.importantNoticesList.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Selected Notebooks & Multi-Item Builder */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">
                    المذكرات المختارة ({selectedItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddMorePicker((v) => !v)}
                    className="px-3 py-1 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة مذكرة أخرى</span>
                  </button>
                </div>

                {selectedItems.length > 0 ? (
                  <div className="space-y-2">
                    {selectedItems.map((item, idx) => (
                      <div
                        key={`${item.id}_${idx}`}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-bold text-slate-800 truncate">{item.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-blue-800">
                            {item.price} {settings.currency}
                          </span>
                          {selectedItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedItems((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                              title="إزالة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    طلب مذكرة خاصة — حدد اسم المذكرة بالأسفل أو اختر من القائمة
                  </p>
                )}

                {showAddMorePicker && (
                  <div className="p-3 rounded-xl bg-white border border-blue-200 space-y-2">
                    <input
                      type="text"
                      placeholder="ابحث عن مذكرة لإضافتها للطلب..."
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {(allNotebooks || [])
                        .filter((nb) =>
                          nb.title.toLowerCase().includes(pickerSearch.trim().toLowerCase())
                        )
                        .map((nb) => (
                          <button
                            key={nb.id}
                            type="button"
                            onClick={() => {
                              setSelectedItems((prev) => [...prev, nb]);
                              setShowAddMorePicker(false);
                              showToast(`تمت إضافة "${nb.title}" للطلب`, 'success');
                            }}
                            className="w-full text-right px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-xs flex items-center justify-between"
                          >
                            <span className="font-bold text-slate-700 truncate">{nb.title}</span>
                            <span className="text-blue-700 font-extrabold shrink-0">
                              + {nb.price} {settings.currency}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {settings.bulkDiscountEnabled && (
                  <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      خصم إضافي {settings.bulkDiscountPercent}% تلقائيًا عند طلب{' '}
                      {settings.bulkDiscountMinItems} مذكرات أو أكثر في نفس الطلب!
                    </span>
                  </div>
                )}
              </div>

              {/* Coupon Input */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  هل لديك كوبون خصم؟ (اختياري)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="أدخل كود الخصم مثل TEACHER20"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-mono uppercase text-left"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold"
                  >
                    تطبيق الكود
                  </button>
                </div>
              </div>

              {/* Dynamic Price Summary */}
              {selectedItems.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي:</span>
                    <span className="font-bold">
                      {pricing.subtotal} {settings.currency}
                    </span>
                  </div>
                  {pricing.bulkDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>خصم طلب أكثر من مذكرة ({settings.bulkDiscountPercent}%):</span>
                      <span>
                        - {pricing.bulkDiscount} {settings.currency}
                      </span>
                    </div>
                  )}
                  {pricing.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>خصم الكوبون ({appliedCoupon?.code}):</span>
                      <span>
                        - {pricing.couponDiscount} {settings.currency}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-blue-950 pt-1.5 border-t border-blue-200/70">
                    <span>الإجمالي النهائي المطلوب:</span>
                    <span className="text-blue-700">
                      {pricing.finalTotal} {settings.currency}
                    </span>
                  </div>
                </div>
              )}

              {/* Built-in Customizable Fields */}
              {formFieldsCfg.showTeacherNameField !== false && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    {formFieldsCfg.teacherNameLabel}{' '}
                    {formFieldsCfg.requireTeacherNameField !== false && (
                      <span className="text-rose-500">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required={formFieldsCfg.requireTeacherNameField !== false}
                    placeholder={formFieldsCfg.teacherNamePlaceholder}
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              )}

              {formFieldsCfg.showCustomTitleField !== false && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    {formFieldsCfg.customTitleLabel}{' '}
                    {formFieldsCfg.requireCustomTitleField !== false && (
                      <span className="text-rose-500">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required={formFieldsCfg.requireCustomTitleField !== false}
                    placeholder={formFieldsCfg.customTitlePlaceholder}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              )}

              {formFieldsCfg.showPhoneField !== false && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    {formFieldsCfg.phoneLabel}{' '}
                    {formFieldsCfg.requirePhoneField !== false && (
                      <span className="text-rose-500">*</span>
                    )}
                  </label>
                  <input
                    type="tel"
                    required={formFieldsCfg.requirePhoneField !== false}
                    dir="ltr"
                    placeholder={formFieldsCfg.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-left font-mono"
                  />
                </div>
              )}

              {/* Dynamic Custom Fields added from Admin Dashboard */}
              {(formFieldsCfg.customFields || [])
                .filter((cf) => cf.visible !== false)
                .map((cf) => (
                  <div key={cf.id}>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      {cf.label} {cf.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={Boolean(cf.required)}
                      placeholder={cf.placeholder || `أدخل ${cf.label}...`}
                      value={customFieldValues[cf.id] || ''}
                      onChange={(e) =>
                        setCustomFieldValues((prev) => ({ ...prev, [cf.id]: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>
                ))}

              {settings.allowLogoUpload && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    {formFieldsCfg.logoLabel}
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 transition text-xs font-bold text-slate-600">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>{logoName || 'اضغط لاختيار ملف الشعار من جهازك'}</span>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {logoData && (
                      <div className="relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-white p-1 shrink-0">
                        <img src={logoData} alt="شعار المعلم" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoData('');
                            setLogoName('');
                          }}
                          className="absolute top-0.5 left-0.5 p-0.5 rounded-full bg-rose-500 text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formFieldsCfg.showNotesField !== false && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    {formFieldsCfg.notesLabel}{' '}
                    {formFieldsCfg.requireNotesField && <span className="text-rose-500">*</span>}
                  </label>
                  <textarea
                    rows="3"
                    required={Boolean(formFieldsCfg.requireNotesField)}
                    placeholder={formFieldsCfg.notesPlaceholder}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              )}

              {/* Payment Details & Receipt Upload Box */}
              {formFieldsCfg.showPaymentSection !== false && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-700" />
                      <span>
                        {formFieldsCfg.paymentSectionLabel}{' '}
                        {settings.requirePaymentProof ? '(إلزامي)' : '(اختياري — لتسريع البدء في التجهيز)'}
                      </span>
                    </span>
                  </div>
                  {settings.paymentDetails && (
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs text-slate-800 whitespace-pre-line">
                      <strong className="block text-emerald-900 mb-0.5">بيانات التحويل المتاحة:</strong>
                      {settings.paymentDetails}
                    </div>
                  )}
                  <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white text-xs font-bold text-emerald-800">
                    <Upload className="w-4 h-4" />
                    <span>
                      {paymentReceiptName ||
                        formFieldsCfg.paymentReceiptPlaceholder ||
                        'ارفع صورة إيصال التحويل (فودافون كاش / إنستاباي)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-l from-blue-800 to-teal-700 hover:from-blue-900 hover:to-teal-800 text-white text-sm font-black flex items-center justify-center gap-2 shadow-xl disabled:opacity-60 transition"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'جاري إرسال طلبك...' : 'تأكيد وإرسال الطلب الآن'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * ADMIN DASHBOARD COMPONENT
 * ============================================================================
 */
function AdminDashboard({
  settings,
  onSaveSettings,
  categories,
  onSaveCategories,
  stages,
  onSaveStages,
  grades,
  onSaveGrades,
  subjects,
  onSaveSubjects,
  notebooks,
  onSaveNotebook,
  onDeleteNotebook,
  orders,
  onUpdateOrder,
  onDeleteOrder,
  coupons,
  onSaveCoupon,
  onDeleteCoupon,
  bundles,
  onSaveBundle,
  onDeleteBundle,
  onLogout,
  onBackToSite,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('stats');

  // Orders filter state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [deliveryDrafts, setDeliveryDrafts] = useState({});
  const [adminNotesDrafts, setAdminNotesDrafts] = useState({});

  // Notebook form state
  const [editingNotebook, setEditingNotebook] = useState(null);
  const [nbForm, setNbForm] = useState({
    title: '',
    categoryId: categories[0]?.id || 'term1',
    stageId: stages[0]?.id || 'primary',
    gradeId: grades[0]?.id || 'g_p4',
    subjectId: subjects[0]?.id || 'sub_ar',
    price: 150,
    oldPrice: 200,
    pagesCount: 80,
    badge: '',
    description: '',
    featuresText: 'إضافة اسم المعلم ورقم الهاتف والشعار على الغلاف وجميع الصفحات\nملف PDF عالي الدقة جاهز للطباعة الفورية',
    coverUrl: '',
    sampleType: 'images',
    sampleImages: [],
    samplePdfUrl: '',
    previewPagesLimit: 4,
    isActive: true
  });

  // Coupon & Bundle state
  const [cpnForm, setCpnForm] = useState({
    code: '',
    type: 'percent',
    value: 15,
    description: '',
    minOrderAmount: 0,
    maxUses: '',
    expiresAt: '',
    isPublic: true,
    isActive: true
  });
  const [bndForm, setBndForm] = useState({
    title: '',
    description: '',
    price: 350,
    oldPrice: 450,
    itemsSummary: '',
    isActive: true
  });

  // Taxonomy inputs
  const [newCatName, setNewCatName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeStageId, setNewGradeStageId] = useState(stages[0]?.id || 'primary');
  const [newSubjectName, setNewSubjectName] = useState('');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...settings,
    orderFormFields: {
      ...DEFAULT_SETTINGS.orderFormFields,
      ...(settings.orderFormFields || {})
    }
  }));
  const [newNoticeText, setNewNoticeText] = useState('');
  const [newCustomFieldLabel, setNewCustomFieldLabel] = useState('');
  const [newCustomFieldPlaceholder, setNewCustomFieldPlaceholder] = useState('');
  const [newCustomFieldRequired, setNewCustomFieldRequired] = useState(false);

  // Admin password change state
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const fileRestoreRef = useRef(null);

  useEffect(() => {
    setSettingsForm({
      ...DEFAULT_SETTINGS,
      ...settings,
      orderFormFields: {
        ...DEFAULT_SETTINGS.orderFormFields,
        ...(settings.orderFormFields || {})
      }
    });
  }, [settings]);

  // Statistics
  const stats = useMemo(() => {
    const total = orders.length;
    const newCount = orders.filter((o) => o.status === 'new').length;
    const completedCount = orders.filter(
      (o) => o.status === 'ready' || o.status === 'delivered'
    ).length;
    const revenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    return { total, newCount, completedCount, revenue };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => (orderStatusFilter === 'all' ? true : o.status === orderStatusFilter))
      .filter((o) => {
        const q = orderSearch.trim().toLowerCase();
        if (!q) return true;
        return (
          String(o.orderNumber || '').toLowerCase().includes(q) ||
          String(o.teacherName || '').toLowerCase().includes(q) ||
          String(o.phone || '').includes(q)
        );
      })
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  }, [orders, orderStatusFilter, orderSearch]);

  const handleExportOrdersCsv = () => {
    const headers = ['رقم الطلب', 'اسم العميل', 'الهاتف', 'المطلوب', 'الإجمالي', 'الحالة', 'التاريخ'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.teacherName,
      o.phone,
      o.customNotebookTitle,
      o.totalAmount,
      ORDER_STATUSES.find((s) => s.id === o.status)?.label || o.status,
      new Date(o.createdAt || Date.now()).toLocaleDateString('ar-EG')
    ]);
    const csvContent =
      '\uFEFF' + [headers, ...rows].map((r) => r.map((v) => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير جدول الطلبات إلى ملف Excel (CSV)', 'success');
  };

  const handleSaveNotebookSubmit = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim()) return showToast('يرجى إدخال عنوان المذكرة', 'error');
    const nbObj = {
      id: editingNotebook ? editingNotebook.id : `nb_${Date.now()}`,
      title: nbForm.title.trim(),
      categoryId: nbForm.categoryId,
      stageId: nbForm.stageId,
      gradeId: nbForm.gradeId,
      subjectId: nbForm.subjectId,
      price: Number(nbForm.price || 0),
      oldPrice: Number(nbForm.oldPrice || 0),
      pagesCount: Number(nbForm.pagesCount || 0),
      badge: nbForm.badge.trim(),
      description: nbForm.description.trim(),
      features: nbForm.featuresText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      coverUrl: nbForm.coverUrl,
      sampleType: nbForm.sampleType,
      sampleImages: nbForm.sampleImages || [],
      samplePdfUrl: nbForm.samplePdfUrl || '',
      previewPagesLimit: Number(nbForm.previewPagesLimit || 4),
      isActive: Boolean(nbForm.isActive),
      createdAt: editingNotebook ? editingNotebook.createdAt : Date.now()
    };
    await onSaveNotebook(nbObj);
    setEditingNotebook(null);
    setNbForm({
      ...nbForm,
      title: '',
      badge: '',
      description: '',
      coverUrl: '',
      sampleImages: [],
      samplePdfUrl: ''
    });
    showToast('تم حفظ المذكرة بنجاح', 'success');
  };

  const handleDownloadBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      settings: settingsForm,
      categories,
      stages,
      grades,
      subjects,
      notebooks,
      coupons,
      bundles,
      orders
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muzakkirati_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تحميل النسخة الاحتياطية الكاملة (JSON)', 'success');
  };

  const handleRestoreBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.settings) await onSaveSettings(parsed.settings);
        if (parsed.categories) await onSaveCategories(parsed.categories);
        if (parsed.stages) await onSaveStages(parsed.stages);
        if (parsed.grades) await onSaveGrades(parsed.grades);
        if (parsed.subjects) await onSaveSubjects(parsed.subjects);
        if (Array.isArray(parsed.notebooks)) {
          for (const nb of parsed.notebooks) await onSaveNotebook(nb);
        }
        if (Array.isArray(parsed.coupons)) {
          for (const cp of parsed.coupons) await onSaveCoupon(cp);
        }
        if (Array.isArray(parsed.bundles)) {
          for (const bn of parsed.bundles) await onSaveBundle(bn);
        }
        showToast('تمت استعادة النسخة الاحتياطية بنجاح!', 'success');
      } catch (_) {
        showToast('ملف النسخة الاحتياطية غير صالح', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateAdminPassword = async () => {
    if (newAdminPass.length < 6) {
      return showToast('يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل', 'error');
    }
    if (newAdminPass !== confirmAdminPass) {
      return showToast('كلمتا المرور غير متطابقتين', 'error');
    }
    const rawCreds = localStorage.getItem('muzakkirati_admin_creds');
    const parsed = rawCreds ? JSON.parse(rawCreds) : { email: 'admin@el3bakera.com' };
    const newSalt = generateSalt();
    const newHash = await hashPasswordWithSalt(newAdminPass, newSalt);
    localStorage.setItem(
      'muzakkirati_admin_creds',
      JSON.stringify({ email: parsed.email, salt: newSalt, hash: newHash })
    );
    setNewAdminPass('');
    setConfirmAdminPass('');
    showToast('تم تحديث كلمة مرور المدير بنجاح', 'success');
  };

  const tabs = [
    { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
    { id: 'orders', label: `الطلبات (${orders.length})`, icon: Package },
    { id: 'notebooks', label: `المذكرات (${notebooks.length})`, icon: BookOpen },
    { id: 'offers', label: 'العروض والكوبونات', icon: Tag },
    { id: 'taxonomy', label: 'المراحل والمواد', icon: FolderTree },
    { id: 'settings', label: 'إعدادات الموقع', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Top Admin Header */}
      <header className="bg-slate-950 text-white px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-black">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black">لوحة التحكم الإدارية</h1>
            <p className="text-[11px] text-slate-400">{settings.platformName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToSite}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>معاينة الموقع</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition ${
                  activeTab === t.id
                    ? 'bg-blue-800 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500">إجمالي الطلبات</span>
                <p className="text-3xl font-black text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-blue-600">طلبات جديدة بانتظار المراجعة</span>
                <p className="text-3xl font-black text-blue-800 mt-1">{stats.newCount}</p>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-emerald-600">طلبات جاهزة / مُسلّمة</span>
                <p className="text-3xl font-black text-emerald-700 mt-1">{stats.completedCount}</p>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-amber-600">إجمالي الإيرادات</span>
                <p className="text-3xl font-black text-slate-900 mt-1">
                  {stats.revenue} <span className="text-sm">{settings.currency}</span>
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
              <h3 className="font-black text-base text-slate-900">توزيع حالات الطلبات</h3>
              <div className="space-y-3">
                {ORDER_STATUSES.map((st) => {
                  const count = orders.filter((o) => o.status === st.id).length;
                  const pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
                  return (
                    <div key={st.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{st.label}</span>
                        <span>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-blue-700 rounded-full transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    placeholder="ابحث برقم الطلب أو اسم العميل أو الهاتف..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="all">جميع الحالات</option>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleExportOrdersCsv}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>تصدير Excel</span>
              </button>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center text-slate-500 text-sm font-bold">
                لا توجد طلبات مطابقة حاليًا
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((ord) => {
                  const statusObj =
                    ORDER_STATUSES.find((s) => s.id === ord.status) || ORDER_STATUSES[0];
                  const draftUrl =
                    deliveryDrafts[ord.id] !== undefined
                      ? deliveryDrafts[ord.id]
                      : ord.deliveryUrl || '';
                  const draftNotes =
                    adminNotesDrafts[ord.id] !== undefined
                      ? adminNotesDrafts[ord.id]
                      : ord.adminNotes || '';

                  const waMsg =
                    `السلام عليكم أ/ ${ord.teacherName}\n` +
                    `بخصوص طلبك رقم (${ord.orderNumber}) على ${settings.platformName}:\n` +
                    `الحالة الحالية: ${statusObj.label}\n` +
                    (draftUrl ? `رابط تحميل مذكرتك جاهز الآن:\n${draftUrl}\n` : '') +
                    (ord.nextOrderCoupon?.isActive
                      ? `هدية خاصة لك: استخدم كود (${ord.nextOrderCoupon.code}) للحصول على خصم ${ord.nextOrderCoupon.value}% في طلبك القادم!`
                      : '');

                  return (
                    <div
                      key={ord.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span dir="ltr" className="font-mono font-black text-sm text-blue-900">
                              {ord.orderNumber}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${statusObj.color}`}
                            >
                              {statusObj.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(ord.createdAt || Date.now()).toLocaleString('ar-EG')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={ord.status}
                            onChange={async (e) => {
                              const nextStatus = e.target.value;
                              let nextCoupon = ord.nextOrderCoupon || null;
                              if (
                                nextStatus === 'delivered' &&
                                !nextCoupon &&
                                settings.autoNextOrderCouponEnabled
                              ) {
                                const code = `VIP${Math.floor(1000 + Math.random() * 9000)}`;
                                nextCoupon = {
                                  code,
                                  type: 'percent',
                                  value: Number(settings.autoNextOrderCouponPercent || 15),
                                  isActive: true
                                };
                                await onSaveCoupon({
                                  id: `cpn_${Date.now()}`,
                                  code,
                                  type: 'percent',
                                  value: Number(settings.autoNextOrderCouponPercent || 15),
                                  description: `كوبون ولاء للطلب ${ord.orderNumber}`,
                                  minOrderAmount: 0,
                                  maxUses: 1,
                                  usedCount: 0,
                                  expiresAt: '',
                                  isPublic: false,
                                  isActive: true
                                });
                              }
                              await onUpdateOrder(ord.id, {
                                status: nextStatus,
                                nextOrderCoupon: nextCoupon
                              });
                              showToast('تم تحديث حالة الطلب', 'success');
                            }}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-extrabold bg-slate-50"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(ord.id)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                            title="حذف الطلب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Customer & Custom Fields Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span>
                              الاسم: <strong>{ord.teacherName}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(ord.teacherName);
                                showToast('تم نسخ الاسم', 'success');
                              }}
                              className="text-blue-700 font-bold flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" /> نسخ
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>
                              العنوان على الغلاف: <strong>{ord.customNotebookTitle}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(ord.customNotebookTitle);
                                showToast('تم نسخ العنوان', 'success');
                              }}
                              className="text-blue-700 font-bold flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" /> نسخ
                            </button>
                          </div>
                          {ord.phone && (
                            <div className="flex items-center justify-between">
                              <span>
                                الهاتف: <strong dir="ltr">{ord.phone}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(ord.phone);
                                  showToast('تم نسخ الرقم', 'success');
                                }}
                                className="text-blue-700 font-bold flex items-center gap-1"
                              >
                                <Copy className="w-3.5 h-3.5" /> نسخ
                              </button>
                            </div>
                          )}
                          {/* Render Any Custom Fields Submitted by User */}
                          {Array.isArray(ord.customFieldEntries) &&
                            ord.customFieldEntries.map((entry, idx) => (
                              <div key={idx} className="pt-1 border-t border-slate-200/70">
                                <span>
                                  {entry.label}: <strong>{entry.value}</strong>
                                </span>
                              </div>
                            ))}
                          {ord.notes && (
                            <div className="pt-1 border-t border-slate-200/70 text-slate-600">
                              ملاحظات: {ord.notes}
                            </div>
                          )}
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 space-y-2">
                          <div>
                            المطلوب: <strong>{ord.notebookTitle}</strong>
                          </div>
                          <div>
                            الإجمالي المدفوع/المطلوب:{' '}
                            <strong className="text-emerald-700">
                              {ord.totalAmount} {settings.currency}
                            </strong>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {ord.logoUrl && (
                              <a
                                href={ord.logoUrl}
                                download={`logo_${ord.orderNumber}.png`}
                                className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-800 font-extrabold flex items-center gap-1"
                              >
                                <Download className="w-3.5 h-3.5" /> تحميل الشعار
                              </a>
                            )}
                            {ord.paymentReceiptUrl && (
                              <a
                                href={ord.paymentReceiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> عرض إيصال الدفع
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delivery Link & Admin Notes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            dir="ltr"
                            placeholder="ألصق رابط ملف المذكرة النهائي (Google Drive)..."
                            value={draftUrl}
                            onChange={(e) =>
                              setDeliveryDrafts((prev) => ({ ...prev, [ord.id]: e.target.value }))
                            }
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-left"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              await onUpdateOrder(ord.id, {
                                deliveryUrl: draftUrl.trim(),
                                status: draftUrl.trim() ? 'ready' : ord.status
                              });
                              showToast('تم حفظ رابط التسليم وتحديث الحالة', 'success');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold shrink-0"
                          >
                            حفظ الرابط
                          </button>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          {ord.phone && (
                            <a
                              href={`https://wa.me/2${ord.phone.replace(/^0/, '')}?text=${encodeURIComponent(
                                waMsg
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>إرسال واتساب للعميل</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOTEBOOKS */}
        {activeTab === 'notebooks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveNotebookSubmit}
              className="lg:col-span-5 p-5 rounded-3xl bg-white border border-slate-200 space-y-3.5 h-fit"
            >
              <h3 className="font-black text-base text-slate-900">
                {editingNotebook ? 'تعديل المذكرة' : 'إضافة مذكرة جديدة'}
              </h3>
              <input
                type="text"
                required
                placeholder="عنوان المذكرة..."
                value={nbForm.title}
                onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={nbForm.categoryId}
                  onChange={(e) => setNbForm({ ...nbForm, categoryId: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={nbForm.stageId}
                  onChange={(e) => {
                    const stId = e.target.value;
                    const firstGrade = grades.find((g) => g.stageId === stId);
                    setNbForm({
                      ...nbForm,
                      stageId: stId,
                      gradeId: firstGrade ? firstGrade.id : ''
                    });
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  value={nbForm.gradeId}
                  onChange={(e) => setNbForm({ ...nbForm, gradeId: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {grades
                    .filter((g) => g.stageId === nbForm.stageId)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                </select>
                <select
                  value={nbForm.subjectId}
                  onChange={(e) => setNbForm({ ...nbForm, subjectId: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
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
                    required
                    value={nbForm.price}
                    onChange={(e) => setNbForm({ ...nbForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    السعر قبل الخصم
                  </label>
                  <input
                    type="number"
                    value={nbForm.oldPrice}
                    onChange={(e) => setNbForm({ ...nbForm, oldPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    عدد الصفحات
                  </label>
                  <input
                    type="number"
                    value={nbForm.pagesCount}
                    onChange={(e) => setNbForm({ ...nbForm, pagesCount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <input
                type="text"
                placeholder="شارة التمييز (مثال: الأكثر طلبًا / عرض خاص)"
                value={nbForm.badge}
                onChange={(e) => setNbForm({ ...nbForm, badge: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />

              <textarea
                rows="3"
                placeholder="وصف المذكرة..."
                value={nbForm.description}
                onChange={(e) => setNbForm({ ...nbForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />

              {/* Cover Upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  صورة غلاف المذكرة (اختياري)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const data = await compressImageFile(f, 700, 0.82);
                    setNbForm({ ...nbForm, coverUrl: data });
                  }}
                  className="text-xs"
                />
              </div>

              {/* Sample Images Upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  صور صفحات عينة المعاينة (حتى 8 صفحات)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []).slice(0, 8);
                    const compressedList = [];
                    for (const f of files) {
                      compressedList.push(await compressImageFile(f, 800, 0.78));
                    }
                    setNbForm({ ...nbForm, sampleType: 'images', sampleImages: compressedList });
                  }}
                  className="text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black"
                >
                  {editingNotebook ? 'حفظ التعديلات' : '+ إضافة المذكرة'}
                </button>
                {editingNotebook && (
                  <button
                    type="button"
                    onClick={() => setEditingNotebook(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </form>

            <div className="lg:col-span-7 space-y-3">
              {notebooks.map((nb) => (
                <div
                  key={nb.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">{nb.title}</h4>
                      {!nb.isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          مخفية
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      السعر: <strong className="text-blue-800">{nb.price} {settings.currency}</strong>{' '}
                      • {nb.pagesCount} صفحة
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotebook(nb);
                        setNbForm({
                          ...nb,
                          featuresText: (nb.features || []).join('\n')
                        });
                      }}
                      className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100"
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSaveNotebook({ ...nb, isActive: !nb.isActive })}
                      className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100"
                      title={nb.isActive ? 'إخفاء' : 'نشر'}
                    >
                      {nb.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNotebook(nb.id)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
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

        {/* TAB 4: OFFERS & COUPONS */}
        {activeTab === 'offers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coupons */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4">
              <h3 className="font-black text-base text-slate-900">إدارة كوبونات الخصم</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!cpnForm.code.trim()) return;
                  await onSaveCoupon({
                    id: `cpn_${Date.now()}`,
                    ...cpnForm,
                    code: cpnForm.code.trim().toUpperCase(),
                    value: Number(cpnForm.value || 0),
                    minOrderAmount: Number(cpnForm.minOrderAmount || 0),
                    maxUses: cpnForm.maxUses ? Number(cpnForm.maxUses) : null,
                    usedCount: 0
                  });
                  setCpnForm({ ...cpnForm, code: '', description: '' });
                  showToast('تم إضافة كوبون الخصم', 'success');
                }}
                className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
              >
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    dir="ltr"
                    placeholder="الكود (SAVE20)"
                    value={cpnForm.code}
                    onChange={(e) => setCpnForm({ ...cpnForm, code: e.target.value.toUpperCase() })}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                  />
                  <select
                    value={cpnForm.type}
                    onChange={(e) => setCpnForm({ ...cpnForm, type: e.target.value })}
                    className="px-2 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="percent">نسبة مئوية %</option>
                    <option value="fixed">مبلغ ثابت ({settings.currency})</option>
                  </select>
                  <input
                    type="number"
                    required
                    placeholder="القيمة"
                    value={cpnForm.value}
                    onChange={(e) => setCpnForm({ ...cpnForm, value: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <input
                  type="text"
                  placeholder="وصف العرض للكوبون..."
                  value={cpnForm.description}
                  onChange={(e) => setCpnForm({ ...cpnForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={cpnForm.isPublic}
                      onChange={(e) => setCpnForm({ ...cpnForm, isPublic: e.target.checked })}
                    />
                    <span>كوبون عام ظاهر في صفحة العروض</span>
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-extrabold"
                  >
                    + إنشاء كوبون
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-black text-blue-800">{c.code}</span> —{' '}
                      <strong>
                        {c.value}
                        {c.type === 'percent' ? '%' : ` ${settings.currency}`}
                      </strong>
                      <p className="text-slate-500 text-[11px]">{c.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteCoupon(c.id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bundles */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4">
              <h3 className="font-black text-base text-slate-900">إدارة الباقات المجمعة</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!bndForm.title.trim()) return;
                  await onSaveBundle({
                    id: `bnd_${Date.now()}`,
                    ...bndForm,
                    price: Number(bndForm.price || 0),
                    oldPrice: Number(bndForm.oldPrice || 0)
                  });
                  setBndForm({ ...bndForm, title: '', description: '', itemsSummary: '' });
                  showToast('تمت إضافة الباقة بنجاح', 'success');
                }}
                className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
              >
                <input
                  type="text"
                  required
                  placeholder="اسم الباقة..."
                  value={bndForm.title}
                  onChange={(e) => setBndForm({ ...bndForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="محتويات الباقة باختصار..."
                  value={bndForm.itemsSummary}
                  onChange={(e) => setBndForm({ ...bndForm, itemsSummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    placeholder="سعر الباقة"
                    value={bndForm.price}
                    onChange={(e) => setBndForm({ ...bndForm, price: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  <input
                    type="number"
                    placeholder="السعر قبل الخصم"
                    value={bndForm.oldPrice}
                    onChange={(e) => setBndForm({ ...bndForm, oldPrice: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-teal-700 text-white text-xs font-extrabold"
                >
                  + إضافة باقة جديدة
                </button>
              </form>

              <div className="space-y-2">
                {bundles.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <strong className="text-slate-900">{b.title}</strong>
                      <p className="text-slate-500 text-[11px]">
                        {b.price} {settings.currency} (بدلًا من {b.oldPrice} {settings.currency})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteBundle(b.id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TAXONOMY */}
        {activeTab === 'taxonomy' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Categories */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
              <h3 className="font-black text-sm">الأقسام الرئيسية</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="اسم قسم جديد..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newCatName.trim()) return;
                    await onSaveCategories([
                      ...categories,
                      {
                        id: `cat_${Date.now()}`,
                        name: newCatName.trim(),
                        description: 'قسم دراسي مضاف',
                        color: 'from-blue-700 to-indigo-800',
                        badge: newCatName.trim()
                      }
                    ]);
                    setNewCatName('');
                    showToast('تمت إضافة القسم', 'success');
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold"
                >
                  +
                </button>
              </div>
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="px-3 py-2 rounded-xl bg-slate-50 flex items-center justify-between text-xs font-bold"
                >
                  <span>{c.name}</span>
                  <button
                    type="button"
                    onClick={() => onSaveCategories(categories.filter((x) => x.id !== c.id))}
                    className="text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Stages & Grades */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
              <h3 className="font-black text-sm">المراحل والصفوف الدراسية</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مرحلة جديدة..."
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newStageName.trim()) return;
                    await onSaveStages([
                      ...stages,
                      { id: `st_${Date.now()}`, name: newStageName.trim(), order: stages.length + 1 }
                    ]);
                    setNewStageName('');
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold"
                >
                  +
                </button>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <select
                  value={newGradeStageId}
                  onChange={(e) => setNewGradeStageId(e.target.value)}
                  className="px-2 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="صف دراسي جديد..."
                  value={newGradeName}
                  onChange={(e) => setNewGradeName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newGradeName.trim()) return;
                    await onSaveGrades([
                      ...grades,
                      { id: `gr_${Date.now()}`, stageId: newGradeStageId, name: newGradeName.trim() }
                    ]);
                    setNewGradeName('');
                  }}
                  className="px-3 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold"
                >
                  +
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1.5">
                {grades.map((g) => (
                  <div
                    key={g.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <span>{g.name}</span>
                    <button
                      type="button"
                      onClick={() => onSaveGrades(grades.filter((x) => x.id !== g.id))}
                      className="text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
              <h3 className="font-black text-sm">المواد الدراسية</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مادة دراسية جديدة..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newSubjectName.trim()) return;
                    await onSaveSubjects([
                      ...subjects,
                      { id: `sub_${Date.now()}`, name: newSubjectName.trim(), visible: true }
                    ]);
                    setNewSubjectName('');
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold"
                >
                  +
                </button>
              </div>
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="px-3 py-2 rounded-xl bg-slate-50 flex items-center justify-between text-xs font-bold"
                >
                  <span>{sub.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onSaveSubjects(
                          subjects.map((x) =>
                            x.id === sub.id ? { ...x, visible: !x.visible } : x
                          )
                        )
                      }
                      className="text-amber-700"
                    >
                      {sub.visible !== false ? 'ظاهرة' : 'مخفية'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSaveSubjects(subjects.filter((x) => x.id !== sub.id))}
                      className="text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onSaveSettings(settingsForm);
                showToast('تم حفظ جميع إعدادات الموقع بنجاح!', 'success');
              }}
              className="p-6 rounded-3xl bg-white border border-slate-200 space-y-6"
            >
              <h3 className="font-black text-lg text-slate-900">إعدادات الهوية والتواصل والنظام</h3>

              {/* Brand & Logo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    اسم المنصة
                  </label>
                  <input
                    type="text"
                    value={settingsForm.platformName || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, platformName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    الوصف المختصر أسفل الاسم
                  </label>
                  <input
                    type="text"
                    value={settingsForm.platformTagline || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, platformTagline: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    شعار المنصة (Logo)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const data = await compressImageFile(f, 400, 0.88);
                      setSettingsForm({ ...settingsForm, logoUrl: data });
                    }}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    صورة خلفية الواجهة الترحيبية (اختياري)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const data = await compressImageFile(f, 1200, 0.78);
                      setSettingsForm({ ...settingsForm, heroBannerUrl: data });
                    }}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Hero & About Texts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    العنوان الرئيسي في الواجهة
                  </label>
                  <input
                    type="text"
                    value={settingsForm.heroTitle || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, heroTitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    عنوان قسم التعريف بالمنصة
                  </label>
                  <input
                    type="text"
                    value={settingsForm.aboutTitle || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, aboutTitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <textarea
                  rows="2"
                  placeholder="النص الترحيبي أسفل العنوان..."
                  value={settingsForm.heroSubtitle || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <textarea
                  rows="2"
                  placeholder="وصف قسم التعريف بالمنصة..."
                  value={settingsForm.aboutDescription || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, aboutDescription: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* Contact, Payment & Social Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    رقم الواتساب (بصيغة 2010...)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsForm.whatsappNumber || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-left font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    رقم خدمة العملاء
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsForm.customerServicePhone || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, customerServicePhone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-left font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={settingsForm.contactEmail || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contactEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-left"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    رابط جروب الواتساب
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsForm.whatsappGroupUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, whatsappGroupUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-left"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    رابط صفحة الفيسبوك
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsForm.facebookUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-left"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    رابط قناة التليجرام
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsForm.telegramUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, telegramUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-left"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    رابط قناة اليوتيوب
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsForm.youtubeUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-left"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    رابط إنستجرام
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsForm.instagramUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-left"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    رابط تيك توك
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsForm.tiktokUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, tiktokUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-left"
                  />
                </div>
              </div>

              {/* Payment & Announcement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    بيانات التحويل والدفع (فودافون كاش / إنستاباي)
                  </label>
                  <textarea
                    rows="2"
                    value={settingsForm.paymentDetails || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, paymentDetails: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    نص شريط العروض العلوي
                  </label>
                  <textarea
                    rows="2"
                    value={settingsForm.announcementText || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, announcementText: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Important Notices Editor */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-950">
                    خانة التنبيهات الهامة للعملاء
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={Boolean(settingsForm.importantNoticesEnabled)}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          importantNoticesEnabled: e.target.checked
                        })
                      }
                    />
                    <span>إظهار التنبيهات</span>
                  </label>
                </div>
                <div className="space-y-1.5">
                  {(settingsForm.importantNoticesList || []).map((notice, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs"
                    >
                      <span>{notice}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSettingsForm({
                            ...settingsForm,
                            importantNoticesList: settingsForm.importantNoticesList.filter(
                              (_, i) => i !== idx
                            )
                          })
                        }
                        className="text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="أضف تنبيهًا جديدًا..."
                    value={newNoticeText}
                    onChange={(e) => setNewNoticeText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newNoticeText.trim()) return;
                      setSettingsForm({
                        ...settingsForm,
                        importantNoticesList: [
                          ...(settingsForm.importantNoticesList || []),
                          newNoticeText.trim()
                        ]
                      });
                      setNewNoticeText('');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-extrabold"
                  >
                    + إضافة تنبيه
                  </button>
                </div>
              </div>

              {/* General Toggles */}
              <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.requirePaymentProof)}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, requirePaymentProof: e.target.checked })
                    }
                  />
                  <span>جعل إرفاق صورة إيصال التحويل إلزاميًا عند الطلب</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-rose-700">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.maintenanceMode)}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })
                    }
                  />
                  <span>تفعيل وضع الصيانة (إغلاق واجهة الموقع مؤقتًا)</span>
                </label>
              </div>

              {/* Order Form Fields Full Customization Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-4">
                <div>
                  <h4 className="font-extrabold text-sm text-blue-950 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-700" />
                    <span>إضافة / إخفاء / تغيير أسماء وخصائص حقول نموذج الطلب</span>
                  </h4>
                  <p className="text-[11px] text-blue-900/75 mt-0.5">
                    غيّر اسم أي حقل، عدّل النص التوضيحي بداخله، أظهره أو أخفه، اجعله إلزاميًا أو اختياريًا، أو أضف حقولًا جديدة بالكامل.
                  </p>
                </div>

                {/* Built-in Fields Full Editor Cards */}
                <div className="space-y-3">
                  {[
                    {
                      badge: 'الحقل 1 (الاسم)',
                      labelKey: 'teacherNameLabel',
                      placeholderKey: 'teacherNamePlaceholder',
                      showKey: 'showTeacherNameField',
                      defaultShow: true,
                      reqKey: 'requireTeacherNameField',
                      defaultReq: true
                    },
                    {
                      badge: 'الحقل 2 (العنوان / المطلوب)',
                      labelKey: 'customTitleLabel',
                      placeholderKey: 'customTitlePlaceholder',
                      showKey: 'showCustomTitleField',
                      defaultShow: true,
                      reqKey: 'requireCustomTitleField',
                      defaultReq: true
                    },
                    {
                      badge: 'الحقل 3 (التواصل)',
                      labelKey: 'phoneLabel',
                      placeholderKey: 'phonePlaceholder',
                      showKey: 'showPhoneField',
                      defaultShow: true,
                      reqKey: 'requirePhoneField',
                      defaultReq: true
                    },
                    {
                      badge: 'الحقل 4 (الملاحظات)',
                      labelKey: 'notesLabel',
                      placeholderKey: 'notesPlaceholder',
                      showKey: 'showNotesField',
                      defaultShow: true,
                      reqKey: 'requireNotesField',
                      defaultReq: false
                    }
                  ].map((item) => {
                    const isShown =
                      settingsForm.orderFormFields?.[item.showKey] !== undefined
                        ? Boolean(settingsForm.orderFormFields[item.showKey])
                        : item.defaultShow;
                    const isReq =
                      settingsForm.orderFormFields?.[item.reqKey] !== undefined
                        ? Boolean(settingsForm.orderFormFields[item.reqKey])
                        : item.defaultReq;

                    return (
                      <div
                        key={item.labelKey}
                        className={`p-3.5 rounded-2xl border transition space-y-2.5 ${
                          isShown
                            ? 'bg-white border-blue-100'
                            : 'bg-slate-100/80 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-extrabold">
                            {item.badge}
                          </span>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isShown}
                                onChange={(e) =>
                                  setSettingsForm({
                                    ...settingsForm,
                                    orderFormFields: {
                                      ...settingsForm.orderFormFields,
                                      [item.showKey]: e.target.checked
                                    }
                                  })
                                }
                                className="w-4 h-4 accent-blue-700"
                              />
                              <span>إظهار الحقل</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-xs font-bold text-rose-700 cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={!isShown}
                                checked={isReq}
                                onChange={(e) =>
                                  setSettingsForm({
                                    ...settingsForm,
                                    orderFormFields: {
                                      ...settingsForm.orderFormFields,
                                      [item.reqKey]: e.target.checked
                                    }
                                  })
                                }
                                className="w-4 h-4 accent-rose-600"
                              />
                              <span>إلزامي</span>
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              اسم الحقل الظاهر للعميل
                            </label>
                            <input
                              type="text"
                              value={settingsForm.orderFormFields?.[item.labelKey] || ''}
                              onChange={(e) =>
                                setSettingsForm({
                                  ...settingsForm,
                                  orderFormFields: {
                                    ...settingsForm.orderFormFields,
                                    [item.labelKey]: e.target.value
                                  }
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              النص التوضيحي داخل الخانة (Placeholder)
                            </label>
                            <input
                              type="text"
                              value={settingsForm.orderFormFields?.[item.placeholderKey] || ''}
                              onChange={(e) =>
                                setSettingsForm({
                                  ...settingsForm,
                                  orderFormFields: {
                                    ...settingsForm.orderFormFields,
                                    [item.placeholderKey]: e.target.value
                                  }
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Logo & Payment Section Labels & Visibility */}
                  <div className="p-3.5 rounded-2xl bg-white border border-blue-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          اسم حقل رفع الشعار / الملف
                        </label>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-blue-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(settingsForm.allowLogoUpload)}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                allowLogoUpload: e.target.checked
                              })
                            }
                            className="w-3.5 h-3.5 accent-blue-700"
                          />
                          <span>إظهار</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={settingsForm.orderFormFields?.logoLabel || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            orderFormFields: {
                              ...settingsForm.orderFormFields,
                              logoLabel: e.target.value
                            }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          اسم قسم الدفع وإرفاق الإيصال
                        </label>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.orderFormFields?.showPaymentSection !== false}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                orderFormFields: {
                                  ...settingsForm.orderFormFields,
                                  showPaymentSection: e.target.checked
                                }
                              })
                            }
                            className="w-3.5 h-3.5 accent-emerald-600"
                          />
                          <span>إظهار</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={settingsForm.orderFormFields?.paymentSectionLabel || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            orderFormFields: {
                              ...settingsForm.orderFormFields,
                              paymentSectionLabel: e.target.value
                            }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Fields List & Adder */}
                <div className="space-y-2.5 pt-2 border-t border-blue-200/70">
                  <label className="block text-xs font-extrabold text-slate-800">
                    حقول إضافية مخصصة في نموذج الطلب (
                    {(settingsForm.orderFormFields?.customFields || []).length})
                  </label>

                  {(settingsForm.orderFormFields?.customFields || []).map((cf, idx) => (
                    <div
                      key={cf.id}
                      className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cf.label}
                          onChange={(e) => {
                            const updated = [...(settingsForm.orderFormFields?.customFields || [])];
                            updated[idx] = { ...cf, label: e.target.value };
                            setSettingsForm({
                              ...settingsForm,
                              orderFormFields: {
                                ...settingsForm.orderFormFields,
                                customFields: updated
                              }
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-extrabold"
                          placeholder="اسم الحقل"
                        />
                        <input
                          type="text"
                          value={cf.placeholder || ''}
                          onChange={(e) => {
                            const updated = [...(settingsForm.orderFormFields?.customFields || [])];
                            updated[idx] = { ...cf, placeholder: e.target.value };
                            setSettingsForm({
                              ...settingsForm,
                              orderFormFields: {
                                ...settingsForm.orderFormFields,
                                customFields: updated
                              }
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                          placeholder="النص التوضيحي"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cf.visible !== false}
                              onChange={(e) => {
                                const updated = [
                                  ...(settingsForm.orderFormFields?.customFields || [])
                                ];
                                updated[idx] = { ...cf, visible: e.target.checked };
                                setSettingsForm({
                                  ...settingsForm,
                                  orderFormFields: {
                                    ...settingsForm.orderFormFields,
                                    customFields: updated
                                  }
                                });
                              }}
                              className="w-4 h-4 accent-blue-700"
                            />
                            <span>إظهار</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-rose-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(cf.required)}
                              onChange={(e) => {
                                const updated = [
                                  ...(settingsForm.orderFormFields?.customFields || [])
                                ];
                                updated[idx] = { ...cf, required: e.target.checked };
                                setSettingsForm({
                                  ...settingsForm,
                                  orderFormFields: {
                                    ...settingsForm.orderFormFields,
                                    customFields: updated
                                  }
                                });
                              }}
                              className="w-4 h-4 accent-rose-600"
                            />
                            <span>إلزامي</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextList = (
                              settingsForm.orderFormFields?.customFields || []
                            ).filter((_, i) => i !== idx);
                            setSettingsForm({
                              ...settingsForm,
                              orderFormFields: {
                                ...settingsForm.orderFormFields,
                                customFields: nextList
                              }
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="اسم الحقل الجديد (مثال: المحافظة)"
                      value={newCustomFieldLabel}
                      onChange={(e) => setNewCustomFieldLabel(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="نص توضيحي داخل الخانة (اختياري)"
                      value={newCustomFieldPlaceholder}
                      onChange={(e) => setNewCustomFieldPlaceholder(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={newCustomFieldRequired}
                          onChange={(e) => setNewCustomFieldRequired(e.target.checked)}
                          className="w-4 h-4 accent-blue-700"
                        />
                        <span>إلزامي</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCustomFieldLabel.trim()) return;
                          const createdField = {
                            id: `cf_${Date.now()}`,
                            label: newCustomFieldLabel.trim(),
                            placeholder: newCustomFieldPlaceholder.trim(),
                            required: Boolean(newCustomFieldRequired),
                            visible: true
                          };
                          setSettingsForm({
                            ...settingsForm,
                            orderFormFields: {
                              ...settingsForm.orderFormFields,
                              customFields: [
                                ...(settingsForm.orderFormFields?.customFields || []),
                                createdField
                              ]
                            }
                          });
                          setNewCustomFieldLabel('');
                          setNewCustomFieldPlaceholder('');
                          setNewCustomFieldRequired(false);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold"
                      >
                        + إضافة حقل
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-black flex items-center gap-2 shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>حفظ جميع الإعدادات</span>
              </button>
            </form>

            {/* Backup & Password Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
                <h4 className="font-black text-sm text-slate-900">النسخ الاحتياطي والاستعادة</h4>
                <p className="text-xs text-slate-500">
                  احفظ نسخة احتياطية كاملة من المذكرات والطلبات والإعدادات بصيغة JSON.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>نسخة احتياطية (JSON)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRestoreRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>استعادة من ملف</span>
                  </button>
                  <input
                    ref={fileRestoreRef}
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
                <h4 className="font-black text-sm text-slate-900">تغيير كلمة مرور المدير</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    placeholder="كلمة المرور الجديدة"
                    value={newAdminPass}
                    onChange={(e) => setNewAdminPass(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="password"
                    placeholder="تأكيد كلمة المرور"
                    value={confirmAdminPass}
                    onChange={(e) => setConfirmAdminPass(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUpdateAdminPassword}
                  className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-extrabold"
                >
                  تحديث كلمة المرور
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * MAIN APPLICATION COMPONENT (APP)
 * ============================================================================
 */
export default function App() {
  // Navigation & UI state
  const [page, setPage] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Browse filters
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNotebook, setActiveNotebook] = useState(null);

  // Order Modal state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderTargetNotebook, setOrderTargetNotebook] = useState(null);
  const [orderInitialItems, setOrderInitialItems] = useState([]);
  const [orderInitialCoupon, setOrderInitialCoupon] = useState('');

  // Track Order state
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrders, setTrackedOrders] = useState(null);

  // Admin Auth state
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminCredsExists, setAdminCredsExists] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Persistent Data States (LocalStorage + Firebase Firestore Live Sync)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (_) {
      return DEFAULT_SETTINGS;
    }
  });
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch (_) {
      return DEFAULT_CATEGORIES;
    }
  });
  const [stages, setStages] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_stages');
      return saved ? JSON.parse(saved) : DEFAULT_STAGES;
    } catch (_) {
      return DEFAULT_STAGES;
    }
  });
  const [grades, setGrades] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_grades');
      return saved ? JSON.parse(saved) : DEFAULT_GRADES;
    } catch (_) {
      return DEFAULT_GRADES;
    }
  });
  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_subjects');
      return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
    } catch (_) {
      return DEFAULT_SUBJECTS;
    }
  });
  const [notebooks, setNotebooks] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_notebooks');
      return saved ? JSON.parse(saved) : DEFAULT_NOTEBOOKS;
    } catch (_) {
      return DEFAULT_NOTEBOOKS;
    }
  });
  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_coupons');
      return saved ? JSON.parse(saved) : DEFAULT_COUPONS;
    } catch (_) {
      return DEFAULT_COUPONS;
    }
  });
  const [bundles, setBundles] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_bundles');
      return saved ? JSON.parse(saved) : DEFAULT_BUNDLES;
    } catch (_) {
      return DEFAULT_BUNDLES;
    }
  });
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('muzakkirati_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3600);
  };

  // Check admin session & credentials on mount
  useEffect(() => {
    const creds = localStorage.getItem('muzakkirati_admin_creds');
    setAdminCredsExists(Boolean(creds));
    const session = localStorage.getItem('muzakkirati_admin_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
          setAdminAuthenticated(true);
        }
      } catch (_) {
        // ignore invalid session
      }
    }
  }, []);

  // Firebase Auth & Real-time Listeners
  useEffect(() => {
    if (!auth || !db) return;
    let unsubConfig = () => {};
    let unsubNotebooks = () => {};
    let unsubOrders = () => {};
    let unsubCoupons = () => {};
    let unsubBundles = () => {};

    signInAnonymously(auth).catch(() => {});
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      const basePath = ['artifacts', appId, 'public', 'data'];

      unsubConfig = onSnapshot(doc(db, ...basePath, 'config', 'main'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.settings) {
            setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...data.settings }));
            localStorage.setItem('muzakkirati_settings', JSON.stringify(data.settings));
          }
          if (data.categories) setCategories(data.categories);
          if (data.stages) setStages(data.stages);
          if (data.grades) setGrades(data.grades);
          if (data.subjects) setSubjects(data.subjects);
          if (data.adminCreds) {
            localStorage.setItem('muzakkirati_admin_creds', JSON.stringify(data.adminCreds));
            setAdminCredsExists(true);
          }
        }
      });

      unsubNotebooks = onSnapshot(collection(db, ...basePath, 'notebooks'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data());
          setNotebooks(list);
          localStorage.setItem('muzakkirati_notebooks', JSON.stringify(list));
        }
      });

      unsubOrders = onSnapshot(collection(db, ...basePath, 'orders'), (snap) => {
        const list = snap.docs.map((d) => d.data());
        setOrders(list);
        localStorage.setItem('muzakkirati_orders', JSON.stringify(list));
      });

      unsubCoupons = onSnapshot(collection(db, ...basePath, 'coupons'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data());
          setCoupons(list);
          localStorage.setItem('muzakkirati_coupons', JSON.stringify(list));
        }
      });

      unsubBundles = onSnapshot(collection(db, ...basePath, 'bundles'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data());
          setBundles(list);
          localStorage.setItem('muzakkirati_bundles', JSON.stringify(list));
        }
      });
    });

    return () => {
      unsubAuth();
      unsubConfig();
      unsubNotebooks();
      unsubOrders();
      unsubCoupons();
      unsubBundles();
    };
  }, []);

  // Persistence helpers
  const persistConfigDoc = async (partial) => {
    if (db) {
      try {
        await setDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'config', 'main'),
          partial,
          { merge: true }
        );
      } catch (_) {}
    }
  };

  const handleSaveSettings = async (nextSettings) => {
    setSettings(nextSettings);
    localStorage.setItem('muzakkirati_settings', JSON.stringify(nextSettings));
    await persistConfigDoc({ settings: nextSettings });
  };

  const handleSaveCategories = async (next) => {
    setCategories(next);
    localStorage.setItem('muzakkirati_categories', JSON.stringify(next));
    await persistConfigDoc({ categories: next });
  };

  const handleSaveStages = async (next) => {
    setStages(next);
    localStorage.setItem('muzakkirati_stages', JSON.stringify(next));
    await persistConfigDoc({ stages: next });
  };

  const handleSaveGrades = async (next) => {
    setGrades(next);
    localStorage.setItem('muzakkirati_grades', JSON.stringify(next));
    await persistConfigDoc({ grades: next });
  };

  const handleSaveSubjects = async (next) => {
    setSubjects(next);
    localStorage.setItem('muzakkirati_subjects', JSON.stringify(next));
    await persistConfigDoc({ subjects: next });
  };

  const handleSaveNotebook = async (nbObj) => {
    const next = notebooks.some((n) => n.id === nbObj.id)
      ? notebooks.map((n) => (n.id === nbObj.id ? nbObj : n))
      : [nbObj, ...notebooks];
    setNotebooks(next);
    localStorage.setItem('muzakkirati_notebooks', JSON.stringify(next));
    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notebooks', nbObj.id), nbObj);
      } catch (_) {}
    }
  };

  const handleDeleteNotebook = async (id) => {
    const next = notebooks.filter((n) => n.id !== id);
    setNotebooks(next);
    localStorage.setItem('muzakkirati_notebooks', JSON.stringify(next));
    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notebooks', id));
      } catch (_) {}
    }
    showToast('تم حذف المذكرة', 'success');
  };

  const handleSubmitOrder = async (orderObj, appliedCouponId) => {
    const nextOrders = [orderObj, ...orders];
    setOrders(nextOrders);
    localStorage.setItem('muzakkirati_orders', JSON.stringify(nextOrders));
    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderObj.id), orderObj);
      } catch (_) {}
    }
    if (appliedCouponId) {
      const target = coupons.find((c) => c.id === appliedCouponId);
      if (target) {
        await handleSaveCoupon({ ...target, usedCount: Number(target.usedCount || 0) + 1 });
      }
    }
  };

  const handleUpdateOrder = async (orderId, updates) => {
    const next = orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o));
    setOrders(next);
    localStorage.setItem('muzakkirati_orders', JSON.stringify(next));
    if (db) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), updates);
      } catch (_) {}
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const next = orders.filter((o) => o.id !== orderId);
    setOrders(next);
    localStorage.setItem('muzakkirati_orders', JSON.stringify(next));
    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId));
      } catch (_) {}
    }
    showToast('تم حذف الطلب', 'success');
  };

  const handleSaveCoupon = async (cpnObj) => {
    const next = coupons.some((c) => c.id === cpnObj.id)
      ? coupons.map((c) => (c.id === cpnObj.id ? cpnObj : c))
      : [cpnObj, ...coupons];
    setCoupons(next);
    localStorage.setItem('muzakkirati_coupons', JSON.stringify(next));
    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'coupons', cpnObj.id), cpnObj);
      } catch (_) {}
    }
  };

  const handleDeleteCoupon = async (id) => {
    const next = coupons.filter((c) => c.id !== id);
    setCoupons(next);
    localStorage.setItem('muzakkirati_coupons', JSON.stringify(next));
    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'coupons', id));
      } catch (_) {}
    }
  };

  const handleSaveBundle = async (bndObj) => {
    const next = bundles.some((b) => b.id === bndObj.id)
      ? bundles.map((b) => (b.id === bndObj.id ? bndObj : b))
      : [bndObj, ...bundles];
    setBundles(next);
    localStorage.setItem('muzakkirati_bundles', JSON.stringify(next));
    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bundles', bndObj.id), bndObj);
      } catch (_) {}
    }
  };

  const handleDeleteBundle = async (id) => {
    const next = bundles.filter((b) => b.id !== id);
    setBundles(next);
    localStorage.setItem('muzakkirati_bundles', JSON.stringify(next));
    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bundles', id));
      } catch (_) {}
    }
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      return showToast('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
    }
    const rawCreds = localStorage.getItem('muzakkirati_admin_creds');
    if (!rawCreds) {
      if (loginPassword.length < 6) {
        return showToast('يرجى اختيار كلمة مرور من 6 أحرف على الأقل', 'error');
      }
      const salt = generateSalt();
      const hash = await hashPasswordWithSalt(loginPassword, salt);
      const credsObj = { email: loginEmail.trim().toLowerCase(), salt, hash };
      localStorage.setItem('muzakkirati_admin_creds', JSON.stringify(credsObj));
      await persistConfigDoc({ adminCreds: credsObj });
      localStorage.setItem(
        'muzakkirati_admin_session',
        JSON.stringify({ expiresAt: Date.now() + 86400000 })
      );
      setAdminCredsExists(true);
      setAdminAuthenticated(true);
      showToast('تم إنشاء حساب المدير وتأمين لوحة التحكم بنجاح!', 'success');
    } else {
      const parsed = JSON.parse(rawCreds);
      const attemptHash = await hashPasswordWithSalt(loginPassword, parsed.salt);
      if (
        loginEmail.trim().toLowerCase() === parsed.email &&
        attemptHash === parsed.hash
      ) {
        localStorage.setItem(
          'muzakkirati_admin_session',
          JSON.stringify({ expiresAt: Date.now() + 86400000 })
        );
        setAdminAuthenticated(true);
        showToast('مرحبًا بك في لوحة التحكم!', 'success');
      } else {
        showToast('بيانات الدخول غير صحيحة', 'error');
      }
    }
  };

  // LookUp helpers
  const lookUp = useMemo(() => {
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
    const stageMap = Object.fromEntries(stages.map((s) => [s.id, s]));
    const gradeMap = Object.fromEntries(grades.map((g) => [g.id, g]));
    const subMap = Object.fromEntries(subjects.map((s) => [s.id, s]));
    return { catMap, stageMap, gradeMap, subMap };
  }, [categories, stages, grades, subjects]);

  const visibleSubjectIds = useMemo(
    () => new Set(subjects.filter((s) => s.visible !== false).map((s) => s.id)),
    [subjects]
  );

  const publishedNotebooks = useMemo(
    () => notebooks.filter((n) => n.isActive !== false && visibleSubjectIds.has(n.subjectId)),
    [notebooks, visibleSubjectIds]
  );

  const filteredNotebooks = useMemo(() => {
    return publishedNotebooks
      .filter((n) => (selectedCategoryId ? n.categoryId === selectedCategoryId : true))
      .filter((n) => (selectedStageId ? n.stageId === selectedStageId : true))
      .filter((n) => (selectedSubjectId ? n.subjectId === selectedSubjectId : true))
      .filter((n) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          String(n.description || '').toLowerCase().includes(q)
        );
      });
  }, [
    publishedNotebooks,
    selectedCategoryId,
    selectedStageId,
    selectedSubjectId,
    searchQuery
  ]);

  const openOrderForNotebook = (nb) => {
    setOrderTargetNotebook(nb || null);
    setOrderInitialItems(nb ? [nb] : []);
    setOrderInitialCoupon('');
    setOrderModalOpen(true);
  };

  // Render Admin View
  if (page === 'admin') {
    if (!adminAuthenticated) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-900"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {adminCredsExists ? 'تسجيل دخول الإدارة' : 'إعداد حساب المدير لأول مرة'}
              </h2>
              <p className="text-xs text-slate-500">
                {adminCredsExists
                  ? 'أدخل البريد الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم'
                  : 'أنشئ بريدك الإلكتروني وكلمة المرور الخاصة بك لتأمين لوحة التحكم'}
              </p>
            </div>
            <form onSubmit={handleAdminLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  البريد الإلكتروني للمدير
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="admin@domain.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  required
                  dir="ltr"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-left"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-sm font-black shadow-lg"
              >
                {adminCredsExists ? 'دخول لوحة التحكم' : 'حفظ الحساب والدخول'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setPage('home')}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ← العودة إلى واجهة الموقع
            </button>
          </div>
          {toast && (
            <div className="fixed bottom-5 left-5 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700">
              {toast.message}
            </div>
          )}
        </div>
      );
    }

    return (
      <div dir="rtl">
        <AdminDashboard
          settings={settings}
          onSaveSettings={handleSaveSettings}
          categories={categories}
          onSaveCategories={handleSaveCategories}
          stages={stages}
          onSaveStages={handleSaveStages}
          grades={grades}
          onSaveGrades={handleSaveGrades}
          subjects={subjects}
          onSaveSubjects={handleSaveSubjects}
          notebooks={notebooks}
          onSaveNotebook={handleSaveNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          orders={orders}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
          coupons={coupons}
          onSaveCoupon={handleSaveCoupon}
          onDeleteCoupon={handleDeleteCoupon}
          bundles={bundles}
          onSaveBundle={handleSaveBundle}
          onDeleteBundle={handleDeleteBundle}
          onLogout={() => {
            localStorage.removeItem('muzakkirati_admin_session');
            setAdminAuthenticated(false);
            setPage('home');
          }}
          onBackToSite={() => setPage('home')}
          showToast={showToast}
        />
        {toast && (
          <div className="fixed bottom-5 left-5 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700">
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  // Maintenance Mode Gate for Visitors
  if (settings.maintenanceMode) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-5"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
          <Settings className="w-8 h-8 animate-spin" />
        </div>
        <h1 className="text-2xl font-black">{settings.platformName}</h1>
        <p className="text-sm text-slate-300 max-w-md">
          الموقع في وضع التحديث والصيانة حاليًا لتقديم تجربة أفضل. سنعود للعمل خلال دقائق!
        </p>
        <button
          type="button"
          onClick={() => setPage('admin')}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
        >
          دخول الإدارة
        </button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Announcement Bar */}
      {settings.announcementEnabled && settings.announcementText && (
        <div className="bg-slate-950 text-white px-4 py-2 text-center text-xs font-bold flex flex-wrap items-center justify-center gap-2">
          <span>{settings.announcementText}</span>
          <button
            type="button"
            onClick={() => setPage('offers')}
            className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] hover:bg-amber-300 transition"
          >
            استفد من العرض ←
          </button>
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Brand */}
          <button
            type="button"
            onClick={() => setPage('home')}
            className="flex items-center gap-3 text-right"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.platformName}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-contain border border-slate-200 bg-white p-1"
              />
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-800 to-teal-600 text-white flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6" />
              </div>
            )}
            <div>
              <span className="block text-sm sm:text-lg font-black text-slate-900 leading-tight">
                {settings.platformName}
              </span>
              <span className="hidden sm:block text-[11px] text-slate-500 font-semibold">
                {settings.platformTagline}
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { id: 'home', label: 'الرئيسية' },
              { id: 'browse', label: 'المذكرات' },
              { id: 'offers', label: 'العروض والباقات' },
              { id: 'track', label: 'تتبع طلبك' },
              { id: 'contact', label: 'اتصل بنا' }
            ].map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => {
                  if (nav.id === 'browse') {
                    setSelectedCategoryId('');
                    setSelectedStageId('');
                    setSelectedSubjectId('');
                  }
                  setPage(nav.id);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                  page === nav.id
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {nav.label}
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">واتساب</span>
            </a>
            <button
              type="button"
              onClick={() => setPage('admin')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>لوحة التحكم</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pb-4 pt-2 bg-white border-t border-slate-100 flex flex-col gap-1">
            {[
              { id: 'home', label: 'الرئيسية' },
              { id: 'browse', label: 'المذكرات' },
              { id: 'offers', label: 'العروض والباقات' },
              { id: 'track', label: 'تتبع طلبك' },
              { id: 'contact', label: 'اتصل بنا' }
            ].map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => {
                  setPage(nav.id);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                {nav.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* MAIN CONTENT PAGES */}
      <main className="flex-1">
        {/* ==================== HOME PAGE ==================== */}
        {page === 'home' && (
          <div className="space-y-12 pb-16">
            {/* Hero Banner */}
            <section
              style={
                settings.heroBannerUrl
                  ? {
                      backgroundImage: `linear-gradient(to left, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.72)), url(${settings.heroBannerUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }
                  : undefined
              }
              className={`${
                settings.heroBannerUrl
                  ? 'bg-slate-900'
                  : 'bg-gradient-to-l from-blue-950 via-blue-900 to-teal-800'
              } text-white py-14 sm:py-20 px-4 sm:px-6`}
            >
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-amber-300 text-xs font-extrabold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>مذكرات منسقة وجاهزة للطباعة باسمك وشعارك الخاص</span>
                  </span>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight">
                    {settings.heroTitle}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                    {settings.heroSubtitle}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPage('browse')}
                      className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black flex items-center gap-2 shadow-xl transition"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>استعرض المذكرات المتاحة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openOrderForNotebook(null)}
                      className="px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-extrabold flex items-center gap-2 transition"
                    >
                      <FileText className="w-4 h-4" />
                      <span>اطلب مذكرة خاصة</span>
                    </button>
                  </div>
                </div>

                {/* Trust Card */}
                <div className="lg:col-span-5">
                  <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-300">
                        لماذا يثق بنا المعلمون؟
                      </span>
                      <Award className="w-5 h-5 text-amber-300" />
                    </div>
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-100">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>إضافة اسمك ورقم هاتفك وشعارك على الغلاف وجميع الصفحات</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>ملفات PDF فائقة الجودة جاهزة للطباعة الفورية</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>معاينة عينات حقيقية من المذكرة قبل تأكيد الطلب</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>تسليم سريع ومتابعة مباشرة لحالة طلبك خطوة بخطوة</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* About Platform Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-extrabold">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>تعرف على منصتنا</span>
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {settings.aboutTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {settings.aboutDescription}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPage('browse')}
                      className="px-4 py-2 rounded-xl bg-blue-800 text-white text-xs font-extrabold"
                    >
                      تصفح أحدث المذكرات المتاحة
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage('contact')}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-extrabold"
                    >
                      تواصل معنا
                    </button>
                  </div>
                </div>
                <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <Award className="w-6 h-6 text-blue-700 mb-2" />
                    <h4 className="font-extrabold text-xs text-slate-900">محتوى علمي منقح</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      مذكرات محدثة ومطابقة لأحدث مواصفات المناهج والامتحانات.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <Sparkles className="w-6 h-6 text-indigo-600 mb-2" />
                    <h4 className="font-extrabold text-xs text-slate-900">تخصيص باسمك وشعارك</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      إضافة اسم المعلم ورقم هاتفه وشعاره على الغلاف وجميع الصفحات.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <Clock className="w-6 h-6 text-teal-600 mb-2" />
                    <h4 className="font-extrabold text-xs text-slate-900">سرعة في التنفيذ</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      تجهيز وتسليم نسخة PDF عالية الدقة جاهزة للطباعة خلال 24 ساعة.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <Eye className="w-6 h-6 text-amber-600 mb-2" />
                    <h4 className="font-extrabold text-xs text-slate-900">معاينة قبل الطلب</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      اطلع على عينات حقيقية من صفحات المذكرة قبل تأكيد طلبك.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Main 3 Categories */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-3xl font-black text-slate-900">اختر القسم الدراسي</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  ابدأ باختيار القسم ثم المرحلة التعليمية والمادة الدراسية
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {categories.map((cat) => {
                  const count = publishedNotebooks.filter((n) => n.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSelectedStageId('');
                        setSelectedSubjectId('');
                        setPage('browse');
                      }}
                      className={`text-right p-6 rounded-3xl bg-gradient-to-br ${cat.color} text-white shadow-lg hover:scale-[1.01] transition space-y-3`}
                    >
                      <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-[11px] font-extrabold">
                        {count} مذكرة متاحة
                      </span>
                      <h3 className="text-xl font-black">{cat.name}</h3>
                      <p className="text-xs text-white/85 leading-relaxed">{cat.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Latest Notebooks */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    أحدث المذكرات المتاحة
                  </h2>
                  <p className="text-xs text-slate-500">
                    جاهزة للتخصيص باسمك وشعارك والطباعة الفورية
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPage('browse')}
                  className="text-xs sm:text-sm font-extrabold text-blue-800 hover:underline"
                >
                  عرض الكل ←
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {publishedNotebooks.slice(0, 4).map((nb) => {
                  const hasDiscount = Number(nb.oldPrice) > Number(nb.price);
                  const savePct = hasDiscount
                    ? Math.round(((nb.oldPrice - nb.price) / nb.oldPrice) * 100)
                    : 0;
                  return (
                    <div
                      key={nb.id}
                      className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                    >
                      <div className="relative h-44 bg-gradient-to-br from-blue-900 to-teal-700 p-4 flex flex-col justify-between text-white">
                        {nb.coverUrl ? (
                          <img
                            src={nb.coverUrl}
                            alt={nb.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : null}
                        <div className="relative z-10 flex items-center justify-between gap-2">
                          {nb.badge && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                              {nb.badge}
                            </span>
                          )}
                          {hasDiscount && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black">
                              وفر {savePct}%
                            </span>
                          )}
                        </div>
                        {!nb.coverUrl && (
                          <div className="relative z-10">
                            <span className="text-[11px] text-blue-100 font-bold">
                              {lookUp.subMap[nb.subjectId]?.name}
                            </span>
                            <h4 className="font-black text-sm line-clamp-2 mt-0.5">{nb.title}</h4>
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {lookUp.gradeMap[nb.gradeId]?.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold">
                              {nb.pagesCount} صفحة
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm text-slate-900 line-clamp-2">
                            {nb.title}
                          </h3>
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-slate-100">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-blue-800">
                              {nb.price} {settings.currency}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-slate-400 line-through">
                                بدلًا من {nb.oldPrice} {settings.currency}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveNotebook(nb);
                                setPage('details');
                              }}
                              className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold"
                            >
                              معاينة العينة
                            </button>
                            <button
                              type="button"
                              onClick={() => openOrderForNotebook(nb)}
                              className="py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-extrabold"
                            >
                              اطلب الآن
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ==================== BROWSE PAGE ==================== */}
        {page === 'browse' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900">تصفح المذكرات التعليمية</h1>
                <p className="text-xs text-slate-500">
                  اختر القسم والمرحلة والمادة أو ابحث مباشرة باسم المذكرة
                </p>
              </div>
              <button
                type="button"
                onClick={() => openOrderForNotebook(null)}
                className="px-4 py-2.5 rounded-xl bg-blue-800 text-white text-xs font-extrabold"
              >
                + اطلب مذكرة خاصة
              </button>
            </div>

            {/* Filters Bar */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="ابحث باسم المذكرة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="">جميع الأقسام</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedStageId}
                onChange={(e) => setSelectedStageId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="">جميع المراحل</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="">جميع المواد</option>
                {subjects
                  .filter((s) => s.visible !== false)
                  .map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Results Grid */}
            {filteredNotebooks.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
                <p className="text-sm font-bold text-slate-600">
                  لا توجد مذكرات مطابقة لخيارات البحث الحالية
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('');
                    setSelectedStageId('');
                    setSelectedSubjectId('');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-800 text-white text-xs font-bold"
                >
                  عرض جميع المذكرات
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredNotebooks.map((nb) => {
                  const hasDiscount = Number(nb.oldPrice) > Number(nb.price);
                  return (
                    <div
                      key={nb.id}
                      className="rounded-3xl bg-white border border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold">
                            {lookUp.catMap[nb.categoryId]?.name}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {lookUp.gradeMap[nb.gradeId]?.name}
                          </span>
                        </div>
                        <h3 className="font-black text-base text-slate-900">{nb.title}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{nb.description}</p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-black text-blue-800">
                              {nb.price} {settings.currency}
                            </span>
                            {hasDiscount && (
                              <span className="mr-2 text-xs text-slate-400 line-through">
                                {nb.oldPrice} {settings.currency}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-500">
                            {nb.pagesCount} صفحة
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveNotebook(nb);
                              setPage('details');
                            }}
                            className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold"
                          >
                            معاينة التفاصيل
                          </button>
                          <button
                            type="button"
                            onClick={() => openOrderForNotebook(nb)}
                            className="py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-extrabold"
                          >
                            اطلب الآن
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

        {/* ==================== DETAILS PAGE ==================== */}
        {page === 'details' && activeNotebook && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <button
              type="button"
              onClick={() => setPage('browse')}
              className="text-xs font-extrabold text-blue-800 flex items-center gap-1"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى قائمة المذكرات</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-5">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-extrabold">
                      {lookUp.catMap[activeNotebook.categoryId]?.name}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-extrabold">
                      {lookUp.gradeMap[activeNotebook.gradeId]?.name}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                    {activeNotebook.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {activeNotebook.description}
                  </p>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block">
                        سعر المذكرة شاملة التخصيص
                      </span>
                      <span className="text-2xl font-black text-blue-800">
                        {activeNotebook.price} {settings.currency}
                      </span>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-extrabold">
                      {activeNotebook.pagesCount} صفحة PDF
                    </span>
                  </div>

                  {Array.isArray(activeNotebook.features) &&
                    activeNotebook.features.length > 0 && (
                      <ul className="space-y-2 text-xs text-slate-700">
                        {activeNotebook.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                  <button
                    type="button"
                    onClick={() => openOrderForNotebook(activeNotebook)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-l from-blue-800 to-teal-700 text-white text-sm font-black shadow-lg"
                  >
                    اطلب هذه المذكرة باسمك وشعارك الآن
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7">
                <ProtectedPreviewer
                  notebook={activeNotebook}
                  platformName={settings.platformName}
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== OFFERS PAGE ==================== */}
        {page === 'offers' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            <div>
              <h1 className="text-2xl font-black text-slate-900">العروض والباقات وأكواد الخصم</h1>
              <p className="text-xs text-slate-500">
                استفد من الخصومات الحصرية عند طلب مذكرة أو باقة كاملة
              </p>
            </div>

            {/* Public Coupons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons
                .filter((c) => c.isActive && c.isPublic)
                .map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-3xl bg-white border border-blue-200 flex items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-1">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 font-mono font-black text-sm">
                        {c.code}
                      </span>
                      <p className="text-xs font-bold text-slate-700 pt-1">{c.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(c.code);
                        showToast(`تم نسخ كود الخصم (${c.code})`, 'success');
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-800 text-white text-xs font-extrabold shrink-0"
                    >
                      نسخ الكود
                    </button>
                  </div>
                ))}
            </div>

            {/* Bundles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {bundles
                .filter((b) => b.isActive !== false)
                .map((b) => (
                  <div
                    key={b.id}
                    className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 text-white space-y-3 shadow-lg"
                  >
                    <h3 className="text-lg font-black">{b.title}</h3>
                    <p className="text-xs text-slate-300">{b.description}</p>
                    <p className="text-xs text-amber-300 font-bold">{b.itemsSummary}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-white/15">
                      <div>
                        <span className="text-xl font-black text-amber-400">
                          {b.price} {settings.currency}
                        </span>
                        {b.oldPrice > b.price && (
                          <span className="mr-2 text-xs text-slate-400 line-through">
                            {b.oldPrice} {settings.currency}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOrderTargetNotebook(null);
                          setOrderInitialItems([
                            { id: b.id, title: b.title, price: Number(b.price || 0) }
                          ]);
                          setOrderModalOpen(true);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black"
                      >
                        اطلب الباقة الآن
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ==================== TRACK ORDER PAGE ==================== */}
        {page === 'track' && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl font-black text-slate-900">تتبع حالة طلبك</h1>
              <p className="text-xs text-slate-500">
                أدخل رقم الطلب (مثل MZ-261125-1234) أو رقم هاتفك لمتابعة التجهيز وتحميل المذكرة
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = trackQuery.trim().toLowerCase();
                if (!q) return;
                const matches = orders.filter(
                  (o) =>
                    String(o.orderNumber || '').toLowerCase() === q ||
                    String(o.phone || '').includes(q)
                );
                setTrackedOrders(matches);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                dir="ltr"
                placeholder="MZ-XXXXXX-XXXX أو 010XXXXXXXX"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 bg-white text-sm text-left font-mono"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-blue-800 hover:bg-blue-900 text-white text-sm font-black"
              >
                بحث
              </button>
            </form>

            {trackedOrders !== null &&
              (trackedOrders.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-sm font-bold text-slate-600">
                  لم يتم العثور على طلبات مطابقة لبيانات البحث المدخلة
                </div>
              ) : (
                <div className="space-y-4">
                  {trackedOrders.map((ord) => {
                    const st = ORDER_STATUSES.find((s) => s.id === ord.status) || ORDER_STATUSES[0];
                    return (
                      <div
                        key={ord.id}
                        className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span dir="ltr" className="font-mono font-black text-base text-blue-900">
                            {ord.orderNumber}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-extrabold border ${st.color}`}
                          >
                            {st.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 space-y-1">
                          <p>
                            الاسم: <strong>{ord.teacherName}</strong>
                          </p>
                          <p>
                            المطلوب: <strong>{ord.customNotebookTitle}</strong>
                          </p>
                        </div>

                        {(ord.status === 'ready' || ord.status === 'delivered') &&
                          ord.deliveryUrl && (
                            <a
                              href={ord.deliveryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg"
                            >
                              <Download className="w-4 h-4" />
                              <span>تحميل مذكرتك الجاهزة (PDF)</span>
                            </a>
                          )}
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        )}

        {/* ==================== CONTACT PAGE ==================== */}
        {page === 'contact' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl font-black text-slate-900">تواصل معنا</h1>
              <p className="text-xs text-slate-500">
                فريقنا جاهز للرد على استفساراتك وتنفيذ طلبات التخصيص الخاصة
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-3xl bg-emerald-600 text-white flex items-center gap-4 shadow-md"
              >
                <MessageCircle className="w-8 h-8 shrink-0" />
                <div>
                  <h3 className="font-black text-base">تواصل مباشر عبر واتساب</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">رد سريع على جميع الاستفسارات</p>
                </div>
              </a>

              {settings.customerServicePhone && (
                <a
                  href={`tel:${settings.customerServicePhone}`}
                  className="p-5 rounded-3xl bg-white border border-slate-200 flex items-center gap-4 shadow-sm"
                >
                  <Phone className="w-8 h-8 text-blue-700 shrink-0" />
                  <div>
                    <h3 className="font-black text-base text-slate-900">رقم خدمة العملاء</h3>
                    <p dir="ltr" className="text-xs font-mono font-bold text-slate-600 mt-0.5">
                      {settings.customerServicePhone}
                    </p>
                  </div>
                </a>
              )}

              {settings.whatsappGroupUrl && (
                <a
                  href={normalizeExternalUrl(settings.whatsappGroupUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-3xl bg-white border border-slate-200 flex items-center gap-4 shadow-sm"
                >
                  <Users className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="font-black text-base text-slate-900">جروب الواتساب للمعلمين</h3>
                    <p className="text-xs text-slate-500 mt-0.5">انضم لمتابعة أحدث المذكرات</p>
                  </div>
                </a>
              )}

              {settings.facebookUrl && (
                <a
                  href={normalizeExternalUrl(settings.facebookUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-3xl bg-white border border-slate-200 flex items-center gap-4 shadow-sm"
                >
                  <ExternalLink className="w-8 h-8 text-blue-600 shrink-0" />
                  <div>
                    <h3 className="font-black text-base text-slate-900">صفحة الفيسبوك الرسمية</h3>
                    <p className="text-xs text-slate-500 mt-0.5">تابع عروضنا ومنشوراتنا اليومية</p>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 py-8 px-4 sm:px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <strong className="text-white">{settings.platformName}</strong> — جميع الحقوق محفوظة ©{' '}
            {new Date().getFullYear()}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {settings.telegramUrl && (
              <a
                href={normalizeExternalUrl(settings.telegramUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold"
              >
                تليجرام
              </a>
            )}
            {settings.youtubeUrl && (
              <a
                href={normalizeExternalUrl(settings.youtubeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold"
              >
                يوتيوب
              </a>
            )}
            {settings.instagramUrl && (
              <a
                href={normalizeExternalUrl(settings.instagramUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold"
              >
                إنستجرام
              </a>
            )}
            {settings.tiktokUrl && (
              <a
                href={normalizeExternalUrl(settings.tiktokUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold"
              >
                تيك توك
              </a>
            )}
            <button
              type="button"
              onClick={() => setPage('track')}
              className="hover:text-white px-1"
            >
              تتبع طلبك
            </button>
            <button
              type="button"
              onClick={() => setPage('contact')}
              className="hover:text-white px-1"
            >
              اتصل بنا
            </button>
            <button
              type="button"
              onClick={() => setPage('admin')}
              className="hover:text-teal-400 font-bold px-1"
            >
              لوحة التحكم
            </button>
          </div>
        </div>
      </footer>

      {/* ORDER MODAL */}
      <OrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        notebook={orderTargetNotebook}
        initialItems={orderInitialItems}
        initialCouponCode={orderInitialCoupon}
        allNotebooks={publishedNotebooks}
        coupons={coupons}
        settings={settings}
        lookUp={lookUp}
        onSubmitOrder={handleSubmitOrder}
        showToast={showToast}
      />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-5 left-5 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-2xl border border-slate-700">
          {toast.message}
        </div>
      )}
    </div>
  );
}
