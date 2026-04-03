import { NextResponse } from "next/server";
import { getAyahsByEmotion } from "@/lib/api/quran";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  try {
    const { ayahs, themes } = await getAyahsByEmotion(query);
    return NextResponse.json({ ayahs, themes });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to fetch ayahs." },
      { status: 400 },
    );
  }
}
