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
  nextOrderRewardPercent: 15,
  nextOrderRewardTitle: 'هدية خاصة لطلبك القادم!',
  // مجموعات وباقات الخصم
  bundles: [],
  // التواصل والدفع
  whatsappNumber: '201000000000',
  facebookUrl: '',
  whatsappGroupUrl: '',
  telegramUrl: '',
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
  return merged;
};

const normalizeNotebook = (id, raw = {}) => ({
  id,
  title: toCleanString(raw.title) || 'مذكرة تعليمية',
  category: toCleanString(raw.category) || 'مذكرات الترم الأول',
  stage: toCleanString(raw.stage) || 'المرحلة الإعدادية',
  grade: toCleanString(raw.grade) || 'الصف الأول الإعدادي',
  subject: toCleanString(raw.subject) || 'اللغة العربية',
  price: Number(raw.price) || 0,
  oldPrice: Number(raw.oldPrice) || 0,
  pages: Number(raw.pages) || 0,
  badge: toCleanString(raw.badge),
  description: toCleanString(raw.description),
  customNotice: toCleanString(raw.customNotice),
  driveUrl: toCleanString(raw.driveUrl),
  coverUrl: toCleanString(raw.coverUrl),
  sampleUrls: Array.isArray(raw.sampleUrls) ? raw.sampleUrls.filter(Boolean) : [],
  isComingSoon: Boolean(raw.isComingSoon),
  isHidden: Boolean(raw.isHidden),
  createdAt: raw.createdAt || Date.now()
});

// ضغط الصور من الملفات للحفاظ على سرعة التحميل وعدم تجاوز حدود Firestore
const compressImageFile = (file, maxWidth = 900, quality = 0.78) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('صيغة الصورة غير مدعومة'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return '';
};

const generateUniqueCouponCode = (prefix = 'NEXT') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
};

// ============================================================================
// 3. مكون حماية الأخطاء (Error Boundary)
// ============================================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'خطأ غير متوقع' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">حدث خطأ مؤقت في عرض الصفحة</h2>
            <p className="text-xs text-slate-500 mb-6 break-words">{this.state.errorMsg}</p>
            <button
              onClick={() => this.setState({ hasError: false, errorMsg: '' })}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
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
// 4. نافذة معاينة المذكرة المحمية + التنبيهات الخاصة بكل مذكرة
// ============================================================================
function ProtectedPreviewModal({ notebook, settings, onClose, onAddToCart, onOrderNow, isInCart }) {
  const [samples, setSamples] = useState(notebook.sampleUrls || []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);

  useEffect(() => {
    let active = true;
    if ((!notebook.sampleUrls || notebook.sampleUrls.length === 0) && notebook.id) {
      setLoadingSamples(true);
      getDoc(publicDoc('notebook_samples', notebook.id))
        .then((snap) => {
          if (active && snap.exists() && Array.isArray(snap.data().sampleUrls)) {
            setSamples(snap.data().sampleUrls);
          }
        })
        .catch(() => {})
        .finally(() => active && setLoadingSamples(false));
    }
    return () => { active = false; };
  }, [notebook]);

  const allPages = useMemo(() => {
    const list = [];
    if (notebook.coverUrl) list.push(notebook.coverUrl);
    samples.forEach((s) => {
      if (s && s !== notebook.coverUrl) list.push(s);
    });
    return list;
  }, [notebook.coverUrl, samples]);

  const safeDriveUrl = sanitizeUrl(notebook.driveUrl);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        {/* رأس النافذة */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-base sm:text-lg truncate">{notebook.title}</h3>
              <p className="text-xs text-slate-400 truncate">
                {notebook.category} • {notebook.stage} • {notebook.grade} • {notebook.subject}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوى النافذة */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* عارض الصفحات المحمي */}
          <div className={`${isFullscreen ? 'lg:col-span-12' : 'lg:col-span-7'} flex flex-col`}>
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[340px] sm:min-h-[440px] select-none">
              {loadingSamples ? (
                <div className="text-slate-300 text-sm flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  جاري تحميل صفحات المعاينة عالية الدقة...
                </div>
              ) : allPages.length > 0 ? (
                <>
                  <img
                    src={allPages[activeIdx] || allPages[0]}
                    alt={`صفحة ${activeIdx + 1}`}
                    draggable={false}
                    className={`w-full ${isFullscreen ? 'max-h-[75vh]' : 'max-h-[460px]'} object-contain pointer-events-none`}
                  />
                  {/* علامة مائية قطرية لحماية الصفحات */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-20">
                    <span className="text-white font-black text-2xl sm:text-4xl -rotate-30 whitespace-nowrap tracking-widest border-2 border-white/40 px-6 py-2 rounded-2xl">
                      {settings.siteName} • عينة معاينة
                    </span>
                  </div>

                  {/* أزرار التنقل بين الصفحات */}
                  {allPages.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveIdx((prev) => (prev > 0 ? prev - 1 : allPages.length - 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white shadow-lg transition"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setActiveIdx((prev) => (prev < allPages.length - 1 ? prev + 1 : 0))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white shadow-lg transition"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* شريط الأدوات السفلي للعارض */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl text-white text-xs">
                    <span>
                      صفحة {activeIdx + 1} من {allPages.length}
                    </span>
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="flex items-center gap-1.5 text-blue-300 hover:text-white font-bold"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      {isFullscreen ? 'تصغير العرض' : 'تكبير ملء الشاشة'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">لا توجد صور معاينة مرفوعة لهذه المذكرة بعد</p>
                </div>
              )}
            </div>

            {/* شريط المصغرات */}
            {allPages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-3 px-1">
                {allPages.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIdx(idx)}
                    className={`relative w-16 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                      activeIdx === idx ? 'border-blue-600 scale-105 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/75 text-white text-[10px] text-center">
                      {idx === 0 && notebook.coverUrl ? 'الغلاف' : idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* تفاصيل المذكرة + صندوق التنبيهات */}
          {!isFullscreen && (
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                    {notebook.subject}
                  </span>
                  {notebook.pages > 0 && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      {notebook.pages} صفحة
                    </span>
                  )}
                  {notebook.isComingSoon && (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      قريبًا / حجز مسبق
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-blue-600">{notebook.price} ج.م</span>
                    {notebook.oldPrice > notebook.price && (
                      <span className="text-base text-slate-400 line-through font-bold">
                        {notebook.oldPrice} ج.م
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">شامل إضافة اسم المعلم ورقم الهاتف والشعار</p>
                </div>

                {notebook.description && (
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 mb-1.5">وصف ومحتويات المذكرة:</h4>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-2xl border border-slate-100">
                      {notebook.description}
                    </p>
                  </div>
                )}

                {/* صندوق التنبيهات الخاص بكل مذكرة */}
                {(settings.notebookNoticeEnabled || notebook.customNotice) && (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
                      <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{settings.notebookNoticeTitle || 'تنبيه هام قبل تأكيد الطلب'}</span>
                    </div>
                    {settings.notebookNoticeEnabled && settings.notebookNoticeText && (
                      <p className="text-xs text-amber-900/90 leading-relaxed">{settings.notebookNoticeText}</p>
                    )}
                    {notebook.customNotice && (
                      <p className="text-xs font-bold text-amber-950 bg-amber-100/70 p-2 rounded-xl mt-1">
                        ملاحظة خاصة بهذه المذكرة: {notebook.customNotice}
                      </p>
                    )}
                  </div>
                )}

                {safeDriveUrl && (
                  <a
                    href={safeDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    معاينة نسخة إضافية على Google Drive
                  </a>
                )}
              </div>

              {/* أزرار الطلب والسلة */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <button
                  onClick={() => {
                    onClose();
                    onOrderNow(notebook);
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {notebook.isComingSoon ? 'احجز نسختك مسبقًا الآن' : 'اطلب المذكرة الآن باسمك'}
                </button>
                {settings.orderEnableMultiCart && (
                  <button
                    onClick={() => onAddToCart(notebook)}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs border transition flex items-center justify-center gap-2 ${
                      isInCart
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {isInCart ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        مضافة في سلة الطلبات
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        أضف إلى سلة الطلبات (لطلب أكثر من مذكرة)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. نافذة سلة المشتريات وإتمام الطلب (تدعم الكوبونات العامة + الفردية + خصم الباقات)
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
  const [couponError, setCouponError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAddMorePicker, setShowAddMorePicker] = useState(false);

  // حساب المجموع الفرعي للمذكرات في السلة
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0), [cart]);

  // حساب خصم المجموعات / الباقات تلقائيًا إذا كانت المذكرات المختارة تطابق أي باقة مفعلة
  const bundleDiscountInfo = useMemo(() => {
    const bundles = Array.isArray(settings.bundles) ? settings.bundles : [];
    const cartIds = new Set(cart.map((c) => c.id));
    let bestDiscount = 0;
    let matchedBundle = null;

    bundles.forEach((b) => {
      if (!b.active || !Array.isArray(b.notebookIds) || b.notebookIds.length === 0) return;
      const allIncluded = b.notebookIds.every((id) => cartIds.has(id));
      if (allIncluded) {
        const bundleItemsSum = cart
          .filter((c) => b.notebookIds.includes(c.id))
          .reduce((s, c) => s + (Number(c.price) || 0), 0);
        const disc =
          b.discountType === 'fixed'
            ? Math.min(bundleItemsSum, Number(b.discountValue) || 0)
            : Math.round((bundleItemsSum * (Number(b.discountValue) || 0)) / 100);
        if (disc > bestDiscount) {
          bestDiscount = disc;
          matchedBundle = b;
        }
      }
    });

    return { discount: bestDiscount, bundle: matchedBundle };
  }, [cart, settings.bundles]);

  // حساب خصم الكوبون (عام أو شخصي لمرة واحدة)
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const baseAfterBundle = Math.max(0, subtotal - bundleDiscountInfo.discount);
    if (appliedCoupon.discountType === 'fixed') {
      return Math.min(baseAfterBundle, Number(appliedCoupon.discountValue) || 0);
    }
    return Math.round((baseAfterBundle * (Number(appliedCoupon.discountValue) || 0)) / 100);
  }, [appliedCoupon, subtotal, bundleDiscountInfo.discount]);

  const finalTotal = Math.max(0, subtotal - bundleDiscountInfo.discount - couponDiscount);

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const found = coupons.find((c) => String(c.code || '').toUpperCase() === code);
    if (!found) {
      setCouponError('كود الخصم غير صحيح، تأكد من كتابته بشكل سليم.');
      return;
    }
    if (found.active === false) {
      setCouponError('هذا الكوبون متوقف حاليًا.');
      return;
    }
    // التحقق من الكوبون الشخصي ذي الاستخدام الواحد
    if (found.singleUse && (found.used || (Number(found.usedCount) || 0) >= 1)) {
      setCouponError('هذا الكوبون الشخصي تم استخدامه مسبقًا ولا يمكن استخدامه مرة أخرى.');
      return;
    }
    // التحقق من الحد الأقصى للاستخدام للكوبون العام
    if (!found.singleUse && Number(found.maxUses) > 0 && (Number(found.usedCount) || 0) >= Number(found.maxUses)) {
      setCouponError('عذرًا، انتهى الحد الأقصى لعدد مرات استخدام هذا الكوبون.');
      return;
    }
    // التحقق من تاريخ الانتهاء
    if (found.expiresAt) {
      const exp = new Date(found.expiresAt);
      if (!isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
        setCouponError('انتهت صلاحية هذا الكوبون.');
        return;
      }
    }

    setAppliedCoupon(found);
    onNotify(`تم تطبيق كود الخصم (${found.code}) بنجاح!`, 'success');
  };

  const handleFieldFile = async (fieldId, file) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 700, 0.78);
      setFormValues((prev) => ({ ...prev, [fieldId]: compressed }));
      onNotify('تم إرفاق الصورة بنجاح', 'success');
    } catch {
      onNotify('تعذر معالجة الصورة المختارة', 'error');
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      onNotify('سلة الطلبات فارغة، اختر مذكرة واحدة على الأقل', 'error');
      return;
    }

    // التحقق من الحقول الإلزامية
    const visibleFields = (settings.orderFormFields || []).filter((f) => f.visible !== false);
    for (const field of visibleFields) {
      if (field.required && !String(formValues[field.id] || '').trim()) {
        onNotify(`يرجى إدخال: ${field.label}`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const customerPhone = String(formValues.phone || '').trim();
      const customerName = String(formValues.teacherName || 'عميل').trim();

      // توليد كوبون مكافأة فريد للعميل على طلبه القادم (يستخدم مرة واحدة فقط)
      let nextOrderCouponCode = '';
      if (settings.nextOrderRewardEnabled && Number(settings.nextOrderRewardPercent) > 0) {
        nextOrderCouponCode = generateUniqueCouponCode('NEXT');
        try {
          await addDoc(publicCol('coupons'), {
            code: nextOrderCouponCode,
            type: 'personal_next',
            discountType: 'percent',
            discountValue: Number(settings.nextOrderRewardPercent),
            singleUse: true,
            used: false,
            usedCount: 0,
            maxUses: 1,
            active: true,
            issuedForPhone: customerPhone,
            issuedForName: customerName,
            issuedFromOrder: orderNumber,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          console.warn('Could not persist reward coupon:', err);
        }
      }

      // تحديث حالة الكوبون المستخدم في هذا الطلب
      if (appliedCoupon && appliedCoupon.id) {
        try {
          const newUsedCount = (Number(appliedCoupon.usedCount) || 0) + 1;
          await updateDoc(publicDoc('coupons', appliedCoupon.id), {
            usedCount: newUsedCount,
            used: appliedCoupon.singleUse ? true : false,
            lastUsedOrder: orderNumber,
            lastUsedAt: serverTimestamp()
          });
        } catch (err) {
          console.warn('Coupon update warning:', err);
        }
      }

      const orderPayload = {
        orderNumber,
        items: cart.map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          stage: item.stage,
          grade: item.grade,
          subject: item.subject,
          price: item.price
        })),
        customerData: formValues,
        teacherName: customerName,
        phone: customerPhone,
        subtotal,
        bundleDiscount: bundleDiscountInfo.discount,
        bundleTitle: bundleDiscountInfo.bundle?.title || '',
        couponCode: appliedCoupon?.code || '',
        couponDiscount,
        totalPrice: finalTotal,
        nextOrderCouponCode,
        status: 'new',
        createdAt: serverTimestamp()
      };

      await addDoc(publicCol('orders'), orderPayload);

      setCompletedOrder({
        ...orderPayload,
        nextOrderCouponCode
      });
      onClearCart();
    } catch (err) {
      onNotify(`حدث خطأ أثناء إرسال الطلب: ${err?.message || 'حاول مرة أخرى'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsAppWithOrder = (order) => {
    const cleanWa = String(settings.whatsappNumber || '').replace(/[^\d]/g, '');
    const itemsLines = order.items.map((it, idx) => `${idx + 1}. ${it.title} (${it.grade}) - ${it.price} ج.م`).join('\n');
    const msg = [
      `السلام عليكم ورحمة الله وبركاته،`,
      `أرغب في تأكيد طلبي من *${settings.siteName}*`,
      `📌 *رقم الطلب:* ${order.orderNumber}`,
      `👤 *الاسم للطباعة:* ${order.teacherName}`,
      `📱 *الهاتف:* ${order.phone}`,
      `📚 *المذكرات المطلوبة:*`,
      itemsLines,
      order.bundleDiscount > 0 ? `🎁 *خصم الباقة (${order.bundleTitle}):* -${order.bundleDiscount} ج.م` : '',
      order.couponCode ? `🏷️ *كوبون الخصم (${order.couponCode}):* -${order.couponDiscount} ج.م` : '',
      `💰 *الإجمالي النهائي:* ${order.totalPrice} ج.م`,
      order.nextOrderCouponCode ? `🎉 *هدية طلبي القادم:* ${order.nextOrderCouponCode}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    const url = `https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        {/* رأس النافذة */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h3 className="font-extrabold text-lg">
              {completedOrder ? 'تم استلام طلبك بنجاح!' : settings.orderModalTitle}
            </h3>
            <p className="text-xs text-slate-400">
              {completedOrder ? `رقم متابعة الطلب: ${completedOrder.orderNumber}` : settings.orderModalSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوى النافذة */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {completedOrder ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 mb-1">{settings.orderSuccessMessage}</h4>
                <div className="inline-block bg-slate-100 px-4 py-1.5 rounded-full text-sm font-black text-blue-700 mt-2">
                  رقم الطلب: {completedOrder.orderNumber}
                </div>
              </div>

              {/* عرض كوبون مكافأة الطلب القادم الفريد للعميل */}
              {completedOrder.nextOrderCouponCode && (
                <div className="bg-gradient-to-l from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-2xl p-5 max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-2 text-amber-800 font-extrabold text-sm mb-1">
                    <Gift className="w-5 h-5 text-amber-600" />
                    <span>{settings.nextOrderRewardTitle || 'هدية خاصة لطلبك القادم!'}</span>
                  </div>
                  <p className="text-xs text-amber-900/80 mb-3">
                    استخدم هذا الكود الشخصي في طلبك القادم للحصول على خصم{' '}
                    <strong>{settings.nextOrderRewardPercent}%</strong> (صالح للاستخدام مرة واحدة فقط):
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="px-4 py-2 bg-white border border-amber-300 rounded-xl font-black text-lg text-slate-900 tracking-wider">
                      {completedOrder.nextOrderCouponCode}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(completedOrder.nextOrderCouponCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition"
                      title="نسخ الكود"
                    >
                      {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {settings.paymentInstructions && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 max-w-lg mx-auto leading-relaxed">
                  <strong>تعليمات الدفع والتأكيد:</strong> {settings.paymentInstructions}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={() => openWhatsAppWithOrder(completedOrder)}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                >
                  <MessageCircle className="w-5 h-5" />
                  إرسال تفاصيل الطلب على واتساب الآن
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
                >
                  العودة للمنصة
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* قائمة المذكرات في السلة */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    المذكرات المختارة ({cart.length})
                  </h4>
                  {settings.orderEnableMultiCart && (
                    <button
                      type="button"
                      onClick={() => setShowAddMorePicker(!showAddMorePicker)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {showAddMorePicker ? 'إغلاق القائمة' : 'إضافة مذكرة أخرى'}
                    </button>
                  )}
                </div>

                {showAddMorePicker && (
                  <div className="bg-white rounded-xl p-3 border border-blue-200 max-h-44 overflow-y-auto space-y-1.5">
                    {allNotebooks
                      .filter((n) => !n.isHidden && !cart.some((c) => c.id === n.id))
                      .map((nb) => (
                        <div key={nb.id} className="flex items-center justify-between text-xs p-2 hover:bg-slate-50 rounded-lg">
                          <span className="font-bold text-slate-800 truncate">
                            {nb.title} ({nb.grade}) — <strong className="text-blue-600">{nb.price} ج.م</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddNotebookToCart(nb)}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold shrink-0"
                          >
                            + إضافة
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {cart.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-3">السلة فارغة حاليًا.</p>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.grade} • {item.subject}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-black text-sm text-blue-600">{item.price} ج.م</span>
                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(item.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            title="إزالة من السلة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* شارة خصم المجموعة التلقائي إن تحقق */}
                {bundleDiscountInfo.discount > 0 && bundleDiscountInfo.bundle && (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      تم تفعيل خصم باقة «{bundleDiscountInfo.bundle.title}» تلقائيًا!
                    </span>
                    <span>-{bundleDiscountInfo.discount} ج.م</span>
                  </div>
                )}

                {/* خانة كوبون الخصم */}
                {settings.orderEnableCoupons && (
                  <div className="pt-2 border-t border-slate-200/70">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="لديك كود خصم أو كوبون طلب قادم؟ اكتبه هنا..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold uppercase focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shrink-0"
                      >
                        تطبيق الكوبون
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-rose-600 font-bold mt-1.5">{couponError}</p>}
                    {appliedCoupon && (
                      <div className="flex items-center justify-between bg-blue-50 text-blue-800 px-3 py-2 rounded-xl text-xs font-bold mt-2">
                        <span>
                          تم تطبيق الكوبون ({appliedCoupon.code}) — خصم{' '}
                          {appliedCoupon.discountType === 'fixed'
                            ? `${appliedCoupon.discountValue} ج.م`
                            : `${appliedCoupon.discountValue}%`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponInput('');
                          }}
                          className="text-rose-600 hover:underline"
                        >
                          إزالة
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ملخص الحساب النهائي */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-700">الإجمالي المطلوب:</span>
                  <div className="text-left">
                    {(bundleDiscountInfo.discount > 0 || couponDiscount > 0) && (
                      <span className="text-xs text-slate-400 line-through ml-2">{subtotal} ج.م</span>
                    )}
                    <span className="text-xl font-black text-blue-600">{finalTotal} ج.م</span>
                  </div>
                </div>
              </div>

              {/* حقول بيانات العميل الديناميكية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(settings.orderFormFields || [])
                  .filter((f) => f.visible !== false)
                  .map((field) => {
                    const isFullWidth = field.type === 'textarea' || field.type === 'file';
                    return (
                      <div key={field.id} className={isFullWidth ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                          {field.label}
                          {field.required && <span className="text-rose-500 mr-1">*</span>}
                        </label>

                        {field.type === 'textarea' ? (
                          <textarea
                            rows={3}
                            required={field.required}
                            placeholder={field.placeholder}
                            value={formValues[field.id] || ''}
                            onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
                          />
                        ) : field.type === 'select' ? (
                          <select
                            required={field.required}
                            value={formValues[field.id] || ''}
                            onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-600"
                          >
                            <option value="">{field.placeholder || 'اختر...'}</option>
                            {(field.options || []).map((opt, idx) => (
                              <option key={idx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'file' ? (
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFieldFile(field.id, e.target.files?.[0])}
                              className="text-xs text-slate-600 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-bold hover:file:bg-blue-100"
                            />
                            {formValues[field.id] && (
                              <img src={formValues[field.id]} alt="preview" className="w-10 h-10 rounded-lg object-cover border" />
                            )}
                          </div>
                        ) : (
                          <input
                            type={field.type === 'tel' ? 'tel' : 'text'}
                            required={field.required}
                            placeholder={field.placeholder}
                            value={formValues[field.id] || ''}
                            onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>

              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    جاري تسجيل الطلب...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {settings.orderSubmitText || 'تأكيد الطلب وإرساله'}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. بطاقة المذكرة القابلة لإعادة الاستخدام
// ============================================================================
function NotebookCard({ notebook, onPreview, onOrderNow, onAddToCart, isInCart, enableCart }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
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
            <BookOpen className="w-12 h-12 mb-2 opacity-40" />
            <span className="text-xs font-bold">{notebook.subject}</span>
          </div>
        )}

        {notebook.badge && (
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold shadow-md">
            {notebook.badge}
          </span>
        )}
        {notebook.isComingSoon && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-extrabold shadow-md">
            قريبًا / حجز مسبق
          </span>
        )}
        {notebook.pages > 0 && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-[11px] font-bold backdrop-blur-sm">
            {notebook.pages} صفحة
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <p className="text-[11px] font-bold text-slate-400 mb-1">
            {notebook.category} • {notebook.grade}
          </p>
          <h3
            onClick={() => onPreview(notebook)}
            className="font-extrabold text-base text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-2 transition"
          >
            {notebook.title}
          </h3>
          {notebook.description && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{notebook.description}</p>
          )}
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-blue-600">{notebook.price} ج.م</span>
              {notebook.oldPrice > notebook.price && (
                <span className="text-xs text-slate-400 line-through font-bold">{notebook.oldPrice} ج.م</span>
              )}
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
              {notebook.subject}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOrderNow(notebook)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {notebook.isComingSoon ? 'حجز مسبق' : 'اطلب الآن'}
            </button>
            <button
              onClick={() => onPreview(notebook)}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              معاينة
            </button>
            {enableCart && (
              <button
                onClick={() => onAddToCart(notebook)}
                title={isInCart ? 'مضافة في السلة' : 'أضف للسلة'}
                className={`p-2.5 rounded-xl border transition ${
                  isInCart
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {isInCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. صفحة الكتالوج بنظام المجلدات المتدرجة (القسم -> المرحلة -> الصف -> المذكرات)
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

  const visibleNotebooks = useMemo(() => notebooks.filter((n) => !n.isHidden), [notebooks]);

  const selectedCategory = navState.category || '';
  const selectedStage = navState.stage || '';
  const selectedGrade = navState.grade || '';

  // البحث الفوري يتجاوز التدرج لعرض النتائج مباشرة
  const isSearching = Boolean(searchQuery.trim() || subjectFilter);

  const searchResults = useMemo(() => {
    return visibleNotebooks.filter((n) => {
      if (selectedCategory && n.category !== selectedCategory) return false;
      if (selectedStage && n.stage !== selectedStage) return false;
      if (selectedGrade && n.grade !== selectedGrade) return false;
      if (subjectFilter && n.subject !== subjectFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${n.title} ${n.grade} ${n.stage} ${n.subject} ${n.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visibleNotebooks, selectedCategory, selectedStage, selectedGrade, subjectFilter, searchQuery]);

  const gradesForStage = useMemo(() => {
    if (!selectedStage) return [];
    return settings.stageGrades?.[selectedStage] || [];
  }, [selectedStage, settings.stageGrades]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* شريط البحث والتصفية السريع */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المذكرة، المادة، أو الصف الدراسي..."
              className="w-full pr-12 pl-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="md:col-span-4">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-white font-bold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="">كل المواد الدراسية</option>
              {settings.subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* مسار التنقل (Breadcrumbs) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
          <div className="flex flex-wrap items-center gap-1.5 text-slate-600">
            <button
              onClick={() => onNavigateCatalog({ category: '', stage: '', grade: '' })}
              className={`px-2.5 py-1 rounded-lg transition ${!selectedCategory ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
            >
              جميع الأقسام
            </button>
            {selectedCategory && (
              <>
                <span className="text-slate-400">/</span>
                <button
                  onClick={() => onNavigateCatalog({ category: selectedCategory, stage: '', grade: '' })}
                  className={`px-2.5 py-1 rounded-lg transition ${!selectedStage ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
                >
                  {selectedCategory}
                </button>
              </>
            )}
            {selectedStage && (
              <>
                <span className="text-slate-400">/</span>
                <button
                  onClick={() => onNavigateCatalog({ category: selectedCategory, stage: selectedStage, grade: '' })}
                  className={`px-2.5 py-1 rounded-lg transition ${!selectedGrade ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
                >
                  {selectedStage}
                </button>
              </>
            )}
            {selectedGrade && (
              <>
                <span className="text-slate-400">/</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white">{selectedGrade}</span>
              </>
            )}
          </div>

          {(selectedCategory || selectedStage || selectedGrade) && (
            <button
              onClick={() => {
                if (selectedGrade) onNavigateCatalog({ category: selectedCategory, stage: selectedStage, grade: '' });
                else if (selectedStage) onNavigateCatalog({ category: selectedCategory, stage: '', grade: '' });
                else onNavigateCatalog({ category: '', stage: '', grade: '' });
              }}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-xl bg-blue-50"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              رجوع خطوة
            </button>
          )}
        </div>
      </div>

      {/* العرض حسب حالة البحث أو مستوى المجلد */}
      {isSearching ? (
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-800">
            نتائج البحث والتصفية ({searchResults.length})
          </h2>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((nb) => (
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
          ) : (
            <EmptySectionBox settings={settings} onRequestPreOrder={onRequestPreOrder} />
          )}
        </div>
      ) : !selectedCategory ? (
        /* المستوى 1: مجلدات الأقسام الرئيسية بتصميم واضح بدون تداخل للنصوص */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {settings.categories.map((cat) => {
            const count = visibleNotebooks.filter((n) => n.category === cat).length;
            const bgImg = settings.categoryImages?.[cat];
            return (
              <button
                key={cat}
                onClick={() => onNavigateCatalog({ category: cat, stage: '', grade: '' })}
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
                      <Folder className="w-7 h-7" />
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-black">
                      {count} مذكرة
                    </span>
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between w-full bg-white">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition">{cat}</h3>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs font-extrabold text-blue-600">
                    <span>افتح مجلدات المراحل الدراسية</span>
                    <span>←</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : !selectedStage ? (
        /* المستوى 2: مجلدات المراحل الدراسية داخل القسم المختار */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {settings.stages.map((st) => {
            const count = visibleNotebooks.filter((n) => n.category === selectedCategory && n.stage === st).length;
            return (
              <button
                key={st}
                onClick={() => onNavigateCatalog({ category: selectedCategory, stage: st, grade: '' })}
                className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-xl transition text-right group flex flex-col justify-between min-h-[160px]"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold">
                    {count} مذكرة
                  </span>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition">{st}</h3>
                  <p className="text-xs text-slate-500 mt-1">اضغط لعرض صفوف {st}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : !selectedGrade ? (
        /* المستوى 3: مجلدات الصفوف الدراسية المخصصة للمرحلة المختارة */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gradesForStage.map((gr) => {
            const count = visibleNotebooks.filter(
              (n) => n.category === selectedCategory && n.stage === selectedStage && n.grade === gr
            ).length;
            return (
              <button
                key={gr}
                onClick={() => onNavigateCatalog({ category: selectedCategory, stage: selectedStage, grade: gr })}
                className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition text-right group flex flex-col justify-between min-h-[155px]"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold">
                    {count} مذكرة
                  </span>
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition">{gr}</h3>
                  <p className="text-xs text-slate-500 mt-1">اضغط لعرض جميع مذكرات {gr}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* المستوى 4: المذكرات داخل الصف الدراسي المختار */
        <div>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((nb) => (
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
          ) : (
            <EmptySectionBox settings={settings} onRequestPreOrder={onRequestPreOrder} />
          )}
        </div>
      )}
    </div>
  );
}

function EmptySectionBox({ settings, onRequestPreOrder }) {
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 max-w-2xl mx-auto my-6 space-y-4">
      {settings.emptyStateImage ? (
        <img src={settings.emptyStateImage} alt="" className="max-h-48 mx-auto rounded-2xl object-contain" />
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-xl font-black text-slate-900">{settings.emptyStateTitle}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{settings.emptyStateDesc}</p>
      <button
        onClick={onRequestPreOrder}
        className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/20 transition"
      >
        {settings.emptyStateCta}
      </button>
    </div>
  );
}

// ============================================================================
// 8. صفحة العروض والباقات (تتيح للزائر طلب مجموعات المذكرات بخصم فوري)
// ============================================================================
function OffersAndBundlesPage({ notebooks, settings, coupons, onOrderBundle, onNotify }) {
  const activePublicCoupons = useMemo(
    () => coupons.filter((c) => c.active !== false && !c.singleUse),
    [coupons]
  );
  const activeBundles = useMemo(
    () => (settings.bundles || []).filter((b) => b.active !== false),
    [settings.bundles]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
          عروض وباقات التوفير للمعلمين
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
          باقات المذكرات المجمعة وكوبونات الخصم
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          اطلب مجموعة مذكرات معًا واحصل على خصم فوري تلقائي، أو استخدم كوبونات الخصم المتاحة
        </p>
      </div>

      {/* قسم الباقات والمجموعات */}
      {activeBundles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            باقات المذكرات المحددة بخصم خاص
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeBundles.map((bundle) => {
              const includedNotebooks = notebooks.filter((n) => (bundle.notebookIds || []).includes(n.id));
              const originalSum = includedNotebooks.reduce((s, n) => s + (Number(n.price) || 0), 0);
              const discountAmount =
                bundle.discountType === 'fixed'
                  ? Math.min(originalSum, Number(bundle.discountValue) || 0)
                  : Math.round((originalSum * (Number(bundle.discountValue) || 0)) / 100);
              const finalBundlePrice = Math.max(0, originalSum - discountAmount);

              return (
                <div
                  key={bundle.id}
                  className="bg-white rounded-3xl p-6 border-2 border-blue-100 shadow-sm hover:shadow-xl transition flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-lg font-black text-slate-900">{bundle.title}</h4>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black shrink-0">
                        خصم{' '}
                        {bundle.discountType === 'fixed'
                          ? `${bundle.discountValue} ج.م`
                          : `${bundle.discountValue}%`}
                      </span>
                    </div>
                    {bundle.description && <p className="text-xs text-slate-500">{bundle.description}</p>}

                    <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2">
                      <p className="text-xs font-extrabold text-slate-700">
                        المذكرات المشمولة في الباقة ({includedNotebooks.length}):
                      </p>
                      {includedNotebooks.map((nb) => (
                        <div key={nb.id} className="flex items-center justify-between text-xs text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {nb.title} ({nb.grade})
                          </span>
                          <span className="font-bold text-slate-500">{nb.price} ج.م</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-400 line-through block">{originalSum} ج.م</span>
                      <span className="text-2xl font-black text-blue-600">{finalBundlePrice} ج.م</span>
                    </div>
                    <button
                      onClick={() => onOrderBundle(includedNotebooks)}
                      disabled={includedNotebooks.length === 0}
                      className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      اطلب الباقة كاملة بالخصم
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* قسم الكوبونات العامة المتاحة */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
          <Tag className="w-5 h-5 text-amber-600" />
          كوبونات الخصم العامة المتاحة حاليًا
        </h3>
        {activePublicCoupons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activePublicCoupons.map((cp) => (
              <div
                key={cp.id}
                className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div>
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                    خصم {cp.discountType === 'fixed' ? `${cp.discountValue} ج.م` : `${cp.discountValue}%`}
                  </span>
                  <h4 className="font-extrabold text-base mt-3">{cp.title || 'كوبون خصم عام على جميع المذكرات'}</h4>
                  {cp.expiresAt && <p className="text-xs text-slate-400 mt-1">ساري حتى: {cp.expiresAt}</p>}
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-2xl p-3 border border-white/10">
                  <code className="font-black text-base tracking-widest text-amber-300">{cp.code}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(cp.code);
                      onNotify(`تم نسخ الكود (${cp.code})!`, 'success');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs hover:bg-amber-300 transition"
                  >
                    نسخ الكود
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-sm text-slate-500">
            لا توجد كوبونات عامة نشطة حاليًا، تابعنا باستمرار أو احصل على كود خصم فوري عند إتمام أي طلب!
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 9. لوحة التحكم الشاملة للمدير (إدارة المذكرات + الكوبونات + الباقات + الإعدادات)
// ============================================================================
function AdminPortal({
  adminUser,
  settings,
  notebooks,
  orders,
  coupons,
  onSaveSettings,
  onClosePortal,
  onLogout,
  onNotify
}) {
  const [activeTab, setActiveTab] = useState('notebooks');
  const [localSettings, setLocalSettings] = useState(() => normalizeSettings(settings));
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setLocalSettings(normalizeSettings(settings));
  }, [settings]);

  // حالة نموذج المذكرة (إضافة / تعديل)
  const [editingNotebookId, setEditingNotebookId] = useState(null);
  const [nbForm, setNbForm] = useState({
    title: '',
    category: settings.categories[0] || 'مذكرات الترم الأول',
    stage: settings.stages[0] || 'المرحلة الابتدائية',
    grade: (settings.stageGrades?.[settings.stages[0]] || [])[0] || '',
    subject: settings.subjects[0] || 'اللغة العربية',
    price: 100,
    oldPrice: 150,
    pages: 60,
    badge: '',
    description: '',
    customNotice: '',
    driveUrl: '',
    coverUrl: '',
    sampleUrls: [],
    isComingSoon: false,
    isHidden: false
  });
  const [savingNb, setSavingNb] = useState(false);

  // حالة نموذج الكوبونات (عام أو شخصي لمرة واحدة)
  const [cpForm, setCpForm] = useState({
    title: '',
    code: '',
    discountType: 'percent',
    discountValue: 15,
    singleUse: false,
    maxUses: 0,
    expiresAt: ''
  });

  // حالة نموذج باقات/مجموعات الخصم
  const [bundleForm, setBundleForm] = useState({
    title: '',
    description: '',
    discountType: 'percent',
    discountValue: 20,
    notebookIds: []
  });

  // حالة إدارة الأقسام والمراحل والصفوف والمواد
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [selectedStageForGrades, setSelectedStageForGrades] = useState(localSettings.stages[0] || '');
  const [newGradeName, setNewGradeName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  // حالة إضافة خبر جديد
  const [newsForm, setNewsForm] = useState({ badge: 'خبر جديد', title: '', content: '', color: 'blue' });

  // حفظ الإعدادات في السحابة والذاكرة المحلية
  const persistSettings = async (updatedObj) => {
    setSavingSettings(true);
    try {
      const normalized = normalizeSettings(updatedObj);
      setLocalSettings(normalized);
      localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(normalized));
      await setDoc(publicDoc('config', 'main'), normalized, { merge: true });
      onSaveSettings(normalized);
      onNotify('تم حفظ جميع الإعدادات ومزامنتها مع السحابة بنجاح!', 'success');
    } catch (err) {
      onNotify(`تعذر حفظ الإعدادات: ${err?.message || 'تأكد من صلاحيات Firestore'}`, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // معالجة رفع غلاف المذكرة وصفحات العينة
  const handleCoverUpload = async (file) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 850, 0.8);
      setNbForm((prev) => ({ ...prev, coverUrl: compressed }));
      onNotify('تم تجهيز صورة الغلاف بنجاح', 'success');
    } catch {
      onNotify('تعذر معالجة صورة الغلاف', 'error');
    }
  };

  const handleSamplesUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    try {
      const files = Array.from(fileList).slice(0, 15);
      const compressedList = [];
      for (const f of files) {
        const c = await compressImageFile(f, 950, 0.78);
        compressedList.push(c);
      }
      setNbForm((prev) => ({ ...prev, sampleUrls: compressedList }));
      onNotify(`تم تجهيز ${compressedList.length} صفحة عينة بنجاح`, 'success');
    } catch {
      onNotify('تعذر معالجة صور العينات', 'error');
    }
  };

  const handleSaveNotebook = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim()) {
      onNotify('يرجى إدخال عنوان المذكرة', 'error');
      return;
    }
    setSavingNb(true);
    try {
      // فصل العينات الكبيرة في مستند مستقل لضمان بقاء مستند المذكرة خفيفًا وسريعًا
      const coreData = {
        title: nbForm.title.trim(),
        category: nbForm.category,
        stage: nbForm.stage,
        grade: nbForm.grade,
        subject: nbForm.subject,
        price: Number(nbForm.price) || 0,
        oldPrice: Number(nbForm.oldPrice) || 0,
        pages: Number(nbForm.pages) || 0,
        badge: nbForm.badge.trim(),
        description: nbForm.description.trim(),
        customNotice: nbForm.customNotice.trim(),
        driveUrl: nbForm.driveUrl.trim(),
        coverUrl: nbForm.coverUrl,
        sampleUrls: nbForm.sampleUrls.slice(0, 3),
        isComingSoon: Boolean(nbForm.isComingSoon),
        isHidden: Boolean(nbForm.isHidden),
        updatedAt: serverTimestamp()
      };

      let targetId = editingNotebookId;
      if (editingNotebookId) {
        await updateDoc(publicDoc('notebooks', editingNotebookId), coreData);
      } else {
        coreData.createdAt = serverTimestamp();
        const createdRef = await addDoc(publicCol('notebooks'), coreData);
        targetId = createdRef.id;
      }

      if (targetId && nbForm.sampleUrls.length > 0) {
        await setDoc(publicDoc('notebook_samples', targetId), {
          sampleUrls: nbForm.sampleUrls,
          updatedAt: serverTimestamp()
        });
      }

      onNotify(editingNotebookId ? 'تم تحديث بيانات المذكرة بنجاح!' : 'تمت إضافة المذكرة بنجاح!', 'success');
      setEditingNotebookId(null);
      setNbForm({
        title: '',
        category: localSettings.categories[0] || 'مذكرات الترم الأول',
        stage: localSettings.stages[0] || 'المرحلة الابتدائية',
        grade: (localSettings.stageGrades?.[localSettings.stages[0]] || [])[0] || '',
        subject: localSettings.subjects[0] || 'اللغة العربية',
        price: 100,
        oldPrice: 150,
        pages: 60,
        badge: '',
        description: '',
        customNotice: '',
        driveUrl: '',
        coverUrl: '',
        sampleUrls: [],
        isComingSoon: false,
        isHidden: false
      });
    } catch (err) {
      onNotify(`تعذر حفظ المذكرة: ${err?.message || 'خطأ في الصلاحيات'}`, 'error');
    } finally {
      setSavingNb(false);
    }
  };

  const startEditNotebook = async (nb) => {
    setEditingNotebookId(nb.id);
    let fullSamples = nb.sampleUrls || [];
    try {
      const snap = await getDoc(publicDoc('notebook_samples', nb.id));
      if (snap.exists() && Array.isArray(snap.data().sampleUrls)) {
        fullSamples = snap.data().sampleUrls;
      }
    } catch {}
    setNbForm({
      title: nb.title,
      category: nb.category,
      stage: nb.stage,
      grade: nb.grade,
      subject: nb.subject,
      price: nb.price,
      oldPrice: nb.oldPrice,
      pages: nb.pages,
      badge: nb.badge || '',
      description: nb.description || '',
      customNotice: nb.customNotice || '',
      driveUrl: nb.driveUrl || '',
      coverUrl: nb.coverUrl || '',
      sampleUrls: fullSamples,
      isComingSoon: Boolean(nb.isComingSoon),
      isHidden: Boolean(nb.isHidden)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleNotebookVisibility = async (nb) => {
    try {
      await updateDoc(publicDoc('notebooks', nb.id), { isHidden: !nb.isHidden });
      onNotify(nb.isHidden ? 'تم إظهار المذكرة للزوار' : 'تم إخفاء المذكرة مؤقتًا عن الزوار', 'success');
    } catch (err) {
      onNotify(`تعذر تحديث الحالة: ${err?.message}`, 'error');
    }
  };

  const toggleWhatsNewManual = (nbId) => {
    const current = new Set(localSettings.whatsNewSelectedIds || []);
    if (current.has(nbId)) current.delete(nbId);
    else current.add(nbId);
    persistSettings({ ...localSettings, whatsNewMode: 'manual', whatsNewSelectedIds: Array.from(current) });
  };

  // إنشاء كوبون جديد (عام أو شخصي لمرة واحدة)
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    const finalCode = (cpForm.code.trim() || generateUniqueCouponCode(cpForm.singleUse ? 'VIP' : 'SALE')).toUpperCase();
    try {
      await addDoc(publicCol('coupons'), {
        title: cpForm.title.trim() || (cpForm.singleUse ? 'كوبون شخصي لمرة واحدة' : 'كوبون خصم عام'),
        code: finalCode,
        discountType: cpForm.discountType,
        discountValue: Number(cpForm.discountValue) || 10,
        singleUse: Boolean(cpForm.singleUse),
        used: false,
        usedCount: 0,
        maxUses: cpForm.singleUse ? 1 : Number(cpForm.maxUses) || 0,
        expiresAt: cpForm.expiresAt || '',
        active: true,
        createdAt: serverTimestamp()
      });
      setCpForm({
        title: '',
        code: '',
        discountType: 'percent',
        discountValue: 15,
        singleUse: false,
        maxUses: 0,
        expiresAt: ''
      });
      onNotify(`تم إنشاء الكوبون (${finalCode}) بنجاح!`, 'success');
    } catch (err) {
      onNotify(`تعذر إنشاء الكوبون: ${err?.message}`, 'error');
    }
  };

  // إضافة باقة/مجموعة مذكرات بخصم محدد
  const handleCreateBundle = (e) => {
    e.preventDefault();
    if (!bundleForm.title.trim() || bundleForm.notebookIds.length < 2) {
      onNotify('اكتب اسم الباقة واختر مذكرتين على الأقل لتطبيق خصم المجموعة', 'error');
      return;
    }
    const newBundle = {
      id: `bnd-${Date.now()}`,
      title: bundleForm.title.trim(),
      description: bundleForm.description.trim(),
      discountType: bundleForm.discountType,
      discountValue: Number(bundleForm.discountValue) || 15,
      notebookIds: bundleForm.notebookIds,
      active: true
    };
    const updatedBundles = [...(localSettings.bundles || []), newBundle];
    persistSettings({ ...localSettings, bundles: updatedBundles });
    setBundleForm({ title: '', description: '', discountType: 'percent', discountValue: 20, notebookIds: [] });
  };

  // تحريك عنصر في مصفوفة لأعلى أو لأسفل
  const moveArrayItem = (arr, index, dir) => {
    const copy = [...arr];
    const target = index + dir;
    if (target < 0 || target >= copy.length) return copy;
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
  };

  // تنزيل واستعادة نسخة احتياطية JSON
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

  const handleImportBackup = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.settings) {
          await persistSettings(parsed.settings);
        }
        onNotify('تمت استعادة الإعدادات من النسخة الاحتياطية بنجاح!', 'success');
      } catch {
        onNotify('ملف النسخة الاحتياطية غير صالح', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 pb-16">
      {/* الشريط العلوي للوحة التحكم */}
      <div className="bg-slate-950 text-white px-4 sm:px-8 py-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg">لوحة تحكم {localSettings.siteName}</h1>
              <p className="text-xs text-slate-400">{adminUser?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClosePortal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Eye className="w-4 h-4 text-blue-400" />
              معاينة الموقع
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>
      </div>

      {/* تنبيه مهم للمدير إذا كان الربط محفوظًا في المتصفح فقط وليس في متغيرات Vercel */}
      {!isUsingEnvConfig && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-5">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                تنبيه هام: لكي تظهر المذكرات والتغييرات لجميع العملاء على الهواتف تلقائيًا
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                أنت حاليًا متصل عبر متصفحك فقط. افتح مشروعك في <strong>Vercel ← Settings ← Environment Variables</strong> وأضف المتغير{' '}
                <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">VITE_FIREBASE_API_KEY</code> بقيمة{' '}
                <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">{firebaseConfig.apiKey || 'AIzaSy...'}</code> ثم اضغط <strong>Redeploy</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* أزرار التبويبات الرئيسية */}
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-200 flex flex-wrap gap-2">
          {[
            { id: 'notebooks', label: `المذكرات (${notebooks.length})`, icon: BookOpen },
            { id: 'orders', label: `الطلبات (${orders.length})`, icon: ShoppingCart },
            { id: 'coupons', label: 'الكوبونات وخصم المجموعات', icon: Percent },
            { id: 'taxonomy', label: 'الأقسام والمراحل والصفوف', icon: Layers },
            { id: 'settings', label: 'إعدادات الموقع والمظهر وطلب العميل', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition ${
                  active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ===================================================================== */}
        {/* التبويب 1: إدارة المذكرات (إضافة / تعديل / إظهار وإخفاء / تثبيت في ما الجديد) */}
        {/* ===================================================================== */}
        {activeTab === 'notebooks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* نموذج إضافة أو تعديل مذكرة */}
            <form
              onSubmit={handleSaveNotebook}
              className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4 h-fit"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">
                  {editingNotebookId ? 'تعديل بيانات المذكرة' : 'إضافة مذكرة جديدة'}
                </h2>
                {editingNotebookId && (
                  <button
                    type="button"
                    onClick={() => setEditingNotebookId(null)}
                    className="text-xs text-rose-600 font-bold"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              <input
                type="text"
                required
                placeholder="عنوان المذكرة..."
                value={nbForm.title}
                onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold"
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={nbForm.category}
                  onChange={(e) => setNbForm({ ...nbForm, category: e.target.value })}
                  className="px-3 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {localSettings.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={nbForm.stage}
                  onChange={(e) => {
                    const st = e.target.value;
                    const firstGrade = (localSettings.stageGrades?.[st] || [])[0] || '';
                    setNbForm({ ...nbForm, stage: st, grade: firstGrade });
                  }}
                  className="px-3 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {localSettings.stages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={nbForm.grade}
                  onChange={(e) => setNbForm({ ...nbForm, grade: e.target.value })}
                  className="px-3 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {(localSettings.stageGrades?.[nbForm.stage] || []).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                <select
                  value={nbForm.subject}
                  onChange={(e) => setNbForm({ ...nbForm, subject: e.target.value })}
                  className="px-3 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {localSettings.subjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">السعر الحالي</label>
                  <input
                    type="number"
                    value={nbForm.price}
                    onChange={(e) => setNbForm({ ...nbForm, price: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">قبل الخصم</label>
                  <input
                    type="number"
                    value={nbForm.oldPrice}
                    onChange={(e) => setNbForm({ ...nbForm, oldPrice: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">الصفحات</label>
                  <input
                    type="number"
                    value={nbForm.pages}
                    onChange={(e) => setNbForm({ ...nbForm, pages: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
              </div>

              <input
                type="text"
                placeholder="شارة التميز (مثال: الأكثر طلبًا / مطابق لأحدث المواصفات)"
                value={nbForm.badge}
                onChange={(e) => setNbForm({ ...nbForm, badge: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold"
              />

              <textarea
                rows={3}
                placeholder="وصف المذكرة ومميزاتها..."
                value={nbForm.description}
                onChange={(e) => setNbForm({ ...nbForm, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs"
              />

              <input
                type="text"
                placeholder="تنبيه خاص يظهر داخل صفحة هذه المذكرة فقط (اختياري)..."
                value={nbForm.customNotice}
                onChange={(e) => setNbForm({ ...nbForm, customNotice: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-amber-300 bg-amber-50/50 text-xs"
              />

              <label className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 px-4 py-3 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={nbForm.isComingSoon}
                  onChange={(e) => setNbForm({ ...nbForm, isComingSoon: e.target.checked })}
                  className="w-4 h-4 accent-amber-600"
                />
                <span className="text-xs font-extrabold text-amber-900">
                  المذكرة قيد التجهيز (وضع إعلان «قريبًا / حجز مسبق» وإظهارها في الأخبار)
                </span>
              </label>

              <input
                type="url"
                placeholder="رابط Google Drive لمعاينة إضافية (اختياري)"
                value={nbForm.driveUrl}
                onChange={(e) => setNbForm({ ...nbForm, driveUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs text-left"
                dir="ltr"
              />

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="border border-dashed border-slate-300 rounded-2xl p-3 text-center">
                  <label className="text-xs font-extrabold text-slate-700 block mb-1.5">صورة غلاف المذكرة</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                    className="text-[11px] w-full"
                  />
                  {nbForm.coverUrl && (
                    <img src={nbForm.coverUrl} alt="cover" className="h-16 mx-auto mt-2 rounded-lg object-cover" />
                  )}
                </div>

                <div className="border border-dashed border-slate-300 rounded-2xl p-3 text-center">
                  <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                    صفحات العينة (حتى 15 صفحة)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleSamplesUpload(e.target.files)}
                    className="text-[11px] w-full"
                  />
                  {nbForm.sampleUrls.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 block mt-2">
                      تم تجهيز {nbForm.sampleUrls.length} صفحة
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={savingNb}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/20 transition"
              >
                {savingNb ? 'جاري الحفظ...' : editingNotebookId ? 'حفظ التعديلات' : '+ إضافة المذكرة'}
              </button>
            </form>

            {/* قائمة المذكرات المنشورة والمخفية */}
            <div className="lg:col-span-7 space-y-3">
              {notebooks.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-sm text-slate-500">
                  لم تقم بإضافة أي مذكرات بعد. أضف أول مذكرة من النموذج الجانبي!
                </div>
              ) : (
                notebooks.map((nb) => {
                  const isPinnedNew = (localSettings.whatsNewSelectedIds || []).includes(nb.id);
                  return (
                    <div
                      key={nb.id}
                      className={`bg-white rounded-3xl p-4 border shadow-sm flex flex-wrap items-center justify-between gap-4 ${
                        nb.isHidden ? 'border-amber-300 bg-amber-50/30 opacity-80' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {nb.coverUrl ? (
                          <img src={nb.coverUrl} alt="" className="w-14 h-16 rounded-xl object-cover shrink-0 border" />
                        ) : (
                          <div className="w-14 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="font-extrabold text-sm text-slate-900 truncate">{nb.title}</h3>
                            {nb.isHidden && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">
                                مخفية عن الزوار
                              </span>
                            )}
                            {nb.isComingSoon && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black">
                                قيد التجهيز
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {nb.category} • {nb.grade} • <strong className="text-blue-600">{nb.price} ج.م</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleWhatsNewManual(nb.id)}
                          title="تثبيت/إزالة في قسم ما الجديد بالصفحة الرئيسية"
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition ${
                            isPinnedNew
                              ? 'bg-amber-100 border-amber-300 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                          ما الجديد
                        </button>

                        <button
                          onClick={() => toggleNotebookVisibility(nb)}
                          title={nb.isHidden ? 'إظهار للزوار' : 'إخفاء مؤقت عن الزوار'}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                            nb.isHidden
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {nb.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          {nb.isHidden ? 'إظهار' : 'إخفاء'}
                        </button>

                        <button
                          onClick={() => startEditNotebook(nb)}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          title="تعديل"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={async () => {
                            await deleteDoc(publicDoc('notebooks', nb.id));
                            onNotify('تم حذف المذكرة نهائيًا', 'success');
                          }}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                          title="حذف نهائي"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* التبويب 2: إدارة الطلبات                                              */}
        {/* ===================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-sm text-slate-500">
                لا توجد طلبات مسجلة حتى الآن.
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
                        {ord.orderNumber}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">{ord.teacherName}</span>
                      <span className="text-xs text-slate-500">({ord.phone})</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <strong>المذكرات:</strong>{' '}
                      {(ord.items || []).map((i) => `${i.title} (${i.grade})`).join(' + ')}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-black text-emerald-700">الإجمالي: {ord.totalPrice} ج.م</span>
                      {ord.couponCode && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          استخدم كوبون: {ord.couponCode} (-{ord.couponDiscount} ج.م)
                        </span>
                      )}
                      {ord.nextOrderCouponCode && (
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                          كوبون هديته القادمة: {ord.nextOrderCouponCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={ord.status || 'new'}
                      onChange={async (e) => {
                        await updateDoc(publicDoc('orders', ord.id), { status: e.target.value });
                        onNotify('تم تحديث حالة الطلب', 'success');
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="new">طلب جديد</option>
                      <option value="processing">جاري التجهيز</option>
                      <option value="completed">مكتمل وتم التسليم</option>
                    </select>
                    <button
                      onClick={async () => {
                        await deleteDoc(publicDoc('orders', ord.id));
                        onNotify('تم حذف سجل الطلب', 'success');
                      }}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* التبويب 3: الكوبونات العامة + مكافأة الطلب القادم + خصم مجموعات المذكرات */}
        {/* ===================================================================== */}
        {activeTab === 'coupons' && (
          <div className="space-y-8">
            {/* القسم أ: إعدادات مكافأة الطلب القادم الفريدة لكل عميل */}
            <div className="bg-gradient-to-l from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      مكافأة الطلب القادم (كوبون فريد لكل عميل × استخدام لمرة واحدة فقط)
                    </h3>
                    <p className="text-xs text-slate-600">
                      عند إتمام أي عميل لطلبه، يولّد النظام تلقائيًا كود خصم خاصًا ومختلفًا له وحده، ويُحرق الكود فور استخدامه في طلبه التالي.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.nextOrderRewardEnabled}
                    onChange={(e) =>
                      persistSettings({ ...localSettings, nextOrderRewardEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-amber-600"
                  />
                  <span className="text-xs font-extrabold text-slate-800">
                    {localSettings.nextOrderRewardEnabled ? 'مفعّلة حاليًا' : 'متوقفة حاليًا'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">نسبة الخصم على الطلب القادم (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={localSettings.nextOrderRewardPercent}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, nextOrderRewardPercent: Number(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-300 bg-white text-sm font-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">عنوان رسالة المكافأة للعميل</label>
                  <input
                    type="text"
                    value={localSettings.nextOrderRewardTitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, nextOrderRewardTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-300 bg-white text-sm font-bold"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => persistSettings(localSettings)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition"
                  >
                    حفظ إعدادات مكافأة الطلب القادم
                  </button>
                </div>
              </div>
            </div>

            {/* القسم ب: إنشاء وإدارة الكوبونات العامة والكوبونات الشخصية اليدوية */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleCreateCoupon}
                className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 space-y-4 h-fit"
              >
                <h3 className="text-lg font-black text-slate-900">إنشاء كوبون خصم جديد</h3>

                <input
                  type="text"
                  placeholder="وصف الكوبون (مثال: خصم بداية الترم لجميع المذكرات)"
                  value={cpForm.title}
                  onChange={(e) => setCpForm({ ...cpForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="كود الكوبون (مثال: WELCOME15)"
                    value={cpForm.code}
                    onChange={(e) => setCpForm({ ...cpForm, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-black uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => setCpForm({ ...cpForm, code: generateUniqueCouponCode('VIP') })}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                  >
                    توليد تلقائي
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">نوع الخصم</label>
                    <select
                      value={cpForm.discountType}
                      onChange={(e) => setCpForm({ ...cpForm, discountType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="percent">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ ثابت (ج.م)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">قيمة الخصم</label>
                    <input
                      type="number"
                      min={1}
                      value={cpForm.discountValue}
                      onChange={(e) => setCpForm({ ...cpForm, discountValue: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-black"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cpForm.singleUse}
                    onChange={(e) => setCpForm({ ...cpForm, singleUse: e.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-xs font-extrabold text-slate-800">
                    كوبون شخصي لمرة واحدة فقط (يُغلق تلقائيًا بعد أول استخدام)
                  </span>
                </label>

                {!cpForm.singleUse && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        الحد الأقصى للاستخدام (0 = مفتوح)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={cpForm.maxUses}
                        onChange={(e) => setCpForm({ ...cpForm, maxUses: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">تاريخ الانتهاء (اختياري)</label>
                      <input
                        type="date"
                        value={cpForm.expiresAt}
                        onChange={(e) => setCpForm({ ...cpForm, expiresAt: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition"
                >
                  + إنشاء الكوبون الآن
                </button>
              </form>

              {/* قائمة الكوبونات الموجودة */}
              <div className="lg:col-span-7 space-y-3">
                <h3 className="text-base font-black text-slate-800">الكوبونات المسجلة ({coupons.length})</h3>
                {coupons.map((cp) => (
                  <div
                    key={cp.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="px-3 py-1 rounded-lg bg-slate-900 text-amber-300 font-black text-sm">
                          {cp.code}
                        </code>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold">
                          خصم {cp.discountType === 'fixed' ? `${cp.discountValue} ج.م` : `${cp.discountValue}%`}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            cp.singleUse ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {cp.singleUse ? 'شخصي × مرة واحدة' : 'كوبون عام'}
                        </span>
                        {cp.used && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black">
                            تم استخدامه
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {cp.title} • مرات الاستخدام: {cp.usedCount || 0}
                        {cp.issuedForName ? ` • صادر للعميل: ${cp.issuedForName} (${cp.issuedForPhone})` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          await updateDoc(publicDoc('coupons', cp.id), { active: cp.active === false });
                          onNotify('تم تحديث حالة الكوبون', 'success');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                          cp.active === false ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {cp.active === false ? 'تفعيل' : 'إيقاف'}
                      </button>
                      <button
                        onClick={async () => {
                          await deleteDoc(publicDoc('coupons', cp.id));
                          onNotify('تم حذف الكوبون', 'success');
                        }}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* القسم ج: خصم مجموعات وباقات المذكرات المحددة */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  إعداد خصم عند طلب مجموعة مذكرات محددة (باقات التوفير)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  اختر مجموعة مذكرات محددة، وعندما يطلبها العميل معًا يُطبَّق الخصم تلقائيًا في السلة وتظهر الباقة في صفحة العروض.
                </p>
              </div>

              <form onSubmit={handleCreateBundle} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="اسم الباقة (مثال: باقة التفوق للصف الأول الإعدادي)"
                    value={bundleForm.title}
                    onChange={(e) => setBundleForm({ ...bundleForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="وصف مختصر للباقة..."
                    value={bundleForm.description}
                    onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={bundleForm.discountType}
                      onChange={(e) => setBundleForm({ ...bundleForm, discountType: e.target.value })}
                      className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="percent">خصم نسبة مئوية (%)</option>
                      <option value="fixed">خصم مبلغ ثابت (ج.م)</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={bundleForm.discountValue}
                      onChange={(e) => setBundleForm({ ...bundleForm, discountValue: Number(e.target.value) })}
                      className="px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-black"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition"
                  >
                    + حفظ الباقة وتفعيل خصم المجموعة
                  </button>
                </div>

                <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <p className="text-xs font-extrabold text-slate-700 mb-2">
                    حدد المذكرات المشمولة في هذه الباقة ({bundleForm.notebookIds.length} مختارة):
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
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
                              onChange={() => {
                                const set = new Set(bundleForm.notebookIds);
                                if (set.has(nb.id)) set.delete(nb.id);
                                else set.add(nb.id);
                                setBundleForm({ ...bundleForm, notebookIds: Array.from(set) });
                              }}
                              className="w-4 h-4 accent-blue-600"
                            />
                            <span>
                              {nb.title} ({nb.grade})
                            </span>
                          </div>
                          <span className="text-blue-600 font-bold">{nb.price} ج.م</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </form>

              {/* قائمة الباقات المحفوظة */}
              {(localSettings.bundles || []).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  {(localSettings.bundles || []).map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{b.title}</h4>
                        <p className="text-xs text-slate-500">
                          تشمل {(b.notebookIds || []).length} مذكرات • خصم{' '}
                          {b.discountType === 'fixed' ? `${b.discountValue} ج.م` : `${b.discountValue}%`}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const filtered = (localSettings.bundles || []).filter((item) => item.id !== b.id);
                          persistSettings({ ...localSettings, bundles: filtered });
                        }}
                        className="p-2 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* التبويب 4: الأقسام الرئيسية وخلفياتها + المراحل والصفوف المخصصة + المواد */}
        {/* ===================================================================== */}
        {activeTab === 'taxonomy' && (
          <div className="space-y-6">
            {/* الأقسام الرئيسية وصور خلفياتها */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-black text-slate-900">الأقسام الرئيسية وصور خلفياتها</h3>
                <button
                  onClick={() => persistSettings(localSettings)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs"
                >
                  حفظ التغييرات
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="اسم قسم جديد (مثال: مراجعات ليلة الامتحان)..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCategoryName.trim()) return;
                    setLocalSettings({
                      ...localSettings,
                      categories: [...localSettings.categories, newCategoryName.trim()]
                    });
                    setNewCategoryName('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  + إضافة قسم
                </button>
              </div>

              <div className="space-y-2.5">
                {localSettings.categories.map((cat, idx) => (
                  <div
                    key={cat}
                    className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            categories: moveArrayItem(localSettings.categories, idx, -1)
                          })
                        }
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            categories: moveArrayItem(localSettings.categories, idx, 1)
                          })
                        }
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <span className="font-extrabold text-sm text-slate-900 mr-2">{cat}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {localSettings.categoryImages?.[cat] && (
                        <img
                          src={localSettings.categoryImages[cat]}
                          alt=""
                          className="w-12 h-10 rounded-lg object-cover border"
                        />
                      )}
                      <label className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold cursor-pointer hover:bg-blue-100">
                        تغيير صورة الخلفية
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const compressed = await compressImageFile(f, 700, 0.72);
                            setLocalSettings({
                              ...localSettings,
                              categoryImages: { ...(localSettings.categoryImages || {}), [cat]: compressed }
                            });
                          }}
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
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* المراحل الدراسية وتخصيص صفوف كل مرحلة */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <h3 className="text-base font-black text-slate-900">المراحل الدراسية</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="إضافة مرحلة..."
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                  <button
                    onClick={() => {
                      if (!newStageName.trim()) return;
                      const st = newStageName.trim();
                      setLocalSettings({
                        ...localSettings,
                        stages: [...localSettings.stages, st],
                        stageGrades: { ...(localSettings.stageGrades || {}), [st]: [] }
                      });
                      setSelectedStageForGrades(st);
                      setNewStageName('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    + إضافة
                  </button>
                </div>

                <div className="space-y-2">
                  {localSettings.stages.map((st, idx) => (
                    <div
                      key={st}
                      onClick={() => setSelectedStageForGrades(st)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer ${
                        selectedStageForGrades === st
                          ? 'border-blue-500 bg-blue-50/70 font-extrabold'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocalSettings({
                              ...localSettings,
                              stages: moveArrayItem(localSettings.stages, idx, -1)
                            });
                          }}
                          className="p-1 rounded bg-slate-100"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocalSettings({
                              ...localSettings,
                              stages: moveArrayItem(localSettings.stages, idx, 1)
                            });
                          }}
                          className="p-1 rounded bg-slate-100"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs">{st}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalSettings({
                            ...localSettings,
                            stages: localSettings.stages.filter((s) => s !== st)
                          });
                        }}
                        className="p-1.5 text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* صفوف المرحلة المختارة */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <h3 className="text-base font-black text-slate-900">
                  صفوف ({selectedStageForGrades || 'اختر مرحلة'})
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="إضافة صف دراسي..."
                    value={newGradeName}
                    onChange={(e) => setNewGradeName(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                  <button
                    onClick={() => {
                      if (!newGradeName.trim() || !selectedStageForGrades) return;
                      const currentGrades = localSettings.stageGrades?.[selectedStageForGrades] || [];
                      setLocalSettings({
                        ...localSettings,
                        stageGrades: {
                          ...(localSettings.stageGrades || {}),
                          [selectedStageForGrades]: [...currentGrades, newGradeName.trim()]
                        }
                      });
                      setNewGradeName('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    + إضافة
                  </button>
                </div>

                <div className="space-y-2">
                  {(localSettings.stageGrades?.[selectedStageForGrades] || []).map((gr, idx) => (
                    <div
                      key={gr}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const updated = moveArrayItem(
                              localSettings.stageGrades?.[selectedStageForGrades] || [],
                              idx,
                              -1
                            );
                            setLocalSettings({
                              ...localSettings,
                              stageGrades: { ...localSettings.stageGrades, [selectedStageForGrades]: updated }
                            });
                          }}
                          className="p-1 rounded bg-white border"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const updated = moveArrayItem(
                              localSettings.stageGrades?.[selectedStageForGrades] || [],
                              idx,
                              1
                            );
                            setLocalSettings({
                              ...localSettings,
                              stageGrades: { ...localSettings.stageGrades, [selectedStageForGrades]: updated }
                            });
                          }}
                          className="p-1 rounded bg-white border"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold">{gr}</span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = (localSettings.stageGrades?.[selectedStageForGrades] || []).filter(
                            (g) => g !== gr
                          );
                          setLocalSettings({
                            ...localSettings,
                            stageGrades: { ...localSettings.stageGrades, [selectedStageForGrades]: updated }
                          });
                        }}
                        className="p-1.5 text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* المواد الدراسية */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="text-base font-black text-slate-900">المواد الدراسية</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="إضافة مادة دراسية..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
                <button
                  onClick={() => {
                    if (!newSubjectName.trim()) return;
                    setLocalSettings({
                      ...localSettings,
                      subjects: [...localSettings.subjects, newSubjectName.trim()]
                    });
                    setNewSubjectName('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  + إضافة مادة
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {localSettings.subjects.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-800"
                  >
                    {sub}
                    <button
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          subjects: localSettings.subjects.filter((s) => s !== sub)
                        })
                      }
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => persistSettings(localSettings)}
              disabled={savingSettings}
              className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg"
            >
              {savingSettings ? 'جاري الحفظ...' : 'حفظ جميع الأقسام والمراحل والصفوف والمواد'}
            </button>
          </div>
        )}

        {/* ===================================================================== */}
        {/* التبويب 5: إعدادات الموقع والمظهر والأخبار والتنبيهات وطلب العميل     */}
        {/* ===================================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* 1. الهوية والشعار وخلفية الواجهة */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="text-lg font-black text-slate-900">الهوية البصرية والشعار وخلفية الصفحة الرئيسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">اسم المنصة</label>
                  <input
                    type="text"
                    value={localSettings.siteName}
                    onChange={(e) => setLocalSettings({ ...localSettings, siteName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">الوصف الفرعي أسفل الاسم</label>
                  <input
                    type="text"
                    value={localSettings.siteSubtitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, siteSubtitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">صورة الشعار (Logo)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const c = await compressImageFile(f, 400, 0.85);
                        setLocalSettings({ ...localSettings, logoUrl: c });
                      }}
                      className="text-xs"
                    />
                    {localSettings.logoUrl && (
                      <img src={localSettings.logoUrl} alt="logo" className="h-12 rounded-xl border p-1" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    حجم الشعار ({localSettings.logoSize}px)
                  </label>
                  <input
                    type="range"
                    min={32}
                    max={96}
                    value={localSettings.logoSize}
                    onChange={(e) => setLocalSettings({ ...localSettings, logoSize: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">صورة خلفية الواجهة الرئيسية</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const c = await compressImageFile(f, 1100, 0.75);
                        setLocalSettings({ ...localSettings, heroBgImage: c });
                      }}
                      className="text-xs"
                    />
                    {localSettings.heroBgImage && (
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, heroBgImage: '' })}
                        className="text-xs text-rose-600 font-bold"
                      >
                        إزالة
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    وضوح صورة الخلفية ({localSettings.heroBgOpacity}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={localSettings.heroBgOpacity}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroBgOpacity: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">العنوان الرئيسي للواجهة</label>
                  <input
                    type="text"
                    value={localSettings.heroTitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">الشريط الترويجي العلوي</label>
                  <input
                    type="text"
                    value={localSettings.promoBarText}
                    onChange={(e) => setLocalSettings({ ...localSettings, promoBarText: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">النص الترحيبي أسفل العنوان</label>
                  <textarea
                    rows={2}
                    value={localSettings.heroDesc}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroDesc: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. التحكم في قسم «ما الجديد؟» في الصفحة الرئيسية */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">التحكم في قسم «ما الجديد؟» بالصفحة الرئيسية</h3>
                <label className="flex items-center gap-2 text-xs font-extrabold">
                  <input
                    type="checkbox"
                    checked={localSettings.whatsNewEnabled}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewEnabled: e.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                  />
                  إظهار القسم
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">عنوان القسم</label>
                  <input
                    type="text"
                    value={localSettings.whatsNewTitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewTitle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">طريقة اختيار المذكرات</label>
                  <select
                    value={localSettings.whatsNewMode}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewMode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="auto">تلقائي (أحدث المذكرات المضافة)</option>
                    <option value="manual">يدوي (المذكرات التي أحددها بنفسي)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">عدد المذكرات في العرض التلقائي</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={localSettings.whatsNewCount}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsNewCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 3. التحكم في قسم الأخبار والمذكرات قيد التجهيز + تنبيهات صفحة المذكرة */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900">قسم الأخبار والمذكرات قيد التجهيز</h3>
                  <label className="flex items-center gap-2 text-xs font-extrabold">
                    <input
                      type="checkbox"
                      checked={localSettings.newsSectionEnabled}
                      onChange={(e) => setLocalSettings({ ...localSettings, newsSectionEnabled: e.target.checked })}
                      className="w-4 h-4 accent-blue-600"
                    />
                    إظهار القسم
                  </label>
                </div>

                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="الشارة (مثل: قريبًا / تنويه)"
                      value={newsForm.badge}
                      onChange={(e) => setNewsForm({ ...newsForm, badge: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    />
                    <input
                      type="text"
                      placeholder="عنوان الخبر أو الإعلان..."
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="تفاصيل الخبر أو المذكرة الجاري تجهيزها..."
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newsForm.title.trim()) return;
                      setLocalSettings({
                        ...localSettings,
                        newsItems: [
                          ...(localSettings.newsItems || []),
                          { id: `news-${Date.now()}`, ...newsForm }
                        ]
                      });
                      setNewsForm({ badge: 'خبر جديد', title: '', content: '', color: 'blue' });
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    + إضافة خبر / إعلان
                  </button>
                </div>

                <div className="space-y-2">
                  {(localSettings.newsItems || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border bg-white text-xs">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold ml-2">{item.badge}</span>
                        <strong className="text-slate-900">{item.title}</strong>
                      </div>
                      <button
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            newsItems: (localSettings.newsItems || []).filter((n) => n.id !== item.id)
                          })
                        }
                        className="text-rose-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* تنبيهات صفحة كل مذكرة */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900">التنبيهات داخل صفحة كل مذكرة</h3>
                  <label className="flex items-center gap-2 text-xs font-extrabold">
                    <input
                      type="checkbox"
                      checked={localSettings.notebookNoticeEnabled}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, notebookNoticeEnabled: e.target.checked })
                      }
                      className="w-4 h-4 accent-amber-600"
                    />
                    تفعيل التنبيه
                  </label>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">عنوان صندوق التنبيه</label>
                  <input
                    type="text"
                    value={localSettings.notebookNoticeTitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, notebookNoticeTitle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">نص التنبيه العام للعميل</label>
                  <textarea
                    rows={4}
                    value={localSettings.notebookNoticeText}
                    onChange={(e) => setLocalSettings({ ...localSettings, notebookNoticeText: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 4. التحكم الكامل في حقول نموذج طلب العميل */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-black text-slate-900">التحكم الكامل في إعدادات وحقول نموذج طلب العميل</h3>
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      orderFormFields: [
                        ...(localSettings.orderFormFields || []),
                        {
                          id: `custom_${Date.now()}`,
                          label: 'حقل إضافي جديد',
                          placeholder: 'اكتب هنا...',
                          type: 'text',
                          required: false,
                          visible: true
                        }
                      ]
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  + إضافة حقل جديد للنموذج
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">عنوان نافذة الطلب</label>
                  <input
                    type="text"
                    value={localSettings.orderModalTitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, orderModalTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">نص زر تأكيد الطلب</label>
                  <input
                    type="text"
                    value={localSettings.orderSubmitText}
                    onChange={(e) => setLocalSettings({ ...localSettings, orderSubmitText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={localSettings.orderEnableCoupons}
                      onChange={(e) => setLocalSettings({ ...localSettings, orderEnableCoupons: e.target.checked })}
                    />
                    إظهار خانة كوبون الخصم
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={localSettings.orderEnableMultiCart}
                      onChange={(e) => setLocalSettings({ ...localSettings, orderEnableMultiCart: e.target.checked })}
                    />
                    السماح بإضافة أكثر من مذكرة في الطلب
                  </label>
                </div>
              </div>

              <div className="space-y-2.5">
                {(localSettings.orderFormFields || []).map((field, idx) => (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                  >
                    <div className="md:col-span-4 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            orderFormFields: moveArrayItem(localSettings.orderFormFields, idx, -1)
                          })
                        }
                        className="p-1 rounded bg-white border"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            orderFormFields: moveArrayItem(localSettings.orderFormFields, idx, 1)
                          })
                        }
                        className="p-1 rounded bg-white border"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => {
                          const copy = [...localSettings.orderFormFields];
                          copy[idx] = { ...field, label: e.target.value };
                          setLocalSettings({ ...localSettings, orderFormFields: copy });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <input
                        type="text"
                        placeholder="النص التوضيحي..."
                        value={field.placeholder || ''}
                        onChange={(e) => {
                          const copy = [...localSettings.orderFormFields];
                          copy[idx] = { ...field, placeholder: e.target.value };
                          setLocalSettings({ ...localSettings, orderFormFields: copy });
                        }}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const copy = [...localSettings.orderFormFields];
                          copy[idx] = { ...field, type: e.target.value };
                          setLocalSettings({ ...localSettings, orderFormFields: copy });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                      >
                        <option value="text">نص قصير</option>
                        <option value="tel">رقم هاتف</option>
                        <option value="textarea">فقرة طويلة</option>
                        <option value="file">رفع صورة</option>
                      </select>
                    </div>

                    <div className="md:col-span-3 flex items-center justify-end gap-3">
                      <label className="flex items-center gap-1 text-xs font-bold">
                        <input
                          type="checkbox"
                          checked={field.visible !== false}
                          onChange={(e) => {
                            const copy = [...localSettings.orderFormFields];
                            copy[idx] = { ...field, visible: e.target.checked };
                            setLocalSettings({ ...localSettings, orderFormFields: copy });
                          }}
                        />
                        ظاهر
                      </label>
                      <label className="flex items-center gap-1 text-xs font-bold">
                        <input
                          type="checkbox"
                          checked={Boolean(field.required)}
                          onChange={(e) => {
                            const copy = [...localSettings.orderFormFields];
                            copy[idx] = { ...field, required: e.target.checked };
                            setLocalSettings({ ...localSettings, orderFormFields: copy });
                          }}
                        />
                        إلزامي
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            orderFormFields: localSettings.orderFormFields.filter((_, i) => i !== idx)
                          })
                        }
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. بيانات التواصل والنسخ الاحتياطي */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="text-lg font-black text-slate-900">التواصل الاجتماعي والدفع والنسخ الاحتياطي</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">رقم الواتساب (بالكود الدولي 20)</label>
                  <input
                    type="text"
                    value={localSettings.whatsappNumber}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">رابط جروب الواتساب</label>
                  <input
                    type="url"
                    value={localSettings.whatsappGroupUrl}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsappGroupUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">رابط صفحة الفيسبوك</label>
                  <input
                    type="url"
                    value={localSettings.facebookUrl}
                    onChange={(e) => setLocalSettings({ ...localSettings, facebookUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">رابط قناة / جروب تليجرام</label>
                  <input
                    type="url"
                    value={localSettings.telegramUrl || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, telegramUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    تنزيل نسخة احتياطية (JSON)
                  </button>
                  <label className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    استعادة نسخة احتياطية
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => handleImportBackup(e.target.files?.[0])}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => persistSettings(localSettings)}
                  disabled={savingSettings}
                  className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/25"
                >
                  {savingSettings ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات ومزامنتها'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 10. المكون الرئيسي للتطبيق (MuzakkiratiApp)
// ============================================================================
function MuzakkiratiApp() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_SETTINGS_KEY);
      if (saved) return normalizeSettings(JSON.parse(saved));
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [notebooks, setNotebooks] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_NOTEBOOKS_KEY);
      if (saved) return JSON.parse(saved).map((n) => normalizeNotebook(n.id, n));
    } catch {}
    return [];
  });

  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // التنقل والصفحات
  const [activePage, setActivePage] = useState('home'); // 'home' | 'catalog' | 'offers' | 'track'
  const [catalogNav, setCatalogNav] = useState({ category: '', stage: '', grade: '' });

  // النوافذ المنبثقة
  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPass, setLoginPass] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [customFirebaseInput, setCustomFirebaseInput] = useState('');
  const [showKeySetup, setShowKeySetup] = useState(false);

  // تتبع الطلبات
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrders, setTrackedOrders] = useState([]);
  const [trackSearched, setTrackSearched] = useState(false);

  // التنبيهات (Toast)
  const [toast, setToast] = useState(null);
  const notify = (msg, type = 'info') => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 4500);
  };

  const logoClickCountRef = useRef(0);
  const logoClickTimerRef = useRef(null);

  // تهيئة المصادقة ومراقبة حالة المدير
  useEffect(() => {
    if (!hasValidFirebaseKey) return;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      const isAdmin = Boolean(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
      setIsAdminAuthenticated(isAdmin);
    });

    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
      signInWithCustomToken(auth, __initial_auth_token).catch(() => signInAnonymously(auth).catch(() => {}));
    } else if (!auth.currentUser) {
      signInAnonymously(auth).catch(() => {});
    }

    return () => unsubAuth();
  }, []);

  // الاستماع المباشر للإعدادات والمذكرات والكوبونات من السحابة فور تحميل الموقع لجميع الزوار
  useEffect(() => {
    if (!hasValidFirebaseKey) return;

    const unsubSettings = onSnapshot(
      publicDoc('config', 'main'),
      (snap) => {
        if (snap.exists()) {
          const norm = normalizeSettings(snap.data());
          setSettings(norm);
          try {
            localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(norm));
          } catch {}
        }
      },
      () => {}
    );

    const unsubNotebooks = onSnapshot(
      publicCol('notebooks'),
      (snap) => {
        const list = snap.docs.map((d) => normalizeNotebook(d.id, d.data()));
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setNotebooks(list);
        try {
          localStorage.setItem(LS_NOTEBOOKS_KEY, JSON.stringify(list));
        } catch {}
      },
      () => {}
    );

    const unsubCoupons = onSnapshot(
      publicCol('coupons'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCoupons(list);
      },
      () => {}
    );

    return () => {
      unsubSettings();
      unsubNotebooks();
      unsubCoupons();
    };
  }, []);

  // الاستماع للطلبات عند تسجيل دخول المدير فقط
  useEffect(() => {
    if (!isAdminAuthenticated) {
      setOrders([]);
      return;
    }
    const unsubOrders = onSnapshot(
      publicCol('orders'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setOrders(list);
      },
      () => {}
    );
    return () => unsubOrders();
  }, [isAdminAuthenticated]);

  // الطرق المخفية الثلاث للوصول إلى تسجيل دخول الإدارة (#admin، Alt+Shift+A، 5 نقرات على الشعار)
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        if (isAdminAuthenticated) setShowAdminPortal(true);
        else setShowAdminLoginModal(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    const handleKeyDown = (e) => {
      if (e.altKey && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'ش')) {
        e.preventDefault();
        if (isAdminAuthenticated) setShowAdminPortal(true);
        else setShowAdminLoginModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // دعم زر الرجوع في المتصفح والهاتف
    const handlePopState = (e) => {
      if (e.state && e.state.page) {
        setActivePage(e.state.page);
        if (e.state.catalogNav) setCatalogNav(e.state.catalogNav);
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAdminAuthenticated]);

  const navigateTo = (page, nextCatalogNav = null) => {
    setActivePage(page);
    if (nextCatalogNav) setCatalogNav(nextCatalogNav);
    try {
      window.history.pushState({ page, catalogNav: nextCatalogNav || catalogNav }, '', `#${page}`);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSecretLogoClick = () => {
    logoClickCountRef.current += 1;
    clearTimeout(logoClickTimerRef.current);
    if (logoClickCountRef.current >= 5) {
      logoClickCountRef.current = 0;
      if (isAdminAuthenticated) setShowAdminPortal(true);
      else setShowAdminLoginModal(true);
    } else {
      logoClickTimerRef.current = setTimeout(() => {
        logoClickCountRef.current = 0;
      }, 1500);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!hasValidFirebaseKey) {
      notify('يرجى لصق إعدادات Firebase (firebaseConfig) أولاً لربط الموقع بقاعدة بياناتك', 'error');
      setShowKeySetup(true);
      return;
    }
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPass);
      setShowAdminLoginModal(false);
      setShowAdminPortal(true);
      setLoginPass('');
      notify('مرحبًا بك في لوحة تحكم الإدارة!', 'success');
    } catch (err) {
      notify(`تعذر تسجيل الدخول: ${err?.message || 'تحقق من البريد وكلمة المرور'}`, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await signOut(auth);
      await signInAnonymously(auth);
    } catch {}
    setIsAdminAuthenticated(false);
    setShowAdminPortal(false);
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    notify('تم تسجيل الخروج بأمان', 'info');
  };

  // إدارة سلة الطلبات
  const cartIds = useMemo(() => new Set(cart.map((c) => c.id)), [cart]);

  const handleAddToCart = (nb) => {
    if (cartIds.has(nb.id)) {
      notify('هذه المذكرة مضافة بالفعل في سلة الطلبات', 'info');
      return;
    }
    setCart((prev) => [...prev, nb]);
    notify(`تمت إضافة «${nb.title}» إلى سلة الطلبات`, 'success');
  };

  const handleOrderNow = (nb) => {
    if (!cartIds.has(nb.id)) {
      setCart((prev) => [...prev, nb]);
    }
    setIsCheckoutOpen(true);
  };

  const handleOrderBundle = (bundleNotebooks) => {
    setCart(bundleNotebooks);
    setIsCheckoutOpen(true);
  };

  // المذكرات الظاهرة للزوار
  const visibleNotebooks = useMemo(() => notebooks.filter((n) => !n.isHidden), [notebooks]);

  // مذكرات قسم «ما الجديد؟»
  const whatsNewNotebooks = useMemo(() => {
    if (settings.whatsNewMode === 'manual' && (settings.whatsNewSelectedIds || []).length > 0) {
      return visibleNotebooks.filter((n) => settings.whatsNewSelectedIds.includes(n.id));
    }
    return visibleNotebooks.slice(0, Number(settings.whatsNewCount) || 6);
  }, [visibleNotebooks, settings.whatsNewMode, settings.whatsNewSelectedIds, settings.whatsNewCount]);

  // المذكرات قيد التجهيز
  const comingSoonNotebooks = useMemo(
    () => visibleNotebooks.filter((n) => n.isComingSoon),
    [visibleNotebooks]
  );

  // البحث عن حالة طلب العميل
  const handleTrackOrder = async (e) => {
    e.preventDefault();
    const q = trackQuery.trim().toLowerCase();
    if (!q) return;
    setTrackSearched(true);
    try {
      const snap = await getDocs(publicCol('orders'));
      const matched = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (o) =>
            String(o.orderNumber || '').toLowerCase() === q ||
            String(o.phone || '').includes(q)
        );
      setTrackedOrders(matched);
    } catch {
      notify('يرجى التواصل عبر واتساب لمتابعة حالة طلبك مباشرة', 'info');
      setTrackedOrders([]);
    }
  };

  if (showAdminPortal && isAdminAuthenticated) {
    return (
      <>
        <AdminPortal
          adminUser={currentUser}
          settings={settings}
          notebooks={notebooks}
          orders={orders}
          coupons={coupons}
          onSaveSettings={setSettings}
          onClosePortal={() => setShowAdminPortal(false)}
          onLogout={handleAdminLogout}
          onNotify={notify}
        />
        {toast && <ToastBanner toast={toast} />}
      </>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* الشريط الترويجي العلوي */}
      {settings.promoBarEnabled && settings.promoBarText && (
        <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-slate-950 text-amber-300 text-xs sm:text-sm font-extrabold py-3 px-4 text-center border-b border-white/10">
          <span>{settings.promoBarText}</span>
          <button
            onClick={() => navigateTo('offers')}
            className="mr-3 px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 hover:bg-amber-300 text-xs sm:text-sm font-black transition shadow-sm"
          >
            استفد من العرض ←
          </button>
        </div>
      )}

      {/* شريط التنقل الرئيسي (Header) بتصميم عصري واضح وخطوط مقروءة */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* الشعار واسم المنصة (النقر 5 مرات يفتح شاشة الإدارة) */}
          <div
            onClick={handleSecretLogoClick}
            className="flex items-center gap-3.5 cursor-pointer select-none group"
          >
            {settings.logoUrl ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs bg-slate-900 p-1 shrink-0">
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  style={{ height: `${Math.min(Math.max(settings.logoSize || 56, 44), 84)}px` }}
                  className="w-auto object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                <BookOpen className="w-7 h-7" />
              </div>
            )}
            <div>
              <h1 className="font-black text-lg sm:text-xl text-slate-900 leading-snug tracking-tight">
                {settings.siteName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium hidden sm:block mt-0.5">
                {settings.siteSubtitle}
              </p>
            </div>
          </div>

          {/* روابط الصفحات بحجم خط واضح وأيقونات معبّرة */}
          <nav className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70">
            {[
              { id: 'home', label: 'الرئيسية', icon: Home },
              { id: 'catalog', label: 'المذكرات', icon: BookOpen },
              { id: 'offers', label: 'العروض والباقات', icon: Percent },
              { id: 'track', label: 'تتبع طلبك', icon: PackageCheck }
            ].map((item) => {
              const NavIcon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm sm:text-base font-extrabold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-white/70'
                  }`}
                >
                  <NavIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* أزرار السلة والتواصل ولوحة الإدارة عند تسجيل الدخول */}
          <div className="flex items-center gap-2.5">
            {isAdminAuthenticated && (
              <button
                onClick={() => setShowAdminPortal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-sm transition"
              >
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span>لوحة التحكم</span>
              </button>
            )}

            <button
              onClick={() => setIsContactModalOpen(true)}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>تواصل معنا</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* محتوى الصفحات                                                         */}
      {/* ===================================================================== */}
      <main className="flex-1">
        {activePage === 'home' && (
          <div className="space-y-14 pb-16">
            {/* 1. الواجهة الترحيبية (Hero Section) */}
            <section
              style={{ minHeight: `${settings.heroHeight || 520}px` }}
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
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
                <div className="lg:col-span-7 space-y-6">
                  {settings.heroBadge && (
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-extrabold">
                      <Sparkles className="w-4 h-4" />
                      {settings.heroBadge}
                    </span>
                  )}
                  <h2 className="text-3xl sm:text-5xl font-black leading-tight">{settings.heroTitle}</h2>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">{settings.heroDesc}</p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => navigateTo('catalog', { category: '', stage: '', grade: '' })}
                      className="px-7 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition"
                    >
                      تصفح مكتبة المذكرات
                    </button>
                    <button
                      onClick={() => setIsCheckoutOpen(true)}
                      className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-extrabold text-sm transition"
                    >
                      اطلب إعداد مذكرة خاصة
                    </button>
                  </div>
                </div>

                {/* بطاقة لماذا يثق بنا المعلمون */}
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
              </div>
            </section>

            {/* 2. الأقسام الرئيسية للمذكرات والكورسات بتصميم واضح ومشرق */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">الأقسام الرئيسية للمذكرات والكورسات</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
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
                      className="overflow-hidden bg-white rounded-3xl border border-slate-200 hover:border-blue-600 shadow-sm hover:shadow-xl transition-all duration-300 text-right group flex flex-col"
                    >
                      {bgImg ? (
                        <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                          <img
                            src={bgImg}
                            alt={cat}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-3.5 left-3.5 px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md text-white text-xs font-black shadow-md">
                            {count} مذكرة متاحة
                          </span>
                        </div>
                      ) : (
                        <div className="relative h-40 w-full bg-gradient-to-br from-blue-600 to-indigo-700 p-6 flex items-center justify-between text-white">
                          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                            <BookOpen className="w-7 h-7" />
                          </div>
                          <span className="px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-black">
                            {count} مذكرة متاحة
                          </span>
                        </div>
                      )}

                      <div className="p-6 flex-1 flex flex-col justify-between w-full bg-white">
                        <div>
                          <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition">{cat}</h3>
                          <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            تصفح المراحل والصفوف الدراسية والمذكرات المتاحة
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-extrabold text-blue-600">
                          <span>دخول القسم</span>
                          <span className="group-hover:-translate-x-1 transition-transform">←</span>
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
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold">
                      إصدارات حديثة
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{settings.whatsNewTitle}</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">{settings.whatsNewSubtitle}</p>
                  </div>
                  <button
                    onClick={() => navigateTo('catalog', { category: '', stage: '', grade: '' })}
                    className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition"
                  >
                    عرض جميع المذكرات ←
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {whatsNewNotebooks.map((nb) => (
                    <NotebookCard
                      key={nb.id}
                      notebook={nb}
                      onPreview={setPreviewNotebook}
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
                      أخبار وتحديثات المنصة
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{settings.newsSectionTitle}</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">{settings.newsSectionSubtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {(settings.newsItems || []).map((news) => (
                      <div
                        key={news.id}
                        className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3"
                      >
                        <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold">
                          {news.badge}
                        </span>
                        <h3 className="font-black text-base text-slate-900">{news.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{news.content}</p>
                      </div>
                    ))}

                    {comingSoonNotebooks.map((nb) => (
                      <div
                        key={nb.id}
                        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <span className="inline-block px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                            قيد التجهيز • حجز مسبق
                          </span>
                          <h3 className="font-black text-base text-slate-900">{nb.title}</h3>
                          <p className="text-xs text-slate-600">
                            {nb.grade} • {nb.subject}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOrderNow(nb)}
                          className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition"
                        >
                          احجز نسختك مسبقًا الآن
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
            onNavigateCatalog={(next) => navigateTo('catalog', next)}
            onPreview={setPreviewNotebook}
            onOrderNow={handleOrderNow}
            onAddToCart={handleAddToCart}
            cartIds={cartIds}
            onRequestPreOrder={() => setIsCheckoutOpen(true)}
          />
        )}

        {activePage === 'offers' && (
          <OffersAndBundlesPage
            notebooks={visibleNotebooks}
            settings={settings}
            coupons={coupons}
            onOrderBundle={handleOrderBundle}
            onNotify={notify}
          />
        )}

        {activePage === 'track' && (
          <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 text-center">
              <h2 className="text-2xl font-black text-slate-900">تتبع حالة طلبك</h2>
              <p className="text-xs text-slate-500">أدخل رقم الطلب (مثل ORD-123456) أو رقم هاتفك المسجل</p>
              <form onSubmit={handleTrackOrder} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="رقم الطلب أو رقم الهاتف..."
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm"
                >
                  بحث
                </button>
              </form>
            </div>

            {trackSearched && (
              <div className="space-y-3">
                {trackedOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-500 border">
                    لم يتم العثور على طلبات مطابقة، تأكد من الرقم أو تواصل معنا عبر واتساب.
                  </div>
                ) : (
                  trackedOrders.map((o) => (
                    <div key={o.id} className="bg-white rounded-2xl p-5 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-blue-700 text-sm">{o.orderNumber}</span>
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                          {o.status === 'completed'
                            ? 'مكتمل وتم التسليم'
                            : o.status === 'processing'
                            ? 'جاري تجهيز المذكرة باسمك'
                            : 'قيد المراجعة والتأكيد'}
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
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/${String(settings.whatsappNumber || '').replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                واتساب مباشر
              </a>
              {sanitizeUrl(settings.facebookUrl) && (
                <a
                  href={sanitizeUrl(settings.facebookUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  صفحة الفيسبوك
                </a>
              )}
              {sanitizeUrl(settings.whatsappGroupUrl) && (
                <a
                  href={sanitizeUrl(settings.whatsappGroupUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                >
                  جروب الواتساب
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10 text-center text-xs text-slate-500">
          جميع الحقوق محفوظة © {new Date().getFullYear()} {settings.siteName}
        </div>
      </footer>

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
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900">تواصل معنا مباشرة</h3>
                  <p className="text-xs text-slate-500">اختر وسيلة التواصل المناسبة لك</p>
                </div>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* واتساب مباشر */}
              <a
                href={`https://wa.me/${String(settings.whatsappNumber || '').replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">محادثة واتساب مباشرة</h4>
                    <p className="text-xs text-emerald-700 font-bold" dir="ltr">
                      +{String(settings.whatsappNumber || '').replace(/[^\d]/g, '')}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
              </a>

              {/* جروب الواتساب */}
              {sanitizeUrl(settings.whatsappGroupUrl) && (
                <a
                  href={sanitizeUrl(settings.whatsappGroupUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">انضم لجروب المعلمين على واتساب</h4>
                      <p className="text-xs text-teal-700">متابعة أحدث المذكرات والعروض الحصرية</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-teal-600 group-hover:-translate-x-1 transition-transform" />
                </a>
              )}

              {/* صفحة الفيسبوك */}
              {sanitizeUrl(settings.facebookUrl) && (
                <a
                  href={sanitizeUrl(settings.facebookUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0">
                      f
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">صفحتنا الرسمية على فيسبوك</h4>
                      <p className="text-xs text-blue-700">تواصل عبر ماسنجر وتابع المنشورات</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-600 group-hover:-translate-x-1 transition-transform" />
                </a>
              )}

              {/* قناة / جروب تليجرام */}
              {sanitizeUrl(settings.telegramUrl) && (
                <a
                  href={sanitizeUrl(settings.telegramUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">قناتنا على تليجرام</h4>
                      <p className="text-xs text-sky-700">عينات مجانية وإشعارات الإصدارات الجديدة</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-sky-600 group-hover:-translate-x-1 transition-transform" />
                </a>
              )}

              {/* اتصال هاتفي مباشر */}
              <a
                href={`tel:+${String(settings.whatsappNumber || '').replace(/[^\d]/g, '')}`}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">اتصال هاتفي مباشر</h4>
                    <p className="text-xs text-slate-500">للاستفسارات العاجلة والدعم الفني</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
              </a>
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
