import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
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
  Image as ImageIcon,
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
  Play,
  Plus,
  Printer,
  Quote,
  Receipt,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  User,
  Users,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

/* ============================================================================
   1. FIREBASE INITIALIZATION & CONFIGURATION (el3bakera-edu)
   ============================================================================ */
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_du5VY8nJGDJ169Fof9EAli9x2W2d-14",
  authDomain: "el3bakera-edu.firebaseapp.com",
  projectId: "el3bakera-edu",
  storageBucket: "el3bakera-edu.firebasestorage.app",
  messagingSenderId: "74663879858",
  appId: "1:74663879858:web:4327c0ea1b825dd6c615ab"
};

let db = null;
let auth = null;
let firebaseEnabled = false;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'muzakkirati-edu-app';

try {
  let activeConfig = DEFAULT_FIREBASE_CONFIG;
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const parsedConfig =
      typeof __firebase_config === 'string'
        ? JSON.parse(__firebase_config)
        : __firebase_config;
    if (parsedConfig && parsedConfig.apiKey) {
      activeConfig = parsedConfig;
    }
  }
  if (activeConfig && activeConfig.apiKey) {
    const app = getApps().length ? getApps()[0] : initializeApp(activeConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseEnabled = true;
  }
} catch (err) {
  console.warn('Firebase initialization warning, using local storage fallback:', err);
}

/* ============================================================================
   2. DEFAULT SEED DATA & CONSTANTS
   ============================================================================ */
const DEFAULT_SETTINGS = {
  siteName: 'منصة مذكرتي التعليمية',
  tagline: 'مذكرات دراسية احترافية مُخصصة باسمك وشعارك الخاص',
  heroTitle: 'مذكرتك التعليمية الجاهزة… باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة اسم المعلم، رقم الهاتف، والشعار الخاص به على الغلاف وجميع الصفحات.',
  aboutTitle: 'لماذا يختار المعلمون منصة مذكرتي التعليمية؟',
  aboutDescription:
    'نحن منصة متخصصة في إعداد وتصميم المذكرات التعليمية الاحترافية للمعلمين في جميع المراحل الدراسية. نوفر لك محتوى علميًا منقحًا، وتنسيقًا عصريًا مريحًا للعين، مع تخصيص الغلاف والصفحات الداخلية باسمك ورقم هاتفك وشعارك الخاص لتكون جاهزة للطباعة الفورية بأعلى جودة.',
  logoUrl: '',
  logoSize: 'lg',
  heroBgImage: '',
  primaryColor: '#1d4ed8',
  secondaryColor: '#0d9488',
  currency: 'ج.م',
  whatsappNumber: '01000000000',
  phone: '01000000000',
  email: 'info@muzakkirati.com',
  whatsappGroupUrl: '',
  facebookUrl: '',
  telegramUrl: '',
  youtubeUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  allowLogoUpload: true,
  requirePaymentProof: false,
  orderSuccessMessage:
    'تم استلام طلبك بنجاح! سنقوم بمراجعة تفاصيل مذكرتك وإيصال الدفع والتواصل معك عبر الواتساب لتأكيد التصميم والبدء في التجهيز.',
  paymentInfo: 'فودافون كاش: 01000000000\nإنستاباي: muzakkirati@instapay',
  showImportantNotices: true,
  importantNoticesTitle: 'تنبيهات هامة قبل الطلب',
  importantNotices: [
    'المذكرة تُرسل بصيغة PDF إلكترونية عالية الجودة جاهزة للطباعة (ولا يوجد شحن ورقي).',
    'يتم إضافة اسم المعلم، رقم الهاتف، والشعار الخاص به على الغلاف وجميع الصفحات الداخلية.',
    'يرجى مراجعة عينة المطالعة والتأكد من المرحلة والصف الدراسي قبل تأكيد الطلب.',
    'مدة التجهيز والتسليم تتراوح بين 12 إلى 24 ساعة من تأكيد البيانات.'
  ],
  maintenanceMode: false,
  announcementBar: {
    enabled: true,
    text: '🎉 عرض خاص للمعلمين: خصم 20% على جميع مذكرات الترم الأول + إضافة الشعار مجانًا لفترة محدودة!',
    bgColor: '#0f172a',
    textColor: '#ffffff'
  },
  multiOrderDiscount: {
    enabled: true,
    minItems: 2,
    type: 'percent',
    value: 15,
    label: 'خصم إضافي 15% تلقائيًا عند طلب مذكرتين أو أكثر في نفس الطلب!'
  },
  nextOrderCouponAuto: {
    enabled: true,
    type: 'percent',
    value: 15,
    maxUses: 1,
    validDays: 30,
    description: 'هدية خاصة لطلبك القادم عند إتمام استلام مذكرتك'
  },
  showOffersOnHome: true,
  showHero: true,
  showAbout: true,
  showCategories: true,
  showFeatured: true,
  showReviews: true,
  showWhyUs: true
};

const DEFAULT_REVIEWS = [
  {
    id: 'rev_demo_1',
    teacherName: 'أ/ محمود عبد الرحمن',
    subjectAndStage: 'معلم اللغة العربية — المرحلة الإعدادية',
    quote:
      'بصراحة شغل فوق الممتاز، الغلاف باسمي وشعاري طلع احترافي جدًا والطلاب انبهروا بالمذكرة والتنسيق، والتسليم كان في نفس اليوم!',
    screenshotUrl: '',
    active: true
  },
  {
    id: 'rev_demo_2',
    teacherName: 'أ/ سارة السيد',
    subjectAndStage: 'معلمة اللغة الإنجليزية — المرحلة الثانوية',
    quote:
      'وفرتوا عليّ وقت ومجهود شهور في الكتابة والتنسيق، المذكرة جاهزة للطباعة مباشرة والخطوط والجداول منسقة بدقة عالية.',
    screenshotUrl: '',
    active: true
  },
  {
    id: 'rev_demo_3',
    teacherName: 'أ/ أحمد طارق',
    subjectAndStage: 'معلم الرياضيات — المرحلة الابتدائية',
    quote:
      'تعامل راقي وسريع جدًا، عدلوا لي ألوان الغلاف حسب طلبي وأضافوا رقمي في كل صفحة. بالتأكيد مش آخر تعامل!',
    screenshotUrl: '',
    active: true
  }
];

const DEFAULT_CATEGORIES = [
  {
    id: 'term1',
    name: 'مذكرات الترم الأول',
    slug: 'term-1',
    description: 'مذكرات شرح وتدريبات ومراجعات شاملة للفصل الدراسي الأول لجميع المراحل.',
    gradient: 'from-blue-600 to-indigo-700',
    order: 1
  },
  {
    id: 'term2',
    name: 'مذكرات الترم الثاني',
    slug: 'term-2',
    description: 'مذكرات متكاملة ومراجعات نهائية للفصل الدراسي الثاني وفق أحدث المواصفات.',
    gradient: 'from-teal-600 to-emerald-700',
    order: 2
  },
  {
    id: 'foundation',
    name: 'كورسات التأسيس',
    slug: 'foundation',
    description: 'سلاسل تأسيس احترافية في القراءة والكتابة واللغات والرياضيات لمختلف الأعمار.',
    gradient: 'from-amber-500 to-orange-600',
    order: 3
  }
];

const DEFAULT_STAGES = [
  { id: 'primary', name: 'المرحلة الابتدائية', order: 1 },
  { id: 'prep', name: 'المرحلة الإعدادية', order: 2 },
  { id: 'secondary', name: 'المرحلة الثانوية', order: 3 }
];

const DEFAULT_GRADES = [
  { id: 'g4', stageId: 'primary', name: 'الصف الرابع الابتدائي', order: 1 },
  { id: 'g5', stageId: 'primary', name: 'الصف الخامس الابتدائي', order: 2 },
  { id: 'g6', stageId: 'primary', name: 'الصف السادس الابتدائي', order: 3 },
  { id: 'g7', stageId: 'prep', name: 'الصف الأول الإعدادي', order: 4 },
  { id: 'g8', stageId: 'prep', name: 'الصف الثاني الإعدادي', order: 5 },
  { id: 'g9', stageId: 'prep', name: 'الصف الثالث الإعدادي', order: 6 },
  { id: 'g10', stageId: 'secondary', name: 'الصف الأول الثانوي', order: 7 },
  { id: 'g11', stageId: 'secondary', name: 'الصف الثاني الثانوي', order: 8 },
  { id: 'g12', stageId: 'secondary', name: 'الصف الثالث الثانوي', order: 9 }
];

const DEFAULT_SUBJECTS = [
  { id: 'arabic', name: 'اللغة العربية', order: 1, visible: true },
  { id: 'english', name: 'اللغة الإنجليزية', order: 2, visible: true },
  { id: 'math', name: 'الرياضيات', order: 3, visible: true },
  { id: 'science', name: 'العلوم', order: 4, visible: true },
  { id: 'social', name: 'الدراسات الاجتماعية', order: 5, visible: true },
  { id: 'physics', name: 'الفيزياء', order: 6, visible: true },
  { id: 'chemistry', name: 'الكيمياء', order: 7, visible: true }
];

const DEFAULT_NOTEBOOKS = [
  {
    id: 'nb_demo_1',
    title: 'مذكرة القمة في اللغة العربية — الصف الثالث الإعدادي',
    shortDesc: 'شرح مبسط للنحو والنصوص والقراءة مع بنك أسئلة شامل بنظام البوكليت.',
    fullDesc:
      'تتضمن المذكرة شرحًا وافيًا لجميع فروع اللغة العربية (النحو، القراءة، النصوص، القصة، التعبير) مع تدريبات متدرجة بعد كل درس، وامتحانات شاملة بنظام التقييم الحديث. يتم تسليم النسخة للمعلم بصيغة PDF عالية الدقة باسمه ورقم هاتفه وشعاره على الغلاف وجميع الصفحات.',
    categoryId: 'term1',
    stageId: 'prep',
    gradeId: 'g9',
    subjectId: 'arabic',
    price: 250,
    oldPrice: 350,
    pageCount: 145,
    previewPagesCount: 4,
    coverUrl: '',
    previewType: 'images',
    previewImages: [],
    previewPdfData: '',
    drivePreviewUrl: '',
    badge: 'الأكثر طلبًا',
    published: true,
    order: 1,
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'nb_demo_2',
    title: 'سلسلة التأسيس الشامل في اللغة الإنجليزية (من الصفر للاحتراف)',
    shortDesc: 'كورس تأسيس متكامل في الصوتيات والقواعد والمحادثة للمرحلتين الابتدائية والإعدادية.',
    fullDesc:
      'مذكرة تأسيس مصممة بألوان جذابة وخطوط واضحة لتعليم الصوتيات (Phonics) وتكوين الجملة والأزمنة الأساسية مع تمارين تطبيقية ممتعة للطلاب.',
    categoryId: 'foundation',
    stageId: 'primary',
    gradeId: 'g4',
    subjectId: 'english',
    price: 200,
    oldPrice: 280,
    pageCount: 96,
    previewPagesCount: 3,
    coverUrl: '',
    previewType: 'images',
    previewImages: [],
    previewPdfData: '',
    drivePreviewUrl: '',
    badge: 'جديد',
    published: true,
    order: 2,
    createdAt: '2026-01-12T10:00:00Z'
  },
  {
    id: 'nb_demo_3',
    title: 'مذكرة البرهان في الرياضيات — الصف الأول الثانوي',
    shortDesc: 'شرح الجبر وحساب المثلثات والهندسة مع أمثلة محلولة ومسائل مهارات التفكير العليا.',
    fullDesc:
      'مذكرة منظمة تغطي منهج الرياضيات بالكامل للفصل الدراسي الثاني مع رسومات هندسية دقيقة واختبارات إلكترونية وورقية مرفقة.',
    categoryId: 'term2',
    stageId: 'secondary',
    gradeId: 'g10',
    subjectId: 'math',
    price: 300,
    oldPrice: 0,
    pageCount: 168,
    previewPagesCount: 4,
    coverUrl: '',
    previewType: 'images',
    previewImages: [],
    previewPdfData: '',
    drivePreviewUrl: '',
    badge: '',
    published: true,
    order: 3,
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'nb_demo_4',
    title: 'مذكرة النخبة في الكيمياء — الصف الثالث الثانوي',
    shortDesc: 'شرح تفصيلي للمعادلات والباب الأول والثاني مع أفكار امتحانات الثانوية العامة.',
    fullDesc:
      'تشمل شرح جميع أبواب المنهج بأسلوب الخرائط الذهنية، مع ربط المعادلات الكيميائية وأسئلة المستويات العليا وإجاباتها النموذجية.',
    categoryId: 'term1',
    stageId: 'secondary',
    gradeId: 'g12',
    subjectId: 'chemistry',
    price: 350,
    oldPrice: 450,
    pageCount: 210,
    previewPagesCount: 5,
    coverUrl: '',
    previewType: 'images',
    previewImages: [],
    previewPdfData: '',
    drivePreviewUrl: '',
    badge: 'الأكثر طلبًا',
    published: true,
    order: 4,
    createdAt: '2026-01-18T10:00:00Z'
  }
];

const DEFAULT_COUPONS = [
  {
    id: 'cp_welcome',
    code: 'TEACHER20',
    type: 'percent',
    value: 20,
    minOrder: 200,
    description: 'خصم 20% للمعلمين على الطلبات بقيمة 200 ج.م فأكثر',
    active: true,
    isPrivate: false,
    maxUses: 0,
    usedCount: 0,
    expiresAt: ''
  },
  {
    id: 'cp_save50',
    code: 'SAVE50',
    type: 'fixed',
    value: 50,
    minOrder: 250,
    description: 'خصم فوري 50 ج.م عند طلب مذكرة بقيمة 250 ج.م أو أكثر',
    active: true,
    isPrivate: false,
    maxUses: 0,
    usedCount: 0,
    expiresAt: ''
  }
];

const DEFAULT_BUNDLES = [
  {
    id: 'bnd_1',
    title: 'باقة الترم الكاملة (3 مذكرات من اختيارك)',
    subtitle: 'اختر أي 3 مذكرات لأي صف دراسي بخصم مجمّع وتصميم غلاف موحد لهويتك',
    price: 650,
    oldPrice: 900,
    badge: 'وفر 250 ج.م',
    features: [
      '3 مذكرات PDF عالية الجودة جاهزة للطباعة',
      'إضافة اسم المعلم ورقمه وشعاره على جميع المذكرات',
      'أولوية في التنفيذ والتسليم خلال 24 ساعة'
    ],
    active: true
  },
  {
    id: 'bnd_2',
    title: 'باقة التأسيس + مذكرة الترم الأول',
    subtitle: 'ابدأ عامك الدراسي بكورس تأسيس قوي مع مذكرة المنهج الأساسية',
    price: 380,
    oldPrice: 480,
    badge: 'عرض البداية',
    features: [
      'كورس تأسيس متكامل + مذكرة شرح وتدريبات الترم',
      'تنسيق احترافي موحد باسم المعلم وشعاره',
      'دعم فني للتعديلات قبل الاعتماد النهائي'
    ],
    active: true
  }
];

const ORDER_STATUSES = [
  { id: 'new', label: 'طلب جديد', color: 'bg-blue-100 text-blue-800 border-blue-200', step: 1 },
  {
    id: 'reviewing',
    label: 'قيد المراجعة والتواصل',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    step: 2
  },
  {
    id: 'customizing',
    label: 'قيد التخصيص والكتابة',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    step: 3
  },
  {
    id: 'ready',
    label: 'جاهز للتسليم',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    step: 4
  },
  {
    id: 'delivered',
    label: 'تم التسليم',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    step: 5
  },
  { id: 'cancelled', label: 'ملغي', color: 'bg-rose-100 text-rose-800 border-rose-200', step: 0 }
];

/* ============================================================================
   3. UTILITY HELPERS (CRYPTO, VALIDATION, IMAGE COMPRESSION, WHATSAPP)
   ============================================================================ */
async function hashPasswordWithSalt(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateOrderNumber() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MZ-${y}${m}${d}-${rand}`;
}

function validateEgyptianPhone(phone) {
  const cleaned = String(phone || '').replace(/[\s\-()]/g, '');
  return /^(\+?20)?01[0125][0-9]{8}$/.test(cleaned);
}

function buildWhatsAppUrl(phone, message) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('01') && digits.length === 11) {
    digits = `2${digits}`;
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = `20${digits}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function normalizeExternalUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isCouponExhausted(cp) {
  if (!cp) return true;
  if (cp.active === false) return true;
  const max = Number(cp.maxUses) || 0;
  const used = Number(cp.usedCount) || 0;
  if (max > 0 && used >= max) return true;
  if (cp.expiresAt) {
    const exp = new Date(`${cp.expiresAt}T23:59:59`);
    if (!Number.isNaN(exp.getTime()) && new Date() > exp) return true;
  }
  return false;
}

function formatCouponLimitsAr(cp) {
  if (!cp) return '';
  const parts = [];
  const max = Number(cp.maxUses) || 0;
  const used = Number(cp.usedCount) || 0;
  if (max > 0) {
    const remaining = Math.max(0, max - used);
    parts.push(max === 1 ? 'يُستخدم مرة واحدة' : `متبقي ${remaining} من ${max} مرات`);
  } else {
    parts.push('مرات استخدام بلا حدود');
  }
  if (cp.expiresAt) {
    parts.push(`صالح حتى ${new Date(cp.expiresAt).toLocaleDateString('ar-EG')}`);
  } else {
    parts.push('صلاحية مفتوحة');
  }
  return parts.join(' • ');
}

function calcDiscountPercent(price, oldPrice) {
  const p = Number(price) || 0;
  const o = Number(oldPrice) || 0;
  if (o > p && p > 0) {
    return Math.round(((o - p) / o) * 100);
  }
  return 0;
}

function compressImageFile(file, maxWidth = 900, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      reject(new Error('صيغة الملف غير مدعومة. الصيغ المسموحة: PNG, JPG, JPEG, SVG'));
      return;
    }
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }
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
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outputType, quality));
      };
      img.onerror = () => reject(new Error('تعذر قراءة الصورة'));
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readPdfAsDataUrl(file, maxBytes = 750 * 1024) {
  return new Promise((resolve, reject) => {
    if (file.type !== 'application/pdf') {
      reject(new Error('يرجى اختيار ملف بصيغة PDF فقط.'));
      return;
    }
    if (file.size > maxBytes) {
      reject(
        new Error(
          `حجم ملف PDF (${Math.round(file.size / 1024)}KB) كبير. الحد الأقصى للمعاينة 750KB لضمان سرعة التحميل، أو استخدم خيار "صور صفحات العينة".`
        )
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('تعذر قراءة ملف PDF'));
    reader.readAsDataURL(file);
  });
}

function exportOrdersToCSV(orders, currency) {
  const headers = [
    'رقم الطلب',
    'اسم المعلم',
    'اسم المذكرة المطلوب',
    'رقم الهاتف',
    'المذكرة الأصلية',
    'السعر',
    'الحالة',
    'تاريخ الطلب',
    'رابط التسليم',
    'ملاحظات المعلم'
  ];
  const rows = orders.map((o) => {
    const st = ORDER_STATUSES.find((s) => s.id === o.status)?.label || o.status;
    return [
      o.orderNumber,
      o.teacherName,
      o.customNotebookTitle,
      o.phone,
      o.notebookTitle,
      `${o.price} ${currency}`,
      st,
      new Date(o.createdAt).toLocaleString('ar-EG'),
      o.deliveryUrl || '',
      (o.notes || '').replace(/\n/g, ' ')
    ]
      .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
      .join(',');
  });
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `muzakkirati-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ============================================================================
   4. REUSABLE UI COMPONENTS (COVER ART, NOTICES BOX, PROTECTED PREVIEWER)
   ============================================================================ */
const NotebookCoverArt = ({ notebook, stageName, subjectName, className = 'h-52' }) => {
  const discountPct = calcDiscountPercent(notebook.price, notebook.oldPrice);

  if (notebook.coverUrl) {
    return (
      <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
        <img
          src={notebook.coverUrl}
          alt={notebook.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-start">
          {notebook.badge && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-md">
              {notebook.badge}
            </span>
          )}
          {discountPct > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-600 text-white shadow-md">
              وفر {discountPct}%
            </span>
          )}
        </div>
      </div>
    );
  }

  const palette =
    notebook.categoryId === 'term1'
      ? 'from-blue-700 via-blue-800 to-indigo-950'
      : notebook.categoryId === 'term2'
      ? 'from-teal-600 via-emerald-700 to-slate-900'
      : 'from-amber-500 via-orange-600 to-rose-900';

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${palette} p-5 flex flex-col justify-between text-white select-none ${className}`}
    >
      <div className="absolute -left-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-black/20 blur-xl" />

      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-xs text-[11px] font-bold">
          {subjectName || 'مذكرة دراسية'}
        </span>
        <div className="flex items-center gap-1.5">
          {discountPct > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500 text-white shadow">
              وفر {discountPct}%
            </span>
          )}
          {notebook.badge && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400 text-slate-950 shadow">
              {notebook.badge}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 my-auto py-2">
        <div className="w-10 h-1 bg-amber-300 rounded-full mb-2.5" />
        <h4 className="font-extrabold text-base sm:text-lg leading-snug line-clamp-2 drop-shadow-xs">
          {notebook.title}
        </h4>
      </div>

      <div className="relative z-10 flex items-center justify-between text-[11px] text-white/85 border-t border-white/15 pt-2">
        <span>{stageName || 'جميع المراحل'}</span>
        <span>PDF قابل للتخصيص</span>
      </div>
    </div>
  );
};

const ImportantNoticesBox = ({ settings, compact = false }) => {
  if (!settings?.showImportantNotices) return null;
  const notices = Array.isArray(settings.importantNotices)
    ? settings.importantNotices.filter((n) => String(n || '').trim())
    : [];
  if (notices.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border-2 border-amber-300 bg-gradient-to-l from-amber-50 to-orange-50/80 ${
        compact ? 'p-3.5' : 'p-5 sm:p-6'
      } shadow-xs`}
    >
      <div className="flex items-center gap-2 text-amber-900 mb-2">
        <div className="w-7 h-7 rounded-xl bg-amber-400/30 text-amber-800 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <h3 className={`font-black ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
          {settings.importantNoticesTitle || 'تنبيهات هامة قبل الطلب'}
        </h3>
      </div>
      <ul className={`space-y-1.5 text-amber-950/90 ${compact ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>
        {notices.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ProtectedPreviewer = ({ notebook, lookUp, settings }) => {
  const maxPages = Math.max(1, Number(notebook.previewPagesCount) || 3);
  const previewImages = Array.isArray(notebook.previewImages) ? notebook.previewImages : [];
  const hasPdfData = Boolean(notebook.previewPdfData);
  const usePdfMode = notebook.previewType === 'pdf' && hasPdfData;

  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [pdfPageImage, setPdfPageImage] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const totalPages = usePdfMode
    ? maxPages
    : previewImages.length > 0
    ? Math.min(previewImages.length, maxPages)
    : maxPages;

  useEffect(() => {
    setCurrentPage(1);
  }, [notebook.id, notebook.previewType]);

  // Render PDF sample page using PDF.js if previewType === 'pdf'
  useEffect(() => {
    if (!usePdfMode) {
      setPdfPageImage('');
      return;
    }
    let cancelled = false;
    const renderPdfPage = async () => {
      setPdfLoading(true);
      try {
        if (!window.pdfjsLib) {
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            s.onload = res;
            s.onerror = rej;
            document.head.appendChild(s);
          });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        const loadingTask = window.pdfjsLib.getDocument(notebook.previewPdfData);
        const pdf = await loadingTask.promise;
        const safePage = Math.min(currentPage, pdf.numPages, maxPages);
        const page = await pdf.getPage(safePage);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) {
          setPdfPageImage(canvas.toDataURL('image/jpeg', 0.85));
        }
      } catch (err) {
        console.warn('PDF render fallback:', err);
        if (!cancelled) setPdfPageImage('');
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    };
    renderPdfPage();
    return () => {
      cancelled = true;
    };
  }, [usePdfMode, notebook.previewPdfData, currentPage, maxPages]);

  const demoSamplePages = [
    {
      header: 'نموذج الغلاف الخارجي (يُضاف اسمك ورقمك وشعارك هنا)',
      title: notebook.title,
      body: [
        'إعداد وتقديم الأستاذ / [اسم المعلم يُكتب هنا]',
        `المرحلة: ${lookUp.stageName(notebook.stageId)} — ${lookUp.gradeName(notebook.gradeId)}`,
        `المادة: ${lookUp.subjectName(notebook.subjectId)}`,
        'رقم التواصل / الواتساب: [010XXXXXXXX]'
      ]
    },
    {
      header: 'نموذج من تنسيق الشرح الداخلي — الدرس الأول',
      title: 'أولًا: المفاهيم الأساسية والقواعد المنظمة للدرس',
      body: [
        '• تم تنسيق الفقرات بخطوط واضحة ومريحة للعين مع تمييز المصطلحات الهامة.',
        '• جداول مقارنة تلخص أهم نقاط الدرس ليسهل على الطالب استيعابها.',
        '• تذييل كل صفحة يحمل اسم المعلم ورقم هاتفه لحفظ الحقوق.',
        '• أمثلة محلولة خطوة بخطوة على كل جزئية.'
      ]
    },
    {
      header: 'نموذج من بنك الأسئلة والتدريبات التطبيقية',
      title: 'ثانيًا: تدريبات شاملة بنظام التقييم الحديث',
      body: [
        'س1: اختر الإجابة الصحيحة من بين البدائل المعطاة في كل مما يأتي:',
        'س2: علل لما يأتي بأسلوب علمي دقيق ومختصر...',
        'س3: قارن في جدول بين كل مفهومين مما يلي...',
        'ملاحظة: هذه عينة محمية للمطالعة، ويتم تسليم النسخة الكاملة بصيغة PDF عالية الجودة.'
      ]
    }
  ];

  const activeDemo = demoSamplePages[(currentPage - 1) % demoSamplePages.length];

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl select-none"
    >
      {/* Toolbar */}
      <div className="bg-slate-800/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 text-white">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-300">
          <Eye className="w-4 h-4" />
          <span>
            عينة مطالعة محمية ({currentPage} من {totalPages} صفحات)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(70, z - 15))}
            title="تصغير"
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono w-11 text-center text-slate-300">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(160, z + 15))}
            title="تكبير"
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-600 mx-1" />

          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs font-bold flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابق</span>
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-bold flex items-center gap-1"
          >
            <span>التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewer Canvas */}
      <div className="relative p-4 sm:p-8 bg-slate-950/70 min-h-[420px] flex items-center justify-center overflow-auto">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden transition-transform duration-200"
        >
          {/* Repeating Diagonal Watermark */}
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-around items-center opacity-15 -rotate-12 overflow-hidden">
            {[1, 2, 3].map((row) => (
              <div key={row} className="whitespace-nowrap text-xl sm:text-2xl font-black text-slate-900">
                {settings.siteName} • عينة للمعاينة فقط • {settings.siteName}
              </div>
            ))}
          </div>

          {usePdfMode ? (
            pdfLoading ? (
              <div className="py-24 text-center text-slate-500 text-sm font-bold">
                جاري تحميل صفحة العينة من ملف PDF...
              </div>
            ) : pdfPageImage ? (
              <img
                src={pdfPageImage}
                alt={`صفحة عينة ${currentPage}`}
                draggable={false}
                className="w-full h-auto block pointer-events-none"
              />
            ) : (
              <div className="py-20 text-center text-slate-500 text-sm">
                تعذر عرض صفحة PDF، يرجى استخدام أزرار التنقل.
              </div>
            )
          ) : previewImages.length > 0 ? (
            <img
              src={previewImages[currentPage - 1]}
              alt={`عينة صفحة ${currentPage}`}
              draggable={false}
              className="w-full h-auto block pointer-events-none"
            />
          ) : (
            <div className="p-6 sm:p-10 text-slate-800 space-y-6 border-4 border-double border-blue-100 m-3 rounded-lg">
              <div className="flex items-center justify-between border-b-2 border-blue-600 pb-3">
                <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  {activeDemo.header}
                </span>
                <span className="text-xs font-bold text-slate-400">صفحة {currentPage}</span>
              </div>

              <div className="text-center py-4 bg-gradient-to-l from-blue-50 to-teal-50 rounded-xl px-4">
                <h4 className="text-lg sm:text-xl font-black text-slate-900">{activeDemo.title}</h4>
              </div>

              <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700">
                {activeDemo.body.map((line, idx) => (
                  <p key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    {line}
                  </p>
                ))}
              </div>

              <div className="pt-4 border-t border-dashed border-slate-300 flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>أ/ [اسم المعلم هنا]</span>
                <span>ت/ [رقم الهاتف هنا]</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Strip when multiple images exist */}
      {!usePdfMode && previewImages.length > 1 && (
        <div className="bg-slate-900/95 px-4 py-2.5 border-t border-slate-800 flex items-center justify-center gap-2 overflow-x-auto">
          {previewImages.slice(0, maxPages).map((imgSrc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentPage(idx + 1)}
              className={`relative w-12 h-16 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                currentPage === idx + 1 ? 'border-amber-400 scale-105' : 'border-slate-700 opacity-60'
              }`}
            >
              <img src={imgSrc} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   5. ORDER MODAL (NO LOGIN REQUIRED + MULTI-NOTEBOOK + COUPON SUPPORT)
   ============================================================================ */
const OrderModal = ({
  isOpen,
  onClose,
  notebook,
  initialItems = null,
  initialCouponCode = '',
  allNotebooks,
  coupons,
  settings,
  lookUp,
  onSubmitOrder,
  showToast
}) => {
  const [teacherName, setTeacherName] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [logoData, setLogoData] = useState('');
  const [logoName, setLogoName] = useState('');
  const [paymentReceiptData, setPaymentReceiptData] = useState('');
  const [paymentReceiptName, setPaymentReceiptName] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (Array.isArray(initialItems) && initialItems.length > 0) {
        setSelectedItems(initialItems);
        setCustomTitle(
          initialItems.length === 1
            ? initialItems[0].title
            : `طلب مجمّع (${initialItems.length}): ${initialItems.map((i) => i.title).join(' + ')}`
        );
      } else if (notebook) {
        setSelectedItems([
          {
            id: notebook.id,
            title: notebook.title,
            price: Number(notebook.price) || 0,
            stageId: notebook.stageId || '',
            subjectId: notebook.subjectId || ''
          }
        ]);
        setCustomTitle(notebook.title || '');
      } else {
        setSelectedItems([]);
        setCustomTitle('');
      }

      if (initialCouponCode) {
        const found = (coupons || []).find(
          (c) =>
            !isCouponExhausted(c) &&
            c.code.toUpperCase() === initialCouponCode.trim().toUpperCase()
        );
        if (found) {
          setCouponInput(found.code);
          setAppliedCoupon(found);
        } else {
          setCouponInput(initialCouponCode);
          setAppliedCoupon(null);
        }
      } else {
        setCouponInput('');
        setAppliedCoupon(null);
      }

      setCreatedOrder(null);
      setShowAddPicker(false);
      setPickerSearch('');
      setLogoData('');
      setLogoName('');
      setPaymentReceiptData('');
      setPaymentReceiptName('');
    }
  }, [isOpen, notebook, initialItems, initialCouponCode, coupons]);

  const subtotalPrice = useMemo(
    () => selectedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    [selectedItems]
  );

  // Automatic Multi-Notebook Discount calculation
  const multiDiscountRule = settings.multiOrderDiscount || {};
  const qualifiesMultiDiscount =
    Boolean(multiDiscountRule.enabled) &&
    selectedItems.length >= (Number(multiDiscountRule.minItems) || 2) &&
    subtotalPrice > 0;

  const multiDiscountAmount = useMemo(() => {
    if (!qualifiesMultiDiscount) return 0;
    const val = Number(multiDiscountRule.value) || 0;
    if (multiDiscountRule.type === 'percent') {
      return Math.round((subtotalPrice * val) / 100);
    }
    return Math.min(subtotalPrice, val);
  }, [qualifiesMultiDiscount, multiDiscountRule, subtotalPrice]);

  const priceAfterMulti = Math.max(0, subtotalPrice - multiDiscountAmount);

  // Coupon Discount calculation
  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon || priceAfterMulti <= 0) return 0;
    if (subtotalPrice < (Number(appliedCoupon.minOrder) || 0)) return 0;
    const val = Number(appliedCoupon.value) || 0;
    if (appliedCoupon.type === 'percent') {
      return Math.round((priceAfterMulti * val) / 100);
    }
    return Math.min(priceAfterMulti, val);
  }, [appliedCoupon, priceAfterMulti, subtotalPrice]);

  const finalPrice = Math.max(0, priceAfterMulti - couponDiscountAmount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return showToast('يرجى كتابة كود الخصم أولًا', 'error');
    const found = (coupons || []).find((c) => c.code.toUpperCase() === code);
    if (!found) {
      setAppliedCoupon(null);
      return showToast('كود الخصم غير صحيح', 'error');
    }
    if (found.active === false) {
      setAppliedCoupon(null);
      return showToast('هذا الكوبون موقوف حاليًا', 'error');
    }
    if (found.expiresAt) {
      const exp = new Date(`${found.expiresAt}T23:59:59`);
      if (!Number.isNaN(exp.getTime()) && new Date() > exp) {
        setAppliedCoupon(null);
        return showToast('انتهت مدة صلاحية هذا الكوبون', 'error');
      }
    }
    const maxUses = Number(found.maxUses) || 0;
    const usedCount = Number(found.usedCount) || 0;
    if (maxUses > 0 && usedCount >= maxUses) {
      setAppliedCoupon(null);
      return showToast('تم استنفاد الحد الأقصى لعدد مرات استخدام هذا الكوبون', 'error');
    }
    if (subtotalPrice > 0 && subtotalPrice < (Number(found.minOrder) || 0)) {
      setAppliedCoupon(null);
      return showToast(
        `الحد الأدنى لتطبيق هذا الكود هو ${found.minOrder} ${settings.currency}`,
        'error'
      );
    }
    setAppliedCoupon(found);
    showToast(`تم تطبيق كود الخصم (${found.code}) بنجاح!`, 'success');
  };

  const handleAddExtraNotebook = (nb) => {
    if (selectedItems.some((item) => item.id === nb.id)) {
      return showToast('هذه المذكرة مضافة بالفعل في طلبك', 'info');
    }
    const next = [
      ...selectedItems,
      {
        id: nb.id,
        title: nb.title,
        price: Number(nb.price) || 0,
        stageId: nb.stageId || '',
        subjectId: nb.subjectId || ''
      }
    ];
    setSelectedItems(next);
    setCustomTitle(
      next.length === 1
        ? next[0].title
        : `طلب مجمّع (${next.length}): ${next.map((i) => i.title).join(' + ')}`
    );
    setShowAddPicker(false);
    showToast('تمت إضافة المذكرة إلى طلبك', 'success');
  };

  const handleRemoveSelectedItem = (idx) => {
    const next = selectedItems.filter((_, i) => i !== idx);
    setSelectedItems(next);
    if (next.length === 1) {
      setCustomTitle(next[0].title);
    } else if (next.length > 1) {
      setCustomTitle(`طلب مجمّع (${next.length}): ${next.map((i) => i.title).join(' + ')}`);
    }
  };

  if (!isOpen) return null;

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 450, 0.85);
      setLogoData(compressed);
      setLogoName(file.name);
      showToast('تم رفع الشعار بنجاح', 'success');
    } catch (err) {
      showToast(err.message || 'تعذر رفع الشعار', 'error');
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('يرجى رفع صورة إيصال التحويل (PNG أو JPG)', 'error');
      return;
    }
    try {
      const compressed = await compressImageFile(file, 900, 0.8);
      setPaymentReceiptData(compressed);
      setPaymentReceiptName(file.name);
      showToast('تم إرفاق صورة إيصال الدفع بنجاح', 'success');
    } catch (err) {
      showToast(err.message || 'تعذر رفع صورة الإيصال', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacherName.trim()) return showToast('يرجى إدخال اسم المعلم', 'error');
    if (!customTitle.trim()) return showToast('يرجى إدخال اسم المذكرة المطلوب طباعته', 'error');
    if (!validateEgyptianPhone(phone)) {
      return showToast(
        'يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقمًا (يبدأ بـ 010/011/012/015)',
        'error'
      );
    }
    if (settings.requirePaymentProof && !paymentReceiptData) {
      return showToast('يرجى إرفاق صورة إيصال الدفع لتأكيد الطلب', 'error');
    }

    setSubmitting(true);
    try {
      const primaryItem = selectedItems[0] || notebook;
      const orderObj = {
        id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        orderNumber: generateOrderNumber(),
        teacherName: teacherName.trim(),
        customNotebookTitle: customTitle.trim(),
        phone: phone.replace(/[\s\-()]/g, ''),
        notes: notes.trim(),
        logoUrl: logoData,
        paymentReceiptUrl: paymentReceiptData,
        paymentStatus: paymentReceiptData ? 'pending_review' : 'unpaid',
        notebookId: primaryItem?.id || 'custom',
        notebookTitle:
          selectedItems.length > 1
            ? selectedItems.map((i) => i.title).join(' + ')
            : primaryItem?.title || customTitle.trim(),
        items: selectedItems,
        stageName: primaryItem?.stageId ? lookUp.stageName(primaryItem.stageId) : 'مخصص',
        subjectName: primaryItem?.subjectId ? lookUp.subjectName(primaryItem.subjectId) : 'عام',
        subtotalPrice,
        multiDiscountAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        couponDiscountAmount,
        price: finalPrice,
        status: 'new',
        deliveryUrl: '',
        adminNotes: '',
        createdAt: new Date().toISOString()
      };
      await onSubmitOrder(orderObj, appliedCoupon?.id || '');
      setCreatedOrder(orderObj);
      showToast('تم إرسال طلبك بنجاح!', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const availablePickerNotebooks = (allNotebooks || []).filter(
    (nb) =>
      nb.published !== false &&
      (!pickerSearch.trim() ||
        nb.title.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        lookUp.subjectName(nb.subjectId).includes(pickerSearch))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-l from-blue-700 to-teal-600 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-black">
              {createdOrder ? 'تم تسجيل طلبك بنجاح 🎉' : 'نموذج طلب تجهيز مذكرة'}
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">
              {createdOrder
                ? 'احتفظ برقم الطلب لمتابعة حالة التخصيص والاستلام'
                : 'بدون الحاجة لإنشاء حساب — أدخل بيانات التخصيص وسنتواصل معك فورًا'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdOrder ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-600 leading-relaxed">{settings.orderSuccessMessage}</p>
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-100 border border-slate-200 mt-2">
                <span className="text-xs font-bold text-slate-500">رقم الطلب:</span>
                <span className="text-lg font-black font-mono text-blue-700 tracking-wider">
                  {createdOrder.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(createdOrder.orderNumber);
                    showToast('تم نسخ رقم الطلب', 'success');
                  }}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-xs"
                  title="نسخ رقم الطلب"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-right text-xs sm:text-sm space-y-2 border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">اسم المعلم:</span>
                <span className="font-bold text-slate-900">{createdOrder.teacherName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 shrink-0">المذكرة:</span>
                <span className="font-bold text-slate-900 text-left">
                  {createdOrder.customNotebookTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الهاتف:</span>
                <span className="font-bold font-mono text-slate-900">{createdOrder.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">التكلفة:</span>
                <span className="font-black text-emerald-700">
                  {createdOrder.price ? `${createdOrder.price} ${settings.currency}` : 'بالاتفاق'}
                  {createdOrder.multiDiscountAmount > 0 && (
                    <span className="mr-1.5 text-[11px] text-teal-700 font-bold">
                      (خصم كمية -{createdOrder.multiDiscountAmount} {settings.currency})
                    </span>
                  )}
                  {createdOrder.couponCode && (
                    <span className="mr-1.5 text-[11px] text-rose-600 font-bold">
                      (كود {createdOrder.couponCode})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">حالة الدفع:</span>
                <span
                  className={`font-bold text-xs ${
                    createdOrder.paymentReceiptUrl ? 'text-amber-700' : 'text-slate-600'
                  }`}
                >
                  {createdOrder.paymentReceiptUrl
                    ? 'تم إرفاق صورة الإيصال (قيد المراجعة)'
                    : 'لم يتم إرفاق إيصال بعد (يمكنك رفعه من صفحة تتبع طلبك)'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-right text-xs text-purple-900 leading-relaxed">
              <span className="font-extrabold block mb-1">ℹ️ ماذا يحدث الآن؟</span>
              ستدخل مذكرتك الآن مرحلة <strong>كتابة البيانات والتخصيص</strong> (إضافة اسمك ورقمك وشعارك على الغلاف والصفحات). فور الانتهاء، سيتاح لك رابط التحميل المباشر في صفحة <strong>تتبع طلبك</strong> وسنرسله لك عبر الواتساب.
            </div>

            {settings.paymentInfo && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-right text-xs text-amber-900 whitespace-pre-line">
                <strong className="block mb-1">بيانات الدفع والتأكيد:</strong>
                {settings.paymentInfo}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {settings.whatsappNumber && (
                <a
                  href={buildWhatsAppUrl(
                    settings.whatsappNumber,
                    `مرحبًا، قمت بتسجيل طلب جديد على ${settings.siteName}\nرقم الطلب: ${createdOrder.orderNumber}\nالاسم: ${createdOrder.teacherName}\nالمذكرة: ${createdOrder.customNotebookTitle}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال التفاصيل عبر واتساب</span>
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
            <ImportantNoticesBox settings={settings} compact />

            {/* Selected Notebooks & Multi-Notebook Add Section */}
            <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-blue-900">
                  المذكرات المختارة ({selectedItems.length || 1})
                </span>
                {allNotebooks && allNotebooks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddPicker((prev) => !prev)}
                    className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة مذكرة أخرى</span>
                  </button>
                )}
              </div>

              {selectedItems.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedItems.map((item, idx) => (
                    <div
                      key={`${item.id}_${idx}`}
                      className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-blue-100 text-xs"
                    >
                      <span className="font-bold text-slate-800 truncate">{item.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-blue-700">
                          {item.price ? `${item.price} ${settings.currency}` : 'بالاتفاق'}
                        </span>
                        {selectedItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedItem(idx)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                            title="إزالة"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-blue-800 font-semibold">
                  مذكرة مخصصة حسب طلبك — يمكنك اختيار مذكرات جاهزة بالزر أعلاه أو كتابة التفاصيل بالأسفل.
                </div>
              )}

              {/* Extra Notebook Picker Dropdown */}
              {showAddPicker && (
                <div className="p-3 rounded-xl bg-white border border-blue-200 space-y-2 shadow-sm">
                  <input
                    type="text"
                    placeholder="ابحث باسم المذكرة أو المادة لإضافتها..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-100">
                    {availablePickerNotebooks.map((nb) => (
                      <button
                        key={nb.id}
                        type="button"
                        onClick={() => handleAddExtraNotebook(nb)}
                        className="w-full text-right py-2 px-2 hover:bg-blue-50 rounded-lg flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-bold text-slate-800 truncate">{nb.title}</span>
                        <span className="font-extrabold text-emerald-700 shrink-0">
                          {nb.price} {settings.currency}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-Order Discount Banner */}
              {multiDiscountRule.enabled && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 ${
                    qualifiesMultiDiscount
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    {qualifiesMultiDiscount
                      ? `مبروك! تم تفعيل خصم الكمية تلقائيًا (-${multiDiscountAmount} ${settings.currency})`
                      : multiDiscountRule.label ||
                        `اطلب ${multiDiscountRule.minItems || 2} مذكرات أو أكثر واحصل على خصم إضافي تلقائي!`}
                  </span>
                </div>
              )}
            </div>

            {/* Coupon Code Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700">
                هل لديك كوبون خصم؟ (اختياري)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="أدخل كود الخصم مثل TEACHER20"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs uppercase text-left focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold"
                >
                  تطبيق الكود
                </button>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <span className="font-bold">
                    ✓ كود ({appliedCoupon.code}) مُفعّل: خصم{' '}
                    {appliedCoupon.type === 'percent'
                      ? `${appliedCoupon.value}%`
                      : `${appliedCoupon.value} ${settings.currency}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponInput('');
                    }}
                    className="text-rose-600 font-bold hover:underline"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            {/* Price Summary Box */}
            {subtotalPrice > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">
                    {subtotalPrice} {settings.currency}
                  </span>
                </div>
                {multiDiscountAmount > 0 && (
                  <div className="flex justify-between text-teal-700 font-bold">
                    <span>خصم طلب أكثر من مذكرة:</span>
                    <span>
                      - {multiDiscountAmount} {settings.currency}
                    </span>
                  </div>
                )}
                {couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>خصم الكوبون ({appliedCoupon?.code}):</span>
                    <span>
                      - {couponDiscountAmount} {settings.currency}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>الإجمالي النهائي المطلوب:</span>
                  <span className="text-blue-700">
                    {finalPrice} {settings.currency}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                اسم المعلم (كما سيُكتب على المذكرة) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: أ/ محمد أحمد عبد الله"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                اسم المذكرة المطلوب طباعته على الغلاف <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: سلسلة الإبداع في اللغة العربية"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                رقم الهاتف / الواتساب للتواصل <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                placeholder="010XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-left font-mono"
              />
            </div>

            {settings.allowLogoUpload && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  شعار المعلم أو السنتر التعليمي (اختياري — PNG, JPG, SVG)
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

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                ملاحظات إضافية (الألوان المفضلة، إضافة أرقام أخرى، إلخ)
              </label>
              <textarea
                rows="3"
                placeholder="اكتب أي تعليمات خاصة ترغب في إضافتها على المذكرة..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            {/* Payment Details & Receipt Upload Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900">
                <Receipt className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-extrabold">
                  تأكيد الدفع وإرفاق صورة التحويل{' '}
                  {settings.requirePaymentProof ? (
                    <span className="text-rose-600">* (إلزامي)</span>
                  ) : (
                    '(اختياري — لتسريع البدء في التجهيز)'
                  )}
                </span>
              </div>
              {settings.paymentInfo && (
                <div className="bg-white/90 rounded-xl p-3 border border-emerald-200/80 text-xs text-slate-800 space-y-1">
                  <span className="font-bold text-emerald-800 block">بيانات التحويل المتاحة:</span>
                  <p className="whitespace-pre-line font-mono text-[11px] sm:text-xs leading-relaxed">
                    {settings.paymentInfo}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-emerald-300 bg-white hover:bg-emerald-50/60 transition text-xs font-bold text-emerald-900">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>
                    {paymentReceiptName || 'ارفع صورة إيصال التحويل (فودافون كاش / إنستاباي)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>
                {paymentReceiptData && (
                  <div className="relative w-14 h-14 rounded-xl border border-emerald-200 overflow-hidden bg-white shrink-0">
                    <img
                      src={paymentReceiptData}
                      alt="إيصال الدفع"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentReceiptData('');
                        setPaymentReceiptName('');
                      }}
                      className="absolute top-0.5 left-0.5 p-0.5 rounded-full bg-rose-600 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-l from-blue-700 to-teal-600 hover:opacity-95 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'جاري إرسال الطلب...' : 'تأكيد وإرسال الطلب الآن'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   6. SECURE ADMIN DASHBOARD (WITH ALL CRUD, ANALYTICS, OFFERS, AND SETTINGS)
   ============================================================================ */
const AdminDashboard = ({
  settings,
  categories,
  stages,
  grades,
  subjects,
  notebooks,
  orders,
  coupons,
  bundles,
  reviews,
  adminMeta,
  lookUp,
  onSaveSettings,
  onRestoreBackup,
  onSaveNotebook,
  onDeleteNotebook,
  onUpdateOrder,
  onSaveStructureItem,
  onDeleteStructureItem,
  onSaveCoupon,
  onDeleteCoupon,
  onSaveBundle,
  onDeleteBundle,
  onSaveReview,
  onDeleteReview,
  onUpdateAdminPassword,
  onIssueNextOrderCoupon,
  onToggleNextOrderCoupon,
  onRemoveNextOrderCoupon,
  onExitAdmin,
  showToast
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('stats');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Notebook CRUD modal state
  const [nbModalOpen, setNbModalOpen] = useState(false);
  const [editingNb, setEditingNb] = useState(null);
  const [nbForm, setNbForm] = useState({
    title: '',
    shortDesc: '',
    fullDesc: '',
    categoryId: 'term1',
    stageId: 'primary',
    gradeId: 'g4',
    subjectId: 'arabic',
    price: 250,
    oldPrice: '',
    pageCount: 100,
    previewPagesCount: 3,
    coverUrl: '',
    previewType: 'images',
    previewImages: [],
    previewPdfData: '',
    drivePreviewUrl: '',
    badge: '',
    published: true,
    order: 1
  });

  // Reviews CRUD state
  const [reviewForm, setReviewForm] = useState({
    teacherName: '',
    subjectAndStage: '',
    quote: '',
    screenshotUrl: ''
  });

  // Next-order coupon custom controls inside Order Detail modal
  const [nextCpType, setNextCpType] = useState('percent');
  const [nextCpValue, setNextCpValue] = useState(15);
  const [nextCpMaxUses, setNextCpMaxUses] = useState(1);
  const [nextCpValidDays, setNextCpValidDays] = useState(30);

  // Structure & Subjects quick-add state
  const [newStructName, setNewStructName] = useState('');
  const [newStructType, setNewStructType] = useState('subjects');
  const [newStructStageId, setNewStructStageId] = useState('primary');
  const [newSubjectSettingName, setNewSubjectSettingName] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState('');
  const [editingSubjectName, setEditingSubjectName] = useState('');

  // Coupons & Bundles CRUD state
  const [editingCouponId, setEditingCouponId] = useState('');
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percent',
    value: 15,
    minOrder: 0,
    description: '',
    isPrivate: false,
    maxUses: 0,
    expiresAt: ''
  });
  const [bundleForm, setBundleForm] = useState({
    title: '',
    subtitle: '',
    price: 600,
    oldPrice: 800,
    badge: 'عرض مجمّع',
    featuresText: ''
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(settings);
  const [newNoticeInput, setNewNoticeInput] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  // Custom confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState(null);
  const backupFileInputRef = useRef(null);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    setNextCpType(settings?.nextOrderCouponAuto?.type || 'percent');
    setNextCpValue(Number(settings?.nextOrderCouponAuto?.value) || 15);
    setNextCpMaxUses(
      settings?.nextOrderCouponAuto?.maxUses !== undefined
        ? Number(settings.nextOrderCouponAuto.maxUses)
        : 1
    );
    setNextCpValidDays(
      settings?.nextOrderCouponAuto?.validDays !== undefined
        ? Number(settings.nextOrderCouponAuto.validDays)
        : 30
    );
  }, [settings]);

  // Check existing admin session token (valid for 24h)
  useEffect(() => {
    try {
      const savedSession = JSON.parse(localStorage.getItem('mz_admin_session') || 'null');
      if (savedSession && savedSession.expiresAt > Date.now() && adminMeta?.email) {
        if (savedSession.email === adminMeta.email) {
          setIsAuthenticated(true);
        }
      }
    } catch {
      // ignore
    }
  }, [adminMeta]);

  const handleAdminSetup = async (e) => {
    e.preventDefault();
    if (!authEmail.trim() || !authEmail.includes('@')) {
      return showToast('يرجى إدخال بريد إلكتروني صحيح للمدير', 'error');
    }
    if (authPassword.length < 6) {
      return showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
    }
    if (authPassword !== authConfirmPassword) {
      return showToast('كلمتا المرور غير متطابقتين', 'error');
    }
    setAuthLoading(true);
    try {
      const salt = generateSalt();
      const passwordHash = await hashPasswordWithSalt(authPassword, salt);
      await onUpdateAdminPassword({
        email: authEmail.trim().toLowerCase(),
        salt,
        passwordHash,
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem(
        'mz_admin_session',
        JSON.stringify({
          email: authEmail.trim().toLowerCase(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000
        })
      );
      setIsAuthenticated(true);
      showToast('تم إنشاء حساب المدير وتأمين لوحة التحكم بنجاح', 'success');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminMeta) return;
    setAuthLoading(true);
    try {
      const inputHash = await hashPasswordWithSalt(authPassword, adminMeta.salt);
      if (
        authEmail.trim().toLowerCase() === adminMeta.email.toLowerCase() &&
        inputHash === adminMeta.passwordHash
      ) {
        localStorage.setItem(
          'mz_admin_session',
          JSON.stringify({
            email: adminMeta.email,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000
          })
        );
        setIsAuthenticated(true);
        setAuthPassword('');
        showToast('مرحبًا بك في لوحة التحكم', 'success');
      } else {
        showToast('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mz_admin_session');
    setIsAuthenticated(false);
    showToast('تم تسجيل الخروج بأمان', 'info');
  };

  // Analytics calculations
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const newOrders = orders.filter((o) => o.status === 'new').length;
    const activeOrders = orders.filter((o) =>
      ['reviewing', 'customizing', 'ready'].includes(o.status)
    ).length;
    const completedOrders = orders.filter((o) => o.status === 'delivered').length;
    const revenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, o) => acc + (Number(o.price) || 0), 0);
    return { totalOrders, newOrders, activeOrders, completedOrders, revenue };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
        if (!orderSearch.trim()) return true;
        const q = orderSearch.toLowerCase();
        return (
          o.orderNumber?.toLowerCase().includes(q) ||
          o.teacherName?.toLowerCase().includes(q) ||
          o.phone?.includes(q) ||
          o.customNotebookTitle?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, orderSearch, orderStatusFilter]);

  const openAddNotebookModal = () => {
    setEditingNb(null);
    setNbForm({
      title: '',
      shortDesc: '',
      fullDesc: '',
      categoryId: categories[0]?.id || 'term1',
      stageId: stages[0]?.id || 'primary',
      gradeId: grades[0]?.id || 'g4',
      subjectId: subjects[0]?.id || 'arabic',
      price: 250,
      oldPrice: '',
      pageCount: 100,
      previewPagesCount: 3,
      coverUrl: '',
      previewType: 'images',
      previewImages: [],
      previewPdfData: '',
      drivePreviewUrl: '',
      badge: '',
      published: true,
      order: notebooks.length + 1
    });
    setNbModalOpen(true);
  };

  const openEditNotebookModal = (nb) => {
    setEditingNb(nb);
    setNbForm({
      title: nb.title || '',
      shortDesc: nb.shortDesc || '',
      fullDesc: nb.fullDesc || '',
      categoryId: nb.categoryId || categories[0]?.id || '',
      stageId: nb.stageId || stages[0]?.id || '',
      gradeId: nb.gradeId || grades[0]?.id || '',
      subjectId: nb.subjectId || subjects[0]?.id || '',
      price: Number(nb.price) || 0,
      oldPrice: nb.oldPrice ? Number(nb.oldPrice) : '',
      pageCount: Number(nb.pageCount) || 0,
      previewPagesCount: Number(nb.previewPagesCount) || 3,
      coverUrl: nb.coverUrl || '',
      previewType: nb.previewType || (nb.previewPdfData ? 'pdf' : 'images'),
      previewImages: Array.isArray(nb.previewImages) ? nb.previewImages : [],
      previewPdfData: nb.previewPdfData || '',
      drivePreviewUrl: nb.drivePreviewUrl || '',
      badge: nb.badge || '',
      published: nb.published !== false,
      order: Number(nb.order) || 1
    });
    setNbModalOpen(true);
  };

  const handleSaveNbSubmit = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim()) return showToast('يرجى إدخال عنوان المذكرة', 'error');
    const payload = {
      ...nbForm,
      id: editingNb ? editingNb.id : `nb_${Date.now()}`,
      price: Number(nbForm.price) || 0,
      oldPrice: Number(nbForm.oldPrice) || 0,
      pageCount: Number(nbForm.pageCount) || 0,
      previewPagesCount: Math.max(1, Number(nbForm.previewPagesCount) || 3),
      createdAt: editingNb?.createdAt || new Date().toISOString()
    };
    await onSaveNotebook(payload);
    setNbModalOpen(false);
    showToast(editingNb ? 'تم تحديث بيانات المذكرة' : 'تمت إضافة المذكرة الجديدة بنجاح', 'success');
  };

  const handleAddStructure = async (e) => {
    e.preventDefault();
    if (!newStructName.trim()) return;
    const id = `${newStructType.slice(0, 3)}_${Date.now()}`;
    const item =
      newStructType === 'grades'
        ? { id, stageId: newStructStageId, name: newStructName.trim(), order: 99 }
        : newStructType === 'categories'
        ? {
            id,
            name: newStructName.trim(),
            slug: id,
            description: 'قسم تعليمي مضاف من لوحة التحكم',
            gradient: 'from-indigo-600 to-blue-700',
            order: 99
          }
        : { id, name: newStructName.trim(), order: 99, visible: true };
    await onSaveStructureItem(newStructType, item);
    setNewStructName('');
    showToast('تمت الإضافة بنجاح', 'success');
  };

  const handleDownloadBackup = () => {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      version: '1.1',
      settings,
      categories,
      stages,
      grades,
      subjects,
      notebooks,
      orders,
      coupons,
      bundles,
      reviews
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muzakkirati-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تحميل النسخة الاحتياطية الكاملة بنجاح', 'success');
  };

  const handleRestoreBackupFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== 'object' || (!parsed.settings && !parsed.notebooks)) {
          return showToast('ملف النسخة الاحتياطية غير صالح', 'error');
        }
        setConfirmDialog({
          title: 'استعادة نسخة احتياطية',
          message:
            'سيتم استبدال الإعدادات والمذكرات والطلبات الحالية بالبيانات الموجودة في ملف النسخة الاحتياطية. هل تريد المتابعة؟',
          onConfirm: async () => {
            await onRestoreBackup(parsed);
            showToast('تمت استعادة النسخة الاحتياطية بنجاح', 'success');
          }
        });
      } catch {
        showToast('تعذر قراءة ملف JSON', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  /* -------------------- ADMIN AUTH GATE SCREEN -------------------- */
  if (!isAuthenticated) {
    const isFirstSetup = !adminMeta || !adminMeta.passwordHash;
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-l from-slate-900 to-blue-900 p-7 text-white text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-2">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-black">
              {isFirstSetup ? 'إعداد حساب مدير المنصة لأول مرة' : 'تسجيل دخول لوحة التحكم'}
            </h2>
            <p className="text-xs text-slate-300">
              {isFirstSetup
                ? 'أنشئ البريد الإلكتروني وكلمة المرور الخاصة بالإدارة لتأمين لوحة التحكم'
                : 'منطقة محمية — مخصصة لإدارة المنصة والطلبات'}
            </p>
          </div>

          <form
            onSubmit={isFirstSetup ? handleAdminSetup : handleAdminLogin}
            className="p-7 space-y-4"
          >
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                البريد الإلكتروني للمدير
              </label>
              <input
                type="email"
                required
                dir="ltr"
                placeholder="admin@muzakkirati.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-sm text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                كلمة المرور
              </label>
              <input
                type="password"
                required
                dir="ltr"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-sm text-left"
              />
            </div>

            {isFirstSetup && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  تأكيد كلمة المرور
                </label>
                <input
                  type="password"
                  required
                  dir="ltr"
                  placeholder="••••••••"
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-sm text-left"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-sm shadow-lg transition"
            >
              {authLoading
                ? 'جاري التحقق...'
                : isFirstSetup
                ? 'حفظ بيانات المدير والدخول'
                : 'دخول لوحة التحكم'}
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ← العودة إلى واجهة الموقع
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* -------------------- AUTHENTICATED ADMIN WORKSPACE -------------------- */
  const navItems = [
    { id: 'stats', label: 'الإحصائيات', icon: LayoutDashboard },
    { id: 'orders', label: `الطلبات (${stats.newOrders})`, icon: Package },
    { id: 'notebooks', label: 'إدارة المذكرات', icon: BookOpen },
    { id: 'offers', label: 'العروض والكوبونات', icon: Gift },
    { id: 'reviews', label: 'آراء العملاء', icon: Quote },
    { id: 'structure', label: 'المراحل والمواد', icon: FolderTree },
    { id: 'settings', label: 'إعدادات الموقع', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm">{settings.siteName}</h2>
              <span className="text-[11px] text-slate-400">لوحة الإدارة والتحكم</span>
            </div>
          </div>
        </div>

        <nav className="p-3 flex lg:flex-col gap-1.5 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  document.getElementById('admin-main-content')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-800 flex lg:flex-col gap-2">
          <button
            type="button"
            onClick={onExitAdmin}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>معاينة الموقع</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="py-2.5 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-xs font-bold text-rose-300 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </aside>

      {/* Admin Main Content */}
      <main id="admin-main-content" className="flex-1 min-w-0 p-4 sm:p-8 overflow-y-auto">
        {/* TAB 1: ANALYTICS & STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900">ملخص الأداء والإحصائيات</h1>
              <p className="text-sm text-slate-500">نظرة شاملة على طلبات المعلمين وإيرادات المنصة</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  label: 'إجمالي الطلبات',
                  value: stats.totalOrders,
                  icon: Package,
                  color: 'bg-blue-50 text-blue-700'
                },
                {
                  label: 'طلبات جديدة بانتظار المراجعة',
                  value: stats.newOrders,
                  icon: Clock,
                  color: 'bg-amber-50 text-amber-700'
                },
                {
                  label: 'طلبات تم تسليمها',
                  value: stats.completedOrders,
                  icon: CheckCircle2,
                  color: 'bg-emerald-50 text-emerald-700'
                },
                {
                  label: 'إجمالي الإيرادات (باستثناء الملغي)',
                  value: `${stats.revenue.toLocaleString('ar-EG')} ${settings.currency}`,
                  icon: TrendingUp,
                  color: 'bg-purple-50 text-purple-700'
                }
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-500">{card.label}</p>
                      <h3 className="text-2xl font-black text-slate-900 mt-1">{card.value}</h3>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Distribution Bar Chart & Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>توزيع الطلبات حسب الحالة</span>
                  </h3>
                  <span className="text-xs text-slate-400">تحديث لحظي</span>
                </div>

                <div className="space-y-4">
                  {ORDER_STATUSES.map((st) => {
                    const count = orders.filter((o) => o.status === st.id).length;
                    const pct = stats.totalOrders ? Math.round((count / stats.totalOrders) * 100) : 0;
                    return (
                      <div key={st.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700">{st.label}</span>
                          <span className="text-slate-500">
                            {count} طلب ({pct}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-gradient-to-l from-blue-600 to-teal-500 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
                <h3 className="font-extrabold text-slate-900">مؤشر إنجاز الطلبات</h3>
                <div className="my-6 flex items-center justify-center">
                  {(() => {
                    const completionPct = stats.totalOrders
                      ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
                      : 0;
                    return (
                      <div
                        style={{
                          background: `conic-gradient(#0d9488 ${completionPct * 3.6}deg, #e2e8f0 0deg)`
                        }}
                        className="w-40 h-40 rounded-full flex items-center justify-center p-4"
                      >
                        <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-slate-900">{completionPct}%</span>
                          <span className="text-[11px] font-bold text-slate-500">نسبة التسليم</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="text-xs text-center text-slate-500">
                  إجمالي المذكرات المنشورة حاليًا:{' '}
                  <strong className="text-slate-900">
                    {notebooks.filter((n) => n.published !== false).length}
                  </strong>{' '}
                  مذكرة
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">إدارة طلبات المعلمين</h1>
                <p className="text-sm text-slate-500">
                  مراجعة بيانات التخصيص، تحميل الشعارات، وإرسال المذكرات الجاهزة
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportOrdersToCSV(filteredOrders, settings.currency)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>تصدير Excel (CSV)</span>
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="بحث برقم الطلب، اسم المعلم، الهاتف، أو اسم المذكرة..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 bg-white"
              >
                <option value="all">جميع الحالات ({orders.length})</option>
                {ORDER_STATUSES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-100">
                    <tr>
                      <th className="p-4">رقم الطلب</th>
                      <th className="p-4">المعلم</th>
                      <th className="p-4">المذكرة</th>
                      <th className="p-4">الهاتف</th>
                      <th className="p-4">السعر والدفع</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400">
                          لا توجد طلبات مطابقة للبحث.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => {
                        const st =
                          ORDER_STATUSES.find((s) => s.id === ord.status) || ORDER_STATUSES[0];
                        const payStatus =
                          ord.paymentStatus || (ord.paymentReceiptUrl ? 'pending_review' : 'unpaid');
                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-4 font-mono font-bold text-blue-700 text-xs">
                              {ord.orderNumber}
                            </td>
                            <td className="p-4 font-bold text-slate-900">{ord.teacherName}</td>
                            <td className="p-4 text-slate-600 max-w-[200px] truncate">
                              {ord.customNotebookTitle}
                            </td>
                            <td className="p-4 font-mono text-xs">{ord.phone}</td>
                            <td className="p-4 space-y-1">
                              <div className="font-extrabold text-emerald-700">
                                {ord.price ? `${ord.price} ${settings.currency}` : 'بالاتفاق'}
                              </div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  payStatus === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : payStatus === 'pending_review'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {payStatus === 'paid'
                                  ? '✓ مدفوع ومؤكد'
                                  : payStatus === 'pending_review'
                                  ? '⏳ إيصال مرفق'
                                  : 'لم يُدفع بعد'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${st.color}`}
                              >
                                {st.label}
                              </span>
                            </td>
                            <td className="p-4">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(ord)}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs"
                              >
                                التفاصيل والتسليم
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTEBOOKS CRUD */}
        {activeTab === 'notebooks' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">إدارة المذكرات التعليمية</h1>
                <p className="text-sm text-slate-500">
                  إضافة مذكرات جديدة، تعديل الأسعار، رفع عينات المطالعة، أو إخفاء المذكرات مؤقتًا
                </p>
              </div>
              <button
                type="button"
                onClick={openAddNotebookModal}
                className="px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مذكرة جديدة</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {notebooks.map((nb) => {
                const discountPct = calcDiscountPercent(nb.price, nb.oldPrice);
                return (
                  <div
                    key={nb.id}
                    className={`bg-white rounded-3xl border overflow-hidden shadow-xs flex flex-col justify-between ${
                      nb.published === false ? 'opacity-65 border-slate-300' : 'border-slate-100'
                    }`}
                  >
                    <div>
                      <NotebookCoverArt
                        notebook={nb}
                        stageName={lookUp.stageName(nb.stageId)}
                        subjectName={lookUp.subjectName(nb.subjectId)}
                        className="h-44"
                      />
                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                          <span className="text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                            {lookUp.categoryName(nb.categoryId)}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full ${
                              nb.published === false
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {nb.published === false ? 'مخفية' : 'منشورة'}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 line-clamp-2">{nb.title}</h3>
                        <p className="text-xs text-slate-500">
                          {lookUp.stageName(nb.stageId)} • {lookUp.gradeName(nb.gradeId)} •{' '}
                          {lookUp.subjectName(nb.subjectId)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="font-black text-base text-emerald-700">
                            السعر {nb.price} {settings.currency}
                          </span>
                          {Number(nb.oldPrice) > Number(nb.price) && (
                            <>
                              <span className="text-xs text-slate-400">
                                بدلًا من <span className="line-through">{nb.oldPrice}</span>{' '}
                                {settings.currency}
                              </span>
                              {discountPct > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-extrabold">
                                  وفر {discountPct}%
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditNotebookModal(nb)}
                        className="flex-1 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSaveNotebook({ ...nb, published: nb.published === false })}
                        title={nb.published === false ? 'نشر المذكرة' : 'إخفاء المذكرة مؤقتًا'}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                      >
                        {nb.published === false ? (
                          <Eye className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-amber-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDialog({
                            title: 'حذف المذكرة',
                            message: `هل أنت متأكد من حذف "${nb.title}" نهائيًا؟`,
                            onConfirm: async () => {
                              await onDeleteNotebook(nb.id);
                              showToast('تم حذف المذكرة بنجاح', 'success');
                            }
                          })
                        }
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: OFFERS, COUPONS & BUNDLES */}
        {activeTab === 'offers' && (
          <div className="space-y-8 max-w-5xl">
            <div>
              <h1 className="text-2xl font-black text-slate-900">إدارة العروض، الكوبونات، والباقات</h1>
              <p className="text-sm text-slate-500">
                تحكم في شريط العروض العلوي، أكواد الخصم، وخصم طلب أكثر من مذكرة لزيادة مبيعاتك
              </p>
            </div>

            {/* Announcement Bar Settings */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>شريط العروض العلوي وظهور العروض بالرئيسية</span>
                </h3>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.announcementBar?.enabled)}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        announcementBar: {
                          ...settingsForm.announcementBar,
                          enabled: e.target.checked
                        }
                      })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span>إظهار شريط العروض أعلى الموقع</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    نص الإعلان في الشريط العلوي
                  </label>
                  <input
                    type="text"
                    value={settingsForm.announcementBar?.text || ''}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        announcementBar: {
                          ...settingsForm.announcementBar,
                          text: e.target.value
                        }
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">لون خلفية الشريط</label>
                  <input
                    type="color"
                    value={settingsForm.announcementBar?.bgColor || '#0f172a'}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        announcementBar: {
                          ...settingsForm.announcementBar,
                          bgColor: e.target.value
                        }
                      })
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.showOffersOnHome !== false}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, showOffersOnHome: e.target.checked })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span>إظهار قسم العروض والباقات في الصفحة الرئيسية</span>
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    await onSaveSettings(settingsForm);
                    showToast('تم حفظ إعدادات شريط العروض بنجاح', 'success');
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold"
                >
                  حفظ إعدادات الشريط
                </button>
              </div>
            </div>

            {/* Multi-Order Automatic Discount Settings */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onSaveSettings(settingsForm);
                showToast('تم حفظ إعدادات خصم الكمية بنجاح', 'success');
              }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-600" />
                  <span>خصم طلب أكثر من مذكرة (خصم الكمية التلقائي)</span>
                </h3>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.multiOrderDiscount?.enabled)}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        multiOrderDiscount: {
                          ...settingsForm.multiOrderDiscount,
                          enabled: e.target.checked
                        }
                      })
                    }
                    className="w-4 h-4 accent-teal-600"
                  />
                  <span>تفعيل الخصم التلقائي</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    الحد الأدنى لعدد المذكرات
                  </label>
                  <input
                    type="number"
                    min="2"
                    value={settingsForm.multiOrderDiscount?.minItems || 2}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        multiOrderDiscount: {
                          ...settingsForm.multiOrderDiscount,
                          minItems: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">نوع الخصم</label>
                  <select
                    value={settingsForm.multiOrderDiscount?.type || 'percent'}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        multiOrderDiscount: {
                          ...settingsForm.multiOrderDiscount,
                          type: e.target.value
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="percent">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت ({settings.currency})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">قيمة الخصم</label>
                  <input
                    type="number"
                    min="1"
                    value={settingsForm.multiOrderDiscount?.value || 15}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        multiOrderDiscount: {
                          ...settingsForm.multiOrderDiscount,
                          value: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  رسالة العرض الترويجية للمعلم
                </label>
                <input
                  type="text"
                  value={settingsForm.multiOrderDiscount?.label || ''}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      multiOrderDiscount: {
                        ...settingsForm.multiOrderDiscount,
                        label: e.target.value
                      }
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold"
              >
                حفظ إعدادات خصم الكمية
              </button>
            </form>

            {/* Next-Order Special Coupon Auto Settings */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onSaveSettings(settingsForm);
                showToast('تم حفظ إعدادات كوبون الطلب القادم بنجاح', 'success');
              }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-600" />
                    <span>كوبون الهدية الخاص للطلب القادم (بعد إتمام التسليم)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    يُصدر كود سري مخصص لكل عميل لتشجيعه على الطلب التالي، ويمكنك إيقافه أو حذفه لأي عميل من تفاصيل طلبه.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.nextOrderCouponAuto?.enabled)}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        nextOrderCouponAuto: {
                          ...settingsForm.nextOrderCouponAuto,
                          enabled: e.target.checked
                        }
                      })
                    }
                    className="w-4 h-4 accent-purple-600"
                  />
                  <span>إصدار تلقائي عند تحويل الطلب إلى (تم التسليم)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    نوع الخصم الافتراضي
                  </label>
                  <select
                    value={settingsForm.nextOrderCouponAuto?.type || 'percent'}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        nextOrderCouponAuto: {
                          ...settingsForm.nextOrderCouponAuto,
                          type: e.target.value
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="percent">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت ({settings.currency})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    قيمة الخصم الافتراضية
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settingsForm.nextOrderCouponAuto?.value || 15}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        nextOrderCouponAuto: {
                          ...settingsForm.nextOrderCouponAuto,
                          value: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    عدد مرات الاستخدام (0 = بلا حدود)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={
                      settingsForm.nextOrderCouponAuto?.maxUses !== undefined
                        ? settingsForm.nextOrderCouponAuto.maxUses
                        : 1
                    }
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        nextOrderCouponAuto: {
                          ...settingsForm.nextOrderCouponAuto,
                          maxUses: Math.max(0, Number(e.target.value) || 0)
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    مدة الصلاحية بالأيام (0 = بلا حدود)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={
                      settingsForm.nextOrderCouponAuto?.validDays !== undefined
                        ? settingsForm.nextOrderCouponAuto.validDays
                        : 30
                    }
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        nextOrderCouponAuto: {
                          ...settingsForm.nextOrderCouponAuto,
                          validDays: Math.max(0, Number(e.target.value) || 0)
                        }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold"
              >
                حفظ إعدادات كوبون الطلب القادم
              </button>
            </form>

            {/* Coupons Management */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <span>أكواد وكوبونات الخصم ({coupons.length})</span>
                </h3>
                {editingCouponId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCouponId('');
                      setCouponForm({
                        code: '',
                        type: 'percent',
                        value: 15,
                        minOrder: 0,
                        description: '',
                        isPrivate: false,
                        maxUses: 0,
                        expiresAt: ''
                      });
                    }}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const cleanCode = couponForm.code.trim().toUpperCase();
                  if (!cleanCode) return showToast('يرجى إدخال كود الكوبون', 'error');
                  const existing = editingCouponId
                    ? coupons.find((c) => c.id === editingCouponId)
                    : null;
                  await onSaveCoupon({
                    ...(existing || {}),
                    id: editingCouponId || `cp_${Date.now()}`,
                    code: cleanCode,
                    type: couponForm.type,
                    value: Number(couponForm.value) || 10,
                    minOrder: Number(couponForm.minOrder) || 0,
                    description: couponForm.description.trim() || `خصم خاص بكود ${cleanCode}`,
                    isPrivate: Boolean(couponForm.isPrivate),
                    maxUses: Math.max(0, Number(couponForm.maxUses) || 0),
                    usedCount: existing ? Number(existing.usedCount) || 0 : 0,
                    expiresAt: couponForm.expiresAt || '',
                    active: existing ? existing.active !== false : true
                  });
                  setEditingCouponId('');
                  setCouponForm({
                    code: '',
                    type: 'percent',
                    value: 15,
                    minOrder: 0,
                    description: '',
                    isPrivate: false,
                    maxUses: 0,
                    expiresAt: ''
                  });
                  showToast(
                    editingCouponId ? 'تم تحديث بيانات الكوبون بنجاح' : 'تمت إضافة كود الخصم بنجاح',
                    'success'
                  );
                }}
                className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      كود الكوبون
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="مثال: EID25"
                      value={couponForm.code}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs uppercase text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع الخصم</label>
                    <select
                      value={couponForm.type}
                      onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    >
                      <option value="percent">نسبة %</option>
                      <option value="fixed">مبلغ ({settings.currency})</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      قيمة الخصم
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="15"
                      value={couponForm.value}
                      onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      الحد الأدنى للطلب ({settings.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 = بدون حد أدنى"
                      value={couponForm.minOrder}
                      onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      عدد مرات الاستخدام (0 أو فارغ = بلا حدود)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="بلا حدود"
                      value={couponForm.maxUses || ''}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          maxUses: Math.max(0, Number(e.target.value) || 0)
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      تاريخ انتهاء الصلاحية (فارغ = بلا حدود)
                    </label>
                    <input
                      type="date"
                      value={couponForm.expiresAt || ''}
                      onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      وصف الكوبون (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="وصف مختصر يظهر للمعلم"
                      value={couponForm.description}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, description: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingCouponId ? 'حفظ التعديلات' : 'إضافة الكوبون'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-6 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(couponForm.isPrivate)}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, isPrivate: e.target.checked })
                      }
                      className="w-4 h-4 accent-purple-600"
                    />
                    <span>كوبون خاص مخفي (لا يظهر في صفحة العروض، يُعطى لمن تملك الكود فقط)</span>
                  </label>
                </div>
              </form>

              <div className="divide-y divide-slate-100">
                {coupons.map((cp) => {
                  const exhausted = isCouponExhausted(cp);
                  const maxUses = Number(cp.maxUses) || 0;
                  const usedCount = Number(cp.usedCount) || 0;
                  return (
                    <div
                      key={cp.id}
                      className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-800 font-mono font-black text-xs border border-blue-200">
                          {cp.code}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-700">
                          خصم{' '}
                          {cp.type === 'percent' ? `${cp.value}%` : `${cp.value} ${settings.currency}`}
                        </span>
                        {cp.isPrivate && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">
                            خاص ومخفي
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {maxUses > 0 ? `الاستخدام: ${usedCount} / ${maxUses}` : 'مرات بلا حدود'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold">
                          {cp.expiresAt
                            ? `ينتهي: ${new Date(cp.expiresAt).toLocaleDateString('ar-EG')}`
                            : 'صلاحية بلا حدود'}
                        </span>
                        <span className="text-xs text-slate-500">{cp.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCouponId(cp.id);
                            setCouponForm({
                              code: cp.code || '',
                              type: cp.type || 'percent',
                              value: cp.value || 15,
                              minOrder: cp.minOrder || 0,
                              description: cp.description || '',
                              isPrivate: Boolean(cp.isPrivate),
                              maxUses: Number(cp.maxUses) || 0,
                              expiresAt: cp.expiresAt || ''
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => onSaveCoupon({ ...cp, active: cp.active === false })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            !exhausted
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {!exhausted ? 'مُفعّل' : cp.active === false ? 'موقوف' : 'منتهي الصلاحية/العدد'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDialog({
                              title: 'حذف الكوبون',
                              message: `هل تريد حذف كود الخصم "${cp.code}"؟`,
                              onConfirm: () => onDeleteCoupon(cp.id)
                            })
                          }
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bundles Management */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                <span>الباقات والعروض المجمّعة ({bundles.length})</span>
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!bundleForm.title.trim()) return showToast('يرجى إدخال عنوان الباقة', 'error');
                  const features = bundleForm.featuresText
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean);
                  await onSaveBundle({
                    id: `bnd_${Date.now()}`,
                    title: bundleForm.title.trim(),
                    subtitle: bundleForm.subtitle.trim(),
                    price: Number(bundleForm.price) || 0,
                    oldPrice: Number(bundleForm.oldPrice) || 0,
                    badge: bundleForm.badge.trim() || 'باقة موفرة',
                    features:
                      features.length > 0
                        ? features
                        : ['تصميم احترافي باسم المعلم وشعاره', 'تسليم PDF عالي الدقة'],
                    active: true
                  });
                  setBundleForm({
                    title: '',
                    subtitle: '',
                    price: 600,
                    oldPrice: 800,
                    badge: 'عرض مجمّع',
                    featuresText: ''
                  });
                  showToast('تمت إضافة الباقة بنجاح', 'success');
                }}
                className="space-y-3 bg-slate-50 p-4 rounded-2xl"
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="عنوان الباقة (مثال: باقة 3 مذكرات)"
                    value={bundleForm.title}
                    onChange={(e) => setBundleForm({ ...bundleForm, title: e.target.value })}
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                  <input
                    type="number"
                    placeholder={`السعر (${settings.currency})`}
                    value={bundleForm.price}
                    onChange={(e) => setBundleForm({ ...bundleForm, price: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                  <input
                    type="number"
                    placeholder="بدلًا من (السعر قبل الخصم)"
                    value={bundleForm.oldPrice}
                    onChange={(e) => setBundleForm({ ...bundleForm, oldPrice: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="وصف مختصر للباقة"
                    value={bundleForm.subtitle}
                    onChange={(e) => setBundleForm({ ...bundleForm, subtitle: e.target.value })}
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="شارة الباقة (مثل: وفر 200 ج.م)"
                    value={bundleForm.badge}
                    onChange={(e) => setBundleForm({ ...bundleForm, badge: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
                <textarea
                  rows="2"
                  placeholder="مميزات الباقة (اكتب كل ميزة في سطر مستقل)..."
                  value={bundleForm.featuresText}
                  onChange={(e) => setBundleForm({ ...bundleForm, featuresText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة باقة جديدة</span>
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bundles.map((bnd) => (
                  <div
                    key={bnd.id}
                    className="p-4 rounded-2xl border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                        {bnd.badge}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">{bnd.title}</h4>
                      <p className="text-xs text-slate-500">{bnd.subtitle}</p>
                      <div className="text-xs font-black text-emerald-700 pt-1">
                        {bnd.price} {settings.currency}{' '}
                        {bnd.oldPrice > bnd.price && (
                          <span className="line-through text-slate-400 font-normal mr-1">
                            {bnd.oldPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSaveBundle({ ...bnd, active: bnd.active === false })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          bnd.active !== false
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {bnd.active !== false ? 'نشط' : 'مخفي'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDialog({
                            title: 'حذف الباقة',
                            message: `هل تريد حذف "${bnd.title}"؟`,
                            onConfirm: () => onDeleteBundle(bnd.id)
                          })
                        }
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 self-end"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STRUCTURE (STAGES, GRADES, SUBJECTS) */}
        {activeTab === 'structure' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h1 className="text-2xl font-black text-slate-900">الأقسام والمراحل والصفوف والمواد</h1>
              <p className="text-sm text-slate-500">
                أضف أو احذف المراحل والصفوف والمواد الدراسية التي تظهر في القوائم والفلاتر
              </p>
            </div>

            <form
              onSubmit={handleAddStructure}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap gap-3 items-end"
            >
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">النوع</label>
                <select
                  value={newStructType}
                  onChange={(e) => setNewStructType(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-white"
                >
                  <option value="subjects">مادة دراسية</option>
                  <option value="grades">صف دراسي</option>
                  <option value="stages">مرحلة تعليمية</option>
                  <option value="categories">قسم رئيسي</option>
                </select>
              </div>

              {newStructType === 'grades' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تابع لمرحلة</label>
                  <select
                    value={newStructStageId}
                    onChange={(e) => setNewStructStageId(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-white"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-slate-600 mb-1">الاسم</label>
                <input
                  type="text"
                  placeholder="اكتب الاسم هنا..."
                  value={newStructName}
                  onChange={(e) => setNewStructName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-black flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { key: 'categories', title: 'الأقسام الرئيسية', list: categories },
                { key: 'stages', title: 'المراحل التعليمية', list: stages },
                { key: 'grades', title: 'الصفوف الدراسية', list: grades },
                { key: 'subjects', title: 'المواد الدراسية', list: subjects }
              ].map((group) => (
                <div
                  key={group.key}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3"
                >
                  <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2.5">
                    {group.title} ({group.list.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {group.list.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 text-xs font-bold"
                      >
                        <span>
                          {item.name}
                          {item.stageId ? ` (${lookUp.stageName(item.stageId)})` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDialog({
                              title: 'تأكيد الحذف',
                              message: `هل تريد حذف "${item.name}"؟`,
                              onConfirm: () => onDeleteStructureItem(group.key, item.id)
                            })
                          }
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: WEBSITE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900">إعدادات وهوية المنصة</h1>
                <p className="text-sm text-slate-500">
                  تخصيص اسم الموقع، الشعار، الألوان، أرقام التواصل، والنسخ الاحتياطي
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>نسخة احتياطية (JSON)</span>
                </button>
                <button
                  type="button"
                  onClick={() => backupFileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة نسخة</span>
                </button>
                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreBackupFile}
                  className="hidden"
                />
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onSaveSettings(settingsForm);
                showToast('تم حفظ جميع الإعدادات بنجاح', 'success');
              }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم المنصة</label>
                  <input
                    type="text"
                    value={settingsForm.siteName || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">العملة</label>
                  <input
                    type="text"
                    value={settingsForm.currency || 'ج.م'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">رقم الواتساب</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsForm.whatsappNumber || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-left font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    رقم خدمة العملاء
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="01000000000"
                    value={settingsForm.phone || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-left font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={settingsForm.email || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-left"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    رابط جروب الواتساب (اختياري)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://chat.whatsapp.com/..."
                    value={settingsForm.whatsappGroupUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, whatsappGroupUrl: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-left"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    رابط صفحة الفيسبوك (اختياري)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://facebook.com/yourpage"
                    value={settingsForm.facebookUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-left"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    رابط قناة / جروب التليجرام (اختياري)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://t.me/yourchannel"
                    value={settingsForm.telegramUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, telegramUrl: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-left"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    رابط قناة اليوتيوب (اختياري)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://youtube.com/@yourchannel"
                    value={settingsForm.youtubeUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-left"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    رابط الإنستجرام (اختياري)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://instagram.com/yourpage"
                    value={settingsForm.instagramUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-left"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    رابط التيك توك (اختياري)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://tiktok.com/@youraccount"
                    value={settingsForm.tiktokUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, tiktokUrl: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اللون الرئيسي</label>
                  <input
                    type="color"
                    value={settingsForm.primaryColor || '#1d4ed8'}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, primaryColor: e.target.value })
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اللون الثانوي</label>
                  <input
                    type="color"
                    value={settingsForm.secondaryColor || '#0d9488'}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, secondaryColor: e.target.value })
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    حجم الشعار في الهيدر
                  </label>
                  <select
                    value={settingsForm.logoSize || 'lg'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, logoSize: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="md">متوسط</option>
                    <option value="lg">كبير (موصى به)</option>
                    <option value="xl">كبير جدًا وبارز</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    شعار المنصة (Logo)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const data = await compressImageFile(f, 500, 0.9);
                      setSettingsForm({ ...settingsForm, logoUrl: data });
                    }}
                    className="w-full text-xs text-slate-500 file:ml-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-bold"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-extrabold text-slate-700">
                  صورة خلفية القسم الترحيبي في الصفحة الرئيسية (اختياري)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const data = await compressImageFile(f, 1400, 0.85);
                      setSettingsForm({ ...settingsForm, heroBgImage: data });
                      showToast('تم رفع صورة الخلفية، اضغط حفظ الإعدادات لتطبيقها', 'info');
                    }}
                    className="flex-1 text-xs text-slate-500 file:ml-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-bold"
                  />
                  {settingsForm.heroBgImage && (
                    <div className="flex items-center gap-2">
                      <img
                        src={settingsForm.heroBgImage}
                        alt="معاينة خلفية الرئيسية"
                        className="w-20 h-12 rounded-xl object-cover border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, heroBgImage: '' })}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold"
                      >
                        إزالة الصورة
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  العنوان الترحيبي الرئيسي
                </label>
                <input
                  type="text"
                  value={settingsForm.heroTitle || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الوصف الترحيبي</label>
                <textarea
                  rows="2"
                  value={settingsForm.heroSubtitle || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    عنوان قسم التعريف بالمنصة (في الصفحة الرئيسية)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.aboutTitle || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, aboutTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.showAbout !== false}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, showAbout: e.target.checked })
                      }
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span>إظهار قسم التعريف بالمنصة في الصفحة الرئيسية</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    نص التعريف بالمنصة ومميزاتها
                  </label>
                  <textarea
                    rows="2"
                    value={settingsForm.aboutDescription || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, aboutDescription: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  رسالة تأكيد الطلب وبيانات الدفع (فودافون كاش / إنستاباي)
                </label>
                <textarea
                  rows="2"
                  value={settingsForm.paymentInfo || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, paymentInfo: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              {/* Important Notices Control Box */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>خانة التنبيهات الهامة للزوار</span>
                  </h4>
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settingsForm.showImportantNotices)}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          showImportantNotices: e.target.checked
                        })
                      }
                      className="w-4 h-4 accent-amber-600"
                    />
                    <span>إظهار خانة التنبيهات في الموقع</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان صندوق التنبيهات
                  </label>
                  <input
                    type="text"
                    value={settingsForm.importantNoticesTitle || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, importantNoticesTitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-white text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">قائمة التنبيهات</label>
                  {(settingsForm.importantNotices || []).map((notice, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={notice}
                        onChange={(e) => {
                          const updated = [...(settingsForm.importantNotices || [])];
                          updated[idx] = e.target.value;
                          setSettingsForm({ ...settingsForm, importantNotices: updated });
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (settingsForm.importantNotices || []).filter(
                            (_, i) => i !== idx
                          );
                          setSettingsForm({ ...settingsForm, importantNotices: updated });
                        }}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                        title="حذف التنبيه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="أضف تنبيهًا جديدًا للمعلمين..."
                      value={newNoticeInput}
                      onChange={(e) => setNewNoticeInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newNoticeInput.trim()) return;
                        setSettingsForm({
                          ...settingsForm,
                          importantNotices: [
                            ...(settingsForm.importantNotices || []),
                            newNoticeInput.trim()
                          ]
                        });
                        setNewNoticeInput('');
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                    >
                      + إضافة تنبيه
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.allowLogoUpload)}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, allowLogoUpload: e.target.checked })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span>السماح للمعلم برفع الشعار في نموذج الطلب</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.requirePaymentProof)}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, requirePaymentProof: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span>جعل إرفاق صورة إيصال التحويل إلزاميًا عند الطلب</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.showReviews !== false}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, showReviews: e.target.checked })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span>إظهار قسم آراء العملاء (اسكرينات واتساب) في الرئيسية</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-rose-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.maintenanceMode)}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })
                    }
                    className="w-4 h-4 accent-rose-600"
                  />
                  <span>تفعيل وضع الصيانة (إغلاق واجهة الموقع مؤقتًا)</span>
                </label>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-black flex items-center gap-2 shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>حفظ جميع الإعدادات</span>
              </button>
            </form>

            {/* Subjects Visibility & Quick Management inside Settings */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>التحكم في المواد الدراسية المعروضة على الموقع</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  أضف مواد جديدة، عدّل اسم أي مادة، أو أخفِها مؤقتًا من قوائم التصفح والبحث دون حذفها
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="أدخل اسم مادة دراسية جديدة (مثل: الأحياء، الجغرافيا)..."
                  value={newSubjectSettingName}
                  onChange={(e) => setNewSubjectSettingName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newSubjectSettingName.trim()) return;
                    await onSaveStructureItem('subjects', {
                      id: `sub_${Date.now()}`,
                      name: newSubjectSettingName.trim(),
                      order: subjects.length + 1,
                      visible: true
                    });
                    setNewSubjectSettingName('');
                    showToast('تمت إضافة المادة بنجاح', 'success');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مادة</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {subjects.map((sub) => {
                  const isVisible = sub.visible !== false;
                  const isEditingThis = editingSubjectId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      {isEditingThis ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingSubjectName}
                            onChange={(e) => setEditingSubjectName(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-blue-300 text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!editingSubjectName.trim()) return;
                              await onSaveStructureItem('subjects', {
                                ...sub,
                                name: editingSubjectName.trim()
                              });
                              setEditingSubjectId('');
                              showToast('تم تحديث اسم المادة', 'success');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubjectId('')}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`font-extrabold text-xs sm:text-sm ${
                              isVisible ? 'text-slate-900' : 'text-slate-400 line-through'
                            }`}
                          >
                            {sub.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isVisible
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isVisible ? 'ظاهرة في الموقع' : 'مخفية من الموقع'}
                          </span>
                        </div>
                      )}

                      {!isEditingThis && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubjectId(sub.id);
                              setEditingSubjectName(sub.name);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            تعديل الاسم
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await onSaveStructureItem('subjects', { ...sub, visible: !isVisible });
                              showToast(
                                !isVisible
                                  ? `تم إظهار مادة ${sub.name} في الموقع`
                                  : `تم إخفاء مادة ${sub.name} من الموقع`,
                                'info'
                              );
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                              isVisible
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isVisible ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>إخفاء</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>إظهار</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDialog({
                                title: 'حذف المادة الدراسية',
                                message: `هل تريد حذف مادة "${sub.name}" نهائيًا؟`,
                                onConfirm: () => onDeleteStructureItem('subjects', sub.id)
                              })
                            }
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin Password Update Box */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>تغيير كلمة مرور المدير</span>
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="password"
                  dir="ltr"
                  placeholder="كلمة المرور الجديدة (6 أحرف فأكثر)"
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-left"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (newAdminPass.length < 6) {
                      return showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
                    }
                    const salt = generateSalt();
                    const passwordHash = await hashPasswordWithSalt(newAdminPass, salt);
                    await onUpdateAdminPassword({
                      email: adminMeta.email,
                      salt,
                      passwordHash,
                      updatedAt: new Date().toISOString()
                    });
                    setNewAdminPass('');
                    showToast('تم تحديث كلمة مرور المدير بنجاح', 'success');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold"
                >
                  تحديث كلمة المرور
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CLIENT REVIEWS & WHATSAPP SCREENSHOTS */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900">آراء العملاء واسكرينات الواتساب</h1>
                <p className="text-sm text-slate-500">
                  أضف لقطات شاشة (Screenshots) من محادثات الواتساب أو تقييمات المعلمين لتظهر في الصفحة الرئيسية وتزيد ثقة الزوار.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-extrabold text-blue-800 bg-blue-50 px-4 py-2.5 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showReviews !== false}
                  onChange={async (e) => {
                    await onSaveSettings({ ...settings, showReviews: e.target.checked });
                    showToast(
                      e.target.checked
                        ? 'تم إظهار قسم آراء العملاء في الصفحة الرئيسية'
                        : 'تم إخفاء قسم آراء العملاء من الصفحة الرئيسية',
                      'success'
                    );
                  }}
                  className="w-4 h-4 accent-blue-600"
                />
                <span>إظهار القسم في الرئيسية</span>
              </label>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!reviewForm.teacherName.trim() && !reviewForm.screenshotUrl) {
                  return showToast(
                    'يرجى إدخال اسم المعلم أو رفع صورة اسكرين شوت للمحادثة',
                    'error'
                  );
                }
                await onSaveReview({
                  id: `rev_${Date.now()}`,
                  teacherName: reviewForm.teacherName.trim() || 'معلم مشترك',
                  subjectAndStage: reviewForm.subjectAndStage.trim(),
                  quote: reviewForm.quote.trim(),
                  screenshotUrl: reviewForm.screenshotUrl,
                  active: true,
                  createdAt: new Date().toISOString()
                });
                setReviewForm({
                  teacherName: '',
                  subjectAndStage: '',
                  quote: '',
                  screenshotUrl: ''
                });
                showToast('تمت إضافة رأي العميل بنجاح', 'success');
              }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4"
            >
              <h3 className="font-extrabold text-base text-slate-900">
                إضافة تقييم / اسكرين محادثة واتساب
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم المعلم</label>
                  <input
                    type="text"
                    placeholder="مثال: أ/ محمد السيد"
                    value={reviewForm.teacherName}
                    onChange={(e) => setReviewForm({ ...reviewForm, teacherName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    التخصص / المرحلة
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: معلم كيمياء — المرحلة الثانوية"
                    value={reviewForm.subjectAndStage}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, subjectAndStage: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  صورة اسكرين شوت لمحادثة الواتساب (موصى به)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const imgData = await compressImageFile(f, 800, 0.8);
                        setReviewForm({ ...reviewForm, screenshotUrl: imgData });
                        showToast('تم إرفاق صورة الاسكرين شوت', 'success');
                      } catch {
                        showToast('تعذر معالجة الصورة', 'error');
                      }
                    }}
                    className="flex-1 text-xs text-slate-500 file:ml-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-bold"
                  />
                  {reviewForm.screenshotUrl && (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={reviewForm.screenshotUrl}
                        alt="معاينة الاسكرين"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, screenshotUrl: '' })}
                        className="absolute top-0.5 left-0.5 p-0.5 rounded-full bg-rose-600 text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  نص التعليق أو مقتطف من رأي المعلم (اختياري إذا رفعت صورة)
                </label>
                <textarea
                  rows="2"
                  placeholder="اكتب رأي المعلم في جودة المذكرة وسرعة التسليم..."
                  value={reviewForm.quote}
                  onChange={(e) => setReviewForm({ ...reviewForm, quote: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة التقييم للموقع</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {rev.screenshotUrl && (
                      <div className="h-52 bg-slate-100 overflow-hidden border-b border-slate-100">
                        <img
                          src={rev.screenshotUrl}
                          alt={rev.teacherName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {rev.teacherName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rev.active !== false
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {rev.active !== false ? 'ظاهر' : 'مخفي'}
                        </span>
                      </div>
                      {rev.subjectAndStage && (
                        <p className="text-[11px] font-bold text-blue-700">{rev.subjectAndStage}</p>
                      )}
                      {rev.quote && (
                        <p className="text-xs text-slate-600 leading-relaxed">"{rev.quote}"</p>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSaveReview({ ...rev, active: rev.active === false })}
                      className="flex-1 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      {rev.active !== false ? 'إخفاء' : 'إظهار'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDialog({
                          title: 'حذف التقييم',
                          message: `هل تريد حذف تقييم "${rev.teacherName}"؟`,
                          onConfirm: async () => {
                            await onDeleteReview(rev.id);
                            showToast('تم حذف التقييم بنجاح', 'success');
                          }
                        })
                      }
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ADD / EDIT NOTEBOOK MODAL */}
      {nbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-black text-base">
                {editingNb ? 'تعديل بيانات المذكرة' : 'إضافة مذكرة تعليمية جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => setNbModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveNbSubmit}
              className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs sm:text-sm"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان المذكرة *</label>
                <input
                  type="text"
                  required
                  value={nbForm.title}
                  onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم</label>
                  <select
                    value={nbForm.categoryId}
                    onChange={(e) => setNbForm({ ...nbForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المرحلة</label>
                  <select
                    value={nbForm.stageId}
                    onChange={(e) => {
                      const nextStage = e.target.value;
                      const firstGrade = grades.find((g) => g.stageId === nextStage)?.id || '';
                      setNbForm({ ...nbForm, stageId: nextStage, gradeId: firstGrade });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الصف</label>
                  <select
                    value={nbForm.gradeId}
                    onChange={(e) => setNbForm({ ...nbForm, gradeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {grades
                      .filter((g) => g.stageId === nbForm.stageId)
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المادة</label>
                  <select
                    value={nbForm.subjectId}
                    onChange={(e) => setNbForm({ ...nbForm, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    السعر الحالي ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={nbForm.price}
                    onChange={(e) => setNbForm({ ...nbForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    بدلًا من (قبل الخصم)
                  </label>
                  <input
                    type="number"
                    placeholder="اختياري"
                    value={nbForm.oldPrice}
                    onChange={(e) => setNbForm({ ...nbForm, oldPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عدد الصفحات</label>
                  <input
                    type="number"
                    value={nbForm.pageCount}
                    onChange={(e) => setNbForm({ ...nbForm, pageCount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شارة مميزة</label>
                  <input
                    type="text"
                    placeholder="الأكثر طلبًا / جديد"
                    value={nbForm.badge}
                    onChange={(e) => setNbForm({ ...nbForm, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف مختصر</label>
                <input
                  type="text"
                  value={nbForm.shortDesc}
                  onChange={(e) => setNbForm({ ...nbForm, shortDesc: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف التفصيلي</label>
                <textarea
                  rows="3"
                  value={nbForm.fullDesc}
                  onChange={(e) => setNbForm({ ...nbForm, fullDesc: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    صورة غلاف المذكرة
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const data = await compressImageFile(f, 700, 0.85);
                      setNbForm({ ...nbForm, coverUrl: data });
                    }}
                    className="w-full text-xs text-slate-500 file:ml-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عدد صفحات المعاينة المسموحة للمعلم
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={nbForm.previewPagesCount}
                    onChange={(e) => setNbForm({ ...nbForm, previewPagesCount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Sample Preview Switcher: Images OR PDF */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-blue-900 mb-1">
                    رابط Google Drive لعينة مطالعة أكبر (اختياري)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://drive.google.com/file/d/.../view"
                    value={nbForm.drivePreviewUrl || ''}
                    onChange={(e) => setNbForm({ ...nbForm, drivePreviewUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white text-xs text-left outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    سيظهر زر بارز للمعلم في صفحة تفاصيل المذكرة بعنوان «تصفح عينة أكبر على Google Drive».
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                  <label className="text-xs font-extrabold text-slate-800">
                    نوع عينة المطالعة المباشرة داخل الموقع
                  </label>
                  <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setNbForm({ ...nbForm, previewType: 'images' })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        nbForm.previewType !== 'pdf'
                          ? 'bg-blue-700 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      صور صفحات (موصى به)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNbForm({ ...nbForm, previewType: 'pdf' })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        nbForm.previewType === 'pdf'
                          ? 'bg-blue-700 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ملف PDF منفصل
                    </button>
                  </div>
                </div>

                {nbForm.previewType === 'pdf' ? (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const pdfData = await readPdfAsDataUrl(f);
                          setNbForm({ ...nbForm, previewPdfData: pdfData, previewType: 'pdf' });
                          showToast('تم رفع ملف PDF للمعاينة بنجاح', 'success');
                        } catch (err) {
                          showToast(err.message, 'error');
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:ml-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-purple-50 file:text-purple-700 file:font-bold"
                    />
                    {nbForm.previewPdfData && (
                      <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
                        <span className="font-bold">✓ تم إرفاق ملف PDF للعينة بنجاح</span>
                        <button
                          type="button"
                          onClick={() => setNbForm({ ...nbForm, previewPdfData: '' })}
                          className="text-rose-600 font-bold"
                        >
                          إزالة الملف
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []).slice(0, 8);
                        if (!files.length) return;
                        const compressedList = [];
                        for (const f of files) {
                          compressedList.push(await compressImageFile(f, 800, 0.78));
                        }
                        setNbForm({
                          ...nbForm,
                          previewType: 'images',
                          previewImages: [...(nbForm.previewImages || []), ...compressedList].slice(
                            0,
                            8
                          )
                        });
                      }}
                      className="w-full text-xs text-slate-500 file:ml-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 file:font-bold"
                    />
                    {nbForm.previewImages?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {nbForm.previewImages.map((imgSrc, i) => (
                          <div
                            key={i}
                            className="relative w-14 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white"
                          >
                            <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setNbForm({
                                  ...nbForm,
                                  previewImages: nbForm.previewImages.filter((_, idx) => idx !== i)
                                })
                              }
                              className="absolute top-0.5 left-0.5 p-0.5 rounded-full bg-rose-600 text-white"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNbModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-700 text-white font-black"
                >
                  حفظ المذكرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAIL & DELIVERY MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">تفاصيل الطلب #{selectedOrder.orderNumber}</h3>
                <span className="text-xs text-slate-400">
                  {new Date(selectedOrder.createdAt).toLocaleString('ar-EG')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-sm">
              {/* Quick Copy Buttons for Customization */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(selectedOrder.teacherName);
                    showToast('تم نسخ اسم المعلم', 'success');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ اسم المعلم</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(selectedOrder.phone);
                    showToast('تم نسخ رقم الهاتف', 'success');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الهاتف</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(selectedOrder.customNotebookTitle);
                    showToast('تم نسخ اسم المذكرة المطلوب', 'success');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ عنوان الغلاف</span>
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 border border-slate-200/80 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">اسم المعلم:</span>
                  <span className="font-extrabold text-slate-900">{selectedOrder.teacherName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">العنوان المطلوب طباعته:</span>
                  <span className="font-extrabold text-blue-800 text-left">
                    {selectedOrder.customNotebookTitle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الهاتف:</span>
                  <span className="font-mono font-bold">{selectedOrder.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المذكرة الأصلية:</span>
                  <span className="font-bold text-slate-700">{selectedOrder.notebookTitle}</span>
                </div>
                {selectedOrder.couponCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">كود الخصم المستخدم:</span>
                    <span className="font-mono font-bold text-rose-600">
                      {selectedOrder.couponCode} (-{selectedOrder.couponDiscountAmount}{' '}
                      {settings.currency})
                    </span>
                  </div>
                )}
              </div>

              {selectedOrder.logoUrl && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedOrder.logoUrl}
                      alt="شعار المعلم"
                      className="w-14 h-14 object-contain rounded-xl border border-slate-100 p-1"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">شعار المعلم المرفق</p>
                      <p className="text-[11px] text-slate-400">جاهز للتحميل والاستخدام في التصميم</p>
                    </div>
                  </div>
                  <a
                    href={selectedOrder.logoUrl}
                    download={`logo-${selectedOrder.orderNumber}.png`}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل الشعار</span>
                  </a>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-100">
                  <span className="text-xs font-bold text-amber-800 block mb-1">ملاحظات المعلم:</span>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Payment Verification & Receipt Review Section */}
              {(() => {
                const payStatus =
                  selectedOrder.paymentStatus ||
                  (selectedOrder.paymentReceiptUrl ? 'pending_review' : 'unpaid');
                return (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-slate-900">
                        <Receipt className="w-4 h-4 text-blue-700" />
                        <span className="text-xs font-extrabold">
                          التحقق من الدفع وإيصال التحويل
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                          payStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : payStatus === 'pending_review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {payStatus === 'paid'
                          ? '✓ تم تأكيد استلام المبلغ'
                          : payStatus === 'pending_review'
                          ? '⏳ إيصال مرفق بانتظار المراجعة'
                          : 'لم يتم إرفاق إيصال دفع'}
                      </span>
                    </div>

                    {selectedOrder.paymentReceiptUrl ? (
                      <div className="space-y-2">
                        <a
                          href={selectedOrder.paymentReceiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl overflow-hidden border border-slate-200 bg-white max-h-56"
                        >
                          <img
                            src={selectedOrder.paymentReceiptUrl}
                            alt="إيصال التحويل"
                            className="w-full max-h-56 object-contain mx-auto"
                          />
                        </a>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>اضغط على الصورة لتكبيرها في نافذة مستقلة</span>
                          <a
                            href={selectedOrder.paymentReceiptUrl}
                            download={`receipt-${selectedOrder.orderNumber}.jpg`}
                            className="text-blue-700 font-bold hover:underline"
                          >
                            تحميل الإيصال
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        لم يرفع المعلم صورة إيصال التحويل بعد (يمكنه رفعها من صفحة تتبع الطلب أو إرسالها على واتساب).
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = { ...selectedOrder, paymentStatus: 'paid' };
                          await onUpdateOrder(updated);
                          setSelectedOrder(updated);
                          showToast('تم تأكيد استلام الدفع بنجاح', 'success');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
                      >
                        ✓ تأكيد استلام الدفع
                      </button>
                      {payStatus === 'paid' && (
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = {
                              ...selectedOrder,
                              paymentStatus: selectedOrder.paymentReceiptUrl
                                ? 'pending_review'
                                : 'unpaid'
                            };
                            await onUpdateOrder(updated);
                            setSelectedOrder(updated);
                            showToast('تم إلغاء تأكيد الدفع', 'success');
                          }}
                          className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold"
                        >
                          إعادة للمراجعة
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  تحديث حالة الطلب
                </label>
                <select
                  value={selectedOrder.status}
                  onChange={async (e) => {
                    const nextStatus = e.target.value;
                    let updated = { ...selectedOrder, status: nextStatus };
                    if (
                      nextStatus === 'delivered' &&
                      settings.nextOrderCouponAuto?.enabled &&
                      !selectedOrder.nextOrderCouponCode
                    ) {
                      const autoCp = await onIssueNextOrderCoupon(updated, {
                        type: settings.nextOrderCouponAuto.type || 'percent',
                        value: Number(settings.nextOrderCouponAuto.value) || 15,
                        maxUses:
                          settings.nextOrderCouponAuto.maxUses !== undefined
                            ? Number(settings.nextOrderCouponAuto.maxUses)
                            : 1,
                        validDays:
                          settings.nextOrderCouponAuto.validDays !== undefined
                            ? Number(settings.nextOrderCouponAuto.validDays)
                            : 30
                      });
                      if (autoCp) {
                        updated = {
                          ...updated,
                          nextOrderCouponId: autoCp.id,
                          nextOrderCouponCode: autoCp.code,
                          nextOrderCouponEnabled: true
                        };
                        showToast(
                          `تم تحديث الحالة وإصدار كوبون الطلب القادم (${autoCp.code}) تلقائيًا`,
                          'success'
                        );
                      }
                    } else {
                      await onUpdateOrder(updated);
                      showToast('تم تحديث حالة الطلب', 'success');
                    }
                    setSelectedOrder(updated);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs sm:text-sm bg-white"
                >
                  {ORDER_STATUSES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  رابط المذكرة النهائية بعد التخصيص (Google Drive / رابط مباشر)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://drive.google.com/..."
                    value={selectedOrder.deliveryUrl || ''}
                    onChange={(e) =>
                      setSelectedOrder({ ...selectedOrder, deliveryUrl: e.target.value })
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-left"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const nextStatus =
                        selectedOrder.deliveryUrl?.trim() &&
                        ['new', 'reviewing', 'customizing'].includes(selectedOrder.status)
                          ? 'ready'
                          : selectedOrder.status;
                      const updated = { ...selectedOrder, status: nextStatus };
                      await onUpdateOrder(updated);
                      setSelectedOrder(updated);
                      showToast(
                        nextStatus === 'ready'
                          ? 'تم حفظ رابط التسليم وتعيين الحالة إلى (جاهز للتسليم)'
                          : 'تم حفظ رابط التسليم بنجاح',
                        'success'
                      );
                    }}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                  >
                    حفظ الرابط
                  </button>
                </div>
              </div>

              {/* Next-Order Special Coupon Full Control Box */}
              {(() => {
                const linkedCoupon = selectedOrder.nextOrderCouponId
                  ? coupons.find((c) => c.id === selectedOrder.nextOrderCouponId)
                  : coupons.find((c) => c.code === selectedOrder.nextOrderCouponCode);
                const isCouponActiveOnOrder = Boolean(
                  selectedOrder.nextOrderCouponCode &&
                    selectedOrder.nextOrderCouponEnabled !== false &&
                    linkedCoupon &&
                    !isCouponExhausted(linkedCoupon)
                );

                return (
                  <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-purple-900">
                        <Gift className="w-4 h-4 text-purple-700" />
                        <span className="text-xs font-extrabold">
                          كوبون خصم خاص للطلب القادم (تحكم كامل)
                        </span>
                      </div>
                      {selectedOrder.nextOrderCouponCode && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isCouponActiveOnOrder
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isCouponActiveOnOrder
                            ? 'مُفعّل ويظهر للعميل'
                            : linkedCoupon && isCouponExhausted(linkedCoupon)
                            ? 'منتهي الصلاحية أو العدد'
                            : 'موقوف ومخفي عن العميل'}
                        </span>
                      )}
                    </div>

                    {selectedOrder.nextOrderCouponCode ? (
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-purple-200">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-sm text-purple-800">
                              {selectedOrder.nextOrderCouponCode}
                            </span>
                            {linkedCoupon && (
                              <>
                                <span className="text-xs font-bold text-emerald-700">
                                  (خصم{' '}
                                  {linkedCoupon.type === 'percent'
                                    ? `${linkedCoupon.value}%`
                                    : `${linkedCoupon.value} ${settings.currency}`}
                                  )
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  • {formatCouponLimitsAr(linkedCoupon)}
                                </span>
                              </>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(selectedOrder.nextOrderCouponCode);
                              showToast('تم نسخ الكوبون الخاص', 'success');
                            }}
                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700"
                            title="نسخ الكود"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const nextEnabled = !isCouponActiveOnOrder;
                              await onToggleNextOrderCoupon(selectedOrder, nextEnabled);
                              setSelectedOrder({
                                ...selectedOrder,
                                nextOrderCouponEnabled: nextEnabled
                              });
                              showToast(
                                nextEnabled
                                  ? 'تم تفعيل الكوبون وإظهاره للعميل'
                                  : 'تم إيقاف الكوبون وإخفاؤه عن العميل',
                                'info'
                              );
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                              isCouponActiveOnOrder
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                            }`}
                          >
                            {isCouponActiveOnOrder
                              ? 'إيقاف وإخفاء الكوبون مؤقتًا'
                              : 'تفعيل وإظهار الكوبون للعميل'}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await onRemoveNextOrderCoupon(selectedOrder);
                              setSelectedOrder({
                                ...selectedOrder,
                                nextOrderCouponId: '',
                                nextOrderCouponCode: '',
                                nextOrderCouponEnabled: false
                              });
                              showToast('تم حذف كوبون الطلب القادم نهائيًا', 'success');
                            }}
                            className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف الكوبون</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <p className="text-[11px] text-purple-800">
                          أنشئ كود خصم سري مخصص لهذا المعلم فقط لطلبه القادم (يمكنك تحديد عدد المرات ومدة الصلاحية بالأيام أو تركها 0 بلا حدود):
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-purple-900 mb-0.5">
                              النوع
                            </label>
                            <select
                              value={nextCpType}
                              onChange={(e) => setNextCpType(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold"
                            >
                              <option value="percent">نسبة %</option>
                              <option value="fixed">مبلغ ({settings.currency})</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-purple-900 mb-0.5">
                              القيمة
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={nextCpValue}
                              onChange={(e) => setNextCpValue(Number(e.target.value))}
                              className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-purple-900 mb-0.5">
                              المرات (0=بلا حدود)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={nextCpMaxUses}
                              onChange={(e) =>
                                setNextCpMaxUses(Math.max(0, Number(e.target.value) || 0))
                              }
                              className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-purple-900 mb-0.5">
                              الأيام (0=بلا حدود)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={nextCpValidDays}
                              onChange={(e) =>
                                setNextCpValidDays(Math.max(0, Number(e.target.value) || 0))
                              }
                              className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const createdCp = await onIssueNextOrderCoupon(selectedOrder, {
                              type: nextCpType,
                              value: Number(nextCpValue) || 15,
                              maxUses: Math.max(0, Number(nextCpMaxUses) || 0),
                              validDays: Math.max(0, Number(nextCpValidDays) || 0)
                            });
                            if (createdCp) {
                              setSelectedOrder({
                                ...selectedOrder,
                                nextOrderCouponId: createdCp.id,
                                nextOrderCouponCode: createdCp.code,
                                nextOrderCouponEnabled: true
                              });
                              showToast(
                                `تم إنشاء كوبون خاص (${createdCp.code}) للطلب القادم`,
                                'success'
                              );
                            }
                          }}
                          className="w-full px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold"
                        >
                          + إصدار كوبون خاص الآن
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ملاحظات إدارية (خاصة بالإدارة فقط)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ملاحظة داخلية..."
                    value={selectedOrder.adminNotes || ''}
                    onChange={(e) =>
                      setSelectedOrder({ ...selectedOrder, adminNotes: e.target.value })
                    }
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await onUpdateOrder(selectedOrder);
                      showToast('تم حفظ الملاحظة الإدارية', 'success');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
                  >
                    حفظ
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                {(() => {
                  const linkedCp = selectedOrder.nextOrderCouponId
                    ? coupons.find((c) => c.id === selectedOrder.nextOrderCouponId)
                    : coupons.find((c) => c.code === selectedOrder.nextOrderCouponCode);
                  const hasValidNextCoupon =
                    selectedOrder.nextOrderCouponCode &&
                    selectedOrder.nextOrderCouponEnabled !== false &&
                    linkedCp &&
                    !isCouponExhausted(linkedCp);

                  const couponLine = hasValidNextCoupon
                    ? `\n🎁 هدية خاصة لطلبك القادم: استخدم الكود (${
                        selectedOrder.nextOrderCouponCode
                      }) للحصول على خصم ${
                        linkedCp.type === 'percent'
                          ? `${linkedCp.value}%`
                          : `${linkedCp.value} ${settings.currency}`
                      } (${formatCouponLimitsAr(linkedCp)})!`
                    : '';

                  return (
                    <a
                      href={buildWhatsAppUrl(
                        selectedOrder.phone,
                        `مرحبًا أستاذ/ة ${selectedOrder.teacherName}،\nبخصوص طلبكم رقم (${
                          selectedOrder.orderNumber
                        }) من ${settings.siteName}:\n${
                          selectedOrder.deliveryUrl
                            ? `تم تجهيز مذكرتكم الخاصة (${selectedOrder.customNotebookTitle}) ويمكنكم تحميلها مباشرة من الرابط التالي:\n${selectedOrder.deliveryUrl}`
                            : `تم استلام طلبكم (${selectedOrder.customNotebookTitle}) وجارٍ العمل على تجهيزه.`
                        }${couponLine}`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>مراسلة المعلم عبر واتساب</span>
                    </a>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-black text-base text-slate-900">{confirmDialog.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  const fn = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await fn();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   7. MAIN APPLICATION CONTAINER (PUBLIC STOREFRONT + FIREBASE SYNC)
   ============================================================================ */
export default function App() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [stages, setStages] = useState(DEFAULT_STAGES);
  const [grades, setGrades] = useState(DEFAULT_GRADES);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [notebooks, setNotebooks] = useState(DEFAULT_NOTEBOOKS);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState(DEFAULT_COUPONS);
  const [bundles, setBundles] = useState(DEFAULT_BUNDLES);
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [adminMeta, setAdminMeta] = useState(null);

  // Navigation & Filters State
  const [page, setPage] = useState('home'); // home | browse | details | offers | track | contact | admin
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotebookId, setSelectedNotebookId] = useState('');

  // Order Modal State
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderTargetNotebook, setOrderTargetNotebook] = useState(null);
  const [orderInitialItems, setOrderInitialItems] = useState(null);
  const [orderInitialCoupon, setOrderInitialCoupon] = useState('');

  // Track Order State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResults, setTrackResults] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Load localStorage fallback immediately
  useEffect(() => {
    try {
      const ls = (k) => JSON.parse(localStorage.getItem(`mz_${k}`) || 'null');
      if (ls('settings')) setSettings({ ...DEFAULT_SETTINGS, ...ls('settings') });
      if (ls('categories')) setCategories(ls('categories'));
      if (ls('stages')) setStages(ls('stages'));
      if (ls('grades')) setGrades(ls('grades'));
      if (ls('subjects')) setSubjects(ls('subjects'));
      if (ls('notebooks')) setNotebooks(ls('notebooks'));
      if (ls('orders')) setOrders(ls('orders'));
      if (ls('coupons')) setCoupons(ls('coupons'));
      if (ls('bundles')) setBundles(ls('bundles'));
      if (ls('reviews')) setReviews(ls('reviews'));
      if (ls('adminMeta')) setAdminMeta(ls('adminMeta'));
    } catch {
      // ignore
    }
  }, []);

  // Firebase Auth & Real-time Listeners
  useEffect(() => {
    if (!firebaseEnabled || !auth) return;
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else signInAnonymously(auth).catch(() => {});
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!firebaseEnabled || !db || !user) return;
    const baseCol = (colName) =>
      collection(db, 'artifacts', appId, 'public', 'data', colName);

    const handleSnapErr = (err) => {
      if (err?.code === 'permission-denied') {
        firebaseEnabled = false;
      }
      console.warn('Firestore listener fallback to localStorage:', err?.code || err);
    };

    const unsubs = [
      onSnapshot(
        doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'settings'),
        (snap) => {
          if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
        },
        handleSnapErr
      ),
      onSnapshot(
        doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'admin'),
        (snap) => {
          if (snap.exists()) setAdminMeta(snap.data());
        },
        handleSnapErr
      ),
      onSnapshot(
        baseCol('categories'),
        (snap) => {
          if (!snap.empty) setCategories(snap.docs.map((d) => d.data()));
        },
        handleSnapErr
      ),
      onSnapshot(
        baseCol('stages'),
        (snap) => {
          if (!snap.empty) setStages(snap.docs.map((d) => d.data()));
        },
        handleSnapErr
      ),
      onSnapshot(
        baseCol('grades'),
        (snap) => {
          if (!snap.empty) setGrades(snap.docs.map((d) => d.data()));
        },
        handleSnapErr
      ),
      onSnapshot(
        baseCol('subjects'),
        (snap) => {
          if (!snap.empty) setSubjects(snap.docs.map((d) => d.data()));
        },
        handleSnapErr
      ),
      onSnapshot(
        baseCol('notebooks'),
        (snap) => {
          if (!snap.empty) setNotebooks(snap.docs.map((d) => d.data()));
        },
        handleSnapErr
      ),
      onSnapshot(
        baseCol('orders'),
        (snap) => {
          setOrders(snap.docs.map((d) => d.data()));
        },
        handleSnapErr
      ),
      onSnapshot(
        baseCol('coupons'),
        (snap) => {
          if (!snap.empty) setCoupons(snap.docs.map((d) => d.data()));
        },
        handleSnapErr
      ),
      onSnapshot(
        baseCol('bundles'),
        (snap) => {
          if (!snap.empty) setBundles(snap.docs.map((d) => d.data()));
        },
        handleSnapErr
      ),
      onSnapshot(
        baseCol('reviews'),
        (snap) => {
          if (!snap.empty) setReviews(snap.docs.map((d) => d.data()));
        },
        handleSnapErr
      )
    ];
    return () => unsubs.forEach((u) => u());
  }, [user]);

  // Persistence Handlers (sync to both localStorage & Firestore with safe fallback)
  const persistLocal = (key, data) => {
    try {
      localStorage.setItem(`mz_${key}`, JSON.stringify(data));
    } catch {
      // ignore quota limits
    }
  };

  const getDocRef = (colName, id) =>
    doc(db, 'artifacts', appId, 'public', 'data', colName, id);

  const safeCloudSet = async (ref, data) => {
    if (!firebaseEnabled || !db) return;
    try {
      await setDoc(ref, data);
    } catch (err) {
      if (err?.code === 'permission-denied') firebaseEnabled = false;
      console.warn('Firestore write fallback to localStorage:', err?.code || err);
    }
  };

  const safeCloudDelete = async (ref) => {
    if (!firebaseEnabled || !db) return;
    try {
      await deleteDoc(ref);
    } catch (err) {
      if (err?.code === 'permission-denied') firebaseEnabled = false;
      console.warn('Firestore delete fallback to localStorage:', err?.code || err);
    }
  };

  const handleSaveSettings = async (nextSettings) => {
    setSettings(nextSettings);
    persistLocal('settings', nextSettings);
    await safeCloudSet(
      doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'settings'),
      nextSettings
    );
  };

  const handleRestoreBackup = async (backup) => {
    if (backup.settings) {
      const merged = { ...DEFAULT_SETTINGS, ...backup.settings };
      await handleSaveSettings(merged);
    }
    const collectionsToRestore = [
      ['categories', setCategories],
      ['stages', setStages],
      ['grades', setGrades],
      ['subjects', setSubjects],
      ['notebooks', setNotebooks],
      ['orders', setOrders],
      ['coupons', setCoupons],
      ['bundles', setBundles],
      ['reviews', setReviews]
    ];
    for (const [key, setter] of collectionsToRestore) {
      if (Array.isArray(backup[key])) {
        setter(backup[key]);
        persistLocal(key, backup[key]);
        if (firebaseEnabled && db) {
          for (const item of backup[key]) {
            if (item?.id) {
              await safeCloudSet(getDocRef(key, item.id), item);
            }
          }
        }
      }
    }
  };

  const handleUpdateAdminPassword = async (metaObj) => {
    setAdminMeta(metaObj);
    persistLocal('adminMeta', metaObj);
    await safeCloudSet(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'admin'), metaObj);
  };

  const handleSaveNotebook = async (nbObj) => {
    const updated = notebooks.some((n) => n.id === nbObj.id)
      ? notebooks.map((n) => (n.id === nbObj.id ? nbObj : n))
      : [nbObj, ...notebooks];
    setNotebooks(updated);
    persistLocal('notebooks', updated);
    await safeCloudSet(getDocRef('notebooks', nbObj.id), nbObj);
  };

  const handleDeleteNotebook = async (id) => {
    const updated = notebooks.filter((n) => n.id !== id);
    setNotebooks(updated);
    persistLocal('notebooks', updated);
    await safeCloudDelete(getDocRef('notebooks', id));
  };

  const handleSubmitOrder = async (orderObj, usedCouponId = '') => {
    const updated = [orderObj, ...orders];
    setOrders(updated);
    persistLocal('orders', updated);
    await safeCloudSet(getDocRef('orders', orderObj.id), orderObj);
    // Increment coupon usage count and auto-deactivate if maxUses reached
    if (usedCouponId) {
      const targetCp = coupons.find((c) => c.id === usedCouponId);
      if (targetCp) {
        const nextUsedCount = (Number(targetCp.usedCount) || 0) + 1;
        const maxUses = Number(targetCp.maxUses) || 0;
        const reachedLimit = maxUses > 0 && nextUsedCount >= maxUses;
        const updatedCp = {
          ...targetCp,
          usedCount: nextUsedCount,
          active: reachedLimit ? false : targetCp.active !== false
        };
        const updatedCoupons = coupons.map((c) => (c.id === usedCouponId ? updatedCp : c));
        setCoupons(updatedCoupons);
        persistLocal('coupons', updatedCoupons);
        await safeCloudSet(getDocRef('coupons', usedCouponId), updatedCp);
      }
    }
  };

  const handleUpdateOrder = async (orderObj) => {
    const updated = orders.map((o) => (o.id === orderObj.id ? orderObj : o));
    setOrders(updated);
    persistLocal('orders', updated);
    await safeCloudSet(getDocRef('orders', orderObj.id), orderObj);
  };

  const handleSaveStructureItem = async (type, item) => {
    const map = {
      categories: [categories, setCategories],
      stages: [stages, setStages],
      grades: [grades, setGrades],
      subjects: [subjects, setSubjects]
    };
    const [list, setter] = map[type];
    const updated = list.some((i) => i.id === item.id)
      ? list.map((i) => (i.id === item.id ? item : i))
      : [...list, item];
    setter(updated);
    persistLocal(type, updated);
    await safeCloudSet(getDocRef(type, item.id), item);
  };

  const handleDeleteStructureItem = async (type, id) => {
    const map = {
      categories: [categories, setCategories],
      stages: [stages, setStages],
      grades: [grades, setGrades],
      subjects: [subjects, setSubjects]
    };
    const [list, setter] = map[type];
    const updated = list.filter((i) => i.id !== id);
    setter(updated);
    persistLocal(type, updated);
    await safeCloudDelete(getDocRef(type, id));
  };

  const handleSaveCoupon = async (cpObj) => {
    const updated = coupons.some((c) => c.id === cpObj.id)
      ? coupons.map((c) => (c.id === cpObj.id ? cpObj : c))
      : [cpObj, ...coupons];
    setCoupons(updated);
    persistLocal('coupons', updated);
    await safeCloudSet(getDocRef('coupons', cpObj.id), cpObj);
  };

  const handleDeleteCoupon = async (id) => {
    const updated = coupons.filter((c) => c.id !== id);
    setCoupons(updated);
    persistLocal('coupons', updated);
    await safeCloudDelete(getDocRef('coupons', id));
  };

  const handleIssueNextOrderCoupon = async (
    orderObj,
    { type = 'percent', value = 15, maxUses = 1, validDays = 30 } = {}
  ) => {
    const randSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `NEXT-${randSuffix}`;
    let expiresAt = '';
    if (Number(validDays) > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + Number(validDays));
      expiresAt = expDate.toISOString().slice(0, 10);
    }
    const newCp = {
      id: `cp_next_${Date.now()}`,
      code,
      type,
      value: Number(value) || 15,
      minOrder: 0,
      description: `كوبون خاص للطلب القادم (طلب #${orderObj.orderNumber})`,
      active: true,
      isPrivate: true,
      maxUses: Math.max(0, Number(maxUses) || 0),
      usedCount: 0,
      expiresAt,
      forOrderId: orderObj.id
    };
    await handleSaveCoupon(newCp);
    const updatedOrder = {
      ...orderObj,
      nextOrderCouponId: newCp.id,
      nextOrderCouponCode: newCp.code,
      nextOrderCouponEnabled: true
    };
    await handleUpdateOrder(updatedOrder);
    return newCp;
  };

  const handleToggleNextOrderCoupon = async (orderObj, enabled) => {
    const linkedCp = orderObj.nextOrderCouponId
      ? coupons.find((c) => c.id === orderObj.nextOrderCouponId)
      : coupons.find((c) => c.code === orderObj.nextOrderCouponCode);
    if (linkedCp) {
      await handleSaveCoupon({ ...linkedCp, active: Boolean(enabled) });
    }
    await handleUpdateOrder({ ...orderObj, nextOrderCouponEnabled: Boolean(enabled) });
  };

  const handleRemoveNextOrderCoupon = async (orderObj) => {
    const linkedCp = orderObj.nextOrderCouponId
      ? coupons.find((c) => c.id === orderObj.nextOrderCouponId)
      : coupons.find((c) => c.code === orderObj.nextOrderCouponCode);
    if (linkedCp) {
      await handleDeleteCoupon(linkedCp.id);
    }
    await handleUpdateOrder({
      ...orderObj,
      nextOrderCouponId: '',
      nextOrderCouponCode: '',
      nextOrderCouponEnabled: false
    });
  };

  const handleSaveBundle = async (bndObj) => {
    const updated = bundles.some((b) => b.id === bndObj.id)
      ? bundles.map((b) => (b.id === bndObj.id ? bndObj : b))
      : [bndObj, ...bundles];
    setBundles(updated);
    persistLocal('bundles', updated);
    await safeCloudSet(getDocRef('bundles', bndObj.id), bndObj);
  };

  const handleDeleteBundle = async (id) => {
    const updated = bundles.filter((b) => b.id !== id);
    setBundles(updated);
    persistLocal('bundles', updated);
    await safeCloudDelete(getDocRef('bundles', id));
  };

  const handleSaveReview = async (revObj) => {
    const updated = reviews.some((r) => r.id === revObj.id)
      ? reviews.map((r) => (r.id === revObj.id ? revObj : r))
      : [revObj, ...reviews];
    setReviews(updated);
    persistLocal('reviews', updated);
    await safeCloudSet(getDocRef('reviews', revObj.id), revObj);
  };

  const handleDeleteReview = async (id) => {
    const updated = reviews.filter((r) => r.id !== id);
    setReviews(updated);
    persistLocal('reviews', updated);
    await safeCloudDelete(getDocRef('reviews', id));
  };

  // Lookup Helpers
  const lookUp = useMemo(
    () => ({
      categoryName: (id) => categories.find((c) => c.id === id)?.name || '',
      stageName: (id) => stages.find((s) => s.id === id)?.name || '',
      gradeName: (id) => grades.find((g) => g.id === id)?.name || '',
      subjectName: (id) => subjects.find((s) => s.id === id)?.name || ''
    }),
    [categories, stages, grades, subjects]
  );

  // Visible subjects only (hidden subjects are excluded from public storefront)
  const visibleSubjects = useMemo(
    () => subjects.filter((s) => s.visible !== false),
    [subjects]
  );
  const hiddenSubjectIds = useMemo(
    () => new Set(subjects.filter((s) => s.visible === false).map((s) => s.id)),
    [subjects]
  );

  // Published Notebooks & Filtered Results
  const publishedNotebooks = useMemo(
    () => notebooks.filter((n) => n.published !== false && !hiddenSubjectIds.has(n.subjectId)),
    [notebooks, hiddenSubjectIds]
  );

  const activeCoupons = useMemo(
    () => coupons.filter((c) => !isCouponExhausted(c) && !c.isPrivate),
    [coupons]
  );
  const activeBundles = useMemo(() => bundles.filter((b) => b.active !== false), [bundles]);
  const activeReviews = useMemo(() => reviews.filter((r) => r.active !== false), [reviews]);
  const discountedNotebooks = useMemo(
    () =>
      publishedNotebooks.filter(
        (nb) => Number(nb.oldPrice) > Number(nb.price) || nb.badge === 'عرض خاص'
      ),
    [publishedNotebooks]
  );

  const filteredNotebooks = useMemo(() => {
    return publishedNotebooks.filter((nb) => {
      if (selectedCategory && nb.categoryId !== selectedCategory) return false;
      if (selectedStage && nb.stageId !== selectedStage) return false;
      if (selectedGrade && nb.gradeId !== selectedGrade) return false;
      if (selectedSubject && nb.subjectId !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          nb.title.toLowerCase().includes(q) ||
          nb.shortDesc?.toLowerCase().includes(q) ||
          lookUp.subjectName(nb.subjectId).toLowerCase().includes(q) ||
          lookUp.gradeName(nb.gradeId).toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    publishedNotebooks,
    selectedCategory,
    selectedStage,
    selectedGrade,
    selectedSubject,
    searchQuery,
    lookUp
  ]);

  const selectedNotebook = useMemo(
    () => notebooks.find((n) => n.id === selectedNotebookId) || null,
    [notebooks, selectedNotebookId]
  );

  const openCategoryBrowse = (catId) => {
    setSelectedCategory(catId);
    setSelectedStage('');
    setSelectedGrade('');
    setSelectedSubject('');
    setPage('browse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openNotebookDetails = (nb) => {
    setSelectedNotebookId(nb.id);
    setPage('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openOrderFor = (nb, initialItems = null, couponCode = '') => {
    setOrderTargetNotebook(nb);
    setOrderInitialItems(initialItems);
    setOrderInitialCoupon(couponCode);
    setOrderModalOpen(true);
  };

  const handleTrackSearch = (e) => {
    e.preventDefault();
    const q = trackQuery.trim().replace(/[\s\-()]/g, '');
    if (!q) return showToast('يرجى إدخال رقم الطلب أو رقم الهاتف', 'error');
    const matches = orders.filter(
      (o) =>
        o.orderNumber?.toLowerCase() === q.toLowerCase() ||
        o.phone?.replace(/[\s\-()]/g, '').includes(q)
    );
    setTrackResults(matches);
  };

  /* -------------------- RENDER ADMIN VIEW -------------------- */
  if (page === 'admin') {
    return (
      <div dir="rtl" className="font-sans text-slate-900">
        <AdminDashboard
          settings={settings}
          categories={categories}
          stages={stages}
          grades={grades}
          subjects={subjects}
          notebooks={notebooks}
          orders={orders}
          coupons={coupons}
          bundles={bundles}
          reviews={reviews}
          adminMeta={adminMeta}
          lookUp={lookUp}
          onSaveSettings={handleSaveSettings}
          onRestoreBackup={handleRestoreBackup}
          onSaveNotebook={handleSaveNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          onUpdateOrder={handleUpdateOrder}
          onSaveStructureItem={handleSaveStructureItem}
          onDeleteStructureItem={handleDeleteStructureItem}
          onSaveCoupon={handleSaveCoupon}
          onDeleteCoupon={handleDeleteCoupon}
          onSaveBundle={handleSaveBundle}
          onDeleteBundle={handleDeleteBundle}
          onSaveReview={handleSaveReview}
          onDeleteReview={handleDeleteReview}
          onUpdateAdminPassword={handleUpdateAdminPassword}
          onIssueNextOrderCoupon={handleIssueNextOrderCoupon}
          onToggleNextOrderCoupon={handleToggleNextOrderCoupon}
          onRemoveNextOrderCoupon={handleRemoveNextOrderCoupon}
          onExitAdmin={() => setPage('home')}
          showToast={showToast}
        />
        {toast && (
          <div className="fixed bottom-5 left-5 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-2xl border border-slate-700">
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  /* -------------------- RENDER MAINTENANCE MODE -------------------- */
  if (settings.maintenanceMode) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-3xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
          <Settings className="w-10 h-10 animate-spin" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">{settings.siteName}</h1>
        <p className="text-slate-300 max-w-md text-sm leading-relaxed">
          نقوم حاليًا بتحديث المذكرات وإضافة إصدارات جديدة للمعلمين. سنعود للعمل خلال دقائق قليلة.
        </p>
        <button
          type="button"
          onClick={() => setPage('admin')}
          className="text-xs text-slate-500 hover:text-slate-300 underline"
        >
          دخول الإدارة
        </button>
      </div>
    );
  }

  /* -------------------- RENDER PUBLIC STOREFRONT -------------------- */
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Announcement Bar */}
      {settings.announcementBar?.enabled && settings.announcementBar?.text && (
        <div
          style={{
            backgroundColor: settings.announcementBar.bgColor || '#0f172a',
            color: settings.announcementBar.textColor || '#ffffff'
          }}
          className="px-4 py-2 text-center text-xs sm:text-sm font-bold flex flex-wrap items-center justify-center gap-2"
        >
          <span>{settings.announcementBar.text}</span>
          <button
            type="button"
            onClick={() => setPage('offers')}
            className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black hover:bg-amber-300 transition"
          >
            استفد من العرض ←
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 min-h-[100px] flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <button
            type="button"
            onClick={() => setPage('home')}
            className="flex items-center gap-3.5 sm:gap-4 text-right group"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.siteName}
                className={`${
                  settings.logoSize === 'xl'
                    ? 'w-20 h-20 sm:w-24 sm:h-24'
                    : settings.logoSize === 'md'
                    ? 'w-14 h-14'
                    : 'w-16 h-16 sm:w-20 sm:h-20'
                } rounded-2xl object-contain bg-white p-1.5 border border-slate-200 shadow-sm shrink-0 transition-transform group-hover:scale-105`}
              />
            ) : (
              <div
                style={{
                  background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`
                }}
                className={`${
                  settings.logoSize === 'xl'
                    ? 'w-16 h-16 sm:w-20 sm:h-20'
                    : 'w-14 h-14 sm:w-16 sm:h-16'
                } rounded-2xl text-white flex items-center justify-center shadow-lg shrink-0`}
              >
                <BookOpen className="w-8 h-8" />
              </div>
            )}
            <div>
              <span className="font-black text-xl sm:text-2xl lg:text-[26px] text-slate-900 block leading-tight tracking-tight">
                {settings.siteName}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-500 block mt-0.5">
                {settings.tagline || 'خدمات تجهيز وتصميم المذكرات للمعلمين'}
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-bold text-slate-700">
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
                  if (nav.id === 'browse') openCategoryBrowse('');
                  else setPage(nav.id);
                }}
                className={`px-3.5 py-2 rounded-xl transition ${
                  page === nav.id
                    ? 'bg-blue-50 text-blue-700 font-extrabold'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {nav.label}
              </button>
            ))}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {settings.whatsappNumber && (
              <a
                href={buildWhatsAppUrl(
                  settings.whatsappNumber,
                  `مرحبًا، أود الاستفسار عن المذكرات المتاحة في ${settings.siteName}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>واتساب</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setPage('admin')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm transition"
            >
              <Shield className="w-4 h-4 text-teal-400" />
              <span>لوحة التحكم</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="القائمة"
              className="lg:hidden p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1.5 shadow-lg">
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
                  if (nav.id === 'browse') openCategoryBrowse('');
                  else setPage(nav.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold block ${
                  page === nav.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {nav.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {page === 'home' && (
          <div className="space-y-14 pb-16">
            {/* HERO SECTION */}
            <section
              style={
                settings.heroBgImage
                  ? {
                      backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.86) 0%, rgba(15, 23, 42, 0.72) 100%), url("${settings.heroBgImage}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }
                  : {
                      background: `linear-gradient(135deg, ${settings.primaryColor} 0%, #0f172a 100%)`
                    }
              }
              className="relative overflow-hidden text-white py-14 sm:py-20"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold text-amber-300">
                    <Sparkles className="w-4 h-4" />
                    <span>مذكرات منسقة وجاهزة للطباعة باسمك وشعارك الخاص</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
                    {settings.heroTitle}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    {settings.heroSubtitle}
                  </p>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => openCategoryBrowse('')}
                      className="px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-xl flex items-center gap-2 transition"
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>استعرض المذكرات المتاحة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openOrderFor(null)}
                      className="px-7 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-extrabold text-sm backdrop-blur-xs border border-white/20 flex items-center gap-2 transition"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>اطلب مذكرة خاصة</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/15 pb-3">
                      <span className="font-extrabold text-sm">لماذا يثق بنا المعلمون؟</span>
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

            {/* ABOUT PLATFORM SECTION (تعريف بالمنصة) */}
            {settings.showAbout !== false && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="bg-white rounded-3xl p-7 sm:p-10 border border-slate-200/80 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold">
                      <BookOpen className="w-4 h-4" />
                      <span>تعرف على منصتنا</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
                      {settings.aboutTitle || 'لماذا يختار المعلمون منصة مذكرتي التعليمية؟'}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {settings.aboutDescription}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => openCategoryBrowse('')}
                        className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-extrabold shadow transition"
                      >
                        تصفح أحدث المذكرات المتاحة
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage('contact')}
                        className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-extrabold transition"
                      >
                        تواصل معنا
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {[
                      {
                        icon: Award,
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
                        desc: 'تجهيز وتسليم نسخة PDF عالية الدقة جاهزة للطباعة خلال 24 ساعة.'
                      },
                      {
                        icon: Eye,
                        title: 'معاينة قبل الطلب',
                        desc: 'اطّلع على عينات حقيقية من صفحات المذكرة قبل تأكيد طلبك.'
                      }
                    ].map((feat, i) => {
                      const FIcon = feat.icon;
                      return (
                        <div
                          key={i}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                        >
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                            <FIcon className="w-5 h-5" />
                          </div>
                          <h3 className="font-extrabold text-sm text-slate-900">{feat.title}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* 3 MAIN CATEGORIES SECTION */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  اختر القسم الدراسي
                </h2>
                <p className="text-sm text-slate-500">
                  ابدأ باختيار القسم ثم المرحلة التعليمية والمادة الدراسية
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => openCategoryBrowse(cat.id)}
                    className={`text-right rounded-3xl p-7 text-white bg-gradient-to-br ${
                      cat.gradient || 'from-blue-600 to-indigo-700'
                    } shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[190px]`}
                  >
                    <div className="space-y-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
                        {publishedNotebooks.filter((n) => n.categoryId === cat.id).length} مذكرة متاحة
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black">{cat.name}</h3>
                      <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <div className="pt-4 flex items-center gap-1.5 text-xs font-extrabold text-amber-200">
                      <span>تصفح المراحل والمواد</span>
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* FEATURED / NEW NOTEBOOKS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>إصدارات حديثة ومحدثة</span>
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                    ما الجديد المتاح من المذكرات
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    معاينة مجانية قبل الطلب وتسليم فوري ببياناتك الكاملة
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openCategoryBrowse('')}
                  className="text-sm font-extrabold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <span>عرض كل المذكرات</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {publishedNotebooks.slice(0, 4).map((nb) => {
                  const discountPct = calcDiscountPercent(nb.price, nb.oldPrice);
                  return (
                    <div
                      key={nb.id}
                      className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition flex flex-col justify-between"
                    >
                      <div>
                        <div
                          onClick={() => openNotebookDetails(nb)}
                          className="cursor-pointer"
                        >
                          <NotebookCoverArt
                            notebook={nb}
                            stageName={lookUp.stageName(nb.stageId)}
                            subjectName={lookUp.subjectName(nb.subjectId)}
                          />
                        </div>
                        <div className="p-5 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span>{lookUp.gradeName(nb.gradeId)}</span>
                            <span>{nb.pageCount} صفحة</span>
                          </div>
                          <h3
                            onClick={() => openNotebookDetails(nb)}
                            className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2 cursor-pointer group-hover:text-blue-700 transition"
                          >
                            {nb.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {nb.shortDesc}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 space-y-3">
                        <div className="flex flex-wrap items-baseline gap-2 pt-2 border-t border-slate-100">
                          <span className="text-lg font-black text-blue-700">
                            {nb.price} {settings.currency}
                          </span>
                          {Number(nb.oldPrice) > Number(nb.price) && (
                            <span className="text-xs text-slate-400">
                              بدلًا من <span className="line-through">{nb.oldPrice}</span>
                            </span>
                          )}
                          {discountPct > 0 && (
                            <span className="mr-auto px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-extrabold">
                              وفر {discountPct}%
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => openNotebookDetails(nb)}
                            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openOrderFor(nb)}
                            className="py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>اطلب الآن</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* CLIENT REVIEWS & WHATSAPP SCREENSHOTS SECTION */}
            {settings.showReviews !== false && activeReviews.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
                <div className="text-center space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold">
                    <Quote className="w-4 h-4" />
                    <span>تجارب حقيقية من معلمينا</span>
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                    آراء المعلمين وتقييماتهم عبر الواتساب
                  </h2>
                  <p className="text-sm text-slate-500 max-w-xl mx-auto">
                    نفخر بثقة مئات المعلمين في جميع المحافظات وجودة المذكرات التي نقدمها لهم.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition overflow-hidden flex flex-col justify-between"
                    >
                      {rev.screenshotUrl ? (
                        <div className="bg-slate-900/5 border-b border-slate-100 p-2">
                          <img
                            src={rev.screenshotUrl}
                            alt={rev.teacherName}
                            className="w-full max-h-80 object-contain rounded-2xl mx-auto"
                          />
                        </div>
                      ) : null}

                      <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                        {rev.quote && (
                          <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                            «{rev.quote}»
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div>
                            <div className="font-black text-sm text-slate-900">{rev.teacherName}</div>
                            {rev.subjectAndStage && (
                              <div className="text-xs text-blue-700 font-bold">
                                {rev.subjectAndStage}
                              </div>
                            )}
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold">
                            ★★★★★
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SPECIAL OFFERS & BUNDLES SECTION ON HOME */}
            {settings.showOffersOnHome !== false &&
              (activeBundles.length > 0 || activeCoupons.length > 0) && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                        العروض والباقات الموفرة
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        خصومات حصرية وأكواد توفير للمعلمين
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPage('offers')}
                      className="text-sm font-extrabold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <span>عرض جميع العروض والكوبونات</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>

                  {activeCoupons.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeCoupons.slice(0, 2).map((cp) => (
                        <div
                          key={cp.id}
                          className="bg-gradient-to-l from-blue-50 to-teal-50 border border-blue-200/80 rounded-3xl p-5 flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <span className="px-3 py-1 rounded-lg bg-blue-700 text-white font-mono font-black text-xs">
                              {cp.code}
                            </span>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 pt-1">
                              {cp.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(cp.code);
                              showToast(`تم نسخ الكود (${cp.code})`, 'success');
                            }}
                            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-800 shrink-0 flex items-center gap-1.5 shadow-xs"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الكود</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeBundles.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {activeBundles.slice(0, 2).map((bnd) => (
                        <div
                          key={bnd.id}
                          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2">
                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                              {bnd.badge}
                            </span>
                            <h3 className="text-lg font-black text-slate-900">{bnd.title}</h3>
                            <p className="text-xs text-slate-500">{bnd.subtitle}</p>
                            <ul className="space-y-1.5 pt-2 text-xs text-slate-700">
                              {(bnd.features || []).map((f, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                            <div>
                              <span className="text-xl font-black text-emerald-700">
                                {bnd.price} {settings.currency}
                              </span>
                              {bnd.oldPrice > bnd.price && (
                                <span className="text-xs text-slate-400 line-through mr-2">
                                  {bnd.oldPrice} {settings.currency}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                openOrderFor(null, [
                                  { id: bnd.id, title: bnd.title, price: Number(bnd.price) || 0 }
                                ])
                              }
                              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold"
                            >
                              اطلب الباقة الآن
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
          </div>
        )}

        {/* PAGE: BROWSE & HIERARCHICAL FILTERING */}
        {page === 'browse' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              <button
                type="button"
                onClick={() => setPage('home')}
                className="hover:text-blue-700"
              >
                الرئيسية
              </button>
              <ChevronLeft className="w-3.5 h-3.5" />
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedStage('');
                  setSelectedGrade('');
                  setSelectedSubject('');
                }}
                className={!selectedCategory ? 'text-blue-700 font-extrabold' : 'hover:text-blue-700'}
              >
                كل المذكرات
              </button>
              {selectedCategory && (
                <>
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="text-blue-700 font-extrabold">
                    {lookUp.categoryName(selectedCategory)}
                  </span>
                </>
              )}
              {selectedStage && (
                <>
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="text-blue-700 font-extrabold">
                    {lookUp.stageName(selectedStage)}
                  </span>
                </>
              )}
            </div>

            {/* Stage & Subject Quick Pills */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="ابحث باسم المذكرة، الصف الدراسي، أو المادة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold bg-white"
                >
                  <option value="">كل الأقسام</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedStage}
                  onChange={(e) => {
                    setSelectedStage(e.target.value);
                    setSelectedGrade('');
                  }}
                  className="px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold bg-white"
                >
                  <option value="">كل المراحل</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {selectedStage && (
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold bg-white"
                  >
                    <option value="">كل الصفوف</option>
                    {grades
                      .filter((g) => g.stageId === selectedStage)
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Visible Subjects Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-slate-500 ml-1">المادة:</span>
                <button
                  type="button"
                  onClick={() => setSelectedSubject('')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    !selectedSubject
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  الكل
                </button>
                {visibleSubjects.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubject(sub.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                      selectedSubject === sub.id
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            {filteredNotebooks.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="font-black text-lg text-slate-800">
                  لا توجد مذكرات مطابقة لخيارات البحث الحالية
                </h3>
                <p className="text-xs text-slate-500">
                  يمكنك تغيير الفلاتر أو طلب تجهيز مذكرة خاصة بمواصفاتك مباشرةً.
                </p>
                <button
                  type="button"
                  onClick={() => openOrderFor(null)}
                  className="px-6 py-3 rounded-2xl bg-blue-700 text-white text-xs font-extrabold"
                >
                  اطلب مذكرة خاصة الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredNotebooks.map((nb) => {
                  const discountPct = calcDiscountPercent(nb.price, nb.oldPrice);
                  return (
                    <div
                      key={nb.id}
                      className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition flex flex-col justify-between"
                    >
                      <div>
                        <div
                          onClick={() => openNotebookDetails(nb)}
                          className="cursor-pointer"
                        >
                          <NotebookCoverArt
                            notebook={nb}
                            stageName={lookUp.stageName(nb.stageId)}
                            subjectName={lookUp.subjectName(nb.subjectId)}
                          />
                        </div>
                        <div className="p-5 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span>{lookUp.gradeName(nb.gradeId)}</span>
                            <span>{nb.pageCount} صفحة</span>
                          </div>
                          <h3
                            onClick={() => openNotebookDetails(nb)}
                            className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2 cursor-pointer group-hover:text-blue-700 transition"
                          >
                            {nb.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2">{nb.shortDesc}</p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 space-y-3">
                        <div className="flex flex-wrap items-baseline gap-2 pt-2 border-t border-slate-100">
                          <span className="text-lg font-black text-blue-700">
                            {nb.price} {settings.currency}
                          </span>
                          {Number(nb.oldPrice) > Number(nb.price) && (
                            <span className="text-xs text-slate-400">
                              بدلًا من <span className="line-through">{nb.oldPrice}</span>
                            </span>
                          )}
                          {discountPct > 0 && (
                            <span className="mr-auto px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-extrabold">
                              وفر {discountPct}%
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => openNotebookDetails(nb)}
                            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openOrderFor(nb)}
                            className="py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold flex items-center justify-center gap-1"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>اطلب الآن</span>
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

        {/* PAGE: NOTEBOOK DETAILS & SAMPLE PREVIEW */}
        {page === 'details' && selectedNotebook && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
            <button
              type="button"
              onClick={() => setPage('browse')}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-blue-700"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى قائمة المذكرات</span>
            </button>

            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5">
                <NotebookCoverArt
                  notebook={selectedNotebook}
                  stageName={lookUp.stageName(selectedNotebook.stageId)}
                  subjectName={lookUp.subjectName(selectedNotebook.subjectId)}
                  className="h-72 sm:h-80 rounded-2xl shadow-lg"
                />
              </div>

              <div className="lg:col-span-7 space-y-5">
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                    {lookUp.categoryName(selectedNotebook.categoryId)}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700">
                    {lookUp.stageName(selectedNotebook.stageId)}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    {lookUp.gradeName(selectedNotebook.gradeId)}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800">
                    {lookUp.subjectName(selectedNotebook.subjectId)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
                  {selectedNotebook.title}
                </h1>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedNotebook.fullDesc || selectedNotebook.shortDesc}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block">التكلفة</span>
                    <strong className="text-lg font-black text-blue-700">
                      {selectedNotebook.price} {settings.currency}
                    </strong>
                    {Number(selectedNotebook.oldPrice) > Number(selectedNotebook.price) && (
                      <span className="block text-slate-400 line-through">
                        بدلًا من {selectedNotebook.oldPrice} {settings.currency}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block">عدد الصفحات</span>
                    <strong className="text-base font-black text-slate-900">
                      {selectedNotebook.pageCount} صفحة
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">صيغة التسليم</span>
                    <strong className="text-sm font-black text-emerald-700">
                      PDF جاهز للطباعة
                    </strong>
                  </div>
                </div>

                <ImportantNoticesBox settings={settings} />

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => openOrderFor(selectedNotebook)}
                    className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-gradient-to-l from-blue-700 to-teal-600 hover:opacity-95 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>اطلب تجهيز المذكرة باسمك الآن</span>
                  </button>
                  {selectedNotebook.drivePreviewUrl?.trim() && (
                    <a
                      href={normalizeExternalUrl(selectedNotebook.drivePreviewUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-extrabold text-sm flex items-center justify-center gap-2 transition"
                    >
                      <ExternalLink className="w-5 h-5 text-blue-700" />
                      <span>تصفح عينة أكبر على Google Drive</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Protected Sample Viewer */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-700" />
                  <h2 className="text-xl font-black text-slate-900">
                    معاينة عينة من المذكرة قبل الطلب
                  </h2>
                </div>
                {selectedNotebook.drivePreviewUrl?.trim() && (
                  <a
                    href={normalizeExternalUrl(selectedNotebook.drivePreviewUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs"
                  >
                    <span>فتح ملف العينة الموسّع (Google Drive)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <ProtectedPreviewer
                notebook={selectedNotebook}
                lookUp={lookUp}
                settings={settings}
              />
            </div>
          </div>
        )}

        {/* PAGE: OFFERS & BUNDLES */}
        {page === 'offers' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-slate-900">العروض، الكوبونات، والباقات</h1>
              <p className="text-sm text-slate-500">
                استفد من خصومات الكمية وأكواد التوفير الحصرية للمعلمين
              </p>
            </div>

            {settings.multiOrderDiscount?.enabled && (
              <div className="bg-gradient-to-l from-teal-700 to-blue-800 text-white rounded-3xl p-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="space-y-1 text-center md:text-right">
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                    خصم الكمية التلقائي
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black pt-1">
                    {settings.multiOrderDiscount.label}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => openOrderFor(null)}
                  className="px-6 py-3.5 rounded-2xl bg-white text-slate-900 font-black text-xs sm:text-sm shrink-0 shadow-lg"
                >
                  ابدأ طلبك المجمّع الآن
                </button>
              </div>
            )}

            {activeCoupons.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-900">أكواد الخصم المتاحة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeCoupons.map((cp) => (
                    <div
                      key={cp.id}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-800 font-mono font-black text-sm border border-blue-200">
                          {cp.code}
                        </span>
                        <span className="text-sm font-black text-emerald-700">
                          خصم{' '}
                          {cp.type === 'percent'
                            ? `${cp.value}%`
                            : `${cp.value} ${settings.currency}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{cp.description}</p>
                      <p className="text-[11px] text-slate-400 font-bold">
                        {formatCouponLimitsAr(cp)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(cp.code);
                          showToast(`تم نسخ الكود (${cp.code})`, 'success');
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ كود الخصم</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeBundles.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-900">الباقات المجمّعة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeBundles.map((bnd) => (
                    <div
                      key={bnd.id}
                      className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-2">
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                          {bnd.badge}
                        </span>
                        <h3 className="text-xl font-black text-slate-900">{bnd.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-500">{bnd.subtitle}</p>
                        <ul className="space-y-2 pt-3 text-xs sm:text-sm text-slate-700">
                          {(bnd.features || []).map((f, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-black text-emerald-700">
                            {bnd.price} {settings.currency}
                          </span>
                          {bnd.oldPrice > bnd.price && (
                            <span className="text-xs text-slate-400 line-through mr-2">
                              {bnd.oldPrice} {settings.currency}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            openOrderFor(null, [
                              { id: bnd.id, title: bnd.title, price: Number(bnd.price) || 0 }
                            ])
                          }
                          className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-black"
                        >
                          اطلب الباقة الآن
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {discountedNotebooks.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-900">مذكرات عليها خصم حالي</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {discountedNotebooks.map((nb) => (
                    <div
                      key={nb.id}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      <div onClick={() => openNotebookDetails(nb)} className="cursor-pointer">
                        <NotebookCoverArt
                          notebook={nb}
                          stageName={lookUp.stageName(nb.stageId)}
                          subjectName={lookUp.subjectName(nb.subjectId)}
                        />
                        <div className="p-4">
                          <h3 className="font-extrabold text-sm text-slate-900 line-clamp-2">
                            {nb.title}
                          </h3>
                        </div>
                      </div>
                      <div className="p-4 pt-0 space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="font-black text-blue-700">
                            {nb.price} {settings.currency}
                          </span>
                          {nb.oldPrice > nb.price && (
                            <span className="text-xs text-slate-400 line-through">
                              {nb.oldPrice}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => openOrderFor(nb)}
                          className="w-full py-2.5 rounded-xl bg-blue-700 text-white text-xs font-extrabold"
                        >
                          اطلب بالعرض الآن
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAGE: TRACK ORDER */}
        {page === 'track' && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-slate-900">تتبع حالة طلبك واستلام المذكرة</h1>
              <p className="text-sm text-slate-500">
                أدخل رقم الطلب (مثال: MZ-261125-1234) أو رقم هاتفك المسجل في الطلب
              </p>
            </div>

            <form
              onSubmit={handleTrackSearch}
              className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                placeholder="رقم الطلب أو رقم الهاتف..."
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-7 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black text-sm flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>بحث عن الطلب</span>
              </button>
            </form>

            {trackResults !== null && (
              <div className="space-y-4">
                {trackResults.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-sm text-slate-500">
                    لم يتم العثور على طلبات مطابقة. تأكد من رقم الطلب أو رقم الهاتف.
                  </div>
                ) : (
                  trackResults.map((ord) => {
                    const currentSt =
                      ORDER_STATUSES.find((s) => s.id === ord.status) || ORDER_STATUSES[0];
                    const linkedCp = ord.nextOrderCouponId
                      ? coupons.find((c) => c.id === ord.nextOrderCouponId)
                      : coupons.find((c) => c.code === ord.nextOrderCouponCode);
                    const showGiftCoupon = Boolean(
                      ord.nextOrderCouponCode &&
                        ord.nextOrderCouponEnabled !== false &&
                        linkedCp &&
                        !isCouponExhausted(linkedCp)
                    );

                    return (
                      <div
                        key={ord.id}
                        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                          <div>
                            <span className="text-xs text-slate-400 block">رقم الطلب</span>
                            <span className="font-mono font-black text-lg text-blue-700">
                              {ord.orderNumber}
                            </span>
                          </div>
                          <span
                            className={`px-4 py-1.5 rounded-full text-xs font-extrabold border ${currentSt.color}`}
                          >
                            {currentSt.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                          <div>
                            <span className="text-slate-500">اسم المعلم: </span>
                            <strong>{ord.teacherName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">المذكرة: </span>
                            <strong>{ord.customNotebookTitle}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">التكلفة: </span>
                            <strong className="text-emerald-700">
                              {ord.price ? `${ord.price} ${settings.currency}` : 'بالاتفاق'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500">تاريخ الطلب: </span>
                            <span>{new Date(ord.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>

                        {/* Payment Status & Receipt Upload in Track Order */}
                        {ord.status !== 'cancelled' && (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="space-y-1 text-right">
                              <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                                <Receipt className="w-4 h-4 text-blue-700" />
                                <span>
                                  حالة الدفع:{' '}
                                  {ord.paymentStatus === 'paid' ? (
                                    <span className="text-emerald-700">✓ تم تأكيد استلام الدفع</span>
                                  ) : ord.paymentReceiptUrl ? (
                                    <span className="text-amber-700">
                                      ⏳ تم رفع الإيصال (قيد المراجعة)
                                    </span>
                                  ) : (
                                    <span className="text-rose-700">
                                      بانتظار إرسال إيصال التحويل
                                    </span>
                                  )}
                                </span>
                              </div>
                              {settings.paymentInfo && ord.paymentStatus !== 'paid' && (
                                <p className="text-[11px] text-slate-600 whitespace-pre-line">
                                  {settings.paymentInfo}
                                </p>
                              )}
                            </div>
                            {ord.paymentStatus !== 'paid' && (
                              <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-xs">
                                <Upload className="w-3.5 h-3.5" />
                                <span>
                                  {ord.paymentReceiptUrl
                                    ? 'تحديث صورة الإيصال'
                                    : 'رفع صورة إيصال الدفع'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    try {
                                      const imgData = await compressImageFile(f, 900, 0.8);
                                      const updated = {
                                        ...ord,
                                        paymentReceiptUrl: imgData,
                                        paymentStatus: 'pending_review'
                                      };
                                      await handleUpdateOrder(updated);
                                      setTrackResults((prev) =>
                                        prev.map((item) => (item.id === ord.id ? updated : item))
                                      );
                                      showToast(
                                        'تم رفع صورة إيصال الدفع بنجاح وسيتم مراجعتها فورًا',
                                        'success'
                                      );
                                    } catch {
                                      showToast('تعذر رفع صورة الإيصال', 'error');
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        )}

                        {/* Conditional Delivery Box */}
                        {ord.deliveryUrl && ['ready', 'delivered'].includes(ord.status) ? (
                          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                              <h4 className="font-black text-emerald-900 text-sm">
                                مذكرتك جاهزة للتحميل الآن! 🎉
                              </h4>
                              <p className="text-xs text-emerald-700 mt-0.5">
                                تم تخصيص المذكرة ببياناتك الكاملة بصيغة PDF عالية الدقة.
                              </p>
                            </div>
                            <a
                              href={normalizeExternalUrl(ord.deliveryUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shrink-0"
                            >
                              <Download className="w-4 h-4" />
                              <span>تحميل مذكرتك PDF</span>
                            </a>
                          </div>
                        ) : (
                          ord.status !== 'cancelled' && (
                            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900">
                              سيظهر زر تحميل ملف PDF النهائي هنا فور الانتهاء من كتابة بياناتك وتخصيص المذكرة.
                            </div>
                          )
                        )}

                        {/* Next-Order Special Coupon Gift Box */}
                        {showGiftCoupon && (
                          <div className="p-5 rounded-2xl bg-gradient-to-l from-purple-50 to-indigo-50 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="space-y-1 text-right">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-700 text-white text-[10px] font-extrabold">
                                <Gift className="w-3 h-3" />
                                <span>هدية خاصة لطلبك القادم</span>
                              </span>
                              <p className="text-xs font-bold text-purple-950">
                                استخدم الكود{' '}
                                <span className="font-mono font-black bg-white px-2 py-0.5 rounded border border-purple-200">
                                  {ord.nextOrderCouponCode}
                                </span>{' '}
                                للحصول على خصم{' '}
                                {linkedCp.type === 'percent'
                                  ? `${linkedCp.value}%`
                                  : `${linkedCp.value} ${settings.currency}`}{' '}
                                ({formatCouponLimitsAr(linkedCp)})
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => openOrderFor(null, null, ord.nextOrderCouponCode)}
                              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold shrink-0"
                            >
                              استخدم الكوبون الآن
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* PAGE: CONTACT US */}
        {page === 'contact' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-slate-900">تواصل معنا</h1>
              <p className="text-sm text-slate-500">
                فريقنا جاهز للرد على جميع استفساراتك وتجهيز مذكراتك في أسرع وقت
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {settings.whatsappNumber && (
                <a
                  href={buildWhatsAppUrl(
                    settings.whatsappNumber,
                    `مرحبًا، أود التواصل مع إدارة ${settings.siteName}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-50/70 p-6 rounded-3xl border border-emerald-200 hover:border-emerald-500 hover:shadow-md shadow-xs text-center space-y-3 transition"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900">واتساب مباشر</h3>
                  <p className="text-xs text-slate-600 font-mono" dir="ltr">
                    {settings.whatsappNumber}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700">
                    <span>ابدأ المحادثة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              )}

              {(settings.phone || settings.whatsappNumber) && (
                <a
                  href={`tel:${String(settings.phone || settings.whatsappNumber).replace(
                    /[^\d+]/g,
                    ''
                  )}`}
                  className="bg-blue-50/70 p-6 rounded-3xl border border-blue-200 hover:border-blue-500 hover:shadow-md shadow-xs text-center space-y-3 transition"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-xs">
                    <Phone className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900">خدمة العملاء</h3>
                  <p className="text-xs text-slate-600 font-mono" dir="ltr">
                    {settings.phone || settings.whatsappNumber}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-700">
                    <span>اتصال هاتفي مباشر</span>
                  </span>
                </a>
              )}

              {settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:border-slate-400 hover:shadow-md shadow-xs text-center space-y-3 transition"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900">البريد الإلكتروني</h3>
                  <p className="text-xs text-slate-600 font-mono" dir="ltr">
                    {settings.email}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-700">
                    <span>إرسال رسالة</span>
                  </span>
                </a>
              )}

              {settings.whatsappGroupUrl?.trim() && (
                <a
                  href={normalizeExternalUrl(settings.whatsappGroupUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-teal-50/70 p-6 rounded-3xl border border-teal-200 hover:border-teal-500 hover:shadow-md shadow-xs text-center space-y-3 transition"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900">جروب الواتساب</h3>
                  <p className="text-xs text-slate-600">
                    انضم لجروب المعلمين لمتابعة أحدث المذكرات والعروض الحصرية.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-teal-700">
                    <span>انضم الآن</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              )}

              {settings.facebookUrl?.trim() && (
                <a
                  href={normalizeExternalUrl(settings.facebookUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-indigo-50/70 p-6 rounded-3xl border border-indigo-200 hover:border-indigo-500 hover:shadow-md shadow-xs text-center space-y-3 transition"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shadow-xs">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900">صفحة الفيسبوك</h3>
                  <p className="text-xs text-slate-600">
                    تابع صفحتنا الرسمية على فيسبوك للاطلاع على العينات وآراء المعلمين.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#1877F2]">
                    <span>زيارة الصفحة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              )}

              {settings.telegramUrl?.trim() && (
                <a
                  href={normalizeExternalUrl(settings.telegramUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-sky-50/70 p-6 rounded-3xl border border-sky-200 hover:border-sky-500 hover:shadow-md shadow-xs text-center space-y-3 transition"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900">قناة التليجرام</h3>
                  <p className="text-xs text-slate-600">
                    اشترك في قناتنا على تليجرام لتحميل العينات المجانية ومتابعة الإصدارات.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-sky-700">
                    <span>اشترك الآن</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              )}

              {settings.youtubeUrl?.trim() && (
                <a
                  href={normalizeExternalUrl(settings.youtubeUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-rose-50/70 p-6 rounded-3xl border border-rose-200 hover:border-rose-500 hover:shadow-md shadow-xs text-center space-y-3 transition"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                  <h3 className="font-extrabold text-slate-900">قناة اليوتيوب</h3>
                  <p className="text-xs text-slate-600">
                    شاهد استعراضات مصورة للمذكرات وتصميماتها من الداخل.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-700">
                    <span>مشاهدة القناة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              )}

              {settings.instagramUrl?.trim() && (
                <a
                  href={normalizeExternalUrl(settings.instagramUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-fuchsia-50/70 p-6 rounded-3xl border border-fuchsia-200 hover:border-fuchsia-500 hover:shadow-md shadow-xs text-center space-y-3 transition"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-700 text-white flex items-center justify-center shadow-xs">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900">إنستجرام</h3>
                  <p className="text-xs text-slate-600">
                    شاهد أحدث أغلفة المذكرات والتصميمات التعليمية على حسابنا.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-pink-700">
                    <span>متابعة الحساب</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              )}

              {settings.tiktokUrl?.trim() && (
                <a
                  href={normalizeExternalUrl(settings.tiktokUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 hover:shadow-md shadow-xs text-center space-y-3 transition"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 text-white flex items-center justify-center">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-white">تيك توك</h3>
                  <p className="text-xs text-slate-300">
                    مقاطع قصيرة لاستعراض جودة الطباعة وتفاصيل المذكرات.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-teal-300">
                    <span>زيارة الحساب</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              )}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-center md:text-right space-y-1">
            <div>
              <span className="font-extrabold text-white">{settings.siteName}</span> — جميع الحقوق
              محفوظة © {new Date().getFullYear()}
            </div>
            {(settings.phone || settings.whatsappNumber) && (
              <div className="text-slate-400">
                خدمة العملاء:{' '}
                <a
                  href={`tel:${String(settings.phone || settings.whatsappNumber).replace(
                    /[^\d+]/g,
                    ''
                  )}`}
                  dir="ltr"
                  className="font-mono text-slate-200 hover:text-white"
                >
                  {settings.phone || settings.whatsappNumber}
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {settings.whatsappGroupUrl?.trim() && (
              <a
                href={normalizeExternalUrl(settings.whatsappGroupUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold flex items-center gap-1.5 transition"
              >
                <Users className="w-3.5 h-3.5" />
                <span>جروب واتساب</span>
              </a>
            )}
            {settings.facebookUrl?.trim() && (
              <a
                href={normalizeExternalUrl(settings.facebookUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-[#1877F2] text-blue-300 hover:text-white font-bold flex items-center gap-1.5 transition"
              >
                <span>فيسبوك</span>
              </a>
            )}
            {settings.telegramUrl?.trim() && (
              <a
                href={normalizeExternalUrl(settings.telegramUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-500 text-sky-300 hover:text-white font-bold flex items-center gap-1.5 transition"
              >
                <span>تليجرام</span>
              </a>
            )}
            {settings.youtubeUrl?.trim() && (
              <a
                href={normalizeExternalUrl(settings.youtubeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold flex items-center gap-1.5 transition"
              >
                <span>يوتيوب</span>
              </a>
            )}
            {settings.instagramUrl?.trim() && (
              <a
                href={normalizeExternalUrl(settings.instagramUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white font-bold flex items-center gap-1.5 transition"
              >
                <span>إنستجرام</span>
              </a>
            )}
            {settings.tiktokUrl?.trim() && (
              <a
                href={normalizeExternalUrl(settings.tiktokUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-bold flex items-center gap-1.5 transition"
              >
                <span>تيك توك</span>
              </a>
            )}
            <button type="button" onClick={() => setPage('track')} className="hover:text-white px-1">
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
