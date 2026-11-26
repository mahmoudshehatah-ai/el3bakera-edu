import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  ShoppingCart,
  Search,
  Phone,
  Shield,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Sparkles,
  Tag,
  Upload,
  Lock,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Folder,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Layers,
  Award,
  Clock,
  Sliders,
  Download,
  RefreshCw,
  Edit3,
  MessageCircle,
  Share2,
  Gift,
  Database
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

/* ============================================================================
   1. FIREBASE CONFIGURATION & SAFE INITIALIZATION
============================================================================ */
const firebaseConfig = {
  apiKey: 'AIzaSyD_du5VY8nJGDJ169Fof9EAlI9x2W2d-14',
  authDomain: 'el3bakera-edu.firebaseapp.com',
  projectId: 'el3bakera-edu',
  storageBucket: 'el3bakera-edu.firebasestorage.app',
  messagingSenderId: '74663879858',
  appId: '1:74663879858:web:4327c0ea1b825dd6c615ab'
};

let app = null;
let auth = null;
let db = null;

try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  console.warn('Firebase initialization warning:', err);
}

const APP_ID = 'el3bakera-edu';
const LEGACY_APP_IDS = ['el3bakera-edu', 'default-app-id', 'muzakkirati-platform'];
const publicDoc = (colName, docId, appId = APP_ID) =>
  doc(db, 'artifacts', appId, 'public', 'data', colName, docId);
const publicCol = (colName, appId = APP_ID) =>
  collection(db, 'artifacts', appId, 'public', 'data', colName);

/* ============================================================================
   2. DEFAULT DATA & LOCAL STORAGE PERSISTENCE
============================================================================ */
const LS_KEYS = {
  SETTINGS: 'mz_platform_settings_v3',
  NOTEBOOKS: 'mz_platform_notebooks_v3',
  ORDERS: 'mz_platform_orders_v3',
  COUPONS: 'mz_platform_coupons_v3',
  CART: 'mz_platform_cart_v3'
};

const DEFAULT_STAGE_GRADES = {
  'المرحلة الابتدائية': [
    'الصف الأول الابتدائي',
    'الصف الثاني الابتدائي',
    'الصف الثالث الابتدائي',
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

const DEFAULT_SETTINGS = {
  brandName: 'منصة العباقرة للمذكرات التعليمية',
  brandTagline: 'مذكرات دراسية احترافية مخصصة باسمك وبياناتك الخاصة',
  logoUrl: '',
  logoSize: 56,
  heroBgImage: '',
  heroBgOpacity: 35,
  heroBgFit: 'cover',
  heroOverlayColor: '#020617',
  heroOverlayOpacity: 65,
  heroHeight: 540,
  heroBadge: 'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle:
    'نوفر للمعلمين مذكرات دراسية منسقة ومحدّثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة اسم المعلم، رقم الهاتف، والشعار الخاص به على الغلاف وجميع الصفحات.',
  trustCardTitle: 'لماذا يثق بنا المعلمون؟',
  trustPoints: [
    'محتوى علمي منقح ومطابق لأحدث مواصفات الوزارة',
    'وضع اسم المعلم ورقم الهاتف والشعار على جميع الصفحات',
    'معاينة حقيقية لصفحات المذكرة قبل تأكيد الطلب',
    'تسليم سريع بصيغة PDF عالية الدقة جاهزة للطباعة'
  ],
  emptyCategoryTitle: 'جاري تجهيز أحدث المذكرات لهذا القسم قريبًا!',
  emptyCategorySubtitle:
    'نعمل حاليًا على تنسيق ومراجعة مذكرات هذا القسم بأعلى جودة. يمكنك حجز مذكرتك مسبقًا أو التواصل معنا.',
  emptyCategoryButtonText: 'اطلب تجهيز مذكرتك الآن',
  emptyCategoryImage: '',
  promoBannerEnabled: true,
  promoBannerText:
    '🎉 عرض خاص للمعلمين: خصم 15% على جميع مذكرات الترم الأول + إضافة الشعار مجانًا لفترة محدودة!',
  whatsappNumber: '201068481536',
  supportPhone: '01068481536',
  paymentInstructions:
    'يرجى تحويل قيمة الطلب عبر فودافون كاش أو إنستا باي على الرقم: 01068481536 وإرسال صورة إيصال التحويل عبر واتساب لتفعيل رابط التحميل فورًا.',
  nextOrderRewardEnabled: true,
  nextOrderDiscountPercent: 15,
  categories: ['مذكرات الترم الأول', 'مذكرات الترم الثاني', 'كورسات التأسيس'],
  stages: ['المرحلة الابتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية'],
  stageGrades: DEFAULT_STAGE_GRADES,
  grades: [
    'الصف الأول الابتدائي',
    'الصف الثاني الابتدائي',
    'الصف الثالث الابتدائي',
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
    'الأحياء',
    'التأسيس'
  ],
  socialLinks: [
    {
      id: 'soc-1',
      label: 'صفحة الفيسبوك',
      url: 'https://www.facebook.com',
      platform: 'facebook'
    }
  ]
};

const readLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage write warning:', e);
  }
};

/* ============================================================================
   3. DATA NORMALIZATION & HELPER UTILITIES
============================================================================ */
const extractStringLabel = (item) => {
  if (typeof item === 'string') return item.trim();
  if (item && typeof item === 'object') {
    return String(item.name || item.label || item.title || '').trim();
  }
  return '';
};

const normalizeStringArray = (arr, fallback) => {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  const cleaned = arr.map(extractStringLabel).filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
};

const normalizeSettings = (raw) => {
  const src = raw && typeof raw === 'object' ? raw : {};
  const stages = normalizeStringArray(src.stages, DEFAULT_SETTINGS.stages);
  const allGrades = normalizeStringArray(src.grades, DEFAULT_SETTINGS.grades);

  let stageGrades = {};
  if (src.stageGrades && typeof src.stageGrades === 'object') {
    stages.forEach((st) => {
      if (Array.isArray(src.stageGrades[st])) {
        stageGrades[st] = normalizeStringArray(src.stageGrades[st], []);
      } else {
        stageGrades[st] = DEFAULT_STAGE_GRADES[st] || [];
      }
    });
  } else {
    stages.forEach((st) => {
      stageGrades[st] = DEFAULT_STAGE_GRADES[st] || allGrades;
    });
  }

  let detectedLogo =
    src.logoUrl ||
    src.brandLogo ||
    src.logoData ||
    src.logo ||
    src.siteLogo ||
    '';
  let detectedHeroBg =
    src.heroBgImage ||
    src.heroBgUrl ||
    src.heroBg ||
    src.heroImage ||
    src.bannerImage ||
    '';

  if (!detectedLogo || !detectedHeroBg) {
    Object.entries(src).forEach(([k, v]) => {
      if (typeof v === 'string' && v.startsWith('data:image/')) {
        const lowerK = k.toLowerCase();
        if (!detectedLogo && lowerK.includes('logo')) detectedLogo = v;
        else if (
          !detectedHeroBg &&
          (lowerK.includes('hero') || lowerK.includes('bg') || lowerK.includes('banner'))
        ) {
          detectedHeroBg = v;
        }
      }
    });
  }

  const normalizedSocials = Array.isArray(src.socialLinks)
    ? src.socialLinks
        .map((s, idx) => {
          if (!s || typeof s !== 'object') return null;
          return {
            id: s.id || `soc-${idx}`,
            label: String(s.label || s.name || 'رابط تواصل'),
            url: String(s.url || s.link || '').trim(),
            platform: String(s.platform || '')
          };
        })
        .filter((s) => s && s.url)
    : DEFAULT_SETTINGS.socialLinks;

  return {
    ...DEFAULT_SETTINGS,
    ...src,
    logoUrl: detectedLogo,
    logoSize: Number(src.logoSize) || DEFAULT_SETTINGS.logoSize,
    heroBgImage: detectedHeroBg,
    heroBgOpacity:
      src.heroBgOpacity !== undefined ? Number(src.heroBgOpacity) : DEFAULT_SETTINGS.heroBgOpacity,
    heroBgFit: src.heroBgFit || DEFAULT_SETTINGS.heroBgFit,
    heroOverlayColor: src.heroOverlayColor || DEFAULT_SETTINGS.heroOverlayColor,
    heroOverlayOpacity:
      src.heroOverlayOpacity !== undefined
        ? Number(src.heroOverlayOpacity)
        : DEFAULT_SETTINGS.heroOverlayOpacity,
    heroHeight: Number(src.heroHeight) || DEFAULT_SETTINGS.heroHeight,
    trustPoints: normalizeStringArray(src.trustPoints, DEFAULT_SETTINGS.trustPoints),
    categories: normalizeStringArray(src.categories, DEFAULT_SETTINGS.categories),
    stages,
    stageGrades,
    grades: allGrades,
    subjects: normalizeStringArray(src.subjects, DEFAULT_SETTINGS.subjects),
    socialLinks: normalizedSocials
  };
};

const normalizeNotebook = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: String(raw.id || `nb_${Date.now()}`),
    title: String(raw.title || 'مذكرة دراسية'),
    category: extractStringLabel(raw.category) || 'مذكرات الترم الأول',
    stage: extractStringLabel(raw.stage) || 'المرحلة الإعدادية',
    grade: extractStringLabel(raw.grade) || 'الصف الأول الإعدادي',
    subject: extractStringLabel(raw.subject) || 'اللغة العربية',
    price: Number(raw.price) || 0,
    oldPrice: Number(raw.oldPrice) || 0,
    pagesCount: Number(raw.pagesCount) || 0,
    badge: String(raw.badge || ''),
    description: String(raw.description || ''),
    coverImage: String(raw.coverImage || raw.coverUrl || ''),
    sampleImages: Array.isArray(raw.sampleImages)
      ? raw.sampleImages.filter((x) => typeof x === 'string' && x)
      : [],
    deliveryUrl: String(raw.deliveryUrl || raw.driveUrl || ''),
    isComingSoon: Boolean(raw.isComingSoon),
    isHidden: Boolean(raw.isHidden),
    createdAt: raw.createdAt || new Date().toISOString()
  };
};

const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const compressImageFile = (file, maxWidth = 1200, quality = 0.85) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
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

const generateOrderCode = () => {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${num}`;
};

const generatePersonalCouponCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NEXT-${suffix}`;
};

/* ============================================================================
   4. SOCIAL MEDIA BRAND ICON COMPONENT
============================================================================ */
function SocialBrandIcon({ url = '', label = '', className = 'w-5 h-5' }) {
  const target = `${url} ${label}`.toLowerCase();

  if (target.includes('whatsapp') || target.includes('wa.me') || target.includes('واتس')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.458 3.475 1.329 4.988L2 22l5.188-1.359a9.923 9.923 0 0 0 4.843 1.258h.004c5.515 0 9.969-4.454 9.969-9.969A9.934 9.934 0 0 0 19.085 4.9 9.904 9.904 0 0 0 12.031 2zm5.816 14.23c-.244.688-1.422 1.314-1.969 1.396-.504.075-1.142.107-1.842-.116-.425-.135-.97-.316-1.669-.618-2.936-1.268-4.853-4.225-5-4.42-.146-.195-1.194-1.589-1.194-3.031 0-1.442.755-2.151 1.023-2.444.268-.293.586-.366.781-.366.195 0 .391.002.562.01.18.009.422-.068.66.504.244.586.83 2.026.903 2.173.073.146.122.317.024.512-.098.195-.146.317-.293.488-.146.171-.308.382-.439.512-.146.146-.299.305-.128.598.171.293.758 1.251 1.628 2.026 1.119.997 2.062 1.306 2.355 1.452.293.146.464.122.635-.073.171-.195.732-.854.927-1.147.195-.293.391-.244.659-.146.268.098 1.708.805 2.001.952.293.146.488.22.561.342.073.122.073.707-.171 1.395z" />
      </svg>
    );
  }

  if (target.includes('facebook') || target.includes('fb.com') || target.includes('فيس')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    );
  }

  if (target.includes('telegram') || target.includes('t.me') || target.includes('تليجرام')) {
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

  if (target.includes('tiktok') || target.includes('تيك')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    );
  }

  if (target.includes('instagram') || target.includes('انست') || target.includes('إنست')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }

  return <ExternalLink className={className} />;
}

const getSocialBadgeStyle = (url = '', label = '') => {
  const target = `${url} ${label}`.toLowerCase();
  if (target.includes('whatsapp') || target.includes('wa.me') || target.includes('واتس')) {
    return 'bg-emerald-600 text-white';
  }
  if (target.includes('facebook') || target.includes('fb.com') || target.includes('فيس')) {
    return 'bg-blue-600 text-white';
  }
  if (target.includes('telegram') || target.includes('t.me') || target.includes('تليجرام')) {
    return 'bg-sky-500 text-white';
  }
  if (target.includes('youtube') || target.includes('youtu.be') || target.includes('يوتيوب')) {
    return 'bg-red-600 text-white';
  }
  if (target.includes('tiktok') || target.includes('تيك')) {
    return 'bg-slate-900 text-white';
  }
  if (target.includes('instagram') || target.includes('انست') || target.includes('إنست')) {
    return 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white';
  }
  return 'bg-slate-700 text-white';
};

/* ============================================================================
   5. ERROR BOUNDARY
============================================================================ */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'حدث خطأ غير متوقع في عرض الواجهة'
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-slate-50 flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              حدث خطأ مؤقت في عرض الصفحة
            </h2>
            <p className="text-xs text-slate-500 break-words leading-relaxed">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg transition cursor-pointer"
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

/* ============================================================================
   6. MAIN APPLICATION COMPONENT
============================================================================ */
function MuzakkiratiApp() {
  const [settings, setSettings] = useState(() =>
    normalizeSettings(readLS(LS_KEYS.SETTINGS, DEFAULT_SETTINGS))
  );
  const [notebooks, setNotebooks] = useState(() => {
    const saved = readLS(LS_KEYS.NOTEBOOKS, []);
    return Array.isArray(saved) ? saved.map(normalizeNotebook).filter(Boolean) : [];
  });
  const [orders, setOrders] = useState(() => readLS(LS_KEYS.ORDERS, []));
  const [coupons, setCoupons] = useState(() => readLS(LS_KEYS.COUPONS, []));
  const [cart, setCart] = useState(() => readLS(LS_KEYS.CART, []));

  // Navigation & Browser History State
  const [activeTab, setActiveTab] = useState('home');
  const [catalogPath, setCatalogPath] = useState({
    category: '',
    stage: '',
    grade: ''
  });
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [toast, setToast] = useState(null);
  const logoClickRef = useRef({ count: 0, lastTime: 0 });
  const isPoppingRef = useRef(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Sync navigation state with Browser & Mobile Back Button (popstate)
  const navigateTo = (nextTab, nextCatalogPath = { category: '', stage: '', grade: '' }) => {
    setActiveTab(nextTab);
    setCatalogPath(nextCatalogPath);
    if (!isPoppingRef.current) {
      try {
        window.history.pushState(
          { tab: nextTab, catalogPath: nextCatalogPath },
          '',
          `#${nextTab}`
        );
      } catch {}
    }
  };

  useEffect(() => {
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash === 'admin') {
      setShowAdmin(true);
    } else if (['home', 'catalog', 'offers', 'track', 'contact'].includes(initialHash)) {
      setActiveTab(initialHash);
    }

    try {
      window.history.replaceState(
        { tab: activeTab, catalogPath },
        '',
        window.location.hash || '#home'
      );
    } catch {}

    const handlePopState = (event) => {
      isPoppingRef.current = true;
      if (showAdmin) {
        setShowAdmin(false);
      } else if (previewNotebook) {
        setPreviewNotebook(null);
      } else if (showCheckoutModal) {
        setShowCheckoutModal(false);
      } else if (showSocialModal) {
        setShowSocialModal(false);
      } else if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
        setCatalogPath(event.state.catalogPath || { category: '', stage: '', grade: '' });
      } else if (window.location.hash === '#admin') {
        setShowAdmin(true);
      } else {
        setActiveTab('home');
        setCatalogPath({ category: '', stage: '', grade: '' });
      }
      setTimeout(() => {
        isPoppingRef.current = false;
      }, 50);
    };

    const handleKeyDown = (e) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAdmin(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAdmin, previewNotebook, showCheckoutModal, showSocialModal]);

  // Firebase Auth & Real-Time Firestore Listeners
  useEffect(() => {
    if (!auth || !db) return;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setAdminUser(user || null);
    });

    const unsubscribers = [];

    const subscribeSettingsDoc = (docRef) => {
      const unsub = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists() && snap.data()) {
            const normalized = normalizeSettings(snap.data());
            setSettings(normalized);
            writeLS(LS_KEYS.SETTINGS, normalized);
          }
        },
        (err) => console.warn('Settings listener info:', err.code)
      );
      unsubscribers.push(unsub);
    };

    subscribeSettingsDoc(publicDoc('config', 'settings'));
    subscribeSettingsDoc(publicDoc('config', 'main'));

    const unsubNotebooks = onSnapshot(
      publicCol('notebooks'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => normalizeNotebook({ id: d.id, ...d.data() }))
            .filter(Boolean);
          setNotebooks(list);
          writeLS(LS_KEYS.NOTEBOOKS, list);
        }
      },
      (err) => console.warn('Notebooks listener info:', err.code)
    );
    unsubscribers.push(unsubNotebooks);

    const unsubOrders = onSnapshot(
      publicCol('orders'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(list);
        writeLS(LS_KEYS.ORDERS, list);
      },
      (err) => console.warn('Orders listener info:', err.code)
    );
    unsubscribers.push(unsubOrders);

    const unsubCoupons = onSnapshot(
      publicCol('coupons'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCoupons(list);
        writeLS(LS_KEYS.COUPONS, list);
      },
      (err) => console.warn('Coupons listener info:', err.code)
    );
    unsubscribers.push(unsubCoupons);

    return () => {
      unsubAuth();
      unsubscribers.forEach((fn) => fn && fn());
    };
  }, []);

  // Deep-scan recovery across cloud paths & legacy localStorage keys
  const handleScanAndRecoverCloudData = async (silent = false) => {
    let recoveredCount = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.includes('mz_platform')) continue;
        const parsed = readLS(k, null);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.brandName) {
          const norm = normalizeSettings(parsed);
          setSettings(norm);
          recoveredCount++;
        } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.title) {
          const normList = parsed.map(normalizeNotebook).filter(Boolean);
          setNotebooks((prev) => {
            const map = new Map(prev.map((x) => [x.id, x]));
            normList.forEach((x) => map.set(x.id, x));
            return Array.from(map.values());
          });
          recoveredCount += normList.length;
        }
      }
    } catch {}

    if (db) {
      for (const aid of LEGACY_APP_IDS) {
        for (const docName of ['settings', 'main', 'general']) {
          try {
            const snap = await getDoc(publicDoc('config', docName, aid));
            if (snap.exists() && snap.data()) {
              const norm = normalizeSettings(snap.data());
              setSettings(norm);
              writeLS(LS_KEYS.SETTINGS, norm);
              recoveredCount++;
            }
          } catch {}
        }

        try {
          const nbSnap = await getDocs(publicCol('notebooks', aid));
          if (!nbSnap.empty) {
            const list = nbSnap.docs
              .map((d) => normalizeNotebook({ id: d.id, ...d.data() }))
              .filter(Boolean);
            setNotebooks((prev) => {
              const map = new Map(prev.map((x) => [x.id, x]));
              list.forEach((x) => map.set(x.id, x));
              const merged = Array.from(map.values());
              writeLS(LS_KEYS.NOTEBOOKS, merged);
              return merged;
            });
            recoveredCount += list.length;
          }
        } catch {}
      }

      try {
        const rootNbSnap = await getDocs(collection(db, 'notebooks'));
        if (!rootNbSnap.empty) {
          const list = rootNbSnap.docs
            .map((d) => normalizeNotebook({ id: d.id, ...d.data() }))
            .filter(Boolean);
          setNotebooks((prev) => {
            const map = new Map(prev.map((x) => [x.id, x]));
            list.forEach((x) => map.set(x.id, x));
            const merged = Array.from(map.values());
            writeLS(LS_KEYS.NOTEBOOKS, merged);
            return merged;
          });
          recoveredCount += list.length;
        }
      } catch {}
    }

    if (!silent) {
      if (recoveredCount > 0) {
        showToast(`تم فحص السحابة واسترجاع ${recoveredCount} عنصر بنجاح!`);
      } else {
        showToast(
          'تم فحص جميع مسارات السحابة — لا توجد بيانات سابقة أخرى مخزنة',
          'error'
        );
      }
    }
  };

  useEffect(() => {
    handleScanAndRecoverCloudData(true);
  }, [adminUser]);

  // Cart Actions (Multi-notebook support)
  const addToCart = (notebook, openModal = true) => {
    setCart((prev) => {
      if (prev.some((item) => item.id === notebook.id)) {
        return prev;
      }
      const next = [...prev, notebook];
      writeLS(LS_KEYS.CART, next);
      return next;
    });
    if (openModal) {
      setShowCheckoutModal(true);
    } else {
      showToast(`تمت إضافة «${notebook.title}» إلى سلة الطلبات`);
    }
  };

  const removeFromCart = (notebookId) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.id !== notebookId);
      writeLS(LS_KEYS.CART, next);
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    writeLS(LS_KEYS.CART, []);
  };

  // Admin Save Actions
  const handleSaveSettings = async (nextSettings) => {
    const normalized = normalizeSettings(nextSettings);
    setSettings(normalized);
    writeLS(LS_KEYS.SETTINGS, normalized);
    if (db) {
      try {
        await setDoc(publicDoc('config', 'settings'), normalized, { merge: true });
        await setDoc(publicDoc('config', 'main'), normalized, { merge: true });
        showToast('تم حفظ جميع الإعدادات ومزامنتها مع السحابة بنجاح!');
      } catch (err) {
        showToast('تم الحفظ محليًا؛ يرجى التأكد من تسجيل دخول المدير للمزامنة', 'error');
      }
    }
  };

  const handleSaveNotebook = async (nbData) => {
    const normalized = normalizeNotebook(nbData);
    setNotebooks((prev) => {
      const exists = prev.some((n) => n.id === normalized.id);
      const next = exists
        ? prev.map((n) => (n.id === normalized.id ? normalized : n))
        : [normalized, ...prev];
      writeLS(LS_KEYS.NOTEBOOKS, next);
      return next;
    });
    if (db) {
      try {
        await setDoc(publicDoc('notebooks', normalized.id), normalized, { merge: true });
        showToast('تم حفظ المذكرة ومزامنتها بنجاح!');
      } catch {
        showToast('تم حفظ المذكرة محليًا', 'error');
      }
    }
  };

  const handleToggleNotebookVisibility = async (notebook) => {
    const updated = { ...notebook, isHidden: !notebook.isHidden };
    await handleSaveNotebook(updated);
    showToast(updated.isHidden ? 'تم إخفاء المذكرة عن الزوار مؤقتًا' : 'تم إظهار المذكرة للزوار');
  };

  const handleDeleteNotebook = async (id) => {
    setNotebooks((prev) => {
      const next = prev.filter((n) => n.id !== id);
      writeLS(LS_KEYS.NOTEBOOKS, next);
      return next;
    });
    if (db) {
      try {
        await deleteDoc(publicDoc('notebooks', id));
        showToast('تم حذف المذكرة نهائيًا');
      } catch {}
    }
  };

  const handleCreateOrder = async (orderPayload) => {
    setOrders((prev) => {
      const next = [orderPayload, ...prev];
      writeLS(LS_KEYS.ORDERS, next);
      return next;
    });
    if (db) {
      try {
        await setDoc(publicDoc('orders', orderPayload.id), orderPayload);
      } catch (err) {
        console.warn('Order cloud save warning:', err);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    setOrders((prev) => {
      const next = prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
      writeLS(LS_KEYS.ORDERS, next);
      return next;
    });
    if (db) {
      try {
        await setDoc(publicDoc('orders', orderId), { status: nextStatus }, { merge: true });
        showToast('تم تحديث حالة الطلب بنجاح');
      } catch {}
    }
  };

  const handleDeleteOrder = async (orderId) => {
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== orderId);
      writeLS(LS_KEYS.ORDERS, next);
      return next;
    });
    if (db) {
      try {
        await deleteDoc(publicDoc('orders', orderId));
        showToast('تم حذف الطلب');
      } catch {}
    }
  };

  const handleSaveCoupon = async (couponObj) => {
    setCoupons((prev) => {
      const exists = prev.some((c) => c.id === couponObj.id);
      const next = exists
        ? prev.map((c) => (c.id === couponObj.id ? couponObj : c))
        : [couponObj, ...prev];
      writeLS(LS_KEYS.COUPONS, next);
      return next;
    });
    if (db) {
      try {
        await setDoc(publicDoc('coupons', couponObj.id), couponObj, { merge: true });
      } catch {}
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    setCoupons((prev) => {
      const next = prev.filter((c) => c.id !== couponId);
      writeLS(LS_KEYS.COUPONS, next);
      return next;
    });
    if (db) {
      try {
        await deleteDoc(publicDoc('coupons', couponId));
        showToast('تم حذف الكوبون');
      } catch {}
    }
  };

  const handleImportBackup = async (backupData) => {
    if (!backupData || typeof backupData !== 'object') return;
    if (backupData.settings) {
      await handleSaveSettings(backupData.settings);
    }
    if (Array.isArray(backupData.notebooks)) {
      for (const nb of backupData.notebooks) {
        await handleSaveNotebook(nb);
      }
    }
    if (Array.isArray(backupData.coupons)) {
      for (const cp of backupData.coupons) {
        await handleSaveCoupon(cp);
      }
    }
    showToast('تمت استعادة النسخة الاحتياطية بالكامل بنجاح!');
  };

  // Visible notebooks for public visitors
  const visibleNotebooks = useMemo(
    () => notebooks.filter((nb) => !nb.isHidden),
    [notebooks]
  );

  // Secret 5-tap logo trigger for Admin Portal
  const handleLogoSecretClick = () => {
    const now = Date.now();
    if (now - logoClickRef.current.lastTime < 1500) {
      logoClickRef.current.count += 1;
    } else {
      logoClickRef.current.count = 1;
    }
    logoClickRef.current.lastTime = now;

    if (logoClickRef.current.count >= 5) {
      logoClickRef.current.count = 0;
      setShowAdmin(true);
    } else {
      navigateTo('home');
    }
  };

  const logoSizePx = Number(settings.logoSize) || 56;

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-[100] px-5 py-3.5 rounded-2xl shadow-2xl text-white font-bold text-sm flex items-center gap-2.5 transition-all ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-200 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Promo Top Banner */}
      {settings.promoBannerEnabled && settings.promoBannerText && (
        <div className="bg-slate-950 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-bold border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3">
            <span>{settings.promoBannerText}</span>
            <button
              type="button"
              onClick={() => navigateTo('offers')}
              className="px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer"
            >
              استفد من العرض ←
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <div
            onClick={handleLogoSecretClick}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.brandName}
                style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}
                className="rounded-2xl object-cover border border-slate-200 shadow-sm group-hover:scale-105 transition"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition">
                <BookOpen className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {settings.brandName}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                {settings.brandTagline}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto max-w-full">
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
                  navigateTo(item.id, { category: '', stage: '', grade: '' })
                }
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Left Action Buttons: Cart, Admin (if logged in), Social Hub */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCheckoutModal(true)}
              className="relative px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
              title="سلة الطلبات"
            >
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">السلة</span>
              {cart.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-black">
                  {cart.length}
                </span>
              )}
            </button>

            {adminUser && (
              <button
                type="button"
                onClick={() => setShowAdmin(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>لوحة التحكم</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSocialModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تواصل معنا</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            settings={settings}
            notebooks={visibleNotebooks}
            onOpenCategory={(cat) =>
              navigateTo('catalog', { category: cat, stage: '', grade: '' })
            }
            onNavigate={navigateTo}
            onPreview={setPreviewNotebook}
            onOrder={(nb) => addToCart(nb, true)}
            onAddToCart={(nb) => addToCart(nb, false)}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogPage
            settings={settings}
            notebooks={visibleNotebooks}
            catalogPath={catalogPath}
            setCatalogPath={(nextPath) => navigateTo('catalog', nextPath)}
            onPreview={setPreviewNotebook}
            onOrder={(nb) => addToCart(nb, true)}
            onAddToCart={(nb) => addToCart(nb, false)}
            onNavigate={navigateTo}
          />
        )}

        {activeTab === 'offers' && (
          <OffersPage
            settings={settings}
            notebooks={visibleNotebooks}
            coupons={coupons}
            onPreview={setPreviewNotebook}
            onOrder={(nb) => addToCart(nb, true)}
            onAddToCart={(nb) => addToCart(nb, false)}
            showToast={showToast}
          />
        )}

        {activeTab === 'track' && (
          <TrackOrderPage orders={orders} settings={settings} />
        )}

        {activeTab === 'contact' && <ContactPage settings={settings} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.brandName}
                  className="w-11 h-11 rounded-xl object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
              <h3 className="text-lg font-black text-white">{settings.brandName}</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {settings.brandTagline}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-black text-white">روابط سريعة</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('catalog')}
                  className="hover:text-white transition cursor-pointer"
                >
                  تصفح جميع المذكرات
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('offers')}
                  className="hover:text-white transition cursor-pointer"
                >
                  العروض وكوبونات الخصم
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('track')}
                  className="hover:text-white transition cursor-pointer"
                >
                  متابعة حالة الطلب
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-black text-white">تواصل معنا</h4>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 transition"
              >
                <SocialBrandIcon url="whatsapp" className="w-4 h-4" />
                <span>واتساب</span>
              </a>
              {settings.socialLinks?.map((soc) => (
                <a
                  key={soc.id}
                  href={sanitizeUrl(soc.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black flex items-center gap-2 transition"
                >
                  <SocialBrandIcon url={soc.url} label={soc.label} className="w-4 h-4" />
                  <span>{soc.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500">
          جميع الحقوق محفوظة © {new Date().getFullYear()} — {settings.brandName}
        </div>
      </footer>

      {/* Social Links Hub Modal */}
      {showSocialModal && (
        <SocialHubModal
          settings={settings}
          onClose={() => setShowSocialModal(false)}
        />
      )}

      {/* Protected Notebook Sample Previewer Modal */}
      {previewNotebook && (
        <ProtectedPreviewerModal
          notebook={previewNotebook}
          brandName={settings.brandName}
          onClose={() => setPreviewNotebook(null)}
          onOrder={() => {
            const target = previewNotebook;
            setPreviewNotebook(null);
            addToCart(target, true);
          }}
        />
      )}

      {/* Multi-Notebook Checkout & Personal Coupon Modal */}
      {showCheckoutModal && (
        <OrderCheckoutModal
          cart={cart}
          allNotebooks={visibleNotebooks}
          settings={settings}
          coupons={coupons}
          onAddToCart={(nb) => addToCart(nb, false)}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
          onCreateOrder={handleCreateOrder}
          onSaveCoupon={handleSaveCoupon}
          onClose={() => setShowCheckoutModal(false)}
          showToast={showToast}
        />
      )}

      {/* Admin Dashboard Modal */}
      {showAdmin && (
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
          onScanRecover={() => handleScanAndRecoverCloudData(false)}
          onCloseAdmin={() => {
            setShowAdmin(false);
            if (window.location.hash === '#admin') {
              window.history.replaceState(null, '', '#home');
            }
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

/* ============================================================================
   7. HOME PAGE
============================================================================ */
function HomePage({
  settings,
  notebooks,
  onOpenCategory,
  onNavigate,
  onPreview,
  onOrder,
  onAddToCart
}) {
  const featured = notebooks.slice(0, 6);
  const bgOpacity = Math.max(0, Math.min(100, Number(settings.heroBgOpacity ?? 35))) / 100;
  const overlayOpacity =
    Math.max(0, Math.min(100, Number(settings.heroOverlayOpacity ?? 65))) / 100;
  const minHeightPx = Number(settings.heroHeight) || 540;

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          backgroundColor: settings.heroOverlayColor || '#020617',
          minHeight: `${minHeightPx}px`
        }}
        className="relative text-white overflow-hidden flex items-center"
      >
        {settings.heroBgImage && (
          <img
            src={settings.heroBgImage}
            alt="خلفية المنصة"
            style={{
              opacity: bgOpacity,
              objectFit: settings.heroBgFit === 'contain' ? 'contain' : 'cover'
            }}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}
        <div
          style={{
            backgroundColor: settings.heroOverlayColor || '#020617',
            opacity: overlayOpacity * 0.55
          }}
          className="absolute inset-0 pointer-events-none"
        />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            {settings.heroBadge && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-black">
                <Sparkles className="w-4 h-4" />
                <span>{settings.heroBadge}</span>
              </div>
            )}
            <h2 className="text-3xl sm:text-5xl font-black leading-tight">
              {settings.heroTitle}
            </h2>
            <p className="text-slate-200 text-sm sm:text-lg leading-relaxed max-w-2xl">
              {settings.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className="px-7 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-600/30 transition cursor-pointer"
              >
                تصفح مكتبة المذكرات
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-black text-sm sm:text-base transition cursor-pointer"
              >
                اطلب إعداد مذكرة خاصة
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2.5 text-amber-400 font-black text-base">
                <Shield className="w-5 h-5" />
                <span>{settings.trustCardTitle || 'لماذا يثق بنا المعلمون؟'}</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-200 font-semibold">
                {(settings.trustPoints || []).map((pt, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Main Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
            الأقسام الرئيسية للمذكرات والكورسات
          </h3>
          <p className="text-sm text-slate-500">
            اختر القسم المناسب لتصفح المجلدات الدراسية والمذكرات المتاحة
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {settings.categories.map((cat, idx) => {
            const count = notebooks.filter((n) => n.category === cat).length;
            return (
              <div
                key={`${cat}-${idx}`}
                onClick={() => onOpenCategory(cat)}
                className="group bg-white rounded-3xl border border-slate-200 p-7 shadow-sm hover:shadow-xl hover:border-blue-300 transition cursor-pointer flex flex-col justify-between gap-6"
              >
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                    <FolderOpen className="w-7 h-7" />
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                    {count} مذكرة
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition">
                    {cat}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    اضغط لفتح مجلدات المراحل والصفوف الدراسية
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Notebooks */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900">أحدث المذكرات المضافة</h3>
              <p className="text-sm text-slate-500">
                تصفح أحدث الإصدارات الجاهزة للتخصيص باسمك
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-black hover:bg-slate-800 transition cursor-pointer"
            >
              عرض الكل ←
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                onPreview={() => onPreview(nb)}
                onOrder={() => onOrder(nb)}
                onAddToCart={() => onAddToCart(nb)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ============================================================================
   8. FOLDER-BASED CATALOG PAGE (Category -> Stage -> Grade -> Notebooks)
============================================================================ */
function CatalogPage({
  settings,
  notebooks,
  catalogPath,
  setCatalogPath,
  onPreview,
  onOrder,
  onAddToCart,
  onNavigate
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const { category, stage, grade } = catalogPath;
  const isSearching = searchQuery.trim().length > 0 || selectedSubject !== '';

  const matchingNotebooks = useMemo(() => {
    return notebooks.filter((nb) => {
      if (category && nb.category !== category) return false;
      if (stage && nb.stage !== stage) return false;
      if (grade && nb.grade !== grade) return false;
      if (selectedSubject && nb.subject !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${nb.title} ${nb.subject} ${nb.grade} ${nb.stage} ${nb.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notebooks, category, stage, grade, selectedSubject, searchQuery]);

  const handleStepBack = () => {
    if (grade) {
      setCatalogPath({ category, stage, grade: '' });
    } else if (stage) {
      setCatalogPath({ category, stage: '', grade: '' });
    } else if (category) {
      setCatalogPath({ category: '', stage: '', grade: '' });
    }
  };

  const gradesForCurrentStage =
    (stage && settings.stageGrades?.[stage]) || settings.grades || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Search & Subject Quick Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث مباشرة باسم المذكرة، المادة، أو الصف الدراسي..."
            className="w-full pr-12 pl-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500"
        >
          <option value="">كل المواد الدراسية</option>
          {settings.subjects.map((sub, i) => (
            <option key={`${sub}-${i}`} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* Breadcrumb Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-black">
          <button
            type="button"
            onClick={() => setCatalogPath({ category: '', stage: '', grade: '' })}
            className={`cursor-pointer ${
              !category ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            جميع الأقسام
          </button>

          {category && (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setCatalogPath({ category, stage: '', grade: '' })}
                className={`cursor-pointer ${
                  !stage ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {category}
              </button>
            </>
          )}

          {stage && (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setCatalogPath({ category, stage, grade: '' })}
                className={`cursor-pointer ${
                  !grade ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {stage}
              </button>
            </>
          )}

          {grade && (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
              <span className="text-blue-600">{grade}</span>
            </>
          )}
        </div>

        {(category || stage || grade) && (
          <button
            type="button"
            onClick={handleStepBack}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>رجوع للمجلد السابق</span>
          </button>
        )}
      </div>

      {/* Folder Hierarchy Views */}
      {!isSearching && !category && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {settings.categories.map((cat, idx) => {
            const count = notebooks.filter((n) => n.category === cat).length;
            return (
              <div
                key={`${cat}-${idx}`}
                onClick={() => setCatalogPath({ category: cat, stage: '', grade: '' })}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-blue-400 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <Folder className="w-8 h-8 fill-amber-400/30" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{cat}</h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                      {count} مذكرة متاحة
                    </p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </div>
            );
          })}
        </div>
      )}

      {!isSearching && category && !stage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {settings.stages.map((st, idx) => {
            const count = notebooks.filter(
              (n) => n.category === category && n.stage === st
            ).length;
            return (
              <div
                key={`${st}-${idx}`}
                onClick={() => setCatalogPath({ category, stage: st, grade: '' })}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-blue-400 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{st}</h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                      {count} مذكرة داخل المرحلة
                    </p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </div>
            );
          })}
        </div>
      )}

      {!isSearching && category && stage && !grade && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gradesForCurrentStage.map((gr, idx) => {
            const count = notebooks.filter(
              (n) => n.category === category && n.stage === stage && n.grade === gr
            ).length;
            return (
              <div
                key={`${gr}-${idx}`}
                onClick={() => setCatalogPath({ category, stage, grade: gr })}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-emerald-400 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{gr}</h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                      {count} مذكرة في هذا الصف
                    </p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </div>
            );
          })}
        </div>
      )}

      {/* Notebooks Grid or Custom Empty State */}
      {(isSearching || (category && stage && grade)) && (
        <div className="space-y-6">
          {matchingNotebooks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-14 text-center space-y-5 max-w-2xl mx-auto">
              {settings.emptyCategoryImage ? (
                <img
                  src={settings.emptyCategoryImage}
                  alt="قريبًا"
                  className="max-h-52 mx-auto rounded-2xl object-contain"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8" />
                </div>
              )}
              <h3 className="text-xl font-black text-slate-900">
                {settings.emptyCategoryTitle || 'جاري تجهيز أحدث المذكرات لهذا القسم قريبًا!'}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {settings.emptyCategorySubtitle ||
                  'نعمل حاليًا على تنسيق ومراجعة مذكرات هذا القسم بأعلى جودة. يمكنك حجز مذكرتك مسبقًا أو التواصل معنا.'}
              </p>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                {settings.emptyCategoryButtonText || 'اطلب تجهيز مذكرتك الآن'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchingNotebooks.map((nb) => (
                <NotebookCard
                  key={nb.id}
                  notebook={nb}
                  onPreview={() => onPreview(nb)}
                  onOrder={() => onOrder(nb)}
                  onAddToCart={() => onAddToCart(nb)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   9. NOTEBOOK CARD COMPONENT
============================================================================ */
function NotebookCard({ notebook, onPreview, onOrder, onAddToCart }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col justify-between group">
      <div>
        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
          {notebook.coverImage ? (
            <img
              src={notebook.coverImage}
              alt={notebook.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <BookOpen className="w-12 h-12" />
              <span className="text-xs font-bold">{notebook.subject}</span>
            </div>
          )}

          {notebook.badge && (
            <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-black shadow-md">
              {notebook.badge}
            </span>
          )}

          {notebook.isComingSoon && (
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shadow-md">
              قريبًا / حجز مسبق
            </span>
          )}

          {notebook.pagesCount > 0 && (
            <span className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-sm text-white text-xs font-black">
              {notebook.pagesCount} صفحة
            </span>
          )}
        </div>

        <div className="p-5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <span>{notebook.category}</span>
            <span>•</span>
            <span>{notebook.grade}</span>
          </div>

          <h4 className="text-lg font-black text-slate-900 leading-snug">
            {notebook.title}
          </h4>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {notebook.description}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-2 space-y-3">
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-blue-600">
              {notebook.price} ج.م
            </span>
            {notebook.oldPrice > notebook.price && (
              <span className="text-xs text-slate-400 line-through font-bold">
                {notebook.oldPrice} ج.م
              </span>
            )}
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-black">
            {notebook.subject}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOrder}
            className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>اطلب الآن</span>
          </button>

          <button
            type="button"
            onClick={onAddToCart}
            className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-xs transition cursor-pointer"
            title="إضافة للسلة لطلب أكثر من مذكرة"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onPreview}
            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   10. PROTECTED SAMPLE PREVIEWER MODAL
============================================================================ */
function ProtectedPreviewerModal({ notebook, brandName, onClose, onOrder }) {
  const pages =
    notebook.sampleImages && notebook.sampleImages.length > 0
      ? notebook.sampleImages
      : notebook.coverImage
      ? [notebook.coverImage]
      : [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [zoom, setZoom] = useState(1);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3 text-white">
          <div>
            <h3 className="text-sm sm:text-base font-black">{notebook.title}</h3>
            <p className="text-[11px] text-slate-400">
              معاينة محمية لصفحات العينة ({pages.length > 0 ? `${currentIdx + 1} من ${pages.length}` : '0'})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOrder}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black cursor-pointer"
            >
              اطلب النسخة الكاملة
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Stage */}
        <div
          style={{ touchAction: 'pan-y pinch-zoom' }}
          className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center relative select-none bg-slate-950"
        >
          {pages.length === 0 ? (
            <div className="text-center text-slate-400 space-y-2 py-12">
              <FileText className="w-12 h-12 mx-auto opacity-40" />
              <p className="text-sm font-bold">لم يتم رفع صفحات عينة لهذه المذكرة بعد</p>
            </div>
          ) : (
            <div className="relative inline-block">
              <img
                src={pages[currentIdx]}
                alt={`صفحة ${currentIdx + 1}`}
                draggable={false}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                className="max-h-[65vh] w-auto rounded-xl shadow-2xl transition-transform pointer-events-none"
              />
              {/* Diagonal Watermark Overlay */}
              <div className="inset-0 absolute flex items-center justify-center pointer-events-none overflow-hidden">
                <span className="text-white/15 font-black text-2xl sm:text-4xl -rotate-30 whitespace-nowrap select-none">
                  {brandName} — نسخة معاينة
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Page Switcher */}
        {pages.length > 1 && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-40 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الصفحة السابقة</span>
            </button>
            <span className="text-xs font-black text-slate-300">
              {currentIdx + 1} / {pages.length}
            </span>
            <button
              type="button"
              disabled={currentIdx === pages.length - 1}
              onClick={() => setCurrentIdx((i) => Math.min(pages.length - 1, i + 1))}
              className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-40 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <span>الصفحة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   11. MULTI-NOTEBOOK CHECKOUT & PERSONAL SINGLE-USE COUPON MODAL
============================================================================ */
function OrderCheckoutModal({
  cart,
  allNotebooks,
  settings,
  coupons,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onCreateOrder,
  onSaveCoupon,
  onClose,
  showToast
}) {
  const [teacherName, setTeacherName] = useState('');
  const [phone, setPhone] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [extraNotebookId, setExtraNotebookId] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState(null);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    [cart]
  );

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return Math.round((subtotal * Number(appliedCoupon.discountPercent || 0)) / 100);
  }, [subtotal, appliedCoupon]);

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const found = coupons.find((c) => c.code?.toUpperCase() === code);
    if (!found) {
      showToast('كود الخصم غير صحيح', 'error');
      return;
    }
    if (found.singleUse && found.isUsed) {
      showToast('عذرًا، هذا الكوبون مخصص للاستخدام مرة واحدة وقد تم استخدامه بالفعل!', 'error');
      return;
    }
    setAppliedCoupon(found);
    showToast(`تم تفعيل خصم ${found.discountPercent}% بنجاح!`);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('يرجى إضافة مذكرة واحدة على الأقل للسلة', 'error');
      return;
    }
    if (!teacherName.trim() || !phone.trim()) {
      showToast('يرجى إدخال اسم المعلم ورقم الواتساب', 'error');
      return;
    }

    const orderCode = generateOrderCode();
    let generatedNextCoupon = null;

    if (settings.nextOrderRewardEnabled && Number(settings.nextOrderDiscountPercent) > 0) {
      const nextCode = generatePersonalCouponCode();
      generatedNextCoupon = {
        id: `cp_${Date.now()}`,
        code: nextCode,
        discountPercent: Number(settings.nextOrderDiscountPercent),
        singleUse: true,
        isUsed: false,
        assignedToPhone: phone.trim(),
        assignedToName: teacherName.trim(),
        createdFromOrder: orderCode,
        createdAt: new Date().toISOString()
      };
      await onSaveCoupon(generatedNextCoupon);
    }

    if (appliedCoupon && appliedCoupon.singleUse) {
      await onSaveCoupon({
        ...appliedCoupon,
        isUsed: true,
        usedByOrder: orderCode,
        usedAt: new Date().toISOString()
      });
    }

    const newOrder = {
      id: orderCode,
      orderCode,
      teacherName: teacherName.trim(),
      phone: phone.trim(),
      customTitle: customTitle.trim() || teacherName.trim(),
      notes: notes.trim(),
      items: cart.map((item) => ({
        id: item.id,
        title: item.title,
        grade: item.grade,
        subject: item.subject,
        price: item.price,
        deliveryUrl: item.deliveryUrl || ''
      })),
      subtotal,
      discountAmount,
      couponUsed: appliedCoupon ? appliedCoupon.code : '',
      totalPrice: finalTotal,
      nextOrderCoupon: generatedNextCoupon ? generatedNextCoupon.code : '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await onCreateOrder(newOrder);
    clearCart();
    setSubmittedOrder(newOrder);
  };

  const availableToAdd = allNotebooks.filter(
    (nb) => !cart.some((c) => c.id === nb.id)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-xl font-black text-slate-900">
            {submittedOrder ? 'تم تسجيل طلبك بنجاح! 🎉' : 'إتمام طلب المذكرات المخصصة'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedOrder ? (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <p className="text-sm text-slate-500 font-bold">رقم متابعة الطلب الخاص بك:</p>
              <p className="text-2xl font-black text-blue-600 tracking-wider">
                {submittedOrder.orderCode}
              </p>
            </div>

            {submittedOrder.nextOrderCoupon && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-amber-800 font-black text-xs">
                  <Gift className="w-4 h-4" />
                  <span>هدية خاصة لطلبك القادم (يُستخدم مرة واحدة):</span>
                </div>
                <p className="text-lg font-black text-slate-900 tracking-widest">
                  {submittedOrder.nextOrderCoupon}
                </p>
                <p className="text-[11px] text-amber-700 font-semibold">
                  احتفظ بهذا الكود للحصول على خصم {settings.nextOrderDiscountPercent}% على طلبك التالي!
                </p>
              </div>
            )}

            <div className="bg-slate-50 rounded-2xl p-4 text-right text-xs text-slate-600 leading-relaxed border border-slate-200">
              <strong className="text-slate-900 block mb-1">خطوات التفعيل والاستلام:</strong>
              {settings.paymentInstructions}
            </div>

            <a
              href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
                `السلام عليكم، قمت بتسجيل طلب جديد برقم: ${submittedOrder.orderCode}\nالاسم: ${submittedOrder.teacherName}\nالمذكرات: ${submittedOrder.items
                  .map((i) => i.title)
                  .join(' + ')}\nالإجمالي: ${submittedOrder.totalPrice} ج.م`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
            >
              <SocialBrandIcon url="whatsapp" className="w-5 h-5" />
              <span>إرسال تفاصيل الطلب وتأكيد الدفع عبر واتساب</span>
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-800">
                  المذكرات المختارة في السلة ({cart.length})
                </span>
              </div>

              {cart.length === 0 ? (
                <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl">
                  السلة فارغة حاليًا — اختر مذكرة من القائمة أدناه لإضافتها.
                </p>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl"
                    >
                      <div>
                        <p className="text-xs sm:text-sm font-black text-slate-900">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.grade} • {item.subject}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs sm:text-sm font-black text-blue-600">
                          {item.price} ج.م
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(item.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                          title="إزالة من السلة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {availableToAdd.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={extraNotebookId}
                    onChange={(e) => setExtraNotebookId(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  >
                    <option value="">+ أضف مذكرة أخرى لنفس الطلب...</option>
                    {availableToAdd.map((nb) => (
                      <option key={nb.id} value={nb.id}>
                        {nb.title} ({nb.grade}) — {nb.price} ج.م
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const found = availableToAdd.find((n) => n.id === extraNotebookId);
                      if (found) {
                        onAddToCart(found);
                        setExtraNotebookId('');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black cursor-pointer"
                  >
                    إضافة
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  اسم المعلم / الأستاذ *
                </label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="مثال: أ/ محمود شحاتة"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  رقم الواتساب (للتواصل والاستلام) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                الاسم المطلوب كتابته على الغلاف والصفحات (اختياري)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="مثال: سلسلة العباقرة — أ/ محمود شحاتة (010...)"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                ملاحظات إضافية (اختياري)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي تفاصيل خاصة بالشعار أو الألوان..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="لديك كود خصم؟ اكتبه هنا..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold uppercase"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm cursor-pointer"
              >
                تطبيق الكوبون
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 font-bold">
                <span>المجموع الفرعي:</span>
                <span>{subtotal} ج.م</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-black">
                  <span>قيمة الخصم ({appliedCoupon?.code}):</span>
                  <span>- {discountAmount} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>الإجمالي المطلوب:</span>
                <span className="text-blue-600">{finalTotal} ج.م</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm sm:text-base shadow-lg transition cursor-pointer"
            >
              تأكيد الطلب وإصدار كود المتابعة
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   12. OFFERS, TRACK ORDER, CONTACT & SOCIAL HUB PAGES
============================================================================ */
function OffersPage({
  settings,
  notebooks,
  coupons,
  onPreview,
  onOrder,
  onAddToCart,
  showToast
}) {
  const publicCoupons = coupons.filter((c) => !c.singleUse);
  const discountedNotebooks = notebooks.filter((n) => n.oldPrice > n.price);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-900">العروض وكوبونات الخصم</h2>
        <p className="text-sm text-slate-500">
          استفد من الخصومات الحصرية ومكافآت الطلبات المتكررة للمعلمين
        </p>
      </div>

      {settings.nextOrderRewardEnabled && (
        <div className="bg-gradient-to-l from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
              <Gift className="w-4 h-4" />
              <span>مكافأة العملاء الدائمين</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black">
              احصل على كود خصم شخصي بنسبة {settings.nextOrderDiscountPercent}% على طلبك التالي!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              بمجرد إتمام أي طلب على المنصة، يصدر لك النظام تلقائيًا كود خصم فريد صالح للاستخدام مرة واحدة في طلبك القادم.
            </p>
          </div>
        </div>
      )}

      {publicCoupons.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {publicCoupons.map((cp) => (
            <div
              key={cp.id}
              className="bg-white rounded-3xl border-2 border-dashed border-blue-300 p-6 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-500">كود خصم {cp.discountPercent}%</span>
                <p className="text-xl font-black text-blue-600 tracking-wider mt-1">
                  {cp.code}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(cp.code);
                  showToast(`تم نسخ الكود: ${cp.code}`);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>نسخ</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {discountedNotebooks.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-900">مذكرات عليها خصم مباشر</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {discountedNotebooks.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                onPreview={() => onPreview(nb)}
                onOrder={() => onOrder(nb)}
                onAddToCart={() => onAddToCart(nb)}
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
        o.orderCode?.toLowerCase() === q ||
        o.phone?.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))
    );
  }, [orders, query]);

  const statusLabels = {
    pending: { label: 'قيد المراجعة وتأكيد الدفع', color: 'bg-amber-100 text-amber-800' },
    preparing: { label: 'جاري تجهيز المذكرة باسمك وشعارك', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'مكتمل وجاهز للتحميل', color: 'bg-emerald-100 text-emerald-800' }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          تتبع حالة طلبك واستلام المذكرات
        </h2>
        <p className="text-sm text-slate-500">
          أدخل رقم الطلب (مثال: ORD-12345) أو رقم هاتفك المسجل في الطلب
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
            placeholder="أدخل رقم الطلب أو رقم الواتساب..."
            className="flex-1 px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm cursor-pointer"
          >
            بحث عن الطلب
          </button>
        </form>
      </div>

      {searched && (
        <div className="space-y-4">
          {matchedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-500 font-bold">
              لم يتم العثور على طلبات مطابقة. تأكد من الرقم أو تواصل معنا عبر واتساب.
            </div>
          ) : (
            matchedOrders.map((ord) => {
              const st = statusLabels[ord.status] || statusLabels.pending;
              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs text-slate-400 font-bold">رقم الطلب:</span>
                      <h3 className="text-lg font-black text-blue-600">{ord.orderCode}</h3>
                    </div>
                    <span className={`px-3.5 py-1.5 rounded-full text-xs font-black ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-700">المذكرات المطلوبة:</p>
                    {(ord.items || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold"
                      >
                        <span>{item.title}</span>
                        {ord.status === 'completed' && item.deliveryUrl ? (
                          <a
                            href={sanitizeUrl(item.deliveryUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-black flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل النسخة</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">يظهر رابط التحميل عند التفعيل</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {ord.nextOrderCoupon && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-bold text-amber-900">
                      كود الخصم الشخصي لطلبك القادم: <span className="font-black">{ord.nextOrderCoupon}</span>
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

function ContactPage({ settings }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            تواصل مع فريق {settings.brandName}
          </h2>
          <p className="text-sm text-slate-500">
            نسعد بالرد على جميع استفسارات المعلمين وطلبات التخصيص الخاصة على مدار اليوم
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
          <a
            href={`https://wa.me/${settings.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <SocialBrandIcon url="whatsapp" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">مراسلة مباشرة عبر واتساب</h3>
              <p className="text-xs text-emerald-700 font-bold mt-0.5" dir="ltr">
                +{settings.whatsappNumber}
              </p>
            </div>
          </a>

          <a
            href={`tel:${settings.supportPhone}`}
            className="flex items-center gap-4 p-5 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">الاتصال الهاتفي بخدمة العملاء</h3>
              <p className="text-xs text-blue-700 font-bold mt-0.5">{settings.supportPhone}</p>
            </div>
          </a>

          {settings.socialLinks?.map((soc) => (
            <a
              key={soc.id}
              href={sanitizeUrl(soc.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getSocialBadgeStyle(
                  soc.url,
                  soc.label
                )}`}
              >
                <SocialBrandIcon url={soc.url} label={soc.label} className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-slate-900">{soc.label}</h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">{soc.url}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 text-right border border-slate-200">
          <h4 className="text-xs font-black text-slate-900 mb-1">
            بيانات الدفع والتحويل المعتمدة:
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            {settings.paymentInstructions}
          </p>
        </div>
      </div>
    </div>
  );
}

function SocialHubModal({ settings, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-black text-slate-900">قنوات التواصل الرسمية</h3>
            <p className="text-xs text-slate-500">اختر المنصة المناسبة للتواصل معنا مباشرة</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <a
            href={`https://wa.me/${settings.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <SocialBrandIcon url="whatsapp" className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">واتساب المباشر</p>
                <p className="text-xs text-emerald-700 font-bold" dir="ltr">
                  +{settings.whatsappNumber}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-700" />
          </a>

          {settings.socialLinks?.map((soc) => (
            <a
              key={soc.id}
              href={sanitizeUrl(soc.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${getSocialBadgeStyle(
                    soc.url,
                    soc.label
                  )}`}
                >
                  <SocialBrandIcon url={soc.url} label={soc.label} className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">{soc.label}</p>
                  <p className="text-[11px] text-slate-500 truncate">{soc.url}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   13. ADMIN DASHBOARD PORTAL
============================================================================ */
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
  onScanRecover,
  onCloseAdmin,
  showToast
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [adminTab, setAdminTab] = useState('orders');

  // Notebook Form State
  const [editingNbId, setEditingNbId] = useState(null);
  const [nbForm, setNbForm] = useState({
    title: '',
    category: settings.categories[0] || 'مذكرات الترم الأول',
    stage: settings.stages[0] || 'المرحلة الإعدادية',
    grade:
      (settings.stageGrades?.[settings.stages[0]] || settings.grades)[0] ||
      'الصف الأول الإعدادي',
    subject: settings.subjects[0] || 'اللغة العربية',
    price: 100,
    oldPrice: 150,
    pagesCount: 60,
    badge: 'الأكثر طلبًا',
    description: '',
    coverImage: '',
    sampleImages: [],
    deliveryUrl: '',
    isComingSoon: false,
    isHidden: false
  });

  // Taxonomy Management State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [selectedStageForGrades, setSelectedStageForGrades] = useState(
    settings.stages[0] || 'المرحلة الابتدائية'
  );
  const [newGradeName, setNewGradeName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  // Coupon Form State
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(15);
  const [couponSingleUse, setCouponSingleUse] = useState(false);

  // Settings Draft State
  const [draftSettings, setDraftSettings] = useState(settings);
  const [newSocLabel, setNewSocLabel] = useState('');
  const [newSocUrl, setNewSocUrl] = useState('');
  const [newTrustPoint, setNewTrustPoint] = useState('');

  useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!auth) {
      showToast('تعذر الاتصال بخدمة المصادقة', 'error');
      return;
    }
    setLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast('تم تسجيل الدخول إلى لوحة التحكم بنجاح!');
    } catch (err) {
      showToast('بيانات الدخول غير صحيحة، تأكد من البريد وكلمة المرور', 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  if (!adminUser) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">دخول الإدارة</h3>
                <p className="text-xs text-slate-500">لوحة تحكم {settings.brandName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseAdmin}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                البريد الإلكتروني للمدير
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                كلمة المرور
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg transition cursor-pointer"
            >
              {loggingIn ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const moveArrayItem = (arr, index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= arr.length) return arr;
    const copy = [...arr];
    const [removed] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, removed);
    return copy;
  };

  const handleNotebookSubmit = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim()) {
      showToast('يرجى إدخال عنوان المذكرة', 'error');
      return;
    }
    const payload = {
      ...nbForm,
      id: editingNbId || `nb_${Date.now()}`,
      price: Number(nbForm.price) || 0,
      oldPrice: Number(nbForm.oldPrice) || 0,
      pagesCount: Number(nbForm.pagesCount) || 0
    };
    await onSaveNotebook(payload);
    setEditingNbId(null);
    setNbForm({
      title: '',
      category: settings.categories[0] || 'مذكرات الترم الأول',
      stage: settings.stages[0] || 'المرحلة الإعدادية',
      grade:
        (settings.stageGrades?.[settings.stages[0]] || settings.grades)[0] ||
        'الصف الأول الإعدادي',
      subject: settings.subjects[0] || 'اللغة العربية',
      price: 100,
      oldPrice: 150,
      pagesCount: 60,
      badge: '',
      description: '',
      coverImage: '',
      sampleImages: [],
      deliveryUrl: '',
      isComingSoon: false,
      isHidden: false
    });
  };

  const currentStageGradesList =
    settings.stageGrades?.[selectedStageForGrades] || [];

  const formGradesOptions =
    settings.stageGrades?.[nbForm.stage] || settings.grades || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
      {/* Admin Top Header */}
      <div className="bg-slate-950 text-white px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                لوحة تحكم {settings.brandName}
              </h2>
              <p className="text-[11px] text-slate-400">{adminUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onScanRecover}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>مزامنة السحابة</span>
            </button>

            <button
              type="button"
              onClick={onCloseAdmin}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black cursor-pointer"
            >
              معاينة الموقع
            </button>

            <button
              type="button"
              onClick={() => signOut(auth)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Sub-Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'orders', label: `الطلبات (${orders.length})` },
            { id: 'notebooks', label: `المذكرات (${notebooks.length})` },
            { id: 'taxonomy', label: 'الأقسام والمراحل والصفوف' },
            { id: 'coupons', label: 'العروض والكوبونات' },
            { id: 'settings', label: 'إعدادات الموقع والمظهر' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setAdminTab(t.id)}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer ${
                adminTab === t.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ORDERS */}
        {adminTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 font-bold">
                لا توجد طلبات مسجلة حتى الآن
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-black text-blue-600">{ord.orderCode}</span>
                      <h4 className="text-base font-black text-slate-900">
                        {ord.teacherName} — {ord.phone}
                      </h4>
                      {ord.customTitle && (
                        <p className="text-xs text-slate-500">
                          الاسم على الغلاف: {ord.customTitle}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={ord.status}
                        onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value)}
                        className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-black"
                      >
                        <option value="pending">قيد المراجعة</option>
                        <option value="preparing">جاري التجهيز</option>
                        <option value="completed">مكتمل (تفعيل التحميل)</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => onDeleteOrder(ord.id)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1">
                    <p className="font-black">المذكرات المطلوبة:</p>
                    {(ord.items || []).map((it, i) => (
                      <p key={i}>
                        • {it.title} ({it.grade}) — {it.price} ج.م
                      </p>
                    ))}
                    <p className="font-black text-blue-600 pt-1">
                      الإجمالي: {ord.totalPrice} ج.م{' '}
                      {ord.couponUsed ? `(استخدم كوبون: ${ord.couponUsed})` : ''}
                    </p>
                    {ord.nextOrderCoupon && (
                      <p className="text-amber-700 font-bold">
                        كوبون الطلب التالي الصادر للعميل: {ord.nextOrderCoupon}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: NOTEBOOKS */}
        {adminTab === 'notebooks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleNotebookSubmit}
              className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
            >
              <h3 className="text-lg font-black text-slate-900">
                {editingNbId ? 'تعديل المذكرة' : 'إضافة مذكرة جديدة'}
              </h3>

              <input
                type="text"
                required
                value={nbForm.title}
                onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })}
                placeholder="عنوان المذكرة..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={nbForm.category}
                  onChange={(e) => setNbForm({ ...nbForm, category: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                >
                  {settings.categories.map((c, i) => (
                    <option key={i} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={nbForm.stage}
                  onChange={(e) => {
                    const nextStage = e.target.value;
                    const firstGrade =
                      (settings.stageGrades?.[nextStage] || settings.grades)[0] || '';
                    setNbForm({ ...nbForm, stage: nextStage, grade: firstGrade });
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                >
                  {settings.stages.map((s, i) => (
                    <option key={i} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={nbForm.grade}
                  onChange={(e) => setNbForm({ ...nbForm, grade: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                >
                  {formGradesOptions.map((g, i) => (
                    <option key={i} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                <select
                  value={nbForm.subject}
                  onChange={(e) => setNbForm({ ...nbForm, subject: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                >
                  {settings.subjects.map((sub, i) => (
                    <option key={i} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    السعر الحالي
                  </label>
                  <input
                    type="number"
                    value={nbForm.price}
                    onChange={(e) => setNbForm({ ...nbForm, price: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    قبل الخصم
                  </label>
                  <input
                    type="number"
                    value={nbForm.oldPrice}
                    onChange={(e) => setNbForm({ ...nbForm, oldPrice: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    الصفحات
                  </label>
                  <input
                    type="number"
                    value={nbForm.pagesCount}
                    onChange={(e) => setNbForm({ ...nbForm, pagesCount: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                  />
                </div>
              </div>

              <input
                type="text"
                value={nbForm.badge}
                onChange={(e) => setNbForm({ ...nbForm, badge: e.target.value })}
                placeholder="شارة التميز (مثال: الأكثر طلبًا / عرض خاص)"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
              />

              <textarea
                rows={3}
                value={nbForm.description}
                onChange={(e) => setNbForm({ ...nbForm, description: e.target.value })}
                placeholder="وصف المذكرة..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
              />

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-black text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nbForm.isComingSoon}
                  onChange={(e) =>
                    setNbForm({ ...nbForm, isComingSoon: e.target.checked })
                  }
                />
                <span>المذكرة لم تكتمل بعد (وضع إعلان «قريبًا / حجز مسبق»)</span>
              </label>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  رابط Google Drive لتسليم النسخة (اختياري)
                </label>
                <input
                  type="url"
                  value={nbForm.deliveryUrl}
                  onChange={(e) => setNbForm({ ...nbForm, deliveryUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    صورة غلاف المذكرة
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const compressed = await compressImageFile(file, 900, 0.85);
                        setNbForm((prev) => ({ ...prev, coverImage: compressed }));
                        showToast('تم تجهيز صورة الغلاف');
                      } catch {
                        showToast('تعذر معالجة صورة الغلاف', 'error');
                      }
                    }}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    صور صفحات عينة المعاينة (حتى 15 صفحة HD)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []).slice(0, 15);
                      if (files.length === 0) return;
                      try {
                        const imgs = await Promise.all(
                          files.map((f) => compressImageFile(f, 1200, 0.85))
                        );
                        setNbForm((prev) => ({ ...prev, sampleImages: imgs }));
                        showToast(`تم تجهيز ${imgs.length} صفحة عينة بنجاح`);
                      } catch {
                        showToast('تعذر معالجة صور العينات', 'error');
                      }
                    }}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm cursor-pointer"
                >
                  {editingNbId ? 'حفظ التعديلات' : '+ إضافة المذكرة'}
                </button>
                {editingNbId && (
                  <button
                    type="button"
                    onClick={() => setEditingNbId(null)}
                    className="px-4 py-3.5 rounded-2xl bg-slate-200 text-slate-700 font-black text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </form>

            <div className="lg:col-span-6 space-y-3">
              {notebooks.map((nb) => (
                <div
                  key={nb.id}
                  className={`bg-white rounded-2xl border p-4 flex items-center justify-between gap-3 ${
                    nb.isHidden ? 'border-amber-300 bg-amber-50/30 opacity-75' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{nb.title}</h4>
                      {nb.isHidden && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">
                          مخفية عن الزوار
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {nb.category} • {nb.grade} • {nb.price} ج.م
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleNotebookVisibility(nb)}
                      className={`p-2 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer ${
                        nb.isHidden
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                      title={nb.isHidden ? 'إظهار المذكرة للزوار' : 'إخفاء المذكرة مؤقتًا'}
                    >
                      {nb.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingNbId(nb.id);
                        setNbForm(nb);
                      }}
                      className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteNotebook(nb.id)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
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

        {/* TAB 3: FULL TAXONOMY CONTROL */}
        {adminTab === 'taxonomy' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-base font-black text-slate-900">
                1. الأقسام الرئيسية (الترتيب والإضافة والإزالة)
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="اسم قسم جديد..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCategoryName.trim()) return;
                    onSaveSettings({
                      ...settings,
                      categories: [...settings.categories, newCategoryName.trim()]
                    });
                    setNewCategoryName('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer"
                >
                  إضافة
                </button>
              </div>
              <div className="space-y-2">
                {settings.categories.map((cat, idx) => (
                  <div
                    key={`${cat}-${idx}`}
                    className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200"
                  >
                    <span className="text-xs font-black text-slate-800">{cat}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onSaveSettings({
                            ...settings,
                            categories: moveArrayItem(settings.categories, idx, -1)
                          })
                        }
                        className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSaveSettings({
                            ...settings,
                            categories: moveArrayItem(settings.categories, idx, 1)
                          })
                        }
                        className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSaveSettings({
                            ...settings,
                            categories: settings.categories.filter((_, i) => i !== idx)
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

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-base font-black text-slate-900">
                2. المراحل الدراسية (الترتيب والإضافة والإزالة)
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="اسم مرحلة جديدة..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    const name = newStageName.trim();
                    if (!name) return;
                    onSaveSettings({
                      ...settings,
                      stages: [...settings.stages, name],
                      stageGrades: { ...(settings.stageGrades || {}), [name]: [] }
                    });
                    setNewStageName('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer"
                >
                  إضافة
                </button>
              </div>
              <div className="space-y-2">
                {settings.stages.map((st, idx) => (
                  <div
                    key={`${st}-${idx}`}
                    className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200"
                  >
                    <span className="text-xs font-black text-slate-800">{st}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onSaveSettings({
                            ...settings,
                            stages: moveArrayItem(settings.stages, idx, -1)
                          })
                        }
                        className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSaveSettings({
                            ...settings,
                            stages: moveArrayItem(settings.stages, idx, 1)
                          })
                        }
                        className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSaveSettings({
                            ...settings,
                            stages: settings.stages.filter((_, i) => i !== idx)
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

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-base font-black text-slate-900">
                3. تخصيص الصفوف الدراسية لكل مرحلة
              </h3>
              <select
                value={selectedStageForGrades}
                onChange={(e) => setSelectedStageForGrades(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-black text-blue-900"
              >
                {settings.stages.map((st, idx) => (
                  <option key={idx} value={st}>
                    تخصيص صفوف: {st}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGradeName}
                  onChange={(e) => setNewGradeName(e.target.value)}
                  placeholder="أضف صفًا دراسيًا لهذه المرحلة..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    const gName = newGradeName.trim();
                    if (!gName || !selectedStageForGrades) return;
                    const updatedStageGrades = {
                      ...(settings.stageGrades || {}),
                      [selectedStageForGrades]: [...currentStageGradesList, gName]
                    };
                    const mergedAllGrades = Array.from(
                      new Set([...(settings.grades || []), gName])
                    );
                    onSaveSettings({
                      ...settings,
                      stageGrades: updatedStageGrades,
                      grades: mergedAllGrades
                    });
                    setNewGradeName('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer"
                >
                  إضافة صف
                </button>
              </div>

              <div className="space-y-2">
                {currentStageGradesList.map((gr, idx) => (
                  <div
                    key={`${gr}-${idx}`}
                    className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200"
                  >
                    <span className="text-xs font-black text-slate-800">{gr}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onSaveSettings({
                            ...settings,
                            stageGrades: {
                              ...settings.stageGrades,
                              [selectedStageForGrades]: moveArrayItem(
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
                          onSaveSettings({
                            ...settings,
                            stageGrades: {
                              ...settings.stageGrades,
                              [selectedStageForGrades]: moveArrayItem(
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
                          onSaveSettings({
                            ...settings,
                            stageGrades: {
                              ...settings.stageGrades,
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

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-base font-black text-slate-900">
                4. المواد الدراسية
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="اسم مادة جديدة..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSubjectName.trim()) return;
                    onSaveSettings({
                      ...settings,
                      subjects: [...settings.subjects, newSubjectName.trim()]
                    });
                    setNewSubjectName('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer"
                >
                  إضافة
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {settings.subjects.map((sub, idx) => (
                  <div
                    key={`${sub}-${idx}`}
                    className="flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200"
                  >
                    <span className="text-xs font-black text-slate-800">{sub}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onSaveSettings({
                          ...settings,
                          subjects: settings.subjects.filter((_, i) => i !== idx)
                        })
                      }
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COUPONS & OFFERS */}
        {adminTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
              <h3 className="text-base font-black text-slate-900">
                إنشاء كوبون خصم جديد
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="كود الخصم (مثال: WELCOME15)"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black uppercase"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={couponDiscount}
                  onChange={(e) => setCouponDiscount(Number(e.target.value))}
                  placeholder="نسبة الخصم %"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black"
                />
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={couponSingleUse}
                    onChange={(e) => setCouponSingleUse(e.target.checked)}
                  />
                  <span>كوبون شخصي للاستخدام مرة واحدة فقط</span>
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    const code = couponCode.trim().toUpperCase() || generatePersonalCouponCode();
                    await onSaveCoupon({
                      id: `cp_${Date.now()}`,
                      code,
                      discountPercent: Number(couponDiscount) || 10,
                      singleUse: couponSingleUse,
                      isUsed: false,
                      createdAt: new Date().toISOString()
                    });
                    setCouponCode('');
                    showToast(`تم إنشاء الكوبون ${code} بنجاح!`);
                  }}
                  className="w-full py-3 rounded-2xl bg-blue-600 text-white text-xs font-black cursor-pointer"
                >
                  + إنشاء الكوبون
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {coupons.map((cp) => (
                <div
                  key={cp.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-blue-600">{cp.code}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black">
                        خصم {cp.discountPercent}%
                      </span>
                      {cp.singleUse && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            cp.isUsed
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cp.isUsed ? 'مُستخدم' : 'مرة واحدة — متاح'}
                        </span>
                      )}
                    </div>
                    {cp.assignedToName && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        مخصص للعميل: {cp.assignedToName} ({cp.assignedToPhone})
                      </p>
                    )}
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
        )}

        {/* TAB 5: FULL COMPREHENSIVE SITE SETTINGS */}
        {adminTab === 'settings' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900">
                الإعدادات الشاملة للمنصة والمظهر والواجهة الرئيسية
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تحكم في كل تفصيلة من الهوية البصرية، مقاسات الشعار والخلفية، نصوص الصفحة الرئيسية، ورسائل الأقسام الفارغة
              </p>
            </div>

            {/* 1. Brand Identity & Contact */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-blue-600">
                1. الهوية الأساسية وأرقام التواصل والدفع
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    اسم المنصة
                  </label>
                  <input
                    type="text"
                    value={draftSettings.brandName}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, brandName: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    الوصف المختصر أسفل الاسم
                  </label>
                  <input
                    type="text"
                    value={draftSettings.brandTagline}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, brandTagline: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    رقم الواتساب (مع كود الدولة مثل 2010...)
                  </label>
                  <input
                    type="text"
                    value={draftSettings.whatsappNumber}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, whatsappNumber: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    رقم الهاتف / التحويل المالي
                  </label>
                  <input
                    type="text"
                    value={draftSettings.supportPhone}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, supportPhone: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  تعليمات الدفع والتحويل (فودافون كاش / إنستا باي)
                </label>
                <textarea
                  rows={2}
                  value={draftSettings.paymentInstructions}
                  onChange={(e) =>
                    setDraftSettings({
                      ...draftSettings,
                      paymentInstructions: e.target.value
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>

            {/* 2. Logo, Hero Background & Visual Sizing Sliders */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-black text-blue-600">
                2. الشعار وصورة الخلفية وضبط المقاسات والشفافية
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-800">
                    صورة شعار المنصة (Logo)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const img = await compressImageFile(file, 450, 0.9);
                      setDraftSettings((prev) => ({ ...prev, logoUrl: img }));
                      showToast('تم رفع الشعار — اضغط حفظ الإعدادات بالأسفل');
                    }}
                    className="text-xs"
                  />
                  {draftSettings.logoUrl && (
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={draftSettings.logoUrl}
                        alt="Logo preview"
                        className="w-16 h-16 rounded-xl object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraftSettings((prev) => ({ ...prev, logoUrl: '' }))
                        }
                        className="text-xs text-rose-600 font-black cursor-pointer"
                      >
                        إزالة الشعار
                      </button>
                    </div>
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
                      const img = await compressImageFile(file, 1400, 0.85);
                      setDraftSettings((prev) => ({ ...prev, heroBgImage: img }));
                      showToast('تم رفع الخلفية — اضغط حفظ الإعدادات بالأسفل');
                    }}
                    className="text-xs"
                  />
                  {draftSettings.heroBgImage && (
                    <div className="space-y-1 pt-1">
                      <img
                        src={draftSettings.heroBgImage}
                        alt="Hero preview"
                        className="w-full h-16 rounded-xl object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraftSettings((prev) => ({ ...prev, heroBgImage: '' }))
                        }
                        className="text-xs text-rose-600 font-black cursor-pointer"
                      >
                        إزالة الخلفية
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-black">
                    <span>حجم الشعار (Logo)</span>
                    <span className="text-blue-600">{draftSettings.logoSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={140}
                    value={draftSettings.logoSize}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        logoSize: Number(e.target.value)
                      })
                    }
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-black">
                    <span>وضوح صورة الخلفية</span>
                    <span className="text-blue-600">{draftSettings.heroBgOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={draftSettings.heroBgOpacity}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        heroBgOpacity: Number(e.target.value)
                      })
                    }
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span>لون التغطية ودرجته</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftSettings.heroOverlayColor}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            heroOverlayColor: e.target.value
                          })
                        }
                        className="w-6 h-6 rounded cursor-pointer"
                      />
                      <span className="text-blue-600">
                        {draftSettings.heroOverlayOpacity}%
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={draftSettings.heroOverlayOpacity}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        heroOverlayOpacity: Number(e.target.value)
                      })
                    }
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <span className="text-xs font-black text-slate-800">
                    طريقة احتواء صورة الخلفية
                  </span>
                  <select
                    value={draftSettings.heroBgFit}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, heroBgFit: e.target.value })
                    }
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                  >
                    <option value="cover">ملء الإطار بالكامل (Cover)</option>
                    <option value="contain">احتواء كامل الصورة (Contain)</option>
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-black">
                    <span>ارتفاع الواجهة الترحيبية</span>
                    <span className="text-blue-600">{draftSettings.heroHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min={380}
                    max={760}
                    value={draftSettings.heroHeight}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        heroHeight: Number(e.target.value)
                      })
                    }
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* 3. Hero Texts & Promo Banner */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-black text-blue-600">
                3. نصوص الواجهة الرئيسية والشريط الترويجي العلوي
              </h4>

              <label className="flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.promoBannerEnabled}
                  onChange={(e) =>
                    setDraftSettings({
                      ...draftSettings,
                      promoBannerEnabled: e.target.checked
                    })
                  }
                />
                <span>إظهار الشريط الترويجي العلوي</span>
              </label>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  نص الشريط الترويجي العلوي
                </label>
                <input
                  type="text"
                  value={draftSettings.promoBannerText}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, promoBannerText: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  الشارة العلوية في الواجهة (Badge)
                </label>
                <input
                  type="text"
                  value={draftSettings.heroBadge}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, heroBadge: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  العنوان الرئيسي في الواجهة
                </label>
                <input
                  type="text"
                  value={draftSettings.heroTitle}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, heroTitle: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  النص الفرعي للواجهة
                </label>
                <textarea
                  rows={2}
                  value={draftSettings.heroSubtitle}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, heroSubtitle: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>

            {/* 4. Trust Card Editor */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-black text-blue-600">
                4. تخصيص بطاقة «لماذا يثق بنا المعلمون؟»
              </h4>
              <input
                type="text"
                value={draftSettings.trustCardTitle}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, trustCardTitle: e.target.value })
                }
                placeholder="عنوان البطاقة..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTrustPoint}
                  onChange={(e) => setNewTrustPoint(e.target.value)}
                  placeholder="أضف ميزة جديدة للبطاقة..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newTrustPoint.trim()) return;
                    setDraftSettings({
                      ...draftSettings,
                      trustPoints: [
                        ...(draftSettings.trustPoints || []),
                        newTrustPoint.trim()
                      ]
                    });
                    setNewTrustPoint('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black cursor-pointer"
                >
                  + إضافة نقطة
                </button>
              </div>
              <div className="space-y-2">
                {(draftSettings.trustPoints || []).map((pt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    <span>{pt}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftSettings({
                          ...draftSettings,
                          trustPoints: draftSettings.trustPoints.filter((_, idx) => idx !== i)
                        })
                      }
                      className="text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Empty Section Message & Banner */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-black text-blue-600">
                5. تخصيص رسالة وصورة القسم الفارغ (عند عدم وجود مذكرات في القسم بعد)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    العنوان الرئيسي عند خلو القسم
                  </label>
                  <input
                    type="text"
                    value={draftSettings.emptyCategoryTitle}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        emptyCategoryTitle: e.target.value
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    نص زر الحجز أو الطلب المسبق
                  </label>
                  <input
                    type="text"
                    value={draftSettings.emptyCategoryButtonText}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        emptyCategoryButtonText: e.target.value
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  النص التوضيحي أو الإعلاني
                </label>
                <textarea
                  rows={2}
                  value={draftSettings.emptyCategorySubtitle}
                  onChange={(e) =>
                    setDraftSettings({
                      ...draftSettings,
                      emptyCategorySubtitle: e.target.value
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    صورة أو بانر يظهر عند خلو القسم (اختياري)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const img = await compressImageFile(file, 900, 0.85);
                      setDraftSettings((prev) => ({
                        ...prev,
                        emptyCategoryImage: img
                      }));
                      showToast('تم رفع صورة القسم الفارغ');
                    }}
                    className="text-xs"
                  />
                </div>
                {draftSettings.emptyCategoryImage && (
                  <div className="flex items-center gap-2">
                    <img
                      src={draftSettings.emptyCategoryImage}
                      alt="Empty section"
                      className="h-14 rounded-xl border"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraftSettings((prev) => ({
                          ...prev,
                          emptyCategoryImage: ''
                        }))
                      }
                      className="text-xs text-rose-600 font-black cursor-pointer"
                    >
                      حذف الصورة
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Automatic Next-Order Personal Coupon Settings */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <label className="flex items-center gap-2 text-xs font-black text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.nextOrderRewardEnabled}
                  onChange={(e) =>
                    setDraftSettings({
                      ...draftSettings,
                      nextOrderRewardEnabled: e.target.checked
                    })
                  }
                />
                <span>
                  تفعيل الإصدار التلقائي لكوبون خصم شخصي (مرة واحدة) لكل عميل بعد إتمام طلبه
                </span>
              </label>
              {draftSettings.nextOrderRewardEnabled && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">نسبة الخصم %:</span>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={draftSettings.nextOrderDiscountPercent}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        nextOrderDiscountPercent: Number(e.target.value)
                      })
                    }
                    className="w-24 px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-black"
                  />
                </div>
              )}
            </div>

            {/* 7. Social Media Links */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-black text-blue-600">
                6. روابط التواصل الاجتماعي (تظهر بأيقوناتها الرسمية في نافذة «تواصل معنا» وفي التذييل)
              </h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSocLabel}
                  onChange={(e) => setNewSocLabel(e.target.value)}
                  placeholder="الاسم (مثال: جروب التليجرام / قناة اليوتيوب)"
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
                <input
                  type="url"
                  value={newSocUrl}
                  onChange={(e) => setNewSocUrl(e.target.value)}
                  placeholder="الرابط (https://...)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSocLabel.trim() || !newSocUrl.trim()) return;
                    setDraftSettings({
                      ...draftSettings,
                      socialLinks: [
                        ...(draftSettings.socialLinks || []),
                        {
                          id: `soc_${Date.now()}`,
                          label: newSocLabel.trim(),
                          url: newSocUrl.trim()
                        }
                      ]
                    });
                    setNewSocLabel('');
                    setNewSocUrl('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black cursor-pointer"
                >
                  + إضافة رابط
                </button>
              </div>

              <div className="space-y-2">
                {(draftSettings.socialLinks || []).map((soc) => (
                  <div
                    key={soc.id}
                    className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <SocialBrandIcon url={soc.url} label={soc.label} className="w-4 h-4" />
                      <span className="text-xs font-black">{soc.label}</span>
                      <span className="text-[11px] text-slate-400">{soc.url}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftSettings({
                          ...draftSettings,
                          socialLinks: draftSettings.socialLinks.filter((s) => s.id !== soc.id)
                        })
                      }
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"
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
                onClick={onScanRecover}
                className="py-4 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>فحص واسترجاع من السحابة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const blob = new Blob(
                    [JSON.stringify({ settings: draftSettings, notebooks, coupons }, null, 2)],
                    { type: 'application/json' }
                  );
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

              <label className="py-4 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>استعادة نسخة</span>
                <input
                  type="file"
                  accept=".json"
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

/* ============================================================================
   14. ROOT DEFAULT EXPORT
============================================================================ */
export default function App() {
  return (
    <ErrorBoundary>
      <MuzakkiratiApp />
    </ErrorBoundary>
  );
}
