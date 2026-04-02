import { NextResponse } from "next/server";
import { getAyahByVerseKey } from "@/lib/api/quran";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const verseKey = searchParams.get("verseKey");

  try {
    const ayah = await getAyahByVerseKey(verseKey);
    return NextResponse.json({ ayah });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch ayah." },
      { status: 400 },
    );
  }
}

