// ... existing code ...
  FileText,
  Loader2
} from 'lucide-react';
// ... existing code ...
  customBannerTitle: 'هل تحتاج مذكرة بتصميم خاص أو منهج مخصص؟',
  customBannerSubtitle:
    'فريقنا جاهز لتنسيق وإعداد مذكرتك الخاصة من الصفر باسمك وشعارك وألوانك المفضلة بأعلى جودة للطباعة.',
  customBannerBtnText: 'اطلب مذكرة مخصصة الآن',
  savingsBadgeColor: 'emerald',
  savingsBadgePosition: 'next_to_pages',
  footerNote: 'جميع المذكرات منسقة بأعلى جودة وجاهزة للطباعة والتسليم الفوري بصيغة PDF.',
// ... existing code ...
  const textKeys = [
    'platformName',
    'platformTagline',
    'primaryTheme',
    'heroBadge',
    'heroTitle',
    'heroSubtitle',
    'heroPrimaryBtnText',
    'heroSecondaryBtnText',
    'heroCustomBtnText',
    'promoText',
    'promoCouponCode',
    'promoBgColor',
    'promoTextColor',
    'whatsappNumber',
    'trustTitle',
    'whatsNewTitle',
    'whatsNewMode',
    'customBannerTitle',
    'customBannerSubtitle',
    'customBannerBtnText',
    'savingsBadgeColor',
    'savingsBadgePosition',
    'footerNote',
    'orderSuccessMessage'
  ];
// ... existing code ...
  const isAdmin =
    (firebaseUser && firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) || previewAdminUnlocked;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // دعم زر الرجوع للخلف في المتصفح والهاتف للتنقل بين صفحات وفلاتر المنصة
  const skipNextPushRef = useRef(false);
  useEffect(() => {
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }
    try {
      window.history.pushState(
        {
          muzakkiratiNav: true,
          activeView,
          selectedCategoryId,
          selectedStageId,
          selectedGradeId
        },
        ''
      );
    } catch {
      // تجاهل
    }
  }, [activeView, selectedCategoryId, selectedStageId, selectedGradeId]);

  useEffect(() => {
    const onPopState = (e) => {
      if (previewNotebook) {
        setPreviewNotebook(null);
        setPreviewFullscreen(false);
        setPreviewZoom(1);
        return;
      }
      if (cartOpen) {
        setCartOpen(false);
        return;
      }
      const st = e.state;
      skipNextPushRef.current = true;
      if (st && st.muzakkiratiNav) {
        setActiveView(st.activeView || 'home');
        setSelectedCategoryId(st.selectedCategoryId || '');
        setSelectedStageId(st.selectedStageId || '');
        setSelectedGradeId(st.selectedGradeId || '');
      } else if (selectedGradeId) {
        setSelectedGradeId('');
      } else if (selectedStageId) {
        setSelectedStageId('');
      } else if (selectedCategoryId) {
        setSelectedCategoryId('');
      } else if (activeView !== 'home') {
        setActiveView('home');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [previewNotebook, cartOpen, activeView, selectedCategoryId, selectedStageId, selectedGradeId]);

  const handleBackNavigation = () => {
    if (previewNotebook) {
      setPreviewNotebook(null);
      setPreviewFullscreen(false);
      setPreviewZoom(1);
      return;
    }
    if (activeView === 'library') {
      if (selectedGradeId) {
        setSelectedGradeId('');
        return;
      }
      if (selectedStageId) {
        setSelectedStageId('');
        return;
      }
      if (selectedCategoryId) {
        setSelectedCategoryId('');
        return;
      }
    }
    if (activeView !== 'home') {
      setActiveView('home');
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };
// ... existing code ...
  useEffect(() => {
    if (!previewNotebook || !db) {
      setLoadingSamples(false);
      return;
    }
    let cancelled = false;
    const nbId = previewNotebook.id;
    const cachedList = samplesMap[nbId] || [];
    setLoadingSamples(cachedList.length === 0);

    const finishLoadingTimer = setTimeout(() => {
      if (!cancelled) setLoadingSamples(false);
    }, 1800);

    (async () => {
      try {
        // جلب مباشر وسريع للمستند الرئيسي للعينات فقط لتجنب البطء
        const mainDocSnap = await getDoc(publicDoc('notebook_samples', nbId));
        if (cancelled) return;
        const collected = [];
        if (mainDocSnap && mainDocSnap.exists()) {
          extractAnyImagesFromDoc(mainDocSnap.data()).forEach((im) => {
            if (im && im !== previewNotebook.coverImage && !collected.includes(im)) {
              collected.push(im);
            }
          });
        }
        if (collected.length > 0) {
          setSamplesMap((prev) => {
            const updated = {
              ...prev,
              [nbId]: Array.from(new Set([...(prev[nbId] || []), ...collected]))
            };
            try {
              localStorage.setItem(LOCAL_SAMPLES_KEY, JSON.stringify(updated));
            } catch {
              // تجاهل
            }
            return updated;
          });
        }
      } catch {
        // تجاهل
      } finally {
        clearTimeout(finishLoadingTimer);
        if (!cancelled) setLoadingSamples(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(finishLoadingTimer);
    };
  }, [previewNotebook]);
// ... existing code ...
                  {whatsNewNotebooks.map((nb) => (
                    <NotebookCard
                      key={nb.id}
                      nb={nb}
                      theme={theme}
                      settings={settings}
                      onPreview={() => {
                        setPreviewNotebook(nb);
                        setPreviewPageIdx(0);
                        setPreviewZoom(1);
                        setPreviewFullscreen(false);
                      }}
                      onAdd={() => addNotebookToCart(nb)}
                    />
                  ))}
// ... existing code ...
        {/* صفحة مكتبة المذكرات */}
        {activeView === 'library' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBackNavigation}
                    className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-black flex items-center gap-1.5 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>رجوع</span>
                  </button>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-slate-900">مكتبة المذكرات الدراسية</h2>
                    <p className="text-xs text-slate-500 font-bold">
                      تصفح المذكرات حسب القسم والمرحلة والصف أو ابحث باسم المادة
                    </p>
                  </div>
                </div>
                <div className="relative w-full sm:w-72">
// ... existing code ...
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredNotebooks.map((nb) => (
                  <NotebookCard
                    key={nb.id}
                    nb={nb}
                    theme={theme}
                    settings={settings}
                    onPreview={() => {
                      setPreviewNotebook(nb);
                      setPreviewPageIdx(0);
                      setPreviewZoom(1);
                      setPreviewFullscreen(false);
                    }}
                    onAdd={() => addNotebookToCart(nb)}
                  />
                ))}
              </div>
// ... existing code ...
// ============================================================================
// 6. بطاقة عرض المذكرة للزوار
// ============================================================================
const SAVINGS_COLOR_CLASSES = {
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rose: 'bg-rose-100 text-rose-800 border-rose-200',
  amber: 'bg-amber-100 text-amber-900 border-amber-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200'
};

function NotebookCard({ nb, theme, settings, onPreview, onAdd }) {
  const hasDiscount = Number(nb.oldPrice) > Number(nb.price) && Number(nb.oldPrice) > 0;
  const savedAmount = hasDiscount ? Number(nb.oldPrice) - Number(nb.price) : 0;
  const savedPercent = hasDiscount ? Math.round((savedAmount / Number(nb.oldPrice)) * 100) : 0;
  const badgeColorClass = SAVINGS_COLOR_CLASSES[settings?.savingsBadgeColor] || SAVINGS_COLOR_CLASSES.emerald;
  const badgePos = settings?.savingsBadgePosition || 'next_to_pages';

  const savingsBadgeEl = hasDiscount && badgePos !== 'hidden' && (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-xs font-black ${badgeColorClass}`}>
      <span>وفّر {savedAmount} ج.م ({savedPercent}%)</span>
    </span>
  );

  return (
    <div
      className={`group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl ${
        theme?.accentBorder || 'hover:border-blue-400'
      } transition flex flex-col justify-between`}
    >
      <div>
        <div
          onClick={onPreview}
          className={`relative h-52 bg-gradient-to-br ${
            theme?.cardGradient || 'from-blue-600 to-indigo-700'
          } cursor-pointer overflow-hidden flex items-center justify-center`}
        >
          {nb.coverImage ? (
            <img
              src={nb.coverImage}
              alt={nb.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <BookOpen className="w-12 h-12 text-white/80" />
          )}

          {nb.badgeText && (
            <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow">
              {nb.badgeText}
            </span>
          )}

          {hasDiscount && badgePos === 'on_cover' && (
            <span className={`absolute bottom-3 right-3 px-3 py-1 rounded-full border text-xs font-black shadow ${badgeColorClass}`}>
              وفّر {savedAmount} ج.م ({savedPercent}%)
            </span>
          )}

          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/35 transition flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 px-4 py-2 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-black shadow-lg flex items-center gap-1.5 transition">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>معاينة العينات</span>
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-1.5">
          <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-2">{nb.title}</h3>
          {nb.subtitle && <p className="text-xs text-slate-600 font-bold line-clamp-2">{nb.subtitle}</p>}
          {(nb.subject || nb.term || nb.pagesCount || (hasDiscount && badgePos === 'next_to_pages')) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {nb.subject && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">{nb.subject}</span>
              )}
              {nb.term && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">{nb.term}</span>
              )}
              {nb.pagesCount && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>{nb.pagesCount} صفحة</span>
                </span>
              )}
              {badgePos === 'next_to_pages' && savingsBadgeEl}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-lg font-black ${theme?.primaryText || 'text-blue-600'}`}>{nb.price} ج.م</span>
            {Number(nb.oldPrice) > Number(nb.price) && (
              <span className="text-xs text-slate-400 line-through font-bold">{nb.oldPrice} ج.م</span>
            )}
            {badgePos === 'next_to_price' && savingsBadgeEl}
          </div>
// ... existing code ...
          {/* 3. إعدادات قسم «ما الجديد؟» وقسم «الأخبار ومذكرات قيد التجهيز» */}
          {settingsSubTab === 'sections' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-2.5 h-6 rounded-full bg-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">شارة التوفير، قسم «ما الجديد؟»، وقسم «الأخبار»</h3>
              </div>

              {/* التحكم في لون ومكان شارة التوفير */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs sm:text-sm font-black text-slate-800">
                  التحكم في لون ومكان شارة قيمة التوفير على المذكرات
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">مكان ظهور شارة التوفير</label>
                    <select
                      value={localSettings.savingsBadgePosition || 'next_to_pages'}
                      onChange={(e) => setLocalSettings({ ...localSettings, savingsBadgePosition: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    >
                      <option value="next_to_pages">بجوار أيقونة عدد الصفحات (الافتراضي)</option>
                      <option value="next_to_price">بجوار السعر</option>
                      <option value="on_cover">على صورة غلاف المذكرة</option>
                      <option value="hidden">إخفاء شارة التوفير</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">لون شارة التوفير</label>
                    <select
                      value={localSettings.savingsBadgeColor || 'emerald'}
                      onChange={(e) => setLocalSettings({ ...localSettings, savingsBadgeColor: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    >
                      <option value="emerald">أخضر زمردي</option>
                      <option value="rose">أحمر وردي مميز</option>
                      <option value="amber">ذهبي / عنبري</option>
                      <option value="blue">أزرق ملكي</option>
                      <option value="purple">بنفسجي</option>
                    </select>
                  </div>
                </div>
              </div>
// ... existing code ...
