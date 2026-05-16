import { NextResponse } from "next/server";
import { getSessionUser, setAppSession } from "@/lib/server/session";
import { findUserById, updateUserProfile } from "@/lib/server/localUserStore";

const MAX_AVATAR_BYTES = 512 * 1024;

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.kind !== "user") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const stored = await findUserById(sessionUser.id);
  return NextResponse.json({
    user: {
      id: sessionUser.id,
      email: sessionUser.email,
      name: stored?.name || sessionUser.name || "",
      avatarUrl: stored?.avatarUrl || null,
      provider: sessionUser.provider,
    },
  });
}

export async function PATCH(request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.kind !== "user") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates = {};
  if (typeof body.name === "string") {
    const trimmed = body.name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    updates.name = trimmed;
  }

  if (body.avatarUrl === null) {
    updates.avatarUrl = null;
  } else if (typeof body.avatarUrl === "string") {
    if (!body.avatarUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Avatar must be an image data URL" }, { status: 400 });
    }
    const base64Part = body.avatarUrl.split(",")[1] || "";
    const approxBytes = Math.ceil((base64Part.length * 3) / 4);
    if (approxBytes > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: "Image is too large (max 512KB)" }, { status: 400 });
    }
    updates.avatarUrl = body.avatarUrl;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await updateUserProfile(sessionUser.id, updates);
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await setAppSession({
    id: updated.id,
    email: updated.email,
    name: updated.name || sessionUser.name,
    provider: updated.provider || sessionUser.provider,
    kind: "user",
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name || "",
      avatarUrl: updated.avatarUrl || null,
      provider: updated.provider,
    },
  });
}
