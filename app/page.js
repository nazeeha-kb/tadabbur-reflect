"use client";

import { useEffect, useMemo, useState } from "react";
import { HOME_SEARCH_QUERY_KEY } from "@/lib/reflections/searchQuery";
import { navigateToReflectSearch } from "@/lib/navigation/reflectNav";
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
  ChartBarIcon,
  SunDimIcon,
  WindIcon,
} from "@phosphor-icons/react";
import SiteHeader from "@/components/SiteHeader";
import { SearchIcon } from "@/components/icons";
import TafseerSourceSelect from "@/components/TafseerSourceSelect";
import { useUISettings } from "@/components/UISettingsProvider";
import { useAuth } from "@/components/AuthProvider";
import { searchDebug } from "@/lib/search/searchDebug";

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
    title: "Share what you're feeling",
    body: "Enter a feeling, thought, or topic on your heart, and begin your reflection journey through relevant ayahs.",
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
  {
    step: "STEP 04",
    title: "Track your journey",
    body: "Revisit past reflections, notice emotional patterns, and see how your spiritual journey grows over time.",
    cardBorder: "border-[#A79ACF]",
    cardBg: "bg-[#F4F2FB]",
    stepColor: "text-[#5b4f8a]",
    iconColor: "text-[#6b5ca5]",
    Icon: ChartBarIcon,
  }
];

export default function Home() {
  const [emotion, setEmotion] = useState("");
  const { tafseerSource } = useUISettings();
  const { authReady, isAuthenticated, openSignIn, trackActivity, streak, user, usedFallback } = useAuth();
  const router = useRouter();
  const lastActiveLabel = useMemo(() => streak?.lastActiveDate || "Not yet active", [streak]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(HOME_SEARCH_QUERY_KEY);
      if (stored?.trim()) setEmotion(stored.trim());
    } catch {
      /* ignore */
    }
  }, []);

  function startReflectSearch(trimmed) {
    searchDebug("home.submit", { query: trimmed, authReady, isAuthenticated });
    navigateToReflectSearch(router, { query: trimmed, tafseerSource });
    if (isAuthenticated) {
      void trackActivity();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = emotion.trim();
    if (!trimmed) return;

    if (!authReady) {
      toast.message("Preparing your session…");
    }

    if (authReady && !isAuthenticated) {
      openSignIn();
      toast.message("Please sign in, sign up, or continue as guest to save reflections.");
    }

    startReflectSearch(trimmed);
  }

  function handleExploreCard(query) {
    const trimmed = query.trim();
    if (!trimmed) return;
    setEmotion(trimmed);

    if (authReady && !isAuthenticated) {
      openSignIn();
      toast.message("Please sign in, sign up, or continue as guest to save reflections.");
    }

    startReflectSearch(trimmed);
  }

  return (
    <div className="min-h-screen relative">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-16 sm:gap-20 sm:px-6 relative z-10 overflow-hidden">
        {usedFallback ? (
          <p className={isAuthenticated ? "-mt-10 text-xs text-amber-700" : "mt-6 text-xs text-amber-700"}>
            Quran Foundation User API is currently unavailable. You are using local fallback mode.
          </p>
        ) : null}

        {/* Soft background gradient */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 h-screen w-screen overflow-hidden"
        >
          <div className="absolute -top-40 left-[6%] h-[22rem] w-[22rem] rounded-full bg-[#1f6b71]/12 blur-[100px]" />

          <div className="absolute top-12 right-[4%] h-[20rem] w-[20rem] rounded-full bg-[#d48d62]/10 blur-[100px]" />

          <div className="absolute bottom-0 left-1/2 h-48 w-[min(100%,48rem)] -translate-x-1/2 rounded-full bg-[#1f6b71]/8 blur-[80px]" />
        </div>


        <section className="relative overflow-hidden pb-8 sm:pb-10 pt-30 sm:pt-35">

          <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 text-center sm:px-6">
            <p className="rounded-full bg-(--peach-soft) px-4 py-1 text-xs font-semibold tracking-[0.2em] text-(--peach) uppercase">
              Tadabbur Companion
            </p>
            <h1 className="mt-6 text-5xl leading-none text-(--teal) sm:text-7xl">
              Find solace in <span className="italic text-(--peach)">His words.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-slate-600 sm:text-lg">
              A gentle space to reflect on the Qur’an through your emotions and moments.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-10 flex w-full max-w-4xl flex-col justify-between items-stretch gap-3 rounded-3xl border border-border bg-white p-3 shadow-md sm:flex-row sm:rounded-full sm:py-1.5 sm:pl-4 sm:pr-1.5"
            >
              <div className="flex items-center grow">
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
              <div className="flex sm:w-auto w-full gap-3 items-center">
                <TafseerSourceSelect compact className="w-auto sm:grow-0 grow" />
                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-full bg-(--peach) px-6 text-sm font-semibold text-white transition hover:brightness-105 "
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
          <div className="mt-12 grid gap-6 sm:grid-cols-2 sm:gap-6 lg:mt-14 lg:grid-cols-4 lg:gap-7 items-center justify-center">
            {HOW_STEPS.map((item) => {
              const Icon = item.Icon;
              return (
                <article
                  key={item.step}
                  className={`flex flex-col items-center rounded-[1.75rem] px-8 py-10 text-center sm:px-9 sm:py-11 ${item.cardBg} border ${item.cardBorder} shadow-md h-full`}
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
