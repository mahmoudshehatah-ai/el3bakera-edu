// ... existing code ...
  // الحالات الأساسية للواجهة
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'library' | 'bundles' | 'track' | 'admin'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackQuery, setTrackQuery] = useState('');
// ... existing code ...
      {/* ==================== الهيدر وشريط التنقل الرئيسي ==================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* الشعار واسم المنصة */}
          <div
            onClick={() => {
              setActiveTab('home');
              handleLogoSecretTap();
            }}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <img
              src={settings.logoImage || DEFAULT_LOGO_SVG}
              alt={settings.platformName}
              className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-slate-100 group-hover:scale-105 transition-transform"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                {settings.platformName}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                {settings.platformTagline}
              </p>
            </div>
          </div>

          {/* روابط التنقل الرئيسية المطابقة للتصميم الأصلي */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'home'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'library'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              المذكرات
            </button>
            <button
              onClick={() => setActiveTab('bundles')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'bundles'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              العروض
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'track'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              تتبع طلبك
            </button>
          </nav>

          {/* أزرار التواصل والسلة */}
          <div className="flex items-center gap-2.5">
            <a
              href={`https://wa.me/${settings.whatsappNumber?.replace(/^0/, '20')}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              <Phone className="w-4 h-4" />
              <span>تواصل معنا</span>
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>السلة</span>
              {cart.length > 0 && (
                <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
// ... existing code ...
      {/* ==================== المحتوى الرئيسي ==================== */}
      <main className="flex-1">
        {/* 1. الصفحة الرئيسية المطابقة تماماً للتصميم الأصلي */}
        {activeTab === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-12">
            {/* البانر الرئيسي المستدير الحواف */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-[#0b1938] via-[#0e224d] to-[#08132b] text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-slate-800/60">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                {/* العمود الأيمن: النصوص والأزرار والإحصائيات */}
                <div className="lg:col-span-7 space-y-6 text-right">
                  <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>جاهزة للطباعة الفورية باسمك وشعارك</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black leading-[1.22] tracking-tight text-white">
                    {settings.heroTitle}
                  </h2>

                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                    {settings.heroSubtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => setActiveTab('library')}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all shadow-lg shadow-blue-600/25"
                    >
                      <span>استعراض جميع المذكرات</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('bundles')}
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all"
                    >
                      <span>باقات التوفير والعروض</span>
                    </button>
                  </div>

                  {/* شريط الإحصائيات الثلاثة */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-xl">
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-400">+50</div>
                      <div className="text-xs text-slate-300 mt-0.5">مذكرة وبنك أسئلة</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400">+500</div>
                      <div className="text-xs text-slate-300 mt-0.5">معلم يثق بنا</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-sky-400">100%</div>
                      <div className="text-xs text-slate-300 mt-0.5">تخصيص باسمك وشعارك</div>
                    </div>
                  </div>
                </div>

                {/* العمود الأيسر: صورة البانر المرفوعة من الإدارة */}
                <div className="lg:col-span-5">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/15 bg-slate-900/60 aspect-[16/10]">
                    {settings.heroImage ? (
                      <img
                        src={settings.heroImage}
                        alt="منصة العباقرة للمذكرات التعليمية"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-blue-600/30 to-indigo-900/50">
                        <BookOpen className="w-12 h-12 text-amber-400 mb-3" />
                        <p className="font-black text-lg text-white">جهز مذكرتك بلمسة وشعارك</p>
                        <p className="text-xs text-slate-300 mt-1">محتوى تعليمي متميز بجودة عالية جاهز للطباعة</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* قسم الأقسام الدراسية بالبطاقات البيضاء والصور */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">الأقسام الدراسية</h3>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setActiveTab('library');
                  }}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  عرض الكل ({products.length})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {normalizedCategories.map((cat, idx) => {
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  const fallbackGradients = [
                    'from-sky-500 to-blue-700',
                    'from-emerald-500 to-teal-700',
                    'from-purple-600 to-indigo-800',
                  ];
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setActiveTab('library');
                      }}
                      className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
                    >
                      <div className={`relative h-44 w-full overflow-hidden bg-gradient-to-br ${fallbackGradients[idx % 3]}`}>
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-6 text-center">
                            <span className="text-2xl font-black text-white drop-shadow">{cat.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 sm:p-5 flex items-center justify-between bg-white">
                        <div>
                          <h4 className="font-black text-base sm:text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                            {cat.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{count} مذكرة متاحة</p>
                        </div>
                        <span className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                          <ChevronLeft className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* قسم أحدث المذكرات المضافة */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">أحدث المذكرات المضافة</h3>
                <button
                  onClick={() => setActiveTab('library')}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  تصفح المكتبة الكاملة ←
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.slice(0, 6).map((product) => {
                  const gradeObj = normalizedGrades.find((g) => g.id === product.gradeId);
                  const catObj = normalizedCategories.find((c) => c.id === product.categoryId);
                  const discountAmount =
                    product.originalPrice && product.originalPrice > product.price
                      ? product.originalPrice - product.price
                      : 0;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                    >
                      {/* صورة غلاف المذكرة كاملة الوضوح */}
                      <div
                        onClick={() => setPreviewProduct(product)}
                        className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden cursor-pointer"
                      >
                        {product.coverImage ? (
                          <img
                            src={product.coverImage}
                            alt={product.title}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 p-6 flex flex-col justify-between text-white">
                            <span className="self-start bg-blue-600 text-xs font-bold px-3 py-1 rounded-full">
                              {product.subject || 'اللغة العربية'}
                            </span>
                            <h4 className="text-xl font-black leading-snug">{product.title}</h4>
                          </div>
                        )}

                        {discountAmount > 0 && (
                          <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full shadow">
                            وفر {discountAmount} ج.م
                          </span>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                            <span>{gradeObj?.name || 'جميع الصفوف'}</span>
                            <span>•</span>
                            <span>{catObj?.name || 'مذكرة'}</span>
                          </div>

                          <h4
                            onClick={() => setPreviewProduct(product)}
                            className="text-lg font-black text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                          >
                            {product.title}
                          </h4>

                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {product.description}
                          </p>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-black text-blue-600">{product.price} ج.م</span>
                              {product.originalPrice > product.price && (
                                <span className="text-xs text-slate-400 line-through">
                                  {product.originalPrice} ج.م
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => setPreviewProduct(product)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>التفاصيل والعينة</span>
                            </button>
                          </div>

                          <button
                            onClick={() => addToCart(product, 'notebook')}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>أضف للسلة للتخصيص باسمك</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* 2. صفحة مكتبة المذكرات والفلترة */}
        {activeTab === 'library' && (
// ... existing code ...
        )}

        {/* 4. صفحة تتبع الطلب */}
        {activeTab === 'track' && (
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900">تتبع حالة طلبك</h2>
                <p className="text-sm text-slate-500">أدخل رقم الهاتف المسجل في الطلب أو تواصل معنا مباشرة عبر واتساب</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="أدخل رقم الهاتف (مثال: 010xxxxxxxx)..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-sm"
                />
              </div>

              {trackQuery.trim().length >= 4 && (
                <div className="space-y-3">
                  {orders
                    .filter(
                      (o) =>
                        o.teacherPhone?.includes(trackQuery.trim()) ||
                        o.id?.includes(trackQuery.trim())
                    )
                    .map((ord) => (
                      <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{ord.teacherName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">الإجمالي: {ord.total} ج.م</div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          {ord.status || 'قيد التجهيز'}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <div className="pt-2 text-center">
                <a
                  href={`https://wa.me/${settings.whatsappNumber?.replace(/^0/, '20')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>الاستفسار الفوري عبر واتساب</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 5. لوحة الإدارة الكاملة */}
        {activeTab === 'admin' && isAdminAuthenticated && (
// ... existing code ...
