import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Search, ShoppingCart, CheckCircle2, ShieldCheck,
  MessageCircle, Phone, Sparkles, ArrowLeft, ArrowRight, X, Plus, Trash2,
  Edit3, Lock, LogOut, Eye, EyeOff, Maximize2, Minimize2, FileText,
  Tag, Clock, PackageCheck, RefreshCw, AlertTriangle, HelpCircle,
  ExternalLink, Download, Upload, Settings, Layers, Percent, Check,
  ChevronLeft, ChevronRight, Home, Folder, FolderOpen, ArrowUp, ArrowDown,
  ShoppingBag, Ticket, Image as ImageIcon, Sliders
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  collection
} from 'firebase/firestore';

// ============================================================================
// 1. تهيئة Firebase ببيانات مشروعك الحقيقية (el3bakera-edu)
// ============================================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_du5VY8nJGDJ169Fof9EAlI9x2W2d-14",
  authDomain: "el3bakera-edu.firebaseapp.com",
  projectId: "el3bakera-edu",
  storageBucket: "el3bakera-edu.firebasestorage.app",
  messagingSenderId: "74663879858",
  appId: "1:74663879858:web:4327c0ea1b825dd6c615ab"
};

const APP_ID = 'el3bakera-edu';

let app = null;
let auth = null;
let db = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  console.error('Firebase Init Error:', err);
}

const publicCol = (colName) => collection(db, 'artifacts', APP_ID, 'public', 'data', colName);
const publicDoc = (colName, docId) => doc(db, 'artifacts', APP_ID, 'public', 'data', colName, docId);

// ============================================================================
// 2. دوال مساعدة (ضغط الصور، التطبيع، توليد الأكواد)
// ============================================================================
const compressImageFile = (file, maxWidth = 1100, quality = 0.82) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
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
  });

const ensureString = (val) => {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') return val.name || val.title || val.label || '';
  return '';
};

const ensureStringArray = (arr, fallback) => {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  const cleaned = arr.map(ensureString).filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
};

const DEFAULT_STAGE_GRADES = {
  'المرحلة الابتدائية': ['الصف الرابع الابتدائي', 'الصف الخامس الابتدائي', 'الصف السادس الابتدائي'],
  'المرحلة الإعدادية': ['الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي'],
  'المرحلة الثانوية': ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي']
};

const DEFAULT_ORDER_FIELDS = [
  { id: 'teacherName', label: 'اسم المعلم كما سيُكتب على المذكرة', placeholder: 'مثال: أ/ محمود شحاتة', type: 'text', options: [], required: true, visible: true, locked: false },
  { id: 'phone', label: 'رقم الهاتف / الواتساب للتواصل والتسليم', placeholder: '010xxxxxxxx', type: 'tel', options: [], required: true, visible: true, locked: false },
  { id: 'subject', label: 'المادة الدراسية', placeholder: 'مثال: اللغة العربية', type: 'text', options: [], required: false, visible: true, locked: false },
  { id: 'governorate', label: 'المحافظة (اختياري)', placeholder: 'مثال: الغربية / القاهرة', type: 'text', options: [], required: false, visible: true, locked: false },
  { id: 'coverPhone', label: 'رقم الهاتف الذي يُطبع على الغلاف (إن اختلف)', placeholder: '010xxxxxxxx', type: 'tel', options: [], required: false, visible: true, locked: false },
  { id: 'logoFile', label: 'رفع شعار المعلم (Logo) لإضافته للمذكرة', placeholder: '', type: 'file', options: [], required: false, visible: true, locked: false },
  { id: 'notes', label: 'ملاحظات إضافية للتصميم أو الألوان', placeholder: 'أي تفاصيل إضافية تود إضافتها...', type: 'textarea', options: [], required: false, visible: true, locked: false }
];

const DEFAULT_SETTINGS = {
  platformName: 'منصة العباقرة للمذكرات التعليمية',
  platformTagline: 'مذكرات دراسية احترافية مخصصة باسمك وبياناتك الخاصة',
  logoUrl: '',
  logoSize: 56,
  heroBgImage: '',
  heroBgOpacity: 45,
  heroOverlayColor: '#020617',
  heroOverlayOpacity: 75,
  heroBgFit: 'cover',
  heroHeight: 540,
  heroBadge: 'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle: 'نوفر للمعلمين مذكرات دراسية منسقة ومحدثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة اسم المعلم، رقم الهاتف، والشعار الخاص به على الغلاف وجميع الصفحات.',
  trustCardTitle: 'لماذا يثق بنا المعلمون؟',
  trustPoints: [
    'محتوى علمي منقح ومطابق لأحدث مواصفات الوزارة',
    'وضع اسم المعلم ورقم الهاتف والشعار على جميع الصفحات',
    'معاينة حقيقية لصفحات المذكرة قبل تأكيد الطلب',
    'تسليم سريع بصيغة PDF عالية الدقة جاهزة للطباعة'
  ],
  emptyStateTitle: 'جاري تجهيز أحدث المذكرات لهذا القسم قريبًا!',
  emptyStateSubtitle: 'نعمل حاليًا على تنسيق ومراجعة مذكرات هذا القسم بأعلى جودة. يمكنك حجز مذكرتك مسبقًا أو التواصل معنا.',
  emptyStateCtaText: 'اطلب تجهيز مذكرتك الآن',
  emptyStateImage: '',
  whatsappNumber: '201068481536',
  paymentInstructions: 'فودافون كاش / إنستاباي: 01068481536',
  promoBannerActive: true,
  promoBannerText: '🎉 عرض خاص للمعلمين: خصم 15% على جميع مذكرات الترم الأول + إضافة الشعار مجانًا لفترة محدودة!',
  nextOrderRewardEnabled: true,
  nextOrderDiscountPercent: 15,
  categories: ['مذكرات الترم الأول', 'مذكرات الترم الثاني', 'كورسات التأسيس'],
  categoryImages: {},
  stages: ['المرحلة الابتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية'],
  stageGrades: DEFAULT_STAGE_GRADES,
  subjects: ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية'],
  orderModalTitle: 'إتمام طلب التخصيص',
  orderModalSubtitle: 'يمكنك طلب مذكرة واحدة أو إضافة أكثر من مذكرة معًا',
  orderSubmitButtonText: 'تأكيد وإرسال الطلب الآن',
  orderSuccessTitle: 'تم استلام طلبك بنجاح!',
  orderAllowMultiSelect: true,
  orderShowCouponBox: true,
  orderFormFields: DEFAULT_ORDER_FIELDS,
  socialLinks: [
    { id: 'fb-1', label: 'صفحة الفيسبوك', url: 'https://www.facebook.com', color: '#1877F2' },
    { id: 'wa-1', label: 'جروب الواتساب', url: 'https://wa.me/201068481536', color: '#25D366' }
  ]
};

const normalizeSettings = (raw) => {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const merged = { ...DEFAULT_SETTINGS, ...raw };
  merged.logoUrl = raw.logoUrl || raw.brandLogo || raw.logoData || '';
  merged.heroBgImage = raw.heroBgImage || raw.heroBgUrl || raw.heroBg || '';
  merged.categories = ensureStringArray(raw.categories, DEFAULT_SETTINGS.categories);
  merged.categoryImages = raw.categoryImages && typeof raw.categoryImages === 'object' ? { ...raw.categoryImages } : {};
  merged.stages = ensureStringArray(raw.stages, DEFAULT_SETTINGS.stages);
  merged.subjects = ensureStringArray(raw.subjects, DEFAULT_SETTINGS.subjects);
  merged.trustPoints = ensureStringArray(raw.trustPoints, DEFAULT_SETTINGS.trustPoints);

  const normalizedStageGrades = {};
  merged.stages.forEach((st) => {
    const existing = raw.stageGrades?.[st];
    normalizedStageGrades[st] = ensureStringArray(
      existing,
      DEFAULT_STAGE_GRADES[st] || ['الصف الأول', 'الصف الثاني', 'الصف الثالث']
    );
  });
  merged.stageGrades = normalizedStageGrades;

  merged.orderFormFields = Array.isArray(raw.orderFormFields) && raw.orderFormFields.length > 0
    ? raw.orderFormFields
    : DEFAULT_ORDER_FIELDS;

  merged.socialLinks = Array.isArray(raw.socialLinks)
    ? raw.socialLinks.filter((s) => s && typeof s === 'object' && s.label)
    : DEFAULT_SETTINGS.socialLinks;

  return merged;
};

const normalizeNotebook = (raw, idFallback) => {
  const nb = raw && typeof raw === 'object' ? raw : {};
  return {
    id: nb.id || idFallback || `nb_${Date.now()}`,
    title: ensureString(nb.title) || 'مذكرة تعليمية',
    category: ensureString(nb.category) || 'مذكرات الترم الأول',
    stage: ensureString(nb.stage) || 'المرحلة الإعدادية',
    grade: ensureString(nb.grade) || 'الصف الأول الإعدادي',
    subject: ensureString(nb.subject) || 'اللغة العربية',
    price: Number(nb.price) || 100,
    oldPrice: Number(nb.oldPrice) || 0,
    pagesCount: Number(nb.pagesCount) || 0,
    badge: ensureString(nb.badge) || '',
    description: ensureString(nb.description) || '',
    coverImage: nb.coverImage || '',
    sampleCount: Number(nb.sampleCount) || (Array.isArray(nb.samples) ? nb.samples.length : 0),
    drivePreviewUrl: ensureString(nb.drivePreviewUrl) || '',
    comingSoon: Boolean(nb.comingSoon),
    isHidden: Boolean(nb.isHidden),
    createdAt: nb.createdAt || Date.now()
  };
};

// ============================================================================
// 3. مكون أيقونات التواصل الاجتماعي الرسمية
// ============================================================================
const SocialBrandIcon = ({ url = '', label = '', size = 20 }) => {
  const text = `${url} ${label}`.toLowerCase();
  if (text.includes('facebook') || text.includes('فيسبوك') || text.includes('fb.')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
      </svg>
    );
  }
  if (text.includes('whatsapp') || text.includes('wa.me') || text.includes('واتس')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.01-2.42.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2.01.89 2.15.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.29.15.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.49.22.56.34.07.12.07.7-.17 1.38z" />
      </svg>
    );
  }
  if (text.includes('t.me') || text.includes('telegram') || text.includes('تليجرام') || text.includes('تيليجرام')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
      </svg>
    );
  }
  if (text.includes('youtube') || text.includes('youtu.be') || text.includes('يوتيوب')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (text.includes('instagram') || text.includes('انستجرام') || text.includes('إنستجرام')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25zM12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
      </svg>
    );
  }
  if (text.includes('tiktok') || text.includes('تيك توك')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    );
  }
  return <ExternalLink size={size} />;
};

// ============================================================================
// 4. حاجز حماية الواجهة (ErrorBoundary)
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-900">حدث خطأ مؤقت في عرض الصفحة</h2>
            <p className="text-xs text-slate-500 break-words">{this.state.errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
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
// 5. نافذة المعاينة المحمية (HD + التمرير السلس على الهاتف + ملء الشاشة)
// ============================================================================
const ProtectedPreviewModal = ({ notebook, settings, onClose, onAddToCart, onOrderNow }) => {
  const [samples, setSamples] = useState([]);
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const touchStartX = useRef(0);

  useEffect(() => {
    let active = true;
    const fetchSamples = async () => {
      setLoadingSamples(true);
      const list = [];
      if (notebook.coverImage) list.push(notebook.coverImage);
      try {
        if (db && notebook.id) {
          const snap = await getDocs(publicCol('notebook_samples'));
          const docs = [];
          snap.forEach((d) => {
            const data = d.data();
            if (data?.notebookId === notebook.id && data?.imageData) {
              docs.push({ index: Number(data.index) || 0, imageData: data.imageData });
            }
          });
          docs.sort((a, b) => a.index - b.index);
          docs.forEach((item) => list.push(item.imageData));
        }
      } catch (e) {
        console.warn('Could not fetch HD samples:', e);
      }
      if (active) {
        setSamples(list);
        setActiveIdx(0);
        setLoadingSamples(false);
      }
    };
    fetchSamples();
    return () => { active = false; };
  }, [notebook]);

  const nextSlide = () => {
    if (samples.length <= 1) return;
    setActiveIdx((prev) => (prev + 1) % samples.length);
  };

  const prevSlide = () => {
    if (samples.length <= 1) return;
    setActiveIdx((prev) => (prev - 1 + samples.length) % samples.length);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches.length === 1 && samples.length > 1) {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(dx) > 55) {
        if (dx > 0) prevSlide();
        else nextSlide();
      }
    }
  };

  const currentImg = samples[activeIdx] || notebook.coverImage;

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col justify-between select-none"
        dir="rtl"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFullScreen(false)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
              title="تصغير"
            >
              <Minimize2 size={20} />
            </button>
            <div>
              <h4 className="font-bold text-sm sm:text-base">{notebook.title}</h4>
              <p className="text-xs text-slate-400">
                صفحة {activeIdx + 1} من {Math.max(1, samples.length)} • يمكنك التكبير بالأصابع
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="relative flex-1 flex items-center justify-center overflow-auto p-2"
          style={{ touchAction: 'pinch-zoom pan-x pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {currentImg ? (
            <div className="relative max-w-4xl w-full flex items-center justify-center">
              <img
                src={currentImg}
                alt={notebook.title}
                draggable={false}
                className="max-h-[82vh] w-auto max-w-full object-contain rounded-xl shadow-2xl pointer-events-none"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <span className="text-white/20 font-black text-xl sm:text-3xl -rotate-24 whitespace-nowrap">
                  {settings.platformName} • نسخة معاينة محمية
                </span>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-center">لا توجد صورة متاحة</div>
          )}

          {samples.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="fixed right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 border border-slate-700 text-white flex items-center justify-center shadow-lg"
              >
                <ChevronRight size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="fixed left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 border border-slate-700 text-white flex items-center justify-center shadow-lg"
              >
                <ChevronLeft size={24} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      dir="rtl"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 my-auto max-h-[94vh] flex flex-col">
        {/* رأس النافذة */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-200/80 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-slate-700 transition"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => setFullScreen(true)}
              className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition"
              title="ملء الشاشة والتكبير"
            >
              <Maximize2 size={17} />
            </button>
          </div>
          <div className="text-left">
            <h3 className="font-black text-slate-900 text-sm sm:text-lg line-clamp-1">{notebook.title}</h3>
            <p className="text-xs text-slate-500">
              {notebook.grade} • {notebook.subject} {notebook.pagesCount ? `• ${notebook.pagesCount} صفحة` : ''}
            </p>
          </div>
        </div>

        {/* جسم النافذة القابل للتمرير بسلاسة على الهاتف */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          <div
            className="relative bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center min-h-[240px]"
            style={{ touchAction: 'pan-y pinch-zoom' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => setFullScreen(true)}
          >
            {loadingSamples ? (
              <div className="py-16 text-center space-y-2">
                <RefreshCw className="animate-spin text-blue-600 mx-auto" size={28} />
                <p className="text-xs font-bold text-slate-500">جاري تحميل صفحات العينة عالية الدقة...</p>
              </div>
            ) : currentImg ? (
              <div className="relative w-full flex items-center justify-center cursor-zoom-in">
                <img
                  src={currentImg}
                  alt={notebook.title}
                  draggable={false}
                  className="max-h-[48vh] w-auto max-w-full object-contain select-none pointer-events-none"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <span className="text-slate-900/15 font-black text-base sm:text-2xl -rotate-24 whitespace-nowrap">
                    {settings.platformName} • نسخة معاينة
                  </span>
                </div>
                <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-900/75 text-white text-[11px] font-bold flex items-center gap-1">
                  <Maximize2 size={12} /> اضغط للتكبير ملء الشاشة
                </span>
              </div>
            ) : (
              <div className="py-14 text-slate-400 text-sm">لا توجد صور عينة مرفقة بعد</div>
            )}

            {samples.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center shadow-md"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center shadow-md"
                >
                  <ChevronLeft size={20} />
                </button>
              </>
            )}
          </div>

          {samples.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {samples.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === activeIdx ? 'w-7 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-slate-500 mr-2">
                ({activeIdx + 1} / {samples.length})
              </span>
            </div>
          )}

          {notebook.description && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm mb-1.5">تفاصيل ومحتوى المذكرة:</h4>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{notebook.description}</p>
            </div>
          )}

          {notebook.drivePreviewUrl && (
            <a
              href={notebook.drivePreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-sm transition"
            >
              <ExternalLink size={17} />
              <span>مطالعة نسخة العينة الكاملة على Google Drive</span>
            </a>
          )}
        </div>

        {/* شريط السعر والأزرار السفلي */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-600">{notebook.price} ج.م</span>
              {notebook.oldPrice > notebook.price && (
                <span className="text-sm text-slate-400 line-through">{notebook.oldPrice} ج.م</span>
              )}
            </div>
            <span className="text-[11px] text-slate-500">شامل التخصيص باسمك ورقم هاتفك وشعارك</span>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <button
              onClick={() => onAddToCart(notebook)}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center gap-1.5 transition"
            >
              <ShoppingBag size={17} />
              <span>أضف للسلة</span>
            </button>
            <button
              onClick={() => onOrderNow(notebook)}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition"
            >
              <span>اطلب باسمك الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 6. نافذة الطلب والسلة المتعددة + الكوبونات الشخصية + حقول العميل المخصصة
// ============================================================================
const OrderCartModal = ({
  cart,
  setCart,
  notebooks,
  settings,
  coupons,
  onClose,
  onSubmitOrder,
  notify
}) => {
  const [formValues, setFormValues] = useState({
    teacherName: '',
    phone: '',
    subject: '',
    governorate: '',
    coverPhone: '',
    notes: ''
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showAddMore, setShowAddMore] = useState(false);

  const visibleNotebooks = notebooks.filter((n) => !n.isHidden);
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const discountAmount = appliedCoupon
    ? Math.round((subtotal * (Number(appliedCoupon.discountPercent) || 0)) / 100)
    : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = coupons.find((c) => c.code.toUpperCase() === code);
    if (!found) {
      notify('كود الخصم غير صحيح أو غير موجود', 'error');
      return;
    }
    if (!found.active) {
      notify('هذا الكوبون غير مفعل حاليًا', 'error');
      return;
    }
    if (found.singleUse && found.used) {
      notify('عذرًا، هذا الكوبون الشخصي تم استخدامه مسبقًا ولا يمكن استخدامه مرة أخرى', 'error');
      return;
    }
    setAppliedCoupon(found);
    notify(`تم تطبيق خصم ${found.discountPercent}% بنجاح!`, 'success');
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 600, 0.85);
      setLogoPreview(dataUrl);
      notify('تم إرفاق الشعار بنجاح', 'success');
    } catch {
      notify('تعذر قراءة ملف الشعار', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValues.teacherName.trim() || !formValues.phone.trim()) {
      notify('يرجى كتابة اسم المعلم ورقم الهاتف', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const orderResult = await onSubmitOrder({
        items: cart.length > 0 ? cart : [{ id: 'custom', title: 'طلب تجهيز مذكرة خاصة', price: 0 }],
        customer: { ...formValues, logoUrl: logoPreview },
        subtotal,
        discountAmount,
        finalTotal,
        appliedCouponCode: appliedCoupon?.code || ''
      });
      setCompletedOrder(orderResult);
    } catch (err) {
      notify('حدث خطأ أثناء تسجيل الطلب، حاول مرة أخرى', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    const itemsText = completedOrder.items.map((i, idx) => `${idx + 1}- ${i.title} (${i.price} ج.م)`).join('\n');
    const waText = encodeURIComponent(
      `مرحبًا، قمت بتسجيل طلب جديد على *${settings.platformName}*\n` +
      `رقم الطلب: *${completedOrder.orderNumber}*\n` +
      `الاسم: ${completedOrder.customer.teacherName}\n` +
      `الهاتف: ${completedOrder.customer.phone}\n` +
      `المذكرات المطلوبة:\n${itemsText}\n` +
      `الإجمالي النهائي: *${completedOrder.finalTotal} ج.م*`
    );

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 text-center space-y-5 border border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900">{settings.orderSuccessTitle || 'تم استلام طلبك بنجاح!'}</h3>
            <p className="text-sm text-slate-500">احتفظ برقم الطلب لمتابعة حالة التجهيز في أي وقت</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="text-xs text-slate-500">رقم متابعة الطلب</div>
            <div className="text-2xl font-black text-blue-600 tracking-wider">{completedOrder.orderNumber}</div>
            <div className="text-xs text-slate-600 pt-1">
              بيانات التحويل: <span className="font-bold">{settings.paymentInstructions}</span>
            </div>
          </div>

          {completedOrder.rewardCoupon && (
            <div className="bg-gradient-to-l from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200 space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-amber-800 font-black text-sm">
                <Ticket size={18} />
                <span>هدية طلبك القادم (خصم {completedOrder.rewardCoupon.discountPercent}%)</span>
              </div>
              <p className="text-xs text-amber-700">
                هذا الكود مخصص لك وحدك ويُستخدم لمرة واحدة في طلبك التالي:
              </p>
              <div className="inline-block px-4 py-1.5 rounded-xl bg-white border border-amber-300 font-black text-base text-amber-900 tracking-widest">
                {completedOrder.rewardCoupon.code}
              </div>
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            <a
              href={`https://wa.me/${settings.whatsappNumber}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <MessageCircle size={19} />
              <span>إرسال تفاصيل الطلب مباشرة عبر واتساب</span>
            </a>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
            >
              إغلاق والعودة للمنصة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 my-auto max-h-[94vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">{settings.orderModalTitle || 'إتمام طلب التخصيص'}</h3>
              <p className="text-xs text-slate-500">{settings.orderModalSubtitle || 'يمكنك طلب مذكرة واحدة أو إضافة أكثر من مذكرة معًا'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/80 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {/* سلة المذكرات المختارة */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                <ShoppingBag size={16} className="text-blue-600" />
                <span>المذكرات في طلبك ({cart.length})</span>
              </span>
              {settings.orderAllowMultiSelect !== false && (
                <button
                  type="button"
                  onClick={() => setShowAddMore(!showAddMore)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl"
                >
                  <Plus size={14} />
                  <span>{showAddMore ? 'إخفاء القائمة' : 'إضافة مذكرة أخرى للطلب'}</span>
                </button>
              )}
            </div>

            {settings.orderAllowMultiSelect !== false && showAddMore && (
              <div className="bg-white rounded-xl p-3 border border-blue-100 max-h-44 overflow-y-auto space-y-1.5">
                {visibleNotebooks.map((nb) => {
                  const alreadyIn = cart.some((c) => c.id === nb.id);
                  return (
                    <div key={nb.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-800">{nb.title}</span>
                        <span className="text-slate-400 mr-2">({nb.grade} • {nb.price} ج.م)</span>
                      </div>
                      <button
                        type="button"
                        disabled={alreadyIn}
                        onClick={() => setCart([...cart, nb])}
                        className={`px-2.5 py-1 rounded-lg font-bold ${
                          alreadyIn
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {alreadyIn ? 'مضافة ✓' : '+ إضافة'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {cart.length === 0 ? (
              <div className="text-xs text-slate-500 bg-white rounded-xl p-3 border border-dashed border-slate-200 text-center">
                طلب تجهيز مذكرة خاصة مخصصة حسب بياناتك (سيتم تحديد السعر بعد المراجعة)
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                      <div className="text-[11px] text-slate-400">{item.grade} • {item.subject}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-blue-600 text-sm">{item.price} ج.م</span>
                      <button
                        type="button"
                        onClick={() => setCart(cart.filter((c) => c.id !== item.id))}
                        className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg"
                        title="إزالة من السلة"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* كوبون الخصم */}
            {cart.length > 0 && settings.orderShowCouponBox !== false && (
              <div className="pt-2 border-t border-slate-200/70 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="لديك كود خصم؟ اكتبه هنا..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                  >
                    تطبيق الكود
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl border border-emerald-200">
                    <span>تم تطبيق الكوبون <b>{appliedCoupon.code}</b> (خصم {appliedCoupon.discountPercent}%)</span>
                    <button type="button" onClick={() => setAppliedCoupon(null)} className="text-rose-600 font-bold">إلغاء</button>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="font-bold text-slate-600">الإجمالي المطلوب:</span>
                  <div className="text-left">
                    {discountAmount > 0 && (
                      <span className="text-xs text-slate-400 line-through ml-2">{subtotal} ج.م</span>
                    )}
                    <span className="text-xl font-black text-blue-600">{finalTotal} ج.م</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* حقول بيانات العميل المخصصة من لوحة التحكم */}
          <div className="space-y-3.5">
            <h4 className="font-black text-slate-800 text-sm">بيانات المعلم للطباعة على المذكرة:</h4>
            {settings.orderFormFields
              .filter((f) => f.visible !== false)
              .map((field) => {
                if (field.type === 'file') {
                  return (
                    <div key={field.id} className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="text-xs text-slate-600 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {logoPreview && (
                          <img src={logoPreview} alt="Logo" className="w-10 h-10 rounded-lg object-contain border border-slate-200" />
                        )}
                      </div>
                    </div>
                  );
                }
                if (field.type === 'textarea') {
                  return (
                    <div key={field.id} className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <textarea
                        rows={2}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={formValues[field.id] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                }
                if (field.type === 'select') {
                  return (
                    <div key={field.id} className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <select
                        required={field.required}
                        value={formValues[field.id] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="">{field.placeholder || 'اختر من القائمة...'}</option>
                        {(field.options || []).map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type={field.type || 'text'}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formValues[field.id] || ''}
                      onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                );
              })}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black text-base shadow-lg shadow-blue-600/20 transition"
          >
            {submitting ? 'جاري تسجيل الطلب...' : (settings.orderSubmitButtonText || 'تأكيد وإرسال الطلب الآن')}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 7. نافذة التواصل الاجتماعي المنبثقة (Social Hub Modal)
// ============================================================================
const SocialHubModal = ({ settings, onClose }) => (
  <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl" onClick={onClose}>
    <div
      className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-100"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">تواصل معنا مباشرة</h3>
          <p className="text-xs text-slate-500">اختر وسيلة التواصل المناسبة لك</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-2.5">
        <a
          href={`https://wa.me/${settings.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <SocialBrandIcon url="whatsapp" size={20} />
            </div>
            <div>
              <div className="font-black text-sm">مراسلة مباشرة عبر واتساب</div>
              <div className="text-xs text-emerald-700" dir="ltr">+{settings.whatsappNumber}</div>
            </div>
          </div>
          <ExternalLink size={16} className="text-emerald-700" />
        </a>

        {settings.socialLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0"
                style={{ backgroundColor: link.color || '#2563EB' }}
              >
                <SocialBrandIcon url={link.url} label={link.label} size={20} />
              </div>
              <div className="font-bold text-sm">{link.label}</div>
            </div>
            <ExternalLink size={16} className="text-slate-400" />
          </a>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================================
// 8. صفحة تصفح المذكرات بنظام المجلدات المتدرّج (القسم -> المرحلة -> الصف)
// ============================================================================
const CatalogPage = ({
  notebooks,
  settings,
  initialCategory = '',
  onPreview,
  onAddToCart,
  onOrderNow,
  onNavigate
}) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSelectedCategory(initialCategory || '');
    setSelectedStage('');
    setSelectedGrade('');
  }, [initialCategory]);

  const visibleNotebooks = notebooks.filter((n) => !n.isHidden);
  const isSearching = searchQuery.trim().length > 0 || selectedSubject !== '';

  const filteredNotebooks = visibleNotebooks.filter((nb) => {
    if (selectedCategory && nb.category !== selectedCategory) return false;
    if (selectedStage && nb.stage !== selectedStage) return false;
    if (selectedGrade && nb.grade !== selectedGrade) return false;
    if (selectedSubject && nb.subject !== selectedSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        nb.title.toLowerCase().includes(q) ||
        nb.grade.toLowerCase().includes(q) ||
        nb.subject.toLowerCase().includes(q) ||
        nb.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleBackStep = () => {
    if (selectedGrade) setSelectedGrade('');
    else if (selectedStage) setSelectedStage('');
    else if (selectedCategory) setSelectedCategory('');
    else onNavigate('home');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6" dir="rtl">
      {/* شريط البحث السريع وتصفية المادة */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المذكرة، المادة، أو الصف الدراسي..."
            className="w-full pr-11 pl-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500"
        >
          <option value="">كل المواد الدراسية</option>
          {settings.subjects.map((sub) => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      </div>

      {/* مسار التنقل العلوي (Breadcrumbs) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold flex-wrap">
          <button
            onClick={() => { setSelectedCategory(''); setSelectedStage(''); setSelectedGrade(''); }}
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <Home size={15} />
            <span>الأقسام الرئيسية</span>
          </button>
          {selectedCategory && (
            <>
              <ChevronLeft size={15} className="text-slate-400" />
              <button
                onClick={() => { setSelectedStage(''); setSelectedGrade(''); }}
                className={selectedStage ? 'text-blue-600 hover:underline' : 'text-slate-900'}
              >
                {selectedCategory}
              </button>
            </>
          )}
          {selectedStage && (
            <>
              <ChevronLeft size={15} className="text-slate-400" />
              <button
                onClick={() => setSelectedGrade('')}
                className={selectedGrade ? 'text-blue-600 hover:underline' : 'text-slate-900'}
              >
                {selectedStage}
              </button>
            </>
          )}
          {selectedGrade && (
            <>
              <ChevronLeft size={15} className="text-slate-400" />
              <span className="text-slate-900">{selectedGrade}</span>
            </>
          )}
        </div>

        {(selectedCategory || selectedStage || selectedGrade) && (
          <button
            onClick={handleBackStep}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <ArrowRight size={14} />
            <span>رجوع خطوة</span>
          </button>
        )}
      </div>

      {/* العرض المتدرّج للمجلدات (عند عدم البحث المباشر) */}
      {!isSearching && !selectedCategory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {settings.categories.map((cat) => {
            const count = visibleNotebooks.filter((n) => n.category === cat).length;
            const catImg = settings.categoryImages?.[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition text-right flex flex-col"
              >
                {catImg && (
                  <div className="h-36 w-full overflow-hidden bg-slate-900 relative">
                    <img src={catImg} alt={cat} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                  </div>
                )}
                <div className="p-6 flex items-center justify-between w-full">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition">
                      <Folder size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg">{cat}</h3>
                      <p className="text-xs text-slate-500">{count} مذكرة متاحة</p>
                    </div>
                  </div>
                  <ChevronLeft className="text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition" size={20} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!isSearching && selectedCategory && !selectedStage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {settings.stages.map((st) => {
            const count = visibleNotebooks.filter((n) => n.category === selectedCategory && n.stage === st).length;
            return (
              <button
                key={st}
                onClick={() => setSelectedStage(st)}
                className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition flex items-center justify-between text-right"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition">
                    <FolderOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">{st}</h3>
                    <p className="text-xs text-slate-500">{count} مذكرة في هذه المرحلة</p>
                  </div>
                </div>
                <ChevronLeft className="text-slate-400 group-hover:text-indigo-600 transition" size={20} />
              </button>
            );
          })}
        </div>
      )}

      {!isSearching && selectedCategory && selectedStage && !selectedGrade && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(settings.stageGrades?.[selectedStage] || []).map((gr) => {
            const count = visibleNotebooks.filter(
              (n) => n.category === selectedCategory && n.stage === selectedStage && n.grade === gr
            ).length;
            return (
              <button
                key={gr}
                onClick={() => setSelectedGrade(gr)}
                className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition flex items-center justify-between text-right"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">{gr}</h3>
                    <p className="text-xs text-slate-500">{count} مذكرة متاحة</p>
                  </div>
                </div>
                <ChevronLeft className="text-slate-400 group-hover:text-emerald-600 transition" size={20} />
              </button>
            );
          })}
        </div>
      )}

      {/* عرض المذكرات داخل الصف أو عند البحث */}
      {(isSearching || (selectedCategory && selectedStage && selectedGrade)) && (
        <>
          {filteredNotebooks.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 text-center max-w-2xl mx-auto space-y-4">
              {settings.emptyStateImage && (
                <img
                  src={settings.emptyStateImage}
                  alt="قريبًا"
                  className="max-h-52 mx-auto rounded-2xl object-contain"
                />
              )}
              <h3 className="text-xl font-black text-slate-900">{settings.emptyStateTitle}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{settings.emptyStateSubtitle}</p>
              <button
                onClick={() => onOrderNow(null)}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/20 transition"
              >
                {settings.emptyStateCtaText}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotebooks.map((nb) => (
                <div
                  key={nb.id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition overflow-hidden flex flex-col"
                >
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    {nb.coverImage ? (
                      <img src={nb.coverImage} alt={nb.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <BookOpen size={44} />
                      </div>
                    )}
                    {nb.badge && (
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-black shadow">
                        {nb.badge}
                      </span>
                    )}
                    {nb.comingSoon && (
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow">
                        قريبًا • حجز مسبق
                      </span>
                    )}
                    {nb.pagesCount > 0 && (
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-xs font-bold">
                        {nb.pagesCount} صفحة
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-slate-400">{nb.category} • {nb.grade}</div>
                      <h3 className="font-black text-slate-900 text-lg leading-snug">{nb.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{nb.description}</p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-blue-600">{nb.price} ج.م</span>
                          {nb.oldPrice > nb.price && (
                            <span className="text-xs text-slate-400 line-through">{nb.oldPrice} ج.م</span>
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                          {nb.subject}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => onPreview(nb)}
                          className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition"
                        >
                          <Eye size={15} />
                          <span>معاينة</span>
                        </button>
                        <button
                          onClick={() => onAddToCart(nb)}
                          className="py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1 transition"
                        >
                          <ShoppingBag size={15} />
                          <span>للسلة</span>
                        </button>
                        <button
                          onClick={() => onOrderNow(nb)}
                          className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1 transition"
                        >
                          <span>اطلب الآن</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// 9. لوحة تحكم المدير الشاملة (Muzakkirati Admin Dashboard)
// ============================================================================
const AdminPortal = ({
  user,
  notebooks,
  orders,
  coupons,
  settings,
  onSaveSettings,
  onAddNotebook,
  onUpdateNotebook,
  onDeleteNotebook,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSaveCoupon,
  onDeleteCoupon,
  onClosePortal,
  onLogout,
  notify
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('notebooks');
  const [localSettings, setLocalSettings] = useState(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  // نموذج إضافة/تعديل مذكرة
  const [editingNbId, setEditingNbId] = useState(null);
  const [nbForm, setNbForm] = useState({
    title: '',
    category: settings.categories[0] || 'مذكرات الترم الأول',
    stage: settings.stages[0] || 'المرحلة الإعدادية',
    grade: (settings.stageGrades?.[settings.stages[0]] || ['الصف الأول الإعدادي'])[0],
    subject: settings.subjects[0] || 'اللغة العربية',
    price: 120,
    oldPrice: 160,
    pagesCount: 60,
    badge: '',
    description: '',
    drivePreviewUrl: '',
    comingSoon: false
  });
  const [coverFile, setCoverFile] = useState(null);
  const [sampleFiles, setSampleFiles] = useState([]);
  const [savingNb, setSavingNb] = useState(false);

  // تبويب المراحل والأقسام
  const [selectedManageStage, setSelectedManageStage] = useState(settings.stages[0] || 'المرحلة الإعدادية');
  const [newItemTexts, setNewItemTexts] = useState({ category: '', stage: '', grade: '', subject: '' });

  // تبويب الكوبونات
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(15);
  const [newCouponSingleUse, setNewCouponSingleUse] = useState(false);

  // تبويب حقول طلب العميل
  const [newOrderFieldLabel, setNewOrderFieldLabel] = useState('');
  const [newOrderFieldPlaceholder, setNewOrderFieldPlaceholder] = useState('');
  const [newOrderFieldType, setNewOrderFieldType] = useState('text');
  const [newOrderFieldOptions, setNewOrderFieldOptions] = useState('');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!auth) {
      notify('خدمة المصادقة غير مهيأة', 'error');
      return;
    }
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      notify('تم تسجيل الدخول إلى لوحة التحكم بنجاح!', 'success');
    } catch (err) {
      notify(`تعذر تسجيل الدخول: تأكد من البريد وكلمة المرور (${err.code || 'خطأ'})`, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      notify('اكتب بريدك الإلكتروني أولًا لإرسال رابط الاستعادة', 'error');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      notify('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني', 'success');
    } catch (err) {
      notify('تعذر إرسال رابط الاستعادة، تأكد من صحة البريد', 'error');
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">بوابة إدارة المنصة</h3>
                <p className="text-xs text-slate-500">تسجيل دخول المدير المعتمد</p>
              </div>
            </div>
            <button onClick={onClosePortal} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">البريد الإلكتروني للإدارة</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">كلمة المرور</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition"
            >
              {loginLoading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              className="w-full text-center text-xs font-bold text-blue-600 hover:underline"
            >
              نسيت كلمة المرور؟ إرسال رابط الاستعادة لبريدي
            </button>
          </form>
        </div>
      </div>
    );
  }

  // حفظ أو تعديل مذكرة
  const handleSaveNotebookSubmit = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim()) {
      notify('يرجى كتابة عنوان المذكرة', 'error');
      return;
    }
    setSavingNb(true);
    try {
      let coverImage = editingNbId
        ? (notebooks.find((n) => n.id === editingNbId)?.coverImage || '')
        : '';
      if (coverFile) {
        coverImage = await compressImageFile(coverFile, 1100, 0.82);
      }

      const compressedSamples = [];
      if (sampleFiles.length > 0) {
        for (let i = 0; i < Math.min(sampleFiles.length, 15); i++) {
          const hdUrl = await compressImageFile(sampleFiles[i], 1280, 0.85);
          compressedSamples.push(hdUrl);
        }
      }

      if (editingNbId) {
        await onUpdateNotebook(editingNbId, { ...nbForm, coverImage }, compressedSamples);
        notify('تم تحديث المذكرة ومزامنتها مع السحابة بنجاح!', 'success');
      } else {
        await onAddNotebook({ ...nbForm, coverImage }, compressedSamples);
        notify('تمت إضافة المذكرة وحفظها في السحابة بنجاح!', 'success');
      }

      setEditingNbId(null);
      setNbForm({
        title: '',
        category: localSettings.categories[0] || 'مذكرات الترم الأول',
        stage: localSettings.stages[0] || 'المرحلة الإعدادية',
        grade: (localSettings.stageGrades?.[localSettings.stages[0]] || ['الصف الأول الإعدادي'])[0],
        subject: localSettings.subjects[0] || 'اللغة العربية',
        price: 120,
        oldPrice: 160,
        pagesCount: 60,
        badge: '',
        description: '',
        drivePreviewUrl: '',
        comingSoon: false
      });
      setCoverFile(null);
      setSampleFiles([]);
    } catch (err) {
      console.error(err);
      notify(`تعذر حفظ المذكرة: ${err.message || 'تحقق من الاتصال'}`, 'error');
    } finally {
      setSavingNb(false);
    }
  };

  // دوال ترتيب وإضافة وحذف القوائم
  const moveArrayItem = (arr, index, dir) => {
    const next = [...arr];
    const target = index + dir;
    if (target < 0 || target >= next.length) return next;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  };

  const handleCategoryImageUpload = async (catName, file) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 900, 0.8);
      setLocalSettings((prev) => ({
        ...prev,
        categoryImages: { ...(prev.categoryImages || {}), [catName]: dataUrl }
      }));
      notify(`تم تجهيز صورة خلفية "${catName}" — اضغط حفظ الإعدادات لاعتمادها`, 'success');
    } catch {
      notify('تعذر معالجة الصورة', 'error');
    }
  };

  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings: localSettings,
      notebooks,
      coupons
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `el3bakera-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.settings) {
          const norm = normalizeSettings(parsed.settings);
          setLocalSettings(norm);
          await onSaveSettings(norm);
        }
        if (Array.isArray(parsed.notebooks)) {
          for (const nb of parsed.notebooks) {
            await onAddNotebook(nb, []);
          }
        }
        notify('تم استيراد النسخة الاحتياطية ومزامنتها بنجاح!', 'success');
      } catch {
        notify('ملف النسخة الاحتياطية غير صالح', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16" dir="rtl">
      {/* شريط الإدارة العلوي */}
      <div className="bg-slate-950 text-white px-4 sm:px-6 py-3.5 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base">لوحة تحكم {localSettings.platformName}</h2>
              <p className="text-[11px] text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClosePortal}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Eye size={15} />
              <span>معاينة الموقع</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <LogOut size={15} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* تبويبات الإدارة */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200/70">
          {[
            { id: 'notebooks', label: `المذكرات (${notebooks.length})`, icon: BookOpen },
            { id: 'orders', label: `الطلبات (${orders.length})`, icon: ShoppingCart },
            { id: 'taxonomy', label: 'الأقسام والمراحل والصفوف', icon: Layers },
            { id: 'coupons', label: 'العروض والكوبونات', icon: Percent },
            { id: 'settings', label: 'إعدادات الموقع والمظهر وطلب العميل', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. تبويب إدارة المذكرات */}
        {activeTab === 'notebooks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/70 h-fit">
              <h3 className="font-black text-slate-900 text-lg mb-4">
                {editingNbId ? 'تعديل بيانات المذكرة' : 'إضافة مذكرة جديدة'}
              </h3>
              <form onSubmit={handleSaveNotebookSubmit} className="space-y-3.5">
                <input
                  type="text"
                  required
                  placeholder="عنوان المذكرة..."
                  value={nbForm.title}
                  onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={nbForm.category}
                    onChange={(e) => setNbForm({ ...nbForm, category: e.target.value })}
                    className="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
                  >
                    {localSettings.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    value={nbForm.stage}
                    onChange={(e) => {
                      const st = e.target.value;
                      const firstGrade = (localSettings.stageGrades?.[st] || ['الصف الأول'])[0];
                      setNbForm({ ...nbForm, stage: st, grade: firstGrade });
                    }}
                    className="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
                  >
                    {localSettings.stages.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={nbForm.grade}
                    onChange={(e) => setNbForm({ ...nbForm, grade: e.target.value })}
                    className="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
                  >
                    {(localSettings.stageGrades?.[nbForm.stage] || []).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <select
                    value={nbForm.subject}
                    onChange={(e) => setNbForm({ ...nbForm, subject: e.target.value })}
                    className="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
                  >
                    {localSettings.subjects.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">السعر الحالي</label>
                    <input
                      type="number"
                      value={nbForm.price}
                      onChange={(e) => setNbForm({ ...nbForm, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">قبل الخصم</label>
                    <input
                      type="number"
                      value={nbForm.oldPrice}
                      onChange={(e) => setNbForm({ ...nbForm, oldPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">الصفحات</label>
                    <input
                      type="number"
                      value={nbForm.pagesCount}
                      onChange={(e) => setNbForm({ ...nbForm, pagesCount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="شارة التميز (مثال: الأكثر طلبًا)"
                  value={nbForm.badge}
                  onChange={(e) => setNbForm({ ...nbForm, badge: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
                />

                <textarea
                  rows={3}
                  placeholder="وصف المذكرة ومميزاتها..."
                  value={nbForm.description}
                  onChange={(e) => setNbForm({ ...nbForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
                />

                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nbForm.comingSoon}
                    onChange={(e) => setNbForm({ ...nbForm, comingSoon: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-xs font-bold text-amber-900">المذكرة لم تكتمل بعد (وضع إعلان «قريبًا / حجز مسبق»)</span>
                </label>

                <input
                  type="url"
                  placeholder="رابط Google Drive لمطالعة العينة (اختياري)"
                  value={nbForm.drivePreviewUrl}
                  onChange={(e) => setNbForm({ ...nbForm, drivePreviewUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs"
                  dir="ltr"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1">صورة غلاف المذكرة</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      className="text-[11px] w-full"
                    />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1">صور صفحات العينة (HD حتى 15 صفحة)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setSampleFiles(Array.from(e.target.files || []))}
                      className="text-[11px] w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingNb}
                    className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition"
                  >
                    {savingNb ? 'جاري الحفظ والمزامنة...' : editingNbId ? 'حفظ التعديلات' : '+ إضافة المذكرة'}
                  </button>
                  {editingNbId && (
                    <button
                      type="button"
                      onClick={() => setEditingNbId(null)}
                      className="px-4 py-3 rounded-2xl bg-slate-200 text-slate-700 font-bold text-sm"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* قائمة المذكرات */}
            <div className="lg:col-span-7 space-y-3">
              {notebooks.map((nb) => (
                <div
                  key={nb.id}
                  className={`bg-white rounded-2xl p-4 border shadow-sm flex flex-wrap items-center justify-between gap-3 ${
                    nb.isHidden ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {nb.coverImage ? (
                      <img src={nb.coverImage} alt={nb.title} className="w-14 h-16 rounded-xl object-cover border border-slate-200" />
                    ) : (
                      <div className="w-14 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <BookOpen size={20} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-sm">{nb.title}</h4>
                        {nb.isHidden && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">
                            مخفية عن الزوار
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {nb.category} • {nb.stage} • {nb.grade} • <span className="text-blue-600 font-bold">{nb.price} ج.م</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateNotebook(nb.id, { isHidden: !nb.isHidden }, [])}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                        nb.isHidden
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      title={nb.isHidden ? 'إظهار للزوار' : 'إخفاء مؤقت عن الزوار'}
                    >
                      {nb.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>{nb.isHidden ? 'إظهار' : 'إخفاء'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingNbId(nb.id);
                        setNbForm({
                          title: nb.title,
                          category: nb.category,
                          stage: nb.stage,
                          grade: nb.grade,
                          subject: nb.subject,
                          price: nb.price,
                          oldPrice: nb.oldPrice,
                          pagesCount: nb.pagesCount,
                          badge: nb.badge,
                          description: nb.description,
                          drivePreviewUrl: nb.drivePreviewUrl,
                          comingSoon: nb.comingSoon
                        });
                      }}
                      className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"
                      title="تعديل"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteNotebook(nb.id)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                      title="حذف نهائي"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. تبويب الطلبات */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center text-slate-500 font-bold">لا توجد طلبات مسجلة حتى الآن</div>
            ) : (
              orders.map((ord) => (
                <div key={ord.id} className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-black text-blue-600 text-base ml-3">{ord.orderNumber}</span>
                      <span className="font-bold text-slate-800 text-sm">{ord.customer?.teacherName}</span>
                      <span className="text-xs text-slate-500 mr-2">({ord.customer?.phone})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={ord.status}
                        onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                      >
                        <option value="قيد المراجعة">قيد المراجعة</option>
                        <option value="جاري التنفيذ والتصميم">جاري التنفيذ والتصميم</option>
                        <option value="جاهز للتسليم">جاهز للتسليم</option>
                        <option value="تم التسليم">تم التسليم</option>
                      </select>
                      <button onClick={() => onDeleteOrder(ord.id)} className="p-2 rounded-xl bg-rose-50 text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div><b>المذكرات:</b> {(ord.items || []).map((i) => i.title).join(' + ')}</div>
                    <div><b>الإجمالي:</b> {ord.finalTotal} ج.م {ord.appliedCouponCode ? `(كوبون: ${ord.appliedCouponCode})` : ''}</div>
                    {ord.customer?.notes && <div><b>ملاحظات:</b> {ord.customer.notes}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. تبويب الأقسام والمراحل والصفوف + صور خلفيات الأقسام */}
        {activeTab === 'taxonomy' && (
          <div className="space-y-6">
            {/* الأقسام الرئيسية + صور خلفياتها */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/70 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-lg">الأقسام الرئيسية وصور خلفياتها</h3>
                <button
                  onClick={() => onSaveSettings(localSettings)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  حفظ التغييرات
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="اسم قسم جديد (مثال: مراجعات ليلة الامتحان)..."
                  value={newItemTexts.category}
                  onChange={(e) => setNewItemTexts({ ...newItemTexts, category: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <button
                  onClick={() => {
                    const val = newItemTexts.category.trim();
                    if (!val || localSettings.categories.includes(val)) return;
                    setLocalSettings({ ...localSettings, categories: [...localSettings.categories, val] });
                    setNewItemTexts({ ...newItemTexts, category: '' });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  + إضافة قسم
                </button>
              </div>

              <div className="space-y-2.5">
                {localSettings.categories.map((cat, idx) => (
                  <div key={cat} className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setLocalSettings({ ...localSettings, categories: moveArrayItem(localSettings.categories, idx, -1) })}
                          className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => setLocalSettings({ ...localSettings, categories: moveArrayItem(localSettings.categories, idx, 1) })}
                          className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                      <span className="font-black text-slate-800 text-sm">{cat}</span>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {localSettings.categoryImages?.[cat] && (
                        <div className="relative">
                          <img
                            src={localSettings.categoryImages[cat]}
                            alt={cat}
                            className="w-16 h-11 rounded-lg object-cover border border-slate-300"
                          />
                          <button
                            onClick={() => {
                              const copy = { ...(localSettings.categoryImages || {}) };
                              delete copy[cat];
                              setLocalSettings({ ...localSettings, categoryImages: copy });
                            }}
                            className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]"
                            title="إزالة الصورة"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <label className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer flex items-center gap-1.5">
                        <ImageIcon size={14} />
                        <span>{localSettings.categoryImages?.[cat] ? 'تغيير صورة الخلفية' : 'وضع صورة خلفية'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleCategoryImageUpload(cat, e.target.files?.[0])}
                        />
                      </label>
                      <button
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            categories: localSettings.categories.filter((c) => c !== cat)
                          })
                        }
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* المراحل الدراسية وتخصيص صفوف كل مرحلة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/70 space-y-4">
                <h3 className="font-black text-slate-900 text-base">المراحل الدراسية</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="إضافة مرحلة..."
                    value={newItemTexts.stage}
                    onChange={(e) => setNewItemTexts({ ...newItemTexts, stage: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                  <button
                    onClick={() => {
                      const val = newItemTexts.stage.trim();
                      if (!val || localSettings.stages.includes(val)) return;
                      setLocalSettings({
                        ...localSettings,
                        stages: [...localSettings.stages, val],
                        stageGrades: { ...localSettings.stageGrades, [val]: ['الصف الأول'] }
                      });
                      setNewItemTexts({ ...newItemTexts, stage: '' });
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    + إضافة
                  </button>
                </div>
                <div className="space-y-2">
                  {localSettings.stages.map((st, idx) => (
                    <div
                      key={st}
                      onClick={() => setSelectedManageStage(st)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                        selectedManageStage === st ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setLocalSettings({ ...localSettings, stages: moveArrayItem(localSettings.stages, idx, -1) }); }}>
                          <ArrowUp size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setLocalSettings({ ...localSettings, stages: moveArrayItem(localSettings.stages, idx, 1) }); }}>
                          <ArrowDown size={13} />
                        </button>
                        <span className="font-bold text-sm">{st}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalSettings({ ...localSettings, stages: localSettings.stages.filter((s) => s !== st) });
                        }}
                        className="text-rose-500 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200/70 space-y-4">
                <h3 className="font-black text-slate-900 text-base">صفوف ({selectedManageStage})</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="إضافة صف دراسي..."
                    value={newItemTexts.grade}
                    onChange={(e) => setNewItemTexts({ ...newItemTexts, grade: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                  <button
                    onClick={() => {
                      const val = newItemTexts.grade.trim();
                      if (!val) return;
                      const curr = localSettings.stageGrades?.[selectedManageStage] || [];
                      setLocalSettings({
                        ...localSettings,
                        stageGrades: { ...localSettings.stageGrades, [selectedManageStage]: [...curr, val] }
                      });
                      setNewItemTexts({ ...newItemTexts, grade: '' });
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    + إضافة
                  </button>
                </div>
                <div className="space-y-2">
                  {(localSettings.stageGrades?.[selectedManageStage] || []).map((gr, idx) => (
                    <div key={gr} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setLocalSettings({
                              ...localSettings,
                              stageGrades: {
                                ...localSettings.stageGrades,
                                [selectedManageStage]: moveArrayItem(localSettings.stageGrades[selectedManageStage], idx, -1)
                              }
                            })
                          }
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          onClick={() =>
                            setLocalSettings({
                              ...localSettings,
                              stageGrades: {
                                ...localSettings.stageGrades,
                                [selectedManageStage]: moveArrayItem(localSettings.stageGrades[selectedManageStage], idx, 1)
                              }
                            })
                          }
                        >
                          <ArrowDown size={13} />
                        </button>
                        <span className="font-bold text-sm">{gr}</span>
                      </div>
                      <button
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            stageGrades: {
                              ...localSettings.stageGrades,
                              [selectedManageStage]: localSettings.stageGrades[selectedManageStage].filter((g) => g !== gr)
                            }
                          })
                        }
                        className="text-rose-500 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => onSaveSettings(localSettings)}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg"
              >
                حفظ جميع الأقسام والمراحل والصفوف
              </button>
            </div>
          </div>
        )}

        {/* 4. تبويب العروض والكوبونات */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/70 space-y-4 h-fit">
              <h3 className="font-black text-slate-900 text-lg">إنشاء كوبون خصم</h3>
              <input
                type="text"
                placeholder="كود الكوبون (مثال: WELCOME15)"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
              />
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">نسبة الخصم (%)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={newCouponDiscount}
                  onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={newCouponSingleUse}
                  onChange={(e) => setNewCouponSingleUse(e.target.checked)}
                />
                <span>كوبون شخصي يُستخدم لمرة واحدة فقط</span>
              </label>
              <button
                onClick={async () => {
                  const code = newCouponCode.trim() || `VIP-${Math.floor(1000 + Math.random() * 9000)}`;
                  await onSaveCoupon({
                    code,
                    discountPercent: newCouponDiscount,
                    singleUse: newCouponSingleUse,
                    used: false,
                    active: true
                  });
                  setNewCouponCode('');
                  notify('تم إنشاء الكوبون بنجاح!', 'success');
                }}
                className="w-full py-3 rounded-2xl bg-blue-600 text-white font-black text-sm"
              >
                + إنشاء الكوبون
              </button>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {coupons.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl p-4 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <div className="font-black text-base text-slate-900">{c.code} — خصم {c.discountPercent}%</div>
                    <div className="text-xs text-slate-500">
                      {c.singleUse ? (c.used ? 'شخصي • تم استخدامه ❌' : 'شخصي • متاح لمرة واحدة ✅') : 'كوبون عام متكرر'}
                    </div>
                  </div>
                  <button onClick={() => onDeleteCoupon(c.id)} className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. تبويب إعدادات الموقع والمظهر وطلب العميل */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/70 space-y-8">
            {/* الهوية والشعار والخلفية */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-lg border-b border-slate-100 pb-2">الهوية البصرية والشعار والخلفية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنصة</label>
                  <input
                    type="text"
                    value={localSettings.platformName}
                    onChange={(e) => setLocalSettings({ ...localSettings, platformName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوصف المختصر أسفل الاسم</label>
                  <input
                    type="text"
                    value={localSettings.platformTagline}
                    onChange={(e) => setLocalSettings({ ...localSettings, platformTagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">شعار المنصة (Logo)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const url = await compressImageFile(f, 500, 0.85);
                        setLocalSettings({ ...localSettings, logoUrl: url });
                      }
                    }}
                    className="text-xs"
                  />
                  {localSettings.logoUrl && (
                    <div className="flex items-center gap-3 pt-1">
                      <img src={localSettings.logoUrl} alt="Logo" className="h-12 object-contain rounded-lg border bg-white p-1" />
                      <button
                        onClick={() => setLocalSettings({ ...localSettings, logoUrl: '' })}
                        className="text-xs text-rose-600 font-bold"
                      >
                        حذف الشعار
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">صورة خلفية الواجهة الرئيسية</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const url = await compressImageFile(f, 1280, 0.8);
                        setLocalSettings({ ...localSettings, heroBgImage: url });
                      }
                    }}
                    className="text-xs"
                  />
                  {localSettings.heroBgImage && (
                    <div className="flex items-center gap-3 pt-1">
                      <img src={localSettings.heroBgImage} alt="Hero" className="h-12 w-20 object-cover rounded-lg border" />
                      <button
                        onClick={() => setLocalSettings({ ...localSettings, heroBgImage: '' })}
                        className="text-xs text-rose-600 font-bold"
                      >
                        حذف الخلفية
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>حجم الشعار</span>
                    <span className="text-blue-600">{localSettings.logoSize}px</span>
                  </label>
                  <input
                    type="range"
                    min={36}
                    max={140}
                    value={localSettings.logoSize}
                    onChange={(e) => setLocalSettings({ ...localSettings, logoSize: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>وضوح صورة الخلفية</span>
                    <span className="text-blue-600">{localSettings.heroBgOpacity}%</span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={localSettings.heroBgOpacity}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroBgOpacity: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>ارتفاع الواجهة الرئيسية</span>
                    <span className="text-blue-600">{localSettings.heroHeight}px</span>
                  </label>
                  <input
                    type="range"
                    min={380}
                    max={750}
                    value={localSettings.heroHeight}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroHeight: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* نصوص الواجهة والواتساب والدفع */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-lg border-b border-slate-100 pb-2">نصوص الواجهة وبيانات التواصل والدفع</h3>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان الرئيسي في الواجهة</label>
                <input
                  type="text"
                  value={localSettings.heroTitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">النص الفرعي للواجهة</label>
                <textarea
                  rows={2}
                  value={localSettings.heroSubtitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroSubtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الواتساب (مع كود الدولة مثل 2010...)</label>
                  <input
                    type="text"
                    value={localSettings.whatsappNumber}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تعليمات الدفع والتحويل</label>
                  <input
                    type="text"
                    value={localSettings.paymentInstructions}
                    onChange={(e) => setLocalSettings({ ...localSettings, paymentInstructions: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نص الشريط الترويجي العلوي</label>
                <input
                  type="text"
                  value={localSettings.promoBannerText}
                  onChange={(e) => setLocalSettings({ ...localSettings, promoBannerText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            {/* التحكم في حقول نموذج طلب العميل */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Sliders size={18} className="text-blue-600" />
                  <span>التحكم الكامل في إعدادات وحقول نموذج طلب العميل</span>
                </h3>
                <p className="text-xs text-slate-500">تحكم في نصوص نافذة الطلب، خيارات السلة والكوبون، وترتيب وتعديل وإضافة أي حقل بأي نوع</p>
              </div>

              {/* إعدادات نافذة الطلب العامة */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">عنوان نافذة الطلب</label>
                    <input
                      type="text"
                      value={localSettings.orderModalTitle || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, orderModalTitle: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">نص زر إرسال الطلب</label>
                    <input
                      type="text"
                      value={localSettings.orderSubmitButtonText || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, orderSubmitButtonText: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">الوصف الفرعي لنافذة الطلب</label>
                    <input
                      type="text"
                      value={localSettings.orderModalSubtitle || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, orderModalSubtitle: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">رسالة نجاح الطلب</label>
                    <input
                      type="text"
                      value={localSettings.orderSuccessTitle || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, orderSuccessTitle: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.orderAllowMultiSelect !== false}
                      onChange={(e) => setLocalSettings({ ...localSettings, orderAllowMultiSelect: e.target.checked })}
                    />
                    <span>السماح للعميل بإضافة أكثر من مذكرة في نفس الطلب</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.orderShowCouponBox !== false}
                      onChange={(e) => setLocalSettings({ ...localSettings, orderShowCouponBox: e.target.checked })}
                    />
                    <span>إظهار خانة إدخال كوبون الخصم للعميل</span>
                  </label>
                </div>
              </div>

              {/* قائمة حقول النموذج القابلة للتحكم الكامل */}
              <div className="space-y-3">
                {localSettings.orderFormFields.map((field, idx) => (
                  <div key={field.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* أسهم الترتيب */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => setLocalSettings({ ...localSettings, orderFormFields: moveArrayItem(localSettings.orderFormFields, idx, -1) })}
                          className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100"
                          title="تحريك لأعلى"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocalSettings({ ...localSettings, orderFormFields: moveArrayItem(localSettings.orderFormFields, idx, 1) })}
                          className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100"
                          title="تحريك لأسفل"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>

                      {/* اسم الحقل */}
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">عنوان الحقل</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => {
                            const updated = [...localSettings.orderFormFields];
                            updated[idx] = { ...field, label: e.target.value };
                            setLocalSettings({ ...localSettings, orderFormFields: updated });
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                        />
                      </div>

                      {/* النص التوضيحي */}
                      {field.type !== 'file' && (
                        <div className="flex-1 min-w-[150px]">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">النص التوضيحي (Placeholder)</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => {
                              const updated = [...localSettings.orderFormFields];
                              updated[idx] = { ...field, placeholder: e.target.value };
                              setLocalSettings({ ...localSettings, orderFormFields: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                          />
                        </div>
                      )}

                      {/* نوع الحقل */}
                      <div className="w-36">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">نوع الحقل</label>
                        <select
                          value={field.type || 'text'}
                          onChange={(e) => {
                            const updated = [...localSettings.orderFormFields];
                            updated[idx] = { ...field, type: e.target.value };
                            setLocalSettings({ ...localSettings, orderFormFields: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                        >
                          <option value="text">نص قصير</option>
                          <option value="tel">رقم هاتف</option>
                          <option value="textarea">فقرة طويلة</option>
                          <option value="select">قائمة اختيارات</option>
                          <option value="file">رفع صورة / ملف</option>
                        </select>
                      </div>
                    </div>

                    {/* خيارات القائمة المنسدلة إذا كان النوع select */}
                    {field.type === 'select' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          خيارات القائمة (افصل بين كل خيار وآخر بفاصلة ,)
                        </label>
                        <input
                          type="text"
                          value={(field.options || []).join(', ')}
                          placeholder="مثال: طباعة ملونة, طباعة أبيض وأسود, PDF فقط"
                          onChange={(e) => {
                            const opts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            const updated = [...localSettings.orderFormFields];
                            updated[idx] = { ...field, options: opts };
                            setLocalSettings({ ...localSettings, orderFormFields: updated });
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    )}

                    {/* أزرار الظهور والإلزام والحذف */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.visible !== false}
                            onChange={(e) => {
                              const updated = [...localSettings.orderFormFields];
                              updated[idx] = { ...field, visible: e.target.checked };
                              setLocalSettings({ ...localSettings, orderFormFields: updated });
                            }}
                          />
                          <span>{field.visible !== false ? 'ظاهر للعميل' : 'مخفي'}</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(field.required)}
                            onChange={(e) => {
                              const updated = [...localSettings.orderFormFields];
                              updated[idx] = { ...field, required: e.target.checked };
                              setLocalSettings({ ...localSettings, orderFormFields: updated });
                            }}
                          />
                          <span>حقل إلزامي</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            orderFormFields: localSettings.orderFormFields.filter((f) => f.id !== field.id)
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        <span>حذف الحقل</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* إضافة حقل جديد مخصص */}
              <div className="p-4 rounded-2xl bg-slate-100/80 border border-dashed border-slate-300 space-y-2.5">
                <div className="text-xs font-black text-slate-800">+ إضافة حقل جديد مخصص لنموذج الطلب:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="عنوان الحقل (مثال: اسم السنتر أو المدرسة)..."
                    value={newOrderFieldLabel}
                    onChange={(e) => setNewOrderFieldLabel(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="النص التوضيحي داخل الحقل..."
                    value={newOrderFieldPlaceholder}
                    onChange={(e) => setNewOrderFieldPlaceholder(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                  <select
                    value={newOrderFieldType}
                    onChange={(e) => setNewOrderFieldType(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    <option value="text">نوع الحقل: نص قصير</option>
                    <option value="tel">نوع الحقل: رقم هاتف</option>
                    <option value="textarea">نوع الحقل: فقرة طويلة</option>
                    <option value="select">نوع الحقل: قائمة اختيارات</option>
                    <option value="file">نوع الحقل: رفع صورة / ملف</option>
                  </select>
                </div>
                {newOrderFieldType === 'select' && (
                  <input
                    type="text"
                    placeholder="اكتب خيارات القائمة مفصولة بفاصلة (مثال: خيار 1, خيار 2, خيار 3)..."
                    value={newOrderFieldOptions}
                    onChange={(e) => setNewOrderFieldOptions(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!newOrderFieldLabel.trim()) return;
                    const opts = newOrderFieldType === 'select'
                      ? newOrderFieldOptions.split(',').map((s) => s.trim()).filter(Boolean)
                      : [];
                    setLocalSettings({
                      ...localSettings,
                      orderFormFields: [
                        ...localSettings.orderFormFields,
                        {
                          id: `custom_${Date.now()}`,
                          label: newOrderFieldLabel.trim(),
                          placeholder: newOrderFieldPlaceholder.trim(),
                          type: newOrderFieldType,
                          options: opts,
                          required: false,
                          visible: true,
                          locked: false
                        }
                      ]
                    });
                    setNewOrderFieldLabel('');
                    setNewOrderFieldPlaceholder('');
                    setNewOrderFieldOptions('');
                    setNewOrderFieldType('text');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  + إضافة الحقل للنموذج
                </button>
              </div>
            </div>

            {/* روابط التواصل الاجتماعي */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-lg border-b border-slate-100 pb-2">روابط التواصل الاجتماعي</h3>
              <div className="space-y-2.5">
                {localSettings.socialLinks.map((link, idx) => (
                  <div key={link.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <input
                      type="text"
                      value={link.label}
                      placeholder="اسم الرابط (مثال: صفحة الفيسبوك)"
                      onChange={(e) => {
                        const updated = [...localSettings.socialLinks];
                        updated[idx] = { ...link, label: e.target.value };
                        setLocalSettings({ ...localSettings, socialLinks: updated });
                      }}
                      className="sm:col-span-4 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    />
                    <input
                      type="url"
                      value={link.url}
                      placeholder="https://..."
                      onChange={(e) => {
                        const updated = [...localSettings.socialLinks];
                        updated[idx] = { ...link, url: e.target.value };
                        setLocalSettings({ ...localSettings, socialLinks: updated });
                      }}
                      className="sm:col-span-6 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      dir="ltr"
                    />
                    <div className="sm:col-span-2 flex items-center justify-end gap-2">
                      <input
                        type="color"
                        value={link.color || '#2563EB'}
                        onChange={(e) => {
                          const updated = [...localSettings.socialLinks];
                          updated[idx] = { ...link, color: e.target.value };
                          setLocalSettings({ ...localSettings, socialLinks: updated });
                        }}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <button
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            socialLinks: localSettings.socialLinks.filter((l) => l.id !== link.id)
                          })
                        }
                        className="p-2 rounded-xl bg-rose-50 text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    socialLinks: [
                      ...localSettings.socialLinks,
                      { id: `soc_${Date.now()}`, label: 'رابط تواصل جديد', url: 'https://', color: '#2563EB' }
                    ]
                  })
                }
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                + إضافة رابط تواصل جديد
              </button>
            </div>

            {/* تخصيص رسالة وصورة القسم الفارغ */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-lg border-b border-slate-100 pb-2">رسالة وصورة القسم الفارغ</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={localSettings.emptyStateTitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, emptyStateTitle: e.target.value })}
                  placeholder="العنوان الرئيسي عند خلو القسم"
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold"
                />
                <input
                  type="text"
                  value={localSettings.emptyStateCtaText}
                  onChange={(e) => setLocalSettings({ ...localSettings, emptyStateCtaText: e.target.value })}
                  placeholder="نص زر الحجز"
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
                />
              </div>
              <textarea
                rows={2}
                value={localSettings.emptyStateSubtitle}
                onChange={(e) => setLocalSettings({ ...localSettings, emptyStateSubtitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
              />
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const url = await compressImageFile(f, 800, 0.8);
                      setLocalSettings({ ...localSettings, emptyStateImage: url });
                    }
                  }}
                  className="text-xs"
                />
                {localSettings.emptyStateImage && (
                  <button
                    onClick={() => setLocalSettings({ ...localSettings, emptyStateImage: '' })}
                    className="text-xs text-rose-600 font-bold"
                  >
                    حذف الصورة
                  </button>
                )}
              </div>
            </div>

            {/* أزرار الحفظ والنسخ الاحتياطي */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Download size={15} />
                  <span>تنزيل نسخة احتياطية</span>
                </button>
                <label className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                  <Upload size={15} />
                  <span>استعادة نسخة</span>
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>

              <button
                type="button"
                disabled={savingSettings}
                onClick={async () => {
                  setSavingSettings(true);
                  await onSaveSettings(localSettings);
                  setSavingSettings(false);
                }}
                className="px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/20"
              >
                {savingSettings ? 'جاري الحفظ والمزامنة...' : 'حفظ جميع الإعدادات ومزامنتها'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 10. المكون الرئيسي للمنصة (MuzakkiratiApp)
// ============================================================================
function MuzakkiratiApp() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [notebooks, setNotebooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [user, setUser] = useState(null);

  const [activePage, setActivePage] = useState('home');
  const [catalogInitCategory, setCatalogInitCategory] = useState('');
  const [adminPortalOpen, setAdminPortalOpen] = useState(false);
  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);

  // تتبع الطلبات للزوار
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrders, setTrackedOrders] = useState(null);

  // إشعار عائم
  const [toast, setToast] = useState(null);
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef(null);

  const notify = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // التنقل المتزامن مع زر الرجوع في الهاتف والمتصفح
  const navigateTo = (page, category = '') => {
    setActivePage(page);
    setCatalogInitCategory(category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      window.history.pushState({ page, category }, '', page === 'home' ? '#' : `#${page}`);
    } catch {}
  };

  useEffect(() => {
    const onPopState = (e) => {
      if (previewNotebook) { setPreviewNotebook(null); return; }
      if (orderModalOpen) { setOrderModalOpen(false); return; }
      if (socialModalOpen) { setSocialModalOpen(false); return; }
      if (adminPortalOpen) { setAdminPortalOpen(false); return; }
      const st = e.state;
      if (st?.page) {
        setActivePage(st.page);
        setCatalogInitCategory(st.category || '');
      } else {
        setActivePage('home');
        setCatalogInitCategory('');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [previewNotebook, orderModalOpen, socialModalOpen, adminPortalOpen]);

  // الطرق المخفية الثلاث لفتح بوابة الإدارة
  useEffect(() => {
    if (window.location.hash === '#admin') {
      setAdminPortalOpen(true);
    }
    const onHashChange = () => {
      if (window.location.hash === '#admin') setAdminPortalOpen(true);
    };
    const onKeyDown = (e) => {
      if (e.altKey && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'ش')) {
        setAdminPortalOpen((prev) => !prev);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleLogoSecretTap = () => {
    logoTapCount.current += 1;
    clearTimeout(logoTapTimer.current);
    if (logoTapCount.current >= 5) {
      logoTapCount.current = 0;
      setAdminPortalOpen(true);
    } else {
      logoTapTimer.current = setTimeout(() => { logoTapCount.current = 0; }, 1800);
    }
  };

  // مراقبة حالة تسجيل الدخول في Firebase Auth
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsub();
  }, []);

  // المزامنة الحية مع السحابة لجميع الأجهزة (الكمبيوتر والهاتف)
  useEffect(() => {
    if (!db) return;

    const unsubSettings = onSnapshot(
      publicDoc('config', 'main'),
      (snap) => {
        if (snap.exists()) {
          setSettings(normalizeSettings(snap.data()));
        }
      },
      (err) => console.warn('Settings snapshot:', err.message)
    );

    const unsubNotebooks = onSnapshot(
      publicCol('notebooks'),
      (snap) => {
        const list = [];
        snap.forEach((d) => list.push(normalizeNotebook(d.data(), d.id)));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setNotebooks(list);
      },
      (err) => console.warn('Notebooks snapshot:', err.message)
    );

    const unsubCoupons = onSnapshot(
      publicCol('coupons'),
      (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setCoupons(list);
      },
      (err) => console.warn('Coupons snapshot:', err.message)
    );

    return () => {
      unsubSettings();
      unsubNotebooks();
      unsubCoupons();
    };
  }, []);

  // جلب الطلبات عند تسجيل دخول المدير فقط
  useEffect(() => {
    if (!db || !user) {
      setOrders([]);
      return;
    }
    const unsubOrders = onSnapshot(
      publicCol('orders'),
      (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOrders(list);
      },
      (err) => console.warn('Orders snapshot:', err.message)
    );
    return () => unsubOrders();
  }, [user]);

  // عمليات الكتابة المباشرة إلى السحابة
  const handleSaveSettings = async (newSettings) => {
    try {
      const normalized = normalizeSettings(newSettings);
      await setDoc(publicDoc('config', 'main'), normalized);
      setSettings(normalized);
      notify('تم حفظ الإعدادات ومزامنتها على جميع الأجهزة بنجاح!', 'success');
    } catch (err) {
      console.error(err);
      notify(`تعذر الحفظ في السحابة: ${err.message}`, 'error');
    }
  };

  const handleAddNotebook = async (nbData, compressedSamples = []) => {
    const id = nbData.id || `nb_${Date.now()}`;
    const docData = {
      ...nbData,
      id,
      sampleCount: compressedSamples.length,
      isHidden: Boolean(nbData.isHidden),
      createdAt: Date.now()
    };
    await setDoc(publicDoc('notebooks', id), docData);

    for (let i = 0; i < compressedSamples.length; i++) {
      await setDoc(publicDoc('notebook_samples', `${id}_s_${i}`), {
        notebookId: id,
        index: i,
        imageData: compressedSamples[i]
      });
    }
  };

  const handleUpdateNotebook = async (id, patch, compressedSamples = []) => {
    const existing = notebooks.find((n) => n.id === id) || {};
    const merged = {
      ...existing,
      ...patch,
      sampleCount: compressedSamples.length > 0 ? compressedSamples.length : (existing.sampleCount || 0)
    };
    await setDoc(publicDoc('notebooks', id), merged, { merge: true });

    if (compressedSamples.length > 0) {
      for (let i = 0; i < compressedSamples.length; i++) {
        await setDoc(publicDoc('notebook_samples', `${id}_s_${i}`), {
          notebookId: id,
          index: i,
          imageData: compressedSamples[i]
        });
      }
    }
  };

  const handleDeleteNotebook = async (id) => {
    try {
      await deleteDoc(publicDoc('notebooks', id));
      notify('تم حذف المذكرة', 'success');
    } catch (err) {
      notify(`تعذر الحذف: ${err.message}`, 'error');
    }
  };

  const handleSubmitOrder = async (orderPayload) => {
    const id = `ord_${Date.now()}`;
    const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    // تعليم الكوبون الشخصي كمستخدم
    if (orderPayload.appliedCouponCode) {
      const usedC = coupons.find((c) => c.code.toUpperCase() === orderPayload.appliedCouponCode.toUpperCase());
      if (usedC && usedC.singleUse) {
        await setDoc(publicDoc('coupons', usedC.id), { ...usedC, used: true, usedByOrder: orderNumber }, { merge: true });
      }
    }

    // توليد كوبون مكافأة فريد للطلب القادم
    let rewardCoupon = null;
    if (settings.nextOrderRewardEnabled && orderPayload.finalTotal > 0) {
      const rewardCode = `NEXT-${Math.floor(10000 + Math.random() * 90000)}`;
      rewardCoupon = {
        id: `cp_${Date.now()}`,
        code: rewardCode,
        discountPercent: settings.nextOrderDiscountPercent || 15,
        singleUse: true,
        used: false,
        active: true,
        ownerPhone: orderPayload.customer.phone
      };
      await setDoc(publicDoc('coupons', rewardCoupon.id), rewardCoupon);
    }

    const fullOrder = {
      id,
      orderNumber,
      ...orderPayload,
      rewardCoupon,
      status: 'قيد المراجعة',
      createdAt: Date.now()
    };
    await setDoc(publicDoc('orders', id), fullOrder);
    setCart([]);
    return fullOrder;
  };

  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth);
      setUser(null);
      setAdminPortalOpen(false);
      if (window.location.hash === '#admin') {
        window.history.replaceState(null, '', window.location.pathname);
      }
      notify('تم تسجيل الخروج بنجاح', 'success');
    } catch (err) {
      notify('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
  };

  const handleSearchOrder = async () => {
    const q = trackQuery.trim();
    if (!q) return;
    try {
      const snap = await getDocs(publicCol('orders'));
      const matched = [];
      snap.forEach((d) => {
        const data = d.data();
        if (
          data.orderNumber?.toLowerCase() === q.toLowerCase() ||
          data.customer?.phone?.includes(q)
        ) {
          matched.push(data);
        }
      });
      setTrackedOrders(matched);
    } catch {
      notify('تعذر البحث عن الطلب حاليًا', 'error');
    }
  };

  // عرض بوابة الإدارة إذا كانت مفتوحة
  if (adminPortalOpen) {
    return (
      <>
        <AdminPortal
          user={user}
          notebooks={notebooks}
          orders={orders}
          coupons={coupons}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onAddNotebook={handleAddNotebook}
          onUpdateNotebook={handleUpdateNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          onUpdateOrderStatus={(id, status) => setDoc(publicDoc('orders', id), { status }, { merge: true })}
          onDeleteOrder={(id) => deleteDoc(publicDoc('orders', id))}
          onSaveCoupon={(c) => {
            const id = c.id || `cp_${Date.now()}`;
            return setDoc(publicDoc('coupons', id), { ...c, id });
          }}
          onDeleteCoupon={(id) => deleteDoc(publicDoc('coupons', id))}
          onClosePortal={() => setAdminPortalOpen(false)}
          onLogout={handleLogout}
          notify={notify}
        />
        {toast && (
          <div className="fixed bottom-5 left-5 z-[110] px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl">
            {toast.message}
          </div>
        )}
      </>
    );
  }

  const visibleNotebooks = notebooks.filter((n) => !n.isHidden);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col" dir="rtl">
      {/* الشريط الترويجي العلوي */}
      {settings.promoBannerActive && settings.promoBannerText && (
        <div className="bg-slate-950 text-amber-300 text-xs sm:text-sm font-bold py-2.5 px-4 text-center">
          <span>{settings.promoBannerText}</span>
        </div>
      )}

      {/* الهيدر الرئيسي */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* الشعار واسم المنصة (النقر 5 مرات يفتح لوحة التحكم) */}
          <div
            onClick={handleLogoSecretTap}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.platformName}
                style={{ height: `${settings.logoSize || 52}px` }}
                className="w-auto object-contain rounded-xl"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                <BookOpen size={22} />
              </div>
            )}
            <div>
              <h1 className="font-black text-slate-900 text-sm sm:text-lg leading-tight">{settings.platformName}</h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">{settings.platformTagline}</p>
            </div>
          </div>

          {/* قائمة التنقل */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl">
            {[
              { id: 'home', label: 'الرئيسية' },
              { id: 'catalog', label: 'المذكرات' },
              { id: 'offers', label: 'العروض والباقات' },
              { id: 'track', label: 'تتبع طلبك' },
              { id: 'contact', label: 'اتصل بنا' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                  activePage === item.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* أزرار اليسار: السلة + تواصل معنا + زر لوحة التحكم (يظهر فقط إذا كان المدير مسجلاً) */}
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={() => setOrderModalOpen(true)}
                className="relative px-3 py-2.5 rounded-2xl bg-blue-50 text-blue-700 font-black text-xs flex items-center gap-1.5"
              >
                <ShoppingCart size={16} />
                <span>{cart.length}</span>
              </button>
            )}
            <button
              onClick={() => setSocialModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <MessageCircle size={16} />
              <span>تواصل معنا</span>
            </button>
            {user && (
              <button
                onClick={() => setAdminPortalOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-900 text-emerald-400 font-black text-xs flex items-center gap-1.5"
              >
                <ShieldCheck size={15} />
                <span className="hidden sm:inline">لوحة التحكم</span>
              </button>
            )}
          </div>
        </div>

        {/* شريط تنقل الجوال */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-100 py-2 px-2 bg-white text-[11px] font-bold">
          {[
            { id: 'home', label: 'الرئيسية' },
            { id: 'catalog', label: 'المذكرات' },
            { id: 'offers', label: 'العروض' },
            { id: 'track', label: 'تتبع طلبك' },
            { id: 'contact', label: 'اتصل بنا' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`px-2.5 py-1.5 rounded-xl ${
                activePage === item.id ? 'bg-blue-50 text-blue-600 font-black' : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* محتوى الصفحات */}
      <main className="flex-1">
        {activePage === 'home' && (
          <>
            {/* الواجهة الترحيبية Hero */}
            <section
              className="relative overflow-hidden flex items-center"
              style={{ minHeight: `${settings.heroHeight || 540}px`, backgroundColor: settings.heroOverlayColor || '#020617' }}
            >
              {settings.heroBgImage && (
                <img
                  src={settings.heroBgImage}
                  alt="Hero"
                  style={{
                    opacity: (settings.heroBgOpacity ?? 45) / 100,
                    objectFit: settings.heroBgFit || 'cover'
                  }}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              )}
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
                <div className="lg:col-span-7 space-y-5 text-white">
                  {settings.heroBadge && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black">
                      <Sparkles size={14} />
                      <span>{settings.heroBadge}</span>
                    </span>
                  )}
                  <h2 className="text-3xl sm:text-5xl font-black leading-tight">{settings.heroTitle}</h2>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">{settings.heroSubtitle}</p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => navigateTo('catalog')}
                      className="px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition"
                    >
                      تصفح مكتبة المذكرات
                    </button>
                    <button
                      onClick={() => { setCart([]); setOrderModalOpen(true); }}
                      className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-sm transition"
                    >
                      اطلب إعداد مذكرة خاصة
                    </button>
                  </div>
                </div>

                {/* بطاقة الثقة */}
                <div className="lg:col-span-5">
                  <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/70 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
                    <div className="flex items-center gap-2 text-amber-400 font-black text-base">
                      <ShieldCheck size={20} />
                      <span>{settings.trustCardTitle}</span>
                    </div>
                    <ul className="space-y-3">
                      {settings.trustPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                          <CheckCircle2 size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* الأقسام الرئيسية بالصور المخصصة */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">الأقسام الرئيسية للمذكرات والكورسات</h2>
                <p className="text-sm text-slate-500">اختر القسم المناسب لتصفح المجلدات الدراسية ومعاينة صفحاتها</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {settings.categories.map((cat) => {
                  const count = visibleNotebooks.filter((n) => n.category === cat).length;
                  const catImg = settings.categoryImages?.[cat];
                  return (
                    <div
                      key={cat}
                      onClick={() => navigateTo('catalog', cat)}
                      className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition cursor-pointer flex flex-col"
                    >
                      {catImg && (
                        <div className="h-44 w-full overflow-hidden bg-slate-900 relative">
                          <img
                            src={catImg}
                            alt={cat}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
                          <span className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/90 text-slate-900 text-xs font-black">
                            {count} مذكرة
                          </span>
                        </div>
                      )}
                      <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition">
                            <BookOpen size={22} />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-lg">{cat}</h3>
                            <p className="text-xs text-slate-500">{count} مذكرة متاحة للتخصيص</p>
                          </div>
                        </div>
                        <ArrowLeft className="text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition" size={20} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activePage === 'catalog' && (
          <CatalogPage
            notebooks={notebooks}
            settings={settings}
            initialCategory={catalogInitCategory}
            onPreview={(nb) => setPreviewNotebook(nb)}
            onAddToCart={(nb) => {
              if (!cart.some((c) => c.id === nb.id)) {
                setCart([...cart, nb]);
                notify(`تمت إضافة "${nb.title}" إلى سلة الطلبات`, 'success');
              } else {
                notify('المذكرة موجودة بالفعل في السلة', 'info');
              }
            }}
            onOrderNow={(nb) => {
              if (nb && !cart.some((c) => c.id === nb.id)) setCart([...cart, nb]);
              setOrderModalOpen(true);
            }}
            onNavigate={navigateTo}
          />
        )}

        {activePage === 'offers' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
            <h2 className="text-2xl font-black text-slate-900">العروض والخصومات المتاحة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleNotebooks.filter((n) => n.oldPrice > n.price).map((nb) => (
                <div key={nb.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
                  <h3 className="font-black text-lg">{nb.title}</h3>
                  <p className="text-xs text-slate-500">{nb.grade} • {nb.subject}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-blue-600">{nb.price} ج.م</span>
                    <span className="text-xs text-slate-400 line-through">{nb.oldPrice} ج.م</span>
                  </div>
                  <button
                    onClick={() => { setCart([nb]); setOrderModalOpen(true); }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                  >
                    استفد من العرض الآن
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === 'track' && (
          <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4 text-center">
              <PackageCheck className="mx-auto text-blue-600" size={36} />
              <h2 className="text-2xl font-black text-slate-900">تتبع حالة طلبك</h2>
              <p className="text-xs text-slate-500">أدخل رقم الطلب (مثل ORD-12345) أو رقم الهاتف المسجل</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="رقم الطلب أو رقم الهاتف..."
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm"
                />
                <button
                  onClick={handleSearchOrder}
                  className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm"
                >
                  بحث
                </button>
              </div>

              {trackedOrders && (
                <div className="pt-4 space-y-3 text-right">
                  {trackedOrders.length === 0 ? (
                    <p className="text-xs text-rose-600 font-bold text-center">لم يتم العثور على طلب مطابق</p>
                  ) : (
                    trackedOrders.map((o) => (
                      <div key={o.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex justify-between font-black text-sm">
                          <span>{o.orderNumber}</span>
                          <span className="text-blue-600">{o.status}</span>
                        </div>
                        <div className="text-xs text-slate-600">{(o.items || []).map((i) => i.title).join(' + ')}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activePage === 'contact' && (
          <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">تواصل مع فريق {settings.platformName}</h2>
                <p className="text-xs sm:text-sm text-slate-500">نسعد بالرد على جميع استفسارات المعلمين وطلبات التخصيص</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href={`https://wa.me/${settings.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900"
                >
                  <div>
                    <div className="font-black text-sm">مراسلة مباشرة عبر واتساب</div>
                    <div className="text-xs text-emerald-700" dir="ltr">+{settings.whatsappNumber}</div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <SocialBrandIcon url="whatsapp" size={22} />
                  </div>
                </a>

                {settings.socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 hover:bg-slate-100 transition"
                  >
                    <div className="overflow-hidden">
                      <div className="font-black text-sm">{link.label}</div>
                      <div className="text-xs text-slate-400 truncate" dir="ltr">{link.url}</div>
                    </div>
                    <div
                      className="w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0"
                      style={{ backgroundColor: link.color || '#2563EB' }}
                    >
                      <SocialBrandIcon url={link.url} label={link.label} size={22} />
                    </div>
                  </a>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <b>بيانات الدفع والتحويل المعتمدة:</b> {settings.paymentInstructions}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* الفوتر بدون أي زر إدارة ظاهر للزوار */}
      <footer className="bg-slate-950 text-slate-300 pt-12 pb-8 px-4 sm:px-6 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-black text-lg">
              <BookOpen className="text-blue-500" size={22} />
              <span>{settings.platformName}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{settings.platformTagline}</p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-white font-black text-sm">روابط سريعة</h4>
            <div className="flex flex-col gap-2 text-xs text-slate-400">
              <button onClick={() => navigateTo('catalog')} className="text-right hover:text-white">تصفح جميع المذكرات</button>
              <button onClick={() => navigateTo('offers')} className="text-right hover:text-white">العروض والباقات</button>
              <button onClick={() => navigateTo('track')} className="text-right hover:text-white">متابعة حالة الطلب</button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-black text-sm">تواصل معنا</h4>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <SocialBrandIcon url="whatsapp" size={16} />
                <span>واتساب</span>
              </a>
              {settings.socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5"
                  style={{ backgroundColor: link.color || '#1E293B' }}
                >
                  <SocialBrandIcon url={link.url} label={link.label} size={16} />
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 text-center text-xs text-slate-500">
          جميع الحقوق محفوظة © {new Date().getFullYear()} — {settings.platformName}
        </div>
      </footer>

      {/* النوافذ المنبثقة */}
      {previewNotebook && (
        <ProtectedPreviewModal
          notebook={previewNotebook}
          settings={settings}
          onClose={() => setPreviewNotebook(null)}
          onAddToCart={(nb) => {
            if (!cart.some((c) => c.id === nb.id)) setCart([...cart, nb]);
            notify('تمت الإضافة للسلة', 'success');
          }}
          onOrderNow={(nb) => {
            if (nb && !cart.some((c) => c.id === nb.id)) setCart([...cart, nb]);
            setPreviewNotebook(null);
            setOrderModalOpen(true);
          }}
        />
      )}

      {orderModalOpen && (
        <OrderCartModal
          cart={cart}
          setCart={setCart}
          notebooks={notebooks}
          settings={settings}
          coupons={coupons}
          onClose={() => setOrderModalOpen(false)}
          onSubmitOrder={handleSubmitOrder}
          notify={notify}
        />
      )}

      {socialModalOpen && (
        <SocialHubModal settings={settings} onClose={() => setSocialModalOpen(false)} />
      )}

      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-[110] px-5 py-3 rounded-2xl text-white text-xs font-bold shadow-2xl ${
            toast.type === 'error' ? 'bg-rose-600' : toast.type === 'success' ? 'bg-emerald-600' : 'bg-slate-900'
          }`}
        >
          {toast.message}
        </div>
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
