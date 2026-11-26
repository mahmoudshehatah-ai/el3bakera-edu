import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Search,
  ShoppingCart,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  Eye,
  Upload,
  Settings,
  Layers,
  Tag,
  Sparkles,
  Phone,
  LogOut,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock,
  FolderOpen,
  ArrowRight,
  Percent,
  Gift,
  FileText,
  Download,
  RefreshCw,
  Megaphone,
  CalendarClock,
  Save,
  Home
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

// ==========================================
// 1. إعدادات Firebase والاتصال بالسحابة
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyD_du5VY8nJGDJ169Fof9EALI9x2W2d-14",
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
const LOCAL_SETTINGS_BACKUP_KEY = 'el3bakera_settings_backup_v2';

const publicCol = (colName) => collection(db, 'artifacts', APP_ID, 'public', 'data', colName);
const publicDoc = (colName, docId) => doc(db, 'artifacts', APP_ID, 'public', 'data', colName, docId);

// ==========================================
// 2. البيانات الافتراضية للمنصة
// ==========================================
const DEFAULT_CATEGORIES = [
  { id: 'cat_term1', name: 'مذكرات الترم الأول', order: 1, description: 'مذكرات الشرح والمراجعة النهائية للفصل الدراسي الأول' },
  { id: 'cat_term2', name: 'مذكرات الترم الثاني', order: 2, description: 'مذكرات الشرح والاختبارات الشاملة للفصل الدراسي الثاني' },
  { id: 'cat_foundation', name: 'كورسات التأسيس', order: 3, description: 'سلاسل التأسيس المتدرجة في القراءة والكتابة والقواعد' }
];

const DEFAULT_STAGES = [
  { id: 'stage_primary', name: 'المرحلة الابتدائية', order: 1 },
  { id: 'stage_prep', name: 'المرحلة الإعدادية', order: 2 },
  { id: 'stage_sec', name: 'المرحلة الثانوية', order: 3 }
];

const DEFAULT_GRADES = [
  { id: 'g_p4', stageId: 'stage_primary', name: 'الصف الرابع الابتدائي', order: 1 },
  { id: 'g_p5', stageId: 'stage_primary', name: 'الصف الخامس الابتدائي', order: 2 },
  { id: 'g_p6', stageId: 'stage_primary', name: 'الصف السادس الابتدائي', order: 3 },
  { id: 'g_m1', stageId: 'stage_prep', name: 'الصف الأول الإعدادي', order: 1 },
  { id: 'g_m2', stageId: 'stage_prep', name: 'الصف الثاني الإعدادي', order: 2 },
  { id: 'g_m3', stageId: 'stage_prep', name: 'الصف الثالث الإعدادي', order: 3 },
  { id: 'g_s1', stageId: 'stage_sec', name: 'الصف الأول الثانوي', order: 1 },
  { id: 'g_s2', stageId: 'stage_sec', name: 'الصف الثاني الثانوي', order: 2 },
  { id: 'g_s3', stageId: 'stage_sec', name: 'الصف الثالث الثانوي', order: 3 }
];

const DEFAULT_SUBJECTS = [
  { id: 'sub_ar', name: 'اللغة العربية' },
  { id: 'sub_en', name: 'اللغة الإنجليزية' },
  { id: 'sub_math', name: 'الرياضيات' },
  { id: 'sub_sci', name: 'العلوم' },
  { id: 'sub_soc', name: 'الدراسات الاجتماعية' }
];

const DEFAULT_CUSTOMER_FIELDS = [
  { id: 'teacherName', label: 'اسم المعلم (كما سيُكتب على المذكرة)', placeholder: 'مثال: أ/ محمود شحاتة', type: 'text', required: true, visible: true, order: 1 },
  { id: 'whatsapp', label: 'رقم الواتساب للتواصل وإرسال الملفات', placeholder: '010xxxxxxxx', type: 'tel', required: true, visible: true, order: 2 },
  { id: 'seriesName', label: 'اسم السلسلة أو السنتر (اختياري)', placeholder: 'مثال: سلسلة العباقرة في اللغة العربية', type: 'text', required: false, visible: true, order: 3 },
  { id: 'governorate', label: 'المحافظة / الإدارة التعليمية', placeholder: 'مثال: الغربية - المحلة الكبرى', type: 'text', required: false, visible: true, order: 4 },
  { id: 'notes', label: 'ملاحظات إضافية للتصميم', placeholder: 'أي تفاصيل خاصة بالألوان أو البيانات...', type: 'textarea', required: false, visible: true, order: 5 }
];

const DEFAULT_SETTINGS = {
  siteName: 'منصة العباقرة للمذكرات التعليمية',
  tagline: 'مذكرات دراسية احترافية مخصصة للمعلم باسمه وبياناته الخاصة',
  logoUrl: '',
  logoSize: 52,
  heroBadge: 'تخصيص كامل باسم المعلم ورقم هاتفه وشعاره',
  heroTitle: 'مذكرتك التعليمية الجاهزة... باسمك وشعارك وهويتك الاحترافية',
  heroSubtitle: 'نوفر للمعلمين مذكرات دراسية منسقة باحترافية ومحدّثة وفق أحدث المناهج بصيغة PDF عالية الدقة، مع إضافة بيانات المعلم على الغلاف وجميع الصفحات.',
  heroBgImage: '',
  heroBgOpacity: 0.28,
  heroMinHeight: 440,
  whatsappNumber: '201000000000',
  contactModalTitle: 'تواصل مع إدارة منصة العباقرة',
  contactModalSubtitle: 'يسعدنا الرد على استفساراتكم وطلبات التخصيص عبر قنواتنا الرسمية:',
  socialLinks: [
    { id: 'soc_wa', label: 'تواصل مباشر واتساب', url: 'https://wa.me/201000000000' },
    { id: 'soc_fb', label: 'صفحتنا على فيسبوك', url: 'https://facebook.com' }
  ],
  promoBannerEnabled: true,
  promoBannerText: 'عرض خاص للمعلمين: خصم 15% على جميع المذكرات بمناسبة افتتاح موقعنا',
  promoBannerColor: 'blue',
  promoBannerCoupon: 'M20',
  promoBannerCopyText: 'انسخ الكوبون',
  nextOrderRewardEnabled: true,
  nextOrderRewardMode: 'auto', // 'auto' | 'custom'
  nextOrderRewardCustomCode: 'VIP15',
  nextOrderRewardType: 'percent', // 'percent' | 'fixed'
  nextOrderRewardValue: 15,
  nextOrderRewardValidDays: 7,
  nextOrderRewardTitle: 'هدية خاصة لطلبك القادم!',
  nextOrderRewardMessage: 'استخدم كود الخصم التالي عند طلبك القادم للحصول على خصم فوري:',
  whatsNewEnabled: true,
  whatsNewTitle: 'ما الجديد؟ أحدث المذكرات والإصدارات',
  whatsNewMode: 'auto', // 'auto' | 'manual'
  whatsNewCount: 4,
  whatsNewManualIds: [],
  newsSectionEnabled: true,
  newsSectionTitle: 'أخبار المنصة ومذكرات قيد التجهيز',
  newsItems: [
    {
      id: 'news_1',
      title: 'تحديث جميع مذكرات الفصل الدراسي الجديد وفق آخر تعديلات الوزارة',
      date: 'متاح الآن',
      description: 'تمت مراجعة وتنسيق كافة المذكرات بإخراج فني فاخر وجاهز للطباعة الفورية.'
    }
  ],
  driveButtonLabel: 'معاينة عينة PDF كاملة على Google Drive',
  driveHelpText: 'يمكنك تصفح عينة كاملة بجودة عالية قبل تأكيد الطلب',
  customerFields: DEFAULT_CUSTOMER_FIELDS,
  categoryImages: {},
  categories: DEFAULT_CATEGORIES,
  stages: DEFAULT_STAGES,
  grades: DEFAULT_GRADES,
  subjects: DEFAULT_SUBJECTS,
  bundles: []
};

// ==========================================
// 3. دوال مساعدة (ضغط الصور، معالجة الروابط، الأيقونات)
// ==========================================
function compressImage(file, maxWidth = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
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
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeExternalUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function generateUniqueCouponCode(prefix = 'VIP') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${rand}`;
}

function SocialPlatformBadge({ url }) {
  const lower = (url || '').toLowerCase();
  if (lower.includes('wa.me') || lower.includes('whatsapp')) {
    return (
      <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
        WA
      </span>
    );
  }
  if (lower.includes('facebook') || lower.includes('fb.com')) {
    return (
      <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
        FB
      </span>
    );
  }
  if (lower.includes('t.me') || lower.includes('telegram')) {
    return (
      <span className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs shrink-0">
        TG
      </span>
    );
  }
  if (lower.includes('youtube')) {
    return (
      <span className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-black text-xs shrink-0">
        YT
      </span>
    );
  }
  return (
    <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
      <ExternalLink className="w-4 h-4" />
    </span>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg max-w-md space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h2 className="text-xl font-black text-slate-900">حدث خطأ غير متوقع في العرض</h2>
            <p className="text-sm text-slate-600">يرجى إعادة تحميل الصفحة للاستمرار.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm"
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

// ==========================================
// 4. مكون معاينة المذكرة المحمية
// ==========================================
function ProtectedPreviewModal({ notebook, settings, onClose, onAddToCart, isInCart }) {
  const [samples, setSamples] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loadingSamples, setLoadingSamples] = useState(true);

  useEffect(() => {
    if (!notebook) return;
    let active = true;
    const loadSamples = async () => {
      setLoadingSamples(true);
      try {
        const inlineSamples = Array.isArray(notebook.samplePages) ? notebook.samplePages : [];
        const snap = await getDoc(publicDoc('notebook_samples', notebook.id));
        const remoteSamples = snap.exists() && Array.isArray(snap.data().pages) ? snap.data().pages : [];
        const allPages = [
          ...(notebook.coverImage ? [notebook.coverImage] : []),
          ...(remoteSamples.length > 0 ? remoteSamples : inlineSamples)
        ];
        if (active) {
          setSamples(allPages);
          setCurrentIdx(0);
        }
      } catch {
        const fallback = [
          ...(notebook.coverImage ? [notebook.coverImage] : []),
          ...(Array.isArray(notebook.samplePages) ? notebook.samplePages : [])
        ];
        if (active) {
          setSamples(fallback);
          setCurrentIdx(0);
        }
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

  const gradeName = (settings.grades || []).find((g) => g.id === notebook.gradeId)?.name || '';
  const subjectName = (settings.subjects || []).find((s) => s.id === notebook.subjectId)?.name || '';
  const driveUrl = normalizeExternalUrl(notebook.driveUrl);

  const alertStyles = {
    amber: 'bg-amber-50 border-amber-300 text-amber-950',
    blue: 'bg-blue-50 border-blue-300 text-blue-950',
    emerald: 'bg-emerald-50 border-emerald-300 text-emerald-950',
    rose: 'bg-rose-50 border-rose-300 text-rose-950'
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-[11px] font-bold">{gradeName}</span>
              {subjectName && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[11px] font-bold">
                  {subjectName}
                </span>
              )}
              {notebook.comingSoon && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black">
                  قيد التجهيز / حجز مسبق
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-xl font-black mt-1 truncate">{notebook.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوى المعاينة */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {notebook.customAlertEnabled && notebook.customAlertText && (
            <div className={`p-4 rounded-2xl border-2 ${alertStyles[notebook.customAlertColor || 'amber']}`}>
              {notebook.customAlertBadge && (
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/10 text-xs font-black mb-1">
                  {notebook.customAlertBadge}
                </span>
              )}
              <p className="text-sm font-bold leading-relaxed">{notebook.customAlertText}</p>
            </div>
          )}

          {/* عارض الصفحات المحمي */}
          <div className="bg-slate-100 rounded-3xl p-3 sm:p-5 border border-slate-200 select-none" onContextMenu={(e) => e.preventDefault()}>
            {loadingSamples ? (
              <div className="h-72 flex flex-col items-center justify-center text-slate-500 gap-2">
                <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
                <span className="text-sm font-bold">جاري تحميل صفحات العينة...</span>
              </div>
            ) : samples.length > 0 ? (
              <div className="space-y-4">
                <div className="relative flex items-center justify-center bg-white rounded-2xl p-2 border border-slate-200 min-h-[300px] sm:min-h-[420px]">
                  <img
                    src={samples[currentIdx]}
                    alt={`صفحة ${currentIdx + 1}`}
                    draggable={false}
                    className="max-h-[440px] w-auto object-contain rounded-xl pointer-events-none"
                  />
                  {/* علامة مائية للحماية */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
                    <span className="text-2xl sm:text-4xl font-black text-slate-900 -rotate-12">
                      {settings.siteName}
                    </span>
                  </div>

                  {samples.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentIdx((p) => (p > 0 ? p - 1 : samples.length - 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-900"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setCurrentIdx((p) => (p < samples.length - 1 ? p + 1 : 0))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-900"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* شريط المصغرات */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs font-black text-slate-600">
                    صفحة {currentIdx + 1} من {samples.length}
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {samples.map((src, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIdx(idx)}
                        className={`w-12 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                          currentIdx === idx ? 'border-blue-600 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-slate-500 gap-2">
                <BookOpen className="w-10 h-10 text-slate-400" />
                <p className="text-sm font-bold">لا توجد صور عينة مرفوعة لهذه المذكرة بعد</p>
              </div>
            )}
          </div>

          {/* وصف المذكرة ورابط Drive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-slate-900">تفاصيل المذكرة:</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {notebook.description || 'مذكرة شاملة ومنسقة باحترافية عالية وجاهزة للطباعة باسم المعلم ورقم هاتفه وشعاره الخاص.'}
              </p>
            </div>

            {driveUrl && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-blue-900">{settings.driveHelpText}</p>
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{settings.driveButtonLabel || 'معاينة PDF على Google Drive'}</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* شريط السعر والإضافة للسلة */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <span className="text-xs text-slate-500 font-bold block">سعر المذكرة بالتخصيص الكامل:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700">{notebook.price} ج.م</span>
              {Number(notebook.oldPrice) > Number(notebook.price) && (
                <span className="text-sm text-slate-400 line-through font-bold">{notebook.oldPrice} ج.م</span>
              )}
            </div>
          </div>

          <button
            onClick={() => onAddToCart(notebook)}
            className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 transition shadow-md ${
              isInCart
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isInCart ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>مضافة في السلة</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span>{notebook.comingSoon ? 'احجز المذكرة الآن' : 'أضف إلى السلة'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. بطاقة عرض المذكرة
// ==========================================
function NotebookCard({ notebook, settings, onPreview, onAddToCart, isInCart }) {
  const gradeName = (settings.grades || []).find((g) => g.id === notebook.gradeId)?.name || '';
  const subjectName = (settings.subjects || []).find((s) => s.id === notebook.subjectId)?.name || '';
  const hasDiscount = Number(notebook.oldPrice) > Number(notebook.price);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      <div
        onClick={() => onPreview(notebook)}
        className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-blue-50 overflow-hidden cursor-pointer"
      >
        {notebook.coverImage ? (
          <img
            src={notebook.coverImage}
            alt={notebook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <BookOpen className="w-12 h-12 text-blue-500/60 mb-2" />
            <span className="text-xs font-bold text-slate-500">{notebook.title}</span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
          {notebook.comingSoon && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black shadow">
              قيد التجهيز
            </span>
          )}
          {hasDiscount && (
            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black shadow">
              خصم {Math.round(((notebook.oldPrice - notebook.price) / notebook.oldPrice) * 100)}%
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(notebook);
          }}
          className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>معاينة</span>
        </button>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 flex-wrap">
            <span>{gradeName}</span>
            {subjectName && (
              <>
                <span>•</span>
                <span className="text-slate-500">{subjectName}</span>
              </>
            )}
          </div>
          <h3
            onClick={() => onPreview(notebook)}
            className="font-black text-slate-900 text-base leading-snug cursor-pointer hover:text-blue-600 transition line-clamp-2"
          >
            {notebook.title}
          </h3>
          {notebook.customAlertEnabled && notebook.customAlertBadge && (
            <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-black">
              {notebook.customAlertBadge}
            </span>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-lg font-black text-slate-900">{notebook.price} ج.م</div>
            {hasDiscount && (
              <div className="text-xs text-slate-400 line-through font-bold">{notebook.oldPrice} ج.م</div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(notebook)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition ${
              isInCart
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            {isInCart ? (
              <>
                <Check className="w-4 h-4" />
                <span>في السلة</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>أضف للسلة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. نافذة سلة الطلبات وإتمام الطلب
// ==========================================
function OrderCheckoutModal({ isOpen, onClose, cart, settings, coupons, onRemoveFromCart, onClearCart }) {
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [expandedBundles, setExpandedBundles] = useState({});
  const [formData, setFormData] = useState({});
  const [logoPreview, setLogoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const activeFields = [...(settings.customerFields || DEFAULT_CUSTOMER_FIELDS)]
    .filter((f) => f.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || subtotal <= 0) return 0;
    if (appliedCoupon.type === 'fixed') {
      return Math.min(subtotal, Number(appliedCoupon.value) || 0);
    }
    return Math.round((subtotal * (Number(appliedCoupon.value) || 0)) / 100);
  }, [appliedCoupon, subtotal]);

  const finalTotal = Math.max(0, subtotal - couponDiscount);

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = coupons.find((c) => (c.code || '').toUpperCase() === code && c.active !== false);
    if (!found) {
      setCouponError('كود الكوبون غير صحيح أو غير مفعل');
      setAppliedCoupon(null);
      return;
    }
    if (found.singleUse && found.used) {
      setCouponError('تم استخدام هذا الكوبون مسبقًا');
      setAppliedCoupon(null);
      return;
    }
    if (found.expiresAt) {
      const expTime = new Date(found.expiresAt).getTime();
      if (!Number.isNaN(expTime) && Date.now() > expTime) {
        setCouponError('عذرًا، انتهت مدة صلاحية هذا الكوبون');
        setAppliedCoupon(null);
        return;
      }
    }
    setAppliedCoupon(found);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 500, 0.8);
      setLogoPreview(compressed);
    } catch {
      // تجاهل في حال فشل الضغط
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      let nextOrderCouponCode = '';
      let nextOrderCouponExpiresAt = '';

      if (settings.nextOrderRewardEnabled) {
        const validDays = Number(settings.nextOrderRewardValidDays) || 0;
        if (validDays > 0) {
          nextOrderCouponExpiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
        }
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
            expiresAt: nextOrderCouponExpiresAt || null,
            sourceOrder: orderNumber,
            createdAt: serverTimestamp()
          });
        }
      }

      if (appliedCoupon && appliedCoupon.singleUse && appliedCoupon.id) {
        await updateDoc(publicDoc('coupons', appliedCoupon.id), { used: true });
      }

      const orderItems = cart.map((item) => ({
        id: item.id,
        title: item.title,
        price: Number(item.price) || 0,
        isBundle: Boolean(item.isBundle),
        bundleItems: item.bundleItems || []
      }));

      const orderPayload = {
        orderNumber,
        items: orderItems,
        subtotal,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        discount: couponDiscount,
        total: finalTotal,
        customerData: formData,
        hasLogo: Boolean(logoPreview),
        nextOrderCouponCode,
        nextOrderCouponExpiresAt,
        status: 'تم الاستلام',
        createdAt: serverTimestamp()
      };

      await addDoc(publicCol('orders'), orderPayload);

      // تجهيز رسالة واتساب منسقة
      const itemsText = orderItems
        .map((it, idx) =>
          it.isBundle
            ? `${idx + 1}. [باقة] ${it.title} (${it.price} ج.م)\n   المحتويات: ${it.bundleItems.map((b) => b.title).join(' + ')}`
            : `${idx + 1}. ${it.title} (${it.price} ج.م)`
        )
        .join('\n');

      const customerLines = activeFields
        .filter((f) => formData[f.id])
        .map((f) => `• ${f.label}: ${formData[f.id]}`)
        .join('\n');

      const waMsg = encodeURIComponent(
        `مرحبًا ${settings.siteName}، أرغب في تأكيد طلبي:\n` +
          `رقم الطلب: ${orderNumber}\n\n` +
          `📚 المذكرات المطلوبة:\n${itemsText}\n\n` +
          `💰 الإجمالي النهائي: ${finalTotal} ج.م` +
          (appliedCoupon ? ` (بعد خصم كوبون ${appliedCoupon.code})` : '') +
          `\n\n👤 بيانات التخصيص:\n${customerLines}` +
          (logoPreview ? `\n🖼️ تم إرفاق شعار المعلم (سأرسله هنا في المحادثة أيضًا)` : '')
      );

      const cleanPhone = (settings.whatsappNumber || '201000000000').replace(/\D/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${waMsg}`;

      setCompletedOrder({ ...orderPayload, waUrl });
      onClearCart();
      setAppliedCoupon(null);
      setCouponInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-black">سلة الطلبات وإتمام التخصيص</h3>
          </div>
          <button
            onClick={() => {
              setCompletedOrder(null);
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {completedOrder ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900">تم تسجيل طلبك بنجاح!</h4>
                <p className="text-sm text-slate-600">
                  احتفظ برقم الطلب لمتابعة حالة التجهيز في أي وقت:
                </p>
                <div className="inline-block px-5 py-2 rounded-2xl bg-slate-100 border border-slate-300 font-black text-lg text-blue-700 tracking-wider mt-1">
                  {completedOrder.orderNumber}
                </div>
              </div>

              {completedOrder.nextOrderCouponCode && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-4 space-y-2 max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-1.5 text-amber-900 font-black text-sm">
                    <Gift className="w-5 h-5 text-amber-600" />
                    <span>{settings.nextOrderRewardTitle}</span>
                  </div>
                  <p className="text-xs text-slate-700">{settings.nextOrderRewardMessage}</p>
                  {completedOrder.nextOrderCouponExpiresAt && (
                    <p className="text-[11px] font-black text-amber-800">
                      ⏳ صالح للاستخدام حتى:{' '}
                      {new Date(completedOrder.nextOrderCouponExpiresAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="px-4 py-2 rounded-xl bg-white border border-amber-400 font-black text-base text-slate-900 tracking-wider">
                      {completedOrder.nextOrderCouponCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(completedOrder.nextOrderCouponCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 text-white font-black text-xs flex items-center gap-1"
                    >
                      {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode ? 'تم النسخ' : 'انسخ الكوبون'}</span>
                    </button>
                  </div>
                </div>
              )}

              <a
                href={completedOrder.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg transition"
              >
                <Phone className="w-5 h-5" />
                <span>إرسال تفاصيل الطلب على واتساب الآن</span>
              </a>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base font-black text-slate-700">سلة الطلبات فارغة حاليًا</p>
              <p className="text-xs text-slate-500">تصفح المذكرات أو باقات التوفير وأضف ما يناسبك للسلة.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-5">
              {/* قائمة عناصر السلة */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">العناصر المختارة ({cart.length}):</span>
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    إفراغ السلة
                  </button>
                </div>

                {cart.map((item) => {
                  const isExpanded = Boolean(expandedBundles[item.id]);
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border ${
                        item.isBundle ? 'bg-indigo-50/60 border-indigo-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.isBundle && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black">
                                باقة مجمعة
                              </span>
                            )}
                            <span className="font-black text-sm text-slate-900 truncate">{item.title}</span>
                          </div>
                          <div className="text-xs font-bold text-blue-700 mt-0.5">
                            {item.price} ج.م
                            {item.isBundle && Array.isArray(item.bundleItems) && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedBundles((p) => ({ ...p, [item.id]: !p[item.id] }))
                                }
                                className="mr-2 text-indigo-700 underline font-bold"
                              >
                                ({item.bundleItems.length} مذكرات - {isExpanded ? 'إخفاء' : 'عرض المحتويات'})
                              </button>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(item.id)}
                          className="p-2 rounded-xl text-red-600 hover:bg-red-100 transition shrink-0"
                          title="حذف من السلة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.isBundle && isExpanded && Array.isArray(item.bundleItems) && (
                        <ul className="mt-2.5 pt-2.5 border-t border-indigo-200/70 space-y-1 text-xs text-slate-700">
                          {item.bundleItems.map((b, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{b.title}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* تطبيق كوبون الخصم */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <label className="text-xs font-black text-slate-800 block">هل لديك كوبون خصم؟</label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl px-3.5 py-2.5">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-black">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        تم تطبيق الكوبون ({appliedCoupon.code}) — خصم {appliedCoupon.value}
                        {appliedCoupon.type === 'fixed' ? ' ج.م' : '%'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-black hover:bg-red-200"
                    >
                      حذف الكوبون ×
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="أدخل كود الكوبون هنا..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-black uppercase bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm"
                    >
                      تطبيق
                    </button>
                  </div>
                )}
                {couponError && <p className="text-xs font-bold text-red-600">{couponError}</p>}
              </div>

              {/* ملخص الحساب */}
              <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-200 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600 font-bold">
                  <span>المجموع الفرعي:</span>
                  <span>{subtotal} ج.م</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-black">
                    <div className="flex items-center gap-2">
                      <span>خصم الكوبون ({appliedCoupon?.code}):</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[11px] text-red-600 underline"
                      >
                        إلغاء
                      </button>
                    </div>
                    <span>- {couponDiscount} ج.م</span>
                  </div>
                )}
                <div className="pt-2 border-t border-blue-200 flex justify-between items-center text-base font-black text-blue-950">
                  <span>الإجمالي النهائي المطلوب:</span>
                  <span className="text-xl text-blue-700">{finalTotal} ج.م</span>
                </div>
              </div>

              {/* حقول بيانات العميل */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-900">بيانات التخصيص والتواصل:</h4>
                {activeFields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      {field.label} {field.required && <span className="text-red-600">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        rows={2}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.id]: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.id]: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    )}
                  </div>
                ))}

                {/* رفع شعار المعلم */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    شعار المعلم (Logo) لإضافته للغلاف والصفحات (اختياري)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2.5 rounded-xl border border-dashed border-slate-400 hover:border-blue-600 text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>اختر صورة الشعار</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    {logoPreview && (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200">
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setLogoPreview('')}
                          className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>جاري تسجيل الطلب...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تأكيد الطلب والمتابعة إلى واتساب ({finalTotal} ج.م)</span>
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

// ==========================================
// 7. صفحة مكتبة المذكرات والتصفح الهرمي
// ==========================================
function CatalogPage({
  settings,
  notebooks,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedStageId,
  setSelectedStageId,
  selectedGradeId,
  setSelectedGradeId,
  onPreview,
  onAddToCart,
  cartIds
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');

  const categories = [...(settings.categories || DEFAULT_CATEGORIES)].sort((a, b) => (a.order || 0) - (b.order || 0));
  const stages = [...(settings.stages || DEFAULT_STAGES)].sort((a, b) => (a.order || 0) - (b.order || 0));
  const grades = [...(settings.grades || DEFAULT_GRADES)].sort((a, b) => (a.order || 0) - (b.order || 0));
  const subjects = settings.subjects || DEFAULT_SUBJECTS;

  const filteredNotebooks = useMemo(() => {
    return notebooks.filter((nb) => {
      if (selectedCategoryId && nb.categoryId !== selectedCategoryId) return false;
      if (selectedStageId) {
        const grade = grades.find((g) => g.id === nb.gradeId);
        if (!grade || grade.stageId !== selectedStageId) return false;
      }
      if (selectedGradeId && nb.gradeId !== selectedGradeId) return false;
      if (selectedSubjectId !== 'all' && nb.subjectId !== selectedSubjectId) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        if (!(nb.title || '').toLowerCase().includes(q) && !(nb.description || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [notebooks, selectedCategoryId, selectedStageId, selectedGradeId, selectedSubjectId, searchTerm, grades]);

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const activeStage = stages.find((s) => s.id === selectedStageId);
  const activeGrade = grades.find((g) => g.id === selectedGradeId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* شريط المسار والبحث */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black flex-wrap">
            <button
              onClick={() => {
                setSelectedCategoryId('');
                setSelectedStageId('');
                setSelectedGradeId('');
              }}
              className="text-blue-600 hover:underline"
            >
              جميع الأقسام
            </button>
            {activeCategory && (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <button
                  onClick={() => {
                    setSelectedStageId('');
                    setSelectedGradeId('');
                  }}
                  className="text-blue-600 hover:underline"
                >
                  {activeCategory.name}
                </button>
              </>
            )}
            {activeStage && (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <button
                  onClick={() => setSelectedGradeId('')}
                  className="text-blue-600 hover:underline"
                >
                  {activeStage.name}
                </button>
              </>
            )}
            {activeGrade && (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <span className="text-slate-900">{activeGrade.name}</span>
              </>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم المذكرة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold"
            />
          </div>
        </div>

        {/* أزرار تصفية سريعة بالمراحل والصفوف والمواد */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              setSelectedStageId('');
              setSelectedGradeId('');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              !selectedStageId ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            كل المراحل
          </button>
          {stages.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setSelectedStageId(st.id);
                setSelectedGradeId('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                selectedStageId === st.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st.name}
            </button>
          ))}
        </div>

        {selectedStageId && (
          <div className="flex flex-wrap gap-2">
            {grades
              .filter((g) => g.stageId === selectedStageId)
              .map((gr) => (
                <button
                  key={gr.id}
                  onClick={() => setSelectedGradeId(selectedGradeId === gr.id ? '' : gr.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    selectedGradeId === gr.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {gr.name}
                </button>
              ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
              selectedSubjectId === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            كل المواد
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                selectedSubjectId === sub.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* عرض المذكرات */}
      {filteredNotebooks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-black text-slate-800">لا توجد مذكرات مطابقة لهذا الاختيار حاليًا</h3>
          <button
            onClick={() => {
              setSelectedCategoryId('');
              setSelectedStageId('');
              setSelectedGradeId('');
              setSelectedSubjectId('all');
              setSearchTerm('');
            }}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black"
          >
            عرض جميع المذكرات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredNotebooks.map((nb) => (
            <NotebookCard
              key={nb.id}
              notebook={nb}
              settings={settings}
              onPreview={onPreview}
              onAddToCart={onAddToCart}
              isInCart={cartIds.has(nb.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 8. صفحة العروض وباقات التوفير
// ==========================================
function OffersAndBundlesPage({ settings, notebooks, coupons, onAddBundleToCart, onPreview }) {
  const [copiedCode, setCopiedCode] = useState('');

  const activeCoupons = useMemo(
    () =>
      coupons.filter((c) => {
        if (c.active === false) return false;
        if (c.singleUse && c.used) return false;
        if (c.expiresAt) {
          const exp = new Date(c.expiresAt).getTime();
          if (!Number.isNaN(exp) && Date.now() > exp) return false;
        }
        return true;
      }),
    [coupons]
  );

  const bundles = settings.bundles || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 space-y-10">
      {/* قسم باقات التوفير */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">باقات المذكرات المجمعة بخصم خاص</h2>
            <p className="text-xs sm:text-sm text-slate-600">اطلب الباقة كاملة بسعر مخفّض واضغط على أي مذكرة لمعاينة تفاصيلها</p>
          </div>
        </div>

        {bundles.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-slate-500 font-bold text-sm">
            لا توجد باقات مجمعة مضافة حاليًا.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bundles.map((bundle) => {
              const includedNotebooks = (bundle.notebookIds || [])
                .map((id) => notebooks.find((n) => n.id === id))
                .filter(Boolean);

              const originalSum =
                Number(bundle.originalPrice) ||
                includedNotebooks.reduce((s, n) => s + (Number(n.price) || 0), 0);

              let finalPrice = originalSum;
              if (bundle.discountType === 'custom_before_after' && Number(bundle.finalPrice) > 0) {
                finalPrice = Number(bundle.finalPrice);
              } else if (bundle.discountType === 'fixed') {
                finalPrice = Math.max(0, originalSum - (Number(bundle.discountValue) || 0));
              } else {
                const pct = Number(bundle.discountValue) || 0;
                finalPrice = Math.round(originalSum * (1 - pct / 100));
              }

              const savings = Math.max(0, originalSum - finalPrice);
              const pctSaved = originalSum > 0 ? Math.round((savings / originalSum) * 100) : 0;

              return (
                <div
                  key={bundle.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* رأس الباقة الفخم */}
                    <div className="bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
                      <div className="space-y-1.5 text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-black">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>باقة توفير شاملة • {includedNotebooks.length} مذكرات</span>
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black">{bundle.title}</h3>
                        {bundle.description && (
                          <p className="text-xs sm:text-sm text-slate-300">{bundle.description}</p>
                        )}
                      </div>

                      {savings > 0 && (
                        <div className="bg-amber-400 text-slate-950 px-3.5 py-2 rounded-2xl text-center shrink-0 shadow">
                          <div className="text-xs sm:text-sm font-black">وفّر {savings} ج.م</div>
                          <div className="text-[11px] font-bold">خصم {pctSaved}%</div>
                        </div>
                      )}
                    </div>

                    {/* قائمة المذكرات القابلة للمعاينة */}
                    <div className="p-4 sm:p-5 space-y-2.5 max-h-72 overflow-y-auto">
                      <div className="text-xs font-black text-slate-500">
                        محتويات الباقة (اضغط على أي مذكرة لمعاينتها):
                      </div>
                      {includedNotebooks.map((nb) => {
                        const gradeName = (settings.grades || []).find((g) => g.id === nb.gradeId)?.name || '';
                        return (
                          <div
                            key={nb.id}
                            onClick={() => onPreview(nb)}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 cursor-pointer transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {nb.coverImage ? (
                                  <img src={nb.coverImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <BookOpen className="w-5 h-5 text-blue-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-black text-slate-900 truncate">{nb.title}</div>
                                <div className="text-[11px] text-slate-500 font-bold">{gradeName}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-black text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                                {nb.price} ج.م
                              </span>
                              <span className="text-[11px] font-bold text-blue-600 flex items-center gap-0.5">
                                <Eye className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* شريط السعر وزر الإضافة للسلة */}
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-500 font-bold block">سعر الباقة كاملة بعد الخصم:</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-blue-700">{finalPrice} ج.م</span>
                        {originalSum > finalPrice && (
                          <span className="text-sm text-slate-400 line-through font-bold">{originalSum} ج.م</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onAddBundleToCart({
                          id: `bundle_${bundle.id}`,
                          title: bundle.title,
                          price: finalPrice,
                          isBundle: true,
                          bundleItems: includedNotebooks.map((n) => ({ id: n.id, title: n.title }))
                        })
                      }
                      className="px-5 py-3.5 rounded-2xl bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>أضف الباقة للسلة</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* قسم كوبونات الخصم المتاحة */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Tag className="w-6 h-6 text-amber-600" />
          <h2 className="text-xl font-black text-slate-900">كوبونات الخصم المتاحة حاليًا</h2>
        </div>

        {activeCoupons.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-500 text-sm font-bold">
            لا توجد كوبونات عامة متاحة حاليًا.
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
                  {c.expiresAt && (
                    <div className="text-[11px] font-bold text-amber-700 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>ينتهي: {new Date(c.expiresAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(c.code);
                    setCopiedCode(c.code);
                    setTimeout(() => setCopiedCode(''), 2000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs flex items-center gap-1.5"
                >
                  {copiedCode === c.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode === c.code ? 'تم النسخ' : 'نسخ الكود'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ==========================================
// 9. لوحة تحكم الإدارة الكاملة
// ==========================================
function AdminDashboard({
  settings,
  setSettings,
  notebooks,
  coupons,
  orders,
  onLogout,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('notebooks');
  const [localSettings, setLocalSettings] = useState(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setLocalSettings((prev) => ({
      ...settings,
      logoUrl: settings.logoUrl || prev.logoUrl || '',
      heroBgImage: settings.heroBgImage || prev.heroBgImage || '',
      categoryImages: { ...(prev.categoryImages || {}), ...(settings.categoryImages || {}) }
    }));
  }, [settings]);

  // حالة نموذج المذكرة
  const [editingNotebookId, setEditingNotebookId] = useState(null);
  const [nbForm, setNbForm] = useState({
    title: '',
    categoryId: DEFAULT_CATEGORIES[0].id,
    gradeId: DEFAULT_GRADES[0].id,
    subjectId: DEFAULT_SUBJECTS[0].id,
    price: 99,
    oldPrice: '',
    description: '',
    driveUrl: '',
    coverImage: '',
    samplePages: [],
    comingSoon: false,
    customAlertEnabled: false,
    customAlertBadge: 'تنبيه هام',
    customAlertText: '',
    customAlertColor: 'amber'
  });
  const [savingNb, setSavingNb] = useState(false);

  // التعديل السريع الجماعي
  const [bulkEdits, setBulkEdits] = useState({});
  const [savingBulk, setSavingBulk] = useState(false);

  // باقات التوفير والكوبونات
  const [bundleForm, setBundleForm] = useState({
    title: '',
    description: '',
    notebookIds: [],
    discountType: 'custom_before_after',
    discountValue: 20,
    originalPrice: '',
    finalPrice: ''
  });
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percent',
    value: 15,
    singleUse: false,
    expiresAt: ''
  });

  // إدارة الأقسام والمراحل والصفوف والمواد
  const [newCatName, setNewCatName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeStageId, setNewGradeStageId] = useState(DEFAULT_STAGES[0].id);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  const selectedBundleSum = useMemo(() => {
    return bundleForm.notebookIds.reduce((sum, id) => {
      const nb = notebooks.find((n) => n.id === id);
      return sum + (Number(nb?.price) || 0);
    }, 0);
  }, [bundleForm.notebookIds, notebooks]);

  const handleSaveAllSettings = async (overrideSettings = null) => {
    setSavingSettings(true);
    try {
      const target = overrideSettings || localSettings;
      const { logoUrl, heroBgImage, categoryImages, ...lightSettings } = target;

      await setDoc(publicDoc('settings', 'main'), lightSettings, { merge: true });
      await setDoc(
        publicDoc('settings', 'media_assets'),
        {
          logoUrl: logoUrl || '',
          heroBgImage: heroBgImage || '',
          categoryImages: categoryImages || {}
        },
        { merge: true }
      );

      setSettings(target);
      try {
        localStorage.setItem(LOCAL_SETTINGS_BACKUP_KEY, JSON.stringify(lightSettings));
      } catch {
        // تجاهل امتلاء التخزين المحلي
      }
      showToast('تم حفظ جميع الإعدادات وتحديثها للعملاء بنجاح!');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء الحفظ، تأكد من صلاحيات Firebase Rules', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveNotebook = async (e) => {
    e.preventDefault();
    if (!nbForm.title.trim() || savingNb) return;
    setSavingNb(true);
    try {
      const { samplePages, ...nbMainData } = nbForm;
      const payload = {
        ...nbMainData,
        price: Number(nbForm.price) || 0,
        oldPrice: nbForm.oldPrice ? Number(nbForm.oldPrice) : 0,
        updatedAt: serverTimestamp()
      };

      let targetId = editingNotebookId;
      if (editingNotebookId) {
        await updateDoc(publicDoc('notebooks', editingNotebookId), payload);
      } else {
        const docRef = await addDoc(publicCol('notebooks'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        targetId = docRef.id;
      }

      if (targetId && Array.isArray(samplePages)) {
        await setDoc(publicDoc('notebook_samples', targetId), { pages: samplePages });
      }

      setEditingNotebookId(null);
      setNbForm({
        title: '',
        categoryId: (localSettings.categories?.[0] || DEFAULT_CATEGORIES[0]).id,
        gradeId: (localSettings.grades?.[0] || DEFAULT_GRADES[0]).id,
        subjectId: (localSettings.subjects?.[0] || DEFAULT_SUBJECTS[0]).id,
        price: 99,
        oldPrice: '',
        description: '',
        driveUrl: '',
        coverImage: '',
        samplePages: [],
        comingSoon: false,
        customAlertEnabled: false,
        customAlertBadge: 'تنبيه هام',
        customAlertText: '',
        customAlertColor: 'amber'
      });
      showToast(editingNotebookId ? 'تم تحديث المذكرة بنجاح!' : 'تمت إضافة المذكرة بنجاح!');
    } catch (err) {
      console.error(err);
      showToast('فشل حفظ المذكرة، تحقق من الاتصال أو حجم الصور', 'error');
    } finally {
      setSavingNb(false);
    }
  };

  const handleSaveBulkEdits = async () => {
    const entries = Object.entries(bulkEdits);
    if (entries.length === 0 || savingBulk) return;
    setSavingBulk(true);
    try {
      for (const [nbId, changes] of entries) {
        await updateDoc(publicDoc('notebooks', nbId), {
          ...changes,
          ...(changes.price !== undefined ? { price: Number(changes.price) || 0 } : {}),
          ...(changes.oldPrice !== undefined ? { oldPrice: Number(changes.oldPrice) || 0 } : {}),
          updatedAt: serverTimestamp()
        });
      }
      setBulkEdits({});
      showToast(`تم حفظ التعديلات على ${entries.length} مذكرة دفعة واحدة!`);
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء الحفظ الجماعي', 'error');
    } finally {
      setSavingBulk(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* شريط رأس لوحة التحكم */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black">لوحة تحكم الإدارة</h1>
            <p className="text-xs text-slate-300">تحكم كامل في المذكرات، الأقسام، الخصومات والعروض، والطلبات</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSaveAllSettings()}
            disabled={savingSettings}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* تبويبات الإدارة */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
        {[
          { id: 'notebooks', label: `المذكرات (${notebooks.length})`, icon: BookOpen },
          { id: 'categories', label: 'الأقسام والمراحل والصفوف', icon: FolderOpen },
          { id: 'offers', label: 'الخصومات والعروض', icon: Percent },
          { id: 'orders', label: `الطلبات (${orders.length})`, icon: Package },
          { id: 'settings', label: 'إعدادات الموقع والمظهر', icon: Settings }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition ${
                activeTab === t.id ? 'bg-blue-600 text-white shadow' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. تبويب المذكرات */}
      {activeTab === 'notebooks' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveNotebook} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                {editingNotebookId ? 'تعديل بيانات المذكرة' : '+ إضافة مذكرة جديدة'}
              </h2>
              {editingNotebookId && (
                <button
                  type="button"
                  onClick={() => setEditingNotebookId(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-600">عنوان المذكرة *</label>
                <input
                  type="text"
                  required
                  value={nbForm.title}
                  onChange={(e) => setNbForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="مثال: بنك مراجعة الصف الثالث الإعدادي"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">القسم الرئيسي</label>
                <select
                  value={nbForm.categoryId}
                  onChange={(e) => setNbForm((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                >
                  {(localSettings.categories || DEFAULT_CATEGORIES).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">الصف الدراسي</label>
                <select
                  value={nbForm.gradeId}
                  onChange={(e) => setNbForm((p) => ({ ...p, gradeId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                >
                  {(localSettings.grades || DEFAULT_GRADES).map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">المادة</label>
                <select
                  value={nbForm.subjectId}
                  onChange={(e) => setNbForm((p) => ({ ...p, subjectId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                >
                  {(localSettings.subjects || DEFAULT_SUBJECTS).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">السعر الحالي (ج.م) *</label>
                <input
                  type="number"
                  required
                  value={nbForm.price}
                  onChange={(e) => setNbForm((p) => ({ ...p, price: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">السعر قبل الخصم (اختياري)</label>
                <input
                  type="number"
                  value={nbForm.oldPrice}
                  onChange={(e) => setNbForm((p) => ({ ...p, oldPrice: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">رابط عينة Google Drive</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={nbForm.driveUrl}
                  onChange={(e) => setNbForm((p) => ({ ...p, driveUrl: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">وصف المذكرة</label>
              <textarea
                rows={2}
                value={nbForm.description}
                onChange={(e) => setNbForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nbForm.comingSoon}
                  onChange={(e) => setNbForm((p) => ({ ...p, comingSoon: e.target.checked }))}
                />
                <span>وضع المذكرة «قيد التجهيز / حجز مسبق»</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nbForm.customAlertEnabled}
                  onChange={(e) => setNbForm((p) => ({ ...p, customAlertEnabled: e.target.checked }))}
                />
                <span>إظهار تنبيه خاص داخل المذكرة</span>
              </label>
            </div>

            {nbForm.customAlertEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                <input
                  type="text"
                  placeholder="عنوان الشارة (مثال: تنبيه هام)"
                  value={nbForm.customAlertBadge}
                  onChange={(e) => setNbForm((p) => ({ ...p, customAlertBadge: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold bg-white"
                />
                <input
                  type="text"
                  placeholder="نص التنبيه للعميل..."
                  value={nbForm.customAlertText}
                  onChange={(e) => setNbForm((p) => ({ ...p, customAlertText: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold bg-white"
                />
                <select
                  value={nbForm.customAlertColor}
                  onChange={(e) => setNbForm((p) => ({ ...p, customAlertColor: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold bg-white"
                >
                  <option value="amber">لون ذهبي / تحذيري</option>
                  <option value="blue">لون أزرق معلوماتي</option>
                  <option value="emerald">لون أخضر مميز</option>
                  <option value="rose">لون أحمر هام</option>
                </select>
              </div>
            )}

            {/* رفع الغلاف وصفحات العينة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-black text-slate-800 block">صورة غلاف المذكرة:</span>
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold cursor-pointer">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>رفع صورة الغلاف</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await compressImage(file, 800, 0.78);
                      setNbForm((p) => ({ ...p, coverImage: url }));
                    }}
                  />
                </label>
                {nbForm.coverImage && (
                  <img src={nbForm.coverImage} alt="" className="h-20 rounded-xl object-cover border" />
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-black text-slate-800 block">
                  صفحات العينة الداخلية ({nbForm.samplePages.length}/15):
                </span>
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold cursor-pointer">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>إضافة صور عينات</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []).slice(0, 15 - nbForm.samplePages.length);
                      const compressedList = await Promise.all(files.map((f) => compressImage(f, 850, 0.72)));
                      setNbForm((p) => ({ ...p, samplePages: [...p.samplePages, ...compressedList] }));
                    }}
                  />
                </label>
                {nbForm.samplePages.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pt-1">
                    {nbForm.samplePages.map((img, i) => (
                      <div key={i} className="relative w-12 h-14 rounded-lg overflow-hidden border shrink-0">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setNbForm((p) => ({
                              ...p,
                              samplePages: p.samplePages.filter((_, idx) => idx !== i)
                            }))
                          }
                          className="absolute top-0 right-0 bg-red-600 text-white p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingNb}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm"
            >
              {savingNb ? 'جاري الحفظ...' : editingNotebookId ? 'حفظ تعديلات المذكرة' : '+ نشر المذكرة الآن'}
            </button>
          </form>

          {/* قائمة المذكرات والتعديل السريع الجماعي */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">التعديل السريع الجماعي للمذكرات</h3>
                <p className="text-xs text-slate-500">عدّل أي عدد من المذكرات مباشرة ثم اضغط حفظ دفعة واحدة</p>
              </div>
              {Object.keys(bulkEdits).length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveBulkEdits}
                  disabled={savingBulk}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow"
                >
                  {savingBulk
                    ? 'جاري الحفظ...'
                    : `حفظ جميع التعديلات دفعة واحدة (${Object.keys(bulkEdits).length} مذكرة)`}
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {notebooks.map((nb) => {
                const draft = { ...nb, ...(bulkEdits[nb.id] || {}) };
                const isModified = Boolean(bulkEdits[nb.id]);
                return (
                  <div
                    key={nb.id}
                    className={`p-3 rounded-2xl border grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center ${
                      isModified ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) =>
                        setBulkEdits((p) => ({ ...p, [nb.id]: { ...(p[nb.id] || {}), title: e.target.value } }))
                      }
                      className="md:col-span-4 px-3 py-2 rounded-xl border border-slate-300 text-xs font-black bg-white"
                    />
                    <select
                      value={draft.categoryId}
                      onChange={(e) =>
                        setBulkEdits((p) => ({ ...p, [nb.id]: { ...(p[nb.id] || {}), categoryId: e.target.value } }))
                      }
                      className="md:col-span-2 px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      {(localSettings.categories || DEFAULT_CATEGORIES).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <select
                      value={draft.gradeId}
                      onChange={(e) =>
                        setBulkEdits((p) => ({ ...p, [nb.id]: { ...(p[nb.id] || {}), gradeId: e.target.value } }))
                      }
                      className="md:col-span-2 px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      {(localSettings.grades || DEFAULT_GRADES).map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={draft.price}
                      onChange={(e) =>
                        setBulkEdits((p) => ({ ...p, [nb.id]: { ...(p[nb.id] || {}), price: e.target.value } }))
                      }
                      className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-300 text-xs font-black bg-white"
                    />
                    <div className="md:col-span-2 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          setEditingNotebookId(nb.id);
                          let pages = nb.samplePages || [];
                          try {
                            const s = await getDoc(publicDoc('notebook_samples', nb.id));
                            if (s.exists()) pages = s.data().pages || [];
                          } catch {
                            // تجاهل
                          }
                          setNbForm({
                            title: nb.title || '',
                            categoryId: nb.categoryId || DEFAULT_CATEGORIES[0].id,
                            gradeId: nb.gradeId || DEFAULT_GRADES[0].id,
                            subjectId: nb.subjectId || DEFAULT_SUBJECTS[0].id,
                            price: nb.price || 99,
                            oldPrice: nb.oldPrice || '',
                            description: nb.description || '',
                            driveUrl: nb.driveUrl || '',
                            coverImage: nb.coverImage || '',
                            samplePages: pages,
                            comingSoon: Boolean(nb.comingSoon),
                            customAlertEnabled: Boolean(nb.customAlertEnabled),
                            customAlertBadge: nb.customAlertBadge || 'تنبيه هام',
                            customAlertText: nb.customAlertText || '',
                            customAlertColor: nb.customAlertColor || 'amber'
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200"
                        title="تعديل كامل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteDoc(publicDoc('notebooks', nb.id));
                          showToast('تم حذف المذكرة');
                        }}
                        className="p-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. تبويب الأقسام والمراحل والصفوف */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900">الأقسام الرئيسية وصورها</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="اسم قسم رئيسي جديد..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newCatName.trim()) return;
                  const updated = [
                    ...(localSettings.categories || []),
                    { id: `cat_${Date.now()}`, name: newCatName.trim(), order: (localSettings.categories?.length || 0) + 1 }
                  ];
                  setLocalSettings((p) => ({ ...p, categories: updated }));
                  setNewCatName('');
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-black text-sm"
              >
                + إضافة قسم
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(localSettings.categories || DEFAULT_CATEGORIES).map((cat) => {
                const catImg = localSettings.categoryImages?.[cat.id] || '';
                return (
                  <div key={cat.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) =>
                          setLocalSettings((p) => ({
                            ...p,
                            categories: (p.categories || []).map((c) =>
                              c.id === cat.id ? { ...c, name: e.target.value } : c
                            )
                          }))
                        }
                        className="font-black text-sm bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 flex-1"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings((p) => ({
                            ...p,
                            categories: (p.categories || []).filter((c) => c.id !== cat.id)
                          }))
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {catImg && <img src={catImg} alt="" className="w-full h-28 object-cover rounded-xl border" />}
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{catImg ? 'تغيير صورة القسم' : 'رفع صورة للقسم'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await compressImage(file, 700, 0.78);
                          setLocalSettings((p) => ({
                            ...p,
                            categoryImages: { ...(p.categoryImages || {}), [cat.id]: url }
                          }));
                        }}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* المراحل والصفوف والمواد */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* المراحل */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
              <h3 className="font-black text-base text-slate-900">المراحل الدراسية</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مرحلة جديدة..."
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newStageName.trim()) return;
                    setLocalSettings((p) => ({
                      ...p,
                      stages: [...(p.stages || []), { id: `st_${Date.now()}`, name: newStageName.trim() }]
                    }));
                    setNewStageName('');
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-black"
                >
                  +
                </button>
              </div>
              <div className="space-y-1.5">
                {(localSettings.stages || DEFAULT_STAGES).map((st) => (
                  <div key={st.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs font-bold">
                    <span>{st.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings((p) => ({ ...p, stages: (p.stages || []).filter((s) => s.id !== st.id) }))
                      }
                      className="text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* الصفوف */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
              <h3 className="font-black text-base text-slate-900">الصفوف الدراسية</h3>
              <div className="space-y-2">
                <select
                  value={newGradeStageId}
                  onChange={(e) => setNewGradeStageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                >
                  {(localSettings.stages || DEFAULT_STAGES).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اسم الصف..."
                    value={newGradeName}
                    onChange={(e) => setNewGradeName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newGradeName.trim()) return;
                      setLocalSettings((p) => ({
                        ...p,
                        grades: [
                          ...(p.grades || []),
                          { id: `gr_${Date.now()}`, stageId: newGradeStageId, name: newGradeName.trim() }
                        ]
                      }));
                      setNewGradeName('');
                    }}
                    className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-black"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {(localSettings.grades || DEFAULT_GRADES).map((gr) => (
                  <div key={gr.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs font-bold">
                    <span>{gr.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings((p) => ({ ...p, grades: (p.grades || []).filter((g) => g.id !== gr.id) }))
                      }
                      className="text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* المواد */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
              <h3 className="font-black text-base text-slate-900">المواد الدراسية</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مادة جديدة..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSubjectName.trim()) return;
                    setLocalSettings((p) => ({
                      ...p,
                      subjects: [...(p.subjects || []), { id: `sub_${Date.now()}`, name: newSubjectName.trim() }]
                    }));
                    setNewSubjectName('');
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-black"
                >
                  +
                </button>
              </div>
              <div className="space-y-1.5">
                {(localSettings.subjects || DEFAULT_SUBJECTS).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs font-bold">
                    <span>{sub.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings((p) => ({ ...p, subjects: (p.subjects || []).filter((s) => s.id !== sub.id) }))
                      }
                      className="text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSaveAllSettings()}
            className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm"
          >
            حفظ الأقسام والمراحل والصفوف
          </button>
        </div>
      )}

      {/* 3. تبويب الخصومات والعروض */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          {/* 1. الشريط الترويجي العلوي */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">1. الشريط الترويجي العلوي وكوبون النسخ السريع</h2>
              <label className="flex items-center gap-2 text-xs font-black cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.promoBannerEnabled !== false}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, promoBannerEnabled: e.target.checked }))}
                />
                <span>تفعيل الشريط</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
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
                  value={localSettings.promoBannerColor || 'blue'}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, promoBannerColor: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                >
                  <option value="navy">كحلي داكن فخم</option>
                  <option value="blue">أزرق ملكي</option>
                  <option value="emerald">أخضر زمردي</option>
                  <option value="crimson">أحمر ياقوتي</option>
                  <option value="purple">بنفسجي</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">كود الكوبون المدمج للنسخ</label>
                <input
                  type="text"
                  value={localSettings.promoBannerCoupon || ''}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, promoBannerCoupon: e.target.value.toUpperCase() }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-black uppercase"
                />
              </div>
            </div>
          </div>

          {/* 2. كوبون مكافأة الطلب القادم */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">2. كوبون مكافأة الطلب القادم (يظهر للعميل بعد إتمام الطلب)</h2>
              <label className="flex items-center gap-2 text-xs font-black cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(localSettings.nextOrderRewardEnabled)}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardEnabled: e.target.checked }))}
                />
                <span>تفعيل المكافأة</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600">نوع الكود</label>
                <select
                  value={localSettings.nextOrderRewardMode || 'auto'}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardMode: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                >
                  <option value="auto">توليد كود فريد لمرة واحدة</option>
                  <option value="custom">كود ثابت من اختيارك</option>
                </select>
              </div>

              {localSettings.nextOrderRewardMode === 'custom' && (
                <div>
                  <label className="text-xs font-bold text-slate-600">الكود الثابت</label>
                  <input
                    type="text"
                    value={localSettings.nextOrderRewardCustomCode || ''}
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
                  value={localSettings.nextOrderRewardType || 'percent'}
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

              <div>
                <label className="text-xs font-bold text-slate-600">مدة الصلاحية (بالأيام)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0 = مفتوح"
                  value={localSettings.nextOrderRewardValidDays ?? 7}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardValidDays: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="عنوان المكافأة"
                value={localSettings.nextOrderRewardTitle}
                onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardTitle: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
              />
              <input
                type="text"
                placeholder="رسالة المكافأة للعميل"
                value={localSettings.nextOrderRewardMessage}
                onChange={(e) => setLocalSettings((p) => ({ ...p, nextOrderRewardMessage: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSaveAllSettings()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs"
            >
              حفظ إعدادات الشريط الترويجي ومكافأة الطلب القادم
            </button>
          </div>

          {/* 3. باقات التوفير ومجموعات المذكرات */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900">3. إعداد باقات التوفير المجمعة</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 max-h-64 overflow-y-auto space-y-2">
                <span className="text-xs font-black text-slate-700 block">
                  حدد المذكرات المشمولة ({bundleForm.notebookIds.length} مختارة — المجموع: {selectedBundleSum} ج.م):
                </span>
                {notebooks.map((nb) => {
                  const checked = bundleForm.notebookIds.includes(nb.id);
                  return (
                    <label
                      key={nb.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer text-xs font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const nextIds = e.target.checked
                              ? [...bundleForm.notebookIds, nb.id]
                              : bundleForm.notebookIds.filter((id) => id !== nb.id);
                            setBundleForm((p) => ({ ...p, notebookIds: nextIds }));
                          }}
                        />
                        <span>{nb.title}</span>
                      </div>
                      <span className="text-blue-600 font-black">{nb.price} ج.م</span>
                    </label>
                  );
                })}
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="اسم الباقة (مثال: باقة مراجعة المرحلة الإعدادية)"
                  value={bundleForm.title}
                  onChange={(e) => setBundleForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                />
                <input
                  type="text"
                  placeholder="وصف مختصر للباقة"
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
                <select
                  value={bundleForm.discountType}
                  onChange={(e) => setBundleForm((p) => ({ ...p, discountType: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                >
                  <option value="custom_before_after">تحديد السعر قبل وبعد يدويًا (ج.م)</option>
                  <option value="percent">خصم نسبة مئوية (%)</option>
                  <option value="fixed">خصم مبلغ ثابت (ج.م)</option>
                </select>

                {bundleForm.discountType === 'custom_before_after' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder={`السعر قبل (${selectedBundleSum})`}
                      value={bundleForm.originalPrice}
                      onChange={(e) => setBundleForm((p) => ({ ...p, originalPrice: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                    />
                    <input
                      type="number"
                      placeholder="السعر بعد الخصم"
                      value={bundleForm.finalPrice}
                      onChange={(e) => setBundleForm((p) => ({ ...p, finalPrice: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-black"
                    />
                  </div>
                ) : (
                  <input
                    type="number"
                    placeholder={bundleForm.discountType === 'percent' ? 'نسبة الخصم %' : 'قيمة الخصم ج.م'}
                    value={bundleForm.discountValue}
                    onChange={(e) => setBundleForm((p) => ({ ...p, discountValue: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-black"
                  />
                )}

                <button
                  type="button"
                  onClick={async () => {
                    if (!bundleForm.title.trim() || bundleForm.notebookIds.length === 0) return;
                    const newBundle = {
                      id: `bnd_${Date.now()}`,
                      title: bundleForm.title.trim(),
                      description: bundleForm.description.trim(),
                      notebookIds: bundleForm.notebookIds,
                      discountType: bundleForm.discountType,
                      discountValue: Number(bundleForm.discountValue) || 0,
                      originalPrice: Number(bundleForm.originalPrice) || selectedBundleSum,
                      finalPrice: Number(bundleForm.finalPrice) || 0
                    };
                    const updated = {
                      ...localSettings,
                      bundles: [...(localSettings.bundles || []), newBundle]
                    };
                    setLocalSettings(updated);
                    await handleSaveAllSettings(updated);
                    setBundleForm({
                      title: '',
                      description: '',
                      notebookIds: [],
                      discountType: 'custom_before_after',
                      discountValue: 20,
                      originalPrice: '',
                      finalPrice: ''
                    });
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm"
                >
                  + حفظ الباقة وتفعيلها
                </button>
              </div>
            </div>

            {(localSettings.bundles || []).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(localSettings.bundles || []).map((b) => (
                  <div key={b.id} className="p-3.5 rounded-2xl bg-slate-50 border flex items-center justify-between">
                    <div>
                      <div className="font-black text-sm">{b.title}</div>
                      <div className="text-xs text-slate-500">{b.notebookIds?.length || 0} مذكرات</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = {
                          ...localSettings,
                          bundles: (localSettings.bundles || []).filter((item) => item.id !== b.id)
                        };
                        setLocalSettings(updated);
                        await handleSaveAllSettings(updated);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
              <div>
                <input
                  type="datetime-local"
                  title="تاريخ ووقت انتهاء الكوبون (اختياري)"
                  value={couponForm.expiresAt}
                  onChange={(e) => setCouponForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>
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
                    expiresAt: couponForm.expiresAt ? new Date(couponForm.expiresAt).toISOString() : null,
                    createdAt: serverTimestamp()
                  });
                  setCouponForm({ code: '', type: 'percent', value: 15, singleUse: false, expiresAt: '' });
                  showToast('تم إنشاء الكوبون بنجاح!');
                }}
                className="py-2.5 px-4 rounded-xl bg-blue-600 text-white font-black text-sm"
              >
                + إضافة الكوبون
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {coupons.map((c) => {
                const isExpired = c.expiresAt && Date.now() > new Date(c.expiresAt).getTime();
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border ${
                      isExpired ? 'bg-red-50/70 border-red-200' : 'bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm">{c.code}</span>
                        {isExpired && (
                          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black">
                            منتهي
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-emerald-700 font-bold">
                        خصم {c.value} {c.type === 'fixed' ? 'ج.م' : '%'} {c.singleUse ? '(مرة واحدة)' : ''}
                      </div>
                      {c.expiresAt && (
                        <div className={`text-[11px] font-bold mt-0.5 ${isExpired ? 'text-red-600' : 'text-slate-500'}`}>
                          ينتهي:{' '}
                          {new Date(c.expiresAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      )}
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
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. تبويب الطلبات */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-500 font-bold">
              لا توجد طلبات مسجلة حتى الآن.
            </div>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-black text-base text-blue-700">{ord.orderNumber}</span>
                    <span className="mr-3 text-xs font-bold text-slate-600">
                      {ord.customerData?.teacherName} • {ord.customerData?.whatsapp}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={ord.status || 'تم الاستلام'}
                      onChange={async (e) => {
                        await updateDoc(publicDoc('orders', ord.id), { status: e.target.value });
                        showToast('تم تحديث حالة الطلب');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-black"
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

                <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl space-y-1">
                  {(ord.items || []).map((it, idx) => (
                    <div key={idx} className="font-bold">
                      • {it.title} ({it.price} ج.م)
                    </div>
                  ))}
                  <div className="pt-1 font-black text-slate-900">الإجمالي: {ord.total} ج.م</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. تبويب إعدادات الموقع والمظهر */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* الهوية والشعار والخلفية */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900">الهوية والشعار والواجهة الرئيسية</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="text-xs font-bold text-slate-600">الوصف المختصر أسفل الاسم</label>
                <input
                  type="text"
                  value={localSettings.tagline}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, tagline: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">عنوان الواجهة الرئيسية</label>
                <input
                  type="text"
                  value={localSettings.heroTitle}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, heroTitle: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">رقم الواتساب لاستقبال الطلبات (بالكود الدولي)</label>
                <input
                  type="text"
                  value={localSettings.whatsappNumber}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, whatsappNumber: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">شعار المنصة (Logo)</span>
                  <span className="text-xs font-bold text-slate-500">الحجم: {localSettings.logoSize}px</span>
                </div>
                <input
                  type="range"
                  min={36}
                  max={84}
                  value={localSettings.logoSize || 52}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, logoSize: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-2 rounded-xl bg-white border text-xs font-bold cursor-pointer">
                    رفع الشعار
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await compressImage(file, 400, 0.85);
                        setLocalSettings((p) => ({ ...p, logoUrl: url }));
                      }}
                    />
                  </label>
                  {localSettings.logoUrl && (
                    <img src={localSettings.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover border" />
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">صورة خلفية الواجهة الرئيسية</span>
                  <span className="text-xs font-bold text-slate-500">
                    الشفافية: {Math.round((localSettings.heroBgOpacity ?? 0.28) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.85}
                  step={0.05}
                  value={localSettings.heroBgOpacity ?? 0.28}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, heroBgOpacity: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-2 rounded-xl bg-white border text-xs font-bold cursor-pointer">
                    رفع صورة الخلفية
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await compressImage(file, 1280, 0.78);
                        setLocalSettings((p) => ({ ...p, heroBgImage: url }));
                      }}
                    />
                  </label>
                  {localSettings.heroBgImage && (
                    <button
                      type="button"
                      onClick={() => setLocalSettings((p) => ({ ...p, heroBgImage: '' }))}
                      className="text-xs font-bold text-red-600"
                    >
                      حذف الخلفية
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* قسم ما الجديد؟ وقسم الأخبار */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base">قسم «ما الجديد؟»</h3>
                <input
                  type="checkbox"
                  checked={localSettings.whatsNewEnabled !== false}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, whatsNewEnabled: e.target.checked }))}
                />
              </div>
              <input
                type="text"
                value={localSettings.whatsNewTitle}
                onChange={(e) => setLocalSettings((p) => ({ ...p, whatsNewTitle: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
              />
              <select
                value={localSettings.whatsNewMode || 'auto'}
                onChange={(e) => setLocalSettings((p) => ({ ...p, whatsNewMode: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
              >
                <option value="auto">تلقائي (أحدث المذكرات المضافة)</option>
                <option value="manual">اختيار يدوي للمذكرات</option>
              </select>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base">قسم الأخبار والإعلانات</h3>
                <input
                  type="checkbox"
                  checked={localSettings.newsSectionEnabled !== false}
                  onChange={(e) => setLocalSettings((p) => ({ ...p, newsSectionEnabled: e.target.checked }))}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setLocalSettings((p) => ({
                    ...p,
                    newsItems: [
                      ...(p.newsItems || []),
                      { id: `nw_${Date.now()}`, title: 'خبر جديد', date: 'الآن', description: '' }
                    ]
                  }))
                }
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black"
              >
                + إضافة خبر
              </button>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(localSettings.newsItems || []).map((nw, idx) => (
                  <div key={nw.id} className="p-2.5 rounded-xl bg-slate-50 border space-y-1.5">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={nw.title}
                        onChange={(e) =>
                          setLocalSettings((p) => ({
                            ...p,
                            newsItems: p.newsItems.map((item, i) =>
                              i === idx ? { ...item, title: e.target.value } : item
                            )
                          }))
                        }
                        className="flex-1 px-2 py-1 rounded-lg border text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings((p) => ({
                            ...p,
                            newsItems: p.newsItems.filter((_, i) => i !== idx)
                          }))
                        }
                        className="text-red-600 px-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* حقول نموذج طلب العميل */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
            <h3 className="font-black text-base">حقول بيانات العميل داخل السلة</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="اسم حقل جديد..."
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border text-xs font-bold"
              />
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="px-3 py-2 rounded-xl border text-xs font-bold"
              >
                <option value="text">نص قصير</option>
                <option value="tel">رقم هاتف</option>
                <option value="textarea">نص طويل</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!newFieldLabel.trim()) return;
                  setLocalSettings((p) => ({
                    ...p,
                    customerFields: [
                      ...(p.customerFields || DEFAULT_CUSTOMER_FIELDS),
                      {
                        id: `fld_${Date.now()}`,
                        label: newFieldLabel.trim(),
                        placeholder: '',
                        type: newFieldType,
                        required: false,
                        visible: true,
                        order: (p.customerFields?.length || 0) + 1
                      }
                    ]
                  }));
                  setNewFieldLabel('');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black"
              >
                + إضافة
              </button>
            </div>

            <div className="space-y-2">
              {(localSettings.customerFields || DEFAULT_CUSTOMER_FIELDS).map((fld, idx) => (
                <div key={fld.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border text-xs font-bold">
                  <span>{fld.label}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={fld.visible !== false}
                        onChange={(e) =>
                          setLocalSettings((p) => ({
                            ...p,
                            customerFields: p.customerFields.map((f, i) =>
                              i === idx ? { ...f, visible: e.target.checked } : f
                            )
                          }))
                        }
                      />
                      <span>ظاهر</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={Boolean(fld.required)}
                        onChange={(e) =>
                          setLocalSettings((p) => ({
                            ...p,
                            customerFields: p.customerFields.map((f, i) =>
                              i === idx ? { ...f, required: e.target.checked } : f
                            )
                          }))
                        }
                      />
                      <span>إلزامي</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSaveAllSettings()}
            className="px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg"
          >
            حفظ جميع إعدادات الموقع والمظهر
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 10. التطبيق الرئيسي للمنصة
// ==========================================
function MuzakkiratiApp() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [notebooks, setNotebooks] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [orders, setOrders] = useState([]);

  const [activePage, setActivePage] = useState('home'); // 'home' | 'catalog' | 'offers' | 'track' | 'admin'
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');

  const [previewNotebook, setPreviewNotebook] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [toast, setToast] = useState(null);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [promoCopied, setPromoCopied] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackNotFound, setTrackNotFound] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const logoClickCountRef = useRef(0);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // مراقبة التمرير لتقليص الهيدر على الهاتف
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 45);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // إدارة زر الرجوع في المتصفح والهاتف
  const navigateTo = (page, catId = '', stageId = '', gradeId = '') => {
    setActivePage(page);
    setSelectedCategoryId(catId);
    setSelectedStageId(stageId);
    setSelectedGradeId(gradeId);
    window.history.pushState({ page, catId, stageId, gradeId }, '', `#${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      if (e.state?.page) {
        setActivePage(e.state.page);
        setSelectedCategoryId(e.state.catId || '');
        setSelectedStageId(e.state.stageId || '');
        setSelectedGradeId(e.state.gradeId || '');
      } else {
        setActivePage('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [previewNotebook, cartOpen]);

  // مراقبة تسجيل الدخول والمزامنة الفورية مع Firestore
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        signInAnonymously(auth).catch(() => {});
      }
    });

    const unsubMain = onSnapshot(publicDoc('settings', 'main'), (snap) => {
      if (snap.exists()) {
        setSettings((prev) => ({ ...prev, ...snap.data() }));
      }
    });

    const unsubMedia = onSnapshot(publicDoc('settings', 'media_assets'), (snap) => {
      if (snap.exists()) {
        const m = snap.data();
        setSettings((prev) => ({
          ...prev,
          logoUrl: m.logoUrl || prev.logoUrl || '',
          heroBgImage: m.heroBgImage || prev.heroBgImage || '',
          categoryImages: { ...(prev.categoryImages || {}), ...(m.categoryImages || {}) }
        }));
      }
    });

    const unsubNotebooks = onSnapshot(publicCol('notebooks'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotebooks(list);
    });

    const unsubCoupons = onSnapshot(publicCol('coupons'), (snap) => {
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubOrders = onSnapshot(publicCol('orders'), (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubAuth();
      unsubMain();
      unsubMedia();
      unsubNotebooks();
      unsubCoupons();
      unsubOrders();
    };
  }, []);

  const isAdmin = Boolean(user && !user.isAnonymous && user.email === ADMIN_EMAIL);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, adminPassword);
      setAdminLoginOpen(false);
      setAdminPassword('');
      setActivePage('admin');
      showToast('مرحبًا بك في لوحة تحكم الإدارة');
    } catch {
      setLoginError('كلمة المرور غير صحيحة');
    }
  };

  const cartIds = useMemo(() => new Set(cart.map((c) => c.id)), [cart]);

  const handleAddToCart = (item) => {
    if (cartIds.has(item.id)) {
      showToast('هذا العنصر موجود بالفعل في السلة');
      return;
    }
    setCart((prev) => [...prev, item]);
    showToast(`تمت إضافة «${item.title}» إلى السلة بنجاح`);
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    const qStr = trackQuery.trim().toUpperCase();
    if (!qStr) return;
    setTrackingLoading(true);
    setTrackNotFound(false);
    setTrackedOrder(null);
    try {
      const localMatch = orders.find(
        (o) =>
          (o.orderNumber || '').toUpperCase() === qStr ||
          (o.customerData?.whatsapp || '').includes(trackQuery.trim())
      );
      if (localMatch) {
        setTrackedOrder(localMatch);
      } else {
        setTrackNotFound(true);
      }
    } finally {
      setTrackingLoading(false);
    }
  };

  const whatsNewList = useMemo(() => {
    if (settings.whatsNewMode === 'manual' && Array.isArray(settings.whatsNewManualIds)) {
      return settings.whatsNewManualIds
        .map((id) => notebooks.find((n) => n.id === id))
        .filter(Boolean);
    }
    return notebooks.slice(0, Number(settings.whatsNewCount) || 4);
  }, [notebooks, settings]);

  const comingSoonList = useMemo(() => notebooks.filter((n) => n.comingSoon), [notebooks]);

  const bannerColors = {
    navy: 'bg-slate-950',
    blue: 'bg-blue-700',
    emerald: 'bg-emerald-700',
    crimson: 'bg-rose-700',
    purple: 'bg-purple-800'
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* إشعار Toast عائم */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* الشريط العلوي المثبّت (الشريط الترويجي + الهيدر) */}
      <header className="sticky top-0 z-40 shadow-sm bg-white/95 backdrop-blur-md border-b border-slate-200">
        {settings.promoBannerEnabled !== false && !promoDismissed && (
          <div
            className={`${bannerColors[settings.promoBannerColor || 'blue']} text-white transition-all duration-300 ${
              isScrolled ? 'hidden md:block py-1.5' : 'py-2'
            }`}
          >
            <div className="max-w-7xl mx-auto px-3 flex flex-wrap items-center justify-center gap-2 text-center text-[11px] sm:text-xs font-black">
              <span>{settings.promoBannerText}</span>
              {settings.promoBannerCoupon && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(settings.promoBannerCoupon);
                    setPromoCopied(true);
                    setTimeout(() => setPromoCopied(false), 2000);
                  }}
                  className="px-2.5 py-0.5 rounded-lg bg-white text-slate-900 font-black inline-flex items-center gap-1 hover:bg-amber-100"
                >
                  {promoCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>
                    {promoCopied
                      ? 'تم النسخ!'
                      : `${settings.promoBannerCopyText || 'انسخ الكوبون'}: ${settings.promoBannerCoupon}`}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => navigateTo('offers')}
                className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black hover:bg-amber-300"
              >
                العروض ←
              </button>
              <button
                type="button"
                onClick={() => setPromoDismissed(true)}
                className="mr-1 text-white/75 hover:text-white md:hidden"
                aria-label="إغلاق"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* شريط التنقل الرئيسي */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* الشعار واسم المنصة */}
            <div
              onClick={() => {
                logoClickCountRef.current += 1;
                if (logoClickCountRef.current >= 5) {
                  logoClickCountRef.current = 0;
                  if (isAdmin) setActivePage('admin');
                  else setAdminLoginOpen(true);
                } else {
                  navigateTo('home');
                }
              }}
              className="flex items-center gap-2.5 cursor-pointer min-w-0"
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  style={{ width: settings.logoSize || 48, height: settings.logoSize || 48 }}
                  className="rounded-2xl object-cover border border-slate-200 shrink-0 w-10 h-10 sm:w-auto sm:h-auto"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black shrink-0 shadow">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-black text-xs sm:text-base lg:text-lg text-slate-900 truncate">
                  {settings.siteName}
                </div>
                <div className="hidden sm:block text-[11px] text-slate-500 font-bold truncate">
                  {settings.tagline}
                </div>
              </div>
            </div>

            {/* روابط التنقل على الكمبيوتر */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              {[
                { id: 'home', label: 'الرئيسية', icon: Home },
                { id: 'catalog', label: 'المذكرات', icon: BookOpen },
                { id: 'offers', label: 'العروض والباقات', icon: Percent },
                { id: 'track', label: 'تتبع طلبك', icon: Package }
              ].map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.id}
                    onClick={() => navigateTo(nav.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                      activePage === nav.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-white/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{nav.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* أزرار الإجراءات السريعة */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {isAdmin && (
                <button
                  onClick={() => setActivePage('admin')}
                  className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-900 text-white text-[11px] sm:text-xs font-black flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">الإدارة</span>
                </button>
              )}

              <button
                onClick={() => setCartOpen(true)}
                className="relative px-2.5 sm:px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] sm:text-xs font-black flex items-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>السلة</span>
                {cart.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
                    {cart.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setContactOpen(true)}
                className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-black flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>تواصل معنا</span>
              </button>
            </div>
          </div>

          {/* شريط التنقل المدمج للهاتف */}
          <nav className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl mt-2 md:hidden">
            {[
              { id: 'home', label: 'الرئيسية', icon: Home },
              { id: 'catalog', label: 'المذكرات', icon: BookOpen },
              { id: 'offers', label: 'العروض', icon: Percent },
              { id: 'track', label: 'تتبع طلبك', icon: Package }
            ].map((nav) => {
              const Icon = nav.icon;
              return (
                <button
                  key={nav.id}
                  onClick={() => navigateTo(nav.id)}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition ${
                    activePage === nav.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{nav.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* المحتوى الرئيسي حسب الصفحة */}
      <main className="flex-1">
        {activePage === 'admin' && isAdmin ? (
          <AdminDashboard
            settings={settings}
            setSettings={setSettings}
            notebooks={notebooks}
            coupons={coupons}
            orders={orders}
            onLogout={async () => {
              await signOut(auth);
              setActivePage('home');
            }}
            showToast={showToast}
          />
        ) : activePage === 'catalog' ? (
          <CatalogPage
            settings={settings}
            notebooks={notebooks}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            selectedStageId={selectedStageId}
            setSelectedStageId={setSelectedStageId}
            selectedGradeId={selectedGradeId}
            setSelectedGradeId={setSelectedGradeId}
            onPreview={setPreviewNotebook}
            onAddToCart={handleAddToCart}
            cartIds={cartIds}
          />
        ) : activePage === 'offers' ? (
          <OffersAndBundlesPage
            settings={settings}
            notebooks={notebooks}
            coupons={coupons}
            onAddBundleToCart={handleAddToCart}
            onPreview={setPreviewNotebook}
          />
        ) : activePage === 'track' ? (
          <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                <Package className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">تتبع حالة طلبك</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                أدخل رقم الطلب (`ORD-...`) أو رقم الواتساب المسجل في الطلب
              </p>

              <form onSubmit={handleTrackOrder} className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثال: ORD-123456"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-sm font-black"
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm"
                >
                  بحث
                </button>
              </form>

              {trackNotFound && (
                <p className="text-xs font-bold text-red-600 pt-2">
                  لم يتم العثور على طلب مطابق لهذه البيانات.
                </p>
              )}

              {trackedOrder && (
                <div className="text-right bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-blue-700">{trackedOrder.orderNumber}</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                      {trackedOrder.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-bold">
                    المعلم: {trackedOrder.customerData?.teacherName} • الإجمالي: {trackedOrder.total} ج.م
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* الصفحة الرئيسية */
          <div className="space-y-12 pb-16">
            {/* Hero Section */}
            <section
              style={{ minHeight: settings.heroMinHeight || 420 }}
              className="relative bg-gradient-to-bl from-slate-950 via-blue-950 to-slate-900 text-white flex items-center overflow-hidden"
            >
              {settings.heroBgImage && (
                <img
                  src={settings.heroBgImage}
                  alt=""
                  style={{ opacity: settings.heroBgOpacity ?? 0.28 }}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}
              <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
                <div className="lg:col-span-7 space-y-4 text-right">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{settings.heroBadge}</span>
                  </span>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight">
                    {settings.heroTitle}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                    {settings.heroSubtitle}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => navigateTo('catalog')}
                      className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-lg transition"
                    >
                      تصفح مكتبة المذكرات
                    </button>
                    <button
                      onClick={() => navigateTo('offers')}
                      className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-sm transition"
                    >
                      باقات التوفير والخصومات
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-slate-900/80 backdrop-blur-md border border-white/15 rounded-3xl p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                      <ShieldCheck className="w-5 h-5" />
                      <span>لماذا يثق بنا المعلمون؟</span>
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>محتوى متكامل ومطابق لأحدث تعليمات الوزارة ومنسق باحترافية.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>وضع اسم المعلم ورقم الهاتف والشعار على الغلاف وجميع الصفحات.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>معاينة حقيقية لصفحات المذكرة قبل تأكيد الطلب.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>تسليم سريع بصيغة PDF عالية الدقة جاهزة للطباعة.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* الأقسام الرئيسية */}
            <section className="max-w-7xl mx-auto px-4 space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">الأقسام الرئيسية للمذكرات والكورسات</h2>
                <p className="text-xs sm:text-sm text-slate-600">اختر القسم المناسب لتصفح مجلدات المراحل والصفوف الدراسية</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(settings.categories || DEFAULT_CATEGORIES).map((cat) => {
                  const catImg = settings.categoryImages?.[cat.id];
                  const count = notebooks.filter((n) => n.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => navigateTo('catalog', cat.id)}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
                    >
                      <div className="relative h-44 bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden">
                        {catImg ? (
                          <img
                            src={catImg}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/80">
                            <BookOpen className="w-14 h-14" />
                          </div>
                        )}
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/75 text-white text-xs font-black backdrop-blur-sm">
                          {count} مذكرة متاحة
                        </span>
                      </div>
                      <div className="p-5 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-bold mt-0.5">تصفح المراحل والصفوف الدراسية</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-blue-600 rotate-180 group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* قسم ما الجديد؟ */}
            {settings.whatsNewEnabled !== false && whatsNewList.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black mb-1">
                      إصدارات حديثة
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{settings.whatsNewTitle}</h2>
                  </div>
                  <button
                    onClick={() => navigateTo('catalog')}
                    className="text-xs sm:text-sm font-black text-blue-600 hover:underline"
                  >
                    عرض الكل ←
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {whatsNewList.map((nb) => (
                    <NotebookCard
                      key={nb.id}
                      notebook={nb}
                      settings={settings}
                      onPreview={setPreviewNotebook}
                      onAddToCart={handleAddToCart}
                      isInCart={cartIds.has(nb.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* قسم أخبار المنصة ومذكرات قيد التجهيز */}
            {settings.newsSectionEnabled !== false &&
              ((settings.newsItems || []).length > 0 || comingSoonList.length > 0) && (
                <section className="max-w-7xl mx-auto px-4 space-y-6">
                  <div className="flex items-center gap-2.5">
                    <Megaphone className="w-6 h-6 text-amber-600" />
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{settings.newsSectionTitle}</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {(settings.newsItems || []).map((nw) => (
                      <div key={nw.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-1.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black">
                          {nw.date || 'جديد'}
                        </span>
                        <h3 className="font-black text-base text-slate-900">{nw.title}</h3>
                        {nw.description && <p className="text-xs sm:text-sm text-slate-600">{nw.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
          </div>
        )}
      </main>

      {/* شريط سلة عائم أسفل الشاشة عند وجود عناصر */}
      {cart.length > 0 && !cartOpen && activePage !== 'admin' && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-md">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-2xl border border-white/15 flex items-center justify-between font-black text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs">{cart.length}</span>
              <span>عرض سلة الطلبات وإتمام الطلب</span>
            </div>
            <span className="text-amber-400">
              {cart.reduce((s, i) => s + (Number(i.price) || 0), 0)} ج.م ←
            </span>
          </button>
        </div>
      )}

      {/* الفوتر */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
          <div>
            © {new Date().getFullYear()} {settings.siteName} — جميع الحقوق محفوظة.
          </div>
          <button
            onClick={() => {
              if (isAdmin) setActivePage('admin');
              else setAdminLoginOpen(true);
            }}
            className="text-slate-500 hover:text-slate-300 flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>دخول الإدارة</span>
          </button>
        </div>
      </footer>

      {/* النوافذ المنبثقة */}
      <ProtectedPreviewModal
        notebook={previewNotebook}
        settings={settings}
        onClose={() => setPreviewNotebook(null)}
        onAddToCart={handleAddToCart}
        isInCart={previewNotebook ? cartIds.has(previewNotebook.id) : false}
      />

      <OrderCheckoutModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        settings={settings}
        coupons={coupons}
        onRemoveFromCart={(id) => setCart((p) => p.filter((item) => item.id !== id))}
        onClearCart={() => setCart([])}
      />

      {/* نافذة تواصل معنا */}
      {contactOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setContactOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">{settings.contactModalTitle}</h3>
              <button onClick={() => setContactOpen(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">{settings.contactModalSubtitle}</p>
            <div className="space-y-2.5">
              {(settings.socialLinks || []).map((link) => (
                <a
                  key={link.id}
                  href={normalizeExternalUrl(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 transition"
                >
                  <div className="flex items-center gap-3">
                    <SocialPlatformBadge url={link.url} />
                    <span className="font-black text-sm text-slate-900">{link.label}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* نافذة دخول الإدارة */}
      {adminLoginOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setAdminLoginOpen(false)}
        >
          <form
            onSubmit={handleAdminLogin}
            className="bg-white w-full max-w-sm rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">تسجيل دخول الإدارة</h3>
              <button type="button" onClick={() => setAdminLoginOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="password"
              required
              placeholder="كلمة المرور الإدارية..."
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold"
            />
            {loginError && <p className="text-xs font-bold text-red-600">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm"
            >
              دخول لوحة التحكم
            </button>
          </form>
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
