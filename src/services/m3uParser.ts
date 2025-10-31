// src/services/m3uParser.ts
import type { Stream, Category } from "../types";

/**
 * يقرأ خصائص السطر #EXTINF على شكل مفاتيح=قيم
 * مثال: #EXTINF:-1 tvg-id="xxx" tvg-name="xxx" group-title="Sports", BeIN Sports 1
 */
function parseExtinfAttributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  // التقط key="value"
  const regex = /([a-zA-Z0-9\-_:]+)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    const key = (m[1] || "").trim();
    const val = (m[2] || "").trim();
    if (key) attrs[key] = val;
  }
  return attrs;
}

function detectStreamType(name: string, url: string): "live" | "movie" | "series" {
  const n = name.toLowerCase();
  const u = url.toLowerCase();

  // دلالات الفيديو حسب الامتداد أو المسار
  const isHls = u.endsWith(".m3u8");
  const isVodExt = u.match(/\.(mp4|mkv|avi|mov|wmv|flv)(\?|$)/); // أي امتداد فيلم
  const looksSeries = u.includes("/series/") || n.match(/\b(s\d+e\d+|season\s*\d+|episode\s*\d+)\b/);
  const looksVod = u.includes("/movie/") || u.includes("/vod/") || !!isVodExt;

  if (looksSeries) return "series";
  if (looksVod) return "movie";
  if (isHls) return "live";

  // fallback: إذا ما قدر يحدد، اعتبرها قناة بث مباشر
  return "live";
}

/**
 * يُرجع مصفوفات streams و categories متوافقة مع الأنواع في ../types
 */
export function parseM3uContent(content: string): { streams: Stream[]; categories: Category[] } {
  // تنظيف BOM والمسافات الزائدة
  let text = content.replace(/^\uFEFF/, "").replace(/\r/g, "");
  if (!text.includes("#EXTM3U")) {
    // بعض القوائم تفتقد الـ header — نسمح بالمتابعة
  }

  const lines = text.split("\n").map((l) => l.trim());
  const streams: Stream[] = [];

  // لتوليد category_id متسقة
  const catByName = new Map<string, string>(); // name -> id
  const catCountByName = new Map<string, number>(); // لحساب القنوات داخل كل تصنيف
  const genCatId = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 60) || "uncategorized";

  // لتوليد stream_id بسيط
  let nextId = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("#EXTINF")) continue;

    // مثال: #EXTINF:-1 tvg-id="xxx" tvg-name="xxx" group-title="Movies", Avengers
    const attrs = parseExtinfAttributes(line);
    const afterComma = line.split(",", 2)[1] ?? ""; // الاسم بعد الفاصلة
    const name = (attrs["tvg-name"] || afterComma || "Unknown").trim();

    // ابحث عن أول سطر URL بعد #EXTINF (يتجاهل الفراغات والتعليقات)
    let url = "";
    let j = i + 1;
    while (j < lines.length) {
      const candidate = lines[j].trim();
      if (candidate && !candidate.startsWith("#")) {
        url = candidate;
        break;
      }
      j++;
    }
    if (!url) continue; // عنصر ناقص — تجاهله

    // التصنيف
    const groupTitle = (attrs["group-title"] || "Uncategorized").trim();
    if (!catByName.has(groupTitle)) {
      catByName.set(groupTitle, genCatId(groupTitle));
      catCountByName.set(groupTitle, 0);
    }
    catCountByName.set(groupTitle, (catCountByName.get(groupTitle) || 0) + 1);

    // صورة
    const logo = attrs["tvg-logo"] || attrs["logo"] || "";

    // نوع البث (live/movie/series)
    const stream_type = detectStreamType(name, url);

    // حقل added (اختياري) — الآن
    const addedTs = Math.floor(Date.now() / 1000).toString();

    streams.push({
      // الحقول الأساسية في أغلب المشاريع:
      stream_id: nextId++,
      name,
      stream_type,
      // للفلترة في الواجهة:
      category_id: catByName.get(groupTitle)!,
      // أيقونة/شعار:
      stream_icon: logo || undefined,
      // مسارات التشغيل (نحفظ URL كما هو في حقل url):
      url,

      // حقول اختيارية/آمنة:
      added: addedTs,
      rating: undefined as any, // حسب types عندك (لو اسم الحقل rating_5based غيّرها)
      rating_5based: undefined as any,
      series_id: undefined as any,
      // إلخ … أضف ما يلزم لو كان types يتطلب ذلك
    } as unknown as Stream);
  }

  // بناء قائمة التصنيفات من الخريطة
  const categories: Category[] = Array.from(catByName.entries()).map(([name, id]) => {
    return {
      category_id: id as any, // إذا النوع لديك string — اتركها string
      category_name: name,
      parent_id: 0, // بعض المشاريع تتطلبه رقم
    } as unknown as Category;
  });

  return { streams, categories };
}
