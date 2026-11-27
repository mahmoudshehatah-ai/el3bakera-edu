// ... existing code ...
      for (const appName of appIdsToScan) {
        for (const colName of sampleCollections) {
          try {
            const snap = await getDocs(collection(db, 'artifacts', appName, 'public', 'data', colName));
            snap.forEach((docSnap) => {
              const d = docSnap.data();
              const docId = docSnap.id;

              // استخراج كافة الصور الممكنة من أي حقل داخل المستند (بما في ذلك المصفوفات أو النصوص المتسلسلة أو السلاسل الطويلة)
              const extractedImgs = [];
              const inspectValue = (val) => {
                if (!val) return;
                if (typeof val === 'string') {
                  if (val.startsWith('data:image') || val.startsWith('http://') || val.startsWith('https://')) {
                    extractedImgs.push(val);
                  } else if (val.length > 500 && /^[A-Za-z0-9+/=]+$/.test(val.slice(0, 100))) {
                    // بيانات base64 خام بدون ترويسة data:image
                    extractedImgs.push(`data:image/jpeg;base64,${val}`);
                  } else if (val.trim().startsWith('[') || val.trim().startsWith('{')) {
                    try { inspectValue(JSON.parse(val)); } catch {}
                  }
                } else if (Array.isArray(val)) {
                  val.forEach(inspectValue);
                } else if (typeof val === 'object') {
                  Object.values(val).forEach(inspectValue);
                }
              };
              inspectValue(d);

              if (extractedImgs.length > 0) {
                const targetNbId = d.notebookId || d.productId || d.nbId || docId.split('_')[0];
                if (!samplesMap[targetNbId]) samplesMap[targetNbId] = [];
                extractedImgs.forEach((img) => {
                  if (!samplesMap[targetNbId].includes(img)) samplesMap[targetNbId].push(img);
                });
                // ربط احتياطي باسم المذكرة أو معرف المستند الكامل
                samplesMap[docId] = [...(samplesMap[docId] || []), ...extractedImgs];
                if (d.title) samplesMap[d.title.trim()] = [...(samplesMap[d.title.trim()] || []), ...extractedImgs];
              }
            });
          } catch {}
        }
      }

      if (Object.keys(samplesMap).length > 0) {
        setProducts((prev) =>
          prev.map((p) => {
            const found =
              samplesMap[p.id] ||
              samplesMap[p.title?.trim()] ||
              Object.entries(samplesMap).find(([k]) => k.includes(p.id) || p.id.includes(k))?.[1] ||
              [];
            if (found.length > 0) {
              const merged = Array.from(new Set([...(p.sampleImages || []), ...found]));
              return { ...p, sampleImages: merged };
            }
            return p;
          })
        );
      }
    };
// ... existing code ...
      const unsubProducts = onSnapshot(
        collection(db, 'artifacts', ACTIVE_APP_ID, 'public', 'data', 'notebooks'),
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setProducts((prev) => {
              // الحفاظ على صور العينات المستردة مسبقاً حتى لا تُمسح عند تحديث قائمة المذكرات
              const prevSamplesById = {};
              prev.forEach((item) => {
                if (item.sampleImages && item.sampleImages.length > 0) {
                  prevSamplesById[item.id] = item.sampleImages;
                }
              });
              return list.map((nb) => {
                const existingSamples = prevSamplesById[nb.id] || [];
                const incomingSamples = Array.isArray(nb.sampleImages) ? nb.sampleImages : [];
                const mergedSamples = Array.from(new Set([...incomingSamples, ...existingSamples]));
                return { ...nb, sampleImages: mergedSamples };
              });
            });
          }
        },
        (err) => console.error('Products sync error:', err)
      );
// ... existing code ...
