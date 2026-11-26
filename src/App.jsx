import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  BookOpen,
  ShoppingCart,
  ShieldCheck,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Lock,
  Sparkles,
  Tag,
  Package,
  Layers,
  Bell,
  Phone,
  Send,
  ExternalLink,
  Copy,
  Download,
  Upload,
  LogOut,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  FolderOpen,
  GraduationCap,
  FileText,
  Image as ImageIcon,
  Globe,
  MessageCircle,
  Share2,
  Percent,
  Gift,
  Sliders,
  LayoutGrid,
  Save,
  RefreshCw,
  ArrowRight,
  Home
} from 'lucide-react';

// ============================================================================
// 1. إعدادات Firebase والاتصال بقاعدة البيانات
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyD_du5VY8nJGDJ169Fof9EAlI9x2W2d-14",
  authDomain: "el3bakera-edu.firebaseapp.com",
  projectId: "el3bakera-edu",
  storageBucket: "el3bakera-edu.firebasestorage.app",
  messagingSenderId: "74663879858",
  appId: "1:74663879858:web:4327c0ea1b825dd6c615ab"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = 'el3bakera-edu';
const ADMIN_EMAIL = 'mahmoudelzaaty7@gmail.com';
const LS_SETTINGS_KEY = 'el3bakera_settings_v5';
const LS_NOTEBOOKS_KEY = 'el3bakera_notebooks_v5';

const publicCol = (colName) => collection(db, 'artifacts', APP_ID, 'public', 'data', colName);
const publicDoc = (colName, docId) => doc(db, 'artifacts', APP_ID, 'public', 'data', colName, docId);

// ============================================================================
// 2. القيم الافتراضية ودوال التطبيع والمساعدة
// ============================================================================
const DEFAULT_SETTINGS = {
  siteName: 'منصة العباقرة للمذكرات التعليمية',
  siteTagline: 'مذكرات دراسية احترافية مخصصة للمعلم باسمه وبياناته الخاصة',
  logoUrl: '',
  logoSize: 64,
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة باحترافية ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة بيانات المعلم وشعاره على الغلاف وجميع الصفحات.',
  heroBadge: 'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
  heroBgImage: '',
  heroOverlayOpacity: 78,
  heroMinHeight: 460,
  whatsappNumber: '201068481536',
  paymentInstructions: 'فودافون كاش / إنستاباي: 01068481536 — أرسل صورة التحويل على واتساب لتأكيد الطلب وبدء التخصيص فورًا.',
  generalNotices:
    '- يتم تسليم المذكرة بصيغة PDF عالية الدقة جاهزة للطباعة ببيانات المعلم دون أي بيانات تخصنا.\n- العلامة المائية باسم المعلم أو اسم السلسلة الخاص به، وغير متاح إرسال المذكرات بدونها.',
  driveButtonText: 'معاينة نسخة إضافية على Google Drive',
  driveButtonSubtext: 'تصفح عينات إضافية عالية الدقة قبل الطلب',
  driveButtonColor: 'emerald',
  notebookModalBlocksOrder: ['description', 'customNotice', 'generalNotices', 'driveLink'],
  promoBannerEnabled: true,
  promoBannerText: 'عرض خاص للمعلمين: خصم 15% على جميع مذكرات الترم الأول + إضافة الشعار مجانًا لفترة محدودة!',
  promoBannerColor: 'slate',
  promoBannerCoupon: 'EL3B15',
  promoBannerCopyText: 'انسخ الكوبون',
  nextOrderRewardEnabled: true,
  nextOrderRewardMode: 'auto', // 'auto' | 'custom'
  nextOrderRewardCustomCode: 'NEXT15',
  nextOrderRewardType: 'percent', // 'percent' | 'fixed'
  nextOrderRewardValue: 15,
  nextOrderRewardTitle: 'هدية خاصة لطلبك القادم!',
  nextOrderRewardMessage: 'استخدم كود الخصم التالي عند طلبك القادم للحصول على خصم فوري:',
  trustCardEnabled: true,
  trustCardTitle: 'لماذا يثق بنا المعلمون؟',
  trustCardItems: [
    'محتوى علمي منقح ومطابق لأحدث مواصفات الوزارة',
    'وضع اسم المعلم ورقم الهاتف والشعار على جميع الصفحات',
    'معاينة حقيقية لصفحات المذكرة قبل تأكيد الطلب',
    'تسليم سريع بصيغة PDF عالية الدقة جاهزة للطباعة',
    'خدمة عملاء حقيقية لحل أي مشكلة'
  ],
  whatsNewEnabled: true,
  whatsNewTitle: 'ما الجديد؟ أحدث المذكرات والإصدارات',
  whatsNewMode: 'auto', // 'auto' | 'manual'
  whatsNewLimit: 6,
  whatsNewManualIds: [],
  newsSectionEnabled: true,
  newsSectionTitle: 'أخبار المنصة ومذكرات قيد التجهيز',
  newsItems: [
    {
      id: 'news_1',
      title: 'جارٍ تجهيز مراجعات ليلة الامتحان النهائية لجميع الصفوف',
      badge: 'قريبًا',
      date: 'محدث باستمرار',
      details: 'يمكنك حجز نسختك مسبقًا عبر الواتساب للحصول على أولوية التسليم.'
    }
  ],
  categories: ['مذكرات الترم الأول', 'مذكرات الترم الثاني', 'كورسات التأسيس'],
  categoryImages: {},
  stages: ['المرحلة الابتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية'],
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
  subjects: ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية'],
  socialLinks: [
    {
      id: 'soc_wa',
      platform: 'auto',
      title: 'محادثة واتساب مباشرة',
      subtitle: 'تواصل فوري للرد على جميع الاستفسارات',
      url: 'https://wa.me/201068481536',
      visible: true
    },
    {
      id: 'soc_fb',
      platform: 'auto',
      title: 'صفحتنا الرسمية على فيسبوك',
      subtitle: 'تابع أحدث العينات والعروض اليومية',
      url: 'https://www.facebook.com',
      visible: true
    }
  ],
  checkoutFields: [
    { id: 'teacherName', label: 'اسم المعلم (كما سيُكتب على المذكرة)', placeholder: 'مثال: أ/ محمود شحاتة', type: 'text', required: true, visible: true },
    { id: 'phone', label: 'رقم الواتساب للتواصل وإرسال الملفات', placeholder: '010xxxxxxxx', type: 'tel', required: true, visible: true },
    { id: 'seriesTitle', label: 'اسم السلسلة أو السنتر (اختياري)', placeholder: 'مثال: سلسلة العباقرة في اللغة العربية', type: 'text', required: false, visible: true },
    { id: 'governorate', label: 'المحافظة / الإدارة التعليمية', placeholder: 'مثال: الغربية - المحلة الكبرى', type: 'text', required: false, visible: true },
    { id: 'logoUpload', label: 'شعار المعلم (Logo) لإضافته للغلاف والصفحات', placeholder: '', type: 'file', required: false, visible: true },
    { id: 'notes', label: 'ملاحظات إضافية للتصميم أو الألوان', placeholder: 'اكتب أي تفاصيل إضافية تريدها...', type: 'textarea', required: false, visible: true }
  ],
  bundles: []
};

function normalizeSettings(raw = {}) {
  const merged = { ...DEFAULT_SETTINGS, ...(raw || {}) };
  if (!Array.isArray(merged.categories) || merged.categories.length === 0) merged.categories = [...DEFAULT_SETTINGS.categories];
  if (!Array.isArray(merged.stages) || merged.stages.length === 0) merged.stages = [...DEFAULT_SETTINGS.stages];
  if (!Array.isArray(merged.grades) || merged.grades.length === 0) merged.grades = [...DEFAULT_SETTINGS.grades];
  if (!Array.isArray(merged.subjects) || merged.subjects.length === 0) merged.subjects = [...DEFAULT_SETTINGS.subjects];
  if (!Array.isArray(merged.trustCardItems)) merged.trustCardItems = [...DEFAULT_SETTINGS.trustCardItems];
  if (!Array.isArray(merged.socialLinks)) merged.socialLinks = [...DEFAULT_SETTINGS.socialLinks];
  if (!Array.isArray(merged.checkoutFields) || merged.checkoutFields.length === 0) merged.checkoutFields = [...DEFAULT_SETTINGS.checkoutFields];
  if (!Array.isArray(merged.bundles)) merged.bundles = [];
  if (!Array.isArray(merged.newsItems)) merged.newsItems = [];
  if (!Array.isArray(merged.whatsNewManualIds)) merged.whatsNewManualIds = [];
  if (!Array.isArray(merged.notebookModalBlocksOrder) || merged.notebookModalBlocksOrder.length === 0) {
    merged.notebookModalBlocksOrder = [...DEFAULT_SETTINGS.notebookModalBlocksOrder];
  }
  if (!merged.categoryImages || typeof merged.categoryImages !== 'object') merged.categoryImages = {};
  return merged;
}

function normalizeNotebook(raw = {}, id = '') {
  return {
    id: id || raw.id || '',
    title: raw.title || 'مذكرة دراسية',
    category: raw.category || 'مذكرات الترم الأول',
    stage: raw.stage || 'المرحلة الإعدادية',
    grade: raw.grade || 'الصف الثالث الإعدادي',
    subject: raw.subject || 'اللغة العربية',
    price: Number(raw.price) || 0,
    oldPrice: Number(raw.oldPrice) || 0,
    pagesCount: Number(raw.pagesCount) || 0,
    badge: raw.badge || '',
    description: raw.description || '',
    customNoticeTitle: raw.customNoticeTitle || 'ملاحظة هامة حول هذه المذكرة',
    customNoticeBadge: raw.customNoticeBadge || 'هام جدًا',
    customNoticeTheme: raw.customNoticeTheme || 'amber',
    customNotice: raw.customNotice || '',
    comingSoon: Boolean(raw.comingSoon),
    driveUrl: raw.driveUrl || '',
    coverUrl: raw.coverUrl || '',
    sampleUrls: Array.isArray(raw.sampleUrls) ? raw.sampleUrls : [],
    sampleChunksCount: Number(raw.sampleChunksCount) || 0,
    createdAt: raw.createdAt || null
  };
}

function generateUniqueCouponCode(prefix = 'EL3B') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix;
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ضغط الصور بذكاء للحفاظ على الجودة العالية وتفادي تجاوز حدود قاعدة البيانات
function compressImageFile(file, maxWidth = 950, quality = 0.78) {
  return new Promise((resolve, reject) => {
    try {
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
        img.onerror = () => reject(new Error('تعذر قراءة الصورة'));
        img.src = event.target.result;
      };
      reader.onerror = () => reject(new Error('تعذر تحميل الملف'));
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err);
    }
  });
}

// التعرف التلقائي على منصة التواصل الاجتماعي وأيقونتها ولونها
function detectSocialPlatform(url = '', explicitPlatform = 'auto') {
  const u = (url || '').toLowerCase();
  const type =
    explicitPlatform && explicitPlatform !== 'auto'
      ? explicitPlatform
      : u.includes('chat.whatsapp.com')
      ? 'whatsapp_group'
      : u.includes('wa.me') || u.includes('whatsapp')
      ? 'whatsapp'
      : u.includes('facebook.com') || u.includes('fb.com')
      ? 'facebook'
      : u.includes('t.me') || u.includes('telegram')
      ? 'telegram'
      : u.includes('youtube.com') || u.includes('youtu.be')
      ? 'youtube'
      : u.includes('instagram.com')
      ? 'instagram'
      : u.includes('tiktok.com')
      ? 'tiktok'
      : u.startsWith('tel:')
      ? 'phone'
      : 'website';

  const map = {
    whatsapp: {
      name: 'واتساب مباشر',
      defaultTitle: 'محادثة واتساب مباشرة',
      bg: 'bg-emerald-600',
      softBg: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70',
      text: 'text-emerald-700',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.458 3.475 1.328 4.988L2 22l5.188-1.359a9.93 9.93 0 0 0 4.843 1.258h.004c5.515 0 9.968-4.453 9.968-9.969A9.91 9.91 0 0 0 19.08 4.91 9.903 9.903 0 0 0 12.031 2zm5.805 14.273c-.246.692-1.43 1.324-1.977 1.406-.508.076-1.152.109-1.859-.117-.43-.137-.98-.32-1.688-.625-2.968-1.281-4.906-4.273-5.055-4.472-.148-.199-1.207-1.606-1.207-3.063 0-1.457.762-2.172 1.031-2.469.27-.297.59-.371.785-.371.195 0 .391.004.563.012.18.008.422-.07.66.504.246.59.836 2.039.91 2.188.074.148.121.32.023.52-.098.199-.148.32-.297.492-.148.172-.312.383-.445.516-.148.148-.305.309-.133.605.172.297.766 1.262 1.645 2.043 1.133 1.008 2.086 1.32 2.383 1.469.297.148.469.125.641-.074.172-.199.738-.859.934-1.156.195-.297.391-.246.66-.148.27.098 1.719.812 2.012.961.297.148.492.223.566.348.074.125.074.719-.172 1.41z" />
        </svg>
      )
    },
    whatsapp_group: {
      name: 'جروب واتساب',
      defaultTitle: 'انضم لجروب المعلمين على واتساب',
      bg: 'bg-teal-600',
      softBg: 'bg-teal-50 border-teal-200 hover:bg-teal-100/70',
      text: 'text-teal-700',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.458 3.475 1.328 4.988L2 22l5.188-1.359a9.93 9.93 0 0 0 4.843 1.258h.004c5.515 0 9.968-4.453 9.968-9.969A9.91 9.91 0 0 0 19.08 4.91 9.903 9.903 0 0 0 12.031 2zm5.805 14.273c-.246.692-1.43 1.324-1.977 1.406-.508.076-1.152.109-1.859-.117-.43-.137-.98-.32-1.688-.625-2.968-1.281-4.906-4.273-5.055-4.472-.148-.199-1.207-1.606-1.207-3.063 0-1.457.762-2.172 1.031-2.469.27-.297.59-.371.785-.371.195 0 .391.004.563.012.18.008.422-.07.66.504.246.59.836 2.039.91 2.188.074.148.121.32.023.52-.098.199-.148.32-.297.492-.148.172-.312.383-.445.516-.148.148-.305.309-.133.605.172.297.766 1.262 1.645 2.043 1.133 1.008 2.086 1.32 2.383 1.469.297.148.469.125.641-.074.172-.199.738-.859.934-1.156.195-.297.391-.246.66-.148.27.098 1.719.812 2.012.961.297.148.492.223.566.348.074.125.074.719-.172 1.41z" />
        </svg>
      )
    },
    facebook: {
      name: 'فيسبوك',
      defaultTitle: 'صفحتنا على فيسبوك',
      bg: 'bg-blue-600',
      softBg: 'bg-blue-50 border-blue-200 hover:bg-blue-100/70',
      text: 'text-blue-700',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
      )
    },
    telegram: {
      name: 'تليجرام',
      defaultTitle: 'قناتنا على تليجرام',
      bg: 'bg-sky-500',
      softBg: 'bg-sky-50 border-sky-200 hover:bg-sky-100/70',
      text: 'text-sky-700',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      )
    },
    youtube: {
      name: 'يوتيوب',
      defaultTitle: 'قناتنا على يوتيوب',
      bg: 'bg-red-600',
      softBg: 'bg-red-50 border-red-200 hover:bg-red-100/70',
      text: 'text-red-700',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    },
    instagram: {
      name: 'إنستجرام',
      defaultTitle: 'حسابنا على إنستجرام',
      bg: 'bg-pink-600',
      softBg: 'bg-pink-50 border-pink-200 hover:bg-pink-100/70',
      text: 'text-pink-700',
      svg: <Globe className="w-5 h-5" />
    },
    tiktok: {
      name: 'تيك توك',
      defaultTitle: 'حسابنا على تيك توك',
      bg: 'bg-slate-900',
      softBg: 'bg-slate-100 border-slate-300 hover:bg-slate-200/70',
      text: 'text-slate-900',
      svg: <Globe className="w-5 h-5" />
    },
    phone: {
      name: 'اتصال هاتفي',
      defaultTitle: 'اتصال هاتفي مباشر',
      bg: 'bg-indigo-600',
      softBg: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100/70',
      text: 'text-indigo-700',
      svg: <Phone className="w-5 h-5" />
    },
    website: {
      name: 'رابط خارجي',
      defaultTitle: 'زيارة الرابط',
      bg: 'bg-slate-800',
      softBg: 'bg-slate-50 border-slate-200 hover:bg-slate-100',
      text: 'text-slate-800',
      svg: <Globe className="w-5 h-5" />
    }
  };

  return { type, ...(map[type] || map.website) };
}

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
        <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-xl border border-red-100 p-8 max-w-md w-full text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-black text-slate-900">حدث خطأ أثناء تحميل الواجهة</h2>
            <p className="text-sm text-slate-600">{this.state.errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 3. نافذة معاينة المذكرة وتفاصيلها (ProtectedPreviewModal)
// ============================================================================
function ProtectedPreviewModal({ notebook, settings, onClose, onAddToCart, isInCart }) {
  const [samples, setSamples] = useState(notebook.sampleUrls || []);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchSamples = async () => {
      if (notebook.sampleUrls && notebook.sampleUrls.length > 0) {
        setSamples(notebook.sampleUrls);
        return;
      }
      setLoadingSamples(true);
      try {
        // محاولة جلب المستند الموحد أو الأجزاء المقسمة
        const mainSampleSnap = await getDoc(publicDoc('notebook_samples', notebook.id));
        let collected = [];
        if (mainSampleSnap.exists()) {
          const d = mainSampleSnap.data();
          if (Array.isArray(d.urls) && d.urls.length > 0) {
            collected = d.urls;
          } else if (d.chunksCount > 0) {
            for (let i = 0; i < d.chunksCount; i++) {
              const partSnap = await getDoc(publicDoc('notebook_samples', `${notebook.id}_part_${i}`));
              if (partSnap.exists() && Array.isArray(partSnap.data().urls)) {
                collected = [...collected, ...partSnap.data().urls];
              }
            }
          }
        }
        if (mounted) setSamples(collected);
      } catch (e) {
        console.warn('Error fetching samples:', e);
      } finally {
        if (mounted) setLoadingSamples(false);
      }
    };
    fetchSamples();
    return () => {
      mounted = false;
    };
  }, [notebook]);

  const allPages = useMemo(() => {
    const arr = [];
    if (notebook.coverUrl) arr.push(notebook.coverUrl);
    samples.forEach((u) => {
      if (u && u !== notebook.coverUrl) arr.push(u);
    });
    return arr;
  }, [notebook.coverUrl, samples]);

  const noticeThemeMap = {
    red: 'border-r-red-600 bg-red-50/70 border-red-200 text-red-950 badge-bg-red-600',
    amber: 'border-r-amber-500 bg-amber-50/70 border-amber-200 text-amber-950',
    blue: 'border-r-blue-600 bg-blue-50/70 border-blue-200 text-blue-950',
    emerald: 'border-r-emerald-600 bg-emerald-50/70 border-emerald-200 text-emerald-950',
    purple: 'border-r-purple-600 bg-purple-50/70 border-purple-200 text-purple-950'
  };

  const badgeColorMap = {
    red: 'bg-red-600 text-white',
    amber: 'bg-amber-500 text-slate-950',
    blue: 'bg-blue-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    purple: 'bg-purple-600 text-white'
  };

  const driveColorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900 icon-bg-blue-600',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900 icon-bg-emerald-600',
    slate: 'bg-slate-100 border-slate-300 text-slate-900 icon-bg-slate-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900 icon-bg-amber-500',
    red: 'bg-red-50 border-red-200 text-red-900 icon-bg-red-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-900 icon-bg-purple-600'
  };

  const parsedGeneralNotices = useMemo(() => {
    const raw = settings.generalNotices || '';
    return raw
      .split(/\n|(?=\s-\s)/)
      .map((line) => line.replace(/^[\s\-•*]+/, '').trim())
      .filter(Boolean);
  }, [settings.generalNotices]);

  const renderBlock = (blockKey) => {
    if (blockKey === 'description') {
      return (
        <div key="description" className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-right">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold">{notebook.category}</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 text-xs font-bold">{notebook.stage}</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">{notebook.grade}</span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-xs font-bold">{notebook.subject}</span>
            {notebook.pagesCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
                {notebook.pagesCount} صفحة
              </span>
            )}
          </div>
          {notebook.description && (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{notebook.description}</p>
          )}
        </div>
      );
    }

    if (blockKey === 'customNotice' && notebook.customNotice) {
      const theme = notebook.customNoticeTheme || 'amber';
      return (
        <div
          key="customNotice"
          className={`rounded-2xl p-4 border border-r-4 shadow-sm text-right space-y-2 ${
            noticeThemeMap[theme] || noticeThemeMap.amber
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 font-black text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
              <span>{notebook.customNoticeTitle || 'ملاحظة هامة حول هذه المذكرة'}</span>
            </div>
            {notebook.customNoticeBadge && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-black shadow-sm flex items-center gap-1 ${
                  badgeColorMap[theme] || badgeColorMap.amber
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {notebook.customNoticeBadge}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold leading-relaxed whitespace-pre-line">{notebook.customNotice}</p>
        </div>
      );
    }

    if (blockKey === 'generalNotices' && parsedGeneralNotices.length > 0) {
      return (
        <div key="generalNotices" className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-right space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
            <Bell className="w-4 h-4 text-amber-600 shrink-0" />
            <span>تنبيه هام قبل تأكيد الطلب</span>
          </div>
          <ul className="space-y-1.5 text-xs sm:text-sm text-amber-950">
            {parsedGeneralNotices.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (blockKey === 'driveLink' && notebook.driveUrl) {
      const dColor = settings.driveButtonColor || 'emerald';
      const iconBg =
        dColor === 'blue'
          ? 'bg-blue-600'
          : dColor === 'slate'
          ? 'bg-slate-900'
          : dColor === 'amber'
          ? 'bg-amber-500'
          : dColor === 'red'
          ? 'bg-red-600'
          : dColor === 'purple'
          ? 'bg-purple-600'
          : 'bg-emerald-600';

      return (
        <a
          key="driveLink"
          href={notebook.driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all hover:shadow-md ${
            driveColorMap[dColor] || driveColorMap.emerald
          }`}
        >
          <div className="flex items-center gap-3 text-right">
            <div className={`w-10 h-10 rounded-xl ${iconBg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm">{settings.driveButtonText || 'معاينة نسخة إضافية على Google Drive'}</div>
              {settings.driveButtonSubtext && (
                <div className="text-xs opacity-80 mt-0.5">{settings.driveButtonSubtext}</div>
              )}
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 shrink-0 opacity-70" />
        </a>
      );
    }

    return null;
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden my-auto border border-slate-200">
        {/* رأس النافذة */}
        <div className="bg-slate-950 text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="text-right min-w-0">
            <h3 className="text-base sm:text-xl font-black truncate">{notebook.title}</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {notebook.grade} • {notebook.subject}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوى النافذة */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-6 max-h-[82vh] overflow-y-auto">
          {/* عمود معاينة الصفحات */}
          <div className="lg:col-span-6 space-y-3">
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="relative bg-slate-100 rounded-2xl border border-slate-200 h-[340px] sm:h-[430px] flex items-center justify-center overflow-hidden select-none"
            >
              {loadingSamples && allPages.length <= 1 ? (
                <div className="text-center space-y-2 text-slate-500">
                  <RefreshCw className="w-7 h-7 animate-spin mx-auto text-blue-600" />
                  <p className="text-xs font-bold">جارٍ تحميل صفحات العينة...</p>
                </div>
              ) : allPages.length > 0 ? (
                <>
                  <img
                    src={allPages[activeIdx] || allPages[0]}
                    alt={notebook.title}
                    draggable={false}
                    className="max-h-full max-w-full object-contain pointer-events-none"
                  />
                  {/* طبقة حماية خفيفة لمنع السحب المباشر */}
                  <div className="absolute inset-0 bg-transparent" />
                  {allPages.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveIdx((prev) => (prev > 0 ? prev - 1 : allPages.length - 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/75 text-white flex items-center justify-center hover:bg-slate-900"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setActiveIdx((prev) => (prev < allPages.length - 1 ? prev + 1 : 0))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/75 text-white flex items-center justify-center hover:bg-slate-900"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-xs font-bold px-3 py-1 rounded-full">
                        صفحة {activeIdx + 1} من {allPages.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-400 space-y-2">
                  <BookOpen className="w-12 h-12 mx-auto" />
                  <p className="text-xs font-bold">لا توجد صفحات عينة مرفوعة بعد</p>
                </div>
              )}
            </div>

            {/* شريط مصغرات الصفحات */}
            {allPages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {allPages.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIdx(idx)}
                    className={`w-14 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition ${
                      activeIdx === idx ? 'border-blue-600 ring-2 ring-blue-200' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* عمود التفاصيل والتنبيهات والطلب */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {(settings.notebookModalBlocksOrder || DEFAULT_SETTINGS.notebookModalBlocksOrder).map((blockKey) =>
                renderBlock(blockKey)
              )}
            </div>

            {/* شريط السعر وزر الإضافة للسلة */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-right">
                <div className="text-xs text-slate-500 font-bold">سعر المذكرة</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-600">{notebook.price} ج.م</span>
                  {notebook.oldPrice > notebook.price && (
                    <span className="text-sm text-slate-400 line-through">{notebook.oldPrice} ج.م</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onAddToCart(notebook)}
                className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg transition ${
                  isInCart
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isInCart ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>مضافة في السلة (أضف مرة أخرى)</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>{notebook.comingSoon ? 'احجز نسختك مسبقًا' : 'أضف إلى سلة الطلبات'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. بطاقة المذكرة (NotebookCard)
// ============================================================================
function NotebookCard({ notebook, onPreview, onAddToCart, isInCart }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group">
      <div>
        {/* صورة الغلاف */}
        <div
          onClick={() => onPreview(notebook)}
          className="relative h-56 bg-slate-100 overflow-hidden cursor-pointer"
        >
          {notebook.coverUrl ? (
            <img
              src={notebook.coverUrl}
              alt={notebook.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200">
              <BookOpen className="w-12 h-12 mb-2 text-blue-500/60" />
              <span className="text-xs font-bold">{notebook.subject}</span>
            </div>
          )}

          {/* شارات الغلاف */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-start">
            {notebook.comingSoon && (
              <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow">
                قريبًا / حجز مسبق
              </span>
            )}
            {notebook.badge && (
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-black shadow">
                {notebook.badge}
              </span>
            )}
          </div>

          {notebook.pagesCount > 0 && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 text-white text-xs font-bold backdrop-blur-sm">
              {notebook.pagesCount} صفحة
            </span>
          )}
        </div>

        {/* محتوى البطاقة */}
        <div className="p-4 sm:p-5 text-right space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
              {notebook.category}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
              {notebook.grade}
            </span>
          </div>

          <h3
            onClick={() => onPreview(notebook)}
            className="text-lg sm:text-xl font-black text-slate-950 leading-snug border-r-4 border-blue-600 pr-2.5 cursor-pointer hover:text-blue-700 transition"
          >
            {notebook.title}
          </h3>

          {notebook.description && (
            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">{notebook.description}</p>
          )}
        </div>
      </div>

      {/* السعر والأزرار */}
      <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
            {notebook.subject}
          </span>
          <div className="flex items-baseline gap-2">
            {notebook.oldPrice > notebook.price && (
              <span className="text-xs text-slate-400 line-through">{notebook.oldPrice} ج.م</span>
            )}
            <span className="text-xl font-black text-blue-600">{notebook.price} ج.م</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onPreview(notebook)}
            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>معاينة العينة</span>
          </button>
          <button
            onClick={() => onAddToCart(notebook)}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              isInCart
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isInCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            <span>{isInCart ? 'في السلة' : 'أضف للسلة'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. نافذة سلة الطلبات وإتمام الطلب (OrderCheckoutModal)
// ============================================================================
function OrderCheckoutModal({
  cart,
  settings,
  coupons,
  onClose,
  onRemoveItem,
  onClearCart,
  onOrderCreated
}) {
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [expandedBundles, setExpandedBundles] = useState({});
  const [formData, setFormData] = useState({});
  const [logoPreview, setLogoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [copiedReward, setCopiedReward] = useState(false);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0), [cart]);

  // التحقق من وجود باقة توفير مطابقة للمذكرات الفردية في السلة (فقط للعناصر غير المضافة كباقة مسبقة)
  const matchedBundleDiscount = useMemo(() => {
    const bundles = settings.bundles || [];
    const singleItems = cart.filter((c) => !c.isBundle);
    const cartIds = new Set(singleItems.map((c) => c.id));
    let bestSaving = 0;
    let bestBundleName = '';

    bundles.forEach((b) => {
      const ids = b.notebookIds || [];
      if (ids.length > 0 && ids.every((id) => cartIds.has(id))) {
        const itemsSum = ids.reduce((acc, id) => {
          const item = singleItems.find((c) => c.id === id);
          return acc + (Number(item?.price) || 0);
        }, 0);

        let bundleFinal = itemsSum;
        if (b.pricingMode === 'manual' && Number(b.bundlePrice) > 0) {
          bundleFinal = Number(b.bundlePrice);
        } else if (b.pricingMode === 'fixed' && Number(b.discountValue) > 0) {
          bundleFinal = Math.max(0, itemsSum - Number(b.discountValue));
        } else if (Number(b.discountValue) > 0) {
          bundleFinal = Math.round(itemsSum * (1 - Number(b.discountValue) / 100));
        }

        const saving = Math.max(0, itemsSum - bundleFinal);
        if (saving > bestSaving) {
          bestSaving = saving;
          bestBundleName = b.title || 'باقة توفير';
        }
      }
    });

    return { saving: bestSaving, name: bestBundleName };
  }, [cart, settings.bundles]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const afterBundle = Math.max(0, subtotal - matchedBundleDiscount.saving);
    if (appliedCoupon.type === 'fixed') {
      return Math.min(afterBundle, Number(appliedCoupon.value) || 0);
    }
    return Math.round((afterBundle * (Number(appliedCoupon.value) || 0)) / 100);
  }, [appliedCoupon, subtotal, matchedBundleDiscount.saving]);

  const finalTotal = Math.max(0, subtotal - matchedBundleDiscount.saving - couponDiscount);

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    // التحقق من كوبون الشريط الترويجي أو الكوبونات المسجلة
    if (settings.promoBannerEnabled && settings.promoBannerCoupon?.trim().toUpperCase() === code) {
      setAppliedCoupon({ code, type: 'percent', value: 15, label: 'كوبون العرض الترويجي' });
      return;
    }

    const found = coupons.find((c) => (c.code || '').trim().toUpperCase() === code && c.active !== false);
    if (!found) {
      setCouponError('كود الخصم غير صحيح أو منتهي الصلاحية');
      setAppliedCoupon(null);
      return;
    }
    if (found.singleUse && found.used) {
      setCouponError('تم استخدام هذا الكوبون مسبقًا');
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(found);
  };

  const handleFileFieldChange = async (fieldId, file) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 500, 0.75);
      setLogoPreview(compressed);
      setFormData((prev) => ({ ...prev, [fieldId]: 'تم إرفاق الشعار بنجاح' }));
    } catch {
      setFormData((prev) => ({ ...prev, [fieldId]: file.name }));
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const visibleFields = (settings.checkoutFields || []).filter((f) => f.visible !== false);
    for (const f of visibleFields) {
      if (f.required && !String(formData[f.id] || '').trim()) {
        setCouponError(`يرجى ملء حقل: ${f.label}`);
        return;
      }
    }

    setSubmitting(true);
    setCouponError('');
    try {
      const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      let nextOrderCouponCode = '';

      if (settings.nextOrderRewardEnabled) {
        if (settings.nextOrderRewardMode === 'custom' && settings.nextOrderRewardCustomCode?.trim()) {
          nextOrderCouponCode = settings.nextOrderRewardCustomCode.trim().toUpperCase();
        } else {
          nextOrderCouponCode = generateUniqueCouponCode('VIP');
          await addDoc(publicCol('coupons'), {
            code: nextOrderCouponCode,
            type: settings.nextOrderRewardType || 'percent',
            value: Number(settings.nextOrderRewardValue) || 15,
            active: true,
            singleUse: true,
            used: false,
            sourceOrder: orderNumber,
            createdAt: serverTimestamp()
          });
        }
      }

      if (appliedCoupon?.id && appliedCoupon?.singleUse) {
        await updateDoc(publicDoc('coupons', appliedCoupon.id), { used: true }).catch(() => {});
      }

      const orderRecord = {
        orderNumber,
        items: cart.map((c) => ({
          id: c.id,
          title: c.title,
          price: c.price,
          grade: c.grade || '',
          subject: c.subject || '',
          isBundle: Boolean(c.isBundle),
          bundleItems: c.bundleItems || []
        })),
        subtotal,
        bundleDiscount: matchedBundleDiscount.saving,
        couponCode: appliedCoupon?.code || '',
        couponDiscount,
        total: finalTotal,
        customerData: formData,
        hasLogo: Boolean(logoPreview),
        nextOrderCouponCode,
        status: 'تم الاستلام',
        createdAt: serverTimestamp()
      };

      await addDoc(publicCol('orders'), orderRecord);
      setCompletedOrder(orderRecord);
      onClearCart();
      if (onOrderCreated) onOrderCreated(orderRecord);
    } catch (err) {
      console.error(err);
      setCouponError('حدث خطأ أثناء حفظ الطلب، يمكنك إرساله مباشرة عبر واتساب.');
    } finally {
      setSubmitting(false);
    }
  };

  const buildWhatsappMessage = (orderObj) => {
    const lines = [
      `السلام عليكم، أرغب في تأكيد طلبي من *${settings.siteName}*`,
      `*رقم الطلب:* ${orderObj.orderNumber}`,
      `------------------`,
      `*الطلبات المختارة:*`,
      ...orderObj.items.map((it, idx) =>
        it.isBundle
          ? `${idx + 1}. [باقة] ${it.title} (${it.price} ج.م) — تشمل: ${(it.bundleItems || []).map((b) => b.title).join('، ')}`
          : `${idx + 1}. ${it.title} (${it.price} ج.م)`
      ),
      `------------------`,
      `*الإجمالي النهائي:* ${orderObj.total} ج.م`
    ];
    Object.entries(orderObj.customerData || {}).forEach(([k, v]) => {
      if (v) {
        const fieldDef = (settings.checkoutFields || []).find((f) => f.id === k);
        lines.push(`• ${fieldDef?.label || k}: ${v}`);
      }
    });
    return `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto border border-slate-200">
        <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-black">{completedOrder ? 'تم تسجيل طلبك بنجاح!' : 'سلة الطلبات وإتمام الحجز'}</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[82vh] overflow-y-auto space-y-5">
          {completedOrder ? (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">شكرًا لك! تم تسجيل طلبك بنجاح</h4>
                <p className="text-sm text-slate-600">
                  رقم متابعة الطلب الخاص بك: <span className="font-black text-blue-600 select-all">{completedOrder.orderNumber}</span>
                </p>
              </div>

              {completedOrder.nextOrderCouponCode && (
                <div className="bg-gradient-to-l from-amber-50 to-orange-50 border-2 border-dashed border-amber-400 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-amber-900 font-black text-sm">
                    <Gift className="w-5 h-5 text-amber-600" />
                    <span>{settings.nextOrderRewardTitle || 'هدية خاصة لطلبك القادم!'}</span>
                  </div>
                  <p className="text-xs text-slate-700">{settings.nextOrderRewardMessage}</p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="px-4 py-2 rounded-xl bg-white border border-amber-300 font-black text-base text-slate-900 tracking-wider">
                      {completedOrder.nextOrderCouponCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(completedOrder.nextOrderCouponCode);
                        setCopiedReward(true);
                        setTimeout(() => setCopiedReward(false), 2000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedReward ? 'تم النسخ!' : 'انسخ الكوبون'}</span>
                    </button>
                  </div>
                </div>
              )}

              {settings.paymentInstructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs sm:text-sm text-blue-950 font-bold text-right leading-relaxed">
                  {settings.paymentInstructions}
                </div>
              )}

              <a
                href={buildWhatsappMessage(completedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>إرسال تفاصيل الطلب على واتساب للتأكيد</span>
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-4 text-right">
              {/* قائمة العناصر في السلة (فصل الباقات المجمعة عن المذكرات الفردية) */}
              <div className="space-y-2.5">
                <div className="font-black text-sm text-slate-800">محتويات سلة الطلبات ({cart.length}):</div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pl-0.5">
                  {cart.map((item) => {
                    if (item.isBundle) {
                      const isExpanded = Boolean(expandedBundles[item.id]);
                      return (
                        <div
                          key={item.id}
                          className="bg-gradient-to-l from-blue-50/90 to-indigo-50/60 border border-blue-200 rounded-2xl p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-black">
                                  باقة مجمعة
                                </span>
                                <span className="font-black text-sm text-slate-950 truncate">{item.title}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span className="font-black text-blue-700">{item.price} ج.م</span>
                                {item.originalPrice > item.price && (
                                  <span className="text-slate-400 line-through">{item.originalPrice} ج.م</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedBundles((p) => ({ ...p, [item.id]: !p[item.id] }))
                                  }
                                  className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-0.5"
                                >
                                  <span>({item.bundleItems?.length || 0} مذكرات)</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              title="حذف الباقة من السلة"
                              className="p-2 text-red-600 hover:bg-red-100/70 rounded-xl shrink-0 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {isExpanded && item.bundleItems?.length > 0 && (
                            <div className="bg-white/80 rounded-xl p-2.5 border border-blue-100 space-y-1 text-[11px] text-slate-700">
                              {item.bundleItems.map((sub, i) => (
                                <div key={sub.id || i} className="flex items-center justify-between gap-2">
                                  <span className="truncate">• {sub.title}</span>
                                  <span className="text-slate-400 shrink-0">{sub.grade}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-900 truncate">{item.title}</div>
                          <div className="text-xs text-slate-500">{item.grade} • {item.price} ج.م</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* كود الخصم */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-xs font-black text-slate-700 block">هل لديك كوبون خصم؟</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="أدخل كود الكوبون هنا..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold uppercase bg-white"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponInput('');
                        setCouponError('');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs sm:text-sm hover:bg-red-700 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>إلغاء</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800"
                    >
                      تطبيق
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                    <span className="text-xs font-bold text-emerald-700">
                      تم تطبيق الكوبون ({appliedCoupon.code}) بنجاح!
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponInput('');
                        setCouponError('');
                      }}
                      className="text-xs font-black text-red-600 hover:bg-red-100 px-2 py-1 rounded-lg flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الكوبون</span>
                    </button>
                  </div>
                )}
                {couponError && <p className="text-xs font-bold text-red-600">{couponError}</p>}
              </div>

              {/* ملخص الحساب */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">{subtotal} ج.م</span>
                </div>
                {matchedBundleDiscount.saving > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>خصم الباقة ({matchedBundleDiscount.name}):</span>
                    <span>- {matchedBundleDiscount.saving} ج.م</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-bold">
                    <div className="flex items-center gap-1.5">
                      <span>خصم الكوبون ({appliedCoupon?.code}):</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponInput('');
                        }}
                        title="حذف الكوبون"
                        className="text-[11px] text-red-600 hover:underline font-black"
                      >
                        [حذف]
                      </button>
                    </div>
                    <span>- {couponDiscount} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-blue-900 pt-2 border-t border-blue-200">
                  <span>الإجمالي النهائي المطلوب:</span>
                  <span>{finalTotal} ج.م</span>
                </div>
              </div>

              {/* حقول بيانات المعلم */}
              <div className="space-y-3">
                <div className="font-black text-sm text-slate-900">بيانات التخصيص والتواصل:</div>
                {(settings.checkoutFields || [])
                  .filter((f) => f.visible !== false)
                  .map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          required={field.required}
                          placeholder={field.placeholder}
                          value={formData[field.id] || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      ) : field.type === 'file' ? (
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileFieldChange(field.id, e.target.files?.[0])}
                            className="text-xs file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-bold"
                          />
                          {logoPreview && (
                            <img src={logoPreview} alt="Logo" className="w-10 h-10 rounded-lg object-cover border" />
                          )}
                        </div>
                      ) : (
                        <input
                          type={field.type || 'text'}
                          required={field.required}
                          placeholder={field.placeholder}
                          value={formData[field.id] || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      )}
                    </div>
                  ))}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{submitting ? 'جارٍ تسجيل الطلب...' : 'تأكيد الطلب والمتابعة إلى واتساب'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. صفحة مكتبة المذكرات والمجلدات (CatalogPage)
// ============================================================================
function CatalogPage({
  notebooks,
  settings,
  selectedCategory,
  setSelectedCategory,
  selectedStage,
  setSelectedStage,
  selectedGrade,
  setSelectedGrade,
  onPreview,
  onAddToCart,
  cartIds
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('الكل');

  const filteredNotebooks = useMemo(() => {
    return notebooks.filter((nb) => {
      if (selectedCategory && nb.category !== selectedCategory) return false;
      if (selectedStage && nb.stage !== selectedStage) return false;
      if (selectedGrade && nb.grade !== selectedGrade) return false;
      if (selectedSubject !== 'الكل' && nb.subject !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = (nb.title || '').toLowerCase().includes(q);
        const matchDesc = (nb.description || '').toLowerCase().includes(q);
        const matchSub = (nb.subject || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSub) return false;
      }
      return true;
    });
  }, [notebooks, selectedCategory, selectedStage, selectedGrade, selectedSubject, searchQuery]);

  // عرض المجلدات الهرمية إذا لم يتم اختيار صف أو البحث
  const showFolderBrowser = !searchQuery.trim() && (!selectedCategory || !selectedStage || !selectedGrade);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 text-right">
      {/* شريط المسار والبحث */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-bold">
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedStage('');
                setSelectedGrade('');
              }}
              className="text-blue-600 hover:underline"
            >
              جميع الأقسام
            </button>
            {selectedCategory && (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <button
                  onClick={() => {
                    setSelectedStage('');
                    setSelectedGrade('');
                  }}
                  className="text-blue-600 hover:underline"
                >
                  {selectedCategory}
                </button>
              </>
            )}
            {selectedStage && (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <button onClick={() => setSelectedGrade('')} className="text-blue-600 hover:underline">
                  {selectedStage}
                </button>
              </>
            )}
            {selectedGrade && (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <span className="text-slate-900">{selectedGrade}</span>
              </>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المذكرة أو المادة..."
              className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* فلترة سريعة بالمادة */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['الكل', ...(settings.subjects || [])].map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                selectedSubject === sub
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* متصفح المجلدات */}
      {showFolderBrowser && (
        <div className="space-y-4">
          {!selectedCategory ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(settings.categories || []).map((cat) => {
                const count = notebooks.filter((n) => n.category === cat).length;
                const img = settings.categoryImages?.[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition text-right group"
                  >
                    <div className="h-40 bg-gradient-to-br from-blue-600 to-indigo-800 relative overflow-hidden">
                      {img && <img src={img} alt={cat} className="w-full h-full object-cover group-hover:scale-105 transition" />}
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/75 text-white text-xs font-bold">
                        {count} مذكرة
                      </span>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <span className="font-black text-base text-slate-900">{cat}</span>
                      <ChevronLeft className="w-5 h-5 text-blue-600" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : !selectedStage ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(settings.stages || []).map((st) => {
                const count = notebooks.filter((n) => n.category === selectedCategory && n.stage === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setSelectedStage(st)}
                    className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition flex items-center justify-between text-right"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-black text-base text-slate-900">{st}</div>
                        <div className="text-xs text-slate-500">{count} مذكرة متاحة</div>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(settings.grades || []).map((gr) => {
                const count = notebooks.filter(
                  (n) => n.category === selectedCategory && n.stage === selectedStage && n.grade === gr
                ).length;
                return (
                  <button
                    key={gr}
                    onClick={() => setSelectedGrade(gr)}
                    className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition flex items-center justify-between text-right"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-black text-sm sm:text-base text-slate-900">{gr}</div>
                        <div className="text-xs text-slate-500">{count} مذكرة</div>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* عرض المذكرات */}
      {(!showFolderBrowser || filteredNotebooks.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-900">
              المذكرات المتاحة ({filteredNotebooks.length})
            </h3>
          </div>

          {filteredNotebooks.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-2">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600">لا توجد مذكرات مطابقة لخيارات التصفية الحالية</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredNotebooks.map((nb) => (
                <NotebookCard
                  key={nb.id}
                  notebook={nb}
                  onPreview={onPreview}
                  onAddToCart={onAddToCart}
                  isInCart={cartIds.has(nb.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 7. صفحة العروض والباقات (OffersAndBundlesPage)
// ============================================================================
function OffersAndBundlesPage({ settings, notebooks, coupons, onAddBundleToCart, onPreview }) {
  const [copiedCode, setCopiedCode] = useState('');

  const activeCoupons = useMemo(
    () => coupons.filter((c) => c.active !== false && (!c.singleUse || !c.used)),
    [coupons]
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-8 space-y-8 text-right">
      {/* باقات المذكرات المجمعة */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">باقات المذكرات المجمعة بخصم خاص</h2>
            <p className="text-xs sm:text-sm text-slate-500">اضغط على أي مذكرة داخل الباقة لمعاينتها قبل الطلب</p>
          </div>
        </div>

        {(settings.bundles || []).length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500 font-bold">
            لا توجد باقات مجمعة مضافة حاليًا
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(settings.bundles || []).map((bundle) => {
              const includedNotebooks = (bundle.notebookIds || [])
                .map((id) => notebooks.find((n) => n.id === id))
                .filter(Boolean);

              const originalSum =
                bundle.pricingMode === 'manual' && Number(bundle.originalPrice) > 0
                  ? Number(bundle.originalPrice)
                  : includedNotebooks.reduce((s, n) => s + (Number(n.price) || 0), 0);

              let finalPrice = originalSum;
              if (bundle.pricingMode === 'manual' && Number(bundle.bundlePrice) > 0) {
                finalPrice = Number(bundle.bundlePrice);
              } else if (bundle.pricingMode === 'fixed' && Number(bundle.discountValue) > 0) {
                finalPrice = Math.max(0, originalSum - Number(bundle.discountValue));
              } else if (Number(bundle.discountValue) > 0) {
                finalPrice = Math.round(originalSum * (1 - Number(bundle.discountValue) / 100));
              }

              const saved = Math.max(0, originalSum - finalPrice);
              const percentSaved = originalSum > 0 ? Math.round((saved / originalSum) * 100) : 0;

              return (
                <div
                  key={bundle.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* رأس الباقة الداكن الفخم */}
                    <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-blue-950 text-white p-5 flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>باقة توفير شاملة • {includedNotebooks.length} مذكرات</span>
                        </span>
                        <h3 className="text-xl font-black">{bundle.title}</h3>
                        {bundle.description && <p className="text-xs sm:text-sm text-slate-300">{bundle.description}</p>}
                      </div>

                      {saved > 0 && (
                        <div className="bg-amber-400 text-slate-950 rounded-2xl px-3.5 py-2 text-center shrink-0 shadow">
                          <div className="font-black text-sm">وفّر {saved} ج.م</div>
                          <div className="text-[11px] font-bold">خصم {percentSaved}%</div>
                        </div>
                      )}
                    </div>

                    {/* قائمة المذكرات المشمولة */}
                    <div className="p-4 sm:p-5 space-y-2.5">
                      <div className="text-xs font-black text-slate-600">محتويات الباقة (اضغط للمعاينة):</div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {includedNotebooks.map((nb) => (
                          <div
                            key={nb.id}
                            onClick={() => onPreview(nb)}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 cursor-pointer transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                                {nb.coverUrl ? (
                                  <img src={nb.coverUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <BookOpen className="w-5 h-5 m-auto mt-3.5 text-slate-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">{nb.title}</div>
                                <div className="text-[11px] text-slate-500">
                                  {nb.grade} • {nb.subject}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-bold text-blue-600 bg-blue-100/70 px-2 py-1 rounded-lg">
                                معاينة
                              </span>
                              <span className="text-xs font-black text-slate-700 bg-white px-2.5 py-1 rounded-lg border">
                                {nb.price} ج.م
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* تذييل الباقة والسعر */}
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-xs text-slate-500 font-bold">سعر الباقة كاملة بعد الخصم:</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-600">{finalPrice} ج.م</span>
                        {originalSum > finalPrice && (
                          <span className="text-sm text-slate-400 line-through">{originalSum} ج.م</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onAddBundleToCart(bundle, includedNotebooks, finalPrice, originalSum)}
                      className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center gap-2 shadow-md transition"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>اطلب الباقة كاملة بالخصم</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* كوبونات الخصم المتاحة */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow">
            <Tag className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-slate-900">كوبونات الخصم المتاحة حاليًا</h2>
        </div>

        {activeCoupons.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center border border-slate-200 text-slate-500 text-sm font-bold">
            لا توجد كوبونات عامة نشطة حاليًا
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCoupons.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-4 border-2 border-dashed border-amber-300 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-black text-lg text-slate-900 tracking-wider">{c.code}</div>
                  <div className="text-xs font-bold text-emerald-600">
                    خصم {c.value} {c.type === 'fixed' ? 'ج.م' : '%'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(c.code);
                    setCopiedCode(c.code);
                    setTimeout(() => setCopiedCode(''), 2000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode === c.code ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================================================
// 8. لوحة التحكم الإدارية الكاملة (AdminDashboard)
// ============================================================================
function AdminDashboard({ settings, notebooks, coupons, orders, onSaveSettings, onClosePreview }) {
  const [activeTab, setActiveTab] = useState('notebooks');
  const [localSettings, setLocalSettings] = useState(() => normalizeSettings(settings));
  const [savingSettings, setSavingSettings] = useState(false);
  const [toast, setToast] = useState({ type: '', text: '' });
  const explicitlyClearedRef = useRef({ heroBg: false, logo: false });

  useEffect(() => {
    setLocalSettings((prev) => {
      const next = normalizeSettings(settings);
      return {
        ...next,
        heroBgImage: next.heroBgImage || (!explicitlyClearedRef.current.heroBg ? prev.heroBgImage : ''),
        logoUrl: next.logoUrl || (!explicitlyClearedRef.current.logo ? prev.logoUrl : ''),
        categoryImages: {
          ...(prev.categoryImages || {}),
          ...(next.categoryImages || {})
        }
      };
    });
  }, [settings]);

  const showToast = (text, type = 'success') => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  };

  const persistSettings = async (updatedObj) => {
    setSavingSettings(true);
    try {
      const normalized = normalizeSettings(updatedObj);
      setLocalSettings(normalized);
      await onSaveSettings(normalized);
      showToast('تم حفظ جميع التعديلات ومزامنتها مع العملاء بنجاح!');
    } catch (err) {
      console.error(err);
      showToast('تعذر الحفظ: ' + (err?.message || 'تأكد من اتصال الإنترنت وصلاحيات Firebase'), 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // --- حالات تبويب المذكرات ---
  const emptyNbForm = {
    id: '',
    title: '',
    category: localSettings.categories[0] || 'مذكرات الترم الأول',
    stage: localSettings.stages[1] || 'المرحلة الإعدادية',
    grade: localSettings.grades[5] || 'الصف الثالث الإعدادي',
    subject: localSettings.subjects[0] || 'اللغة العربية',
    price: '',
    oldPrice: '',
    pagesCount: '',
    badge: '',
    description: '',
    customNoticeTitle: 'ملاحظة هامة حول هذه المذكرة',
    customNoticeBadge: 'هام جدًا',
    customNoticeTheme: 'amber',
    customNotice: '',
    comingSoon: false,
    driveUrl: '',
    coverUrl: '',
    sampleUrls: []
  };

  const [nbForm, setNbForm] = useState(emptyNbForm);
  const [savingNb, setSavingNb] = useState(false);
  const [bulkEdits, setBulkEdits] = useState({});
  const [savingBulk, setSavingBulk] = useState(false);

  const handleSaveNotebook = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim()) return;
    setSavingNb(true);
    try {
      const isEdit = Boolean(nbForm.id);
      const nbDocRef = isEdit ? publicDoc('notebooks', nbForm.id) : doc(publicCol('notebooks'));
      const nbId = nbDocRef.id;

      // تقسيم صفحات العينة إلى أجزاء صغيرة (3 صفحات لكل جزء) لتجنب حد 1MB في Firestore
      const samples = nbForm.sampleUrls || [];
      const chunkSize = 3;
      const chunksCount = Math.ceil(samples.length / chunkSize);

      if (samples.length > 0) {
        for (let i = 0; i < chunksCount; i++) {
          const slice = samples.slice(i * chunkSize, (i + 1) * chunkSize);
          await setDoc(publicDoc('notebook_samples', `${nbId}_part_${i}`), {
            notebookId: nbId,
            partIndex: i,
            urls: slice
          });
        }
        await setDoc(publicDoc('notebook_samples', nbId), {
          notebookId: nbId,
          chunksCount,
          totalCount: samples.length,
          urls: []
        });
      }

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
        customNoticeBadge: nbForm.customNoticeBadge.trim(),
        customNoticeTheme: nbForm.customNoticeTheme,
        customNotice: nbForm.customNotice.trim(),
        comingSoon: Boolean(nbForm.comingSoon),
        driveUrl: nbForm.driveUrl.trim(),
        coverUrl: nbForm.coverUrl || '',
        sampleUrls: [], // تُجلب عند المعاينة من notebook_samples لإبقاء المستند الرئيسي خفيفًا وسريعًا
        sampleChunksCount: chunksCount,
        updatedAt: serverTimestamp()
      };

      if (!isEdit) payload.createdAt = serverTimestamp();

      await setDoc(nbDocRef, payload, { merge: true });
      setNbForm(emptyNbForm);
      showToast(isEdit ? 'تم تحديث المذكرة بنجاح!' : 'تمت إضافة المذكرة الجديدة بنجاح!');
    } catch (err) {
      console.error(err);
      showToast('تعذر حفظ المذكرة: ' + (err?.message || ''), 'error');
    } finally {
      setSavingNb(false);
    }
  };

  const handleBulkSaveAll = async () => {
    const entries = Object.entries(bulkEdits);
    if (entries.length === 0) return;
    setSavingBulk(true);
    try {
      for (const [id, changes] of entries) {
        await updateDoc(publicDoc('notebooks', id), {
          ...changes,
          price: Number(changes.price) || 0,
          oldPrice: Number(changes.oldPrice) || 0,
          updatedAt: serverTimestamp()
        });
      }
      setBulkEdits({});
      showToast(`تم حفظ تعديلات (${entries.length}) مذكرة دفعة واحدة بنجاح!`);
    } catch (err) {
      showToast('حدث خطأ أثناء الحفظ الجماعي: ' + (err?.message || ''), 'error');
    } finally {
      setSavingBulk(false);
    }
  };

  // --- حالات تبويب الأقسام والمراحل ---
  const [newCatName, setNewCatName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newGradeName, setNewGradeName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  // --- حالات تبويب الخصومات والعروض ---
  const [bundleForm, setBundleForm] = useState({
    title: '',
    description: '',
    notebookIds: [],
    pricingMode: 'manual',
    originalPrice: '',
    bundlePrice: '',
    discountValue: 15
  });
  const [couponForm, setCouponForm] = useState({ code: '', type: 'percent', value: 15, singleUse: false });

  const selectedBundleSum = useMemo(() => {
    return bundleForm.notebookIds.reduce((sum, id) => {
      const nb = notebooks.find((n) => n.id === id);
      return sum + (Number(nb?.price) || 0);
    }, 0);
  }, [bundleForm.notebookIds, notebooks]);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 pb-16 text-right">
      {/* شريط الإدارة العلوي */}
      <div className="bg-slate-950 text-white px-3 sm:px-6 py-3.5 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <h1 className="text-sm sm:text-lg font-black">لوحة تحكم {localSettings.siteName}</h1>
              <p className="text-[11px] text-slate-400">{ADMIN_EMAIL}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => persistSettings(localSettings)}
              disabled={savingSettings}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'جارٍ الحفظ...' : 'حفظ ومزامنة الكل'}</span>
            </button>
            <button
              onClick={onClosePreview}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>معاينة الموقع</span>
            </button>
            <button
              onClick={() => signOut(auth)}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* إشعار الحفظ */}
      {toast.text && (
        <div
          className={`fixed bottom-5 left-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl font-black text-sm text-white flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-red-700' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* شريط التبويبات الخمسة */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-5">
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {[
            { id: 'notebooks', label: `المذكرات (${notebooks.length})`, icon: BookOpen },
            { id: 'categories', label: 'الأقسام والمراحل والصفوف', icon: FolderOpen },
            { id: 'offers', label: 'الخصومات والعروض', icon: Percent },
            { id: 'orders', label: `الطلبات (${orders.length})`, icon: Package },
            { id: 'settings', label: 'إعدادات الموقع والمظهر', icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
                  activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* محتوى التبويب المختار */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-6 space-y-6">
        {/* ================================================================ */}
        {/* التبويب 1: المذكرات + التعديل السريع الجماعي */}
        {/* ================================================================ */}
        {activeTab === 'notebooks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* نموذج إضافة / تعديل مذكرة */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleSaveNotebook}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900">
                    {nbForm.id ? 'تعديل المذكرة المختارة' : 'إضافة مذكرة جديدة'}
                  </h2>
                  {nbForm.id && (
                    <button
                      type="button"
                      onClick={() => setNbForm(emptyNbForm)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      إلغاء التعديل
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  required
                  placeholder="عنوان المذكرة (مثال: بنك مراجعة الصف الثالث الإعدادي)"
                  value={nbForm.title}
                  onChange={(e) => setNbForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={nbForm.category}
                    onChange={(e) => setNbForm((p) => ({ ...p, category: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold"
                  >
                    {localSettings.categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    value={nbForm.stage}
                    onChange={(e) => setNbForm((p) => ({ ...p, stage: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold"
                  >
                    {localSettings.stages.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={nbForm.grade}
                    onChange={(e) => setNbForm((p) => ({ ...p, grade: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold"
                  >
                    {localSettings.grades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <select
                    value={nbForm.subject}
                    onChange={(e) => setNbForm((p) => ({ ...p, subject: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold"
                  >
                    {localSettings.subjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">السعر الحالي</label>
                    <input
                      type="number"
                      required
                      value={nbForm.price}
                      onChange={(e) => setNbForm((p) => ({ ...p, price: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">قبل الخصم</label>
                    <input
                      type="number"
                      value={nbForm.oldPrice}
                      onChange={(e) => setNbForm((p) => ({ ...p, oldPrice: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">الصفحات</label>
                    <input
                      type="number"
                      value={nbForm.pagesCount}
                      onChange={(e) => setNbForm((p) => ({ ...p, pagesCount: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="شارة التميز على الغلاف (مثال: الأكثر طلبًا)"
                  value={nbForm.badge}
                  onChange={(e) => setNbForm((p) => ({ ...p, badge: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />

                <textarea
                  rows={3}
                  placeholder="وصف تفصيلي لمحتوى المذكرة ومميزاتها..."
                  value={nbForm.description}
                  onChange={(e) => setNbForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />

                {/* التنبيه الخاص بالمذكرة مع التحكم الكامل */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 space-y-2">
                  <div className="text-xs font-black text-amber-900">التنبيه الخاص بهذه المذكرة (اختياري):</div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="عنوان التنبيه"
                      value={nbForm.customNoticeTitle}
                      onChange={(e) => setNbForm((p) => ({ ...p, customNoticeTitle: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="شارة الأهمية"
                      value={nbForm.customNoticeBadge}
                      onChange={(e) => setNbForm((p) => ({ ...p, customNoticeBadge: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold"
                    />
                    <select
                      value={nbForm.customNoticeTheme}
                      onChange={(e) => setNbForm((p) => ({ ...p, customNoticeTheme: e.target.value }))}
                      className="px-2 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold"
                    >
                      <option value="amber">لون ذهبي</option>
                      <option value="red">لون أحمر هام</option>
                      <option value="blue">لون أزرق</option>
                      <option value="emerald">لون أخضر</option>
                      <option value="purple">لون بنفسجي</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="نص الملاحظة الخاصة بهذه المذكرة..."
                    value={nbForm.customNotice}
                    onChange={(e) => setNbForm((p) => ({ ...p, customNotice: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nbForm.comingSoon}
                    onChange={(e) => setNbForm((p) => ({ ...p, comingSoon: e.target.checked }))}
                  />
                  <span className="text-xs font-bold text-slate-800">المذكرة قيد التجهيز (حجز مسبق)</span>
                </label>

                <input
                  type="url"
                  placeholder="رابط عينة Google Drive (اختياري)"
                  value={nbForm.driveUrl}
                  onChange={(e) => setNbForm((p) => ({ ...p, driveUrl: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />

                {/* رفع الغلاف وصفحات العينة (إضافة تراكمية بدون حذف السابق) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-dashed border-slate-300 rounded-2xl p-3 text-center space-y-1.5">
                    <div className="text-xs font-black text-slate-700">صورة الغلاف</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const compressed = await compressImageFile(file, 750, 0.78);
                        setNbForm((p) => ({ ...p, coverUrl: compressed }));
                      }}
                      className="w-full text-[11px]"
                    />
                    {nbForm.coverUrl && (
                      <img src={nbForm.coverUrl} alt="" className="w-14 h-16 object-cover rounded-lg mx-auto border" />
                    )}
                  </div>

                  <div className="border border-dashed border-slate-300 rounded-2xl p-3 text-center space-y-1.5">
                    <div className="text-xs font-black text-slate-700">صفحات العينة (حتى 15)</div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        const remainingSlots = Math.max(0, 15 - (nbForm.sampleUrls?.length || 0));
                        const toProcess = files.slice(0, remainingSlots);
                        const compressedArr = [];
                        for (const f of toProcess) {
                          const c = await compressImageFile(f, 950, 0.78);
                          compressedArr.push(c);
                        }
                        setNbForm((p) => ({
                          ...p,
                          sampleUrls: [...(p.sampleUrls || []), ...compressedArr]
                        }));
                        e.target.value = '';
                      }}
                      className="w-full text-[11px]"
                    />
                    <div className="text-[11px] font-bold text-emerald-600">
                      المرفوع حاليًا: {nbForm.sampleUrls?.length || 0} / 15 صفحة
                    </div>
                  </div>
                </div>

                {/* مصغرات صفحات العينة مع حذف فردي */}
                {nbForm.sampleUrls?.length > 0 && (
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>الصفحات المضافة ({nbForm.sampleUrls.length}):</span>
                      <button
                        type="button"
                        onClick={() => setNbForm((p) => ({ ...p, sampleUrls: [] }))}
                        className="text-red-600 hover:underline"
                      >
                        مسح الكل
                      </button>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {nbForm.sampleUrls.map((u, idx) => (
                        <div key={idx} className="relative w-12 h-14 rounded-lg border overflow-hidden shrink-0">
                          <img src={u} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setNbForm((p) => ({
                                ...p,
                                sampleUrls: p.sampleUrls.filter((_, i) => i !== idx)
                              }))
                            }
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]"
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
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow"
                >
                  {savingNb ? 'جارٍ الحفظ...' : nbForm.id ? 'حفظ التعديلات على المذكرة' : '+ إضافة المذكرة الآن'}
                </button>
              </form>
            </div>

            {/* قائمة المذكرات + التعديل السريع الجماعي والحفظ دفعة واحدة */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900">
                      إدارة وتعديل المذكرات السريع ({notebooks.length})
                    </h3>
                    <p className="text-xs text-slate-500">يمكنك تعديل أكثر من مذكرة مباشرة ثم حفظها جميعًا بضغطة واحدة</p>
                  </div>

                  {Object.keys(bulkEdits).length > 0 && (
                    <button
                      onClick={handleBulkSaveAll}
                      disabled={savingBulk}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow animate-bounce"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {savingBulk
                          ? 'جارٍ الحفظ...'
                          : `حفظ جميع التعديلات دفعة واحدة (${Object.keys(bulkEdits).length})`}
                      </span>
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[75vh] overflow-y-auto pl-1">
                  {notebooks.map((nb) => {
                    const edited = bulkEdits[nb.id] || {};
                    const isDirty = Boolean(bulkEdits[nb.id]);
                    const currentVal = (field) => (edited[field] !== undefined ? edited[field] : nb[field]);

                    const updateField = (field, val) => {
                      setBulkEdits((prev) => ({
                        ...prev,
                        [nb.id]: {
                          ...(prev[nb.id] || {}),
                          [field]: val
                        }
                      }));
                    };

                    return (
                      <div
                        key={nb.id}
                        className={`p-3.5 rounded-2xl border transition space-y-2.5 ${
                          isDirty ? 'bg-amber-50/70 border-amber-400' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                            {nb.coverUrl ? (
                              <img src={nb.coverUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="w-5 h-5 m-auto mt-4 text-slate-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <input
                              type="text"
                              value={currentVal('title')}
                              onChange={(e) => updateField('title', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs sm:text-sm"
                            />
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              <select
                                value={currentVal('category')}
                                onChange={(e) => updateField('category', e.target.value)}
                                className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold"
                              >
                                {localSettings.categories.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <select
                                value={currentVal('grade')}
                                onChange={(e) => updateField('grade', e.target.value)}
                                className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold"
                              >
                                {localSettings.grades.map((g) => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={currentVal('price')}
                                onChange={(e) => updateField('price', e.target.value)}
                                placeholder="السعر"
                                className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold"
                              />
                              <input
                                type="number"
                                value={currentVal('oldPrice')}
                                onChange={(e) => updateField('oldPrice', e.target.value)}
                                placeholder="قبل الخصم"
                                className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-xs">
                          <span className="text-slate-500 font-bold">
                            {isDirty ? '• معدّلة (بانتظار الحفظ الجماعي)' : `${nb.subject} • ${nb.stage}`}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                // تحميل عينات المذكرة عند فتحها للتعديل الكامل
                                let loadedSamples = nb.sampleUrls || [];
                                if (loadedSamples.length === 0) {
                                  const sSnap = await getDoc(publicDoc('notebook_samples', nb.id)).catch(() => null);
                                  if (sSnap?.exists()) {
                                    const d = sSnap.data();
                                    if (Array.isArray(d.urls) && d.urls.length > 0) loadedSamples = d.urls;
                                    else if (d.chunksCount > 0) {
                                      for (let i = 0; i < d.chunksCount; i++) {
                                        const pSnap = await getDoc(publicDoc('notebook_samples', `${nb.id}_part_${i}`)).catch(() => null);
                                        if (pSnap?.exists() && Array.isArray(pSnap.data().urls)) {
                                          loadedSamples = [...loadedSamples, ...pSnap.data().urls];
                                        }
                                      }
                                    }
                                  }
                                }
                                setNbForm({ ...nb, sampleUrls: loadedSamples });
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold hover:bg-blue-200 flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل كامل والصور</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteDoc(publicDoc('notebooks', nb.id));
                                showToast('تم حذف المذكرة');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 font-bold hover:bg-red-200 flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* التبويب 2: الأقسام والمراحل والصفوف والمواد */}
        {/* ================================================================ */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* الأقسام الرئيسية وصورها */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-black text-slate-900">الأقسام الرئيسية وصور البطاقات</h2>
                <button
                  onClick={() => persistSettings(localSettings)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ الأقسام والصور</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="اسم قسم رئيسي جديد (مثال: مراجعات ليلة الامتحان)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCatName.trim()) return;
                    setLocalSettings((p) => ({ ...p, categories: [...p.categories, newCatName.trim()] }));
                    setNewCatName('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm"
                >
                  + إضافة قسم
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {localSettings.categories.map((cat, idx) => (
                  <div key={cat} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-sm text-slate-900">{cat}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            const arr = [...localSettings.categories];
                            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                            setLocalSettings((p) => ({ ...p, categories: arr }));
                          }}
                          className="p-1 rounded bg-white border disabled:opacity-30"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === localSettings.categories.length - 1}
                          onClick={() => {
                            const arr = [...localSettings.categories];
                            [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                            setLocalSettings((p) => ({ ...p, categories: arr }));
                          }}
                          className="p-1 rounded bg-white border disabled:opacity-30"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLocalSettings((p) => ({
                              ...p,
                              categories: p.categories.filter((c) => c !== cat)
                            }))
                          }
                          className="p-1 rounded bg-red-100 text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {localSettings.categoryImages?.[cat] && (
                      <img
                        src={localSettings.categoryImages[cat]}
                        alt={cat}
                        className="w-full h-28 object-cover rounded-xl border"
                      />
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const compressed = await compressImageFile(file, 700, 0.78);
                          setLocalSettings((p) => ({
                            ...p,
                            categoryImages: { ...(p.categoryImages || {}), [cat]: compressed }
                          }));
                        }}
                        className="text-[11px] w-full"
                      />
                      {localSettings.categoryImages?.[cat] && (
                        <button
                          type="button"
                          onClick={() => {
                            const copy = { ...(localSettings.categoryImages || {}) };
                            delete copy[cat];
                            setLocalSettings((p) => ({ ...p, categoryImages: copy }));
                          }}
                          className="text-[11px] text-red-600 font-bold shrink-0"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* المراحل والصفوف والمواد */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* المراحل */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-black text-base text-slate-900">المراحل الدراسية</h3>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="مرحلة جديدة..."
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newStageName.trim()) return;
                      setLocalSettings((p) => ({ ...p, stages: [...p.stages, newStageName.trim()] }));
                      setNewStageName('');
                    }}
                    className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                  >
                    إضافة
                  </button>
                </div>
                <div className="space-y-1.5">
                  {localSettings.stages.map((st) => (
                    <div key={st} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold">
                      <span>{st}</span>
                      <button
                        type="button"
                        onClick={() => setLocalSettings((p) => ({ ...p, stages: p.stages.filter((x) => x !== st) }))}
                        className="text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* الصفوف */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-black text-base text-slate-900">الصفوف الدراسية</h3>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="صف دراسي جديد..."
                    value={newGradeName}
                    onChange={(e) => setNewGradeName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newGradeName.trim()) return;
                      setLocalSettings((p) => ({ ...p, grades: [...p.grades, newGradeName.trim()] }));
                      setNewGradeName('');
                    }}
                    className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                  >
                    إضافة
                  </button>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {localSettings.grades.map((gr) => (
                    <div key={gr} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold">
                      <span>{gr}</span>
                      <button
                        type="button"
                        onClick={() => setLocalSettings((p) => ({ ...p, grades: p.grades.filter((x) => x !== gr) }))}
                        className="text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* المواد */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-black text-base text-slate-900">المواد الدراسية</h3>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="مادة دراسية جديدة..."
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSubjectName.trim()) return;
                      setLocalSettings((p) => ({ ...p, subjects: [...p.subjects, newSubjectName.trim()] }));
                      setNewSubjectName('');
                    }}
                    className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                  >
                    إضافة
                  </button>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {localSettings.subjects.map((sub) => (
                    <div key={sub} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold">
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => setLocalSettings((p) => ({ ...p, subjects: p.subjects.filter((x) => x !== sub) }))}
                        className="text-red-500"
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

        {/* ================================================================ */}
        {/* التبويب 3: الخصومات والعروض (كل ما يخص الكوبونات والباقات والشريط الترويجي) */}
        {/* ================================================================ */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            {/* 1. الشريط الترويجي العلوي */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-black text-slate-900">1. الشريط الترويجي العلوي أعلى الصفحة الرئيسية</h2>
                <label className="flex items-center gap-2 text-xs font-black">
                  <input
                    type="checkbox"
                    checked={localSettings.promoBannerEnabled}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, promoBannerEnabled: e.target.checked }))}
                  />
                  <span>تفعيل الشريط الترويجي</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-600">نص الإعلان الترويجي</label>
                  <input
                    type="text"
                    value={localSettings.promoBannerText}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, promoBannerText: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">لون خلفية الشريط</label>
                  <select
                    value={localSettings.promoBannerColor}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, promoBannerColor: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  >
                    <option value="slate">كحلي داكن ملكي</option>
                    <option value="blue">أزرق ساطع</option>
                    <option value="emerald">أخضر زمردي</option>
                    <option value="red">أحمر ياقوتي</option>
                    <option value="purple">بنفسجي</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">كود الكوبون مع زر النسخ</label>
                  <input
                    type="text"
                    value={localSettings.promoBannerCoupon}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, promoBannerCoupon: e.target.value.toUpperCase() }))}
                    placeholder="مثال: EL3B15"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-black uppercase"
                  />
                </div>
              </div>
            </div>

            {/* 2. كوبون مكافأة الطلب القادم (يظهر للعميل بعد إتمام الطلب) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900">2. كوبون مكافأة الطلب القادم (يظهر للعميل فور إتمام الطلب)</h2>
                  <p className="text-xs text-slate-500">يشجع المعلم على العودة وطلب مذكرات أخرى بخصم خاص</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-black">
                  <input
                    type="checkbox"
                    checked={localSettings.nextOrderRewardEnabled}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardEnabled: e.target.checked }))}
                  />
                  <span>إظهار المكافأة بعد إتمام الطلب</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">نظام الكود</label>
                  <select
                    value={localSettings.nextOrderRewardMode}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardMode: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold"
                  >
                    <option value="auto">توليد كود تلقائي فريد لكل عميل</option>
                    <option value="custom">كود ثابت من اختيارك</option>
                  </select>
                </div>

                {localSettings.nextOrderRewardMode === 'custom' && (
                  <div>
                    <label className="text-xs font-bold text-slate-600">الكود المخصص</label>
                    <input
                      type="text"
                      value={localSettings.nextOrderRewardCustomCode}
                      onChange={(e) =>
                        setLocalSettings((p) => ({ ...p, nextOrderRewardCustomCode: e.target.value.toUpperCase() }))
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-black uppercase"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-600">نوع الخصم</label>
                  <select
                    value={localSettings.nextOrderRewardType}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardType: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  >
                    <option value="percent">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600">قيمة الخصم</label>
                  <input
                    type="number"
                    value={localSettings.nextOrderRewardValue}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardValue: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="عنوان المكافأة (مثال: هدية خاصة لطلبك القادم!)"
                  value={localSettings.nextOrderRewardTitle}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardTitle: e.target.value }))}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                />
                <input
                  type="text"
                  placeholder="رسالة المكافأة للعميل"
                  value={localSettings.nextOrderRewardMessage}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardMessage: e.target.value }))}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => persistSettings(localSettings)}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center gap-2 shadow"
              >
                <Save className="w-4 h-4" />
                <span>حفظ إعدادات الشريط الترويجي وكوبون الطلب القادم</span>
              </button>
            </div>

            {/* 3. باقات التوفير ومجموعات المذكرات */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900">3. باقات التوفير ومجموعات المذكرات</h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-6 space-y-3">
                  <input
                    type="text"
                    placeholder="اسم الباقة (مثال: مراجعات المرحلة الإعدادية)"
                    value={bundleForm.title}
                    onChange={(e) => setBundleForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                  <input
                    type="text"
                    placeholder="وصف قصير للباقة"
                    value={bundleForm.description}
                    onChange={(e) => setBundleForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={bundleForm.pricingMode}
                      onChange={(e) => setBundleForm((p) => ({ ...p, pricingMode: e.target.value }))}
                      className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    >
                      <option value="manual">سعر قبل وبعد</option>
                      <option value="percent">نسبة مئوية %</option>
                      <option value="fixed">خصم مبلغ ج.م</option>
                    </select>

                    {bundleForm.pricingMode === 'manual' ? (
                      <>
                        <input
                          type="number"
                          placeholder={`قبل (${selectedBundleSum})`}
                          value={bundleForm.originalPrice}
                          onChange={(e) => setBundleForm((p) => ({ ...p, originalPrice: e.target.value }))}
                          className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                        />
                        <input
                          type="number"
                          placeholder="السعر بعد الخصم"
                          value={bundleForm.bundlePrice}
                          onChange={(e) => setBundleForm((p) => ({ ...p, bundlePrice: e.target.value }))}
                          className="px-3 py-2 rounded-xl border border-emerald-400 bg-emerald-50 text-xs font-black"
                        />
                      </>
                    ) : (
                      <input
                        type="number"
                        placeholder={bundleForm.pricingMode === 'percent' ? 'النسبة %' : 'المبلغ ج.م'}
                        value={bundleForm.discountValue}
                        onChange={(e) => setBundleForm((p) => ({ ...p, discountValue: Number(e.target.value) }))}
                        className="col-span-2 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                      />
                    )}
                  </div>

                  <div className="text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border">
                    مجموع أسعار المذكرات المختارة ({bundleForm.notebookIds.length}): <span className="text-blue-600 font-black">{selectedBundleSum} ج.م</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!bundleForm.title.trim() || bundleForm.notebookIds.length === 0) return;
                      const newBundle = {
                        id: 'bundle_' + Date.now(),
                        ...bundleForm,
                        originalPrice: Number(bundleForm.originalPrice) || selectedBundleSum,
                        bundlePrice: Number(bundleForm.bundlePrice) || 0
                      };
                      const next = { ...localSettings, bundles: [...(localSettings.bundles || []), newBundle] };
                      persistSettings(next);
                      setBundleForm({
                        title: '',
                        description: '',
                        notebookIds: [],
                        pricingMode: 'manual',
                        originalPrice: '',
                        bundlePrice: '',
                        discountValue: 15
                      });
                    }}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm"
                  >
                    + حفظ الباقة وتفعيلها
                  </button>
                </div>

                {/* اختيار المذكرات المشمولة */}
                <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-3 border border-slate-200 max-h-64 overflow-y-auto space-y-1.5">
                  <div className="text-xs font-black text-slate-700 mb-1">اختر المذكرات المشمولة في الباقة:</div>
                  {notebooks.map((nb) => {
                    const checked = bundleForm.notebookIds.includes(nb.id);
                    return (
                      <label
                        key={nb.id}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer ${
                          checked ? 'bg-blue-50 border-blue-300 font-bold' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setBundleForm((p) => ({
                                ...p,
                                notebookIds: e.target.checked
                                  ? [...p.notebookIds, nb.id]
                                  : p.notebookIds.filter((id) => id !== nb.id)
                              }));
                            }}
                          />
                          <span>{nb.title}</span>
                        </div>
                        <span className="text-blue-600 font-black">{nb.price} ج.م</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* الباقات الحالية */}
              {(localSettings.bundles || []).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {(localSettings.bundles || []).map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border">
                      <div>
                        <div className="font-black text-sm">{b.title}</div>
                        <div className="text-xs text-slate-500">{b.notebookIds?.length || 0} مذكرات</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = {
                            ...localSettings,
                            bundles: localSettings.bundles.filter((x) => x.id !== b.id)
                          };
                          persistSettings(next);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. كوبونات الخصم العامة */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900">4. إنشاء كوبونات خصم ترويجية</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="كود الكوبون (مثال: SAVE20)"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-black uppercase"
                />
                <select
                  value={couponForm.type}
                  onChange={(e) => setCouponForm((p) => ({ ...p, type: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                >
                  <option value="percent">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (ج.م)</option>
                </select>
                <input
                  type="number"
                  placeholder="القيمة"
                  value={couponForm.value}
                  onChange={(e) => setCouponForm((p) => ({ ...p, value: Number(e.target.value) }))}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!couponForm.code.trim()) return;
                    await addDoc(publicCol('coupons'), {
                      code: couponForm.code.trim().toUpperCase(),
                      type: couponForm.type,
                      value: Number(couponForm.value) || 10,
                      active: true,
                      singleUse: couponForm.singleUse,
                      used: false,
                      createdAt: serverTimestamp()
                    });
                    setCouponForm({ code: '', type: 'percent', value: 15, singleUse: false });
                    showToast('تم إنشاء الكوبون بنجاح!');
                  }}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 text-white font-black text-sm"
                >
                  + إضافة الكوبون
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {coupons.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border">
                    <div>
                      <div className="font-black text-sm">{c.code}</div>
                      <div className="text-xs text-emerald-700 font-bold">
                        خصم {c.value} {c.type === 'fixed' ? 'ج.م' : '%'} {c.singleUse ? '(مرة واحدة)' : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteDoc(publicDoc('coupons', c.id));
                        showToast('تم حذف الكوبون');
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* التبويب 4: الطلبات */}
        {/* ================================================================ */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900">طلبات العملاء الواردة ({orders.length})</h2>
            {orders.length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-bold">لا توجد طلبات مسجلة حتى الآن</div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-black text-xs">
                          {ord.orderNumber}
                        </span>
                        <span className="font-black text-sm text-slate-900">
                          {ord.customerData?.teacherName || 'عميل'}
                        </span>
                        {ord.customerData?.phone && (
                          <span className="text-xs text-slate-600 font-bold">({ord.customerData.phone})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={ord.status || 'تم الاستلام'}
                          onChange={async (e) => {
                            await updateDoc(publicDoc('orders', ord.id), { status: e.target.value });
                            showToast('تم تحديث حالة الطلب');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                        >
                          <option value="تم الاستلام">تم الاستلام</option>
                          <option value="جاري التجهيز">جاري التجهيز</option>
                          <option value="مكتمل">مكتمل</option>
                        </select>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteDoc(publicDoc('orders', ord.id));
                            showToast('تم حذف الطلب');
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1">
                      <div className="font-bold">
                        المذكرات: {(ord.items || []).map((i) => i.title).join(' + ')}
                      </div>
                      <div className="text-blue-700 font-black">الإجمالي: {ord.total} ج.م</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* التبويب 5: إعدادات الموقع والمظهر وطلب العميل والتواصل */}
        {/* ================================================================ */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* الهوية والشعار والخلفية */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900">هوية المنصة والشعار وصورة الخلفية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600">اسم المنصة</label>
                  <input
                    type="text"
                    value={localSettings.siteName}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, siteName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">الوصف الفرعي تحت الاسم</label>
                  <input
                    type="text"
                    value={localSettings.siteTagline}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, siteTagline: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">العنوان الرئيسي في الواجهة (Hero)</label>
                  <input
                    type="text"
                    value={localSettings.heroTitle}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, heroTitle: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">الشارة العلوية في الواجهة</label>
                  <input
                    type="text"
                    value={localSettings.heroBadge}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, heroBadge: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">الوصف التفصيلي في الواجهة</label>
                <textarea
                  rows={2}
                  value={localSettings.heroSubtitle}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, heroSubtitle: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* الشعار */}
                <div className="p-4 rounded-2xl bg-slate-50 border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">شعار المنصة (Logo)</span>
                    {localSettings.logoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          explicitlyClearedRef.current.logo = true;
                          setLocalSettings((p) => ({ ...p, logoUrl: '' }));
                        }}
                        className="text-xs text-red-600 font-bold"
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
                      explicitlyClearedRef.current.logo = false;
                      const c = await compressImageFile(file, 260, 0.75);
                      setLocalSettings((p) => ({ ...p, logoUrl: c }));
                    }}
                    className="text-xs"
                  />
                  <div className="flex items-center gap-3 text-xs pt-1">
                    <span>حجم الشعار: {localSettings.logoSize || 64}px</span>
                    <input
                      type="range"
                      min={40}
                      max={96}
                      value={localSettings.logoSize || 64}
                      onChange={(e) => setLocalSettings((p) => ({ ...p, logoSize: Number(e.target.value) }))}
                    />
                  </div>
                  {localSettings.logoUrl && (
                    <img src={localSettings.logoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border" />
                  )}
                </div>

                {/* صورة الخلفية */}
                <div className="p-4 rounded-2xl bg-slate-50 border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">صورة خلفية الواجهة الرئيسية</span>
                    {localSettings.heroBgImage && (
                      <button
                        type="button"
                        onClick={() => {
                          explicitlyClearedRef.current.heroBg = true;
                          setLocalSettings((p) => ({ ...p, heroBgImage: '' }));
                        }}
                        className="text-xs text-red-600 font-bold"
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
                      explicitlyClearedRef.current.heroBg = false;
                      const c = await compressImageFile(file, 960, 0.68);
                      setLocalSettings((p) => ({ ...p, heroBgImage: c }));
                    }}
                    className="text-xs"
                  />
                  <div className="flex items-center gap-3 text-xs">
                    <span>تعتيم الخلفية: {localSettings.heroOverlayOpacity}%</span>
                    <input
                      type="range"
                      min={20}
                      max={95}
                      value={localSettings.heroOverlayOpacity}
                      onChange={(e) => setLocalSettings((p) => ({ ...p, heroOverlayOpacity: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span>ارتفاع الواجهة: {localSettings.heroMinHeight || 460}px</span>
                    <input
                      type="range"
                      min={320}
                      max={680}
                      step={10}
                      value={localSettings.heroMinHeight || 460}
                      onChange={(e) => setLocalSettings((p) => ({ ...p, heroMinHeight: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* التحكم في بطاقة «لماذا يثق بنا المعلمون؟» */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">بطاقة «لماذا يثق بنا المعلمون؟» في الواجهة</h2>
                <label className="flex items-center gap-2 text-xs font-black">
                  <input
                    type="checkbox"
                    checked={localSettings.trustCardEnabled}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, trustCardEnabled: e.target.checked }))}
                  />
                  <span>إظهار البطاقة</span>
                </label>
              </div>
              <input
                type="text"
                value={localSettings.trustCardTitle}
                onChange={(e) => setLocalSettings((p) => ({ ...p, trustCardTitle: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
              />
              <div className="space-y-2">
                {localSettings.trustCardItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const arr = [...localSettings.trustCardItems];
                        arr[idx] = e.target.value;
                        setLocalSettings((p) => ({ ...p, trustCardItems: arr }));
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings((p) => ({
                          ...p,
                          trustCardItems: p.trustCardItems.filter((_, i) => i !== idx)
                        }))
                      }
                      className="p-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings((p) => ({
                      ...p,
                      trustCardItems: [...p.trustCardItems, 'ميزة جديدة للمنصة']
                    }))
                  }
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                >
                  + إضافة نقطة جديدة
                </button>
              </div>
            </div>

            {/* التحكم في قسم «ما الجديد؟» وقسم «أخبار المنصة ومذكرات قيد التجهيز» */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* إعدادات ما الجديد؟ */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900">قسم «ما الجديد؟» في الرئيسية</h2>
                  <label className="flex items-center gap-2 text-xs font-black">
                    <input
                      type="checkbox"
                      checked={localSettings.whatsNewEnabled}
                      onChange={(e) => setLocalSettings((p) => ({ ...p, whatsNewEnabled: e.target.checked }))}
                    />
                    <span>إظهار القسم</span>
                  </label>
                </div>

                <input
                  type="text"
                  value={localSettings.whatsNewTitle}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, whatsNewTitle: e.target.value }))}
                  placeholder="عنوان القسم"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={localSettings.whatsNewMode}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, whatsNewMode: e.target.value }))}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="auto">تلقائي (أحدث المذكرات)</option>
                    <option value="manual">اختيار يدوي محدد</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={localSettings.whatsNewLimit || 6}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, whatsNewLimit: Number(e.target.value) }))}
                    placeholder="العدد المعروض"
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                {localSettings.whatsNewMode === 'manual' && (
                  <div className="bg-slate-50 p-3 rounded-2xl border max-h-44 overflow-y-auto space-y-1.5">
                    <div className="text-xs font-bold text-slate-600">اختر المذكرات التي تظهر في «ما الجديد؟»:</div>
                    {notebooks.map((nb) => {
                      const checked = (localSettings.whatsNewManualIds || []).includes(nb.id);
                      return (
                        <label key={nb.id} className="flex items-center gap-2 text-xs bg-white p-2 rounded-xl border cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const prevIds = localSettings.whatsNewManualIds || [];
                              setLocalSettings((p) => ({
                                ...p,
                                whatsNewManualIds: e.target.checked
                                  ? [...prevIds, nb.id]
                                  : prevIds.filter((id) => id !== nb.id)
                              }));
                            }}
                          />
                          <span className="truncate font-bold">{nb.title}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* إعدادات أخبار المنصة ومذكرات قيد التجهيز */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900">أخبار المنصة ومذكرات قيد التجهيز</h2>
                  <label className="flex items-center gap-2 text-xs font-black">
                    <input
                      type="checkbox"
                      checked={localSettings.newsSectionEnabled}
                      onChange={(e) => setLocalSettings((p) => ({ ...p, newsSectionEnabled: e.target.checked }))}
                    />
                    <span>إظهار القسم</span>
                  </label>
                </div>

                <input
                  type="text"
                  value={localSettings.newsSectionTitle}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, newsSectionTitle: e.target.value }))}
                  placeholder="عنوان قسم الأخبار"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                />

                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {(localSettings.newsItems || []).map((item, idx) => (
                    <div key={item.id || idx} className="p-2.5 rounded-2xl bg-slate-50 border space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const arr = [...localSettings.newsItems];
                            arr[idx] = { ...item, title: e.target.value };
                            setLocalSettings((p) => ({ ...p, newsItems: arr }));
                          }}
                          placeholder="عنوان الخبر"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border bg-white text-xs font-bold"
                        />
                        <input
                          type="text"
                          value={item.badge || ''}
                          onChange={(e) => {
                            const arr = [...localSettings.newsItems];
                            arr[idx] = { ...item, badge: e.target.value };
                            setLocalSettings((p) => ({ ...p, newsItems: arr }));
                          }}
                          placeholder="شارة (قريبًا)"
                          className="w-24 px-2 py-1.5 rounded-lg border bg-white text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setLocalSettings((p) => ({
                              ...p,
                              newsItems: p.newsItems.filter((_, i) => i !== idx)
                            }))
                          }
                          className="p-1.5 text-red-600 bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.details || ''}
                        onChange={(e) => {
                          const arr = [...localSettings.newsItems];
                          arr[idx] = { ...item, details: e.target.value };
                          setLocalSettings((p) => ({ ...p, newsItems: arr }));
                        }}
                        placeholder="تفاصيل الخبر..."
                        className="w-full px-2.5 py-1.5 rounded-lg border bg-white text-xs"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings((p) => ({
                      ...p,
                      newsItems: [
                        ...(p.newsItems || []),
                        { id: 'news_' + Date.now(), title: 'خبر أو إصدار قادم جديد', badge: 'قريبًا', date: 'جديد', details: '' }
                      ]
                    }))
                  }
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  + إضافة خبر أو إعلان جديد
                </button>
              </div>
            </div>

            {/* التحكم في حقول نموذج طلب العميل */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900">التحكم في حقول بيانات العميل داخل السلة</h2>
                  <p className="text-xs text-slate-500">أضف أو رتّب أو أخفِ أي حقل يظهر للعميل عند إتمام الطلب</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings((p) => ({
                      ...p,
                      checkoutFields: [
                        ...p.checkoutFields,
                        { id: 'field_' + Date.now(), label: 'حقل إضافي جديد', placeholder: '', type: 'text', required: false, visible: true }
                      ]
                    }))
                  }
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  + إضافة حقل جديد
                </button>
              </div>

              <div className="space-y-2">
                {localSettings.checkoutFields.map((f, idx) => (
                  <div key={f.id} className="p-3 rounded-2xl bg-slate-50 border flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => {
                        const arr = [...localSettings.checkoutFields];
                        arr[idx] = { ...f, label: e.target.value };
                        setLocalSettings((p) => ({ ...p, checkoutFields: arr }));
                      }}
                      className="flex-1 min-w-[160px] px-3 py-1.5 rounded-xl border bg-white text-xs font-bold"
                    />
                    <select
                      value={f.type}
                      onChange={(e) => {
                        const arr = [...localSettings.checkoutFields];
                        arr[idx] = { ...f, type: e.target.value };
                        setLocalSettings((p) => ({ ...p, checkoutFields: arr }));
                      }}
                      className="px-2.5 py-1.5 rounded-xl border bg-white text-xs font-bold"
                    >
                      <option value="text">نص قصير</option>
                      <option value="tel">رقم هاتف</option>
                      <option value="textarea">ملاحظات طويلة</option>
                      <option value="file">رفع صورة/شعار</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs font-bold px-2">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => {
                          const arr = [...localSettings.checkoutFields];
                          arr[idx] = { ...f, required: e.target.checked };
                          setLocalSettings((p) => ({ ...p, checkoutFields: arr }));
                        }}
                      />
                      <span>إلزامي</span>
                    </label>
                    <label className="flex items-center gap-1 text-xs font-bold px-2">
                      <input
                        type="checkbox"
                        checked={f.visible !== false}
                        onChange={(e) => {
                          const arr = [...localSettings.checkoutFields];
                          arr[idx] = { ...f, visible: e.target.checked };
                          setLocalSettings((p) => ({ ...p, checkoutFields: arr }));
                        }}
                      />
                      <span>ظاهر</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          const arr = [...localSettings.checkoutFields];
                          [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                          setLocalSettings((p) => ({ ...p, checkoutFields: arr }));
                        }}
                        className="p-1.5 bg-white border rounded-lg disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === localSettings.checkoutFields.length - 1}
                        onClick={() => {
                          const arr = [...localSettings.checkoutFields];
                          [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                          setLocalSettings((p) => ({ ...p, checkoutFields: arr }));
                        }}
                        className="p-1.5 bg-white border rounded-lg disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings((p) => ({
                            ...p,
                            checkoutFields: p.checkoutFields.filter((_, i) => i !== idx)
                          }))
                        }
                        className="p-1.5 bg-red-100 text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* التنبيهات العامة + ترتيب العناصر داخل نافذة المذكرة + زر Drive */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900">التنبيهات العامة وترتيب العناصر داخل نافذة المذكرة</h2>
              <div>
                <label className="text-xs font-bold text-slate-600">التنبيهات العامة (كل سطر يظهر كنقطة مستقلة)</label>
                <textarea
                  rows={3}
                  value={localSettings.generalNotices}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, generalNotices: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">نص زر Google Drive</label>
                  <input
                    type="text"
                    value={localSettings.driveButtonText}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, driveButtonText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">وصف فرعي لزر Drive</label>
                  <input
                    type="text"
                    value={localSettings.driveButtonSubtext}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, driveButtonSubtext: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">لون زر وأيقونة Drive</label>
                  <select
                    value={localSettings.driveButtonColor}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, driveButtonColor: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold"
                  >
                    <option value="emerald">أخضر زمردي</option>
                    <option value="blue">أزرق ملكي</option>
                    <option value="slate">كحلي داكن</option>
                    <option value="amber">ذهبي عنبري</option>
                    <option value="red">أحمر</option>
                    <option value="purple">بنفسجي</option>
                  </select>
                </div>
              </div>

              {/* ترتيب أماكن العناصر داخل نافذة المذكرة */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border space-y-2">
                <div className="text-xs font-black text-slate-800">ترتيب ظهور العناصر داخل نافذة المذكرة:</div>
                {localSettings.notebookModalBlocksOrder.map((key, idx) => {
                  const labels = {
                    description: 'الوصف والشارات والتفاصيل',
                    customNotice: 'التنبيه الخاص بهذه المذكرة',
                    generalNotices: 'التنبيهات العامة للمنصة',
                    driveLink: 'زر معاينة Google Drive'
                  };
                  return (
                    <div key={key} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border text-xs font-bold">
                      <span>{idx + 1}. {labels[key] || key}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            const arr = [...localSettings.notebookModalBlocksOrder];
                            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                            setLocalSettings((p) => ({ ...p, notebookModalBlocksOrder: arr }));
                          }}
                          className="p-1 border rounded disabled:opacity-30"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === localSettings.notebookModalBlocksOrder.length - 1}
                          onClick={() => {
                            const arr = [...localSettings.notebookModalBlocksOrder];
                            [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                            setLocalSettings((p) => ({ ...p, notebookModalBlocksOrder: arr }));
                          }}
                          className="p-1 border rounded disabled:opacity-30"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* التحكم الكامل في وسائل التواصل الاجتماعي */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900">وسائل وروابط التواصل الاجتماعي</h2>
                  <p className="text-xs text-slate-500">تظهر في نافذة «تواصل معنا» وأسفل الموقع مع التعرف التلقائي على الأيقونة</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings((p) => ({
                      ...p,
                      socialLinks: [
                        ...p.socialLinks,
                        { id: 'soc_' + Date.now(), platform: 'auto', title: '', subtitle: '', url: '', visible: true }
                      ]
                    }))
                  }
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  + إضافة رابط تواصل
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                <div>
                  <label className="text-xs font-black text-emerald-900">رقم واتساب استقبال الطلبات (بالكود الدولي 20)</label>
                  <input
                    type="text"
                    value={localSettings.whatsappNumber}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, whatsappNumber: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-emerald-900">تعليمات الدفع والتحويل بعد الطلب</label>
                  <input
                    type="text"
                    value={localSettings.paymentInstructions}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, paymentInstructions: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {localSettings.socialLinks.map((soc, idx) => {
                  const detected = detectSocialPlatform(soc.url, soc.platform);
                  return (
                    <div key={soc.id} className="p-3 rounded-2xl bg-slate-50 border flex flex-wrap items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl ${detected.bg} text-white flex items-center justify-center shrink-0`}>
                        {detected.svg}
                      </div>
                      <input
                        type="text"
                        placeholder={`العنوان (تلقائي: ${detected.defaultTitle})`}
                        value={soc.title}
                        onChange={(e) => {
                          const arr = [...localSettings.socialLinks];
                          arr[idx] = { ...soc, title: e.target.value };
                          setLocalSettings((p) => ({ ...p, socialLinks: arr }));
                        }}
                        className="flex-1 min-w-[150px] px-3 py-2 rounded-xl border bg-white text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="وصف قصير (اختياري)"
                        value={soc.subtitle || ''}
                        onChange={(e) => {
                          const arr = [...localSettings.socialLinks];
                          arr[idx] = { ...soc, subtitle: e.target.value };
                          setLocalSettings((p) => ({ ...p, socialLinks: arr }));
                        }}
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-xl border bg-white text-xs"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="https://..."
                        value={soc.url}
                        onChange={(e) => {
                          const arr = [...localSettings.socialLinks];
                          arr[idx] = { ...soc, url: e.target.value };
                          setLocalSettings((p) => ({ ...p, socialLinks: arr }));
                        }}
                        className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border bg-white text-xs text-left"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            const arr = [...localSettings.socialLinks];
                            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                            setLocalSettings((p) => ({ ...p, socialLinks: arr }));
                          }}
                          className="p-1.5 bg-white border rounded-lg disabled:opacity-30"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === localSettings.socialLinks.length - 1}
                          onClick={() => {
                            const arr = [...localSettings.socialLinks];
                            [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                            setLocalSettings((p) => ({ ...p, socialLinks: arr }));
                          }}
                          className="p-1.5 bg-white border rounded-lg disabled:opacity-30"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLocalSettings((p) => ({
                              ...p,
                              socialLinks: p.socialLinks.filter((_, i) => i !== idx)
                            }))
                          }
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* حفظ الكل والنسخ الاحتياطي */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => persistSettings(localSettings)}
                disabled={savingSettings}
                className="px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                <span>{savingSettings ? 'جارٍ الحفظ...' : 'حفظ جميع الإعدادات ومزامنتها'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(localSettings, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `el3bakera-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل نسخة احتياطية (JSON)</span>
                </button>
                <label className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer">
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
                          persistSettings(parsed);
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
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 9. التطبيق الرئيسي (MuzakkiratiApp)
// ============================================================================
function MuzakkiratiApp() {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem(LS_SETTINGS_KEY);
      return cached ? normalizeSettings(JSON.parse(cached)) : normalizeSettings();
    } catch {
      return normalizeSettings();
    }
  });

  const [notebooks, setNotebooks] = useState(() => {
    try {
      const cached = localStorage.getItem(LS_NOTEBOOKS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [coupons, setCoupons] = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminViewOpen, setAdminViewOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activePage, setActivePage] = useState('home'); // 'home' | 'catalog' | 'offers' | 'track'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');

  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartToast, setCartToast] = useState('');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackNotFound, setTrackNotFound] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const logoClickCountRef = useRef(0);

  // مراقبة التمرير لتقليص الشريط العلوي على الهاتف
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // مراقبة حالة تسجيل الدخول
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setAdminViewOpen(true);
      }
    });
    return () => unsub();
  }, []);

  // اختصار لوحة المفاتيح Ctrl + Shift + L أو Alt + Shift + A أو رابط #admin
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) setAdminViewOpen(true);
        else setShowAdminLogin(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    const handleKeyDown = (e) => {
      const key = (e.key || '').toLowerCase();
      const isCtrlShiftL = (e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'l' || key === 'م' || e.code === 'KeyL');
      const isAltShiftA = e.altKey && e.shiftKey && (key === 'a' || key === 'ش' || e.code === 'KeyA');
      if (isCtrlShiftL || isAltShiftA) {
        e.preventDefault();
        if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) setAdminViewOpen(true);
        else setShowAdminLogin(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user]);

  // دعم زر الرجوع للخلف في المتصفح والهاتف (Browser Back Button)
  const navigateTo = (page, cat = '', st = '', gr = '') => {
    setActivePage(page);
    setSelectedCategory(cat);
    setSelectedStage(st);
    setSelectedGrade(gr);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      window.history.pushState({ page, cat, st, gr }, '', '');
    } catch {}
  };

  useEffect(() => {
    const handlePopState = (e) => {
      if (previewNotebook) {
        setPreviewNotebook(null);
        return;
      }
      if (cartOpen) {
        setCartOpen(false);
        return;
      }
      if (contactModalOpen) {
        setContactModalOpen(false);
        return;
      }
      const st = e.state;
      if (st && st.page) {
        setActivePage(st.page);
        setSelectedCategory(st.cat || '');
        setSelectedStage(st.st || '');
        setSelectedGrade(st.gr || '');
      } else {
        setActivePage('home');
        setSelectedCategory('');
        setSelectedStage('');
        setSelectedGrade('');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [previewNotebook, cartOpen, contactModalOpen]);

  // مزامنة الإعدادات والمذكرات والكوبونات من Firestore في الوقت الفعلي
  useEffect(() => {
    const unsubSettings = onSnapshot(
      publicDoc('settings', 'main'),
      (snap) => {
        if (snap.exists()) {
          const rawMain = snap.data();
          setSettings((prev) => {
            const next = normalizeSettings({
              ...rawMain,
              logoUrl: prev.logoUrl || rawMain.logoUrl || '',
              heroBgImage: prev.heroBgImage || rawMain.heroBgImage || '',
              categoryImages:
                Object.keys(prev.categoryImages || {}).length > 0
                  ? prev.categoryImages
                  : rawMain.categoryImages || {}
            });
            try {
              const lightCopy = { ...next, logoUrl: '', heroBgImage: '', categoryImages: {} };
              localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(lightCopy));
            } catch {}
            return next;
          });
        }
      },
      (err) => console.warn('Settings snapshot:', err)
    );

    const unsubLogo = onSnapshot(
      publicDoc('settings', 'media_logo'),
      (snap) => {
        if (snap.exists()) {
          const val = snap.data().logoUrl ?? '';
          setSettings((prev) => normalizeSettings({ ...prev, logoUrl: val }));
        }
      },
      () => {}
    );

    const unsubHero = onSnapshot(
      publicDoc('settings', 'media_hero'),
      (snap) => {
        if (snap.exists()) {
          const val = snap.data().heroBgImage ?? '';
          setSettings((prev) => normalizeSettings({ ...prev, heroBgImage: val }));
        }
      },
      () => {}
    );

    const unsubMedia = onSnapshot(
      publicDoc('settings', 'media_assets'),
      (snap) => {
        if (snap.exists()) {
          const m = snap.data();
          setSettings((prev) =>
            normalizeSettings({
              ...prev,
              logoUrl: prev.logoUrl || m.logoUrl || '',
              heroBgImage: prev.heroBgImage || m.heroBgImage || '',
              categoryImages:
                m.categoryImages && Object.keys(m.categoryImages).length > 0
                  ? m.categoryImages
                  : prev.categoryImages
            })
          );
        }
      },
      () => {}
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
      unsubLogo();
      unsubHero();
      unsubMedia();
      unsubNotebooks();
      unsubCoupons();
    };
  }, []);

  // جلب الطلبات للمشرف فقط
  useEffect(() => {
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return;
    const unsubOrders = onSnapshot(
      publicCol('orders'),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {}
    );
    return () => unsubOrders();
  }, [user]);

  const handleSaveSettings = async (nextSettings) => {
    const normalized = normalizeSettings(nextSettings);

    const lightSettingsPayload = {
      ...normalized,
      logoUrl: '',
      heroBgImage: '',
      categoryImages: {},
      updatedAt: serverTimestamp()
    };

    // 1. حفظ الإعدادات النصية والألوان والخصومات والأقسام أولاً (خفيف جدًا وفوري)
    await setDoc(publicDoc('settings', 'main'), lightSettingsPayload);

    // 2. حفظ الشعار في مستند مستقل صغير
    await setDoc(publicDoc('settings', 'media_logo'), {
      logoUrl: normalized.logoUrl || '',
      updatedAt: serverTimestamp()
    });

    // 3. حفظ صورة الخلفية في مستند مستقل صغير
    await setDoc(publicDoc('settings', 'media_hero'), {
      heroBgImage: normalized.heroBgImage || '',
      updatedAt: serverTimestamp()
    });

    // 4. حفظ صور الأقسام في مستند مستقل
    await setDoc(publicDoc('settings', 'media_assets'), {
      categoryImages: normalized.categoryImages || {},
      updatedAt: serverTimestamp()
    }).catch((e) => console.warn('Category images save warning:', e));

    setSettings(normalized);
    try {
      localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(lightSettingsPayload));
    } catch {}
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPass);
      if (cred.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        setLoginError('هذا الحساب غير مصرح له بالدخول للوحة التحكم');
      } else {
        setShowAdminLogin(false);
        setAdminViewOpen(true);
        setLoginPass('');
      }
    } catch {
      setLoginError('بيانات الدخول غير صحيحة');
    } finally {
      setLoggingIn(false);
    }
  };

  const cartIds = useMemo(() => new Set(cart.map((c) => c.id)), [cart]);

  const triggerCartToast = (title) => {
    setCartToast(`تمت إضافة "${title}" إلى سلة الطلبات`);
    setTimeout(() => {
      setCartToast((prev) => (prev.includes(title) ? '' : prev));
    }, 2800);
  };

  const handleAddToCart = (nb) => {
    setCart((prev) => [...prev, { ...nb, isBundle: false }]);
    setPreviewNotebook(null);
    triggerCartToast(nb.title);
  };

  const handleAddBundleToCart = (bundle, includedNotebooks, finalPrice, originalSum) => {
    const bundleCartId = `bundle_item_${bundle.id}`;
    const includedIds = new Set(includedNotebooks.map((n) => n.id));
    setCart((prev) => {
      // إزالة أي نسخة سابقة من نفس الباقة أو مذكراتها المفردة لمنع التكرار
      const cleaned = prev.filter((item) => item.id !== bundleCartId && !includedIds.has(item.id));
      return [
        ...cleaned,
        {
          id: bundleCartId,
          bundleId: bundle.id,
          isBundle: true,
          title: bundle.title,
          price: finalPrice,
          originalPrice: originalSum,
          bundleItems: includedNotebooks.map((n) => ({
            id: n.id,
            title: n.title,
            grade: n.grade,
            subject: n.subject,
            price: n.price
          }))
        }
      ];
    });
    triggerCartToast(bundle.title);
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    const q = trackQuery.trim().toUpperCase();
    if (!q) return;
    setTrackingLoading(true);
    setTrackNotFound(false);
    setTrackedOrder(null);
    try {
      const snap = await getDocs(publicCol('orders'));
      const found = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .find((o) => (o.orderNumber || '').toUpperCase() === q);
      if (found) setTrackedOrder(found);
      else setTrackNotFound(true);
    } catch {
      setTrackNotFound(true);
    } finally {
      setTrackingLoading(false);
    }
  };

  const whatsNewList = useMemo(() => {
    if (settings.whatsNewMode === 'manual' && settings.whatsNewManualIds?.length > 0) {
      return settings.whatsNewManualIds.map((id) => notebooks.find((n) => n.id === id)).filter(Boolean);
    }
    return [...notebooks].slice(0, settings.whatsNewLimit || 6);
  }, [notebooks, settings]);

  const isAdmin = user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (isAdmin && adminViewOpen) {
    return (
      <AdminDashboard
        settings={settings}
        notebooks={notebooks}
        coupons={coupons}
        orders={orders}
        onSaveSettings={handleSaveSettings}
        onClosePreview={() => setAdminViewOpen(false)}
      />
    );
  }

  const promoBgClass =
    settings.promoBannerColor === 'blue'
      ? 'bg-blue-700'
      : settings.promoBannerColor === 'emerald'
      ? 'bg-emerald-700'
      : settings.promoBannerColor === 'red'
      ? 'bg-red-700'
      : settings.promoBannerColor === 'purple'
      ? 'bg-purple-800'
      : 'bg-slate-950';

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 overflow-x-clip flex flex-col justify-between">
      <div>
        {/* شريط الرأس الموحد والمثبت دائمًا في أعلى الشاشة (مدمج بذكاء للهاتف) */}
        <div className="sticky top-0 z-40 shadow-md">
          {/* الشريط الترويجي العلوي — ينطوي تلقائيًا على الهاتف عند التمرير للأسفل لتوفير مساحة الشاشة */}
          {settings.promoBannerEnabled && settings.promoBannerText && !promoDismissed && (
            <div
              className={`${promoBgClass} text-white px-2.5 py-1.5 text-[11px] sm:text-sm font-bold transition-all ${
                isScrolled ? 'hidden sm:block' : 'block'
              }`}
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between sm:justify-center gap-1.5 text-right sm:text-center">
                <span className="truncate flex-1 sm:flex-initial">{settings.promoBannerText}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {settings.promoBannerCoupon && (
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(settings.promoBannerCoupon);
                        setCopiedPromo(true);
                        setTimeout(() => setCopiedPromo(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-white text-slate-950 font-black text-[10px] sm:text-xs shadow-sm hover:bg-amber-300 transition"
                    >
                      <Copy className="w-3 h-3" />
                      <span>
                        {copiedPromo
                          ? 'نُسخ!'
                          : settings.promoBannerCoupon}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => navigateTo('offers')}
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs hover:bg-amber-300"
                  >
                    العروض
                  </button>
                  <button
                    onClick={() => setPromoDismissed(true)}
                    title="إخفاء الشريط"
                    className="p-0.5 rounded hover:bg-white/20 text-white/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* الهيدر الرئيسي المتجاوب بالكامل للهاتف والكمبيوتر */}
          <header className="bg-white/95 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2 sm:py-3">
              <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 sm:gap-3">
                {/* اليمين: الشعار واسم المنصة */}
                <div
                  onClick={() => {
                    logoClickCountRef.current += 1;
                    if (logoClickCountRef.current >= 5) {
                      logoClickCountRef.current = 0;
                      if (isAdmin) setAdminViewOpen(true);
                      else setShowAdminLogin(true);
                    }
                    navigateTo('home');
                  }}
                  className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 flex-1 lg:flex-initial"
                >
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.siteName}
                      style={{
                        width: `${Math.min(58, Math.max(38, settings.logoSize || 48))}px`,
                        height: `${Math.min(58, Math.max(38, settings.logoSize || 48))}px`
                      }}
                      className="rounded-xl sm:rounded-2xl object-cover border-2 border-slate-900 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-lg sm:text-xl shrink-0 shadow-sm">
                      ع
                    </div>
                  )}
                  <div className="text-right min-w-0">
                    <h1 className="text-xs sm:text-lg xl:text-xl font-black bg-gradient-to-l from-slate-950 via-blue-900 to-blue-700 bg-clip-text text-transparent leading-tight truncate">
                      {settings.siteName}
                    </h1>
                    <p className="hidden md:block text-[11px] text-slate-500 font-semibold truncate max-w-[290px]">
                      {settings.siteTagline}
                    </p>
                  </div>
                </div>

                {/* المنتصف (على الشاشات الكبيرة): روابط التنقل */}
                <nav className="order-3 lg:order-2 w-full lg:w-auto grid grid-cols-4 lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl sm:rounded-2xl border border-slate-200/70">
                  {[
                    { id: 'home', label: 'الرئيسية', icon: Home },
                    { id: 'catalog', label: 'المذكرات', icon: BookOpen },
                    { id: 'offers', label: 'العروض', icon: Percent },
                    { id: 'track', label: 'تتبع طلبك', icon: Package }
                  ].map((navItem) => {
                    const Icon = navItem.icon;
                    const active = activePage === navItem.id;
                    return (
                      <button
                        key={navItem.id}
                        onClick={() => navigateTo(navItem.id)}
                        className={`py-1.5 sm:py-2 px-1.5 sm:px-3.5 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs xl:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition whitespace-nowrap ${
                          active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>{navItem.label}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* اليسار: أزرار الإجراءات (الإدارة، السلة، تواصل معنا) */}
                <div className="order-2 lg:order-3 flex items-center gap-1 sm:gap-2 shrink-0">
                  {isAdmin && (
                    <button
                      onClick={() => setAdminViewOpen(true)}
                      className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="hidden sm:inline">الإدارة</span>
                    </button>
                  )}

                  <button
                    onClick={() => setCartOpen(true)}
                    className="relative px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-black text-[11px] sm:text-sm flex items-center gap-1 transition"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="hidden xs:inline sm:inline">السلة</span>
                    {cart.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black leading-none">
                        {cart.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setContactModalOpen(true)}
                    className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[11px] sm:text-sm flex items-center gap-1 shadow-sm transition whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>تواصل معنا</span>
                  </button>
                </div>
              </div>
            </div>
          </header>
        </div>

        {/* ================================================================ */}
        {/* الصفحة الرئيسية (Home) */}
        {/* ================================================================ */}
        {activePage === 'home' && (
          <main className="space-y-10 pb-12">
            {/* الواجهة الرئيسية Hero */}
            <section
              style={{ minHeight: `${settings.heroMinHeight || 440}px` }}
              className="relative bg-slate-950 text-white flex items-center overflow-hidden"
            >
              {settings.heroBgImage && (
                <img
                  src={settings.heroBgImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div
                style={{ opacity: (settings.heroOverlayOpacity || 78) / 100 }}
                className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/95 to-blue-950"
              />

              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
                <div className="lg:col-span-7 text-right space-y-5">
                  {settings.heroBadge && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{settings.heroBadge}</span>
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight">
                    {settings.heroTitle}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                    {settings.heroSubtitle}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => navigateTo('catalog')}
                      className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm sm:text-base shadow-lg shadow-blue-600/30 transition"
                    >
                      تصفح مكتبة المذكرات
                    </button>
                    <button
                      onClick={() => setContactModalOpen(true)}
                      className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm sm:text-base transition"
                    >
                      اطلب إعداد مذكرة خاصة
                    </button>
                  </div>
                </div>

                {/* بطاقة «لماذا يثق بنا المعلمون؟» */}
                {settings.trustCardEnabled && (
                  <div className="lg:col-span-5">
                    <div className="bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl text-right space-y-4">
                      <div className="flex items-center gap-2 text-amber-400 font-black text-base sm:text-lg">
                        <ShieldCheck className="w-6 h-6 shrink-0" />
                        <span>{settings.trustCardTitle}</span>
                      </div>
                      <ul className="space-y-3">
                        {settings.trustCardItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* الأقسام الرئيسية */}
            <section className="max-w-7xl mx-auto px-3 sm:px-6 space-y-5 text-right">
              <div className="text-center space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">الأقسام الرئيسية للمذكرات والكورسات</h2>
                <p className="text-xs sm:text-sm text-slate-500">اختر القسم المناسب لتصفح مجلدات المراحل والصفوف الدراسية</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {settings.categories.map((cat) => {
                  const count = notebooks.filter((n) => n.category === cat).length;
                  const img = settings.categoryImages?.[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => navigateTo('catalog', cat)}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all text-right group"
                    >
                      <div className="h-44 bg-gradient-to-br from-blue-600 to-indigo-800 relative overflow-hidden">
                        {img && (
                          <img
                            src={img}
                            alt={cat}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/75 text-white text-xs font-black backdrop-blur-sm">
                          {count} مذكرة متاحة
                        </span>
                      </div>
                      <div className="p-5 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-black text-slate-900">{cat}</h3>
                          <p className="text-xs text-blue-600 font-bold mt-0.5">تصفح المراحل والصفوف الدراسية</p>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-blue-600 group-hover:-translate-x-1 transition" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* قسم ما الجديد؟ */}
            {settings.whatsNewEnabled && whatsNewList.length > 0 && (
              <section className="max-w-7xl mx-auto px-3 sm:px-6 space-y-5 text-right">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black">إصدارات حديثة</span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">{settings.whatsNewTitle}</h2>
                  </div>
                  <button
                    onClick={() => navigateTo('catalog')}
                    className="text-xs sm:text-sm font-black text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>عرض الكل</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {whatsNewList.map((nb) => (
                    <NotebookCard
                      key={nb.id}
                      notebook={nb}
                      onPreview={setPreviewNotebook}
                      onAddToCart={handleAddToCart}
                      isInCart={cartIds.has(nb.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* قسم أخبار المنصة ومذكرات قيد التجهيز */}
            {settings.newsSectionEnabled &&
              ((settings.newsItems || []).length > 0 || notebooks.some((n) => n.comingSoon)) && (
                <section className="max-w-7xl mx-auto px-3 sm:px-6 space-y-5 text-right">
                  <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-2xl font-black">{settings.newsSectionTitle}</h2>
                          <p className="text-xs text-slate-300">تابع أحدث الإعلانات والمذكرات الجاري تجهيزها للحجز المسبق</p>
                        </div>
                      </div>
                    </div>

                    {/* بطاقات الأخبار */}
                    {(settings.newsItems || []).length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {settings.newsItems.map((news, idx) => (
                          <div
                            key={news.id || idx}
                            className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black text-sm sm:text-base text-white">{news.title}</span>
                              {news.badge && (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shrink-0">
                                  {news.badge}
                                </span>
                              )}
                            </div>
                            {news.details && <p className="text-xs text-slate-200 leading-relaxed">{news.details}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* المذكرات قيد التجهيز (حجز مسبق) */}
                    {notebooks.some((n) => n.comingSoon) && (
                      <div className="space-y-2.5 pt-1">
                        <div className="text-xs font-black text-amber-300">مذكرات قيد التجهيز (متاحة للحجز المسبق):</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {notebooks
                            .filter((n) => n.comingSoon)
                            .map((nb) => (
                              <div
                                key={nb.id}
                                onClick={() => setPreviewNotebook(nb)}
                                className="bg-white text-slate-900 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer hover:shadow-lg transition"
                              >
                                <div className="min-w-0">
                                  <div className="font-black text-xs sm:text-sm truncate">{nb.title}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {nb.grade} • {nb.price} ج.م
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[11px] font-black shrink-0">
                                  احجز مسبقًا
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
          </main>
        )}

        {/* ================================================================ */}
        {/* صفحة مكتبة المذكرات (Catalog) */}
        {/* ================================================================ */}
        {activePage === 'catalog' && (
          <CatalogPage
            notebooks={notebooks}
            settings={settings}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedStage={selectedStage}
            setSelectedStage={setSelectedStage}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            onPreview={setPreviewNotebook}
            onAddToCart={handleAddToCart}
            cartIds={cartIds}
          />
        )}

        {/* ================================================================ */}
        {/* صفحة العروض والباقات (Offers) */}
        {/* ================================================================ */}
        {activePage === 'offers' && (
          <OffersAndBundlesPage
            settings={settings}
            notebooks={notebooks}
            coupons={coupons}
            onAddBundleToCart={handleAddBundleToCart}
            onPreview={setPreviewNotebook}
          />
        )}

        {/* ================================================================ */}
        {/* صفحة تتبع طلبك (Track) */}
        {/* ================================================================ */}
        {activePage === 'track' && (
          <div className="max-w-xl mx-auto px-4 py-12 text-right space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="text-center space-y-1">
                <Package className="w-11 h-11 text-blue-600 mx-auto" />
                <h2 className="text-xl font-black text-slate-900">تتبع حالة طلبك</h2>
                <p className="text-xs text-slate-500">أدخل رقم الطلب الذي حصلت عليه عند إتمام الحجز (مثال: ORD-123456)</p>
              </div>

              <form onSubmit={handleTrackOrder} className="flex gap-2">
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="ORD-XXXXXX"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm font-black uppercase"
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-black text-sm"
                >
                  {trackingLoading ? 'بحث...' : 'استعلام'}
                </button>
              </form>

              {trackNotFound && (
                <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-bold text-center">
                  لم يتم العثور على طلب بهذا الرقم، تأكد من كتابة الرقم بشكل صحيح.
                </div>
              )}

              {trackedOrder && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-sm">
                  <div className="flex items-center justify-between font-black">
                    <span>رقم الطلب: {trackedOrder.orderNumber}</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs">
                      {trackedOrder.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700">
                    المذكرات: {(trackedOrder.items || []).map((i) => i.title).join(' + ')}
                  </div>
                  <div className="text-xs font-black text-emerald-800">
                    الإجمالي النهائي: {trackedOrder.total} ج.م
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* إشعار صغير عند إضافة مذكرة أو باقة للسلة دون فتح النافذة */}
      {cartToast && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-400/40 flex items-center gap-2 text-xs sm:text-sm font-black max-w-[92%]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{cartToast}</span>
        </div>
      )}

      {/* شريط سلة عائم أسفل الشاشة عند إضافة مذكرات */}
      {cart.length > 0 && !cartOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-950 text-white shadow-2xl border border-white/15 flex items-center justify-between font-black text-sm hover:bg-slate-900 transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                {cart.length}
              </span>
              <span>عرض سلة الطلبات وإتمام الحجز</span>
            </div>
            <span className="text-amber-400">
              {cart.reduce((s, i) => s + (Number(i.price) || 0), 0)} ج.م ←
            </span>
          </button>
        </div>
      )}

      {/* تذييل الصفحة Footer */}
      <footer className="bg-slate-950 text-slate-300 py-8 px-4 border-t border-white/10 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div>
            <div className="font-black text-white text-base">{settings.siteName}</div>
            <div className="text-xs text-slate-400 mt-0.5">{settings.siteTagline}</div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            {(settings.socialLinks || [])
              .filter((s) => s.visible !== false && s.url)
              .map((soc) => {
                const detected = detectSocialPlatform(soc.url, soc.platform);
                return (
                  <a
                    key={soc.id}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={soc.title || detected.defaultTitle}
                    className={`w-10 h-10 rounded-xl ${detected.bg} text-white flex items-center justify-center hover:scale-105 transition`}
                  >
                    {detected.svg}
                  </a>
                );
              })}
          </div>
        </div>
      </footer>

      {/* نافذة تواصل معنا المنبثقة */}
      {contactModalOpen && (
        <div dir="rtl" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="text-right">
                <h3 className="text-base sm:text-lg font-black">تواصل معنا مباشرة</h3>
                <p className="text-xs text-slate-300">اختر وسيلة التواصل المناسبة لك</p>
              </div>
              <button
                onClick={() => setContactModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-2.5 max-h-[75vh] overflow-y-auto">
              {(settings.socialLinks || [])
                .filter((s) => s.visible !== false && s.url)
                .map((soc) => {
                  const detected = detectSocialPlatform(soc.url, soc.platform);
                  return (
                    <a
                      key={soc.id}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition ${detected.softBg}`}
                    >
                      <div className="flex items-center gap-3 text-right min-w-0">
                        <div className={`w-11 h-11 rounded-xl ${detected.bg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                          {detected.svg}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-sm text-slate-900 truncate">
                            {soc.title || detected.defaultTitle}
                          </div>
                          <div className="text-xs text-slate-600 truncate">
                            {soc.subtitle || detected.name}
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
                    </a>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل دخول الإدارة */}
      {showAdminLogin && (
        <div dir="rtl" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-lg text-slate-900">
                <Lock className="w-5 h-5 text-blue-600" />
                <span>دخول لوحة الإدارة</span>
              </div>
              <button onClick={() => setShowAdminLogin(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-left"
                dir="ltr"
              />
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-left"
                dir="ltr"
              />
              {loginError && <p className="text-xs font-bold text-red-600">{loginError}</p>}
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm"
              >
                {loggingIn ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* نافذة معاينة المذكرة */}
      {previewNotebook && (
        <ProtectedPreviewModal
          notebook={previewNotebook}
          settings={settings}
          onClose={() => setPreviewNotebook(null)}
          onAddToCart={handleAddToCart}
          isInCart={cartIds.has(previewNotebook.id)}
        />
      )}

      {/* نافذة سلة الطلبات */}
      {cartOpen && (
        <OrderCheckoutModal
          cart={cart}
          settings={settings}
          coupons={coupons}
          onClose={() => setCartOpen(false)}
          onRemoveItem={(id) => setCart((p) => p.filter((x) => x.id !== id))}
          onClearCart={() => setCart([])}
        />
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
