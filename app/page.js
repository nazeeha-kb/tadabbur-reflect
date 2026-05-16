"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CloudRainIcon,
  HeartBreakIcon,
  InfinityIcon,
  MoonStarsIcon,
  NoteIcon,
  PenIcon,
  PlantIcon,
  SunDimIcon,
  WindIcon,
} from "@phosphor-icons/react";
import SiteHeader from "@/components/SiteHeader";
import { SearchIcon } from "@/components/icons";
import TafseerSourceSelect from "@/components/TafseerSourceSelect";
import { useUISettings } from "@/components/UISettingsProvider";
import { useAuth } from "@/components/AuthProvider";

const EXPLORE_BY_EMOTION = [
  { label: "Sadness", query: "sadness sorrow comfort healing", Icon: CloudRainIcon, emotionBg: "bg-[#F2F6F2]", emotionText: "text-(--teal)" },
  { label: "Grief", query: "grief loss patience comfort", Icon: HeartBreakIcon, emotionBg: "bg-[#FFF2EB]", emotionText: "text-[#b85c3e]" },
  { label: "Gratitude", query: "gratitude family blessings rizq love", Icon: SunDimIcon, emotionBg: "bg-[#F2F6F2]", emotionText: "text-(--teal)" },
  { label: "Hope", query: "hope mercy ease after hardship", Icon: PlantIcon, emotionBg: "bg-[#FFF2EB]", emotionText: "text-[#b85c3e]" },
  { label: "Anxiety", query: "anxiety worry peace of heart trust", Icon: WindIcon, emotionBg: "bg-[#F2F6F2]", emotionText: "text-(--teal)" },
  { label: "Peace", query: "peace tranquility heart contentment", Icon: MoonStarsIcon, emotionBg: "bg-[#FFF2EB]", emotionText: "text-[#b85c3e]" },
];

const HOW_STEPS = [
  {
    step: "STEP 01",
    title: "Type your emotion",
    body: "Share what's on your heart. Whether it's anxiety, gratitude, or seeking hope, we are here to listen.",
    cardBorder: "border-[#8FC4C4]",
    cardBg: "bg-[#EBF5F5]",
    stepColor: "text-[#3d6666]",
    iconColor: "text-[#2D4F4F]",
    Icon: InfinityIcon,
  },
  {
    step: "STEP 02",
    title: "Read curated ayahs",
    body: "Discover verses specifically selected to resonate with your current state of being and provide guidance.",
    cardBorder: "border-[#B79F92]",
    cardBg: "bg-[#FFF2EB]",
    stepColor: "text-[#b85c3e]",
    iconColor: "text-[#c45c3e]",
    Icon: NoteIcon,
  },
  {
    step: "STEP 03",
    title: "Reflect and write",
    body: "Deepen your connection by journaling your personal reflections and finding how the divine word applies to you.",
    cardBorder: "border-[#9AC09A]",
    cardBg: "bg-[#F2F6F2]",
    stepColor: "text-[#4a6b58]",
    iconColor: "text-[#3d6b58]",
    Icon: PenIcon,
  },
];

export default function Home() {
  const [emotion, setEmotion] = useState("");
  const { tafseerSource } = useUISettings();
  const { isAuthenticated, openSignIn, trackActivity, streak, user, usedFallback } = useAuth();
  const router = useRouter();
  const lastActiveLabel = useMemo(() => streak?.lastActiveDate || "Not yet active", [streak]);

  async function guardAndTrack() {
    if (!isAuthenticated) {
      openSignIn();
      toast.message("Please sign in, sign up, or continue as guest.");
      return false;
    }
    await trackActivity();
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = emotion.trim();
    if (!trimmed) return;
    if (!(await guardAndTrack())) return;
    router.push(`/reflect?q=${encodeURIComponent(trimmed)}&tafseer=${encodeURIComponent(tafseerSource)}`);
  }

  async function handleExploreCard(query) {
    const trimmed = query.trim();
    if (!trimmed) return;
    setEmotion(trimmed);
    if (!(await guardAndTrack())) return;
    router.push(`/reflect?q=${encodeURIComponent(trimmed)}&tafseer=${encodeURIComponent(tafseerSource)}`);
  }

  return (
    <div className="min-h-screen relative">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-16 sm:gap-20 sm:px-6 relative z-10 overflow-hidden">
        {isAuthenticated ? (
          <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--border) bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-col">
              <p className="text-sm text-slate-600">Signed in as {user?.name || user?.email || "User"}</p>
              <p className="text-xs text-slate-500">Last active (UTC): {lastActiveLabel}</p>
            </div>
            <span className="rounded-full bg-(--peach-soft) px-3 py-1 text-sm font-semibold text-(--peach)">🔥 {streak?.currentStreak || 0} days</span>
          </section>
        ) : null}
        {usedFallback ? (
          <p className={isAuthenticated ? "-mt-10 text-xs text-amber-700" : "mt-6 text-xs text-amber-700"}>
            Quran Foundation User API is currently unavailable. You are using local fallback mode.
          </p>
        ) : null}

        <section className="relative overflow-hidden pb-8 sm:pb-10 pt-30 sm:pt-35">
          <div
            aria-hidden
            className="pointer-events-none absolute -z-10 -top-24 left-[8%] h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(31,107,113,0.2),rgba(31,107,113,0)_70%)] blur-2xl md:block hidden"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -z-10 right-[6%] top-8 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,141,98,0.18),rgba(212,141,98,0)_70%)] blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -z-10 bottom-0 left-1/2 h-52 w-3xl max-w-[92vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(31,107,113,0.1),rgba(31,107,113,0)_72%)] blur-xl"
          />

          <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 text-center sm:px-6">
            <p className="rounded-full bg-(--peach-soft) px-4 py-1 text-xs font-semibold tracking-[0.2em] text-(--peach) uppercase">
              A Sanctuary For The Soul
            </p>
            <h1 className="mt-6 text-5xl leading-none text-(--teal) sm:text-7xl">
              Find solace in <span className="italic text-(--peach)">His words.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-slate-600 sm:text-lg">
              Explore divine guidance tailored to your emotions and life&apos;s present journey.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-10 flex w-full max-w-4xl flex-col justify-between items-stretch gap-3 rounded-3xl border border-border bg-white p-3 shadow-md sm:flex-row sm:rounded-full sm:py-1.5 sm:pl-4 sm:pr-1.5"
            >
              <div className="flex items-center">
              <label htmlFor="emotion" className="sr-only">
                Describe how you feel
              </label>
              <span className="shrink-0 text-slate-400" aria-hidden>
                <SearchIcon className="h-5 w-5" />
              </span>
              <input
                id="emotion"
                name="emotion"
                value={emotion}
                onChange={(event) => setEmotion(event.target.value)}
                placeholder="What is on your heart today?"
                className="h-11 min-w-0 flex-1 rounded-full border-0 px-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                required
              />
              </div>
              <div className="flex sm:w-auto w-full gap-3">
              <TafseerSourceSelect compact className="w-auto sm:grow-0 grow"/>
              <button
                type="submit"
                className="h-11 shrink-0 rounded-full bg-(--peach) sm:px-6 px-10 text-sm font-semibold text-white transition hover:brightness-105 "
              >
                Reflect
              </button>
              </div>
            </form>
          </div>
        </section>

        <section className="w-full text-start mt-10" aria-labelledby="explore-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="explore-heading" className="font-serif text-3xl text-(--teal) sm:text-4xl">
              Explore by Emotion
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Choose a state of heart to discover verses tailored for your current journey.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {EXPLORE_BY_EMOTION.map((item) => {
                const Icon = item.Icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleExploreCard(item.query)}
                    className={`flex flex-col items-center rounded-3xl border border-(--border) bg-white px-4 py-6 text-center transition hover:border-(--teal)/35 hover:shadow-md focus-visible:focus-ring ${item.emotionText}`}
                  >
                    <span className={`flex h-14 w-14 items-center justify-center rounded-full ${item.emotionBg}`}>
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className="mt-4 font-serif text-base">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center justify-center text-center mt-10" aria-labelledby="how-heading">
          <h2
            id="how-heading"
            className="font-serif text-3xl font-bold tracking-[0.12em] text-[#2D4F4F] sm:text-[2rem]"
          >
            HOW IT WORKS
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#7C8E8E] sm:text-[0.9375rem]">
            A simple three-step journey to find clarity and peace through divine wisdom.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 sm:gap-6 lg:mt-14 lg:grid-cols-3 lg:gap-7 items-center justify-center">
            {HOW_STEPS.map((item) => {
              const Icon = item.Icon;
              return (
                <article
                  key={item.step}
                  className={`flex flex-col items-center rounded-[1.75rem] px-8 py-10 text-center sm:px-9 sm:py-11 ${item.cardBg} border ${item.cardBorder} shadow-md`}
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-slate-900/5">
                    <Icon className={`h-8 w-8 ${item.iconColor}`} />
                  </div>
                  <p className={`text-[11px] font-bold tracking-[0.22em] ${item.stepColor}`}>{item.step}</p>
                  <h3 className="mt-4 font-serif text-xl font-semibold leading-snug text-[#2D4F4F] sm:text-[1.125rem]">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-68 text-sm leading-relaxed text-[#7C8E8E] sm:max-w-none">
                    {item.body}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
