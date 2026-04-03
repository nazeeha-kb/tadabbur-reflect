/**
 * English transliterated surah names (name_simple style), index 1–114.
 * Used when an ayah object lacks surahName but has verseKey "chapter:ayah".
 */
export const SURAH_NAMES_EN = [
  "",
  "Al-Fatihah",
  "Al-Baqarah",
  "Ali 'Imran",
  "An-Nisa",
  "Al-Ma'idah",
  "Al-An'am",
  "Al-A'raf",
  "Al-Anfal",
  "At-Tawbah",
  "Yunus",
  "Hud",
  "Yusuf",
  "Ar-Ra'd",
  "Ibrahim",
  "Al-Hijr",
  "An-Nahl",
  "Al-Isra",
  "Al-Kahf",
  "Maryam",
  "Ta-Ha",
  "Al-Anbiya",
  "Al-Hajj",
  "Al-Mu'minun",
  "An-Nur",
  "Al-Furqan",
  "Ash-Shu'ara",
  "An-Naml",
  "Al-Qasas",
  "Al-Ankabut",
  "Ar-Rum",
  "Luqman",
  "As-Sajdah",
  "Al-Ahzab",
  "Saba",
  "Fatir",
  "Ya-Sin",
  "As-Saffat",
  "Sad",
  "Az-Zumar",
  "Ghafir",
  "Fussilat",
  "Ash-Shura",
  "Az-Zukhruf",
  "Ad-Dukhan",
  "Al-Jathiyah",
  "Al-Ahqaf",
  "Muhammad",
  "Al-Fath",
  "Al-Hujurat",
  "Qaf",
  "Adh-Dhariyat",
  "At-Tur",
  "An-Najm",
  "Al-Qamar",
  "Ar-Rahman",
  "Al-Waqi'ah",
  "Al-Hadid",
  "Al-Mujadila",
  "Al-Hashr",
  "Al-Mumtahanah",
  "As-Saff",
  "Al-Jumu'ah",
  "Al-Munafiqun",
  "At-Taghabun",
  "At-Talaq",
  "At-Tahrim",
  "Al-Mulk",
  "Al-Qalam",
  "Al-Haqqah",
  "Al-Ma'arij",
  "Nuh",
  "Al-Jinn",
  "Al-Muzzammil",
  "Al-Muddaththir",
  "Al-Qiyamah",
  "Al-Insan",
  "Al-Mursalat",
  "An-Naba",
  "An-Nazi'at",
  "Abasa",
  "At-Takwir",
  "Al-Infitar",
  "Al-Mutaffifin",
  "Al-Inshiqaq",
  "Al-Buruj",
  "At-Tariq",
  "Al-A'la",
  "Al-Ghashiyah",
  "Al-Fajr",
  "Al-Balad",
  "Ash-Shams",
  "Al-Layl",
  "Ad-Duha",
  "Ash-Sharh",
  "At-Tin",
  "Al-Alaq",
  "Al-Qadr",
  "Al-Bayyinah",
  "Az-Zalzalah",
  "Al-Adiyat",
  "Al-Qari'ah",
  "At-Takathur",
  "Al-Asr",
  "Al-Humazah",
  "Al-Fil",
  "Quraysh",
  "Al-Ma'un",
  "Al-Kawthar",
  "Al-Kafirun",
  "An-Nasr",
  "Al-Masad",
  "Al-Ikhlas",
  "Al-Falaq",
  "An-Nas",
];

export function surahNameFromChapterId(chapterId) {
  const n = Number(chapterId);
  if (!Number.isFinite(n) || n < 1 || n > 114) return "";
  return SURAH_NAMES_EN[n] || "";
}

export function parseVerseKey(verseKey) {
  if (!verseKey || typeof verseKey !== "string") return { chapterId: "", ayahNumber: "" };
  const [c, a] = verseKey.split(":");
  return { chapterId: c ?? "", ayahNumber: a ?? "" };
}

/**
 * Display: "Al-Baqarah: 255" (not "Surah 2:255").
 */
export function formatVerseCitation(ayah) {
  if (!ayah || typeof ayah !== "object") return "";
  const vk = ayah.verseKey;
  const { chapterId: vkChapter, ayahNumber: vkAyah } =
    vk && typeof vk === "string" && vk.includes(":") ? parseVerseKey(vk) : { chapterId: "", ayahNumber: "" };

  let name = String(ayah.surahName || "").trim();
  if (name.startsWith("Surah ") && /^Surah \d+$/.test(name) && vkChapter) {
    const mapped = surahNameFromChapterId(vkChapter);
    if (mapped) name = mapped;
  }

  const n = ayah.ayahNumber;
  const num = n != null && n !== "" ? String(n) : vkAyah ? String(vkAyah) : "";
  if (name && num) return `${name}: ${num}`;
  if (vk && typeof vk === "string" && vk.includes(":")) {
    const sn = surahNameFromChapterId(vkChapter);
    if (sn && vkAyah) return `${sn}: ${vkAyah}`;
    return vk;
  }
  if (name) return name;
  return "";
}
