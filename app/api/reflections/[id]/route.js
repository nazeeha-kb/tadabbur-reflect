import { NextResponse } from "next/server";
import resolveAuthUser from "@/lib/auth/resolveAuthUser";
import { updateReflection, deleteReflection } from "@/lib/db/reflections";

export async function PATCH(request, { params }) {
  const auth = await resolveAuthUser(request);
  if (!auth) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = params;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const reflection = await updateReflection(id, auth.appUserId, body);
    return NextResponse.json({ ok: true, reflection });
  } catch (err) {
    const code = err.message === "not_found" ? 404 : err.message === "unauthorized" ? 403 : 500;
    return NextResponse.json({ error: String(err) }, { status: code });
  }
}

export async function DELETE(request, { params }) {
  const auth = await resolveAuthUser(request);
  if (!auth) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = params;
  try {
    await deleteReflection(id, auth.appUserId);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const code = err.message === "not_found" ? 404 : err.message === "unauthorized" ? 403 : 500;
    return NextResponse.json({ error: String(err) }, { status: code });
  }
}
