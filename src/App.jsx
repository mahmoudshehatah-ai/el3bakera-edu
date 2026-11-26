import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import {
  BookOpen,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Plus,
  X,
  Search,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  Lock,
  LogOut,
  ShieldCheck,
  Layers,
  Percent,
  Settings,
  Sparkles,
  Clock,
  PackageCheck,
  Download,
  Upload,
  Tag,
  Gift,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Folder,
  FolderOpen,
  Bell,
  Megaphone,
  FileText,
  Image as ImageIcon,
  Phone,
  Home,
  Star,
  Sliders
} from 'lucide-react';

// ============================================================================
// 1. تهيئة Firebase الثابتة والمستقرة لمشروع el3bakera-edu
// ============================================================================
const LS_FIREBASE_CFG_KEY = 'el3bakera_firebase_custom_cfg_v1';

const getEnvVar = (key) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch {}
  return '';
};

const firebaseConfig = (() => {
  // 1. الأولوية لبيئة المعاينة المدمجة إن وجدت
  try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      const parsed = JSON.parse(__firebase_config);
      if (parsed && parsed.apiKey && parsed.apiKey.startsWith('AIza')) return parsed;
    }
  } catch {}

  // 2. الإعدادات الرسمية الثابتة لمشروع el3bakera-edu (تعمل تلقائيًا على كل الأجهزة والهواتف)
  return {
    apiKey: "AIzaSyD_du5VY8nJGDJ169Fof9EAlI9x2W2d-14",
    authDomain: "el3bakera-edu.firebaseapp.com",
    projectId: "el3bakera-edu",
    storageBucket: "el3bakera-edu.firebasestorage.app",
    messagingSenderId: "74663879858",
    appId: "1:74663879858:web:4327c0ea1b825dd6c615ab"
  };
})();

const isUsingEnvConfig = true;
const hasValidFirebaseKey = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith('AIza'));

const appId = typeof __app_id !== 'undefined' && __app_id ? __app_id : 'el3bakera-edu';
const ADMIN_EMAIL = 'mahmoudelzaaty7@gmail.com';

// إنشاء مثيل تطبيق Firebase باسم مستقل لتجاوز أي تهيئة قديمة بمفتاح خاطئ في المشروع
const INSTANCE_NAME = 'el3bakera-edu-live';
const existingInstance = getApps().find((a) => a.name === INSTANCE_NAME);
const firebaseApp = existingInstance || initializeApp(firebaseConfig, INSTANCE_NAME);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// مسارات Firestore الموحدة والثابتة
const publicCol = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);
const publicDoc = (colName, docId) => doc(db, 'artifacts', appId, 'public', 'data', colName, docId);

// مفاتيح التخزين المحلي للنسخ الاحتياطي السريع
const LS_SETTINGS_KEY = 'el3bakera_settings_v4';
const LS_NOTEBOOKS_KEY = 'el3bakera_notebooks_v4';

// ============================================================================
// 2. القيم الافتراضية ودوال التطبيع وضغط الصور
// ============================================================================
const DEFAULT_STAGE_GRADES = {
  'المرحلة الابتدائية': ['الصف الرابع الابتدائي', 'الصف الخامس الابتدائي', 'الصف السادس الابتدائي'],
  'المرحلة الإعدادية': ['الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي'],
  'المرحلة الثانوية': ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي']
};

const DEFAULT_ORDER_FIELDS = [
  { id: 'teacherName', label: 'اسم المعلم / السنتر (ليُطبع على الغلاف)', placeholder: 'مثال: أ/ محمود الزعاتي', type: 'text', required: true, visible: true },
  { id: 'phone', label: 'رقم الواتساب للتواصل واستلام المذكرة', placeholder: '010xxxxxxxx', type: 'tel', required: true, visible: true },
  { id: 'coverPhone', label: 'رقم الهاتف المراد طباعته داخل المذكرة (إن وجد)', placeholder: '010xxxxxxxx', type: 'tel', required: false, visible: true },
  { id: 'governorate', label: 'المحافظة', placeholder: 'اكتب محافظتك...', type: 'text', required: false, visible: true },
  { id: 'logoFile', label: 'شعار المعلم أو السنتر (اختياري)', placeholder: 'اختر صورة الشعار', type: 'file', required: false, visible: true },
  { id: 'notes', label: 'ملاحظات إضافية على التصميم أو الطلب', placeholder: 'أي تفاصيل إضافية تريد إضافتها...', type: 'textarea', required: false, visible: true }
];

const DEFAULT_SETTINGS = {
  siteName: 'منصة العباقرة للمذكرات التعليمية',
  siteSubtitle: 'مذكرات دراسية احترافية مخصصة باسمك وبياناتك الخاصة',
  logoUrl: '',
  logoSize: 48,
  heroBadge: 'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroDesc: 'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة اسم المعلم، رقم الهاتف، والشعار الخاص به على الغلاف وجميع الصفحات.',
  heroBgImage: '',
  heroBgOpacity: 35,
  heroOverlayColor: '#090d16',
  heroOverlayOpacity: 82,
  heroBgFit: 'cover',
  heroHeight: 540,
  promoBarEnabled: true,
  promoBarText: '🎉 عرض خاص للمعلمين: خصم 15% على جميع مذكرات الترم الأول + إضافة الشعار مجانًا لفترة محدودة!',
  promoBarCouponCode: 'EL3B15',
  promoBarCopyLabel: 'انسخ الكوبون',
  promoBarTheme: 'slate', // 'slate' | 'blue' | 'emerald' | 'rose' | 'purple'
  trustCardEnabled: true,
  trustCardTitle: 'لماذا يثق بنا المعلمون؟',
  trustCardPoints: [
    'محتوى علمي منقح ومطابق لأحدث مواصفات الوزارة',
    'وضع اسم المعلم ورقم الهاتف والشعار على جميع الصفحات',
    'معاينة حقيقية لصفحات المذكرة قبل تأكيد الطلب',
    'تسليم سريع بصيغة PDF عالية الدقة جاهزة للطباعة'
  ],
  categories: ['مذكرات الترم الأول', 'مذكرات الترم الثاني', 'كورسات التأسيس'],
  categoryImages: {},
  stages: ['المرحلة الابتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية'],
  stageGrades: DEFAULT_STAGE_GRADES,
  subjects: ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية'],
  // قسم ما الجديد في الصفحة الرئيسية
  whatsNewEnabled: true,
  whatsNewTitle: 'ما الجديد؟ أحدث المذكرات والإصدارات',
  whatsNewSubtitle: 'اطّلع على أحدث المذكرات المضافة حديثًا وفق أحدث تعديلات المناهج',
  whatsNewMode: 'auto', // 'auto' | 'manual'
  whatsNewCount: 6,
  whatsNewSelectedIds: [],
  // قسم الأخبار والإعلانات والمذكرات قيد التجهيز
  newsSectionEnabled: true,
  newsSectionTitle: 'أخبار المنصة والمذكرات قيد التجهيز',
  newsSectionSubtitle: 'تابع أحدث الإعلانات والمذكرات الجاري إعدادها للحجز المسبق',
  newsItems: [
    {
      id: 'news-1',
      badge: 'قريبًا جدًا',
      title: 'جاري الانتهاء من مراجعات ليلة الامتحان لجميع الصفوف',
      content: 'نعمل حاليًا على تنسيق ومراجعة باقة مراجعات ليلة الامتحان بنظام البوكليت الحديث، يمكنك الحجز المسبق الآن.',
      color: 'amber'
    }
  ],
  // تنبيهات صفحة كل مذكرة
  notebookNoticeEnabled: true,
  notebookNoticeTitle: 'تنبيه هام قبل تأكيد الطلب',
  notebookNoticeText: 'يتم تجهيز المذكرة باسمك ورقم هاتفك وشعارك الخاص على الغلاف وجميع الصفحات خلال 24 ساعة من تأكيد الطلب، وتُسلَّم بصيغة PDF عالية الدقة جاهزة للطباعة فورًا.',
  // إعدادات زر وأيقونة Google Drive داخل صفحة المذكرة
  driveButtonText: 'معاينة نسخة كاملة على Google Drive',
  driveButtonSubtext: 'اضغط لتصفح الملف بجودة عالية مباشرة',
  driveButtonTheme: 'emerald', // 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate'
  // ترتيب أماكن العناصر داخل نافذة تفاصيل المذكرة
  notebookModalBlocksOrder: ['description', 'customNotice', 'generalNotice', 'driveButton'],
  // إعدادات نموذج الطلب
  orderModalTitle: 'إتمام طلب تخصيص المذكرات',
  orderModalSubtitle: 'أدخل بياناتك ليتم طباعتها باحترافية على غلاف وصفحات المذكرة',
  orderSubmitText: 'تأكيد الطلب وإرساله عبر واتساب',
  orderSuccessMessage: 'تم تسجيل طلبك بنجاح! احتفظ برقم الطلب لمتابعة حالة التجهيز.',
  orderEnableCoupons: true,
  orderEnableMultiCart: true,
  orderFormFields: DEFAULT_ORDER_FIELDS,
  // مكافأة الطلب القادم (كوبون فريد لكل عميل لمرة واحدة)
  nextOrderRewardEnabled: true,
  nextOrderRewardMode: 'auto', // 'auto' | 'custom'
  nextOrderRewardCustomCode: '',
  nextOrderRewardDiscountType: 'percent', // 'percent' | 'amount'
  nextOrderRewardPercent: 15,
  nextOrderRewardTitle: 'هدية خاصة لطلبك القادم!',
  nextOrderRewardDesc: 'احتفظ بهذا الكوبون واستخدمه للحصول على خصم خاص عند طلبك القادم:',
  // مجموعات وباقات الخصم
  bundles: [],
  // التواصل والدفع
  whatsappNumber: '201000000000',
  facebookUrl: '',
  whatsappGroupUrl: '',
  telegramUrl: '',
  socialLinks: [
    {
      id: 'soc-wa-direct',
      platform: 'whatsapp',
      title: 'محادثة واتساب مباشرة',
      subtitle: 'تواصل فوري مع إدارة المنصة',
      url: 'https://wa.me/201068481536',
      visible: true
    }
  ],
  paymentInstructions: 'يتم تأكيد الطلب عبر واتساب وتحويل قيمة المذكرات عبر فودافون كاش أو إنستا باي قبل بدء التجهيز.',
  emptyStateTitle: 'لا توجد مذكرات منشورة في هذا القسم حاليًا',
  emptyStateDesc: 'نعمل حاليًا على تجهيز ومراجعة أحدث المذكرات لهذا الصف، يمكنك طلب حجز مسبق وسنتواصل معك فور جاهزيتها.',
  emptyStateCta: 'اطلب حجز مسبق الآن',
  emptyStateImage: ''
};

// تطبيع النصوص لمنع أي خطأ React #31 إذا كان العنصر كائنًا قديمًا
const toCleanString = (val) => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (val && typeof val === 'object') return String(val.name || val.title || val.label || '');
  return '';
};

const toCleanStringArray = (arr, fallback = []) => {
  if (!Array.isArray(arr)) return fallback;
  return arr.map(toCleanString).filter(Boolean);
};

const normalizeSettings = (raw = {}) => {
  const merged = { ...DEFAULT_SETTINGS, ...(raw || {}) };
  merged.categories = toCleanStringArray(merged.categories, DEFAULT_SETTINGS.categories);
  merged.stages = toCleanStringArray(merged.stages, DEFAULT_SETTINGS.stages);
  merged.subjects = toCleanStringArray(merged.subjects, DEFAULT_SETTINGS.subjects);
  merged.trustCardPoints = toCleanStringArray(merged.trustCardPoints, DEFAULT_SETTINGS.trustCardPoints);

  const normalizedStageGrades = {};
  merged.stages.forEach((st) => {
    const existing = merged.stageGrades && Array.isArray(merged.stageGrades[st]) ? merged.stageGrades[st] : [];
    normalizedStageGrades[st] = existing.length
      ? toCleanStringArray(existing)
      : (DEFAULT_STAGE_GRADES[st] || []);
  });
  merged.stageGrades = normalizedStageGrades;

  merged.logoUrl = merged.logoUrl || raw?.brandLogo || raw?.logoData || '';
  merged.heroBgImage = merged.heroBgImage || raw?.heroBgUrl || raw?.heroBg || '';
  merged.categoryImages = merged.categoryImages && typeof merged.categoryImages === 'object' ? merged.categoryImages : {};
  merged.orderFormFields = Array.isArray(merged.orderFormFields) && merged.orderFormFields.length
    ? merged.orderFormFields
    : DEFAULT_ORDER_FIELDS;
  merged.newsItems = Array.isArray(merged.newsItems) ? merged.newsItems : [];
  merged.bundles = Array.isArray(merged.bundles) ? merged.bundles : [];
  merged.whatsNewSelectedIds = Array.isArray(merged.whatsNewSelectedIds) ? merged.whatsNewSelectedIds : [];

  // تطبيع قائمة روابط التواصل الاجتماعي مع الحفاظ على التوافق مع الحقول السابقة
  if (Array.isArray(raw?.socialLinks) && raw.socialLinks.length > 0) {
    merged.socialLinks = raw.socialLinks;
  } else {
    const migrated = [];
    const cleanWa = String(merged.whatsappNumber || '').replace(/[^\d]/g, '');
    if (cleanWa) {
      migrated.push({
        id: 'soc-wa',
        platform: 'whatsapp',
        title: 'محادثة واتساب مباشرة',
        subtitle: `+${cleanWa}`,
        url: `https://wa.me/${cleanWa}`,
        visible: true
      });
    }
    if (merged.whatsappGroupUrl) {
      migrated.push({
        id: 'soc-wagroup',
        platform: 'whatsapp_group',
        title: 'جروب المعلمين على واتساب',
        subtitle: 'تابع أحدث المذكرات والعروض',
        url: merged.whatsappGroupUrl,
        visible: true
      });
    }
    if (merged.facebookUrl) {
      migrated.push({
        id: 'soc-fb',
        platform: 'facebook',
        title: 'صفحتنا الرسمية على فيسبوك',
        subtitle: 'تواصل عبر ماسنجر وتابع المنشورات',
        url: merged.facebookUrl,
        visible: true
      });
    }
    if (merged.telegramUrl) {
      migrated.push({
        id: 'soc-tg',
        platform: 'telegram',
        title: 'قناتنا على تليجرام',
        subtitle: 'عينات مجانية وإشعارات الإصدارات',
        url: merged.telegramUrl,
        visible: true
      });
    }
    merged.socialLinks = migrated.length ? migrated : DEFAULT_SETTINGS.socialLinks;
  }

  return merged;
};

// اكتشاف المنصة وأيقونتها ولونها تلقائيًا من الرابط أو النوع المختار
const detectSocialPlatform = (url = '', explicitPlatform = '') => {
  const u = String(url || '').toLowerCase();
  const p = String(explicitPlatform || '').toLowerCase();
  if (p === 'whatsapp_group' || u.includes('chat.whatsapp.com')) return 'whatsapp_group';
  if (p === 'whatsapp' || u.includes('wa.me') || u.includes('whatsapp.com')) return 'whatsapp';
  if (p === 'facebook' || u.includes('facebook.com') || u.includes('fb.com') || u.includes('m.me')) return 'facebook';
  if (p === 'telegram' || u.includes('t.me') || u.includes('telegram.me')) return 'telegram';
  if (p === 'youtube' || u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (p === 'instagram' || u.includes('instagram.com')) return 'instagram';
  if (p === 'tiktok' || u.includes('tiktok.com')) return 'tiktok';
  if (p === 'phone' || u.startsWith('tel:')) return 'phone';
  return p && p !== 'auto' ? p : 'website';
};

const formatSocialHref = (url = '', platform = '') => {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^(https?:\/\/|tel:|mailto:)/i.test(raw)) return raw;
  const digits = raw.replace(/[^\d]/g, '');
  if (platform === 'whatsapp' && digits) return `https://wa.me/${digits}`;
  if (platform === 'phone' && digits) return `tel:+${digits}`;
  return `https://${raw}`;
};

const getDefaultSocialMeta = (platform = '') => {
  switch (platform) {
    case 'whatsapp':
      return {
        title: 'محادثة واتساب مباشرة',
        subtitle: 'تواصل فوري واستفسر عن المذكرات',
        cardBg: 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-200/80 hover:border-emerald-400',
        arrowColor: 'text-emerald-600'
      };
    case 'whatsapp_group':
      return {
        title: 'جروب المعلمين على واتساب',
        subtitle: 'انضم لمتابعة أحدث المذكرات والعروض',
        cardBg: 'bg-teal-50/70 hover:bg-teal-50 border-teal-200/80 hover:border-teal-400',
        arrowColor: 'text-teal-600'
      };
    case 'facebook':
      return {
        title: 'صفحتنا الرسمية على فيسبوك',
        subtitle: 'تابع المنشورات وتواصل عبر ماسنجر',
        cardBg: 'bg-blue-50/70 hover:bg-blue-50 border-blue-200/80 hover:border-blue-400',
        arrowColor: 'text-blue-600'
      };
    case 'telegram':
      return {
        title: 'قناتنا الرسمية على تليجرام',
        subtitle: 'عينات مجانية وإشعارات الإصدارات الجديدة',
        cardBg: 'bg-sky-50/70 hover:bg-sky-50 border-sky-200/80 hover:border-sky-400',
        arrowColor: 'text-sky-600'
      };
    case 'youtube':
      return {
        title: 'قناتنا على يوتيوب',
        subtitle: 'شروحات ومراجعات مصورة للمذكرات',
        cardBg: 'bg-rose-50/70 hover:bg-rose-50 border-rose-200/80 hover:border-rose-400',
        arrowColor: 'text-rose-600'
      };
    case 'instagram':
      return {
        title: 'حسابنا على إنستجرام',
        subtitle: 'أحدث التصميمات والأغلفة الاحترافية',
        cardBg: 'bg-pink-50/70 hover:bg-pink-50 border-pink-200/80 hover:border-pink-400',
        arrowColor: 'text-pink-600'
      };
    case 'tiktok':
      return {
        title: 'حسابنا على تيك توك',
        subtitle: 'مقاطع سريعة ونماذج من المذكرات',
        cardBg: 'bg-slate-100/80 hover:bg-slate-100 border-slate-300/80 hover:border-slate-500',
        arrowColor: 'text-slate-700'
      };
    case 'phone':
      return {
        title: 'اتصال هاتفي مباشر',
        subtitle: 'يسعدنا الرد على استفساراتكم هاتفيًا',
        cardBg: 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-400',
        arrowColor: 'text-slate-700'
      };
    default:
      return {
        title: 'رابط تواصل خارجي',
        subtitle: 'اضغط للانتقال المباشر',
        cardBg: 'bg-indigo-50/60 hover:bg-indigo-50 border-indigo-200/80 hover:border-indigo-400',
        arrowColor: 'text-indigo-600'
      };
  }
};

function SocialPlatformBadge({ platform, size = 'md' }) {
  const boxCls = size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl';
  const iconCls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  switch (platform) {
    case 'whatsapp':
      return (
        <span className={`${boxCls} bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm`}>
          <MessageCircle className={iconCls} />
        </span>
      );
    case 'whatsapp_group':
      return (
        <span className={`${boxCls} bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm`}>
          <Layers className={iconCls} />
        </span>
      );
    case 'facebook':
      return (
        <span className={`${boxCls} bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-base`}>
          f
        </span>
      );
    case 'telegram':
      return (
        <span className={`${boxCls} bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm`}>
          <ExternalLink className={iconCls} />
        </span>
      );
    case 'youtube':
      return (
        <span className={`${boxCls} bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm`}>
          <Eye className={iconCls} />
        </span>
      );
    case 'instagram':
      return (
        <span className={`${boxCls} bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm`}>
          <ImageIcon className={iconCls} />
        </span>
      );
    case 'tiktok':
      return (
        <span className={`${boxCls} bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm`}>
          <Sparkles className={iconCls} />
        </span>
      );
    case 'phone':
      return (
        <span className={`${boxCls} bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm`}>
          <Phone className={iconCls} />
        </span>
      );
    default:
      return (
        <span className={`${boxCls} bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm`}>
          <ExternalLink className={iconCls} />
        </span>
      );
  }
}

// ============================================================================
// 3. دوال مساعدة (ضغط الصور، تطبيع المذكرات، توليد الأكواد)
// ============================================================================
const compressImageFile = (file, maxWidth = 950, quality = 0.78) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
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
    } catch (err) {
      reject(err);
    }
  });

const normalizeNotebook = (raw = {}, id = '') => ({
  id: id || raw.id || '',
  title: toCleanString(raw.title),
  category: toCleanString(raw.category),
  stage: toCleanString(raw.stage),
  grade: toCleanString(raw.grade),
  subject: toCleanString(raw.subject),
  price: Number(raw.price) || 0,
  oldPrice: Number(raw.oldPrice) || 0,
  pagesCount: Number(raw.pagesCount) || 0,
  badge: toCleanString(raw.badge),
  description: toCleanString(raw.description),
  customNoticeTitle: toCleanString(raw.customNoticeTitle),
  customNotice: toCleanString(raw.customNotice),
  customNoticeBadge: toCleanString(raw.customNoticeBadge),
  customNoticeTheme: toCleanString(raw.customNoticeTheme) || 'amber',
  driveLink: toCleanString(raw.driveLink),
  coverUrl: toCleanString(raw.coverUrl),
  sampleUrls: Array.isArray(raw.sampleUrls) ? raw.sampleUrls : [],
  samplesChunksCount: Number(raw.samplesChunksCount) || 0,
  isComingSoon: Boolean(raw.isComingSoon),
  visible: raw.visible !== false,
  createdAt: raw.createdAt || null
});

const generateUniqueCouponCode = (prefix = 'EL3B') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${rand}`;
};

// ============================================================================
// 4. حاجز الأخطاء (ErrorBoundary) لمنع الشاشة البيضاء
// ============================================================================
class ErrorBoundary extends React.Component {
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
        <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h2 className="text-xl font-black">حدث خطأ مؤقت في العرض</h2>
            <p className="text-xs text-slate-400">{this.state.errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm"
            >
              إعادة تحميل المنصة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 5. نافذة معاينة المذكرة المحمية (ProtectedPreviewModal)
// ============================================================================
function ProtectedPreviewModal({ notebook, settings, onClose, onAddToCart, onOrderNow, isInCart }) {
  const [samples, setSamples] = useState([]);
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const allImages = useMemo(() => {
    const list = [];
    if (notebook?.coverUrl) list.push(notebook.coverUrl);
    if (Array.isArray(samples) && samples.length > 0) {
      samples.forEach((s) => {
        if (s && s !== notebook?.coverUrl) list.push(s);
      });
    } else if (Array.isArray(notebook?.sampleUrls)) {
      notebook.sampleUrls.forEach((s) => {
        if (s && s !== notebook?.coverUrl) list.push(s);
      });
    }
    return list;
  }, [notebook, samples]);

  useEffect(() => {
    let active = true;
    const loadSamples = async () => {
      if (!notebook?.id) {
        setLoadingSamples(false);
        return;
      }
      setLoadingSamples(true);
      try {
        const collected = [];
        const baseSnap = await getDoc(publicDoc('notebook_samples', notebook.id));
        if (baseSnap.exists() && Array.isArray(baseSnap.data()?.urls)) {
          collected.push(...baseSnap.data().urls);
        }
        const chunksCount = Number(notebook.samplesChunksCount) || 5;
        for (let i = 0; i < chunksCount; i++) {
          const chunkSnap = await getDoc(publicDoc('notebook_samples', `${notebook.id}_chunk_${i}`));
          if (chunkSnap.exists() && Array.isArray(chunkSnap.data()?.urls)) {
            collected.push(...chunkSnap.data().urls);
          } else if (i > 0 && !chunkSnap.exists()) {
            break;
          }
        }
        if (active && collected.length > 0) {
          setSamples(collected);
        }
      } catch (err) {
        console.warn('Sample fetch warning:', err);
      } finally {
        if (active) setLoadingSamples(false);
      }
    };
    loadSamples();
    return () => {
      active = false;
    };
  }, [notebook]);

  if (!notebook) return null;

  const blocksOrder = Array.isArray(settings.notebookModalBlocksOrder) && settings.notebookModalBlocksOrder.length
    ? settings.notebookModalBlocksOrder
    : ['description', 'customNotice', 'generalNotice', 'driveButton'];

  const noticeLines = String(settings.notebookNoticeText || '')
    .split(/\n|(?:\s+-\s+)/)
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  const noticeThemes = {
    rose: {
      box: 'bg-gradient-to-l from-rose-50 via-white to-rose-50/40 border-rose-200 border-r-rose-600',
      icon: 'bg-rose-600 text-white',
      title: 'text-rose-950',
      badge: 'bg-rose-600 text-white'
    },
    amber: {
      box: 'bg-gradient-to-l from-amber-50 via-white to-amber-50/40 border-amber-200 border-r-amber-500',
      icon: 'bg-amber-500 text-slate-950',
      title: 'text-amber-950',
      badge: 'bg-amber-500 text-slate-950'
    },
    blue: {
      box: 'bg-gradient-to-l from-blue-50 via-white to-blue-50/40 border-blue-200 border-r-blue-600',
      icon: 'bg-blue-600 text-white',
      title: 'text-blue-950',
      badge: 'bg-blue-600 text-white'
    },
    emerald: {
      box: 'bg-gradient-to-l from-emerald-50 via-white to-emerald-50/40 border-emerald-200 border-r-emerald-600',
      icon: 'bg-emerald-600 text-white',
      title: 'text-emerald-950',
      badge: 'bg-emerald-600 text-white'
    },
    purple: {
      box: 'bg-gradient-to-l from-purple-50 via-white to-purple-50/40 border-purple-200 border-r-purple-600',
      icon: 'bg-purple-600 text-white',
      title: 'text-purple-950',
      badge: 'bg-purple-600 text-white'
    }
  };

  const cTheme = noticeThemes[notebook.customNoticeTheme] || noticeThemes.amber;

  const driveThemes = {
    emerald: {
      card: 'bg-emerald-50/80 hover:bg-emerald-100/80 border-emerald-200 hover:border-emerald-400',
      iconBox: 'bg-emerald-600 text-white',
      title: 'text-emerald-950',
      sub: 'text-emerald-700'
    },
    blue: {
      card: 'bg-blue-50/80 hover:bg-blue-100/80 border-blue-200 hover:border-blue-400',
      iconBox: 'bg-blue-600 text-white',
      title: 'text-blue-950',
      sub: 'text-blue-700'
    },
    amber: {
      card: 'bg-amber-50/80 hover:bg-amber-100/80 border-amber-200 hover:border-amber-400',
      iconBox: 'bg-amber-500 text-slate-950',
      title: 'text-amber-950',
      sub: 'text-amber-700'
    },
    rose: {
      card: 'bg-rose-50/80 hover:bg-rose-100/80 border-rose-200 hover:border-rose-400',
      iconBox: 'bg-rose-600 text-white',
      title: 'text-rose-950',
      sub: 'text-rose-700'
    },
    purple: {
      card: 'bg-purple-50/80 hover:bg-purple-100/80 border-purple-200 hover:border-purple-400',
      iconBox: 'bg-purple-600 text-white',
      title: 'text-purple-950',
      sub: 'text-purple-700'
    },
    slate: {
      card: 'bg-slate-100 hover:bg-slate-200/80 border-slate-300 hover:border-slate-500',
      iconBox: 'bg-slate-900 text-white',
      title: 'text-slate-950',
      sub: 'text-slate-600'
    }
  };
  const dTheme = driveThemes[settings.driveButtonTheme] || driveThemes.emerald;

  return (
    <div
      dir="rtl"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col"
      >
        {/* رأس نافذة المعاينة */}
        <div className="bg-slate-950 text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 text-right">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600/30 border border-blue-400/30 text-blue-200 text-[11px] font-bold">
                {notebook.grade}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-[11px] font-bold">
                {notebook.subject}
              </span>
              {notebook.pagesCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold">
                  {notebook.pagesCount} صفحة
                </span>
              )}
            </div>
            <h3 className="font-black text-base sm:text-xl text-white truncate">{notebook.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* جسم النافذة */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* العمود الأيمن: عارض الصور المحمي */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 aspect-[3/4] max-h-[460px] mx-auto flex items-center justify-center select-none">
              {allImages.length > 0 ? (
                <>
                  <img
                    src={allImages[currentIdx]}
                    alt={notebook.title}
                    draggable={false}
                    className={`w-full h-full object-contain transition-transform duration-300 ${
                      isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                    }`}
                    onClick={() => setIsZoomed(!isZoomed)}
                  />
                  {/* علامة مائية خفيفة لحماية العينات */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15">
                    <span className="text-white font-black text-2xl sm:text-3xl -rotate-12 tracking-widest">
                      {settings.siteName}
                    </span>
                  </div>

                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentIdx((prev) => (prev + 1) % allImages.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/75 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setCurrentIdx((prev) => (prev - 1 + allImages.length) % allImages.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/75 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-slate-950/80 text-white text-xs font-extrabold">
                      {currentIdx === 0 ? 'الغلاف' : `عينة ${currentIdx}`} ({currentIdx + 1} / {allImages.length})
                    </span>
                    <button
                      onClick={() => setIsZoomed(!isZoomed)}
                      className="p-2 rounded-xl bg-slate-950/80 text-white hover:bg-blue-600 transition"
                    >
                      {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-center p-6 space-y-2">
                  <BookOpen className="w-12 h-12 mx-auto opacity-50" />
                  <p className="text-xs font-bold">لا توجد صور عينة مرفوعة حاليًا</p>
                </div>
              )}
            </div>

            {loadingSamples && (
              <p className="text-center text-xs font-bold text-blue-600 animate-pulse">
                جاري تحميل باقي صفحات العينة...
              </p>
            )}

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`w-14 h-18 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                      currentIdx === i ? 'border-blue-600 scale-105 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* العمود الأيسر: التفاصيل والتنبيهات وزر الطلب */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-5 text-right">
            <div className="space-y-4">
              {blocksOrder.map((blockKey) => {
                if (blockKey === 'description') {
                  return (
                    <div key="description" className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                      <h4 className="font-black text-sm text-slate-900">محتوى ومواصفات المذكرة:</h4>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {notebook.description || 'مذكرة تعليمية منسقة باحترافية ومحدثة وفق أحدث مواصفات المنهج، جاهزة للطباعة باسم المعلم وشعاره.'}
                      </p>
                    </div>
                  );
                }

                if (blockKey === 'customNotice' && notebook.customNotice) {
                  return (
                    <div
                      key="customNotice"
                      className={`rounded-2xl p-4 border border-r-4 shadow-sm space-y-2 ${cTheme.box}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cTheme.icon}`}>
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                          <h4 className={`font-black text-sm ${cTheme.title}`}>
                            {notebook.customNoticeTitle || 'ملاحظة خاصة بهذه المذكرة'}
                          </h4>
                        </div>
                        {notebook.customNoticeBadge && (
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black animate-pulse shrink-0 ${cTheme.badge}`}>
                            {notebook.customNoticeBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed pr-10">
                        {notebook.customNotice}
                      </p>
                    </div>
                  );
                }

                if (blockKey === 'generalNotice' && settings.notebookNoticeEnabled && noticeLines.length > 0) {
                  return (
                    <div
                      key="generalNotice"
                      className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/90 space-y-2"
                    >
                      <h4 className="font-black text-xs sm:text-sm text-amber-950 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{settings.notebookNoticeTitle || 'تنبيه هام قبل تأكيد الطلب'}</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {noticeLines.map((line, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-amber-950/90 font-semibold leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                if (blockKey === 'driveButton' && notebook.driveLink) {
                  return (
                    <a
                      key="driveButton"
                      href={notebook.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${dTheme.card}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${dTheme.iconBox}`}>
                          <ExternalLink className="w-5 h-5" />
                        </span>
                        <div>
                          <h5 className={`font-black text-xs sm:text-sm ${dTheme.title}`}>
                            {settings.driveButtonText || 'معاينة نسخة كاملة على Google Drive'}
                          </h5>
                          <p className={`text-[11px] font-bold mt-0.5 ${dTheme.sub}`}>
                            {settings.driveButtonSubtext || 'اضغط لتصفح الملف بجودة عالية مباشرة'}
                          </p>
                        </div>
                      </div>
                      <ArrowLeft className={`w-4 h-4 shrink-0 ${dTheme.sub}`} />
                    </a>
                  );
                }

                return null;
              })}
            </div>

            {/* شريط السعر وأزرار الطلب */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200">
                <span className="text-xs font-extrabold text-slate-600">سعر المذكرة شاملة التخصيص:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-600">{notebook.price} ج.م</span>
                  {notebook.oldPrice > notebook.price && (
                    <span className="text-xs text-slate-400 line-through font-bold">{notebook.oldPrice} ج.م</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    onOrderNow(notebook);
                    onClose();
                  }}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{notebook.isComingSoon ? 'احجز المذكرة مسبقًا الآن' : 'اطلب المذكرة باسمك الآن'}</span>
                </button>

                {settings.orderEnableMultiCart && (
                  <button
                    onClick={() => onAddToCart(notebook)}
                    className={`py-3.5 px-4 rounded-2xl font-extrabold text-xs sm:text-sm border transition flex items-center justify-center gap-1.5 ${
                      isInCart
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isInCart ? 'مضافة للسلة ✓' : 'أضف للسلة'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. بطاقة المذكرة (NotebookCard)
// ============================================================================
function NotebookCard({ notebook, onPreview, onOrderNow, onAddToCart, isInCart, enableCart }) {
  const discountPct =
    notebook.oldPrice > notebook.price && notebook.oldPrice > 0
      ? Math.round(((notebook.oldPrice - notebook.price) / notebook.oldPrice) * 100)
      : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group text-right">
      {/* صورة الغلاف */}
      <div
        onClick={() => onPreview(notebook)}
        className="relative h-60 w-full bg-slate-100 overflow-hidden cursor-pointer"
      >
        {notebook.coverUrl ? (
          <img
            src={notebook.coverUrl}
            alt={notebook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center text-slate-400 p-6">
            <BookOpen className="w-12 h-12 mb-2 text-blue-400" />
            <span className="text-xs font-bold text-center text-slate-300">{notebook.title}</span>
          </div>
        )}

        {/* الشارات العلوية */}
        <div className="absolute top-3 right-3 left-3 flex items-start justify-between gap-2 pointer-events-none">
          <div className="flex flex-col gap-1.5">
            {notebook.isComingSoon && (
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shadow-md">
                قيد التجهيز • حجز مسبق
              </span>
            )}
            {notebook.badge && (
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-black shadow-md">
                {notebook.badge}
              </span>
            )}
          </div>
          {discountPct > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black shadow-md">
              خصم {discountPct}%
            </span>
          )}
        </div>

        {/* عدد الصفحات */}
        {notebook.pagesCount > 0 && (
          <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-sm text-white text-[11px] font-extrabold">
            {notebook.pagesCount} صفحة
          </span>
        )}
      </div>

      {/* تفاصيل المذكرة */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* شارات التصنيف أعلى العنوان */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-extrabold">
              {notebook.grade || notebook.stage}
            </span>
            {notebook.subject && (
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-extrabold">
                {notebook.subject}
              </span>
            )}
          </div>

          {/* اسم المذكرة البارز */}
          <h4
            onClick={() => onPreview(notebook)}
            className="text-lg sm:text-xl font-black text-slate-950 group-hover:text-blue-700 transition leading-snug cursor-pointer border-r-4 border-blue-600 pr-2.5"
          >
            {notebook.title}
          </h4>

          {notebook.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notebook.description}</p>
          )}
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-blue-600">{notebook.price} ج.م</span>
              {notebook.oldPrice > notebook.price && (
                <span className="text-xs text-slate-400 line-through font-bold">{notebook.oldPrice} ج.م</span>
              )}
            </div>
            <button
              onClick={() => onPreview(notebook)}
              className="text-xs font-extrabold text-slate-700 hover:text-blue-600 flex items-center gap-1 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>معاينة</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOrderNow(notebook)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-xs transition shadow-sm"
            >
              {notebook.isComingSoon ? 'حجز مسبق' : 'اطلب الآن'}
            </button>
            {enableCart && (
              <button
                onClick={() => onAddToCart(notebook)}
                title={isInCart ? 'مضافة للسلة' : 'أضف للسلة'}
                className={`p-2.5 rounded-xl border transition ${
                  isInCart
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. صفحة تصفح المذكرات والمجلدات (CatalogPage)
// ============================================================================
function CatalogPage({
  notebooks,
  settings,
  navState,
  onNavigateCatalog,
  onPreview,
  onOrderNow,
  onAddToCart,
  cartIds,
  onRequestPreOrder
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const activeNotebooks = useMemo(
    () => notebooks.filter((n) => n.visible !== false),
    [notebooks]
  );

  const filteredNotebooks = useMemo(() => {
    return activeNotebooks.filter((n) => {
      if (navState.category && n.category !== navState.category) return false;
      if (navState.stage && n.stage !== navState.stage) return false;
      if (navState.grade && n.grade !== navState.grade) return false;
      if (subjectFilter && n.subject !== subjectFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${n.title} ${n.subject} ${n.grade} ${n.stage} ${n.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activeNotebooks, navState, subjectFilter, searchQuery]);

  const stagesList = settings.stages || [];
  const gradesList = navState.stage ? settings.stageGrades?.[navState.stage] || [] : [];

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 text-right">
      {/* شريط المسار (Breadcrumbs) */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => onNavigateCatalog({ category: '', stage: '', grade: '' })}
          className={`px-3 py-1.5 rounded-xl transition ${
            !navState.category ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          جميع الأقسام
        </button>
        {navState.category && (
          <>
            <span>/</span>
            <button
              onClick={() => onNavigateCatalog({ category: navState.category, stage: '', grade: '' })}
              className={`px-3 py-1.5 rounded-xl transition ${
                !navState.stage ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              {navState.category}
            </button>
          </>
        )}
        {navState.stage && (
          <>
            <span>/</span>
            <button
              onClick={() => onNavigateCatalog({ ...navState, grade: '' })}
              className={`px-3 py-1.5 rounded-xl transition ${
                !navState.grade ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              {navState.stage}
            </button>
          </>
        )}
        {navState.grade && (
          <>
            <span>/</span>
            <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white">{navState.grade}</span>
          </>
        )}
      </div>

      {/* مجلدات المراحل أو الصفوف */}
      {navState.category && !navState.stage && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stagesList.map((st) => {
            const count = activeNotebooks.filter((n) => n.category === navState.category && n.stage === st).length;
            return (
              <button
                key={st}
                onClick={() => onNavigateCatalog({ ...navState, stage: st, grade: '' })}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md flex items-center justify-between transition text-right"
              >
                <div className="flex items-center gap-3">
                  <Folder className="w-7 h-7 text-amber-500" />
                  <div>
                    <h4 className="font-black text-sm text-slate-900">{st}</h4>
                    <p className="text-[11px] text-slate-500">{count} مذكرة</p>
                  </div>
                </div>
                <span className="text-blue-600 font-black text-sm">←</span>
              </button>
            );
          })}
        </div>
      )}

      {navState.stage && !navState.grade && gradesList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {gradesList.map((gr) => {
            const count = activeNotebooks.filter(
              (n) => (!navState.category || n.category === navState.category) && n.stage === navState.stage && n.grade === gr
            ).length;
            return (
              <button
                key={gr}
                onClick={() => onNavigateCatalog({ ...navState, grade: gr })}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md flex items-center justify-between transition text-right"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-7 h-7 text-blue-600" />
                  <div>
                    <h4 className="font-black text-sm text-slate-900">{gr}</h4>
                    <p className="text-[11px] text-slate-500">{count} مذكرة</p>
                  </div>
                </div>
                <span className="text-blue-600 font-black text-sm">←</span>
              </button>
            );
          })}
        </div>
      )}

      {/* شريط البحث والفلترة */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المذكرة أو الصف أو المادة..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold focus:outline-none focus:border-blue-600"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50"
        >
          <option value="">كل المواد الدراسية</option>
          {(settings.subjects || []).map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* شبكة المذكرات */}
      {filteredNotebooks.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center max-w-xl mx-auto space-y-4">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-black text-slate-900">{settings.emptyStateTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{settings.emptyStateDesc}</p>
          <button
            onClick={onRequestPreOrder}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm"
          >
            {settings.emptyStateCta}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotebooks.map((nb) => (
            <NotebookCard
              key={nb.id}
              notebook={nb}
              onPreview={onPreview}
              onOrderNow={onOrderNow}
              onAddToCart={onAddToCart}
              isInCart={cartIds.has(nb.id)}
              enableCart={settings.orderEnableMultiCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 8. صفحة العروض والباقات وكوبونات الخصم (OffersAndBundlesPage)
// ============================================================================
function OffersAndBundlesPage({ notebooks, settings, coupons, onPreview, onOrderBundle, onNotify }) {
  const [copiedCode, setCopiedCode] = useState('');

  const handleCopyCode = (code) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      onNotify(`تم نسخ كود الخصم: ${code}`, 'success');
      setTimeout(() => setCopiedCode(''), 2500);
    } catch {}
  };

  const activeCoupons = useMemo(() => coupons.filter((c) => c.active !== false && !c.used), [coupons]);

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 text-right">
      {/* قسم الباقات المجمعة */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">باقات المذكرات المجمعة بخصم خاص</h2>
            <p className="text-xs text-slate-500">اضغط على أي مذكرة داخل الباقة لمعاينة تفاصيلها وعيناتها</p>
          </div>
        </div>

        {(settings.bundles || []).length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-sm text-slate-500">
            لا توجد باقات مجمعة مضافة حاليًا.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(settings.bundles || []).map((bundle) => {
              const included = (bundle.notebookIds || [])
                .map((id) => notebooks.find((n) => n.id === id))
                .filter(Boolean);
              const rawSum = included.reduce((acc, n) => acc + (Number(n.price) || 0), 0);
              let originalPrice = Number(bundle.beforePrice) || rawSum;
              let finalPrice = rawSum;

              if (bundle.discountType === 'fixed_prices' && Number(bundle.afterPrice) > 0) {
                finalPrice = Number(bundle.afterPrice);
              } else if (bundle.discountType === 'amount') {
                finalPrice = Math.max(0, rawSum - (Number(bundle.discountValue) || 0));
              } else {
                const pct = Number(bundle.discountValue) || 0;
                finalPrice = Math.round(rawSum * (1 - pct / 100));
              }
              const savedAmount = Math.max(0, originalPrice - finalPrice);
              const savedPct = originalPrice > 0 ? Math.round((savedAmount / originalPrice) * 100) : 0;

              return (
                <div
                  key={bundle.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* رأس الباقة الداكن الفخم */}
                    <div className="bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 text-white p-6 flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-extrabold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>باقة توفير شاملة • {included.length} مذكرات</span>
                        </span>
                        <h3 className="text-xl font-black text-white">{bundle.title}</h3>
                        {bundle.description && (
                          <p className="text-xs text-slate-300 leading-relaxed">{bundle.description}</p>
                        )}
                      </div>
                      {savedAmount > 0 && (
                        <div className="bg-amber-400 text-slate-950 px-3.5 py-2 rounded-2xl text-center shrink-0 shadow-lg">
                          <span className="block text-xs font-black">وفّر {savedAmount} ج.م</span>
                          {savedPct > 0 && <span className="block text-[10px] font-extrabold">خصم {savedPct}%</span>}
                        </div>
                      )}
                    </div>

                    {/* قائمة المذكرات المشمولة (قابلة للضغط للمعاينة) */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 px-1">
                        <span>محتويات الباقة ({included.length} مذكرات):</span>
                        <span>السعر الفردي</span>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {included.map((nb) => (
                          <div
                            key={nb.id}
                            onClick={() => onPreview(nb)}
                            className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-400 cursor-pointer transition group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {nb.coverUrl ? (
                                <img src={nb.coverUrl} alt="" className="w-10 h-12 rounded-xl object-cover shrink-0 border border-slate-200" />
                              ) : (
                                <div className="w-10 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h5 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 truncate">
                                  {nb.title}
                                </h5>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {nb.grade} • {nb.subject}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-bold text-blue-600 hidden sm:inline group-hover:underline">
                                معاينة التفاصيل
                              </span>
                              <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-800">
                                {nb.price} ج.م
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* تذييل الباقة والسعر */}
                  <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500">سعر الباقة كاملة بعد الخصم:</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-600">{finalPrice} ج.م</span>
                        {originalPrice > finalPrice && (
                          <span className="text-xs text-slate-400 line-through font-bold">{originalPrice} ج.م</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onOrderBundle(bundle, included)}
                      className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/25 flex items-center gap-2 transition"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>اطلب الباقة بالخصم الآن</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* قسم كوبونات الخصم المتاحة */}
      {activeCoupons.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-amber-600" />
            <h3 className="text-xl font-black text-slate-900">كوبونات الخصم المتاحة حاليًا</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCoupons.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-5 border-2 border-dashed border-amber-300 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-lg font-black text-slate-950 tracking-wider">{c.code}</span>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                    خصم {c.discountType === 'amount' ? `${c.discountValue} ج.م` : `${c.discountValue}%`}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode(c.code)}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5"
                >
                  {copiedCode === c.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode === c.code ? 'تم النسخ' : 'نسخ الكود'}</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================================
// 9. نافذة السلة وإتمام الطلب (OrderCheckoutModal)
// ============================================================================
function OrderCheckoutModal({
  cart,
  allNotebooks,
  settings,
  coupons,
  onClose,
  onAddNotebookToCart,
  onRemoveFromCart,
  onClearCart,
  onNotify
}) {
  const [formValues, setFormValues] = useState({});
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  const visibleFields = useMemo(
    () => (settings.orderFormFields || []).filter((f) => f.visible !== false),
    [settings.orderFormFields]
  );

  // حساب الإجمالي وخصم الباقات والكوبونات
  const pricingSummary = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    let bundleDiscount = 0;

    const cartIdsSet = new Set(cart.map((c) => c.id));
    (settings.bundles || []).forEach((b) => {
      const ids = b.notebookIds || [];
      if (ids.length > 0 && ids.every((id) => cartIdsSet.has(id))) {
        const bundleRaw = ids.reduce((s, id) => {
          const found = cart.find((c) => c.id === id);
          return s + (Number(found?.price) || 0);
        }, 0);
        let bFinal = bundleRaw;
        if (b.discountType === 'fixed_prices' && Number(b.afterPrice) > 0) {
          bFinal = Number(b.afterPrice);
        } else if (b.discountType === 'amount') {
          bFinal = Math.max(0, bundleRaw - (Number(b.discountValue) || 0));
        } else {
          bFinal = Math.round(bundleRaw * (1 - (Number(b.discountValue) || 0) / 100));
        }
        const diff = Math.max(0, bundleRaw - bFinal);
        if (diff > bundleDiscount) bundleDiscount = diff;
      }
    });

    const afterBundle = Math.max(0, subtotal - bundleDiscount);
    let couponDiscount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'amount') {
        couponDiscount = Math.min(afterBundle, Number(appliedCoupon.discountValue) || 0);
      } else {
        couponDiscount = Math.round(afterBundle * ((Number(appliedCoupon.discountValue) || 0) / 100));
      }
    }

    const total = Math.max(0, afterBundle - couponDiscount);
    return { subtotal, bundleDiscount, couponDiscount, total };
  }, [cart, settings.bundles, appliedCoupon]);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = coupons.find((c) => String(c.code || '').toUpperCase() === code && c.active !== false && !c.used);
    if (!found) {
      onNotify('كود الخصم غير صحيح أو منتهي الصلاحية', 'error');
      return;
    }
    setAppliedCoupon(found);
    onNotify(`تم تطبيق كود الخصم (${found.code}) بنجاح!`, 'success');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const teacherName = formValues.teacherName || Object.values(formValues)[0] || 'معلم';
      const phone = formValues.phone || '';

      let nextRewardCode = '';
      if (settings.nextOrderRewardEnabled && Number(settings.nextOrderRewardPercent) > 0) {
        if (settings.nextOrderRewardMode === 'custom' && settings.nextOrderRewardCustomCode?.trim()) {
          nextRewardCode = settings.nextOrderRewardCustomCode.trim().toUpperCase();
        } else {
          nextRewardCode = generateUniqueCouponCode('NEXT');
          await addDoc(publicCol('coupons'), {
            code: nextRewardCode,
            discountType: settings.nextOrderRewardDiscountType || 'percent',
            discountValue: Number(settings.nextOrderRewardPercent),
            active: true,
            used: false,
            singleUse: true,
            createdAt: serverTimestamp()
          });
        }
      }

      if (appliedCoupon?.id && appliedCoupon?.singleUse) {
        await updateDoc(publicDoc('coupons', appliedCoupon.id), { used: true, active: false });
      }

      const orderDoc = {
        orderNumber,
        teacherName,
        phone,
        formDetails: formValues,
        items: cart.map((c) => ({ id: c.id, title: c.title, grade: c.grade, price: c.price })),
        subtotal: pricingSummary.subtotal,
        bundleDiscount: pricingSummary.bundleDiscount,
        couponDiscount: pricingSummary.couponDiscount,
        couponCode: appliedCoupon?.code || '',
        totalPrice: pricingSummary.total,
        nextRewardCode,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(publicCol('orders'), orderDoc);
      setSubmittedOrder(orderDoc);
      onClearCart();
      onNotify('تم تسجيل طلبك بنجاح!', 'success');
    } catch (err) {
      onNotify(`تعذر تسجيل الطلب: ${err?.message || ''}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const buildWhatsAppOrderUrl = (orderObj) => {
    const cleanWa = String(settings.whatsappNumber || '201000000000').replace(/[^\d]/g, '');
    const itemsText = (orderObj.items || [])
      .map((it, idx) => `${idx + 1}. ${it.title} (${it.grade || ''}) - ${it.price} ج.م`)
      .join('\n');
    const detailsText = Object.entries(orderObj.formDetails || {})
      .filter(([, v]) => v && typeof v === 'string')
      .map(([k, v]) => {
        const fieldDef = (settings.orderFormFields || []).find((f) => f.id === k);
        return `• ${fieldDef?.label || k}: ${v}`;
      })
      .join('\n');

    const msg = [
      `*طلب جديد من ${settings.siteName}*`,
      `رقم الطلب: *${orderObj.orderNumber}*`,
      `------------------`,
      detailsText,
      `------------------`,
      `*المذكرات المطلوبة:*`,
      itemsText || 'طلب مخصص',
      `------------------`,
      `الإجمالي النهائي: *${orderObj.totalPrice} ج.م*`
    ].join('\n');

    return `https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col text-right"
      >
        <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-black text-base sm:text-lg">{settings.orderModalTitle}</h3>
            <p className="text-xs text-slate-300 mt-0.5">{settings.orderModalSubtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {submittedOrder ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-xl font-black text-slate-900">{settings.orderSuccessMessage}</h4>
              <div className="bg-slate-100 rounded-2xl p-4 max-w-sm mx-auto space-y-1">
                <span className="text-xs text-slate-500 block">رقم تتبع الطلب الخاص بك:</span>
                <span className="text-2xl font-black text-blue-600 tracking-wider">{submittedOrder.orderNumber}</span>
              </div>

              {submittedOrder.nextRewardCode && (
                <div className="bg-amber-50 border-2 border-dashed border-amber-400 rounded-2xl p-4 max-w-md mx-auto space-y-2">
                  <span className="text-xs font-black text-amber-900 flex items-center justify-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span>{settings.nextOrderRewardTitle || 'هدية خاصة لطلبك القادم!'}</span>
                  </span>
                  <p className="text-xs text-amber-800">
                    {settings.nextOrderRewardDesc || 'استخدم هذا الكود للحصول على خصم'}{' '}
                    <strong>
                      {settings.nextOrderRewardDiscountType === 'amount'
                        ? `${settings.nextOrderRewardPercent} ج.م`
                        : `${settings.nextOrderRewardPercent}%`}
                    </strong>
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-base tracking-wider">
                      {submittedOrder.nextRewardCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(submittedOrder.nextRewardCode);
                          onNotify(`تم نسخ كوبون الطلب القادم: ${submittedOrder.nextRewardCode}`, 'success');
                        } catch {}
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>انسخ الكوبون</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed max-w-md mx-auto">
                {settings.paymentInstructions}
              </div>

              <a
                href={buildWhatsAppOrderUrl(submittedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                <span>إرسال تفاصيل الطلب على واتساب الآن</span>
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {/* قائمة المذكرات المختارة في السلة */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    المذكرات المختارة في السلة ({cart.length}):
                  </span>
                  {settings.orderEnableMultiCart && allNotebooks.length > cart.length && (
                    <select
                      value=""
                      onChange={(e) => {
                        const found = allNotebooks.find((n) => n.id === e.target.value);
                        if (found) onAddNotebookToCart(found);
                      }}
                      className="px-2.5 py-1 rounded-xl border border-blue-300 bg-blue-50 text-blue-800 text-[11px] font-extrabold max-w-[200px]"
                    >
                      <option value="">+ أضف مذكرة أخرى للسلة...</option>
                      {allNotebooks
                        .filter((n) => !cart.some((c) => c.id === n.id))
                        .map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.title} ({n.price} ج.م)
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {cart.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">
                    السلة فارغة حاليًا (يمكنك إرسال طلب إعداد مذكرة خاصة بكتابة التفاصيل في الملاحظات أو إضافة مذكرات من القائمة أعلاه).
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      >
                        <span className="font-extrabold text-slate-800 truncate">{item.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-blue-600">{item.price} ج.م</span>
                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(item.id)}
                            className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* حقول بيانات المعلم */}
              <div className="space-y-3">
                {visibleFields.map((field) => (
                  <div key={field.id}>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">
                      {field.label} {field.required && <span className="text-rose-600">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        rows={2}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={formValues[field.id] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                      />
                    ) : field.type === 'file' ? (
                      <input
                        type="file"
                        accept="image/*"
                        required={field.required}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          setFormValues({ ...formValues, [field.id]: f ? `مرفق شعار: ${f.name}` : '' });
                        }}
                        className="w-full text-xs border border-slate-300 rounded-xl p-2"
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={formValues[field.id] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* كود الخصم */}
              {settings.orderEnableCoupons && cart.length > 0 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="لديك كود خصم؟ اكتبه هنا..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-black uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold"
                  >
                    تطبيق
                  </button>
                </div>
              )}

              {/* ملخص الحساب */}
              {cart.length > 0 && (
                <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 font-bold">
                    <span>المجموع الفرعي:</span>
                    <span>{pricingSummary.subtotal} ج.م</span>
                  </div>
                  {pricingSummary.bundleDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-extrabold">
                      <span>خصم باقة التوفير:</span>
                      <span>- {pricingSummary.bundleDiscount} ج.م</span>
                    </div>
                  )}
                  {pricingSummary.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-extrabold">
                      <span>خصم الكوبون ({appliedCoupon?.code}):</span>
                      <span>- {pricingSummary.couponDiscount} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-blue-700 pt-1.5 border-t border-blue-200">
                    <span>الإجمالي النهائي:</span>
                    <span>{pricingSummary.total} ج.م</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg transition"
              >
                {submitting ? 'جاري تسجيل الطلب...' : settings.orderSubmitText}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 10. لوحة تحكم الإدارة الشاملة (AdminDashboard)
// ============================================================================
function AdminDashboard({
  notebooks,
  setNotebooks,
  settings,
  onSaveSettings,
  orders,
  coupons,
  onLogout,
  onExitToSite,
  notify
}) {
  const [activeTab, setActiveTab] = useState('notebooks');
  const [localSettings, setLocalSettings] = useState(() => normalizeSettings(settings));
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setLocalSettings(normalizeSettings(settings));
  }, [settings]);

  const emptyNbForm = {
    id: '',
    title: '',
    category: localSettings.categories?.[0] || 'مذكرات الترم الأول',
    stage: localSettings.stages?.[0] || 'المرحلة الابتدائية',
    grade: (localSettings.stageGrades?.[localSettings.stages?.[0] || 'المرحلة الابتدائية'] || [])[0] || '',
    subject: localSettings.subjects?.[0] || 'اللغة العربية',
    price: 100,
    oldPrice: 0,
    pagesCount: 60,
    badge: '',
    description: '',
    customNoticeTitle: '',
    customNotice: '',
    customNoticeBadge: 'هام جدًا!',
    customNoticeTheme: 'amber',
    driveLink: '',
    coverUrl: '',
    sampleUrls: [],
    isComingSoon: false,
    visible: true
  };

  const [nbForm, setNbForm] = useState(emptyNbForm);
  const [savingNb, setSavingNb] = useState(false);

  // التعديل السريع الجماعي للمذكرات
  const [bulkEdits, setBulkEdits] = useState({});
  const [savingBulk, setSavingBulk] = useState(false);
  const editedCount = Object.keys(bulkEdits).length;

  const handleBulkFieldChange = (id, field, value) => {
    setBulkEdits((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveAllBulkEdits = async () => {
    const entries = Object.entries(bulkEdits);
    if (!entries.length) return;
    setSavingBulk(true);
    try {
      for (const [id, changes] of entries) {
        const cleanPatch = { ...changes };
        if (cleanPatch.price !== undefined) cleanPatch.price = Number(cleanPatch.price) || 0;
        if (cleanPatch.oldPrice !== undefined) cleanPatch.oldPrice = Number(cleanPatch.oldPrice) || 0;
        await updateDoc(publicDoc('notebooks', id), cleanPatch);
      }
      setBulkEdits({});
      notify(`تم حفظ التعديلات على ${entries.length} مذكرة بنجاح!`, 'success');
    } catch (err) {
      notify(`تعذر حفظ التعديلات الجماعية: ${err?.message || ''}`, 'error');
    } finally {
      setSavingBulk(false);
    }
  };

  const handleSaveNotebook = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim()) return;
    setSavingNb(true);
    try {
      const samples = Array.isArray(nbForm.sampleUrls) ? nbForm.sampleUrls : [];
      const chunkSize = 3;
      const chunksCount = Math.ceil(samples.length / chunkSize);

      const payload = {
        title: nbForm.title.trim(),
        category: nbForm.category,
        stage: nbForm.stage,
        grade: nbForm.grade,
        subject: nbForm.subject,
        price: Number(nbForm.price) || 0,
        oldPrice: Number(nbForm.oldPrice) || 0,
        pagesCount: Number(nbForm.pagesCount) || 0,
        badge: nbForm.badge.trim(),
        description: nbForm.description.trim(),
        customNoticeTitle: nbForm.customNoticeTitle.trim(),
        customNotice: nbForm.customNotice.trim(),
        customNoticeBadge: nbForm.customNoticeBadge.trim(),
        customNoticeTheme: nbForm.customNoticeTheme || 'amber',
        driveLink: nbForm.driveLink.trim(),
        coverUrl: nbForm.coverUrl || '',
        sampleUrls: [],
        samplesChunksCount: chunksCount,
        isComingSoon: Boolean(nbForm.isComingSoon),
        visible: nbForm.visible !== false
      };

      let targetId = nbForm.id;
      if (targetId) {
        await updateDoc(publicDoc('notebooks', targetId), payload);
      } else {
        const docRef = await addDoc(publicCol('notebooks'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        targetId = docRef.id;
      }

      if (targetId && samples.length > 0) {
        await setDoc(publicDoc('notebook_samples', targetId), { urls: [] });
        for (let i = 0; i < chunksCount; i++) {
          const chunkUrls = samples.slice(i * chunkSize, (i + 1) * chunkSize);
          await setDoc(publicDoc('notebook_samples', `${targetId}_chunk_${i}`), {
            urls: chunkUrls
          });
        }
      }

      setNbForm(emptyNbForm);
      notify('تم حفظ المذكرة بنجاح!', 'success');
    } catch (err) {
      notify(`تعذر حفظ المذكرة: ${err?.message || ''}`, 'error');
    } finally {
      setSavingNb(false);
    }
  };

  const handleEditNotebookClick = async (nb) => {
    let existingSamples = Array.isArray(nb.sampleUrls) ? [...nb.sampleUrls] : [];
    try {
      const baseSnap = await getDoc(publicDoc('notebook_samples', nb.id));
      if (baseSnap.exists() && Array.isArray(baseSnap.data()?.urls)) {
        existingSamples.push(...baseSnap.data().urls);
      }
      const chunksCount = Number(nb.samplesChunksCount) || 5;
      for (let i = 0; i < chunksCount; i++) {
        const chunkSnap = await getDoc(publicDoc('notebook_samples', `${nb.id}_chunk_${i}`));
        if (chunkSnap.exists() && Array.isArray(chunkSnap.data()?.urls)) {
          existingSamples.push(...chunkSnap.data().urls);
        } else if (i > 0 && !chunkSnap.exists()) {
          break;
        }
      }
    } catch {}
    setNbForm({
      ...emptyNbForm,
      ...nb,
      sampleUrls: Array.from(new Set(existingSamples))
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNotebook = async (id) => {
    try {
      await deleteDoc(publicDoc('notebooks', id));
      notify('تم حذف المذكرة', 'success');
    } catch (err) {
      notify(`تعذر الحذف: ${err?.message || ''}`, 'error');
    }
  };

  // حالات إدارة الأقسام والمراحل والصفوف والمواد
  const [newCatInput, setNewCatInput] = useState('');
  const [newStageInput, setNewStageInput] = useState('');
  const [selectedStageForGrades, setSelectedStageForGrades] = useState(
    localSettings.stages?.[0] || 'المرحلة الابتدائية'
  );
  const [newGradeInput, setNewGradeInput] = useState('');
  const [newSubjectInput, setNewSubjectInput] = useState('');

  // حالات إدارة الباقات والكوبونات والأخبار
  const [bundleForm, setBundleForm] = useState({
    title: '',
    description: '',
    discountType: 'fixed_prices',
    discountValue: 15,
    beforePrice: 0,
    afterPrice: 0,
    notebookIds: []
  });
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: 15
  });
  const [newNewsForm, setNewNewsForm] = useState({
    badge: 'قريبًا جدًا',
    title: '',
    content: '',
    color: 'amber'
  });
  const restoreInputRef = useRef(null);

  const moveArrayItem = (arr, index, direction) => {
    const newArr = [...arr];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newArr.length) return newArr;
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    return newArr;
  };

  const handlePersistAllSettings = async () => {
    setSavingSettings(true);
    try {
      await onSaveSettings(localSettings);
      notify('تم حفظ جميع الإعدادات ومزامنتها مع السحابة بنجاح!', 'success');
    } catch (err) {
      notify(`تعذر حفظ الإعدادات: ${err?.message || ''}`, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900 pb-16 text-right">
      {/* شريط لوحة التحكم العلوي */}
      <header className="sticky top-0 z-30 bg-slate-950 text-white px-4 sm:px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg">لوحة تحكم {settings.siteName}</h1>
              <p className="text-[11px] text-slate-400">{ADMIN_EMAIL}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExitToSite}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-extrabold flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>معاينة الموقع</span>
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-extrabold flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* تبويبات لوحة التحكم */}
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          {[
            { id: 'notebooks', label: `المذكرات (${notebooks.length})`, icon: BookOpen },
            { id: 'categories', label: 'الأقسام والمراحل والصفوف', icon: Folder },
            { id: 'offers', label: 'الخصومات والعروض', icon: Percent },
            { id: 'orders', label: `الطلبات (${orders.length})`, icon: ShoppingCart },
            { id: 'settings', label: 'إعدادات الموقع والمظهر وطلب العميل', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition ${
                  activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* تبويب 1: إدارة المذكرات + التعديل السريع الجماعي                  */}
        {/* ================================================================= */}
        {activeTab === 'notebooks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* نموذج إضافة أو تعديل مذكرة */}
            <form
              onSubmit={handleSaveNotebook}
              className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-slate-900">
                  {nbForm.id ? 'تعديل بيانات المذكرة' : 'إضافة مذكرة جديدة'}
                </h3>
                {nbForm.id && (
                  <button
                    type="button"
                    onClick={() => setNbForm(emptyNbForm)}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              <input
                type="text"
                required
                value={nbForm.title}
                onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })}
                placeholder="عنوان المذكرة (مثال: بنك مراجعة الصف الثالث الإعدادي)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
              />

              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={nbForm.category}
                  onChange={(e) => setNbForm({ ...nbForm, category: e.target.value })}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {(localSettings.categories || []).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={nbForm.stage}
                  onChange={(e) => {
                    const nextStage = e.target.value;
                    const nextGrades = localSettings.stageGrades?.[nextStage] || [];
                    setNbForm({ ...nbForm, stage: nextStage, grade: nextGrades[0] || '' });
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {(localSettings.stages || []).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>

                <select
                  value={nbForm.grade}
                  onChange={(e) => setNbForm({ ...nbForm, grade: e.target.value })}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {(localSettings.stageGrades?.[nbForm.stage] || []).map((gr) => (
                    <option key={gr} value={gr}>{gr}</option>
                  ))}
                </select>

                <select
                  value={nbForm.subject}
                  onChange={(e) => setNbForm({ ...nbForm, subject: e.target.value })}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {(localSettings.subjects || []).map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">السعر الحالي</label>
                  <input
                    type="number"
                    required
                    value={nbForm.price}
                    onChange={(e) => setNbForm({ ...nbForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black text-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">قبل الخصم</label>
                  <input
                    type="number"
                    value={nbForm.oldPrice}
                    onChange={(e) => setNbForm({ ...nbForm, oldPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">عدد الصفحات</label>
                  <input
                    type="number"
                    value={nbForm.pagesCount}
                    onChange={(e) => setNbForm({ ...nbForm, pagesCount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <input
                type="text"
                value={nbForm.badge}
                onChange={(e) => setNbForm({ ...nbForm, badge: e.target.value })}
                placeholder="شارة التميز على الغلاف (مثال: الأكثر طلبًا / محدث 2026)..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
              />

              <textarea
                rows={3}
                value={nbForm.description}
                onChange={(e) => setNbForm({ ...nbForm, description: e.target.value })}
                placeholder="وصف ومحتوى المذكرة..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
              />

              {/* التنبيه الخاص بالمذكرة وألوانه وشارته */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-2.5">
                <span className="text-xs font-black text-amber-950 block">تنبيه خاص بهذه المذكرة (اختياري):</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={nbForm.customNoticeTitle}
                    onChange={(e) => setNbForm({ ...nbForm, customNoticeTitle: e.target.value })}
                    placeholder="عنوان التنبيه..."
                    className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={nbForm.customNoticeBadge}
                    onChange={(e) => setNbForm({ ...nbForm, customNoticeBadge: e.target.value })}
                    placeholder="الشارة (هام جدًا!)"
                    className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-bold"
                  />
                </div>
                <textarea
                  rows={2}
                  value={nbForm.customNotice}
                  onChange={(e) => setNbForm({ ...nbForm, customNotice: e.target.value })}
                  placeholder="نص التنبيه الخاص بهذه المذكرة..."
                  className="w-full px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-bold"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-600">لون صندوق التنبيه:</span>
                  <select
                    value={nbForm.customNoticeTheme}
                    onChange={(e) => setNbForm({ ...nbForm, customNoticeTheme: e.target.value })}
                    className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-bold"
                  >
                    <option value="amber">ذهبي عنبري</option>
                    <option value="rose">أحمر تنبيهي</option>
                    <option value="blue">أزرق ملكي</option>
                    <option value="emerald">أخضر زمردي</option>
                    <option value="purple">بنفسجي</option>
                  </select>
                </div>
              </div>

              <input
                type="url"
                dir="ltr"
                value={nbForm.driveLink}
                onChange={(e) => setNbForm({ ...nbForm, driveLink: e.target.value })}
                placeholder="رابط معاينة Google Drive (اختياري)..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-left"
              />

              <label className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-extrabold text-amber-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(nbForm.isComingSoon)}
                  onChange={(e) => setNbForm({ ...nbForm, isComingSoon: e.target.checked })}
                />
                <span>المذكرة قيد التجهيز (إعلان «قريبًا / حجز مسبق»)</span>
              </label>

              {/* رفع صورة الغلاف وصفحات العينة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 space-y-2 text-center">
                  <span className="text-xs font-extrabold text-slate-700 block">صورة غلاف المذكرة</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const compressed = await compressImageFile(file, 850, 0.78);
                      setNbForm((prev) => ({ ...prev, coverUrl: compressed }));
                    }}
                    className="w-full text-[11px]"
                  />
                  {nbForm.coverUrl && (
                    <img src={nbForm.coverUrl} alt="" className="w-16 h-20 object-cover rounded-xl mx-auto border" />
                  )}
                </div>

                <div className="p-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 space-y-2 text-center">
                  <span className="text-xs font-extrabold text-slate-700 block">صفحات العينة (حتى 15 صفحة)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (!files.length) return;
                      const remaining = Math.max(0, 15 - (nbForm.sampleUrls || []).length);
                      const slice = files.slice(0, remaining);
                      const compressedList = await Promise.all(
                        slice.map((f) => compressImageFile(f, 950, 0.78))
                      );
                      setNbForm((prev) => ({
                        ...prev,
                        sampleUrls: [...(prev.sampleUrls || []), ...compressedList]
                      }));
                      e.target.value = '';
                    }}
                    className="w-full text-[11px]"
                  />
                  {(nbForm.sampleUrls || []).length > 0 && (
                    <span className="text-[11px] font-black text-emerald-700 block">
                      تم تجهيز {nbForm.sampleUrls.length} صفحة
                    </span>
                  )}
                </div>
              </div>

              {/* مصغرات صفحات العينة المرفوعة */}
              {(nbForm.sampleUrls || []).length > 0 && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-700">
                      صفحات العينة ({nbForm.sampleUrls.length} / 15):
                    </span>
                    <button
                      type="button"
                      onClick={() => setNbForm((prev) => ({ ...prev, sampleUrls: [] }))}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      مسح الكل
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {nbForm.sampleUrls.map((url, idx) => (
                      <div key={idx} className="relative w-14 h-18 shrink-0 rounded-xl overflow-hidden border bg-white">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setNbForm((prev) => ({
                              ...prev,
                              sampleUrls: prev.sampleUrls.filter((_, i) => i !== idx)
                            }))
                          }
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={savingNb}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg transition"
              >
                {savingNb ? 'جاري حفظ المذكرة...' : nbForm.id ? 'حفظ تعديلات المذكرة' : '+ إضافة المذكرة'}
              </button>
            </form>

            {/* قائمة المذكرات + التعديل السريع الجماعي */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-black text-base text-slate-900">المذكرات المنشورة ({notebooks.length})</h3>
                  <p className="text-[11px] text-slate-500">يمكنك تعديل أكثر من مذكرة مباشرة ثم حفظها جميعًا دفعة واحدة</p>
                </div>

                {editedCount > 0 && (
                  <button
                    type="button"
                    disabled={savingBulk}
                    onClick={handleSaveAllBulkEdits}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md animate-pulse"
                  >
                    {savingBulk ? 'جاري الحفظ...' : `حفظ جميع التعديلات دفعة واحدة (${editedCount})`}
                  </button>
                )}
              </div>

              {notebooks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">لا توجد مذكرات مضافة بعد.</p>
              ) : (
                <div className="space-y-3 max-h-[820px] overflow-y-auto pl-1">
                  {notebooks.map((nb) => {
                    const patch = bulkEdits[nb.id] || {};
                    const isDirty = Boolean(bulkEdits[nb.id]);
                    const curTitle = patch.title !== undefined ? patch.title : nb.title;
                    const curCategory = patch.category !== undefined ? patch.category : nb.category;
                    const curStage = patch.stage !== undefined ? patch.stage : nb.stage;
                    const curGrade = patch.grade !== undefined ? patch.grade : nb.grade;
                    const curSubject = patch.subject !== undefined ? patch.subject : nb.subject;
                    const curPrice = patch.price !== undefined ? patch.price : nb.price;
                    const curOldPrice = patch.oldPrice !== undefined ? patch.oldPrice : nb.oldPrice;

                    return (
                      <div
                        key={nb.id}
                        className={`p-4 rounded-2xl border transition space-y-3 ${
                          isDirty ? 'bg-amber-50/70 border-amber-400' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {nb.coverUrl ? (
                              <img src={nb.coverUrl} alt="" className="w-12 h-16 rounded-xl object-cover shrink-0 border" />
                            ) : (
                              <div className="w-12 h-16 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                <BookOpen className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <input
                                type="text"
                                value={curTitle}
                                onChange={(e) => handleBulkFieldChange(nb.id, 'title', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-black"
                              />
                              <div className="flex flex-wrap gap-1.5">
                                <select
                                  value={curCategory}
                                  onChange={(e) => handleBulkFieldChange(nb.id, 'category', e.target.value)}
                                  className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold"
                                >
                                  {(localSettings.categories || []).map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                                <select
                                  value={curStage}
                                  onChange={(e) => handleBulkFieldChange(nb.id, 'stage', e.target.value)}
                                  className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold"
                                >
                                  {(localSettings.stages || []).map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <select
                                  value={curGrade}
                                  onChange={(e) => handleBulkFieldChange(nb.id, 'grade', e.target.value)}
                                  className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold"
                                >
                                  {(localSettings.stageGrades?.[curStage] || []).map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                  ))}
                                </select>
                                <select
                                  value={curSubject}
                                  onChange={(e) => handleBulkFieldChange(nb.id, 'subject', e.target.value)}
                                  className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold"
                                >
                                  {(localSettings.subjects || []).map((sub) => (
                                    <option key={sub} value={sub}>{sub}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditNotebookClick(nb)}
                              title="تعديل كامل (الصور والتنبيهات)"
                              className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNotebook(nb.id)}
                              title="حذف المذكرة"
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-600">السعر:</span>
                            <input
                              type="number"
                              value={curPrice}
                              onChange={(e) => handleBulkFieldChange(nb.id, 'price', e.target.value)}
                              className="w-20 px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-black text-blue-600"
                            />
                            <span className="font-bold text-slate-600">قبل:</span>
                            <input
                              type="number"
                              value={curOldPrice}
                              onChange={(e) => handleBulkFieldChange(nb.id, 'oldPrice', e.target.value)}
                              className="w-20 px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold"
                            />
                          </div>
                          {isDirty && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                              معدّلة (غير محفوظة)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* تبويب 2: إدارة الأقسام والمراحل والصفوف الدراسية والمواد            */}
        {/* ================================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* 1. الأقسام الرئيسية */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-black text-base">1. الأقسام الرئيسية للمنصة (الترتيب والصور)</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder="اسم القسم الجديد (مثال: مراجعات ليلة الامتحان)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    const name = newCatInput.trim();
                    if (!name || localSettings.categories.includes(name)) return;
                    setLocalSettings({ ...localSettings, categories: [...localSettings.categories, name] });
                    setNewCatInput('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs"
                >
                  + إضافة قسم
                </button>
              </div>

              <div className="space-y-2.5">
                {(localSettings.categories || []).map((cat, idx, arr) => {
                  const catImg = localSettings.categoryImages?.[cat];
                  return (
                    <div key={cat} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => setLocalSettings({ ...localSettings, categories: moveArrayItem(arr, idx, -1) })}
                            className="p-1 rounded bg-white border"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setLocalSettings({ ...localSettings, categories: moveArrayItem(arr, idx, 1) })}
                            className="p-1 rounded bg-white border"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        {catImg && <img src={catImg} alt="" className="w-12 h-10 rounded-xl object-cover border" />}
                        <span className="font-black text-sm text-slate-900">{cat}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-[11px] font-extrabold cursor-pointer hover:bg-slate-100">
                          <span>{catImg ? 'تغيير الصورة' : '+ صورة القسم'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const compressed = await compressImageFile(file, 750, 0.75);
                              setLocalSettings({
                                ...localSettings,
                                categoryImages: { ...(localSettings.categoryImages || {}), [cat]: compressed }
                              });
                            }}
                          />
                        </label>
                        {catImg && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = { ...(localSettings.categoryImages || {}) };
                              delete copy[cat];
                              setLocalSettings({ ...localSettings, categoryImages: copy });
                            }}
                            className="text-[11px] font-bold text-rose-600"
                          >
                            حذف الصورة
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setLocalSettings({
                              ...localSettings,
                              categories: arr.filter((c) => c !== cat)
                            })
                          }
                          className="p-2 rounded-xl bg-rose-50 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. المراحل والصفوف الدراسية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <h3 className="font-black text-base">2. المراحل الدراسية</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStageInput}
                    onChange={(e) => setNewStageInput(e.target.value)}
                    placeholder="اسم المرحلة (مثال: مرحلة رياض الأطفال)..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const name = newStageInput.trim();
                      if (!name || localSettings.stages.includes(name)) return;
                      setLocalSettings({
                        ...localSettings,
                        stages: [...localSettings.stages, name],
                        stageGrades: { ...(localSettings.stageGrades || {}), [name]: [] }
                      });
                      setNewStageInput('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-extrabold text-xs"
                  >
                    + مرحلة
                  </button>
                </div>
                <div className="space-y-2">
                  {(localSettings.stages || []).map((st) => (
                    <div key={st} className="p-3 rounded-xl bg-slate-50 border flex items-center justify-between text-xs font-black">
                      <span>{st}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            stages: localSettings.stages.filter((s) => s !== st)
                          })
                        }
                        className="text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <h3 className="font-black text-base">3. الصفوف الدراسية داخل كل مرحلة</h3>
                <select
                  value={selectedStageForGrades}
                  onChange={(e) => setSelectedStageForGrades(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                >
                  {(localSettings.stages || []).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGradeInput}
                    onChange={(e) => setNewGradeInput(e.target.value)}
                    placeholder="اسم الصف (مثال: الصف الأول الابتدائي)..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const gr = newGradeInput.trim();
                      if (!gr || !selectedStageForGrades) return;
                      const currentGrades = localSettings.stageGrades?.[selectedStageForGrades] || [];
                      if (currentGrades.includes(gr)) return;
                      setLocalSettings({
                        ...localSettings,
                        stageGrades: {
                          ...(localSettings.stageGrades || {}),
                          [selectedStageForGrades]: [...currentGrades, gr]
                        }
                      });
                      setNewGradeInput('');
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-extrabold text-xs"
                  >
                    + صف
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(localSettings.stageGrades?.[selectedStageForGrades] || []).map((gr) => (
                    <div key={gr} className="p-2.5 rounded-xl bg-slate-50 border flex items-center justify-between text-xs font-bold">
                      <span>{gr}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            stageGrades: {
                              ...(localSettings.stageGrades || {}),
                              [selectedStageForGrades]: (localSettings.stageGrades?.[selectedStageForGrades] || []).filter(
                                (g) => g !== gr
                              )
                            }
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

            {/* 4. المواد الدراسية */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-black text-base">4. المواد الدراسية</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  placeholder="اسم المادة (مثال: الفيزياء / الكيمياء / التاريخ)..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    const sub = newSubjectInput.trim();
                    if (!sub || localSettings.subjects.includes(sub)) return;
                    setLocalSettings({ ...localSettings, subjects: [...localSettings.subjects, sub] });
                    setNewSubjectInput('');
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-extrabold text-xs"
                >
                  + إضافة مادة
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(localSettings.subjects || []).map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-extrabold"
                  >
                    <span>{sub}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          subjects: localSettings.subjects.filter((s) => s !== sub)
                        })
                      }
                      className="text-rose-600 font-black"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={handlePersistAllSettings}
                  className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg"
                >
                  {savingSettings ? 'جاري الحفظ...' : 'حفظ الأقسام والمراحل والصفوف ومزامنتها'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* تبويب 3: الخصومات والعروض (التحكم الكامل في كل ما يخص الخصومات)    */}
        {/* ================================================================= */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            {/* 1. التحكم الكامل في الشريط الترويجي العلوي وكوبون العرض */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-base flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-blue-600" />
                  <span>1. الشريط الترويجي العلوي وكوبون العرض السريع</span>
                </h3>
                <label className="flex items-center gap-2 text-xs font-extrabold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.promoBarEnabled !== false}
                    onChange={(e) => setLocalSettings({ ...localSettings, promoBarEnabled: e.target.checked })}
                  />
                  <span>تفعيل الشريط الترويجي أعلى الموقع</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">نص الإعلان الترويجي</label>
                  <input
                    type="text"
                    value={localSettings.promoBarText}
                    onChange={(e) => setLocalSettings({ ...localSettings, promoBarText: e.target.value })}
                    placeholder="اكتب نص العرض الترويجي..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">كود الكوبون داخل الشريط (اختياري)</label>
                  <input
                    type="text"
                    value={localSettings.promoBarCouponCode || ''}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, promoBarCouponCode: e.target.value.toUpperCase() })
                    }
                    placeholder="مثال: EL3B15"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-black uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">النص المكتوب على زر النسخ</label>
                  <input
                    type="text"
                    value={localSettings.promoBarCopyLabel || 'انسخ الكوبون'}
                    onChange={(e) => setLocalSettings({ ...localSettings, promoBarCopyLabel: e.target.value })}
                    placeholder="مثال: انسخ الكوبون"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">لون خلفية الشريط الترويجي</label>
                  <select
                    value={localSettings.promoBarTheme || 'slate'}
                    onChange={(e) => setLocalSettings({ ...localSettings, promoBarTheme: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                  >
                    <option value="slate">كحلي ملكي داكن (نص ذهبي)</option>
                    <option value="blue">أزرق سماوي متدرج</option>
                    <option value="emerald">أخضر زمردي متدرج</option>
                    <option value="rose">أحمر ياقوتي لافت</option>
                    <option value="purple">بنفسجي فاخر</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. التحكم الكامل في كوبون مكافأة الطلب القادم (يظهر بعد إتمام الطلب) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-base flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-600" />
                  <span>2. كوبون مكافأة الطلب القادم (يظهر للعميل فور إتمام الطلب)</span>
                </h3>
                <label className="flex items-center gap-2 text-xs font-extrabold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.nextOrderRewardEnabled !== false}
                    onChange={(e) => setLocalSettings({ ...localSettings, nextOrderRewardEnabled: e.target.checked })}
                  />
                  <span>إظهار الكوبون للعميل بعد إتمام الطلب</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">نظام توليد كود الكوبون</label>
                  <select
                    value={localSettings.nextOrderRewardMode || 'auto'}
                    onChange={(e) => setLocalSettings({ ...localSettings, nextOrderRewardMode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold"
                  >
                    <option value="auto">توليد كود تلقائي فريد لكل عميل (يُستخدم مرة واحدة)</option>
                    <option value="custom">تحديد كود ثابت من اختياري</option>
                  </select>
                </div>

                {localSettings.nextOrderRewardMode === 'custom' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">الكود الثابت للمكافأة</label>
                    <input
                      type="text"
                      value={localSettings.nextOrderRewardCustomCode || ''}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, nextOrderRewardCustomCode: e.target.value.toUpperCase() })
                      }
                      placeholder="مثال: VIP20"
                      className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs font-black uppercase"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">نوع الخصم</label>
                  <select
                    value={localSettings.nextOrderRewardDiscountType || 'percent'}
                    onChange={(e) => setLocalSettings({ ...localSettings, nextOrderRewardDiscountType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold"
                  >
                    <option value="percent">نسبة مئوية (%)</option>
                    <option value="amount">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {localSettings.nextOrderRewardDiscountType === 'amount' ? 'قيمة الخصم (ج.م)' : 'نسبة الخصم (%)'}
                  </label>
                  <input
                    type="number"
                    value={localSettings.nextOrderRewardPercent || 15}
                    onChange={(e) => setLocalSettings({ ...localSettings, nextOrderRewardPercent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs font-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">عنوان بطاقة المكافأة</label>
                  <input
                    type="text"
                    value={localSettings.nextOrderRewardTitle || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, nextOrderRewardTitle: e.target.value })}
                    placeholder="هدية خاصة لطلبك القادم!"
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الرسالة التوضيحية للعميل</label>
                  <input
                    type="text"
                    value={localSettings.nextOrderRewardDesc || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, nextOrderRewardDesc: e.target.value })}
                    placeholder="احتفظ بهذا الكوبون واستخدمه في طلبك القادم..."
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                  <input
                    type="checkbox"
                    checked={localSettings.orderEnableCoupons !== false}
                    onChange={(e) => setLocalSettings({ ...localSettings, orderEnableCoupons: e.target.checked })}
                  />
                  <span>تفعيل خانة إدخال كوبونات الخصم داخل سلة الطلبات</span>
                </label>

                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={handlePersistAllSettings}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md"
                >
                  {savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات الشريط الترويجي وكوبون الطلب القادم'}
                </button>
              </div>
            </div>

            {/* 3. إعداد باقة توفير جديدة */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-black text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>3. إعداد خصم عند طلب مجموعة مذكرات محددة (باقات التوفير)</span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5 space-y-3">
                  <input
                    type="text"
                    value={bundleForm.title}
                    onChange={(e) => setBundleForm({ ...bundleForm, title: e.target.value })}
                    placeholder="اسم الباقة (مثال: باقة مراجعات المرحلة الإعدادية)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={bundleForm.description}
                    onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                    placeholder="وصف قصير للباقة..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />

                  <select
                    value={bundleForm.discountType}
                    onChange={(e) => setBundleForm({ ...bundleForm, discountType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="fixed_prices">تحديد السعر قبل وبعد الخصم (ج.م)</option>
                    <option value="percent">خصم نسبة مئوية (%)</option>
                    <option value="amount">خصم مبلغ ثابت (ج.م)</option>
                  </select>

                  {bundleForm.discountType === 'fixed_prices' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">السعر قبل الخصم</label>
                        <input
                          type="number"
                          value={bundleForm.beforePrice}
                          onChange={(e) => setBundleForm({ ...bundleForm, beforePrice: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">السعر بعد الخصم</label>
                        <input
                          type="number"
                          value={bundleForm.afterPrice}
                          onChange={(e) => setBundleForm({ ...bundleForm, afterPrice: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black text-emerald-700"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        {bundleForm.discountType === 'percent' ? 'نسبة الخصم (%)' : 'قيمة الخصم (ج.م)'}
                      </label>
                      <input
                        type="number"
                        value={bundleForm.discountValue}
                        onChange={(e) => setBundleForm({ ...bundleForm, discountValue: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      if (!bundleForm.title.trim() || bundleForm.notebookIds.length === 0) {
                        notify('يرجى إدخال اسم الباقة واختيار مذكرة واحدة على الأقل', 'error');
                        return;
                      }
                      const nextBundles = [
                        ...(localSettings.bundles || []),
                        { ...bundleForm, id: `bundle-${Date.now()}` }
                      ];
                      const updated = { ...localSettings, bundles: nextBundles };
                      setLocalSettings(updated);
                      await onSaveSettings(updated);
                      setBundleForm({
                        title: '',
                        description: '',
                        discountType: 'fixed_prices',
                        discountValue: 15,
                        beforePrice: 0,
                        afterPrice: 0,
                        notebookIds: []
                      });
                      notify('تم حفظ الباقة وتفعيلها بنجاح!', 'success');
                    }}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md"
                  >
                    + حفظ الباقة وتفعيل خصم المجموعة
                  </button>
                </div>

                <div className="lg:col-span-7 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-xs font-extrabold text-slate-700">
                    حدد المذكرات المشمولة في هذه الباقة ({bundleForm.notebookIds.length} مختارة):
                  </p>
                  <div className="max-h-56 overflow-y-auto space-y-1.5">
                    {notebooks.map((nb) => {
                      const checked = bundleForm.notebookIds.includes(nb.id);
                      return (
                        <label
                          key={nb.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold cursor-pointer hover:border-blue-400"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const nextIds = e.target.checked
                                  ? [...bundleForm.notebookIds, nb.id]
                                  : bundleForm.notebookIds.filter((id) => id !== nb.id);
                                const rawSum = nextIds.reduce((s, id) => {
                                  const f = notebooks.find((item) => item.id === id);
                                  return s + (Number(f?.price) || 0);
                                }, 0);
                                setBundleForm((prev) => ({
                                  ...prev,
                                  notebookIds: nextIds,
                                  beforePrice: rawSum
                                }));
                              }}
                            />
                            <span className="truncate">{nb.title} ({nb.grade})</span>
                          </div>
                          <span className="text-blue-600 font-black shrink-0">{nb.price} ج.م</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* الباقات المحفوظة حاليًا */}
              {(localSettings.bundles || []).length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-600">الباقات المفعّلة حاليًا ({localSettings.bundles.length}):</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {localSettings.bundles.map((b, idx) => (
                      <div key={b.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                        <div>
                          <h5 className="font-black text-xs sm:text-sm text-slate-900">{b.title}</h5>
                          <p className="text-[11px] text-slate-500">
                            {(b.notebookIds || []).length} مذكرات •{' '}
                            {b.discountType === 'fixed_prices'
                              ? `السعر: ${b.afterPrice} ج.م بدلاً من ${b.beforePrice} ج.م`
                              : b.discountType === 'amount'
                              ? `خصم ${b.discountValue} ج.م`
                              : `خصم ${b.discountValue}%`}
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
                            await onSaveSettings(updated);
                            notify('تم حذف الباقة', 'success');
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
            </div>

            {/* 4. إدارة كوبونات الخصم */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-black text-base flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-600" />
                <span>4. كوبونات الخصم الترويجية العامة</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="كود الكوبون (مثال: EL3B20)"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-black uppercase"
                />
                <select
                  value={couponForm.discountType}
                  onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  <option value="percent">نسبة مئوية (%)</option>
                  <option value="amount">مبلغ ثابت (ج.م)</option>
                </select>
                <input
                  type="number"
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                  placeholder="القيمة"
                  className="w-24 px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-black"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const code = (couponForm.code || generateUniqueCouponCode('OFFER')).trim().toUpperCase();
                    await addDoc(publicCol('coupons'), {
                      code,
                      discountType: couponForm.discountType,
                      discountValue: Number(couponForm.discountValue) || 10,
                      active: true,
                      used: false,
                      singleUse: false,
                      createdAt: serverTimestamp()
                    });
                    setCouponForm({ code: '', discountType: 'percent', discountValue: 15 });
                    notify(`تم إنشاء الكوبون (${code}) بنجاح!`, 'success');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs"
                >
                  + إنشاء كوبون
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {coupons.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm text-slate-900">{c.code}</span>
                      <p className="text-[11px] font-bold text-emerald-700">
                        خصم {c.discountType === 'amount' ? `${c.discountValue} ج.م` : `${c.discountValue}%`}
                        {c.used ? ' • (مستخدم)' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteDoc(publicDoc('coupons', c.id));
                        notify('تم حذف الكوبون', 'success');
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

        {/* ================================================================= */}
        {/* تبويب 4: إدارة طلبات العملاء                                      */}
        {/* ================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-black text-base">طلبات المعلمين والعملاء ({orders.length})</h3>

              {orders.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">لا توجد طلبات مسجلة حتى الآن.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => {
                    const cleanPhone = String(ord.phone || '').replace(/[^\d]/g, '');
                    const waPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
                    return (
                      <div key={ord.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-black text-xs">
                              {ord.orderNumber || ord.id.slice(0, 6)}
                            </span>
                            <span className="font-black text-sm text-slate-900">{ord.teacherName}</span>
                            {ord.phone && (
                              <span dir="ltr" className="text-xs font-bold text-slate-600">
                                ({ord.phone})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={ord.status || 'pending'}
                              onChange={async (e) => {
                                await updateDoc(publicDoc('orders', ord.id), { status: e.target.value });
                                notify('تم تحديث حالة الطلب', 'success');
                              }}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-extrabold"
                            >
                              <option value="pending">تم استلام الطلب</option>
                              <option value="processing">جاري التجهيز والطباعة</option>
                              <option value="completed">مكتمل وتم التسليم</option>
                            </select>

                            {waPhone && (
                              <a
                                href={`https://wa.me/${waPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>واتساب</span>
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={async () => {
                                await deleteDoc(publicDoc('orders', ord.id));
                                notify('تم حذف الطلب', 'success');
                              }}
                              className="p-1.5 rounded-xl bg-rose-50 text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {Array.isArray(ord.items) && ord.items.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {ord.items.map((it, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold">
                                {it.title} ({it.price} ج.م)
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                          <span>
                            الإجمالي المستحق: <strong className="text-blue-600">{ord.totalPrice || 0} ج.م</strong>
                            {ord.couponCode ? ` • كوبون: ${ord.couponCode}` : ''}
                          </span>
                          {ord.formDetails && typeof ord.formDetails === 'object' && (
                            <span className="text-[11px] text-slate-500">
                              {Object.entries(ord.formDetails)
                                .filter(([k, v]) => k !== 'teacherName' && k !== 'phone' && v)
                                .map(([, v]) => String(v))
                                .join(' | ')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* تبويب 5: إعدادات الموقع والمظهر وطلب العميل بالكامل               */}
        {/* ================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* 1. الهوية والشعار والواجهة الرئيسية */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-black text-base">1. الهوية والشعار والواجهة الرئيسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">اسم المنصة</label>
                  <input
                    type="text"
                    value={localSettings.siteName}
                    onChange={(e) => setLocalSettings({ ...localSettings, siteName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">الوصف الفرعي أسفل الاسم</label>
                  <input
                    type="text"
                    value={localSettings.siteSubtitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, siteSubtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700">شعار المنصة (Logo)</label>
                    {localSettings.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, logoUrl: '' })}
                        className="text-[11px] font-bold text-rose-600"
                      >
                        حذف الشعار
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const compressed = await compressImageFile(file, 400, 0.85);
                      setLocalSettings({ ...localSettings, logoUrl: compressed });
                    }}
                    className="w-full text-xs"
                  />
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[11px] font-bold text-slate-600">حجم الشعار:</span>
                    <input
                      type="range"
                      min="36"
                      max="90"
                      value={localSettings.logoSize || 54}
                      onChange={(e) => setLocalSettings({ ...localSettings, logoSize: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-xs font-black">{localSettings.logoSize || 54}px</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700">صورة خلفية الواجهة الرئيسية (Hero)</label>
                    {localSettings.heroBgImage && (
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, heroBgImage: '' })}
                        className="text-[11px] font-bold text-rose-600"
                      >
                        حذف الخلفية
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const compressed = await compressImageFile(file, 1100, 0.72);
                      setLocalSettings({ ...localSettings, heroBgImage: compressed });
                    }}
                    className="w-full text-xs"
                  />
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[11px] font-bold text-slate-600">وضوح الصورة:</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={localSettings.heroBgOpacity ?? 35}
                      onChange={(e) => setLocalSettings({ ...localSettings, heroBgOpacity: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-xs font-black">{localSettings.heroBgOpacity ?? 35}%</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">العنوان الرئيسي للواجهة الترحيبية</label>
                  <input
                    type="text"
                    value={localSettings.heroTitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">الوصف الترحيبي للواجهة</label>
                  <textarea
                    rows={2}
                    value={localSettings.heroDesc}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroDesc: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 2. التحكم في بطاقة لماذا يثق بنا المعلمون */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base">2. بطاقة «لماذا يثق بنا المعلمون؟»</h3>
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={localSettings.trustCardEnabled !== false}
                    onChange={(e) => setLocalSettings({ ...localSettings, trustCardEnabled: e.target.checked })}
                  />
                  <span>إظهار البطاقة</span>
                </label>
              </div>
              <input
                type="text"
                value={localSettings.trustCardTitle}
                onChange={(e) => setLocalSettings({ ...localSettings, trustCardTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
              />
              <div className="space-y-2">
                {(localSettings.trustCardPoints || []).map((pt, idx, arr) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, trustCardPoints: moveArrayItem(arr, idx, -1) })}
                        className="p-0.5 rounded bg-slate-100 border"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, trustCardPoints: moveArrayItem(arr, idx, 1) })}
                        className="p-0.5 rounded bg-slate-100 border"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={pt}
                      onChange={(e) => {
                        const copy = [...localSettings.trustCardPoints];
                        copy[idx] = e.target.value;
                        setLocalSettings({ ...localSettings, trustCardPoints: copy });
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          trustCardPoints: localSettings.trustCardPoints.filter((_, i) => i !== idx)
                        })
                      }
                      className="p-2 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      trustCardPoints: [...(localSettings.trustCardPoints || []), 'نقطة ميزة جديدة']
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold"
                >
                  + إضافة نقطة جديدة
                </button>
              </div>
            </div>

            {/* 3. إعدادات قسم «ما الجديد؟» وقسم «الأخبار والإعلانات» */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base">3. قسم «ما الجديد؟»</h3>
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={localSettings.whatsNewEnabled !== false}
                      onChange={(e) => setLocalSettings({ ...localSettings, whatsNewEnabled: e.target.checked })}
                    />
                    <span>تفعيل القسم</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={localSettings.whatsNewTitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, whatsNewTitle: e.target.value })}
                  placeholder="عنوان القسم..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
                <input
                  type="text"
                  value={localSettings.whatsNewSubtitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, whatsNewSubtitle: e.target.value })}
                  placeholder="الوصف الفرعي..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={localSettings.whatsNewMode || 'auto'}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewMode: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="auto">عرض تلقائي لأحدث المذكرات</option>
                    <option value="manual">اختيار يدوي لمذكرات محددة</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={localSettings.whatsNewCount || 6}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewCount: Number(e.target.value) })}
                    placeholder="عدد البطاقات"
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-black"
                  />
                </div>
                {localSettings.whatsNewMode === 'manual' && (
                  <div className="max-h-40 overflow-y-auto bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                    {notebooks.map((n) => (
                      <label key={n.id} className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(localSettings.whatsNewSelectedIds || []).includes(n.id)}
                          onChange={(e) => {
                            const prevIds = localSettings.whatsNewSelectedIds || [];
                            const nextIds = e.target.checked ? [...prevIds, n.id] : prevIds.filter((id) => id !== n.id);
                            setLocalSettings({ ...localSettings, whatsNewSelectedIds: nextIds });
                          }}
                        />
                        <span className="truncate">{n.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base">4. قسم «الأخبار والإعلانات»</h3>
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={localSettings.newsSectionEnabled !== false}
                      onChange={(e) => setLocalSettings({ ...localSettings, newsSectionEnabled: e.target.checked })}
                    />
                    <span>تفعيل القسم</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={localSettings.newsSectionTitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, newsSectionTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newNewsForm.badge}
                      onChange={(e) => setNewNewsForm({ ...newNewsForm, badge: e.target.value })}
                      placeholder="الشارة..."
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={newNewsForm.title}
                      onChange={(e) => setNewNewsForm({ ...newNewsForm, title: e.target.value })}
                      placeholder="عنوان الخبر..."
                      className="col-span-2 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNewsForm.content}
                      onChange={(e) => setNewNewsForm({ ...newNewsForm, content: e.target.value })}
                      placeholder="تفاصيل الإعلان أو الخبر..."
                      className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newNewsForm.title.trim()) return;
                        setLocalSettings((prev) => ({
                          ...prev,
                          newsItems: [...(prev.newsItems || []), { ...newNewsForm, id: `news-${Date.now()}` }]
                        }));
                        setNewNewsForm({ badge: 'قريبًا جدًا', title: '', content: '', color: 'amber' });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shrink-0"
                    >
                      + خبر
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {(localSettings.newsItems || []).map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border text-xs">
                      <span className="font-bold truncate">{item.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            newsItems: localSettings.newsItems.filter((_, i) => i !== idx)
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

            {/* 5. ترتيب أماكن العناصر داخل نافذة المذكرة + زر Google Drive */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-black text-base">5. ترتيب العناصر داخل صفحة المذكرة + إعدادات زر Google Drive</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600">رتّب أماكن ظهور العناصر بالأسهم (↑ / ↓):</p>
                  {(localSettings.notebookModalBlocksOrder || ['description', 'customNotice', 'generalNotice', 'driveButton']).map(
                    (blockKey, idx, arr) => {
                      const labels = {
                        description: 'وصف ومواصفات المذكرة',
                        customNotice: 'التنبيه الخاص بالمذكرة',
                        generalNotice: 'التنبيهات العامة للمنصة',
                        driveButton: 'زر معاينة Google Drive'
                      };
                      return (
                        <div key={blockKey} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold">
                          <span>{labels[blockKey] || blockKey}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setLocalSettings({
                                  ...localSettings,
                                  notebookModalBlocksOrder: moveArrayItem(arr, idx, -1)
                                })
                              }
                              className="p-1.5 rounded-lg bg-white border"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setLocalSettings({
                                  ...localSettings,
                                  notebookModalBlocksOrder: moveArrayItem(arr, idx, 1)
                                })
                              }
                              className="p-1.5 rounded-lg bg-white border"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">النص المكتوب على زر Google Drive</label>
                    <input
                      type="text"
                      value={localSettings.driveButtonText}
                      onChange={(e) => setLocalSettings({ ...localSettings, driveButtonText: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">النص الفرعي أسفل زر Google Drive</label>
                    <input
                      type="text"
                      value={localSettings.driveButtonSubtext}
                      onChange={(e) => setLocalSettings({ ...localSettings, driveButtonSubtext: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">لون زر وأيقونة Google Drive</label>
                    <select
                      value={localSettings.driveButtonTheme}
                      onChange={(e) => setLocalSettings({ ...localSettings, driveButtonTheme: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    >
                      <option value="emerald">أخضر زمردي</option>
                      <option value="blue">أزرق ملكي</option>
                      <option value="amber">ذهبي عنبري</option>
                      <option value="rose">أحمر ياقوتي</option>
                      <option value="purple">بنفسجي</option>
                      <option value="slate">داكن احترافي</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-600">التنبيهات العامة للمنصة (كل سطر في نقطة مستقلة)</label>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold">
                        <input
                          type="checkbox"
                          checked={localSettings.notebookNoticeEnabled !== false}
                          onChange={(e) => setLocalSettings({ ...localSettings, notebookNoticeEnabled: e.target.checked })}
                        />
                        <span>إظهار</span>
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      value={localSettings.notebookNoticeText}
                      onChange={(e) => setLocalSettings({ ...localSettings, notebookNoticeText: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 6. التحكم الكامل في نموذج طلب العميل */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-base">6. التحكم الكامل في حقول نموذج طلب العميل</h3>
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      orderFormFields: [
                        ...(prev.orderFormFields || []),
                        { id: `field_${Date.now()}`, label: 'حقل إضافي جديد', placeholder: '', type: 'text', required: false, visible: true }
                      ]
                    }))
                  }
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-extrabold text-xs"
                >
                  + إضافة حقل جديد للنموذج
                </button>
              </div>

              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200">
                <label className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                  <input
                    type="checkbox"
                    checked={localSettings.orderEnableMultiCart !== false}
                    onChange={(e) => setLocalSettings({ ...localSettings, orderEnableMultiCart: e.target.checked })}
                  />
                  <span>تفعيل السلة وطلب أكثر من مذكرة في نفس الطلب</span>
                </label>
              </div>

              <div className="space-y-2">
                {(localSettings.orderFormFields || []).map((f, idx, arr) => (
                  <div key={f.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, orderFormFields: moveArrayItem(arr, idx, -1) })}
                        className="p-0.5 rounded bg-white border"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, orderFormFields: moveArrayItem(arr, idx, 1) })}
                        className="p-0.5 rounded bg-white border"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => {
                        const copy = [...arr];
                        copy[idx] = { ...f, label: e.target.value };
                        setLocalSettings({ ...localSettings, orderFormFields: copy });
                      }}
                      className="flex-1 min-w-[160px] px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    />
                    <select
                      value={f.type}
                      onChange={(e) => {
                        const copy = [...arr];
                        copy[idx] = { ...f, type: e.target.value };
                        setLocalSettings({ ...localSettings, orderFormFields: copy });
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    >
                      <option value="text">نص قصير</option>
                      <option value="tel">رقم هاتف</option>
                      <option value="textarea">فقرة طويلة</option>
                      <option value="file">رفع صورة/شعار</option>
                    </select>
                    <label className="flex items-center gap-1 text-[11px] font-bold">
                      <input
                        type="checkbox"
                        checked={f.visible !== false}
                        onChange={(e) => {
                          const copy = [...arr];
                          copy[idx] = { ...f, visible: e.target.checked };
                          setLocalSettings({ ...localSettings, orderFormFields: copy });
                        }}
                      />
                      <span>ظاهر</span>
                    </label>
                    <label className="flex items-center gap-1 text-[11px] font-bold">
                      <input
                        type="checkbox"
                        checked={Boolean(f.required)}
                        onChange={(e) => {
                          const copy = [...arr];
                          copy[idx] = { ...f, required: e.target.checked };
                          setLocalSettings({ ...localSettings, orderFormFields: copy });
                        }}
                      />
                      <span>إلزامي</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          orderFormFields: arr.filter((_, i) => i !== idx)
                        })
                      }
                      className="p-1.5 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. التحكم الكامل في روابط التواصل الاجتماعي والنسخ الاحتياطي */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-black text-base">7. التحكم الكامل في وسائل وروابط التواصل الاجتماعي</h3>
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      socialLinks: [
                        ...(prev.socialLinks || []),
                        { id: `soc-${Date.now()}`, platform: 'auto', title: '', subtitle: '', url: '', visible: true }
                      ]
                    }))
                  }
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-extrabold text-xs"
                >
                  + إضافة رابط تواصل جديد
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">رقم واتساب استقبال الطلبات الآلي (بالكود الدولي 20)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={localSettings.whatsappNumber}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-black text-left"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">تعليمات الدفع والتحويل بعد الطلب</label>
                  <input
                    type="text"
                    value={localSettings.paymentInstructions}
                    onChange={(e) => setLocalSettings({ ...localSettings, paymentInstructions: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {(localSettings.socialLinks || []).map((item, idx, arr) => {
                  const detected = detectSocialPlatform(item.url, item.platform);
                  return (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2.5">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setLocalSettings({ ...localSettings, socialLinks: moveArrayItem(arr, idx, -1) })}
                          className="p-1 rounded bg-white border"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocalSettings({ ...localSettings, socialLinks: moveArrayItem(arr, idx, 1) })}
                          className="p-1 rounded bg-white border"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      <SocialPlatformBadge platform={detected} size="sm" />

                      <select
                        value={item.platform || 'auto'}
                        onChange={(e) => {
                          const copy = [...arr];
                          copy[idx] = { ...item, platform: e.target.value };
                          setLocalSettings({ ...localSettings, socialLinks: copy });
                        }}
                        className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                      >
                        <option value="auto">تلقائي</option>
                        <option value="whatsapp">واتساب</option>
                        <option value="whatsapp_group">جروب واتساب</option>
                        <option value="facebook">فيسبوك</option>
                        <option value="telegram">تليجرام</option>
                        <option value="youtube">يوتيوب</option>
                        <option value="instagram">إنستجرام</option>
                        <option value="tiktok">تيك توك</option>
                        <option value="phone">اتصال هاتفي</option>
                        <option value="website">موقع خارجي</option>
                      </select>

                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const copy = [...arr];
                          copy[idx] = { ...item, title: e.target.value };
                          setLocalSettings({ ...localSettings, socialLinks: copy });
                        }}
                        placeholder="العنوان (مثال: صفحتنا على فيسبوك)"
                        className="flex-1 min-w-[130px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                      />

                      <input
                        type="text"
                        value={item.subtitle || ''}
                        onChange={(e) => {
                          const copy = [...arr];
                          copy[idx] = { ...item, subtitle: e.target.value };
                          setLocalSettings({ ...localSettings, socialLinks: copy });
                        }}
                        placeholder="وصف قصير (اختياري)"
                        className="flex-1 min-w-[120px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                      />

                      <input
                        type="text"
                        dir="ltr"
                        value={item.url}
                        onChange={(e) => {
                          const copy = [...arr];
                          copy[idx] = { ...item, url: e.target.value };
                          setLocalSettings({ ...localSettings, socialLinks: copy });
                        }}
                        placeholder="https://..."
                        className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono text-left"
                      />

                      <label className="flex items-center gap-1 text-xs font-bold">
                        <input
                          type="checkbox"
                          checked={item.visible !== false}
                          onChange={(e) => {
                            const copy = [...arr];
                            copy[idx] = { ...item, visible: e.target.checked };
                            setLocalSettings({ ...localSettings, socialLinks: copy });
                          }}
                        />
                        <span>ظاهر</span>
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            socialLinks: arr.filter((_, i) => i !== idx)
                          })
                        }
                        className="p-2 rounded-xl bg-rose-50 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={handlePersistAllSettings}
                  className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg"
                >
                  {savingSettings ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات ومزامنتها'}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify({ settings: localSettings, notebooks }, null, 2)], {
                        type: 'application/json'
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `el3bakera-backup-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل نسخة احتياطية (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => restoreInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>استعادة نسخة احتياطية</span>
                  </button>
                  <input
                    ref={restoreInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        const parsed = JSON.parse(text);
                        if (parsed.settings) {
                          const normalized = normalizeSettings(parsed.settings);
                          setLocalSettings(normalized);
                          await onSaveSettings(normalized);
                        }
                        notify('تمت استعادة الإعدادات من النسخة الاحتياطية بنجاح!', 'success');
                      } catch {
                        notify('ملف النسخة الاحتياطية غير صالح', 'error');
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 11. المكون الرئيسي للمنصة (MuzakkiratiApp)
// ============================================================================
function MuzakkiratiApp() {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem(LS_SETTINGS_KEY);
      if (cached) return normalizeSettings(JSON.parse(cached));
    } catch {}
    return normalizeSettings(DEFAULT_SETTINGS);
  });

  const [notebooks, setNotebooks] = useState(() => {
    try {
      const cached = localStorage.getItem(LS_NOTEBOOKS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed.map((n) => normalizeNotebook(n, n.id));
      }
    } catch {}
    return [];
  });

  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [activePage, setActivePage] = useState('home');
  const [catalogNav, setCatalogNav] = useState({ category: '', stage: '', grade: '' });
  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // إدارة الدخول السري
  const [user, setUser] = useState(null);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPass, setLoginPass] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [customFirebaseInput, setCustomFirebaseInput] = useState('');
  const logoClickRef = useRef({ count: 0, timer: null });

  // تتبع الطلب
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrders, setTrackedOrders] = useState([]);
  const [trackSearched, setTrackSearched] = useState(false);
  const [copiedPromoCode, setCopiedPromoCode] = useState(false);

  // إشعارات الواجهة
  const [toast, setToast] = useState(null);
  const notify = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const isAdminAuthenticated = Boolean(user && !user.isAnonymous && user.email?.toLowerCase() === ADMIN_EMAIL);

  // المصادقة التلقائية للزوار + الاستماع لحالة الإدارة
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (err) {
          console.warn('Auth init warning:', err);
        }
      }
    });
    return () => unsub();
  }, []);

  // مزامنة الإعدادات والمذكرات والكوبونات من Firestore في الوقت الفعلي
  useEffect(() => {
    const unsubSettings = onSnapshot(
      publicDoc('settings', 'main'),
      (snap) => {
        if (snap.exists()) {
          const normalized = normalizeSettings(snap.data());
          setSettings(normalized);
          try {
            const lightCopy = { ...normalized, heroBgImage: '', categoryImages: {} };
            localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(lightCopy));
          } catch {}
        }
      },
      (err) => console.warn('Settings snapshot:', err)
    );

    const unsubNotebooks = onSnapshot(
      publicCol('notebooks'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeNotebook(d.data(), d.id));
        setNotebooks(list);
        try {
          const lightList = list.map((n) => ({ ...n, coverUrl: '', sampleUrls: [] }));
          localStorage.setItem(LS_NOTEBOOKS_KEY, JSON.stringify(lightList));
        } catch {}
      },
      (err) => console.warn('Notebooks snapshot:', err)
    );

    const unsubCoupons = onSnapshot(
      publicCol('coupons'),
      (snap) => {
        setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {}
    );

    return () => {
      unsubSettings();
      unsubNotebooks();
      unsubCoupons();
    };
  }, []);

  // الاستماع للطلبات
  useEffect(() => {
    const unsubOrders = onSnapshot(
      publicCol('orders'),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {}
    );
    return () => unsubOrders();
  }, []);

  // اختصارات فتح شاشة الإدارة السرية (Ctrl + Shift + L أو Alt + Shift + A أو #admin)
  useEffect(() => {
    const onKeyDown = (e) => {
      const k = String(e.key || '').toLowerCase();
      const isCtrlShiftL = (e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'l' || k === 'م' || e.code === 'KeyL');
      const isAltShiftA = e.altKey && e.shiftKey && (k === 'a' || k === 'ش' || e.code === 'KeyA');
      if (isCtrlShiftL || isAltShiftA) {
        e.preventDefault();
        if (isAdminAuthenticated) setShowAdminPortal(true);
        else setShowAdminLoginModal(true);
      }
    };
    const onHash = () => {
      if (window.location.hash === '#admin') {
        if (isAdminAuthenticated) setShowAdminPortal(true);
        else setShowAdminLoginModal(true);
      }
    };
    onHash();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('hashchange', onHash);
    };
  }, [isAdminAuthenticated]);

  const handleSecretLogoClick = () => {
    logoClickRef.current.count += 1;
    clearTimeout(logoClickRef.current.timer);
    if (logoClickRef.current.count >= 5) {
      logoClickRef.current.count = 0;
      if (isAdminAuthenticated) setShowAdminPortal(true);
      else setShowAdminLoginModal(true);
      return;
    }
    logoClickRef.current.timer = setTimeout(() => {
      logoClickRef.current.count = 0;
    }, 1500);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPass);
      if (cred.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
        await signOut(auth);
        notify('هذا الحساب غير مصرح له بالدخول للإدارة', 'error');
      } else {
        setShowAdminLoginModal(false);
        setShowAdminPortal(true);
        notify('مرحبًا بك في لوحة التحكم!', 'success');
      }
    } catch (err) {
      notify(`تعذر تسجيل الدخول: ${err?.message || ''}`, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSaveSettings = async (nextSettings) => {
    const normalized = normalizeSettings(nextSettings);
    await setDoc(publicDoc('settings', 'main'), normalized);
    setSettings(normalized);
    try {
      const lightCopy = { ...normalized, heroBgImage: '', categoryImages: {} };
      localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(lightCopy));
    } catch {}
  };

  // ربط التنقل وتصفح المجلدات والنوافذ بزر الرجوع للخلف في المتصفح والهاتف
  useEffect(() => {
    try {
      window.history.replaceState({ page: 'home', catalog: { category: '', stage: '', grade: '' } }, '');
    } catch {}

    const handlePopState = (event) => {
      if (previewNotebook) {
        setPreviewNotebook(null);
        return;
      }
      if (isCheckoutOpen) {
        setIsCheckoutOpen(false);
        return;
      }
      if (isContactModalOpen) {
        setIsContactModalOpen(false);
        return;
      }
      const state = event.state;
      if (state && state.page) {
        setActivePage(state.page);
        if (state.catalog) setCatalogNav(state.catalog);
      } else {
        setActivePage('home');
        setCatalogNav({ category: '', stage: '', grade: '' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [previewNotebook, isCheckoutOpen, isContactModalOpen]);

  const navigateTo = (page, catParams = null) => {
    const nextCatalog = catParams || (page === 'catalog' ? catalogNav : { category: '', stage: '', grade: '' });
    setActivePage(page);
    if (catParams) setCatalogNav(catParams);
    try {
      window.history.pushState({ page, catalog: nextCatalog }, '');
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCatalogFolderNav = (nextCatalog) => {
    setCatalogNav(nextCatalog);
    try {
      window.history.pushState({ page: 'catalog', catalog: nextCatalog }, '');
    } catch {}
  };

  const openNotebookPreview = (nb) => {
    setPreviewNotebook(nb);
    try {
      window.history.pushState({ page: activePage, catalog: catalogNav, modal: 'preview' }, '');
    } catch {}
  };

  const openCheckoutCart = () => {
    setIsCheckoutOpen(true);
    try {
      window.history.pushState({ page: activePage, catalog: catalogNav, modal: 'cart' }, '');
    } catch {}
  };

  const visibleNotebooks = useMemo(() => notebooks.filter((n) => n.visible !== false), [notebooks]);
  const comingSoonNotebooks = useMemo(() => visibleNotebooks.filter((n) => n.isComingSoon), [visibleNotebooks]);
  const whatsNewNotebooks = useMemo(() => {
    const count = Number(settings.whatsNewCount) || 6;
    if (settings.whatsNewMode === 'manual' && Array.isArray(settings.whatsNewSelectedIds) && settings.whatsNewSelectedIds.length > 0) {
      return settings.whatsNewSelectedIds
        .map((id) => visibleNotebooks.find((n) => n.id === id))
        .filter(Boolean)
        .slice(0, count);
    }
    return [...visibleNotebooks].slice(0, count);
  }, [visibleNotebooks, settings]);

  const cartIds = useMemo(() => new Set(cart.map((c) => c.id)), [cart]);

  const handleAddToCart = (nb) => {
    setCart((prev) => {
      if (prev.some((item) => item.id === nb.id)) {
        notify('المذكرة موجودة بالفعل في السلة', 'info');
        return prev;
      }
      notify('تمت إضافة المذكرة إلى السلة', 'success');
      return [...prev, nb];
    });
  };

  const handleOrderNow = (nb) => {
    setCart((prev) => (prev.some((item) => item.id === nb.id) ? prev : [...prev, nb]));
    openCheckoutCart();
  };

  const handleOrderBundle = (bundle, includedNotebooks) => {
    setCart((prev) => {
      const map = new Map(prev.map((i) => [i.id, i]));
      includedNotebooks.forEach((n) => map.set(n.id, n));
      return Array.from(map.values());
    });
    openCheckoutCart();
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    const q = trackQuery.trim().toLowerCase();
    if (!q) return;
    let source = orders;
    if (source.length === 0) {
      try {
        const snap = await getDocs(publicCol('orders'));
        source = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {}
    }
    const matches = source.filter(
      (o) =>
        String(o.orderNumber || '').toLowerCase().includes(q) ||
        String(o.phone || '').toLowerCase().includes(q)
    );
    setTrackedOrders(matches);
    setTrackSearched(true);
  };

  if (showAdminPortal && isAdminAuthenticated) {
    return (
      <>
        <AdminDashboard
          notebooks={notebooks}
          setNotebooks={setNotebooks}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          orders={orders}
          coupons={coupons}
          onLogout={async () => {
            await signOut(auth);
            setShowAdminPortal(false);
          }}
          onExitToSite={() => setShowAdminPortal(false)}
          notify={notify}
        />
        {toast && <ToastBanner toast={toast} />}
      </>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen w-full overflow-x-hidden flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* الشريط الترويجي العلوي مع التحكم الكامل باللون وزر نسخ الكوبون */}
      {settings.promoBarEnabled && settings.promoBarText && (() => {
        const promoThemes = {
          slate: 'bg-gradient-to-l from-slate-950 via-slate-900 to-slate-950 text-amber-300 border-white/10',
          blue: 'bg-gradient-to-l from-blue-900 via-blue-700 to-indigo-900 text-white border-blue-400/20',
          emerald: 'bg-gradient-to-l from-emerald-950 via-emerald-800 to-teal-900 text-emerald-100 border-emerald-400/20',
          rose: 'bg-gradient-to-l from-rose-950 via-rose-700 to-red-900 text-white border-rose-400/20',
          purple: 'bg-gradient-to-l from-purple-950 via-indigo-900 to-purple-950 text-amber-200 border-purple-400/20'
        };
        const barCls = promoThemes[settings.promoBarTheme] || promoThemes.slate;
        const promoCode = String(settings.promoBarCouponCode || '').trim().toUpperCase();

        return (
          <div className={`${barCls} text-[11px] sm:text-sm font-extrabold py-2.5 px-3 sm:px-4 text-center border-b leading-relaxed`}>
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <span>{settings.promoBarText}</span>
              {promoCode && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(promoCode);
                      setCopiedPromoCode(true);
                      notify(`تم نسخ كود الخصم (${promoCode}) — الصقه في السلة عند الطلب!`, 'success');
                      setTimeout(() => setCopiedPromoCode(false), 2500);
                    } catch {}
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-white text-slate-950 hover:bg-amber-300 text-[11px] sm:text-xs font-black transition shadow-sm"
                >
                  {copiedPromoCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                  <span>
                    {copiedPromoCode
                      ? `تم نسخ ${promoCode}`
                      : `${settings.promoBarCopyLabel || 'انسخ الكوبون'}: ${promoCode}`}
                  </span>
                </button>
              )}
              <button
                onClick={() => navigateTo('offers')}
                className="px-3 py-0.5 sm:py-1 rounded-full bg-amber-400 text-slate-950 hover:bg-amber-300 text-[11px] sm:text-xs font-black transition shadow-sm"
              >
                العروض ←
              </button>
            </div>
          </div>
        );
      })()}

      {/* شريط التنقل الرئيسي (Header) متجاوب 100% مع الهاتف والكمبيوتر */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-4">
          {/* الصف العلوي: الشعار واسم المنصة + أزرار السلة والتواصل ولوحة الإدارة */}
          <div className="flex items-center justify-between gap-2 w-full lg:w-auto min-w-0">
            <div
              onClick={handleSecretLogoClick}
              className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer select-none group text-right min-w-0 flex-1"
            >
              {settings.logoUrl ? (
                <div className="rounded-xl sm:rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-sm bg-slate-950 p-0.5 sm:p-1 shrink-0">
                  <img
                    src={settings.logoUrl}
                    alt={settings.siteName}
                    style={{ height: `${Math.min(Math.max(settings.logoSize || 54, 42), 76)}px` }}
                    className="w-auto max-h-11 sm:max-h-16 object-contain rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-700 to-slate-900 text-white flex items-center justify-center shadow-md shrink-0">
                  <BookOpen className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="font-black text-base sm:text-2xl lg:text-[25px] bg-gradient-to-l from-slate-950 via-blue-900 to-blue-700 bg-clip-text text-transparent leading-snug tracking-tight truncate sm:whitespace-normal">
                  {settings.siteName}
                </h1>
                {settings.siteSubtitle && (
                  <p className="text-[11px] sm:text-[13px] text-slate-600 font-bold truncate sm:flex items-center gap-1.5">
                    <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span>{settings.siteSubtitle}</span>
                  </p>
                )}
              </div>
            </div>

            {/* أزرار السلة والتواصل ولوحة الإدارة على الهاتف والتابلت */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 lg:hidden">
              {isAdminAuthenticated && (
                <button
                  onClick={() => setShowAdminPortal(true)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1 shadow-sm transition"
                  title="لوحة التحكم"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                </button>
              )}

              <button
                onClick={openCheckoutCart}
                className="relative px-2.5 sm:px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-[11px] sm:text-xs flex items-center gap-1 transition"
                title="سلة الطلبات"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span>السلة</span>
                {cart.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
                    {cart.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsContactModalOpen(true)}
                className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] sm:text-xs flex items-center gap-1 shadow-sm transition"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span>تواصل</span>
              </button>
            </div>
          </div>

          {/* روابط الصفحات: شبكة متساوية 4 أعمدة على الهاتف بدون أي خروج عن الشاشة */}
          <nav className="grid grid-cols-4 lg:flex items-center gap-1 sm:gap-1.5 bg-slate-100/95 p-1 sm:p-1.5 rounded-2xl border border-slate-200/80 w-full lg:w-auto">
            {[
              { id: 'home', label: 'الرئيسية', shortLabel: 'الرئيسية', icon: Home },
              { id: 'catalog', label: 'المذكرات', shortLabel: 'المذكرات', icon: BookOpen },
              { id: 'offers', label: 'العروض والباقات', shortLabel: 'العروض', icon: Percent },
              { id: 'track', label: 'تتبع طلبك', shortLabel: 'تتبع طلبك', icon: PackageCheck }
            ].map((item) => {
              const NavIcon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-extrabold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-white/70'
                  }`}
                >
                  <NavIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* أزرار السلة والتواصل ولوحة الإدارة لشاشات الكمبيوتر الكبيرة */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {isAdminAuthenticated && (
              <button
                onClick={() => setShowAdminPortal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-extrabold flex items-center gap-2 shadow-sm transition"
              >
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <span>لوحة التحكم</span>
              </button>
            )}

            <button
              onClick={openCheckoutCart}
              className="relative px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-sm flex items-center gap-2 transition"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>سلة الطلبات</span>
              {cart.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsContactModalOpen(true)}
              className="group relative px-5 py-2.5 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center gap-2.5 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <MessageCircle className="w-5 h-5" />
              <span>تواصل معنا</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* محتوى الصفحات                                                         */}
      {/* ===================================================================== */}
      <main className="flex-1 w-full overflow-x-hidden">
        {activePage === 'home' && (
          <div className="space-y-12 sm:space-y-14 pb-16">
            {/* 1. الواجهة الترحيبية (Hero Section) */}
            <section
              style={{ minHeight: `${Math.min(settings.heroHeight || 500, 560)}px` }}
              className="relative bg-slate-950 text-white flex items-center overflow-hidden"
            >
              {settings.heroBgImage && (
                <img
                  src={settings.heroBgImage}
                  alt=""
                  style={{ opacity: (settings.heroBgOpacity ?? 35) / 100 }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center w-full">
                <div className={`${settings.trustCardEnabled !== false ? 'lg:col-span-7' : 'lg:col-span-12 max-w-3xl'} space-y-4 sm:space-y-6 text-right`}>
                  {settings.heroBadge && (
                    <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] sm:text-xs font-extrabold max-w-full">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="truncate sm:whitespace-normal">{settings.heroBadge}</span>
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-snug sm:leading-tight break-words">
                    {settings.heroTitle}
                  </h2>
                  <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                    {settings.heroDesc}
                  </p>

                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => navigateTo('catalog', { category: '', stage: '', grade: '' })}
                      className="w-full sm:w-auto px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-blue-600/30 transition text-center"
                    >
                      تصفح مكتبة المذكرات
                    </button>
                    <button
                      onClick={openCheckoutCart}
                      className="w-full sm:w-auto px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-extrabold text-xs sm:text-sm transition text-center"
                    >
                      اطلب إعداد مذكرة خاصة
                    </button>
                  </div>
                </div>

                {/* بطاقة لماذا يثق بنا المعلمون */}
                {settings.trustCardEnabled !== false && (
                  <div className="lg:col-span-5">
                    <div className="bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
                      <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        <span>{settings.trustCardTitle}</span>
                      </h3>
                      <ul className="space-y-3">
                        {(settings.trustCardPoints || []).map((pt, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 2. الأقسام الرئيسية للمذكرات والكورسات */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  الأقسام الرئيسية للمذكرات والكورسات
                </h3>
                <p className="text-sm text-slate-500 mt-1.5">
                  اختر القسم المناسب لتصفح مجلدات المراحل والصفوف الدراسية
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {settings.categories.map((cat) => {
                  const count = visibleNotebooks.filter((n) => n.category === cat).length;
                  const bgImg = settings.categoryImages?.[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => navigateTo('catalog', { category: cat, stage: '', grade: '' })}
                      className="overflow-hidden bg-white rounded-3xl border border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-300 text-right group flex flex-col"
                    >
                      {bgImg ? (
                        <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                          <img
                            src={bgImg}
                            alt={cat}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-3 left-3 px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md text-white text-xs font-black shadow-md">
                            {count} مذكرة متاحة
                          </span>
                        </div>
                      ) : (
                        <div className="relative h-36 w-full bg-gradient-to-br from-blue-600 to-indigo-700 p-6 flex items-center justify-between text-white">
                          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                            <BookOpen className="w-7 h-7" />
                          </div>
                          <span className="px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-black">
                            {count} مذكرة متاحة
                          </span>
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col justify-between w-full bg-white">
                        <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition">{cat}</h4>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs font-extrabold text-blue-600">
                          <span>تصفح المراحل والصفوف الدراسية</span>
                          <span>←</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3. قسم «ما الجديد؟» أحدث المذكرات والإصدارات */}
            {settings.whatsNewEnabled && whatsNewNotebooks.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold">
                      إصدارات حديثة
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{settings.whatsNewTitle}</h3>
                    <p className="text-sm text-slate-500 mt-1">{settings.whatsNewSubtitle}</p>
                  </div>
                  <button
                    onClick={() => navigateTo('catalog', { category: '', stage: '', grade: '' })}
                    className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                  >
                    عرض جميع المذكرات ←
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {whatsNewNotebooks.map((nb) => (
                    <NotebookCard
                      key={nb.id}
                      notebook={nb}
                      onPreview={openNotebookPreview}
                      onOrderNow={handleOrderNow}
                      onAddToCart={handleAddToCart}
                      isInCart={cartIds.has(nb.id)}
                      enableCart={settings.orderEnableMultiCart}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 4. قسم الأخبار والإعلانات والمذكرات قيد التجهيز */}
            {settings.newsSectionEnabled &&
              ((settings.newsItems || []).length > 0 || comingSoonNotebooks.length > 0) && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
                  <div className="text-center max-w-2xl mx-auto">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                      <Megaphone className="w-3.5 h-3.5" />
                      تنويهات وإصدارات قادمة
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{settings.newsSectionTitle}</h3>
                    <p className="text-sm text-slate-500 mt-1">{settings.newsSectionSubtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(settings.newsItems || []).map((news) => (
                      <div
                        key={news.id}
                        className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3"
                      >
                        <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold">
                          {news.badge}
                        </span>
                        <h4 className="text-lg font-black text-slate-900">{news.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{news.content}</p>
                      </div>
                    ))}

                    {comingSoonNotebooks.map((nb) => (
                      <div
                        key={nb.id}
                        className="bg-gradient-to-l from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <span className="inline-block px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                            قيد التجهيز • حجز مسبق
                          </span>
                          <h4 className="text-base font-black text-slate-900">{nb.title}</h4>
                          <p className="text-xs text-slate-600">
                            {nb.grade} • {nb.subject}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOrderNow(nb)}
                          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shrink-0"
                        >
                          احجز مسبقًا
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
          </div>
        )}

        {activePage === 'catalog' && (
          <CatalogPage
            notebooks={notebooks}
            settings={settings}
            navState={catalogNav}
            onNavigateCatalog={handleCatalogFolderNav}
            onPreview={openNotebookPreview}
            onOrderNow={handleOrderNow}
            onAddToCart={handleAddToCart}
            cartIds={cartIds}
            onRequestPreOrder={openCheckoutCart}
          />
        )}

        {activePage === 'offers' && (
          <OffersAndBundlesPage
            notebooks={visibleNotebooks}
            settings={settings}
            coupons={coupons}
            onPreview={openNotebookPreview}
            onOrderBundle={handleOrderBundle}
            onNotify={notify}
          />
        )}

        {activePage === 'track' && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <PackageCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">تتبع حالة طلبك</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                أدخل رقم الطلب (مثال: ORD-123456) أو رقم هاتفك المسجل في الطلب
              </p>

              <form onSubmit={handleTrackOrder} className="flex gap-2 pt-2">
                <input
                  type="text"
                  required
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="رقم الطلب أو رقم الهاتف..."
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition"
                >
                  بحث
                </button>
              </form>
            </div>

            {trackSearched && (
              <div className="space-y-3">
                {trackedOrders.length === 0 ? (
                  <div className="bg-white rounded-3xl p-6 text-center border border-slate-200 text-sm text-slate-500">
                    لم يتم العثور على طلبات مطابقة، تأكد من الرقم أو تواصل معنا عبر واتساب.
                  </div>
                ) : (
                  trackedOrders.map((o) => (
                    <div key={o.id} className="bg-white rounded-3xl p-5 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-blue-600">{o.orderNumber}</span>
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                          {o.status === 'completed'
                            ? 'مكتمل وتم التسليم'
                            : o.status === 'processing'
                            ? 'جاري التجهيز والطباعة'
                            : 'تم استلام الطلب'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        الاسم: <strong>{o.teacherName}</strong> • الإجمالي: <strong>{o.totalPrice} ج.م</strong>
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* تذييل الصفحة النظيف (Footer بدون أي أيقونة إدارة ظاهرة) */}
      <footer className="bg-slate-950 text-slate-300 py-10 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h4 className="text-white font-black text-base">{settings.siteName}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{settings.siteSubtitle}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-extrabold text-sm">روابط سريعة</h4>
            <div className="flex flex-col gap-1.5 text-xs text-slate-400">
              <button onClick={() => navigateTo('catalog')} className="text-right hover:text-white">
                تصفح جميع المذكرات
              </button>
              <button onClick={() => navigateTo('offers')} className="text-right hover:text-white">
                العروض والباقات وكوبونات الخصم
              </button>
              <button onClick={() => navigateTo('track')} className="text-right hover:text-white">
                متابعة حالة الطلب
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-sm">تواصل معنا</h4>
            <div className="flex flex-wrap gap-2.5">
              {(settings.socialLinks || [])
                .filter((s) => s.visible !== false && s.url)
                .map((s) => {
                  const plat = detectSocialPlatform(s.url, s.platform);
                  const href = formatSocialHref(s.url, plat);
                  return (
                    <a
                      key={s.id}
                      href={href}
                      target={href.startsWith('tel:') ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      title={s.title || plat}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
                    >
                      <SocialPlatformBadge platform={plat} size="sm" />
                      {s.title && <span>{s.title}</span>}
                    </a>
                  );
                })}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10 text-center text-xs text-slate-500">
          جميع الحقوق محفوظة © {new Date().getFullYear()} {settings.siteName}
        </div>
      </footer>

      {/* شريط سلة الطلبات العائم أسفل الشاشة عند وجود مذكرات في السلة */}
      {cart.length > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 z-40">
          <button
            onClick={openCheckoutCart}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-2xl shadow-blue-600/40 flex items-center justify-between sm:justify-center gap-4 border border-blue-400/30 transition"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-white text-blue-700 font-black text-xs flex items-center justify-center">
                {cart.length}
              </span>
              <span>عرض سلة الطلبات وإتمام الطلب</span>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-blue-800 text-amber-300 text-xs font-black">
              {cart.reduce((s, item) => s + (Number(item.price) || 0), 0)} ج.م ←
            </span>
          </button>
        </div>
      )}

      {/* نافذة معاينة المذكرة */}
      {previewNotebook && (
        <ProtectedPreviewModal
          notebook={previewNotebook}
          settings={settings}
          onClose={() => setPreviewNotebook(null)}
          onAddToCart={handleAddToCart}
          onOrderNow={handleOrderNow}
          isInCart={cartIds.has(previewNotebook.id)}
        />
      )}

      {/* نافذة سلة المشتريات وإتمام الطلب */}
      {isCheckoutOpen && (
        <OrderCheckoutModal
          cart={cart}
          allNotebooks={visibleNotebooks}
          settings={settings}
          coupons={coupons}
          onClose={() => setIsCheckoutOpen(false)}
          onAddNotebookToCart={handleAddToCart}
          onRemoveFromCart={(id) => setCart((prev) => prev.filter((item) => item.id !== id))}
          onClearCart={() => setCart([])}
          onNotify={notify}
        />
      )}

      {/* نافذة وسائل التواصل المنبثقة */}
      {isContactModalOpen && (
        <div
          dir="rtl"
          onClick={() => setIsContactModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* رأس النافذة الفخم */}
            <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-slate-950 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-white">تواصل معنا مباشرة</h3>
                  <p className="text-xs text-slate-300 mt-0.5">اختر وسيلة التواصل المناسبة لك للرد السريع</p>
                </div>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* قائمة الروابط المنظمة بدون أي فراغ أو تكرار */}
            <div className="p-5 sm:p-6 space-y-3 max-h-[68vh] overflow-y-auto">
              {(settings.socialLinks || [])
                .filter((s) => s.visible !== false && s.url)
                .map((s) => {
                  const plat = detectSocialPlatform(s.url, s.platform);
                  const href = formatSocialHref(s.url, plat);
                  const meta = getDefaultSocialMeta(plat);
                  const cleanTitle =
                    s.title && s.title.trim() && s.title.trim() !== 'وسيلة تواصل جديدة'
                      ? s.title.trim()
                      : meta.title;
                  const cleanSubtitle =
                    s.subtitle && s.subtitle.trim() ? s.subtitle.trim() : meta.subtitle;

                  return (
                    <a
                      key={s.id}
                      href={href}
                      target={href.startsWith('tel:') ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group ${meta.cardBg}`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SocialPlatformBadge platform={plat} />
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                            {cleanTitle}
                          </h4>
                          <p className="text-xs text-slate-600 truncate mt-0.5">{cleanSubtitle}</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <ExternalLink className={`w-4 h-4 ${meta.arrowColor}`} />
                      </div>
                    </a>
                  );
                })}

              {(settings.socialLinks || []).filter((s) => s.visible !== false && s.url).length === 0 && (
                <div className="text-center py-8 space-y-2">
                  <p className="text-sm font-bold text-slate-700">لم يتم إضافة روابط تواصل نشطة بعد</p>
                  <p className="text-xs text-slate-500">يمكنك إضافتها من تبويب إعدادات الموقع في لوحة التحكم</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل دخول المدير المخفية */}
      {showAdminLoginModal && (
        <div dir="rtl" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">دخول لوحة تحكم الإدارة</h3>
                  <p className="text-xs text-slate-500">مخصص لإدارة المنصة فقط</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAdminLoginModal(false);
                  if (window.location.hash === '#admin') {
                    window.history.replaceState(null, '', window.location.pathname);
                  }
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              {(!hasValidFirebaseKey || showKeySetup) && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-2 text-right">
                  <p className="text-xs font-extrabold text-amber-900">
                    ⚠️ مفتاح Firebase غير مفعّل في متغيرات البيئة:
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    الصق كود <code className="bg-white px-1 rounded">firebaseConfig</code> من إعدادات مشروعك في Firebase (أو أضف <code className="bg-white px-1 rounded">VITE_FIREBASE_API_KEY</code> في Vercel) وسيعمل فورًا وتعود كل بياناتك:
                  </p>
                  <textarea
                    rows={3}
                    dir="ltr"
                    value={customFirebaseInput}
                    onChange={(e) => setCustomFirebaseInput(e.target.value)}
                    placeholder='{"apiKey": "AIzaSy...", "authDomain": "el3bakera-edu.firebaseapp.com", "projectId": "el3bakera-edu", ...}'
                    className="w-full p-2 rounded-xl border border-amber-300 bg-white text-[11px] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const raw = customFirebaseInput.trim();
                        const apiKeyMatch = raw.match(/apiKey\s*:\s*["']([^"']+)["']/);
                        const authDomainMatch = raw.match(/authDomain\s*:\s*["']([^"']+)["']/);
                        const projectIdMatch = raw.match(/projectId\s*:\s*["']([^"']+)["']/);
                        const appIdMatch = raw.match(/appId\s*:\s*["']([^"']+)["']/);
                        let parsed = null;
                        if (raw.startsWith('{') && raw.includes('"apiKey"')) {
                          parsed = JSON.parse(raw);
                        } else if (apiKeyMatch) {
                          parsed = {
                            apiKey: apiKeyMatch[1],
                            authDomain: authDomainMatch?.[1] || 'el3bakera-edu.firebaseapp.com',
                            projectId: projectIdMatch?.[1] || 'el3bakera-edu',
                            storageBucket: 'el3bakera-edu.firebasestorage.app',
                            appId: appIdMatch?.[1] || ''
                          };
                        }
                        if (!parsed || !parsed.apiKey) {
                          notify('تعذر قراءة apiKey، تأكد من نسخ كود firebaseConfig كاملًا', 'error');
                          return;
                        }
                        localStorage.setItem(LS_FIREBASE_CFG_KEY, JSON.stringify(parsed));
                        window.location.reload();
                      } catch {
                        notify('صيغة الكود غير صحيحة', 'error');
                      }
                    }}
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs"
                  >
                    حفظ الربط وإعادة تحميل المنصة
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-left"
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition"
              >
                {loginLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && <ToastBanner toast={toast} />}
    </div>
  );
}

function ToastBanner({ toast }) {
  const styles =
    toast.type === 'error'
      ? 'bg-rose-950 text-rose-100 border-rose-700'
      : toast.type === 'success'
      ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
      : 'bg-slate-900 text-white border-slate-700';

  return (
    <div
      dir="rtl"
      className={`fixed bottom-5 left-5 z-50 px-5 py-3.5 rounded-2xl border shadow-2xl text-xs font-extrabold flex items-center gap-2.5 max-w-sm ${styles}`}
    >
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span>{toast.msg}</span>
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
