import { NextResponse } from "next/server";

const QURAN_API_BASE = "https://api.quran.com/api/v4";
const AUDIO_BASE_PRIMARY = "https://audio.quran.com";
const AUDIO_BASE_FALLBACK = "https://everyayah.com/data";
const DEFAULT_RECITATION_ID = 7; // Mishari Rashid al-`Afasy

const EVERYAYAH_RECITATION_DIR_BY_ID = {
  // Quran.com recitation 7 (Alafasy) maps to everyayah dataset folder.
  7: "Alafasy_128kbps",
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const verseKey = searchParams.get("verseKey");
  const recitationId = Number(searchParams.get("recitationId") || DEFAULT_RECITATION_ID);

  if (!verseKey || !String(verseKey).includes(":")) {
    return NextResponse.json({ message: "Invalid verseKey." }, { status: 400 });
  }

  const pathKey = encodeURIComponent(verseKey).replace(/%3A/gi, ":");
  const url = `${QURAN_API_BASE}/recitations/${recitationId}/by_ayah/${pathKey}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ message: `Unable to load recitation. (${res.status})`, detail }, { status: 400 });
  }

  const data = await res.json();
  const rel = data?.audio_files?.[0]?.url;
  if (typeof rel !== "string" || !rel.trim()) {
    return NextResponse.json({ message: "No audio file found for this ayah." }, { status: 404 });
  }

  if (rel.startsWith("http")) {
    return NextResponse.json({ audioUrl: rel });
  }

  const primaryUrl = `${AUDIO_BASE_PRIMARY}/${rel.replace(/^\/+/, "")}`;
  const fallbackDir = EVERYAYAH_RECITATION_DIR_BY_ID[recitationId];
  const filename = rel.split("/").pop();
  const fallbackUrl = fallbackDir && filename ? `${AUDIO_BASE_FALLBACK}/${fallbackDir}/${filename}` : "";

  // We return both; client tries primary then fallback.
  return NextResponse.json({ audioUrl: primaryUrl, fallbackUrl });
}

