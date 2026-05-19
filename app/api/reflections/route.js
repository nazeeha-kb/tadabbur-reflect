import { NextResponse } from "next/server";
import resolveAuthUser from "@/lib/auth/resolveAuthUser";
import { createReflection, getUserReflectionsPaginated } from "@/lib/db/reflections";

export async function POST(request) {
  const auth = await resolveAuthUser(request);
  if (!auth) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    console.info(JSON.stringify({ event: "reflection.create.attempt", provider: auth.provider, appUserId: auth.appUserId }));
    const reflection = await createReflection(auth.appUserId, {
      verseKey: body.verseKey,
      text: body.text || body.reflection || body.reflectionText || "",
      reflectionText: body.reflectionText || body.reflection || body.text || "",
      emotion: body.emotion,
      title: body.title,
      tags: body.tags,
      tafseer: body.tafseer,
      ayahs: body.ayahs,
      searchQuery: body.searchQuery,
    });
    console.info(JSON.stringify({ event: "reflection.create.success", appUserId: auth.appUserId, reflectionId: reflection.id }));
    return NextResponse.json({ ok: true, reflection });
  } catch (err) {
    console.error(JSON.stringify({ event: "reflection.create.error", error: String(err), provider: auth.provider, appUserId: auth.appUserId }));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request) {
  const auth = await resolveAuthUser(request);
  if (!auth) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");
  const cursor = searchParams.get("cursor");

  try {
    const { reflections, nextCursor, hasMore } = await getUserReflectionsPaginated(auth.appUserId, {
      limit: limit ? Number(limit) : 10,
      cursor: cursor || null,
    });
    return NextResponse.json({ ok: true, reflections, nextCursor, hasMore });
  } catch (err) {
    console.error(JSON.stringify({ event: "reflection.list.error", error: String(err), appUserId: auth.appUserId }));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
