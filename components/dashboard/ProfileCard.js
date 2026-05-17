"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { loadGuestProfile, saveGuestProfile } from "@/lib/profile/guestProfile";
import { toast } from "sonner";

function ProfileSkeleton() {
  return (
    <section className="surface-card animate-pulse rounded-3xl p-6 sm:p-8" aria-busy="true" aria-label="Loading profile">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="mx-auto h-24 w-24 shrink-0 rounded-full bg-slate-200 sm:mx-0" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="mx-auto h-7 w-40 rounded-lg bg-slate-200 sm:mx-0" />
          <div className="mx-auto h-4 w-56 rounded bg-slate-100 sm:mx-0" />
          <div className="mx-auto h-4 w-72 max-w-full rounded bg-slate-100 sm:mx-0" />
        </div>
      </div>
    </section>
  );
}

export default function ProfileCard() {
  const { authReady, user, isAuthenticated, refreshSession, updateGuestDisplayName } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const isGuest = user?.kind === "guest";

  const loadProfile = useCallback(async () => {
    if (!authReady) return;

    if (!user) {
      setLoading(false);
      return;
    }

    if (isGuest) {
      const profile = loadGuestProfile();
      setNameDraft(profile.name);
      setAvatarUrl(profile.avatarUrl);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user", { credentials: "include", cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setNameDraft(data.user?.name || user.name || "");
        setAvatarUrl(data.user?.avatarUrl || null);
      } else {
        console.warn("[ProfileCard] Profile API returned", res.status);
        setNameDraft(user.name || "");
        setAvatarUrl(null);
      }
    } catch (error) {
      console.warn("[ProfileCard] Failed to load profile:", error);
      setNameDraft(user.name || "");
    } finally {
      setLoading(false);
    }
  }, [authReady, isGuest, user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function persistProfile({ name, avatarUrl: nextAvatar }) {
    if (!user) return;

    setSaving(true);
    try {
      if (isGuest) {
        const profile = {
          name: name ?? nameDraft,
          avatarUrl: nextAvatar !== undefined ? nextAvatar : avatarUrl,
        };
        saveGuestProfile(profile);
        setNameDraft(profile.name);
        if (nextAvatar !== undefined) setAvatarUrl(nextAvatar);
        updateGuestDisplayName?.(profile.name);
        toast.success("Profile updated");
        return;
      }

      const body = {};
      if (name !== undefined) body.name = name;
      if (nextAvatar !== undefined) body.avatarUrl = nextAvatar;

      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setNameDraft(data.user?.name || nameDraft);
      if (nextAvatar !== undefined) setAvatarUrl(data.user?.avatarUrl || null);
      await refreshSession();
      toast.success("Profile updated");
    } catch (error) {
      console.error("[ProfileCard] Save failed:", error);
      toast.error(error.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleNameSave() {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      toast.error("Please enter a name");
      return;
    }
    setEditingName(false);
    await persistProfile({ name: trimmed });
  }

  function handleAvatarPick() {
    fileInputRef.current?.click();
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 512 * 1024) {
      toast.error("Image must be under 512KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) return;
      setAvatarUrl(dataUrl);
      await persistProfile({ avatarUrl: dataUrl });
    };
    reader.onerror = () => toast.error("Could not read image");
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function handleRemoveAvatar() {
    setAvatarUrl(null);
    await persistProfile({ avatarUrl: null });
  }

  if (!authReady || loading) {
    return <ProfileSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <section className="surface-card rounded-3xl p-6 sm:p-8">
        <p className="text-sm text-slate-600">
          Sign in or continue as a guest to personalize your profile and track your reflection journey.
        </p>
      </section>
    );
  }

  const displayInitial = (nameDraft || user?.name || "U").slice(0, 1).toUpperCase();
  const subtitle = isGuest
    ? "Browsing as guest — your reflections stay on this device."
    : "";

  return (
    <section className="surface-card rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="relative mx-auto shrink-0 sm:mx-0">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--border-soft)] bg-[var(--teal-soft)] shadow-sm">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-[var(--teal)]">
                {displayInitial}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAvatarPick}
            disabled={saving}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-[var(--teal-soft)] disabled:opacity-60"
            aria-label="Change profile photo"
          >
            ✎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {isGuest ? (
              <span className="rounded-full bg-[var(--peach-soft)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--peach)]">
                Guest
              </span>
            ) : null}
            {user?.provider === "quran-foundation" ? (
              <span className="rounded-full bg-[var(--teal-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--teal)]">
                Quran Foundation
              </span>
            ) : null}
          </div>

          {editingName ? (
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={80}
                className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-lg font-semibold text-slate-900 focus-visible:focus-ring sm:max-w-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleNameSave();
                  if (e.key === "Escape") {
                    setEditingName(false);
                    void loadProfile();
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleNameSave()}
                  disabled={saving}
                  className="rounded-lg bg-[var(--teal)] px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(false);
                    void loadProfile();
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <h2 className="font-serif text-2xl font-semibold text-[var(--teal)] sm:text-3xl">{nameDraft || "Guest"}</h2>
          )}

          {!isGuest && user?.email ? <p className="mt-1 text-sm text-slate-500">{user.email}</p> : null}

          <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {!editingName ? (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Edit name
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleAvatarPick}
              disabled={saving}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {avatarUrl ? "Change photo" : "Add photo"}
            </button>
            {avatarUrl ? (
              <button
                type="button"
                onClick={() => void handleRemoveAvatar()}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700 disabled:opacity-60"
              >
                Remove photo
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
