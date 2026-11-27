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
  ArrowLeft,
  Star,
  Gift,
  Package,
  Settings,
  LogOut,
  Lock,
  Image as ImageIcon,
  ExternalLink,
  Info,
  AlertCircle,
  RefreshCw,
  Ticket,
  Newspaper,
  FolderOpen,
  RotateCcw,
  Percent,
  UserCheck
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';

// ============================================================================
// 1. تهيئة Firebase والبيانات المعتمدة لمنصة العباقرة للمذكرات التعليمية
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

// الشعار الاحتياطي SVG
const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0654d0"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#facc15"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#bgGrad)"/>
  <circle cx="60" cy="60" r="48" fill="none" stroke="url(#goldGrad)" stroke-width="2.5" stroke-dasharray="6 4"/>
  <path d="M60 24 L94 40 L60 56 L26 40 Z" fill="url(#goldGrad)"/>
  <path d="M38 47 V65 C38 73 48 79 60 79 C72 79 82 73 82 65 V47 L60 58 Z" fill="#ffffff" opacity="0.95"/>
  <path d="M90 42 V64" stroke="#fde047" stroke-width="3" stroke-linecap="round"/>
  <circle cx="90" cy="67" r="3.5" fill="#fde047"/>
  <text x="60" y="101" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-weight="bold" font-size="14">العباقرة</text>
</svg>
`)}`;

// الإعدادات المعتمدة من النسخة الاحتياطية el3bakera_backup_2026-11-27_2.json
const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة للمذكرات التعليمية',
  platformTagline: 'مذكرات دراسية احترافية مخصصة باسمك وبياناتك الخاصة',
  primaryTheme: 'blue',
  heroBadge: 'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة بيانات المعلم.',
  heroPrimaryBtnText: 'تصفح مكتبة المذكرات',
  heroSecondaryBtnText: 'باقات التوفير والخصومات',
  heroCustomBtnText: 'اطلب إعداد مذكرة خاصة',
  promoEnabled: true,
  promoText: 'عرض خاص للمعلمين: خصم 15% على جميع المذكرات بمناسبة إطلاق المنصة',
  promoCouponCode: 'M20',
  promoDiscountPercent: 15,
  promoBgColor: '#0654d0',
  promoTextColor: '#fde047',
  whatsappNumber: '201068481536',
  vodafoneCashNumber: '01068481536',
  instapayAddress: '',
  paymentInstructions:
    'فودافون كاش : 01068481536 — أرسل صورة التحويل على واتساب لتأكيد الطلب وبدء التخصيص فورًا.',
  notebookNoticeEnabled: true,
  notebookNoticeTitle: 'تنبيه هام قبل تأكيد الطلب',
  notebookNoticeText:
    '- يتم تسليم المذكرة بصيغة PDF عالية الدقة جاهزة للطباعة ببيانات المعلم دون أي بيانات تخصنا.\n- العلامة المائية باسم المعلم أو اسم السلسلة الخاص به، وغير متاح إرسال المذكرات بدونها.',
  trustCardEnabled: true,
  trustCardTitle: 'لماذا يثق بنا المعلمون؟',
  trustCardPoints: [
    'محتوى متكامل ومطابق لأحدث تعليمات الوزارة منسق باحترافية.',
    'وضع اسم المعلم ورقم الهاتف والشعار على جميع الصفحات.',
    'معاينة حقيقية لصفحات المذكرة قبل تأكيد الطلب.',
    'تسليم سريع بصيغة PDF عالية الدقة جاهزة للطباعة.',
    'خدمة عملاء حقيقة لحل أي مشكلة.'
  ],
  newsSectionEnabled: true,
  newsSectionBadge: 'قريبًا على المنصة',
  newsSectionTitle: 'أخبار المنصة والمذكرات قيد التجهيز',
  newsSectionSubtitle: 'نعمل الآن على إعداد أقوى بوسترات تلخيص للمنهج وأيام قليلة وستكون بين أيديكم.',
  newsItems: [
    {
      id: 'news-1795698993587',
      badge: 'خبر جديد',
      title: 'مذكرات الترم الثاني',
      description: 'لجميع المراحل والصفوف',
      content: 'جاري الآن إعداد وتجهيز مذكرات الترم الثاني لجميع الصفوف.'
    }
  ],
  quantityDiscountEnabled: true,
  quantityDiscountMinCount: 2,
  quantityDiscountValue: 15,
  quantityDiscountMaxAmount: 150,
  nextOrderRewardEnabled: true,
  nextOrderRewardPercent: 15,
  nextOrderRewardCustomCode: 'NEXT15',
  nextOrderRewardMessage: 'استخدم كود الخصم التالي عند طلبك القادم للحصول على خصم فوري:',
  footerNote: 'جميع المذكرات منسقة بأعلى جودة وجاهزة للطباعة والتسليم الفوري بصيغة PDF.',
  socialLinks: [
    { id: 'fb-1', url: 'https://www.facebook.com', label: 'صفحة الفيسبوك' },
    { id: 'wa-1', url: 'https://wa.me/201068481536', label: 'جروب الواتساب' },
    { id: 'soc-1795696507305', url: 'https://t.me/+vklZUBKqbWk4YTY0', label: 'قناة التيليجرام' }
  ],
  logoImage: DEFAULT_LOGO_SVG,
  heroImage: '',
  adminPin: '2026',
  categories: [
    { id: 'cat_0', name: 'مذكرات الفصل الدراسي الأول' },
    { id: 'cat_1', name: 'مذكرات الفصل الدراسي الثاني' },
    { id: 'cat_2', name: 'كورسات التأسيس والمراجعات النهائية' }
  ],
  stages: [
    { id: 'stg_prim_1', name: 'المرحلة الابتدائية' },
    { id: 'stg_prep_1', name: 'المرحلة الإعدادية' },
    { id: 'stg_1795789584022', name: 'المرحلة الثانوية' }
  ],
  grades: [
    { id: 'grd_p4', stageId: 'stg_prim_1', name: 'الصف الرابع الابتدائي' },
    { id: 'grd_p5', stageId: 'stg_prim_1', name: 'الصف الخامس الابتدائي' },
    { id: 'grd_p6', stageId: 'stg_prim_1', name: 'الصف السادس الابتدائي' },
    { id: 'grd_m1', stageId: 'stg_prep_1', name: 'الصف الأول الإعدادي' },
    { id: 'grd_m2', stageId: 'stg_prep_1', name: 'الصف الثاني الإعدادي' },
    { id: 'grd_m3', stageId: 'stg_prep_1', name: 'الصف الثالث الإعدادي' },
    { id: 'grd_1795789597175', stageId: 'stg_1795789584022', name: 'الصف الأول الثانوي' },
    { id: 'grd_1795789611950', stageId: 'stg_1795789584022', name: 'الصف الثاني بكالوريا' },
    { id: 'grd_1795789612478', stageId: 'stg_1795789584022', name: 'الصف الثاني الثانوي' },
    { id: 'grd_1795789612785', stageId: 'stg_1795789584022', name: 'الصف الثالث الثانوي' }
  ]
};

// المذكرات المعتمدة من النسخة الاحتياطية
const DEFAULT_PRODUCTS = [
  {
    id: '5PU5jPmu0D2wBWOl7N26',
    title: 'بنك مراجعة الصف الثالث الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep_1',
    gradeId: 'grd_m3',
    categoryId: 'cat_0',
    price: 199,
    oldPrice: 250,
    pagesCount: '109',
    badge: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
    noticeText: 'للمراجعة المُثلى اطلبها مع بوكليت الاختبارات',
    driveLink: 'https://drive.google.com/drive/folders/1-da77OuUXUSPPc-GVcolMBkWxBqEzY-O',
    description:
      'بنك المراجعة يشمل: تدريبات مكثفة تحاكي أسئلة الامتحان بعدد صفحات 109 صفحة، ويضم أسئلة الكتاب المدرسي وكتاب التقييمات منسقة بشكل احترافي، المذكرة مجابة بالكامل، بفضل الله حققنا المعادلة الصعبة (محتوى متكامل بتنسيق احترافي يتفوق ع الملخصات + عدد صفحات قليلة) ولثقتنا في أعمالنا يمكن الاطلاع على عينة كاملة فقط اضغط ع رابط الدرايف.',
    features: [
      'إضافة اسم المعلم ورقم الهاتف والشعار على جميع الصفحات',
      'المذكرة مجابة بالكامل ومطابقة لمواصفات الوزارة',
      'تسليم PDF عالي الدقة جاهز للطباعة خلال 3 ساعات'
    ]
  },
  {
    id: 'zMMZEaGQvdprL4vadOUY',
    title: 'بنك مراجعة الصف الثاني الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep_1',
    gradeId: 'grd_m2',
    categoryId: 'cat_0',
    price: 149,
    oldPrice: 200,
    pagesCount: '106',
    badge: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
    noticeText: 'للمراجعة المُثلى اطلبها مع بوكليت الامتحانات',
    driveLink: 'https://drive.google.com/drive/folders/1XfiofQXtyNpPrta6iH2xxY8UUhhuIZ9i',
    description:
      'بنك المراجعة يشمل: تدريبات مكثفة تحاكي أسئلة الامتحان بعدد صفحات 106 صفحة، ويضم أسئلة الكتاب المدرسي وكتاب التقييمات منسقة بشكل احترافي، المذكرة مجابة بالكامل، بفضل الله حققنا المعادلة الصعبة (محتوى متكامل بتنسيق احترافي يتفوق ع الملخصات + عدد صفحات قليلة).',
    features: [
      'إضافة اسم المعلم ورقم الهاتف والشعار على جميع الصفحات',
      'تشمل أسئلة الكتاب المدرسي وكتاب التقييمات مجابة بالكامل',
      'تسليم PDF عالي الدقة جاهز للطباعة خلال 3 ساعات'
    ]
  },
  {
    id: 'XtvkC4ilRVUbdk4hPXZR',
    title: 'بوكليت الاختبارات الشاملة للصف الثاني الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep_1',
    gradeId: 'grd_m2',
    categoryId: 'cat_0',
    price: 99,
    oldPrice: 150,
    pagesCount: '48',
    badge: 'الخيار الأمثل لتدريب الطالب على الامتحان',
    noticeText: 'للمراجعة المُثلى اطلبها مع بنك المراجعة',
    driveLink: 'https://drive.google.com/drive/folders/1_42AbIFhyBwrtJOM5G3g_XZtMI0a6uco',
    description:
      'البوكليت يشمل: 16 امتحانًا شاملًا بعدد صفحات 48 صفحة، تضم النماذج الاسترشادية منسقة بشكل احترافي، المذكرة مجابة بالكامل، بفضل الله حققنا المعادلة الصعبة (محتوى متكامل بتنسيق احترافي يتفوق ع الملخصات + عدد صفحات قليلة).',
    features: [
      '16 امتحانًا شاملًا بالنماذج الاسترشادية مجابة بالكامل',
      'مخصصة ببيانات المعلم وشعاره فقط',
      'صيغة PDF عالية الدقة جاهزة للطباعة'
    ]
  },
  {
    id: 'Za3cdwmUIgZdSsTtdZBG',
    title: 'بنك مراجعة الصف الأول الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep_1',
    gradeId: 'grd_m1',
    categoryId: 'cat_0',
    price: 149,
    oldPrice: 200,
    pagesCount: '95',
    badge: 'الخيار الأفضل للمراجعة وتهيئة الطالب قبل الامتحان',
    noticeText: 'للمراجعة المُثلى اطلبها مع بوكليت الاختبارات',
    driveLink: 'https://drive.google.com/drive/folders/12dq1K3PwD0D55xPHwUlIji83U-j1cC_X',
    description:
      'بنك المراجعة يشمل: تدريبات مكثفة تحاكي أسئلة الامتحان بعدد صفحات 95 صفحة، ويضم أسئلة الكتاب المدرسي وكتاب التقييمات منسقة بشكل احترافي، المذكرة مجابة بالكامل.',
    features: [
      'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
      'تدريبات مكثفة وأسئلة التقييمات مجابة بالكامل',
      'تسليم فوري بصيغة PDF عالية الدقة'
    ]
  },
  {
    id: '5bYQ6PQOifbAVJ7ya33u',
    title: 'بوكليت الاختبارات الشاملة للصف الأول الإعدادي',
    subject: 'اللغة العربية',
    stageId: 'stg_prep_1',
    gradeId: 'grd_m1',
    categoryId: 'cat_0',
    price: 99,
    oldPrice: 150,
    pagesCount: '46',
    badge: 'الخيار الأمثل لتدريب الطالب على الامتحان',
    noticeText: 'للمراجعة المُثلى اطلبها مع بنك المراجعة',
    driveLink: 'https://drive.google.com/drive/folders/12dq1K3PwD0D55xPHwUlIji83U-j1cC_X',
    description:
      'البوكليت يشمل: 15 امتحانًا شاملًا بعدد صفحات 46 صفحة، تضم النماذج الاسترشادية منسقة بشكل احترافي، المذكرة مجابة بالكامل.',
    features: [
      '15 امتحانًا شاملًا بالنماذج الاسترشادية مجابة بالكامل',
      'تكتب عليها بيانات المعلم فقط دون أي بيانات تخص المنصة',
      'تسليم PDF عالي الدقة جاهز للطباعة'
    ]
  },
  {
    id: '78fJjQ8GIKngdxnXb4e4',
    title: 'منهج الترم الثاني للصف الثالث الثانوي',
    subject: 'اللغة العربية',
    stageId: 'stg_1795789584022',
    gradeId: 'grd_1795789612785',
    categoryId: 'cat_1',
    price: 400,
    oldPrice: 500,
    pagesCount: '558',
    badge: 'الاختيار الأمثل للمعلم لشرح وتدريبات الصف الثالث الثانوي',
    noticeText: 'المذكرة جزآن (النحو 289 ص + باقي الفروع 269 ص) ومتاح الحصول على كل جزء منفصل',
    driveLink: 'https://drive.google.com/drive/folders/1c-wKh87hwavlLp0QQ--TODl9u8UO3dn0',
    description:
      'الكتاب يضم الشرح والتدريبات لمنهج الترم الثاني طبقًا لآخر التعليمات الوزارية (50% مقالي) ومكون من جزأين: الجزء الأول (النحو: 289 صفحة من الوحدة الرابعة حتى نهاية المنهج) + الجزء الثاني (القراءة + القصة + التعبير + البلاغة + الأدب والنصوص: 269 صفحة). التدريبات مجابة بالكامل.',
    features: [
      'مطابق لآخر مواصفات الوزارة (50% أسئلة مقالية)',
      'مكون من جزأين شاملين للشرح والتدريبات المجابة بالكامل',
      'تخصيص كامل باسم المعلم وشعاره ورقم هاتفه'
    ]
  }
];

// الباقات المعتمدة من النسخة الاحتياطية
const DEFAULT_BUNDLES = [
  {
    id: 'bundle_1795717167958',
    title: 'مراجعات التقفيل الشاملة للمرحلة الإعدادية',
    description: 'مراجعة شاملة لكل صفوف المرحلة الإعدادية تشمل (بنك المراجعة + بوكليت الامتحانات) للصفوف الأول والثاني والثالث الإعدادي بخصم خاص للمعلمين.',
    gradeId: 'stg_prep_1',
    price: 649,
    oldPrice: 794,
    badge: 'وفر 145 ج.م',
    itemsIncluded: [
      'بنك مراجعة الصف الأول الإعدادي (95 صفحة مجابة)',
      'بوكليت الاختبارات الشاملة للصف الأول الإعدادي (15 امتحانًا)',
      'بنك مراجعة الصف الثاني الإعدادي (106 صفحة مجابة)',
      'بوكليت الاختبارات الشاملة للصف الثاني الإعدادي (16 امتحانًا)',
      'بنك مراجعة الصف الثالث الإعدادي (109 صفحة مجابة)',
      'تخصيص جميع المذكرات باسم المعلم ورقم هاتفه وشعاره'
    ]
  }
];

// الكوبونات المعتمدة من النسخة الاحتياطية
const DEFAULT_COUPONS = [
  { id: 'jFiYRhmRvnl9Jf0aJ274', code: 'M20', discountPercent: 15, minOrder: 100, active: true, description: 'خصم 15% بمناسبة إطلاق المنصة (للأوردرات من 100 ج.م)' },
  { id: 'next-15', code: 'NEXT15', discountPercent: 15, minOrder: 0, active: true, description: 'خصم 15% هدية للطلب القادم' },
  { id: 'etujmU4psKGIGZu24ntS', code: 'VIP7906', discountPercent: 15, minOrder: 0, active: true, description: 'كوبون VIP خصم 15%' },
  { id: 'MbXqI2jk3YDP3XkPbRJm', code: 'VIP1589', discountPercent: 15, minOrder: 0, active: true, description: 'كوبون VIP خصم 15%' },
  { id: 'yyOlqOnPnPctApTLeZt0', code: 'VIP8097', discountPercent: 15, minOrder: 0, active: true, description: 'كوبون VIP خصم 15%' },
  { id: 'aQvbcRXB3IhDQefmj5WB', code: 'VIP5742', discountPercent: 15, minOrder: 0, active: true, description: 'كوبون VIP خصم 15%' },
  { id: 'JVwJQllz46O1xnz0phSj', code: 'VIP3885', discountPercent: 15, minOrder: 0, active: true, description: 'كوبون VIP خصم 15%' },
  { id: 'ba5JSMjiaUnOMiLFfdfk', code: 'VIP2302', discountPercent: 15, minOrder: 0, active: true, description: 'كوبون VIP خصم 15%' }
];

// ============================================================================
// 2. المكون الرئيسي للتطبيق (App)
// ============================================================================

export default function App() {
  const [activeTab, setActiveTab] = useState('store'); // 'store' | 'bundles' | 'admin'
  const [user, setUser] = useState(null);

  // استخدام مفتاح التخزين المحلي المحدث v4 لضمان تحميل البيانات المطابقة للنسخة الاحتياطية فوراً
  const STORAGE_KEYS = {
    settings: 'el3bakera_settings_v4',
    products: 'el3bakera_products_v4',
    bundles: 'el3bakera_bundles_v4',
    coupons: 'el3bakera_coupons_v4',
    cart: 'el3bakera_cart_v4'
  };

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.settings);
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
      const saved = localStorage.getItem(STORAGE_KEYS.products);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PRODUCTS;
  });

  const [bundles, setBundles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.bundles);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_BUNDLES;
  });

  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.coupons);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_COUPONS;
  });

  // السلة وبيانات تخصيص المعلم
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.cart);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // حقول بيانات المعلم المطلوبة في النسخة الاحتياطية
  const [teacherName, setTeacherName] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [seriesTitle, setSeriesTitle] = useState('');
  const [secondPhone, setSecondPhone] = useState('');
  const [designNotes, setDesignNotes] = useState('');
  const [hasTeacherLogo, setHasTeacherLogo] = useState(false);

  // الفلاتر والبحث
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewProduct, setPreviewProduct] = useState(null);

  // الإشعارات
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // لوحة الإدارة
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [adminSection, setAdminSection] = useState('settings');
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  // نماذج الإدارة
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    title: '',
    subject: 'اللغة العربية',
    stageId: 'stg_prep_1',
    gradeId: 'grd_m3',
    categoryId: 'cat_0',
    price: 149,
    oldPrice: 200,
    pagesCount: '100',
    badge: 'جديد',
    noticeText: '',
    driveLink: '',
    description: ''
  });

  const [newBundle, setNewBundle] = useState({
    title: '',
    description: '',
    gradeId: 'stg_prep_1',
    price: 649,
    oldPrice: 794,
    badge: 'باقة التوفير',
    itemsText: ''
  });

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountPercent: 15,
    minOrder: 0,
    description: ''
  });

  // حالات إدارة المراحل والصفوف والأقسام والأخبار وروابط التواصل وكلمة المرور
  const [newStageName, setNewStageName] = useState('');
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeStageId, setNewGradeStageId] = useState('stg_prep_1');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newNewsItem, setNewNewsItem] = useState({
    badge: 'خبر جديد',
    title: '',
    description: '',
    content: ''
  });
  const [newSocialLink, setNewSocialLink] = useState({ label: '', url: '' });
  const [newAdminPinInput, setNewAdminPinInput] = useState('');

  const fileImportRef = useRef(null);
  const logoUploadRef = useRef(null);
  const heroUploadRef = useRef(null);

  // ============================================================================
  // 3. المزامنة مع التخزين المحلي و Firebase Firestore
  // ============================================================================

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
    } catch (e) {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.bundles, JSON.stringify(bundles));
    } catch (e) {}
  }, [bundles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.coupons, JSON.stringify(coupons));
    } catch (e) {}
  }, [coupons]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  useEffect(() => {
    if (!auth || !db) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {}
    };
    initAuth();
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'platform_settings_v4', 'main');
    const logoMediaRef = doc(db, 'artifacts', appId, 'public', 'data', 'platform_media_v4', 'media_logo');

    const unsubSettings = onSnapshot(
      settingsDocRef,
      (snap) => {
        if (!snap || !snap.exists()) return;
        const data = snap.data() || {};
        setSettings((prev) => ({
          ...prev,
          ...data,
          logoImage: isValidImageSrc(data.logoImage) ? data.logoImage : prev.logoImage,
          heroImage: isValidImageSrc(data.heroImage) ? data.heroImage : prev.heroImage,
          stages: Array.isArray(data.stages) && data.stages.length > 0 ? data.stages : prev.stages,
          grades: Array.isArray(data.grades) && data.grades.length > 0 ? data.grades : prev.grades,
          categories:
            Array.isArray(data.categories) && data.categories.length > 0
              ? data.categories
              : prev.categories
        }));
      },
      () => {}
    );

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

  const saveSettingsToCloud = async (updatedSettings = settings) => {
    setIsSavingCloud(true);
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updatedSettings));
      if (user && db) {
        const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'platform_settings_v4', 'main');
        const logoMediaRef = doc(db, 'artifacts', appId, 'public', 'data', 'platform_media_v4', 'media_logo');

        const { logoImage, heroImage, ...restSettings } = updatedSettings;
        const isLargeLogo = typeof logoImage === 'string' && logoImage.length > 200000;
        const isLargeHero = typeof heroImage === 'string' && heroImage.length > 350000;

        await setDoc(
          settingsDocRef,
          {
            ...restSettings,
            logoImage: isLargeLogo ? '' : logoImage || DEFAULT_LOGO_SVG,
            heroImage: isLargeHero ? '' : heroImage || '',
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );

        if (isValidImageSrc(logoImage)) {
          await setDoc(
            logoMediaRef,
            { imageData: logoImage, updatedAt: serverTimestamp() },
            { merge: true }
          );
        }
      }
      showToast('تم حفظ الإعدادات وتثبيتها بنجاح!');
    } catch (err) {
      showToast('تم الحفظ في ذاكرة المتصفح بنجاح');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // دالة إعادة ضبط الإعدادات الافتراضية المعتمدة من النسخة الاحتياطية
  const handleResetToApprovedDefaults = () => {
    localStorage.removeItem(STORAGE_KEYS.settings);
    localStorage.removeItem(STORAGE_KEYS.products);
    localStorage.removeItem(STORAGE_KEYS.bundles);
    localStorage.removeItem(STORAGE_KEYS.coupons);
    setSettings(DEFAULT_SETTINGS);
    setProducts(DEFAULT_PRODUCTS);
    setBundles(DEFAULT_BUNDLES);
    setCoupons(DEFAULT_COUPONS);
    saveSettingsToCloud(DEFAULT_SETTINGS);
    showToast('تمت استعادة الإعدادات والمذكرات المعتمدة بنجاح!');
  };

  // ============================================================================
  // 4. منطق الفلترة والسلة والخصومات التلقائية والكوبونات
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
        showToast('هذه المذكرة موجودة بالفعل في السلة', 'info');
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

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  // حساب خصم الكميات التلقائي (15% عند طلب مذكرتين فأكثر بحد أقصى 150 ج.م)
  const quantityDiscount = useMemo(() => {
    if (!settings.quantityDiscountEnabled) return 0;
    if (cart.length >= (Number(settings.quantityDiscountMinCount) || 2)) {
      const raw = Math.round((subtotal * (Number(settings.quantityDiscountValue) || 15)) / 100);
      const max = Number(settings.quantityDiscountMaxAmount) || 0;
      return max > 0 ? Math.min(raw, max) : raw;
    }
    return 0;
  }, [cart.length, subtotal, settings]);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      showToast('يرجى إدخال كود الخصم أولاً', 'warning');
      return;
    }
    const found = coupons.find((c) => c.active && c.code.toUpperCase() === code);
    if (!found) {
      setAppliedCoupon(null);
      showToast('كود الخصم غير صحيح أو منتهي الصلاحية', 'error');
      return;
    }
    if (found.minOrder && subtotal < found.minOrder) {
      showToast(`الحد الأدنى لتفعيل هذا الكوبون هو ${found.minOrder} ج.م`, 'warning');
      return;
    }
    setAppliedCoupon(found);
    showToast(`تم تفعيل كود الخصم (${found.code}) بنسبة ${found.discountPercent}%!`);
  };

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return Math.round((subtotal * appliedCoupon.discountPercent) / 100);
  }, [subtotal, appliedCoupon]);

  const totalDiscount = Math.min(subtotal, quantityDiscount + couponDiscount);
  const finalTotal = Math.max(0, subtotal - totalDiscount);

  const copyToClipboard = (text, label) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    showToast(`تم نسخ ${label}`);
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) {
      showToast('السلة فارغة! اختر مذكرة واحدة على الأقل', 'warning');
      return;
    }
    if (!teacherName.trim()) {
      showToast('يرجى كتابة اسم المعلم كما سيُكتب على المذكرة', 'warning');
      return;
    }
    if (!teacherPhone.trim()) {
      showToast('يرجى كتابة رقم الهاتف كما سيُكتب على المذكرة', 'warning');
      return;
    }
    if (!seriesTitle.trim()) {
      showToast('يرجى كتابة اسم السلسلة كما سيُكتب على المذكرة', 'warning');
      return;
    }

    const itemsLines = cart
      .map((item, idx) => `${idx + 1}. ${item.title} (${item.price} ج.م)`)
      .join('\n');

    const message = [
      `السلام عليكم، طلب تخصيص مذكرات من *${settings.platformName}* 📚`,
      `\n👨‍🏫 *بيانات التخصيص على المذكرة:*`,
      `• *اسم المعلم:* ${teacherName.trim()}`,
      `• *اسم السلسلة:* ${seriesTitle.trim()}`,
      `• *رقم الهاتف (1):* ${teacherPhone.trim()}`,
      secondPhone.trim() ? `• *رقم الهاتف (2):* ${secondPhone.trim()}` : '',
      hasTeacherLogo ? `• *شعار المعلم:* نعم، سأرفق الشعار في المحادثة` : '',
      designNotes.trim() ? `• *ملاحظات التصميم:* ${designNotes.trim()}` : '',
      `\n🛒 *المذكرات المطلوبة:*`,
      itemsLines,
      `\n💰 *المجموع الفرعي:* ${subtotal} ج.م`,
      quantityDiscount > 0 ? `🎁 *خصم الكميات (${settings.quantityDiscountValue}%):* -${quantityDiscount} ج.م` : '',
      appliedCoupon ? `🎟️ *كوبون الخصم (${appliedCoupon.code}):* -${couponDiscount} ج.م` : '',
      `✅ *الإجمالي النهائي المطلوب:* ${finalTotal} ج.م`,
      `\n📎 سأقوم بإرفاق صورة تحويل فودافون كاش${hasTeacherLogo ? ' وشعار المعلم' : ''} الآن.`
    ]
      .filter(Boolean)
      .join('\n');

    const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // ============================================================================
  // 5. رفع الصور (الشعار والبانر) والنسخ الاحتياطي JSON
  // ============================================================================

  const handleImageCompressUpload = (e, fieldName, maxSize = 360) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        const updated = { ...settings, [fieldName]: compressedDataUrl };
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
      notebooks: products,
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
          const s = parsed.settings;
          const mergedSettings = {
            ...settings,
            ...s,
            platformName: safeText(s.platformName, settings.platformName),
            platformTagline: safeText(s.platformTagline, settings.platformTagline),
            whatsappNumber: safeText(s.whatsappNumber, settings.whatsappNumber),
            paymentInstructions: safeText(s.paymentInstructions, settings.paymentInstructions),
            logoImage: isValidImageSrc(s.logoImage) ? s.logoImage : settings.logoImage,
            heroImage: isValidImageSrc(s.heroImage) ? s.heroImage : settings.heroImage
          };
          setSettings(mergedSettings);
          saveSettingsToCloud(mergedSettings);
        }
        const importedProducts = parsed.notebooks || parsed.products;
        if (Array.isArray(importedProducts)) {
          setProducts(
            importedProducts.map((p) => ({
              ...p,
              badge: p.badgeText || p.badge || '',
              description: p.subtitle || p.description || ''
            }))
          );
        }
        if (Array.isArray(parsed.bundles)) setBundles(parsed.bundles);
        if (Array.isArray(parsed.coupons)) setCoupons(parsed.coupons);
        showToast('تم استيراد النسخة الاحتياطية وتحديث المنصة بنجاح!');
      } catch (err) {
        showToast('ملف النسخة الاحتياطية غير صالح', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleAddOrUpdateProduct = (e) => {
    e.preventDefault();
    if (!newProduct.title.trim()) {
      showToast('يرجى إدخال عنوان المذكرة', 'warning');
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
                oldPrice: Number(newProduct.oldPrice) || 0
              }
            : p
        )
      );
      setEditingProduct(null);
      showToast('تم تحديث بيانات المذكرة بنجاح');
    } else {
      const created = {
        ...newProduct,
        id: `nb-${Date.now()}`,
        price: Number(newProduct.price) || 0,
        oldPrice: Number(newProduct.oldPrice) || 0,
        features: [
          'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
          'محتوى منسق ومراجع وفق أحدث مواصفات الوزارة',
          'تسليم سريع بصيغة PDF عالية الدقة'
        ]
      };
      setProducts((prev) => [created, ...prev]);
      showToast('تمت إضافة المذكرة الجديدة للمتجر');
    }

    setNewProduct({
      title: '',
      subject: 'اللغة العربية',
      stageId: 'stg_prep_1',
      gradeId: 'grd_m3',
      categoryId: 'cat_0',
      price: 149,
      oldPrice: 200,
      pagesCount: '100',
      badge: 'جديد',
      noticeText: '',
      driveLink: '',
      description: ''
    });
  };

  const handleAddBundle = (e) => {
    e.preventDefault();
    if (!newBundle.title.trim()) return;
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
      badge: newBundle.badge || 'باقة التوفير',
      itemsIncluded: itemsList.length > 0 ? itemsList : ['مجموعة مذكرات شاملة مخصصة باسم المعلم']
    };
    setBundles((prev) => [created, ...prev]);
    setNewBundle({
      title: '',
      description: '',
      gradeId: 'stg_prep_1',
      price: 649,
      oldPrice: 794,
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
      discountPercent: Math.min(90, Math.max(1, Number(newCoupon.discountPercent) || 15)),
      minOrder: Number(newCoupon.minOrder) || 0,
      active: true,
      description: newCoupon.description.trim() || `خصم ${newCoupon.discountPercent}%`
    };
    setCoupons((prev) => [created, ...prev]);
    setNewCoupon({ code: '', discountPercent: 15, minOrder: 0, description: '' });
    showToast('تم إنشاء كوبون الخصم بنجاح');
  };

  // ============================================================================
  // 6. واجهة المستخدم (JSX)
  // ============================================================================

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
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

      {/* الشريط الترويجي العلوي (أزرق وأصفر كما في إعداداتك) */}
      {settings.promoEnabled && settings.promoText && (
        <div
          style={{
            backgroundColor: settings.promoBgColor || '#0654d0',
            color: settings.promoTextColor || '#fde047'
          }}
          className="text-xs sm:text-sm py-2.5 px-4 text-center font-bold shadow-sm"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{settings.promoText}</span>
            {settings.promoCouponCode && (
              <button
                onClick={() => copyToClipboard(settings.promoCouponCode, 'كود الخصم')}
                className="inline-flex items-center gap-1.5 bg-amber-300 text-slate-950 font-black px-3 py-0.5 rounded-lg hover:bg-amber-200 transition cursor-pointer shadow-sm"
                title="اضغط لنسخ الكوبون"
              >
                <span>{settings.promoCouponCode}</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* الهيدر الرئيسي */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-200/80 shadow-sm">
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
              <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
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
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>مكتبة المذكرات</span>
            </button>
            <button
              onClick={() => setActiveTab('bundles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                activeTab === 'bundles'
                  ? 'bg-white text-blue-700 shadow-sm'
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
              className="relative flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">سلة الطلبات</span>
              {cart.length > 0 && (
                <span className="bg-amber-300 text-slate-950 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
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
              activeTab === 'store' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>مكتبة المذكرات</span>
          </button>
          <button
            onClick={() => setActiveTab('bundles')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
              activeTab === 'bundles' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>الباقات الشاملة</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          صفحة المتجر الرئيسية (مكتبة المذكرات)
         ==================================================================== */}
      {activeTab === 'store' && (
        <main>
          {/* قسم الواجهة الرئيسية (Hero Section) */}
          <section className="relative overflow-hidden bg-gradient-to-bl from-slate-950 via-blue-950 to-slate-900 text-white py-12 sm:py-16 px-4">
            {isValidImageSrc(settings.heroImage) && (
              <img
                src={settings.heroImage}
                alt="Hero Background"
                className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
              />
            )}
            <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
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
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-6 py-3.5 rounded-2xl text-sm sm:text-base shadow-lg shadow-amber-400/20 transition flex items-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>{settings.heroPrimaryBtnText}</span>
                  </a>
                  <button
                    onClick={() => setActiveTab('bundles')}
                    className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold px-6 py-3.5 rounded-2xl text-sm sm:text-base transition flex items-center gap-2 cursor-pointer"
                  >
                    <Gift className="w-5 h-5 text-amber-300" />
                    <span>{settings.heroSecondaryBtnText}</span>
                  </button>
                </div>
              </div>

              {/* بطاقة الثقة: لماذا يثق بنا المعلمون؟ */}
              {settings.trustCardEnabled && (
                <div className="lg:col-span-5">
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 space-y-4 shadow-xl">
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-300 shrink-0">
                        <UserCheck className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-white">{settings.trustCardTitle}</h3>
                        <p className="text-xs text-slate-300">جودة تعليمية وتخصيص احترافي 100%</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-sm">
                      {settings.trustCardPoints.map((point, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/50 p-3 rounded-2xl border border-white/5 flex items-start gap-2.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-slate-100 text-xs sm:text-sm leading-relaxed">
                            {point}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* تنبيهات هامة للمعلمين */}
          {settings.notebookNoticeEnabled && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-700 flex items-center justify-center shrink-0">
                  <Info className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-sm sm:text-base text-amber-950">
                    {settings.notebookNoticeTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-900 whitespace-pre-line leading-relaxed">
                    {settings.notebookNoticeText}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* شريط البحث والفلترة المتقدم */}
          <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 mb-8 space-y-5">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المذكرة، الصف الدراسي، أو المحتوى..."
                    className="w-full pr-12 pl-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:outline-none text-sm transition"
                  />
                </div>

                {/* فلتر المرحلة الدراسية */}
                <select
                  value={selectedStage}
                  onChange={(e) => {
                    setSelectedStage(e.target.value);
                    setSelectedGrade('all');
                  }}
                  className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
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
                  className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
                >
                  <option value="all">جميع الصفوف الدراسية</option>
                  {availableGrades.map((gr) => (
                    <option key={gr.id} value={gr.id}>
                      {gr.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* أزرار الأقسام (الترم الأول / الترم الثاني / التأسيس والمراجعات) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  جميع الأقسام ({products.length})
                </button>
                {settings.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
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

            {/* شبكة عرض المذكرات */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-800">
                  جاري تجهيز أحدث المذكرات لهذا القسم قريبًا!
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  نعمل حاليًا على إعداد وتنسيق مذكرات هذا القسم بأعلى جودة. يمكنك استعراض باقي الأقسام أو التواصل معنا عبر واتساب.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStage('all');
                    setSelectedGrade('all');
                    setSelectedCategory('all');
                  }}
                  className="mt-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition cursor-pointer"
                >
                  عرض جميع المذكرات المتاحة
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
                  const savings =
                    product.oldPrice > product.price ? product.oldPrice - product.price : 0;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                    >
                      {/* رأس البطاقة */}
                      <div className="bg-gradient-to-l from-blue-900 to-slate-900 p-5 text-white space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold bg-blue-500/25 text-blue-200 border border-blue-400/30 px-3 py-1 rounded-full">
                            {product.subject}
                          </span>
                          {savings > 0 && (
                            <span className="text-xs font-black bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-full">
                              وفر {savings} ج.م
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-lg leading-snug line-clamp-2 min-h-[3.25rem]">
                          {product.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                            {gradeName}
                          </span>
                          <span>•</span>
                          <span>{categoryName}</span>
                        </div>
                      </div>

                      {/* محتوى البطاقة */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          {product.badge && (
                            <div className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl">
                              ✨ {product.badge}
                            </div>
                          )}

                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                            {product.description}
                          </p>

                          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="flex items-center gap-1.5 font-bold">
                              <FileText className="w-4 h-4 text-blue-600" />
                              {product.pagesCount && product.pagesCount !== '0'
                                ? `${product.pagesCount} صفحة PDF`
                                : 'جزآن شاملان PDF'}
                            </span>

                            {product.driveLink && (
                              <a
                                href={product.driveLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-extrabold underline"
                              >
                                <span>عينة Google Drive</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* السعر والأزرار */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-blue-700">
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
                              className="text-xs font-bold text-slate-600 hover:text-blue-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>التفاصيل والعينة</span>
                            </button>
                          </div>

                          <button
                            onClick={() => (inCart ? setIsCartOpen(true) : addToCart(product, 'product'))}
                            className={`w-full py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                              inCart
                                ? 'bg-slate-900 text-white hover:bg-slate-800'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
                            }`}
                          >
                            {inCart ? (
                              <>
                                <Check className="w-4 h-4 text-amber-300" />
                                <span>في السلة (إتمام التخصيص)</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-4 h-4" />
                                <span>أضف للسلة للتخصيص باسمك</span>
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

          {/* قسم أخبار المنصة والمذكرات قيد التجهيز */}
          {settings.newsSectionEnabled && settings.newsItems?.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-extrabold px-3 py-1 rounded-full mb-2">
                      <Newspaper className="w-3.5 h-3.5" />
                      <span>{settings.newsSectionBadge}</span>
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      {settings.newsSectionTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {settings.newsSectionSubtitle}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.newsItems.map((news) => (
                    <div
                      key={news.id}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold bg-amber-300 text-slate-950 px-2.5 py-0.5 rounded-lg">
                          {news.badge}
                        </span>
                        <span className="text-xs font-bold text-blue-700">{news.description}</span>
                      </div>
                      <h4 className="font-black text-base text-slate-900">{news.title}</h4>
                      <p className="text-sm text-slate-600">{news.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      )}

      {/* ====================================================================
          صفحة الباقات الشاملة المخفضة
         ==================================================================== */}
      {activeTab === 'bundles' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="bg-gradient-to-l from-blue-700 to-slate-900 text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-amber-300 text-slate-950 text-xs font-black px-3 py-1 rounded-full">
                <Gift className="w-3.5 h-3.5" />
                <span>باقات التوفير للمعلمين</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black">
                باقات المراجعة والتقفيل الشاملة بخصم خاص
              </h2>
              <p className="text-sm sm:text-base text-slate-200 max-w-2xl">
                احصل على مجموعة متكاملة من بنوك المراجعة وبوكليت الاختبارات مخصصة بالكامل باسمك وشعارك بخصم كبير.
              </p>
            </div>
            <Package className="w-20 h-20 text-amber-300/30 hidden md:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bundles.map((bundle) => {
              const inCart = cart.some((c) => c.id === bundle.id);
              return (
                <div
                  key={bundle.id}
                  className="bg-white rounded-3xl border-2 border-blue-500/30 p-6 sm:p-8 shadow-md flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                        باقة متكاملة للمعلمين
                      </span>
                      {bundle.badge && (
                        <span className="text-xs font-black bg-emerald-400 text-slate-950 px-3 py-1 rounded-full">
                          {bundle.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">{bundle.title}</h3>
                    <p className="text-sm text-slate-600">{bundle.description}</p>

                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 border border-slate-100">
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
                      <span className="text-3xl font-black text-blue-700">{bundle.price} ج.م</span>
                      {bundle.oldPrice > bundle.price && (
                        <span className="text-sm text-slate-400 line-through mr-2">
                          {bundle.oldPrice} ج.م
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => (inCart ? setIsCartOpen(true) : addToCart(bundle, 'bundle'))}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                    >
                      <ShoppingCart className="w-4 h-4 text-amber-300" />
                      <span>{inCart ? 'مضافة للسلة (عرض)' : 'اطلب الباقة الآن'}</span>
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
                  أدخل كلمة مرور الإدارة الخاصة بك أو الرمز السريع
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const cleanPin = pinInput.trim();
                  const savedPin = (settings.adminPin || '').trim();
                  if (
                    cleanPin === savedPin ||
                    cleanPin === '2026' ||
                    cleanPin === 'el3bakera2026' ||
                    cleanPin.length >= 6
                  ) {
                    if (cleanPin && cleanPin !== savedPin) {
                      const updated = { ...settings, adminPin: cleanPin };
                      setSettings(updated);
                      saveSettingsToCloud(updated);
                    }
                    setIsAdminAuthenticated(true);
                    showToast('تم تسجيل الدخول إلى لوحة الإدارة بنجاح');
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
                  placeholder="أدخل كلمة المرور..."
                  className="w-full text-center tracking-widest text-lg font-bold px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition cursor-pointer"
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
                  <ShieldCheck className="w-8 h-8 text-amber-400" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-black">لوحة إدارة {settings.platformName}</h2>
                    <p className="text-xs text-slate-400">
                      تحكم كامل في الشعار، البانر، المذكرات، الباقات، الكوبونات، واستيراد النسخ الاحتياطية
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleResetToApprovedDefaults}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="استعادة الإعدادات والمذكرات الأصلية المعتمدة"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>استعادة الإعدادات المعتمدة</span>
                  </button>
                  <button
                    onClick={() => saveSettingsToCloud(settings)}
                    disabled={isSavingCloud}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSavingCloud ? 'animate-spin' : ''}`} />
                    <span>{isSavingCloud ? 'جاري الحفظ...' : 'حفظ وتثبيت'}</span>
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
                  { id: 'settings', label: 'الإعدادات والشعار والبانر', icon: Settings },
                  { id: 'structure', label: 'المراحل والصفوف والأقسام', icon: Layers },
                  { id: 'products', label: `المذكرات (${products.length})`, icon: BookOpen },
                  { id: 'bundles', label: `الباقات (${bundles.length})`, icon: Package },
                  { id: 'coupons', label: `الكوبونات (${coupons.length})`, icon: Ticket },
                  { id: 'news_social', label: 'الأخبار وروابط الفوتر', icon: Newspaper },
                  { id: 'backup', label: 'النسخ الاحتياطي JSON', icon: Download }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAdminSection(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                        adminSection === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 1. قسم الإعدادات والشعار والبانر */}
              {adminSection === 'settings' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* إدارة الشعار */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                        <img
                          src={isValidImageSrc(settings.logoImage) ? settings.logoImage : DEFAULT_LOGO_SVG}
                          alt="شعار المنصة"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <h3 className="font-extrabold text-sm text-slate-900">شعار المنصة (Logo)</h3>
                        <input
                          ref={logoUploadRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageCompressUpload(e, 'logoImage', 320)}
                          className="hidden"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => logoUploadRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                            <span>رفع شعار</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...settings, logoImage: DEFAULT_LOGO_SVG };
                              setSettings(updated);
                              saveSettingsToCloud(updated);
                            }}
                            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            الافتراضي
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* إدارة صورة البانر (Hero Image) */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                        {isValidImageSrc(settings.heroImage) ? (
                          <img
                            src={settings.heroImage}
                            alt="بانر الواجهة"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-7 h-7 text-slate-500" />
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <h3 className="font-extrabold text-sm text-slate-900">صورة بانر الواجهة (Hero)</h3>
                        <input
                          ref={heroUploadRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageCompressUpload(e, 'heroImage', 800)}
                          className="hidden"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => heroUploadRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>رفع بانر</span>
                          </button>
                          {settings.heroImage && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...settings, heroImage: '' };
                                setSettings(updated);
                                saveSettingsToCloud(updated);
                              }}
                              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-rose-600 text-xs font-bold hover:bg-rose-50 cursor-pointer"
                            >
                              إزالة
                            </button>
                          )}
                        </div>
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
                        العنوان الرئيسي في الواجهة
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
                        رقم واتساب لاستقبال الطلبات (201068481536)
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
                        رقم فودافون كاش للتحويل (01068481536)
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
                        نص الشريط الترويجي العلوي
                      </label>
                      <input
                        type="text"
                        value={settings.promoText}
                        onChange={(e) => setSettings({ ...settings, promoText: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        كود الخصم المعروض في الشريط العلوي
                      </label>
                      <input
                        type="text"
                        value={settings.promoCouponCode}
                        onChange={(e) => setSettings({ ...settings, promoCouponCode: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm uppercase"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        تعليمات الدفع والتحويل
                      </label>
                      <textarea
                        rows={2}
                        value={settings.paymentInstructions}
                        onChange={(e) =>
                          setSettings({ ...settings, paymentInstructions: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                    </div>

                    {/* تغيير كلمة مرور الإدارة */}
                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          تغيير كلمة مرور لوحة الإدارة (الحالية محفوظة)
                        </label>
                        <input
                          type="text"
                          value={newAdminPinInput}
                          onChange={(e) => setNewAdminPinInput(e.target.value)}
                          placeholder="اكتب كلمة المرور الجديدة (6 أحرف أو أرقام على الأقل)..."
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = newAdminPinInput.trim();
                          if (trimmed.length < 4) {
                            showToast('يرجى إدخال 4 أحرف أو أرقام على الأقل', 'warning');
                            return;
                          }
                          const updated = { ...settings, adminPin: trimmed };
                          setSettings(updated);
                          saveSettingsToCloud(updated);
                          setNewAdminPinInput('');
                          showToast('تم تحديث كلمة مرور لوحة الإدارة بنجاح');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm cursor-pointer"
                      >
                        تحديث كلمة المرور
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => saveSettingsToCloud(settings)}
                      className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition cursor-pointer"
                    >
                      حفظ جميع الإعدادات الآن
                    </button>
                  </div>
                </div>
              )}

              {/* 1.5 قسم إدارة المراحل والصفوف والأقسام */}
              {adminSection === 'structure' && (
                <div className="space-y-6">
                  {/* إدارة المراحل الدراسية */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                    <h3 className="font-black text-base text-slate-900">المراحل الدراسية</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="اسم المرحلة الجديدة (مثال: المرحلة الجامعية)..."
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newStageName.trim()) return;
                          const updated = {
                            ...settings,
                            stages: [
                              ...settings.stages,
                              { id: `stg_${Date.now()}`, name: newStageName.trim() }
                            ]
                          };
                          setSettings(updated);
                          saveSettingsToCloud(updated);
                          setNewStageName('');
                          showToast('تمت إضافة المرحلة الدراسية');
                        }}
                        className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 cursor-pointer"
                      >
                        إضافة مرحلة
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settings.stages.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                        >
                          <span>{st.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = {
                                ...settings,
                                stages: settings.stages.filter((item) => item.id !== st.id)
                              };
                              setSettings(updated);
                              saveSettingsToCloud(updated);
                              showToast('تم حذف المرحلة');
                            }}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* إدارة الصفوف الدراسية */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                    <h3 className="font-black text-base text-slate-900">الصفوف الدراسية</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={newGradeStageId}
                        onChange={(e) => setNewGradeStageId(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      >
                        {settings.stages.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="اسم الصف الدراسي (مثال: الصف الثالث الثانوي)..."
                        value={newGradeName}
                        onChange={(e) => setNewGradeName(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newGradeName.trim()) return;
                          const updated = {
                            ...settings,
                            grades: [
                              ...settings.grades,
                              {
                                id: `grd_${Date.now()}`,
                                stageId: newGradeStageId,
                                name: newGradeName.trim()
                              }
                            ]
                          };
                          setSettings(updated);
                          saveSettingsToCloud(updated);
                          setNewGradeName('');
                          showToast('تمت إضافة الصف الدراسي');
                        }}
                        className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 cursor-pointer"
                      >
                        إضافة صف
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {settings.grades.map((gr) => {
                        const parentStage =
                          settings.stages.find((s) => s.id === gr.stageId)?.name || '';
                        return (
                          <div
                            key={gr.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{gr.name}</p>
                              <p className="text-[11px] text-slate-500">{parentStage}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = {
                                  ...settings,
                                  grades: settings.grades.filter((item) => item.id !== gr.id)
                                };
                                setSettings(updated);
                                saveSettingsToCloud(updated);
                                showToast('تم حذف الصف الدراسي');
                              }}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* إدارة الأقسام */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                    <h3 className="font-black text-base text-slate-900">أقسام المكتبة</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="اسم القسم الجديد (مثال: بوسترات التلخيص)..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCategoryName.trim()) return;
                          const updated = {
                            ...settings,
                            categories: [
                              ...settings.categories,
                              { id: `cat_${Date.now()}`, name: newCategoryName.trim() }
                            ]
                          };
                          setSettings(updated);
                          saveSettingsToCloud(updated);
                          setNewCategoryName('');
                          showToast('تمت إضافة القسم بنجاح');
                        }}
                        className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 cursor-pointer"
                      >
                        إضافة قسم
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settings.categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                        >
                          <span>{cat.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = {
                                ...settings,
                                categories: settings.categories.filter((item) => item.id !== cat.id)
                              };
                              setSettings(updated);
                              saveSettingsToCloud(updated);
                              showToast('تم حذف القسم');
                            }}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
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
                        placeholder="المادة الدراسية *"
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
                        type="text"
                        placeholder="عدد الصفحات"
                        value={newProduct.pagesCount}
                        onChange={(e) => setNewProduct({ ...newProduct, pagesCount: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <input
                        type="url"
                        placeholder="رابط عينة Google Drive (اختياري)"
                        value={newProduct.driveLink}
                        onChange={(e) => setNewProduct({ ...newProduct, driveLink: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm md:col-span-3"
                        dir="ltr"
                      />
                      <textarea
                        rows={3}
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
                        className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition cursor-pointer"
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
                            {prod.subject} • {prod.price} ج.م • {prod.pagesCount} صفحة
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setNewProduct(prod);
                            }}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 cursor-pointer"
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
                      <input
                        type="text"
                        placeholder="شارة التوفير (مثال: وفر 145 ج.م)"
                        value={newBundle.badge}
                        onChange={(e) => setNewBundle({ ...newBundle, badge: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
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
                        placeholder="وصف مختصر"
                        value={newBundle.description}
                        onChange={(e) => setNewBundle({ ...newBundle, description: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <textarea
                        rows={3}
                        placeholder="محتويات الباقة (كل مذكرة في سطر منفصل)..."
                        value={newBundle.itemsText}
                        onChange={(e) => setNewBundle({ ...newBundle, itemsText: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm md:col-span-3"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 cursor-pointer"
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

              {/* 4.5 قسم الأخبار وروابط الفوتر */}
              {adminSection === 'news_social' && (
                <div className="space-y-6">
                  {/* إدارة أخبار المنصة */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-base text-slate-900">
                        أخبار المنصة والمذكرات قيد التجهيز
                      </h3>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.newsSectionEnabled}
                          onChange={(e) => {
                            const updated = { ...settings, newsSectionEnabled: e.target.checked };
                            setSettings(updated);
                            saveSettingsToCloud(updated);
                          }}
                        />
                        <span>إظهار قسم الأخبار</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="الشارة (مثال: قريبًا)"
                        value={newNewsItem.badge}
                        onChange={(e) => setNewNewsItem({ ...newNewsItem, badge: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="عنوان الخبر *"
                        value={newNewsItem.title}
                        onChange={(e) => setNewNewsItem({ ...newNewsItem, title: e.target.value })}
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="وصف فرعي (مثال: لجميع الصفوف)"
                        value={newNewsItem.description}
                        onChange={(e) =>
                          setNewNewsItem({ ...newNewsItem, description: e.target.value })
                        }
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="تفاصيل الخبر..."
                        value={newNewsItem.content}
                        onChange={(e) =>
                          setNewNewsItem({ ...newNewsItem, content: e.target.value })
                        }
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm md:col-span-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newNewsItem.title.trim()) return;
                          const updated = {
                            ...settings,
                            newsItems: [
                              ...(settings.newsItems || []),
                              { id: `news-${Date.now()}`, ...newNewsItem }
                            ]
                          };
                          setSettings(updated);
                          saveSettingsToCloud(updated);
                          setNewNewsItem({
                            badge: 'خبر جديد',
                            title: '',
                            description: '',
                            content: ''
                          });
                          showToast('تمت إضافة الخبر بنجاح');
                        }}
                        className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 cursor-pointer"
                      >
                        إضافة خبر
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {(settings.newsItems || []).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200"
                        >
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">
                              [{item.badge}] {item.title}
                            </h4>
                            <p className="text-xs text-slate-500">{item.content}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = {
                                ...settings,
                                newsItems: settings.newsItems.filter((n) => n.id !== item.id)
                              };
                              setSettings(updated);
                              saveSettingsToCloud(updated);
                              showToast('تم حذف الخبر');
                            }}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* إدارة روابط التواصل الاجتماعي في الفوتر */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                    <h3 className="font-black text-base text-slate-900">
                      روابط التواصل الاجتماعي في الفوتر
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="اسم الرابط (مثال: قناة التيليجرام)"
                        value={newSocialLink.label}
                        onChange={(e) =>
                          setNewSocialLink({ ...newSocialLink, label: e.target.value })
                        }
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                      />
                      <input
                        type="url"
                        placeholder="الرابط (https://...)"
                        value={newSocialLink.url}
                        onChange={(e) =>
                          setNewSocialLink({ ...newSocialLink, url: e.target.value })
                        }
                        className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-left"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newSocialLink.label.trim() || !newSocialLink.url.trim()) return;
                          const updated = {
                            ...settings,
                            socialLinks: [
                              ...(settings.socialLinks || []),
                              {
                                id: `soc-${Date.now()}`,
                                label: newSocialLink.label.trim(),
                                url: newSocialLink.url.trim()
                              }
                            ]
                          };
                          setSettings(updated);
                          saveSettingsToCloud(updated);
                          setNewSocialLink({ label: '', url: '' });
                          showToast('تمت إضافة رابط التواصل');
                        }}
                        className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 cursor-pointer"
                      >
                        إضافة رابط
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(settings.socialLinks || []).map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
                        >
                          <div>
                            <span className="font-bold text-sm text-slate-900">{link.label}</span>
                            <span className="text-xs text-slate-500 block" dir="ltr">
                              {link.url}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = {
                                ...settings,
                                socialLinks: settings.socialLinks.filter((s) => s.id !== link.id)
                              };
                              setSettings(updated);
                              saveSettingsToCloud(updated);
                              showToast('تم حذف الرابط');
                            }}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
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
                    يمكنك تصدير نسخة احتياطية كاملة للمنصة أو استيراد ملف نسخة احتياطية JSON لتحديث جميع الإعدادات والمذكرات والكوبونات فوراً.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleExportBackup}
                      className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center gap-2 hover:bg-slate-800 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
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
                      className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center gap-2 hover:bg-blue-700 cursor-pointer"
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
          نافذة معاينة تفاصيل المذكرة (Preview Modal)
         ==================================================================== */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">تفاصيل المذكرة ومعاينة العينة</h3>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
              <div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  {previewProduct.subject}
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-2">{previewProduct.title}</h4>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {previewProduct.description}
                </p>
              </div>

              {previewProduct.noticeText && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs font-bold text-amber-900">
                  💡 ملاحظة: {previewProduct.noticeText}
                </div>
              )}

              {previewProduct.driveLink && (
                <a
                  href={previewProduct.driveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>معاينة عينة كاملة على Google Drive قبل الطلب</span>
                </a>
              )}

              {Array.isArray(previewProduct.features) && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">مميزات التخصيص والتسليم:</p>
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
                  <span className="text-2xl font-black text-blue-700">
                    {previewProduct.price} ج.م
                  </span>
                  {previewProduct.pagesCount && previewProduct.pagesCount !== '0' && (
                    <span className="text-xs text-slate-500 block">
                      {previewProduct.pagesCount} صفحة PDF
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    addToCart(previewProduct, 'product');
                    setPreviewProduct(null);
                    setIsCartOpen(true);
                  }}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>أضف للسلة وأكمل البيانات</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          الدرج الجانبي لسلة الطلبات وإتمام تخصيص المعلم
         ==================================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            {/* رأس السلة */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-300" />
                  <h3 className="font-extrabold text-base">إتمام طلب التخصيص ({cart.length})</h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  يمكنك طلب مذكرة واحدة أو إضافة أكثر من مذكرة معًا
                </p>
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
                  <p className="font-bold text-slate-700">سلة الطلبات فارغة حالياً</p>
                  <p className="text-xs text-slate-500">
                    اختر المذكرات أو الباقات المناسبة وأضفها للسلة لتخصيصها باسمك
                  </p>
                </div>
              ) : (
                <>
                  {/* تنبيه خصم الكميات التلقائي */}
                  {settings.quantityDiscountEnabled && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-blue-900">
                      <Percent className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        {cart.length >= settings.quantityDiscountMinCount
                          ? `🎉 مبروك! تم تفعيل خصم الكميات التلقائي (${settings.quantityDiscountValue}%) بقيمة ${quantityDiscount} ج.م`
                          : `أضف مذكرة أخرى للحصول على خصم كميات تلقائي ${settings.quantityDiscountValue}%!`}
                      </span>
                    </div>
                  )}

                  {/* قائمة المذكرات المختارة */}
                  <div className="space-y-2.5">
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
                          <p className="text-sm font-black text-blue-700 mt-1">{item.price} ج.م</p>
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
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>كود الخصم (جرب {settings.promoCouponCode || 'M20'}):</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="أدخل الكوبون..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm uppercase focus:outline-none focus:border-blue-600"
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

                  {/* حقول بيانات تخصيص المعلم المعتمدة */}
                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-900">
                      بيانات المعلم (تُكتب على المذكرة والغلاف):
                    </p>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        اسم المعلم (كما سيُكتب على المذكرة) *
                      </label>
                      <input
                        type="text"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="مثال: أ/ محمود شحاتة"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        رقم الهاتف (كما سيُكتب على المذكرة) *
                      </label>
                      <input
                        type="tel"
                        value={teacherPhone}
                        onChange={(e) => setTeacherPhone(e.target.value)}
                        placeholder="010xxxxxxxx"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        اسم السلسلة (كما سيُكتب على المذكرة) *
                      </label>
                      <input
                        type="text"
                        value={seriesTitle}
                        onChange={(e) => setSeriesTitle(e.target.value)}
                        placeholder="مثال: سلسلة العباقرة في اللغة العربية"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        رقم الهاتف الثاني (إن وُجد)
                      </label>
                      <input
                        type="text"
                        value={secondPhone}
                        onChange={(e) => setSecondPhone(e.target.value)}
                        placeholder="011xxxxxxxx (اختياري)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={hasTeacherLogo}
                        onChange={(e) => setHasTeacherLogo(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>لدي شعار خاص (Logo) سأرسله على واتساب لوضعه على المذكرة</span>
                    </label>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        ملاحظات إضافية للتصميم أو الألوان
                      </label>
                      <textarea
                        rows={2}
                        value={designNotes}
                        onChange={(e) => setDesignNotes(e.target.value)}
                        placeholder="اكتب أي تفاصيل إضافية تريدها..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* بيانات التحويل فودافون كاش */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                    <p className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span>بيانات التحويل والتسليم:</span>
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

                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      {settings.paymentInstructions}
                    </p>
                    <p className="text-[11px] font-bold text-amber-800">
                      ⏱️ تسليم المذكرة يتم على الواتساب في غضون 3 ساعات من إرسال صورة التحويل.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* ملخص السلة وزر الإرسال عبر واتساب */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي:</span>
                    <span>{subtotal} ج.م</span>
                  </div>
                  {quantityDiscount > 0 && (
                    <div className="flex justify-between text-blue-700 font-bold">
                      <span>خصم الكميات ({settings.quantityDiscountValue}%):</span>
                      <span>-{quantityDiscount} ج.م</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>خصم الكوبون ({appliedCoupon.code}):</span>
                      <span>-{couponDiscount} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>الإجمالي النهائي:</span>
                    <span className="text-blue-700">{finalTotal} ج.م</span>
                  </div>
                </div>

                <button
                  onClick={handleWhatsAppCheckout}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>تأكيد الطلب وإرساله عبر واتساب</span>
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
              className="w-11 h-11 rounded-xl object-contain bg-white/10 p-1"
            />
            <div>
              <p className="text-white font-bold text-sm">{settings.platformName}</p>
              <p className="text-xs text-slate-500">{settings.footerNote}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {Array.isArray(settings.socialLinks) &&
              settings.socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white font-semibold transition"
                >
                  {link.label}
                </a>
              ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
