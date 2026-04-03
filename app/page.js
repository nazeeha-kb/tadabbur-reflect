"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { SearchIcon } from "@/components/icons";

function IconInfinity({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="15" cy="20" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="25" cy="20" r="6.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function IconDocument({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M10 8h12l6 6v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M22 8v8h6" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12 24h16M12 29h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconPen({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M22 9l9 9-14 14H8v-16L22 9z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M18 13l9 9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconSadness({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M12 28c2 4 6 6 12 6s10-2 12-6M10 18c0-4 4-8 14-8s14 4 14 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M18 34v4M24 36v4M30 34v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconGrief({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 38c-8-6-14-14-14-22a10 10 0 0 1 20 0c0 8-6 16-14 22z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M18 20l4 4M26 20l-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconGratitude({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1.75" />
      <path d="M24 14v-4M24 38v-4M34 24h4M10 24h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconHope({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 40c-6-4-10-10-10-18 0-6 4-10 10-10s10 4 10 10c0 8-4 14-10 18z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M24 22v10M20 26h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconAnxiety({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M8 20c4-2 8 2 12 0s8-2 12 0 8-2 12 0M8 28c4-2 8 2 12 0s8-2 12 0 8-2 12 0M8 36c4-2 8 2 12 0s8-2 12 0 8-2 12 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPeace({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M28 12a8 8 0 1 1-8 16 8 8 0 0 1 8-16z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 18l2 2M32 18l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const EXPLORE_BY_EMOTION = [
  { label: "Sadness", query: "sadness sorrow comfort healing", Icon: IconSadness },
  { label: "Grief", query: "grief loss patience comfort", Icon: IconGrief },
  { label: "Gratitude", query: "gratitude family blessings rizq love", Icon: IconGratitude },
  { label: "Hope", query: "hope mercy ease after hardship", Icon: IconHope },
  { label: "Anxiety", query: "anxiety worry peace of heart trust", Icon: IconAnxiety },
  { label: "Peace", query: "peace tranquility heart contentment", Icon: IconPeace },
];

const HOW_STEPS = [
  {
    step: "STEP 01",
    title: "Type your emotion",
    body: "Share what's on your heart. Whether it's anxiety, gratitude, or seeking hope, we are here to listen.",
    cardBorder: "border-[#EBF5F5]",
    cardBg: "bg-[#EBF5F5]",
    stepColor: "text-[#3d6666]",
    iconColor: "text-[#2D4F4F]",
    Icon: IconInfinity,
  },
  {
    step: "STEP 02",
    title: "Read curated ayahs",
    body: "Discover verses specifically selected to resonate with your current state of being and provide guidance.",
    cardBorder: "border-[#FFF2EB]",
    cardBg: "bg-[#FFF2EB]",
    stepColor: "text-[#b85c3e]",
    iconColor: "text-[#c45c3e]",
    Icon: IconDocument,
  },
  {
    step: "STEP 03",
    title: "Reflect and write",
    body: "Deepen your connection by journaling your personal reflections and finding how the divine word applies to you.",
    cardBorder: "border-[#F2F6F2]",
    cardBg: "bg-[#F2F6F2]",
    stepColor: "text-[#4a6b58]",
    iconColor: "text-[#3d6b58]",
    Icon: IconPen,
  },
];

export default function Home() {
  const [emotion, setEmotion] = useState("");
  const router = useRouter();

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = emotion.trim();
    if (!trimmed) return;
    router.push(`/reflect?q=${encodeURIComponent(trimmed)}`);
  };

  const handleExploreCard = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setEmotion(trimmed);
    router.push(`/reflect?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-16 sm:gap-20 sm:px-6">
        <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden pb-8 sm:pb-10 pt-30 sm:pt-35">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-[8%] h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(31,107,113,0.2),rgba(31,107,113,0)_70%)] blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-[6%] top-8 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,141,98,0.18),rgba(212,141,98,0)_70%)] blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/2 h-52 w-[48rem] max-w-[92vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(31,107,113,0.1),rgba(31,107,113,0)_72%)] blur-xl"
          />
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 text-center sm:px-6">
            <p className="rounded-full bg-[var(--peach-soft)] px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[var(--peach)] uppercase">
              A Sanctuary For The Soul
            </p>
            <h1 className="mt-6 text-5xl leading-none text-[var(--teal)] sm:text-7xl">
              Find solace in <span className="italic text-[var(--peach)]">His words.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-slate-600 sm:text-lg">
              Explore divine guidance tailored to your emotions and life&apos;s present journey.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-10 flex w-full max-w-2xl items-center gap-2 rounded-full border border-[var(--border)] bg-white py-1.5 pl-4 pr-1.5 shadow-md"
            >
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
                className=" h-11 min-w-0 flex-1 rounded-full border-0 px-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                required
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-full bg-[var(--peach)] px-6 text-sm font-semibold text-white transition hover:brightness-105"
              >
                Reflect
              </button>
            </form>
          </div>
        </section>

        <section className="w-full text-left" aria-labelledby="explore-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="explore-heading" className="font-serif text-3xl text-[var(--teal)] sm:text-4xl">
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
                    className="flex flex-col items-center rounded-3xl border border-[var(--border)] bg-[#f4f1ea]/90 px-4 py-6 text-center transition hover:border-[var(--teal)]/35 hover:shadow-md focus-visible:focus-ring"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8e2d6] text-[var(--teal)]">
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className="mt-4 font-serif text-base text-[var(--teal)]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="text-center" aria-labelledby="how-heading">
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
                  className={`flex flex-col items-center rounded-[1.75rem] px-8 py-10 text-center sm:px-9 sm:py-11 ${item.cardBg} border-1 ${item.cardBorder} shadow-md`}
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-slate-900/5">
                    <Icon className={`h-8 w-8 ${item.iconColor}`} />
                  </div>
                  <p className={`text-[11px] font-bold tracking-[0.22em] ${item.stepColor}`}>{item.step}</p>
                  <h3 className="mt-4 font-serif text-xl font-semibold leading-snug text-[#2D4F4F] sm:text-[1.125rem]">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-[17rem] text-sm leading-relaxed text-[#7C8E8E] sm:max-w-none">
                    {item.body}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
