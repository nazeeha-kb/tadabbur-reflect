import { NextResponse } from "next/server";
import { inferReflectionTags } from "@/lib/nlp/intentKeywords";

export async function POST(request) {
  try {
    const body = await request.json();
    const searchQuery = typeof body.searchQuery === "string" ? body.searchQuery : "";
    const ayahTranslation = typeof body.ayahTranslation === "string" ? body.ayahTranslation : "";
    const reflectionText = typeof body.reflectionText === "string" ? body.reflectionText : "";
    const themes = Array.isArray(body.themes) ? body.themes : [];
    const tags = inferReflectionTags({ searchQuery, ayahTranslation, reflectionText, themes });
    return NextResponse.json({ tags });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to generate tags." },
      { status: 400 },
    );
  }
}
